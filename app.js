/* =============================================================================
 * Stat Block Tracker — all of the app's behaviour lives in this one file.
 *
 * HOW THE PIECES FIT TOGETHER
 *
 *   index.html  gives us the skeleton: a sidebar <ul> for the list of blocks and
 *               a <form> that edits one block at a time. This file fills both.
 *
 *   state       is ONE plain JavaScript object that holds every stat block.
 *               Every edit changes this object first, then the screen is
 *               redrawn from it. The screen never holds data on its own.
 *
 *   DATA FLOW
 *     state  --JSON.stringify-->  localStorage   (automatic, ~0.3 s after an edit)
 *     state  --Blob / share-->    .json file     (Export button)
 *     .json  --FileReader-->      state          (Import button)
 *
 * The whole file is wrapped in an "IIFE" (immediately-invoked function
 * expression):  (() => { ... })();   This keeps every variable private to the
 * file so nothing leaks onto the global window object.
 * ========================================================================== */
(() => {
    // Strict mode makes JavaScript throw on common mistakes (e.g. assigning to
    // an undeclared variable) instead of silently doing something odd.
    'use strict';

    /* =========================================================================
     * 1. SCHEMA — the "shape" of the data. Change these arrays to change what
     *    fields exist; the form and the list are generated from them.
     * ====================================================================== */

    // The key under which everything is stored in the browser's localStorage.
    // Changing this string would make the app forget existing saves.
    const STORAGE_KEY = 'statblocks.v1';

    // Written into every save file. If you ever change the shape of a block,
    // bump this number and teach migrate() below how to upgrade old files.
    const DATA_VERSION = 1;

    // Mutants & Masterminds 3e abilities, in the order they appear on the sheet.
    const ABILITIES = ['STR', 'STA', 'AGL', 'DEX', 'FGT', 'INT', 'AWE', 'PRE'];

    // The five defenses.
    const DEFENSES = ['Dodge', 'Parry', 'Fortitude', 'Toughness', 'Will'];

    // Allowed ranges for the number fields. JavaScript has no sized integer
    // types (every number is a 64-bit float), so this is a plain range check:
    // the inputs get these as min/max attributes and clampTo() forces stored
    // values into the range. Fields that can go negative run -999..999, the
    // rest 0..999. On touch screens a signed field shows a small +/- button
    // while you are typing in it (see signButton() below), because many phone
    // number keypads have no minus key.
    const RANGES = {
        abilities: { min: -999, max: 999 },
        defenses: { min: -999, max: 999 },
        initiative: { min: -999, max: 999 },
        bruises: { min: 0, max: 999 },
        pl: { min: 0, max: 999 },
        pp: { min: 0, max: 9999 },   // power point fields
    };

    // POWER POINTS (Hero's Handbook: p. 24 starting points, p. 107 abilities,
    // p. 110 defenses, p. 113 skills, p. 130 advantages).
    const PP_PER_PL = 15;                       // starting points = power level x 15
    const PP_ABILITY_COST = 2;                  // per ability rank (a rank below 0 gives points back)
    const DEFENSE_BASE = { Dodge: 'AGL', Parry: 'FGT', Fortitude: 'STA', Toughness: 'STA', Will: 'AWE' };
    const PP_MANUAL = ['other'];   // the one category the user types in
    // (abilities and defenses come from the stat boxes; skills, advantages
    //  and powers are summed from their lists)
    const SKILL_ABILITIES = ['STR', 'STA', 'AGL', 'DEX', 'FGT', 'INT', 'AWE', 'PRE'];
    const OFFENSE_RANGES = ['Close', 'Ranged', 'Perception'];
    const EP_PER_RANK = 5;   // the Equipment advantage: 5 equipment points per rank (p. 130)

    /**
     * A list field from a save: an array is cleaned entry by entry, a string
     * (the old free-text version of the field) is split into entries.
     */
    const listify = (value, fromText, clean) => {
        if (Array.isArray(value)) return value.map(clean);
        if (typeof value === 'string' && value.trim()) return fromText(value).map(clean);
        return [];
    };
    const splitEntries = (text) => text.split(/[\n;]+|,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);   // commas outside brackets
    const textToSkills = (text) => splitEntries(text).map((s) => {
        const m = s.match(/^(.*?)\s+(\d+)\s*(?:\([+\-]?\d+\))?\.?$/);   // "Acrobatics 8 (+12)"
        const name = (m ? m[1] : s).trim();
        const sample = (window.SAMPLES?.skills || []).find((k) => name.toLowerCase().startsWith(k.name.toLowerCase()));
        return { name, ability: sample ? sample.ability : '', ranks: m ? Number(m[2]) : 0 };
    });
    const textToAdvantages = (text) => splitEntries(text).map((s) => {
        const m = s.match(/^(.*?)\s+(\d+)\.?$/);   // "Evasion 2"
        return { name: (m ? m[1] : s).trim(), rank: m ? Number(m[2]) : 1, note: '' };
    });
    const textToOffense = (text) => splitEntries(text).map((s) => {
        const m = s.match(/^(.*?)\s*([+\-]\d+)?\s*(?:\((.*)\))?\.?$/);   // "Unarmed +10 (Close, Damage 2)"
        const inner = (m && m[3] ? m[3] : '').split(',').map((x) => x.trim()).filter(Boolean);
        const range = inner.find((x) => OFFENSE_RANGES.includes(x)) || 'Close';
        return { name: (m ? m[1] : s).trim(), bonus: m && m[2] ? Number(m[2]) : 0, range, effect: inner.filter((x) => x !== range).join(', ') };
    });
    const textToComplications = (text) => text.split(/[\n;]+|\.\s+|,\s*(?=[A-Z])/).map((s) => s.trim().replace(/\.$/, '')).filter(Boolean).map((name) => ({ name, note: '' }));

    /** "+5", "+0", "-3": a bonus always shows its sign. For fields marked data-plus. */
    const withPlus = (v) => (v >= 0 ? '+' : '') + v;

    /** Rounds to a whole number and keeps it within range; junk becomes 0 (or the minimum). */
    const clampTo = (range, value) => {
        const n = Math.round(Number(value));
        if (!Number.isFinite(n)) return Math.max(range.min, Math.min(range.max, 0));
        return Math.max(range.min, Math.min(range.max, n));
    };

    // Every M&M 3e condition, shown as toggle chips, grouped by theme. The
    // order here is also the order of the chips and of the badges in the list.
    // Bruised is not here because it stacks, so it gets a numeric counter
    // instead (see "bruises" below). "Normal" is the absence of conditions.
    const CONDITIONS = [
        // Damage track
        'Dazed', 'Staggered', 'Incapacitated', 'Dying',
        // Actions and mind
        'Stunned', 'Entranced', 'Surprised', 'Asleep', 'Compelled', 'Controlled',
        // Defenses
        'Vulnerable', 'Defenseless',
        // Movement
        'Hindered', 'Immobile', 'Prone', 'Restrained', 'Bound', 'Paralyzed',
        // Checks and traits
        'Impaired', 'Disabled', 'Debilitated', 'Fatigued', 'Exhausted', 'Weakened',
        // Senses and other
        'Unaware', 'Blind', 'Deaf', 'Transformed',
    ];

    /**
     * Which conditions make others redundant. Each key supersedes every
     * condition in its list: while the key is active, those are switched off
     * and their chips are grayed out. Chains are followed automatically, so
     * Incapacitated -> Staggered -> Dazed means Incapacitated also covers Dazed.
     *
     * Sources (M&M 3e Hero's Handbook, Conditions). Basic conditions that
     * are a worse version of another:
     *   - Stunned supersedes Dazed; Entranced is a limited form of Stunned
     *   - Controlled supersedes Compelled
     *   - Disabled supersedes Impaired; Debilitated supersedes Disabled
     *   - Immobile (no movement) supersedes Hindered (half speed)
     *   - Defenseless (defenses 0) supersedes Vulnerable (defenses halved)
     * Combined conditions supersede the basic ones they are made of:
     *   - Staggered   = Dazed + Hindered
     *   - Incapacitated = Defenseless + Stunned + Unaware (and is the step
     *                   past Staggered on the damage track)
     *   - Dying       = Incapacitated + Fortitude checks
     *   - Asleep      = Defenseless + Stunned + Unaware
     *   - Surprised   = Stunned + Vulnerable
     *   - Prone       = Hindered (+ Vulnerable vs close, bonus vs ranged)
     *   - Restrained  = Hindered + Vulnerable
     *   - Bound       = Defenseless + Immobile + Impaired (worse than Restrained)
     *   - Paralyzed   = Defenseless + Immobile + physically Stunned
     *   - Fatigued    = Hindered; Exhausted = Impaired + Hindered, the step past Fatigued
     *   - Blind       = Hindered + Vulnerable (+ visually Unaware)
     * Deaf, Weakened, Transformed and Unaware are not built from others.
     * Blind and Deaf only cover one sense, so they do NOT supersede Unaware.
     * Edit freely if your table rules differently.
     */
    const SUPERSEDES = {
        // basic -> basic
        Stunned: ['Dazed', 'Entranced'],
        Controlled: ['Compelled'],
        Disabled: ['Impaired'],
        Debilitated: ['Disabled'],
        Immobile: ['Hindered'],
        Defenseless: ['Vulnerable'],
        // combined -> components
        Staggered: ['Dazed', 'Hindered'],
        Incapacitated: ['Staggered', 'Stunned', 'Defenseless', 'Unaware'],
        Dying: ['Incapacitated'],
        Asleep: ['Defenseless', 'Stunned', 'Unaware'],
        Surprised: ['Stunned', 'Vulnerable'],
        Prone: ['Hindered'],
        Restrained: ['Hindered', 'Vulnerable'],
        Bound: ['Defenseless', 'Immobile', 'Impaired', 'Restrained'],
        Paralyzed: ['Defenseless', 'Immobile', 'Stunned'],
        Fatigued: ['Hindered'],
        Exhausted: ['Fatigued', 'Impaired'],
        Blind: ['Hindered', 'Vulnerable'],
    };

    /**
     * Given the active conditions, returns a Map of
     *   superseded condition -> label of the active condition that covers it
     * (a plain name like "Stunned", or "Debilitated (FGT)" when the rule came
     * from a picked option) following chains. Example: active ['Incapacitated'] gives
     *   Staggered -> Incapacitated, Dazed -> Incapacitated, Hindered -> ... etc.
     */
    const supersededBy = (active, details = {}) => {
        const dynamic = detailSupersedes(active, details);
        const out = new Map();

        // The "higher" passed down a chain is a label, not just a name: for a
        // rule that came from picked options it reads e.g. "Debilitated (FGT)",
        // so the grayed chip can say which pick is responsible. Nothing picked
        // means all are picked, so the responsible ones are still named.
        const label = (name, opts) => `${name} (${opts.join(', ')})`;

        // Gather every rule of every active condition: [label, lowers, follow].
        // follow = whether to keep walking down SUPERSEDES from those lowers.
        const rules = [];
        for (const c of active) {
            rules.push([c, SUPERSEDES[c] || [], true]);
            // e.g. Debilitated (STA) -> Dying and on down the chain
            for (const [cond, opts] of Object.entries(dynamic.implies[c] || {})) rules.push([label(c, opts), [cond], true]);
            // Sense rules do NOT chain: Unaware covers the "blind" part of Blind
            // but not the Hindered and Vulnerable that come with it.
            for (const [cond, opts] of Object.entries(dynamic.covers[c] || {})) rules.push([label(c, opts), [cond], false]);
        }

        // Pass 1: direct rules. Done first so a condition named directly by a
        // rule gets that rule's label, not one inherited from a longer chain
        // (Dazed <- "Debilitated (FGT)" rather than via Stunned from STR).
        for (const [higher, lowers] of rules) {
            for (const low of lowers) if (!out.has(low)) out.set(low, higher);
        }

        // Pass 2: chains. "higher" stays the same all the way down, so every
        // condition reached is reported as covered by the one that is active.
        const visited = new Set();
        const walk = (higher, lowers) => {
            for (const low of lowers) {
                if (!out.has(low)) out.set(low, higher);
                if (visited.has(low)) continue;        // already walked (also stops loops)
                visited.add(low);
                walk(higher, SUPERSEDES[low] || []);
            }
        };
        for (const [higher, lowers, follow] of rules) {
            if (follow) for (const low of lowers) walk(higher, SUPERSEDES[low] || []);
        }
        return out;
    };

    /**
     * The reverse of coveredBy, worked out from the current details: an
     * active Unaware whose picked senses include Visual supersedes Blind, and
     * one with Auditory picked supersedes Deaf. No senses picked means all
     * senses, so plain Unaware supersedes both. Returns { Unaware: ['Blind'] }
     * style entries that supersededBy() merges with the fixed SUPERSEDES table.
     * (Whichever side was active first wins: Blind grays out the Visual toggle,
     * and a Visual-Unaware grays out the Blind chip.)
     */
    const detailSupersedes = (active, details) => {
        // covers:  partial overlap, does not chain (Unaware covers Blind's
        //          blindness but not its Hindered/Vulnerable)
        // implies: the condition is genuinely in effect, so it chains like
        //          the fixed table (Debilitated STA -> Incapacitated -> ...)
        // Shape: out.implies[name][cond] = [options that caused it], e.g.
        //   { Debilitated: { Immobile: ['STR', 'AGL'], Dying: ['STA'] } }
        // so the chip note can say exactly which pick is responsible.
        const out = { covers: {}, implies: {} };
        const add = (kind, name, cond, opt) => {
            const byName = out[kind][name] = out[kind][name] || {};
            (byName[cond] = byName[cond] || []).push(opt);
        };
        for (const [name, spec] of Object.entries(CONDITION_DETAILS)) {
            if (!active.includes(name) || !(spec.coveredBy || spec.implies)) continue;
            const picked = details[name] ? details[name].split(', ') : spec.options;   // none = all
            if (spec.coveredBy) {
                for (const [opt, cond] of Object.entries(spec.coveredBy)) {
                    if (picked.includes(opt)) add('covers', name, cond, opt);
                }
            }
            if (spec.implies) {
                for (const opt of picked) for (const cond of spec.implies[opt] || []) add('implies', name, cond, opt);
            }
        }
        return out;
    };

    /**
     * Cleans a list of conditions: keeps only known names, drops any that are
     * superseded by another active one, and puts them in CONDITIONS order so
     * the badges in the list always appear in a predictable sequence.
     */
    const normalizeConditions = (list, details = {}) => {
        const covered = supersededBy(list, details);
        return CONDITIONS.filter((c) => list.includes(c) && !covered.has(c));
    };

    /**
     * Re-applies every supersede rule to a block after something changed:
     * drops covered conditions, tidies details, redraws the chips. Used when a
     * chip or a sense/ability toggle is clicked (not while typing in a text
     * detail, because redrawing would steal the keyboard focus).
     */
    const reconcileConditions = (block) => {
        block.conditions = normalizeConditions(block.conditions, block.conditionDetails);
        pruneConditionDetails(block);
        syncConditionChips(block);
    };

    /**
     * Conditions that need a specifier. While one of these is active, a row
     * appears under the chips asking for the detail. Two kinds:
     *   options     -> a row of small toggles (Unaware: which senses)
     *   placeholder -> a short free-text field (Impaired: which traits)
     *   coveredBy   -> (options only) option -> condition that already includes
     *                  it. While that condition is active the option is unticked
     *                  and grayed out, just like a superseded chip. Blind is
     *                  visually Unaware and Deaf is auditorily Unaware.
     * The answer is stored as a string in block.conditionDetails[name] and
     * shown in brackets after the name in the list, e.g. "Unaware (Visual)".
     */
    const CONDITION_DETAILS = {
        Unaware: {
            label: 'Unaware of',
            options: ['Visual', 'Auditory', 'Olfactory', 'Tactile', 'Mental', 'Radio'],
            coveredBy: { Visual: 'Blind', Auditory: 'Deaf' },
            hint: 'none picked = all senses',
        },
        Impaired:    { label: 'Impaired',    placeholder: 'which checks or traits, e.g. Strength, Perception' },
        Disabled:    { label: 'Disabled',    placeholder: 'which checks or traits, e.g. Strength, Perception' },
        // Debilitated applies to whole abilities rather than specific checks,
        // so it offers the eight abilities as toggles instead of free text.
        // "implies" lists the conditions a debilitated ability puts you in,
        // per the Hero's Handbook "Debilitated Abilities" box. Those get
        // superseded and grayed out, chains included, while that ability is
        // picked. No abilities picked means all of them.
        Debilitated: {
            label: 'Debilitated',
            options: [...ABILITIES],
            hint: 'none picked = all abilities',
            implies: {
                // STR, AGL or DEX: "the hero collapses: defenseless, immobilized,
                // and stunned (although still conscious and aware)"
                STR: ['Defenseless', 'Immobile', 'Stunned'],
                AGL: ['Defenseless', 'Immobile', 'Stunned'],
                DEX: ['Defenseless', 'Immobile', 'Stunned'],
                // STA: "the hero is dying" (plus -5 on Fortitude checks vs death)
                STA: ['Dying'],
                // FGT: "dazed and defenseless, and cannot make close attacks"
                FGT: ['Dazed', 'Defenseless'],
                // INT, AWE or PRE: "the hero is unaware"
                INT: ['Unaware'],
                AWE: ['Unaware'],
                PRE: ['Unaware'],
            },
        },
        Weakened:    { label: 'Weakened',    placeholder: 'trait and ranks lost, e.g. Strength 3' },
        Transformed: { label: 'Transformed', placeholder: 'into what, e.g. a stone statue' },
    };

    /** True when this option of a toggle-type detail is covered by an active condition. */
    const optionCoveredBy = (block, spec, opt) => {
        const by = spec.coveredBy && spec.coveredBy[opt];
        return by && block.conditions.includes(by) ? by : null;
    };

    /**
     * Tidies block.conditionDetails: drops details for conditions that are no
     * longer active (or unknown), and unticks any toggle option that an active
     * condition covers (e.g. removes "Visual" from Unaware while Blind is on).
     */
    const pruneConditionDetails = (block) => {
        for (const name of Object.keys(block.conditionDetails)) {
            const spec = CONDITION_DETAILS[name];
            if (!block.conditions.includes(name) || !spec) { delete block.conditionDetails[name]; continue; }
            if (spec.options) {
                const kept = block.conditionDetails[name].split(', ').filter((o) => spec.options.includes(o) && !optionCoveredBy(block, spec, o));
                if (kept.length) block.conditionDetails[name] = kept.join(', ');
                else delete block.conditionDetails[name];
            }
        }
    };

    /**
     * Returns a new unique id (a UUID like "9d7d3e56-666c-4cef-a154-407996578592").
     *
     * Why not just use crypto.randomUUID()? Browsers only expose it on "secure"
     * pages (https:// or localhost). Opening the app from a phone over plain
     * http://192.168.x.x is NOT secure, so the function is missing there and the
     * app would crash. We use it when present and otherwise build a UUID v4 by
     * hand from random bytes.
     */
    const uid = () => {
        if (crypto.randomUUID) return crypto.randomUUID();

        const bytes = new Uint8Array(16);                       // 16 random bytes
        if (crypto.getRandomValues) crypto.getRandomValues(bytes);
        else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);

        bytes[6] = (bytes[6] & 0x0f) | 0x40;                    // mark as UUID version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80;                    // mark the standard "variant"

        // Turn the bytes into 32 hex characters, then insert the dashes.
        const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    };

    /**
     * A brand-new, empty stat block. This is ALSO the list of every field a
     * block can have, which migrate() relies on to fill gaps in old saves.
     */
    const blankBlock = () => ({
        id: uid(),                 // unique, never changes, used to find the block
        name: '',
        pl: 10,                    // Power Level
        // { STR: 0, STA: 0, ... } built from the ABILITIES array
        abilities: Object.fromEntries(ABILITIES.map((a) => [a, 0])),
        // { Dodge: 0, Parry: 0, ... } built from the DEFENSES array
        defenses: Object.fromEntries(DEFENSES.map((d) => [d, 0])),
        initiative: 0,
        conditions: [],            // e.g. ['Dazed', 'Prone'] — only names that are ON
        conditionDetails: {},      // e.g. { Unaware: 'Visual, Tactile', Impaired: 'Strength' }
        bruises: 0,                // how many Bruised results the character has taken
        // Power points. total: null means "use PL x 15"; the four manual
        // categories are typed in, abilities and defenses are computed.
        pp: { earned: 0, other: 0 },   // earned: points awarded on top of PL x 15; other: spent on anything not listed
        powers: [],                // { name, rank, desc, cost, perRank } — perRank set from a book sample keeps cost = rank x perRank
        // Lists, one object per entry (see the row builders in section 5b):
        skills: [],                // { name, ability: 'AGL' | '', ranks }
        advantages: [],            // { name, rank, note }
        offense: [],               // { name, bonus, range: 'Close' | 'Ranged' | 'Perception', effect }
        complications: [],         // { name, note }
        equipment: [],             // { name, cost, note } — only shown while an Equipment advantage is in the list
        notes: '',                 // free text
        updated: Date.now(),       // timestamp of the last edit; used when merging imports
    });

    /* =========================================================================
     * 2. STATE — the single source of truth, plus saving and loading it.
     * ====================================================================== */

    // Everything the app knows. Saved to localStorage as-is.
    let state = { version: DATA_VERSION, blocks: [] };

    // The id of the block currently open in the editor, or null for "none".
    let selectedId = null;

    // Handle for the pending delayed save (see scheduleSave).
    let saveTimer = null;

    /** Read the saved state from localStorage, if there is one. */
    const load = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);   // a JSON string or null
            if (raw) state = migrate(JSON.parse(raw));
        } catch (err) {
            // Corrupt data or storage blocked (private mode etc.) — start empty.
            console.warn('Could not read saved data, starting fresh.', err);
        }
    };

    /** Write the whole state to localStorage right now. */
    const persist = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            setStatus('Saved');
        } catch (err) {
            console.error(err);
            setStatus('Could not save (storage full or blocked)');
        }
    };

    /**
     * "Debounced" save: instead of writing on every keystroke, wait until the
     * user has paused for 300 ms. Each new call cancels the previous timer.
     */
    const scheduleSave = () => {
        clearTimeout(saveTimer);
        setStatus('Saving…');
        saveTimer = setTimeout(persist, 300);
    };

    /**
     * Takes data from ANY source (old saves, hand-edited files, a bare array)
     * and returns it in the current shape. Each block is spread over a
     * blankBlock(), so any field missing from the file gets its default value.
     * If you bump DATA_VERSION, add your upgrade steps here.
     */
    const migrate = (data) => {
        // Accept a bare array of blocks as well as the normal { version, blocks } wrapper.
        const src = Array.isArray(data) ? { version: 0, blocks: data } : (data || {});
        const blocks = Array.isArray(src.blocks) ? src.blocks : [];
        return {
            version: DATA_VERSION,
            // { ...a, ...b } = copy a, then overwrite with whatever b has.
            blocks: blocks.map((b) => ({
                ...blankBlock(),
                ...b,
                id: b.id || uid(),
                // Older saves or hand-edited files might list a condition
                // together with one that supersedes it; tidy that up.
                conditions: Array.isArray(b.conditions) ? b.conditions : [],
                conditionDetails: (b.conditionDetails && typeof b.conditionDetails === 'object') ? { ...b.conditionDetails } : {},
            })).map((b) => {
                b.conditions = normalizeConditions(b.conditions, b.conditionDetails);
                pruneConditionDetails(b);
                // Keep numbers from hand-edited files inside their byte ranges.
                for (const k of ABILITIES) b.abilities[k] = clampTo(RANGES.abilities, b.abilities[k]);
                for (const k of DEFENSES) b.defenses[k] = clampTo(RANGES.defenses, b.defenses[k]);
                b.bruises = clampTo(RANGES.bruises, b.bruises);
                b.initiative = clampTo(RANGES.initiative, b.initiative);
                b.pl = clampTo(RANGES.pl, b.pl);
                // Powers carry only a name and a description (an older save may
                // have stored a box height; it is dropped).
                b.powers = (Array.isArray(b.powers) ? b.powers : []).map((p) => ({
                    name: String(p?.name ?? ''), desc: String(p?.desc ?? ''), cost: clampTo(RANGES.pp, p?.cost),
                    rank: clampTo(RANGES.pp, p?.rank), perRank: Number.isFinite(Number(p?.perRank)) && p?.perRank != null ? Number(p.perRank) : null,
                }));
                // The four list sections. Saves from before they were lists hold
                // free text, which is split into entries as best we can.
                b.skills = listify(b.skills, textToSkills, (e) => ({ name: String(e?.name ?? ''), ability: SKILL_ABILITIES.includes(e?.ability) ? e.ability : '', ranks: clampTo(RANGES.pp, e?.ranks) }));
                b.advantages = listify(b.advantages, textToAdvantages, (e) => ({ name: String(e?.name ?? ''), rank: clampTo(RANGES.pp, e?.rank ?? 1), note: String(e?.note ?? '') }));
                b.offense = listify(b.offense, textToOffense, (e) => ({ name: String(e?.name ?? ''), bonus: clampTo(RANGES.abilities, e?.bonus), range: OFFENSE_RANGES.includes(e?.range) ? e.range : 'Close', effect: String(e?.effect ?? '') }));
                b.complications = listify(b.complications, textToComplications, (e) => ({ name: String(e?.name ?? ''), note: String(e?.note ?? '') }));
                b.equipment = listify(b.equipment, () => [], (e) => ({ name: String(e?.name ?? ''), cost: clampTo(RANGES.pp, e?.cost), note: String(e?.note ?? '') }));
                // Power points: fill in anything an older save lacks.
                const pp = (b.pp && typeof b.pp === 'object') ? b.pp : {};
                // Earlier saves had an editable "total" instead of "earned": turn an
                // override above the base into earned points so nothing is lost.
                const base = clampTo(RANGES.pl, b.pl) * PP_PER_PL;
                const legacyEarned = (pp.total != null && pp.total !== '' && Number(pp.total) > base) ? Number(pp.total) - base : 0;
                b.pp = { earned: clampTo(RANGES.pp, pp.earned ?? legacyEarned) };
                for (const k of PP_MANUAL) b.pp[k] = clampTo(RANGES.pp, pp[k]);
                // Saves from before powers, skills and advantages were itemised
                // kept lump sums under pp.powers / pp.skills / pp.advantages.
                // Where the new list gives nothing, move the lump to Other so
                // the spent total does not silently drop.
                if (pp.powers > 0 && !b.powers.some((p) => p.cost > 0)) b.pp.other = clampTo(RANGES.pp, b.pp.other + Number(pp.powers));
                if (pp.skills > 0 && !b.skills.some((s) => s.ranks > 0)) b.pp.other = clampTo(RANGES.pp, b.pp.other + Number(pp.skills));
                if (pp.advantages > 0 && !b.advantages.length) b.pp.other = clampTo(RANGES.pp, b.pp.other + Number(pp.advantages));
                return b;
            }),
        };
    };

    /* =========================================================================
     * 3. DOM HELPERS — tiny utilities so the rest of the file stays readable.
     * ====================================================================== */

    /** $('#id') is shorthand for document.querySelector('#id'). */
    const $ = (sel, root = document) => root.querySelector(sel);

    /**
     * el(tag, attributes, ...children) builds an element in one call, e.g.
     *   el('button', { class: 'btn', onclick: fn, text: 'Go' })
     * Special attribute names:
     *   class  -> className
     *   text   -> textContent
     *   onxxx  -> addEventListener('xxx', ...)
     * Everything else becomes a normal HTML attribute. Children can be
     * elements or strings.
     */
    const el = (tag, attrs = {}, ...children) => {
        const node = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (k === 'class') node.className = v;
            else if (k === 'text') node.textContent = v;
            else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
            else if (v !== false && v != null) node.setAttribute(k, v === true ? '' : v);
        }
        node.append(...children);
        return node;
    };

    // Grab the fixed parts of index.html once so we don't query them repeatedly.
    const layout = $('.layout');          // <main>; gets class "editing" when a block is open
    const editor = $('#editor');          // the whole right-hand editor panel
    const form = $('#block-form');        // the <form> inside it
    const listEl = $('#block-list');      // <ul> in the sidebar
    const emptyHint = $('#empty-hint');   // "No stat blocks yet" message
    const searchEl = $('#search');        // search box above the list
    const statusEl = $('#save-status');   // "Saved" / "Saving…" text in the footer

    /** Show a short message in the editor footer. */
    const setStatus = (msg) => { statusEl.textContent = msg; };

    /** The block object currently open in the editor, or null. */
    const selected = () => state.blocks.find((b) => b.id === selectedId) || null;

    /* =========================================================================
     * 4. BUILD THE FORM — the parts of the form that come from the schema
     *    arrays are generated here, once, on startup.
     * ====================================================================== */

    /**
     * Fills a container with one labelled number input per key. Each input
     * carries data-group="abilities"/"defenses" and data-key="STR"/"Dodge"/...
     * so the input handler later knows which part of the block to update.
     */
    const buildStatGrid = (container, keys, prefix) => {
        const { min, max } = RANGES[prefix];
        container.replaceChildren(...keys.map((k) => {
            const input = el('input', { type: 'number', step: '1', min, max, 'data-group': prefix, 'data-key': k, value: '0' });
            // inputmode="numeric" asks phones for a plain digit keypad, which is
            // fine for fields that never go negative.
            if (min >= 0) input.setAttribute('inputmode', 'numeric');
            return el('label', { class: 'stat' },
                el('span', { text: k }),
                input,
                ...(min < 0 ? [signButton(input)] : []),   // only fields that can go negative
            );
        }));
    };

    /**
     * A small +/- button beside a signed number field. It only appears while
     * that field has the cursor, and only on touch screens (see .sign in
     * style.css). One tap flips the sign of whatever is in the field: type 5,
     * tap, get -5. On 0 there is nothing to flip, so nothing happens.
     */
    const signButton = (input) => el('button', {
        type: 'button', class: 'btn sign', text: '\u00b1', title: 'Flip the sign',
        'aria-label': 'Flip the sign of ' + (input.name || input.dataset.key),
        // Don't take focus from the field on tap: losing focus would hide this
        // very button and drop the keyboard. The click still fires. That same
        // preventDefault stops the browser's own :active state, so the pressed
        // look is a class we add and remove ourselves.
        onpointerdown: (e) => { e.preventDefault(); e.currentTarget.classList.add('pressed'); },
        onpointerup: (e) => e.currentTarget.classList.remove('pressed'),
        onpointercancel: (e) => e.currentTarget.classList.remove('pressed'),
        onpointerleave: (e) => e.currentTarget.classList.remove('pressed'),
        onclick: () => {
            const v = Number(input.value) || 0;
            if (v === 0) return;
            input.value = input.dataset.plus ? withPlus(-v) : String(-v);
            input.dispatchEvent(new Event('input', { bubbles: true }));   // store it the normal way
        },
    });

    /**
     * One "chip" per condition. A chip is a <label> wrapping a hidden checkbox,
     * so tapping the label toggles the checkbox and we style the label instead.
     */
    const buildConditions = (container) => {
        container.replaceChildren(...CONDITIONS.map((c) =>
            el('label', { class: 'chip' },
                el('input', { type: 'checkbox', 'data-condition': c }),
                document.createTextNode(c),
                // Filled in with e.g. "← Stunned" while this chip is superseded.
                el('span', { class: 'chip-by' }),
            )
        ));
    };

    /**
     * Makes every condition chip match the block: ticked or not, and grayed
     * out (with the checkbox disabled, so taps do nothing) when another
     * active condition supersedes it. Used both when a block is opened and
     * after every chip toggle.
     */
    const syncConditionChips = (block) => {
        const covered = supersededBy(block.conditions, block.conditionDetails);
        for (const cb of form.querySelectorAll('[data-condition]')) {
            const name = cb.dataset.condition;
            const by = covered.get(name);          // undefined when not superseded
            const chip = cb.parentElement;
            cb.checked = block.conditions.includes(name);
            cb.disabled = Boolean(by);
            chip.classList.toggle('on', cb.checked);
            chip.classList.toggle('superseded', Boolean(by));
            chip.title = by ? `Covered by ${by}` : '';
            chip.querySelector('.chip-by').textContent = by ? `← ${by}` : '';
        }
        renderConditionDetails(block);
    };

    /** Store (or clear) one condition's detail text and refresh the list badges. */
    const setConditionDetail = (block, name, value) => {
        if (value) block.conditionDetails[name] = value;
        else delete block.conditionDetails[name];
        touch(block);
        renderList();
    };

    /**
     * Rebuilds the rows under the chips: one per active condition that is in
     * CONDITION_DETAILS. The container is hidden when there are none. Like
     * the power rows, these inputs are created on the fly so they get their
     * own listeners here; the shared form handler ignores them because they
     * have no name attribute.
     */
    const renderConditionDetails = (block) => {
        const box = $('#condition-details');
        const rows = block.conditions.filter((c) => CONDITION_DETAILS[c]).map((c) => {
            const spec = CONDITION_DETAILS[c];
            const current = block.conditionDetails[c] || '';
            const row = el('div', { class: 'detail-row' }, el('span', { class: 'detail-label', text: `${spec.label}:` }));

            if (spec.options) {
                // Multi-select toggles. Stored as "Visual, Tactile" in the
                // order of spec.options so the text is always predictable.
                const chosen = new Set(current ? current.split(', ') : []);
                for (const opt of spec.options) {
                    const by = optionCoveredBy(block, spec, opt);   // e.g. 'Blind', or null
                    const cb = el('input', {
                        type: 'checkbox', checked: chosen.has(opt), disabled: Boolean(by),
                        onchange: (e) => {
                            e.target.checked ? chosen.add(opt) : chosen.delete(opt);
                            e.target.parentElement.classList.toggle('on', e.target.checked);
                            setConditionDetail(block, c, spec.options.filter((o) => chosen.has(o)).join(', '));
                            reconcileConditions(block);   // e.g. picking Auditory now grays out Deaf
                        },
                    });
                    row.append(el('label', {
                        class: 'chip mini' + (chosen.has(opt) ? ' on' : '') + (by ? ' superseded' : ''),
                        title: by ? `Covered by ${by}` : false,
                    }, cb, document.createTextNode(opt), el('span', { class: 'chip-by', text: by ? `← ${by}` : '' })));
                }
                if (spec.hint) row.append(el('span', { class: 'hint', text: spec.hint }));
            } else {
                row.append(el('input', {
                    type: 'text', class: 'detail-text', value: current, placeholder: spec.placeholder,
                    oninput: (e) => setConditionDetail(block, c, e.target.value.trim()),
                }));
            }
            return row;
        });
        box.replaceChildren(...rows);
        box.hidden = rows.length === 0;
    };

    buildStatGrid($('#abilities'), ABILITIES, 'abilities');
    buildStatGrid($('#defenses'), DEFENSES, 'defenses');
    buildConditions($('#conditions'));

    /* =========================================================================
     * 5. RENDERING — draw the screen from `state`. These functions are called
     *    after every change; they throw away the old elements and rebuild.
     *    That is simple and fast enough for a list of a few hundred items.
     * ====================================================================== */

    /**
     * Works out the power point picture for a block:
     *   abilities = sum of ability ranks x 2 (negative ranks give points back)
     *   defenses  = each defense's ranks above its base ability, 1 point each
     *               (a defense below base is just 0, not a refund)
     *   the four manual categories as typed
     *   total     = the override if set, otherwise PL x 15
     */
    const computePP = (block) => {
        const abilities = ABILITIES.reduce((n, k) => n + (block.abilities[k] || 0), 0) * PP_ABILITY_COST;
        const defenses = DEFENSES.reduce((n, d) => n + Math.max(0, (block.defenses[d] || 0) - (block.abilities[DEFENSE_BASE[d]] || 0)), 0);
        const powers = block.powers.reduce((n, p) => n + (p.cost || 0), 0);   // sum of the per-power cost fields
        const skills = Math.ceil(block.skills.reduce((n, s) => n + (s.ranks || 0), 0) / 2);   // 1 point per 2 ranks, over all skills
        const advantages = block.advantages.reduce((n, a) => n + (a.rank || 0), 0);           // 1 point per rank
        const manual = Object.fromEntries(PP_MANUAL.map((k) => [k, block.pp[k] || 0]));
        const spent = abilities + defenses + powers + skills + advantages + PP_MANUAL.reduce((n, k) => n + manual[k], 0);
        const base = block.pl * PP_PER_PL;          // what the power level grants
        const earned = block.pp.earned || 0;        // awarded by the GM on top (p. 262)
        const total = base + earned;
        return { abilities, defenses, powers, skills, advantages, ...manual, spent, base, earned, total, left: total - spent };
    };

    /** Fills the Power points section from computePP(). */
    const renderPP = (block) => {
        const pp = computePP(block);
        $('#pp-abilities').textContent = pp.abilities;
        $('#pp-defenses').textContent = pp.defenses;
        $('#pp-powers').textContent = pp.powers;
        $('#pp-skills').textContent = pp.skills;
        $('#pp-advantages').textContent = pp.advantages;
        $('#pp-spent').textContent = pp.spent;
        const left = $('#pp-left');
        left.textContent = pp.left;
        left.classList.toggle('over', pp.left < 0);   // red when overspent
        $('#pp-base').textContent = pp.base;
        $('#pp-base-pl').textContent = block.pl;
        $('#pp-total').textContent = pp.total;
        const earnedInput = $('#f-pp-earned');
        if (document.activeElement !== earnedInput) earnedInput.value = pp.earned;
        for (const k of PP_MANUAL) {
            const input = $(`[data-pp="${k}"]`);
            if (document.activeElement !== input) input.value = block.pp[k] || 0;
        }
    };

    /** Rebuild the sidebar list, applying the search filter and sorting by name. */
    const renderList = () => {
        const q = searchEl.value.trim().toLowerCase();
        const blocks = state.blocks
            .filter((b) => !q || b.name.toLowerCase().includes(q))
            .sort((a, b) => a.name.localeCompare(b.name));

        listEl.replaceChildren(...blocks.map((b) => {
            // Small badges under the name: bruise count plus every active condition.
            // They wrap onto extra lines in the CSS, so there is no need to cap them.
            const badges = el('div', { class: 'badges' });
            if (b.bruises > 0) badges.append(el('span', { class: 'badge', text: `Bruised ×${b.bruises}` }));
            for (const c of b.conditions) {
                let detail = b.conditionDetails[c];
                // For toggle-type details (Unaware), picking every option means
                // the same as picking none, so show the plain name in both cases.
                const spec = CONDITION_DETAILS[c];
                if (spec && spec.options && detail === spec.options.join(', ')) detail = '';
                badges.append(el('span', { class: 'badge', text: detail ? `${c} (${detail})` : c }));
            }

            return el('li', {
                // "no-badges" gives an entry with nothing under the name extra
                // top/bottom padding so it doesn't look cramped next to the others.
                class: 'block-item'
                    + (b.id === selectedId ? ' active' : '')
                    + (badges.childElementCount === 0 ? ' no-badges' : ''),
                onclick: () => select(b.id),
            },
                el('div', {},
                    el('div', { class: 'name', text: b.name || '(unnamed)' }),
                    // Just the PL; the only power point fact worth seeing from
                    // the list is an overspend, shown as a small red badge.
                    el('div', { class: 'meta' },
                        document.createTextNode(`PL ${b.pl}`),
                        ...(computePP(b).left < 0 ? [el('span', { class: 'badge over', text: '!', title: `${-computePP(b).left} power points over` })] : []),
                    ),
                ),
                badges,
            );
        }));

        // Only show the "nothing here yet" hint when the list is truly empty.
        emptyHint.hidden = state.blocks.length > 0;
    };

    /**
     * Rebuild the Powers section for one block. Each row has a name input, a
     * description textarea and a remove button. Because these rows are created
     * dynamically, they get their own listeners here instead of going through
     * the shared form handler in section 6.
     */
    const renderPowers = (block) => {
        $('#powers').replaceChildren(...block.powers.map((p) => powerRow(block, p)));
        fitAllTextareas();   // sizes are only measurable once the rows are in the page
    };

    /**
     * Makes a description box exactly as tall as its text. Setting the height
     * to "auto" first lets it shrink when text is deleted; scrollHeight is then
     * the height the content really needs. Nothing is stored: the right height
     * depends on the screen width and font, so it is worked out fresh each
     * time instead of being saved with the block.
     */
    const fitTextarea = (ta) => {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
    };
    /** Every text box in the editor: skills, notes and so on, plus the power descriptions. */
    const fitAllTextareas = () => { for (const ta of form.querySelectorAll('textarea')) fitTextarea(ta); };
    // Text re-wraps when the window changes width, so refit then too.
    window.addEventListener('resize', fitAllTextareas);
    // Any typing in any text box: refit that box. (Power descriptions do this
    // in their own handler as well; doing it twice is harmless.)
    form.addEventListener('input', (e) => { if (e.target.tagName === 'TEXTAREA') fitTextarea(e.target); });

    /**
     * One power row. Rows are added and removed individually (see the add
     * button and the remove handler) rather than redrawing the whole list.
     */
    const powerRow = (block, p) => {
        const desc = el('textarea', {
            class: 'power-desc', rows: '2', placeholder: 'Effects, extras, flaws, descriptors\u2026',
            oninput: (e) => { p.desc = e.target.value; touch(block); fitTextarea(e.target); },
        }, p.desc || '');

        // The cost field feeds the Powers line of the Power points section.
        // For a power taken from the book with a plain per-rank cost, the
        // cost follows the rank automatically until you edit it by hand.
        const cost = numberField(RANGES.pp, p.cost, (v) => { p.cost = v; p.perRank = null; touch(block); renderPP(block); renderList(); });
        const rank = numberField(RANGES.pp, p.rank, (v) => {
            p.rank = v;
            if (p.perRank != null) { p.cost = clampTo(RANGES.pp, v * p.perRank); cost.value = p.cost; }
            touch(block); renderPP(block); renderList(); renderEquipment(block);
        });
        const row = el('div', { class: 'power-row' },
            el('input', {
                class: 'power-name', type: 'text', placeholder: 'Power name (e.g. Flight)', value: p.name,
                oninput: (e) => { p.name = e.target.value; touch(block); },
            }),
            el('label', { class: 'power-rank', title: 'Rank' }, document.createTextNode('Rank'), rank),
            el('label', { class: 'power-cost', title: 'Power points spent on this power' }, document.createTextNode('PP'), cost),
            el('button', {
                class: 'btn small icon power-remove', type: 'button', title: 'Remove power', text: '\u2715',
                // Find the power by identity (not a stored index, which would go
                // stale once another row is removed), drop it, remove just this row.
                onclick: () => {
                    const i = block.powers.indexOf(p);
                    if (i >= 0) block.powers.splice(i, 1);
                    touch(block);
                    row.remove();
                    renderPP(block);   // its cost no longer counts
                    renderList();
                },
            }),
            desc,
        );
        return row;
    };

    /** Copy the selected block's values into the form, or hide the form if none. */
    const renderEditor = () => {
        const block = selected();
        if (!block) {
            editor.hidden = true;
            layout.classList.remove('editing');   // on phones this brings the list back
            return;
        }
        editor.hidden = false;
        layout.classList.add('editing');          // on phones this hides the list

        // form.elements.NAME finds the input with name="NAME".
        form.elements.name.value = block.name;
        form.elements.pl.value = block.pl;
        form.elements.initiative.value = withPlus(block.initiative);
        form.elements.bruises.value = block.bruises;

        // Ability and defense inputs: look up block.abilities.STR etc.
        for (const input of form.querySelectorAll('[data-group]')) {
            input.value = block[input.dataset.group][input.dataset.key] ?? 0;
        }

        // Condition chips: ticked / grayed out according to the block.
        syncConditionChips(block);

        // Plain text areas.
        form.elements.notes.value = block.notes;
        renderLists(block);
        fitAllTextareas();   // the editor is visible by now, so heights can be measured

        renderPowers(block);
        renderPP(block);
    };

    /** Redraw everything. */
    const render = () => { renderList(); renderEditor(); };

    /* =========================================================================
     * 6. ACTIONS — things the user can do. Each one changes `state`, asks for
     *    a save, and redraws whatever needs redrawing.
     * ====================================================================== */

    /** Mark a block as edited and queue a save. Call after any change to it. */
    const touch = (block) => {
        block.updated = Date.now();
        scheduleSave();
    };

    /** Open a block in the editor (or close the editor with null). */
    const select = (id) => {
        selectedId = id;
        render();
        // On a phone the editor replaces the list, so jump to the top of it.
        if (id && window.innerWidth < 820) window.scrollTo({ top: 0 });
    };

    const createBlock = () => {
        const b = blankBlock();
        state.blocks.push(b);
        scheduleSave();
        select(b.id);
        form.elements.name.focus();   // cursor straight into the name field
    };

    const duplicateBlock = () => {
        const src = selected();
        if (!src) return;
        // structuredClone makes a deep copy, so editing the copy's powers array
        // doesn't also change the original's.
        const copy = structuredClone(src);
        copy.id = uid();
        copy.name = `${src.name} (copy)`;
        copy.updated = Date.now();
        state.blocks.push(copy);
        scheduleSave();
        select(copy.id);
    };

    const deleteBlock = () => {
        const b = selected();
        if (!b) return;
        if (!confirm(`Delete "${b.name || '(unnamed)'}"? This cannot be undone.`)) return;
        state.blocks = state.blocks.filter((x) => x.id !== b.id);   // keep every OTHER block
        scheduleSave();
        select(null);
    };

    /**
     * ONE listener for the whole form ("event delegation"). The "input" event
     * fires on a field and bubbles up to the form, where e.target tells us
     * which field it was. We work out what part of the block it belongs to
     * from its data-* attributes or its name.
     */
    form.addEventListener('input', (e) => {
        const block = selected();
        if (!block) return;
        const t = e.target;   // the input/textarea/checkbox that changed

        if (t.dataset.group) {
            // An ability or defense: block.abilities.STR = 8, for example,
            // clamped to its byte range. The field is only rewritten when the
            // value had to change, so typing is not interrupted.
            const v = clampTo(RANGES[t.dataset.group], t.value);
            block[t.dataset.group][t.dataset.key] = v;
            if (t.value !== '' && Number(t.value) !== v) t.value = v;
        } else if (t.dataset.condition) {
            // A condition chip. Add or remove it, then let normalizeConditions
            // drop anything the new selection supersedes (e.g. ticking Stunned
            // removes Dazed) and redraw every chip so the covered ones gray out.
            const set = new Set(block.conditions);
            t.checked ? set.add(t.dataset.condition) : set.delete(t.dataset.condition);
            block.conditions = [...set];
            reconcileConditions(block);   // apply supersede rules, tidy details, redraw chips
        } else if (t.dataset.pp) {
            // A power point field (earned, other): clamp and store.
            const v = clampTo(RANGES.pp, t.value);
            block.pp[t.dataset.pp] = v;
            if (t.value !== '' && Number(t.value) !== v) t.value = v;
        } else if (t.name in RANGES) {
            // pl, initiative, bruises: same clamping as the stat boxes.
            const v = clampTo(RANGES[t.name], t.value);
            block[t.name] = v;
            if (t.dataset.plus) {
                // Initiative: rewrite as "+5" / "0" / "-3" after every change,
                // but leave a lone sign alone while the number is being typed.
                if (!/^[+\-]?$/.test(t.value) && t.value !== withPlus(v)) t.value = withPlus(v);
            } else if (t.value !== '' && Number(t.value) !== v) {
                t.value = v;
            }
        } else if (t.name && t.name in block) {
            // Any other named field (name, skills, notes...) is stored as text.
            block[t.name] = t.value;
        } else {
            return;   // power rows handle their own input in renderPowers
        }

        touch(block);
        renderPP(block);             // abilities, defenses and PL all feed the power point totals
        if (t.dataset.group === 'abilities') refreshSkillTotals(block);   // skill totals include the ability rank
        renderList();                // keep the name / PL / badges in the sidebar current
    });

    // Pressing Enter in a text input would normally submit the form and reload
    // the page. There is nothing to submit, so block it.
    form.addEventListener('submit', (e) => e.preventDefault());

    // "change" fires when a field is committed (blur, Enter, spinner). A number
    // field left empty becomes 0 so the sheet never shows a blank stat;
    // dispatching "input" runs the normal store-and-clamp path.
    form.addEventListener('change', (e) => {
        const t = e.target;
        if ((t.type === 'number' || t.dataset.plus) && /^[+\-]?$/.test(t.value.trim())) {
            t.value = '0';
            t.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // Initiative is the one loose field that can go negative (the stat boxes
    // build their own buttons).
    form.elements.initiative.insertAdjacentElement('afterend', signButton(form.elements.initiative));

    $('#btn-add-power').addEventListener('click', () => {
        const block = selected();
        if (!block) return;
        const p = { name: '', rank: 0, desc: '', cost: 0, perRank: null };
        block.powers.push(p);
        touch(block);
        // Append one row; the existing rows are left alone.
        const row = powerRow(block, p);
        $('#powers').append(row);
        fitTextarea(row.querySelector('.power-desc'));
        row.querySelector('.power-name').focus();
    });

    // Wire the remaining buttons to their actions.
    // Clear conditions: everything in the Conditions section back to normal.
    $('#btn-clear-conditions').addEventListener('click', () => {
        const block = selected();
        if (!block) return;
        if (!block.conditions.length && !block.bruises) return;   // nothing to clear
        block.conditions = [];
        block.conditionDetails = {};
        block.bruises = 0;
        form.elements.bruises.value = 0;
        reconcileConditions(block);   // redraws the chips and detail rows
        touch(block);
        renderList();
    });

    $('#btn-new').addEventListener('click', createBlock);
    $('#btn-duplicate').addEventListener('click', duplicateBlock);
    $('#btn-delete').addEventListener('click', deleteBlock);
    $('#btn-back').addEventListener('click', () => select(null));
    searchEl.addEventListener('input', renderList);   // filter as you type

    /* =========================================================================
     * 7. EXPORT / IMPORT — moving data to and from a .json file.
     * ====================================================================== */

    /**
     * Export: turn `state` into a JSON file and hand it to the user.
     * On phones we prefer the share sheet (navigator.share) because it lets
     * them save to Files / OneDrive / Drive. Otherwise we trigger a download.
     */
    const exportJson = async () => {
        clearTimeout(saveTimer);
        persist();   // make sure the file matches what's on screen

        const stamp = new Date().toISOString().slice(0, 10);   // "2026-10-17"
        const filename = `statblocks-${stamp}.json`;
        const json = JSON.stringify(state, null, 2);           // 2 = pretty-print with indentation
        const blob = new Blob([json], { type: 'application/json' });

        // Try the share sheet first (mobile browsers, and desktop Edge/Safari).
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: 'Stat blocks' });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;   // user closed the share sheet
                // Any other failure: fall through to the download below.
            }
        }

        // Classic download: make a temporary link with the "download" attribute
        // pointing at the blob, click it, then clean up.
        const url = URL.createObjectURL(blob);
        const a = el('a', { href: url, download: filename });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);   // free the memory
    };

    /**
     * Import: read a .json file the user picked, validate it, then either
     * replace the current data or merge the two sets.
     */
    const importJson = (file) => {
        const reader = new FileReader();
        reader.onload = () => {   // runs once the file has been read
            let incoming;
            try {
                incoming = migrate(JSON.parse(reader.result));
            } catch (err) {
                alert('That file is not valid JSON.');
                return;
            }
            if (!incoming.blocks.length) {
                alert('No stat blocks found in that file.');
                return;
            }

            // Only ask when there is something to lose.
            const replace = state.blocks.length > 0 &&
                confirm(`Import ${incoming.blocks.length} block(s).\n\nOK = REPLACE your current ${state.blocks.length} block(s)\nCancel = MERGE (keep both, newer wins on same id)`);

            if (replace || state.blocks.length === 0) {
                state = incoming;
            } else {
                // Merge: index existing blocks by id, then let each incoming block
                // overwrite only if it is the same id AND was edited more recently.
                const byId = new Map(state.blocks.map((b) => [b.id, b]));
                for (const b of incoming.blocks) {
                    const existing = byId.get(b.id);
                    if (!existing || (b.updated || 0) >= (existing.updated || 0)) byId.set(b.id, b);
                }
                state.blocks = [...byId.values()];
            }

            selectedId = null;
            persist();
            render();
        };
        reader.readAsText(file);
    };

    $('#btn-export').addEventListener('click', exportJson);

    // The real <input type="file"> is hidden; the visible button just clicks it.
    $('#btn-import').addEventListener('click', () => $('#file-import').click());
    $('#file-import').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) importJson(file);
        e.target.value = '';   // reset so picking the same file again still fires "change"
    });

    /* =========================================================================
     * 8. RULES REFERENCE POPUP — draws window.REFERENCE (from reference.js)
     *    into the <dialog>. Entries tied to a condition that is active on the
     *    open block get a highlight and an ACTIVE tag.
     * ====================================================================== */
    const refDialog = $('#ref-dialog');
    const refSearch = $('#ref-search');

    // Which section the tabs are showing: null = all of them (the default).
    // Tapping a tab shows just that section; tapping it again shows all.
    let refSection = null;

    /** Turn "Making checks" into "making-checks" for use as an element id. */
    const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    /**
     * Three extra sections for the popup, built from the same samples.js the
     * "+ From the book" pickers use (so the two never disagree): every
     * advantage, every power effect and sample power, and every complication.
     * Skills are not repeated here: the Skill checks section already covers
     * all sixteen in more detail.
     */
    const sampleSections = () => {
        const S = window.SAMPLES || {};
        return [
            {
                title: 'Advantages',
                entries: (S.advantages || []).map((a) => ({
                    name: a.name,
                    text: [`${a.type} advantage${a.ranked ? ', ranked' + (a.max ? ` (max ${a.max})` : '') : ''}. ${a.effect}`, a.text].filter(Boolean),
                })),
            },
            {
                title: 'Powers',
                entries: (S.powers || []).map((p) => ({
                    name: p.name,
                    text: [`${p.kind === 'sample' ? 'Sample power' : (p.type || 'Effect') + ' effect'}.`, p.text].filter(Boolean),
                    rows: [
                        ['Effect', p.effect], ['Type', p.type], ['Action', p.action], ['Range', p.range],
                        ['Duration', p.duration], ['Resisted by', p.resist], ['Cost', p.cost],
                    ].filter(([, v]) => v),
                })),
            },
            {
                title: 'Complications',
                entries: (S.complications || []).map((c) => ({ name: c.name, text: c.text })),
            },
        ];
    };

    const renderReference = () => {
        const q = refSearch.value.trim().toLowerCase();
        const block = selected();
        const active = new Set(block ? block.conditions : []);
        const data = [...(window.REFERENCE || []), ...sampleSections()];

        const sections = data.filter((sec) => !refSection || sec.title === refSection).map((sec) => {
            // Filter entries by the search box (matches name, text and table cells).
            const entries = sec.entries.filter((e) => {
                if (!q) return true;
                const hay = [e.name, ...[].concat(e.text || []), ...(e.rows || []).flat(), ...(e.table ? [...e.table.head, ...e.table.rows.flat()] : [])].join(' ').toLowerCase();
                return hay.includes(q);
            });
            if (!entries.length) return null;

            return el('section', { class: 'ref-section', id: `ref-${slug(sec.title)}` },
                el('h3', { text: sec.title }),
                ...entries.map((e) => {
                    const isActive = e.condition && active.has(e.condition);
                    const head = el('h4', {}, document.createTextNode(e.name));
                    if (isActive) head.append(el('span', { class: 'tag active', text: 'active' }));
                    if (e.verify) head.append(el('span', { class: 'tag verify', text: 'check vs book', title: 'Written from memory; compare with the Hero\u2019s Handbook' }));

                    const body = [].concat(e.text || []).map((p) => el('p', { text: p }));
                    // Two kinds of table: "rows" is a plain 2-column list; "table"
                    // has a header row and any number of columns, wrapped in a
                    // div that scrolls sideways on narrow screens.
                    const table = e.rows
                        ? el('table', {}, ...e.rows.map(([a, b]) => el('tr', {}, el('td', { text: a }), el('td', { text: b }))))
                        : null;
                    const wide = e.table
                        ? el('div', { class: 'table-wrap' }, el('table', { class: 'wide' },
                            el('thead', {}, el('tr', {}, ...e.table.head.map((h) => el('th', { text: h })))),
                            el('tbody', {}, ...e.table.rows.map((r) => el('tr', {}, ...r.map((c) => el('td', { text: c }))))),
                        ))
                        : null;
                    return el('article', { class: 'ref-entry' + (isActive ? ' active' : ''), id: `ref-entry-${slug(e.name)}` }, head, ...body, ...(table ? [table] : []), ...(wide ? [wide] : []));
                }),
            );
        }).filter(Boolean);

        // The intro paragraph only in the "all tabs" view with no filter typed,
        // so a glance tells the full view apart from a single tab.
        const intro = (!refSection && !q && window.REFERENCE_INTRO)
            ? [el('div', { class: 'ref-intro' }, ...[].concat(window.REFERENCE_INTRO).map((p) => el('p', { text: p })))]
            : [];
        $('#ref-body').replaceChildren(...intro, ...(sections.length ? sections : [el('p', { class: 'ref-empty', text: 'Nothing matches that filter.' })]));

        // One tab per section, lit when its section is showing (all lit by
        // default). Built from the data, not the rendered sections, so a tab
        // stays available even while the search filter hides its section.
        $('#ref-nav').replaceChildren(...data.map((sec) =>
            el('button', {
                type: 'button',
                class: 'btn small tab' + (!refSection || refSection === sec.title ? ' on' : ''),
                text: sec.title,
                'aria-pressed': refSection === sec.title ? 'true' : 'false',
                onclick: () => {
                    refSection = refSection === sec.title ? null : sec.title;   // same tab again = show all
                    renderReference();
                    $('#ref-body').scrollTop = 0;
                },
            })
        ));
    };

    /**
     * Open the popup. With no arguments it shows everything. The info cards
     * (section 8b) pass a section title and entry name to open straight on
     * that entry, with only its section's tab lit.
     */
    const openReference = (sectionTitle = null, entryName = null) => {
        refSearch.value = '';
        refSection = sectionTitle;
        renderReference();
        refDialog.showModal();
        $('#ref-body').scrollTop = 0;
        if (entryName) {
            const target = $(`#ref-entry-${slug(entryName)}`);
            if (target) {
                target.scrollIntoView({ block: 'start' });
                target.classList.add('flash');          // brief highlight so the eye finds it
                setTimeout(() => target.classList.remove('flash'), 1200);
            }
        }
    };

    // Wrapped in an arrow so the click event is NOT passed in as the section
    // title (which would match no section and leave the popup empty).
    $('#btn-checks').addEventListener('click', () => openReference());
    $('#ref-close').addEventListener('click', () => refDialog.close());
    refSearch.addEventListener('input', renderReference);
    // A click on the dimmed backdrop lands on the <dialog> element itself
    // (clicks inside land on its children), so that is how we detect it.
    refDialog.addEventListener('click', (e) => { if (e.target === refDialog) refDialog.close(); });

    /* =========================================================================
     * 8b. INFO CARDS — a small card with an entry's first paragraph, shown on
     *     hover (mouse) or long press (touch) over a condition chip, an ability
     *     or defense box, or a condition badge in the list. A normal tap still
     *     toggles the chip; only holding it for half a second shows the card.
     * ====================================================================== */
    const infoPop = $('#info-pop');
    const INFO_HOVER_DELAY = 350;   // ms the mouse must rest before the first card shows
    const INFO_SWITCH_DELAY = 80;   // ms to switch to the next chip once a card is already open
    const INFO_PRESS_DELAY = 500;   // ms a finger must hold before the card shows
    let infoTarget = null;          // element the card currently belongs to
    let infoShowTimer = null;
    let infoHideTimer = null;
    let infoPressTimer = null;
    let infoLongPressed = false;    // true between a long press and the click it would cause

    /**
     * Finds the reference entry for a thing on screen. Returns
     * { section, entry, title } or null. Looks through window.REFERENCE each
     * time, which is cheap and means edits to reference.js just work.
     */
    // Short texts for the figures of the Power points section; the "More"
    // link of each goes to the Power point costs entry.
    const PP_INFO = {
        'PL': 'Power level: the series\u2019 overall cap on traits and what sets the base power points, 15 per level. Raised by the GM as the heroes earn more points. (p. 24)',
        'Base': 'Power level \u00d7 15: the points a hero starts with. Changes with the PL field above. (p. 24)',
        'Earned': 'Points the GM has awarded on top of the base, usually 1 per adventure or session. Type them in here as they come. (p. 262)',
        'Total': 'Base plus earned: everything this character has to spend.',
        'Spent': 'Everything on the sheet added up: abilities, defenses, skills, advantages, powers and the Other field.',
        'Left': 'Total minus spent. Red means more has been spent than the character has.',
        'Points': 'Equipment points: 5 per rank of the Equipment advantage, spent on gear instead of power points. (p. 130)',
        'Other': 'Anything the lists above do not cover, such as points moved here from an older save. Typed in by hand.',
    };

    const infoLookup = (kind, key) => {
        const all = [...(window.REFERENCE || []), ...sampleSections()];
        const find = (sectionTitle, test) => {
            for (const section of all) {
                if (sectionTitle && section.title !== sectionTitle) continue;
                const entry = section.entries.find(test);
                if (entry) return { section, entry, title: entry.name };
            }
            return null;
        };
        const lc = (s) => String(s || '').trim().toLowerCase();
        switch (kind) {
            case 'condition': return find(null, (e) => e.condition === key);
            case 'ability': return find('Ability checks', (e) => e.name.includes(`(${key})`));
            case 'defense': {
                const f = find('Ability checks', (e) => e.name === 'Defenses');
                const row = f && (f.entry.rows || []).find(([name]) => name === key);
                return row ? { ...f, title: key, text: row[1] } : null;
            }
            case 'bruised': { const f = find('Combat checks', (e) => e.name === 'Damage results'); return f && { ...f, title: 'Bruised', text: f.entry.text }; }
            case 'initiative': return find('Combat checks', (e) => e.name === 'Initiative');
            case 'pp': {   // a figure or category of the Power points section
                const f = find('Ability checks', (e) => e.name === 'Power point costs');
                if (!f) return null;
                const row = (f.entry.rows || []).find(([name]) => name === key);
                const text = PP_INFO[key] || (row && row[1]);
                return text ? { ...f, title: key, text } : null;
            }
            case 'over': { const f = find('Ability checks', (e) => e.name === 'Power point costs'); return f && { ...f, title: 'Overspent', text: key }; }
            // Rows of the lists: the book entry for whatever is named in the row.
            // A skill like "Expertise: Science" matches the "Expertise" entry.
            case 'skill': return lc(key) ? find('Skill checks', (e) => lc(key) === lc(e.name) || lc(key).startsWith(lc(e.name) + ':') || lc(key).startsWith(lc(e.name) + ' ')) : null;
            case 'advantage': return lc(key) ? find('Advantages', (e) => lc(key) === lc(e.name) || lc(key).startsWith(lc(e.name) + ' ') || lc(key).startsWith(lc(e.name) + ':')) : null;
            case 'power': return lc(key) ? find('Powers', (e) => lc(key) === lc(e.name)) || find('Powers', (e) => lc(key).startsWith(lc(e.name) + ' ')) : null;
            case 'complication': return lc(key) ? find('Complications', (e) => lc(key) === lc(e.name) || lc(key).startsWith(lc(e.name) + ':') || lc(e.name).startsWith(lc(key) + ':') && false) || find('Complications', (e) => lc(e.name) === 'motivation: ' + lc(key).replace(/^motivation:\s*/, '')) : null;
        }
        return null;
    };

    /** Works out what an element on screen refers to: which kind and which key. */
    const infoSubject = (target) => {
        const c = target.classList;
        const cond = target.querySelector?.('[data-condition]');
        if (cond) return ['condition', cond.dataset.condition];
        const stat = target.querySelector?.('[data-key]');
        if (stat) return [stat.dataset.group === 'abilities' ? 'ability' : 'defense', stat.dataset.key];
        if (c.contains('badge')) {
            if (c.contains('over')) return ['over', target.title];
            const name = target.textContent.replace(/\s*\(.*$/, '').trim();   // "Unaware (Visual)" -> "Unaware"
            return name.startsWith('Bruised') ? ['bruised', 'Bruised'] : ['condition', name];
        }
        // Loose fields and the Power points section: keyed by their label text.
        // The label is the text before any <small> subtitle or <output> figure:
        // for a .pp-stat that is its first text node, for a .pp-row the first
        // text node inside its <span>.
        const label = () => {
            const first = target.firstChild;
            const node = first && first.nodeType === Node.TEXT_NODE ? first : target.querySelector('span')?.firstChild;
            return (node?.textContent || '').trim();
        };
        if (c.contains('pl-label')) return ['pp', 'PL'];
        if (c.contains('inline-field')) {
            if (target.querySelector('#f-initiative')) return ['initiative', 'Initiative'];
            if (target.querySelector('#f-bruises')) return ['bruised', 'Bruised'];
            if (target.querySelector('#f-pp-earned')) return ['pp', 'Earned'];
        }
        if (c.contains('pp-stat') || c.contains('pp-row')) return ['pp', label()];
        // List rows: the name typed in the row's first text field.
        const name = target.querySelector?.('input[type="text"]')?.value || '';
        if (target.closest('#skills')) return ['skill', name];
        if (target.closest('#advantages')) return ['advantage', name];
        if (target.closest('#complications')) return ['complication', name];
        if (c.contains('power-row')) return ['power', name];
        return null;
    };

    // Hides the card. Deliberately leaves a pending show timer alone: a scroll
    // or resize that happens while the mouse is already resting on a chip
    // should not stop that chip's card from appearing.
    const hideInfo = () => {
        clearTimeout(infoHideTimer);
        infoPop.hidden = true;
        infoTarget = null;
    };

    /** Fills the card for `target` and places it just below (or above) it. */
    const showInfo = (target) => {
        const subject = infoSubject(target);
        const found = subject && infoLookup(...subject);
        if (!found) return;
        const { section, entry } = found;
        const text = found.text || [].concat(entry.text || [])[0] || '';

        // The title row carries the "More" link, placed FIRST so it sits at the
        // card's left edge, which is lined up with the element's left edge: the
        // move from chip to link is straight down and never crosses a neighbour.
        infoPop.replaceChildren(
            el('div', { class: 'info-head' },
                el('button', {
                    type: 'button', class: 'info-more', text: `More \u203a`, title: 'Open in the reference',
                    onclick: () => { hideInfo(); openReference(section.title, entry.name); },
                }),
                el('div', { class: 'info-title', text: found.title }),
            ),
            el('p', { text }),
            // Debilitated etc. have a small table worth showing in full.
            ...(entry.rows && !found.text ? [el('table', {}, ...entry.rows.map(([a, b]) => el('tr', {}, el('td', { text: a }), el('td', { text: b }))))] : []),
        );
        infoPop.hidden = false;
        infoTarget = target;
        infoShownAt = performance.now();   // see the scroll / resize listeners below
        infoShownScroll = window.scrollY;

        // Position: just below the element, flipped above if there is no room
        // (the "above" class then puts the title row at the bottom, still next
        // to the element), and kept inside the viewport horizontally.
        // position: fixed, so the numbers are relative to the window.
        const gap = 0;   // the title row touches the element: no dead strip to cross
        const r = target.getBoundingClientRect();
        const w = infoPop.offsetWidth;
        const h = infoPop.offsetHeight;
        const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
        let top = r.bottom + gap;
        const above = top + h > window.innerHeight - 8;
        if (above) top = Math.max(8, r.top - h - gap);
        infoPop.classList.toggle('above', above);
        infoPop.style.left = `${left}px`;
        infoPop.style.top = `${top}px`;
    };

    /** The elements that get a card: condition chips, stat boxes, list badges. */
    const infoTargetOf = (node) => node.closest?.('#conditions .chip, .stat, .block-item .badge, .pl-label, .inline-field, .pp-stat, .pp-row, #skills .list-row, #advantages .list-row, #complications .list-row, #powers .power-row');
    /** A list row shows no card while you are typing in it, and a long press on its fields keeps the normal text menu. */
    const infoIsRow = (target) => target.classList.contains('list-row') || target.classList.contains('power-row');
    const infoFormControl = (node) => node.closest?.('input, select, textarea, button');

    // --- Mouse. The card ignores the mouse (pointer-events: none in the CSS,
    //     except its "More" link), so e.target is always whatever is under the
    //     pointer, even through the card. One move handler decides everything:
    //       over a chip or box  -> show its card after a short rest, or switch
    //                              almost at once if a card is already open
    //       still on the card's own element, or right by its "More" link -> keep it
    //       anywhere else       -> hide at once
    //     The card itself is NOT a safe zone: in the dense conditions grid it
    //     would otherwise hang over the neighbouring chips.
    let infoPendingFor = null;   // element whose card is scheduled but not yet shown
    const inside = (e, r, pad = 0) => e.clientX >= r.left - pad && e.clientX <= r.right + pad && e.clientY >= r.top - pad && e.clientY <= r.bottom + pad;
    document.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const target = infoTargetOf(e.target);
        if (target) {
            clearTimeout(infoHideTimer);
            if (target === infoTarget || target === infoPendingFor) return;
            if (infoIsRow(target) && target.contains(document.activeElement)) return;
            clearTimeout(infoShowTimer);
            infoPendingFor = target;
            const delay = infoPop.hidden ? INFO_HOVER_DELAY : INFO_SWITCH_DELAY;
            infoShowTimer = setTimeout(() => { infoPendingFor = null; showInfo(target); }, delay);
            return;
        }
        if (infoPendingFor) { clearTimeout(infoShowTimer); infoPendingFor = null; }
        if (infoPop.hidden) return;
        // The title row (which holds the link) is solid to the mouse and sits
        // flush against the element, so chip -> row -> link is one straight move.
        const head = infoPop.querySelector('.info-head');
        const keep = (infoTarget && inside(e, infoTarget.getBoundingClientRect(), 2)) || (head && inside(e, head.getBoundingClientRect(), 4));
        if (keep) { clearTimeout(infoHideTimer); return; }
        hideInfo();
    });

    // --- Touch: hold for half a second. Lifting the finger first cancels, as
    //     does sliding it more than a few pixels (a real finger always
    //     wobbles a little, so small movement must NOT cancel). A completed
    //     long press also swallows the click that follows, so the chip is
    //     not toggled by accident.
    const INFO_PRESS_SLOP = 12;   // px the finger may drift before it counts as a move
    let infoPressStart = null;    // where the finger landed
    document.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        const target = infoTargetOf(e.target);
        if (!target) { if (!infoPop.contains(e.target)) hideInfo(); return; }
        if (infoIsRow(target) && infoFormControl(e.target)) return;   // leave the field's own long-press behaviour alone
        infoLongPressed = false;
        infoPressStart = { x: e.clientX, y: e.clientY };
        clearTimeout(infoPressTimer);
        infoPressTimer = setTimeout(() => { infoLongPressed = true; showInfo(target); }, INFO_PRESS_DELAY);
    });
    for (const type of ['pointerup', 'pointercancel']) {
        document.addEventListener(type, (e) => { if (e.pointerType !== 'mouse') clearTimeout(infoPressTimer); });
    }
    document.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'mouse' || !infoPressStart) return;
        if (Math.hypot(e.clientX - infoPressStart.x, e.clientY - infoPressStart.y) > INFO_PRESS_SLOP) {
            clearTimeout(infoPressTimer);
            infoPressStart = null;
        }
    });
    document.addEventListener('click', (e) => {
        if (infoLongPressed && infoTargetOf(e.target)) {
            e.preventDefault();          // don't toggle the chip
            e.stopPropagation();
            infoLongPressed = false;
        }
    }, true);
    // Stop the browser's own long-press menu / text selection on those elements.
    document.addEventListener('contextmenu', (e) => {
        const target = infoTargetOf(e.target);
        if (target && !(infoIsRow(target) && infoFormControl(e.target))) e.preventDefault();
    });

    // --- Any of these means the card is no longer where it should be.
    //     Scrolling and resizing would leave the card in the wrong place, so
    //     they hide it. Two allowances for phones: touching the screen can
    //     nudge the page by a pixel or two and collapse the browser's address
    //     bar (which fires scroll AND resize), so for a moment after the card
    //     appears those are ignored, and afterwards only a scroll of more than
    //     a couple of dozen pixels counts.
    let infoShownAt = 0;
    let infoShownScroll = 0;
    const INFO_SETTLE_MS = 800;
    const INFO_SCROLL_SLOP = 24;
    window.addEventListener('scroll', () => {
        if (infoPop.hidden) return;
        if (performance.now() - infoShownAt < INFO_SETTLE_MS) return;
        if (Math.abs(window.scrollY - infoShownScroll) < INFO_SCROLL_SLOP) return;
        hideInfo();
    }, true);
    window.addEventListener('resize', () => {
        if (infoPop.hidden || performance.now() - infoShownAt < INFO_SETTLE_MS) return;
        hideInfo();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { clearTimeout(infoShowTimer); hideInfo(); } });

    /* =========================================================================
     * 8c. AUTO-HIDING TOP BAR (phones only) — the bar is shown only while the
     *     page is scrolled to (or very near) the top; anywhere further down it
     *     slides up out of the way. Flick back to the top to get it back. On
     *     wide screens the class is never applied (see style.css).
     * ====================================================================== */
    const topbar = $('.topbar');
    const narrowScreen = window.matchMedia('(max-width: 819px)');   // same breakpoint as the layout
    const BAR_HIDE_AT = 24;      // px scrolled before the bar goes; a little slack so a nudge does not hide it
    let scrollTicking = false;   // only react once per animation frame

    const updateTopbar = () => {
        if (!narrowScreen.matches) return;
        topbar.classList.toggle('bar-hidden', window.scrollY > BAR_HIDE_AT);
    };
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => { updateTopbar(); scrollTicking = false; });
    }, { passive: true });
    updateTopbar();   // in case the page is restored already scrolled

    // Rotating to landscape / resizing to desktop: make sure it is shown.
    narrowScreen.addEventListener('change', () => topbar.classList.remove('bar-hidden'));

    /* =========================================================================
     * 5b. LIST SECTIONS — skills, advantages, offense and complications work
     *     like the powers list: one row per entry, added and removed one at a
     *     time. Each has "+ Add" for a blank row and (except offense) "+ From
     *     the book", which opens a picker over window.SAMPLES (samples.js).
     * ====================================================================== */

    /** A clamped whole-number input that reports its value through onChange. */
    const numberField = (range, value, onChange, extra = {}) => el('input', {
        type: 'number', min: range.min, max: range.max, step: '1', value: value || 0, ...extra,
        inputmode: range.min >= 0 ? 'numeric' : undefined,
        oninput: (e) => {
            const v = clampTo(range, e.target.value);
            if (e.target.value !== '' && Number(e.target.value) !== v) e.target.value = v;
            onChange(v);
        },
    });

    /** A <select> whose options are plain strings; "" shows the placeholder. */
    const selectField = (options, value, onChange, placeholder) => {
        const sel = el('select', { onchange: (e) => onChange(e.target.value) },
            ...(placeholder ? [el('option', { value: '', text: placeholder })] : []),
            ...options.map((o) => el('option', { value: o, text: o })),
        );
        sel.value = value || '';
        return sel;
    };

    /** The remove button every row ends with: drop the entry, remove the row, refresh totals. */
    const removeButton = (block, list, entry, row) => el('button', {
        class: 'btn small icon', type: 'button', title: 'Remove', text: '\u2715',
        onclick: () => {
            const i = list.indexOf(entry);
            if (i >= 0) list.splice(i, 1);
            row.remove();
            touch(block); renderPP(block); renderList(); renderEquipment(block);
        },
    });

    /** Skill total = ranks + the rank of its ability (if one is chosen). */
    const skillTotal = (block, s) => (s.ranks || 0) + (s.ability ? (block.abilities[s.ability] || 0) : 0);
    const refreshSkillTotals = (block) => {
        for (const row of document.querySelectorAll('#skills .list-row')) row._refresh?.(block);
    };

    // Skills and advantages are drawn as table lines: the column headings are
    // in index.html (.table-head) and the row's grid columns in style.css.
    const skillRow = (block, s) => {
        const total = el('output', { class: 'total', title: 'Ranks + ability rank' });
        const row = el('div', { class: 'list-row skill-row' },
            el('input', { type: 'text', placeholder: 'Skill (e.g. Expertise: Science)', value: s.name, oninput: (e) => { s.name = e.target.value; touch(block); } }),
            selectField(SKILL_ABILITIES, s.ability, (v) => { s.ability = v; touch(block); row._refresh(block); }, '\u2014'),
            numberField(RANGES.pp, s.ranks, (v) => { s.ranks = v; touch(block); row._refresh(block); renderPP(block); renderList(); }),
            total,
        );
        row._refresh = (b) => { total.textContent = (skillTotal(b, s) >= 0 ? '+' : '') + skillTotal(b, s); };
        row._refresh(block);
        row.append(removeButton(block, block.skills, s, row));
        return row;
    };

    const advantageRow = (block, a) => {
        const row = el('div', { class: 'list-row advantage-row' },
            el('input', { type: 'text', placeholder: 'Advantage', value: a.name, oninput: (e) => { a.name = e.target.value; touch(block); renderEquipment(block); } }),
            numberField(RANGES.pp, a.rank, (v) => { a.rank = v; touch(block); renderPP(block); renderList(); renderEquipment(block); }),
            el('input', { class: 'note', type: 'text', placeholder: 'Note (what it does, which skill or attack\u2026)', value: a.note || '', oninput: (e) => { a.note = e.target.value; touch(block); } }),
        );
        row.append(removeButton(block, block.advantages, a, row));
        return row;
    };

    const offenseRow = (block, o) => {
        const row = el('div', { class: 'list-row offense-row' },
            el('input', { type: 'text', placeholder: 'Attack (e.g. Unarmed)', value: o.name, oninput: (e) => { o.name = e.target.value; touch(block); } }),
            numberField(RANGES.abilities, o.bonus, (v) => { o.bonus = v; touch(block); }),
            selectField(OFFENSE_RANGES, o.range, (v) => { o.range = v; touch(block); }),
            el('input', { class: 'note', type: 'text', placeholder: 'Effect (e.g. Damage 2)', value: o.effect, oninput: (e) => { o.effect = e.target.value; touch(block); } }),
        );
        row.append(removeButton(block, block.offense, o, row));
        return row;
    };

    const complicationRow = (block, c) => {
        const row = el('div', { class: 'list-row' },
            el('input', { class: 'grow', type: 'text', placeholder: 'Complication (e.g. Motivation: Justice)', value: c.name, oninput: (e) => { c.name = e.target.value; touch(block); } }),
        );
        row.append(removeButton(block, block.complications, c, row));
        row.append(el('textarea', { class: 'note', rows: '1', placeholder: 'How it plays out for this character', oninput: (e) => { c.note = e.target.value; touch(block); } }, c.note || ''));
        return row;
    };

    /**
     * Equipment points: the ranks of every advantage called "Equipment"
     * (case-insensitive, so "Equipment 2" or "equipment: utility belt" count),
     * times 5. The Equipment section only shows while that rank is above 0.
     */
    const computeEP = (block) => {
        const rank = block.advantages.filter((a) => /^equipment\b/i.test(a.name.trim())).reduce((n, a) => n + (a.rank || 0), 0);
        const total = rank * EP_PER_RANK;
        const spent = block.equipment.reduce((n, e) => n + (e.cost || 0), 0);
        return { rank, total, spent, left: total - spent };
    };
    const renderEquipment = (block) => {
        const ep = computeEP(block);
        const section = $('#equipment-section');
        section.hidden = ep.rank === 0;
        $('#ep-rank').textContent = ep.rank;
        $('#ep-total').textContent = ep.total;
        $('#ep-spent').textContent = ep.spent;
        const left = $('#ep-left');
        left.textContent = ep.left;
        left.classList.toggle('over', ep.left < 0);
    };

    const equipmentRow = (block, e) => {
        const row = el('div', { class: 'list-row equipment-row' },
            el('input', { type: 'text', placeholder: 'Item (e.g. Pistol)', value: e.name, oninput: (ev) => { e.name = ev.target.value; touch(block); } }),
            numberField(RANGES.pp, e.cost, (v) => { e.cost = v; touch(block); renderEquipment(block); }),
            el('input', { class: 'note', type: 'text', placeholder: 'Note (effect, features\u2026)', value: e.note || '', oninput: (ev) => { e.note = ev.target.value; touch(block); } }),
        );
        row.append(removeButton(block, block.equipment, e, row));
        return row;
    };

    /**
     * Everything the add buttons and the picker need to know per section:
     * where the rows go, how to make a blank entry, how to draw a row, which
     * sample list feeds the picker and how a sample becomes an entry.
     */
    const SECTIONS = {
        skills: {
            container: '#skills', list: (b) => b.skills, row: skillRow,
            blank: () => ({ name: '', ability: '', ranks: 0 }),
            samples: 'skills', label: 'Skills',
            fromSample: (k) => ({ name: ['Expertise', 'Close Combat', 'Ranged Combat'].includes(k.name) ? `${k.name}: ` : k.name, ability: k.ability, ranks: 1 }),
            describe: (k) => `${k.ability}${k.trained ? ' \u00b7 trained only' : ''} \u2014 ${k.text}`,
        },
        advantages: {
            container: '#advantages', list: (b) => b.advantages, row: advantageRow,
            blank: () => ({ name: '', rank: 1, note: '' }),
            samples: 'advantages', label: 'Advantages',
            fromSample: (k) => ({ name: k.name, rank: 1, note: k.effect }),
            describe: (k) => `${k.type}${k.ranked ? ' \u00b7 ranked' : ''} \u2014 ${k.effect}`,
        },
        offense: {
            container: '#offense', list: (b) => b.offense, row: offenseRow,
            blank: () => ({ name: '', bonus: 0, range: 'Close', effect: '' }),
        },
        complications: {
            container: '#complications', list: (b) => b.complications, row: complicationRow,
            blank: () => ({ name: '', note: '' }),
            samples: 'complications', label: 'Complications',
            fromSample: (k) => ({ name: k.name, note: k.text }),
            describe: (k) => k.text,
        },
        equipment: {
            container: '#equipment', list: (b) => b.equipment, row: equipmentRow,
            blank: () => ({ name: '', cost: 0, note: '' }),
        },
        powers: {
            container: '#powers', list: (b) => b.powers, row: powerRow,
            blank: () => ({ name: '', rank: 0, desc: '', cost: 0, perRank: null }),
            samples: 'powers', label: 'Powers',
            fromSample: (k) => {
                const bits = [k.effect ? `Effect: ${k.effect}.` : '', k.type ? `${k.type} effect.` : '', k.action ? `Action: ${k.action}.` : '', k.range ? `Range: ${k.range}.` : '', k.duration ? `Duration: ${k.duration}.` : '', k.resist ? `Resisted by ${k.resist}.` : '', `Cost: ${k.cost}.`, k.text].filter(Boolean);
                const rank = 1;
                return { name: k.name, rank, desc: bits.join(' '), perRank: k.perRank, cost: k.perRank != null ? k.perRank * rank : (k.flat || 0) };
            },
            describe: (k) => `${k.kind === 'sample' ? 'Sample power' : (k.type || 'Effect')} \u00b7 ${k.cost} \u2014 ${k.text}`,
        },
    };

    /** Draw every list section for a block (used when a block is opened). */
    const renderLists = (block) => {
        for (const sec of Object.values(SECTIONS)) {
            $(sec.container).replaceChildren(...sec.list(block).map((entry) => sec.row(block, entry)));
        }
        renderEquipment(block);
        fitAllTextareas();
    };

    /** Append one entry's row, refresh totals and put the cursor in its first field. */
    const addEntry = (kind, entry) => {
        const block = selected();
        if (!block) return;
        const sec = SECTIONS[kind];
        sec.list(block).push(entry);
        const row = sec.row(block, entry);
        $(sec.container).append(row);
        for (const ta of row.querySelectorAll('textarea')) fitTextarea(ta);
        touch(block); renderPP(block); renderList(); renderEquipment(block);
        row.querySelector('input[type="text"]')?.focus();
    };

    // "+ Add" buttons (data-add) and "+ From the book" buttons (data-pick).
    for (const btn of document.querySelectorAll('[data-add]')) {
        btn.addEventListener('click', () => addEntry(btn.dataset.add, SECTIONS[btn.dataset.add].blank()));
    }
    for (const btn of document.querySelectorAll('[data-pick]')) {
        btn.addEventListener('click', () => openPicker(btn.dataset.pick));
    }

    // --- The picker dialog: a filterable list of samples for one section.
    const pickDialog = $('#pick-dialog');
    const pickSearch = $('#pick-search');
    let pickKind = null;

    const renderPicker = () => {
        const sec = SECTIONS[pickKind];
        const q = pickSearch.value.trim().toLowerCase();
        const items = (window.SAMPLES?.[sec.samples] || []).filter((k) => !q || `${k.name} ${sec.describe(k)}`.toLowerCase().includes(q));
        $('#pick-body').replaceChildren(...(items.length ? items.map((k) =>
            el('button', { type: 'button', class: 'pick-item', onclick: () => { addEntry(pickKind, sec.fromSample(k)); pickDialog.close(); } },
                el('span', { class: 'pick-name', text: k.name }),
                el('span', { class: 'pick-desc', text: sec.describe(k) }),
            )
        ) : [el('p', { class: 'ref-empty', text: 'Nothing matches that filter.' })]));
    };
    const openPicker = (kind) => {
        if (!selected()) return;
        pickKind = kind;
        $('#pick-title').textContent = `${SECTIONS[kind].label} from the book`;
        pickSearch.value = '';
        renderPicker();
        pickDialog.showModal();
        $('#pick-body').scrollTop = 0;
        pickSearch.focus();
    };
    pickSearch.addEventListener('input', renderPicker);
    $('#pick-close').addEventListener('click', () => pickDialog.close());
    pickDialog.addEventListener('click', (e) => { if (e.target === pickDialog) pickDialog.close(); });

    /* =========================================================================
     * 9. SERVICE WORKER — registers sw.js so the app works offline.
     *    Skipped when opened as a file:// URL, where browsers refuse it anyway.
     * ====================================================================== */
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW registration failed', err));
    }

    /* =========================================================================
     * 10. BOOT — load whatever was saved last time and draw the first screen.
     * ====================================================================== */
    load();
    render();
})();

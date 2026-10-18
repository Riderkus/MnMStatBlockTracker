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
    };

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
        powers: [],                // array of { name: 'Flight 6', desc: 'Wings' }
        skills: '',                // free text
        advantages: '',
        offense: '',
        complications: '',
        notes: '',
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
            input.value = String(-v);
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
                    el('div', { class: 'meta', text: `PL ${b.pl}` }),
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
        const container = $('#powers');
        container.replaceChildren(...block.powers.map((p, i) =>
            el('div', { class: 'power-row' },
                el('input', {
                    class: 'power-name', type: 'text', placeholder: 'Power name & rank (e.g. Flight 6)', value: p.name,
                    oninput: (e) => { p.name = e.target.value; touch(block); },
                }),
                el('button', {
                    class: 'btn small icon power-remove', type: 'button', title: 'Remove power', text: '✕',
                    // splice(i, 1) removes one item at index i, then we redraw the rows.
                    onclick: () => { block.powers.splice(i, 1); touch(block); renderPowers(block); },
                }),
                el('textarea', {
                    class: 'power-desc', rows: '2', placeholder: 'Effects, extras, flaws, descriptors…',
                    oninput: (e) => { p.desc = e.target.value; touch(block); },
                }, p.desc || ''),
            )
        ));
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
        form.elements.initiative.value = block.initiative;
        form.elements.bruises.value = block.bruises;

        // Ability and defense inputs: look up block.abilities.STR etc.
        for (const input of form.querySelectorAll('[data-group]')) {
            input.value = block[input.dataset.group][input.dataset.key] ?? 0;
        }

        // Condition chips: ticked / grayed out according to the block.
        syncConditionChips(block);

        // Plain text areas.
        for (const key of ['skills', 'advantages', 'offense', 'complications', 'notes']) {
            form.elements[key].value = block[key];
        }

        renderPowers(block);
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
        } else if (t.name in RANGES) {
            // pl, initiative, bruises: same clamping as the stat boxes.
            const v = clampTo(RANGES[t.name], t.value);
            block[t.name] = v;
            if (t.value !== '' && Number(t.value) !== v) t.value = v;
        } else if (t.name && t.name in block) {
            // Any other named field (name, skills, notes...) is stored as text.
            block[t.name] = t.value;
        } else {
            return;   // power rows handle their own input in renderPowers
        }

        touch(block);
        renderList();   // keep the name / PL / badges in the sidebar current
    });

    // Pressing Enter in a text input would normally submit the form and reload
    // the page. There is nothing to submit, so block it.
    form.addEventListener('submit', (e) => e.preventDefault());

    // "change" fires when a field is committed (blur, Enter, spinner). A number
    // field left empty becomes 0 so the sheet never shows a blank stat;
    // dispatching "input" runs the normal store-and-clamp path.
    form.addEventListener('change', (e) => {
        const t = e.target;
        if (t.type === 'number' && t.value.trim() === '') {
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
        block.powers.push({ name: '', desc: '' });
        touch(block);
        renderPowers(block);
        // ?. = "optional chaining": do nothing if the element isn't found.
        $('#powers .power-row:last-child .power-name')?.focus();
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

    const renderReference = () => {
        const q = refSearch.value.trim().toLowerCase();
        const block = selected();
        const active = new Set(block ? block.conditions : []);
        const data = window.REFERENCE || [];

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
    const infoLookup = (kind, key) => {
        for (const section of window.REFERENCE || []) {
            for (const entry of section.entries) {
                if (kind === 'condition' && entry.condition === key) return { section, entry, title: entry.name };
                if (kind === 'ability' && entry.name.includes(`(${key})`)) return { section, entry, title: entry.name };
                if (kind === 'defense' && entry.name === 'Defenses') {
                    const row = (entry.rows || []).find(([name]) => name === key);
                    if (row) return { section, entry, title: key, text: row[1] };
                }
                if (kind === 'bruised' && entry.name === 'Damage results') return { section, entry, title: 'Bruised', text: entry.text };
            }
        }
        return null;
    };

    /** Works out what an element on screen refers to: which kind and which key. */
    const infoSubject = (target) => {
        const cond = target.querySelector?.('[data-condition]');
        if (cond) return ['condition', cond.dataset.condition];
        const stat = target.querySelector?.('[data-key]');
        if (stat) return [stat.dataset.group === 'abilities' ? 'ability' : 'defense', stat.dataset.key];
        if (target.classList.contains('badge')) {
            const name = target.textContent.replace(/\s*\(.*$/, '').trim();   // "Unaware (Visual)" -> "Unaware"
            return name.startsWith('Bruised') ? ['bruised', 'Bruised'] : ['condition', name];
        }
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
                    type: 'button', class: 'info-more', text: `More \u203a`, title: 'Open in Checks',
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
    const infoTargetOf = (node) => node.closest?.('#conditions .chip, .stat, .block-item .badge');

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

    // --- Touch: hold for half a second. Lifting or moving the finger first
    //     cancels; a completed long press also swallows the click that
    //     follows, so the chip is not toggled by accident.
    document.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        const target = infoTargetOf(e.target);
        if (!target) { if (!infoPop.contains(e.target)) hideInfo(); return; }
        infoLongPressed = false;
        clearTimeout(infoPressTimer);
        infoPressTimer = setTimeout(() => { infoLongPressed = true; showInfo(target); }, INFO_PRESS_DELAY);
    });
    for (const type of ['pointerup', 'pointercancel', 'pointermove']) {
        document.addEventListener(type, (e) => {
            if (e.pointerType === 'mouse') return;
            if (type === 'pointermove' && !infoTargetOf(e.target)) return;
            clearTimeout(infoPressTimer);
        });
    }
    document.addEventListener('click', (e) => {
        if (infoLongPressed && infoTargetOf(e.target)) {
            e.preventDefault();          // don't toggle the chip
            e.stopPropagation();
            infoLongPressed = false;
        }
    }, true);
    // Stop the browser's own long-press menu / text selection on those elements.
    document.addEventListener('contextmenu', (e) => { if (infoTargetOf(e.target)) e.preventDefault(); });

    // --- Any of these means the card is no longer where it should be.
    window.addEventListener('scroll', hideInfo, true);
    window.addEventListener('resize', hideInfo);
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

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
// Screenshots go next to the tests; the app is the folder above.
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots'); fs.mkdirSync(OUT, { recursive: true });
const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://127.0.0.1:8765';
const browser = await chromium.launch();
const errors = [];
const log = (label, s) => console.log(label.padEnd(44), s);

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

// A full character sheet through an import so every section has content.
const sheet = {
    id: 'rook', type: 'sheet', name: 'The Rook', pl: 10, heroPoints: 1,
    identity: { realName: 'Jack Cooper', status: 'Secret', group: 'None' },
    abilities: { STR: 3, STA: 3, AGL: 5, DEX: 5, FGT: 8, INT: 5, AWE: 2, PRE: 3 },
    defenses: { Dodge: 9, Parry: 9, Fortitude: 8, Toughness: 8, Will: 8 }, initiative: 9,
    conditions: ['Dazed'], bruises: 2,
    powers: [{ name: 'Grapple gun', rank: 4, desc: 'Movement 2 (Swinging); Leaping 2', cost: 8 }],
    skills: [{ name: 'Acrobatics', ability: 'AGL', ranks: 6 }, { name: 'Perception', ability: 'AWE', ranks: 8 }],
    advantages: [{ name: 'Equipment', rank: 3, note: '' }, { name: 'Evasion', rank: 2, note: '' }],
    offense: [{ name: 'Unarmed', bonus: 10, range: 'Close', effect: 'Damage 3' }, { name: 'Throwing blades', bonus: 8, range: 'Ranged', effect: 'Damage 2' }, { name: 'Stun gas', bonus: 0, range: 'Perception', effect: 'Affliction 5 (Dazed, Stunned)' }],
    complications: [{ name: 'Motivation: Justice', note: 'Protects the city.' }],
    equipment: [{ name: 'Armored costume', cost: 5, note: 'Protection 2' }],
    notes: 'Night patrols.', background: { appearance: 'Black armour.', personality: '', history: 'Grew up in Emerald City.' },
};
await p.goto(`${BASE}/index.html`);
await p.setInputFiles('#file-import', { name: 'play.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, blocks: [sheet, { id: 'thug', type: 'minion', name: 'Thug', pl: 3, offense: [{ name: 'Club', bonus: 4, range: 'Close', effect: 'Damage 3' }], notes: 'Skills: Intimidation 4.' }] })) });
await p.click('.block-item:has-text("The Rook")');
await p.click('#btn-play');
log('editor hidden / play shown:', (await p.isHidden('#editor')) + ' / ' + (await p.isVisible('#play')));
log('head:', (await p.textContent('#play-name')) + ' | ' + (await p.textContent('#play-sub')));
const boxes = (sel) => p.evaluate((sel) => [...document.querySelectorAll(sel + ' .play-stat')].map((b) => b.querySelector('.lbl').textContent + ' ' + b.querySelector('.val').textContent + (b.querySelector('.sub') ? ' [' + b.querySelector('.sub').textContent + ']' : '')).join(' | '), sel);
log('abilities:', await boxes('#play-abilities'));
log('defenses:', await boxes('#play-defenses'));
log('counters:', (await p.textContent('#play-counters')).replace(/\s+/g, ' ').trim());
log('conditions:', (await p.textContent('#play-conds')).replace(/\s+/g, ' ').trim());
log('tabs:', await p.evaluate(() => [...document.querySelectorAll('#play-tabs .tab')].map((t) => t.textContent + (t.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(', ')));
log('attacks:', await p.evaluate(() => [...document.querySelectorAll('#play-body tbody tr')].map((r) => [...r.children].map((c) => c.textContent.trim()).join(' / ')).join(' || ')));
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: `${OUT}/play-desktop.png`, fullPage: true });

// in-play edits: bruise up, Vulnerable added through the picker
await p.click('.counter:has-text("Bruises") .btn:nth-of-type(2)');
log('bruise +: counter / Toughness box:', (await p.textContent('.counter:has-text("Bruises") .val')) + ' / ' + (await boxes('#play-defenses')).split(' | ')[3]);
await p.click('#play-conds .btn:has-text("+ Condition")');
log('picker open / Dazed absent / Stunned present:', (await p.evaluate(() => document.getElementById('cond-dialog').open)) + ' / ' + !(await p.locator('#cond-body .pick-item:has(.pick-name:text-is("Dazed"))').count()) + ' / ' + (await p.locator('#cond-body .pick-item:has(.pick-name:text-is("Stunned"))').count()));
await p.click('#cond-body .pick-item:has(.pick-name:text-is("Vulnerable"))');
log('after Vulnerable: Dodge box:', (await boxes('#play-defenses')).split(' | ')[0]);
log('conditions now:', (await p.textContent('#play-conds')).replace(/\s+/g, ' ').trim());
await p.click('.play-cond:has-text("Dazed") .x');
log('removed Dazed:', (await p.textContent('#play-conds')).replace(/\s+/g, ' ').trim());
await p.waitForTimeout(450);
log('stored:', JSON.stringify(await p.evaluate(() => { const b = JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0]; return { bruises: b.bruises, conditions: b.conditions }; })));

// tabs
for (const t of ['Skills', 'Equipment', 'Background']) {
    await p.click(`#play-tabs .tab:has-text("${t}")`);
    log(`tab ${t}:`, (await p.textContent('#play-body')).replace(/\s+/g, ' ').trim().slice(0, 110));
}
await p.click('#play-tabs .tab:has-text("Skills")');
await p.screenshot({ path: `${OUT}/play-skills.png`, clip: { x: 300, y: 0, width: 980, height: 900 } });

// info card on a play-view box
await p.hover('#play-abilities .play-stat:first-child'); await p.waitForTimeout(600);
log('info card on STR box:', await p.evaluate(() => { const c = document.getElementById('info-pop'); return c.hidden ? 'hidden' : c.textContent.trim().slice(0, 50); }));
await p.mouse.move(5, 5);

// view mode persists; switching blocks stays in play; Edit returns; New opens the form
await p.reload(); await p.click('.block-item:has-text("The Rook")');
log('after reload still play:', await p.isVisible('#play'));
await p.click('.block-item:has-text("Thug")');
log('minion in play: tabs / sub:', (await p.evaluate(() => [...document.querySelectorAll('#play-tabs .tab')].map((t) => t.textContent).join(', '))) + ' / ' + (await p.textContent('#play-sub')));
log('minion counters (no PP):', (await p.textContent('#play-counters')).replace(/\s+/g, ' ').trim());
await p.screenshot({ path: `${OUT}/play-minion.png`, clip: { x: 300, y: 0, width: 980, height: 700 } });
await p.click('#btn-play'); log('Edit -> form visible:', await p.isVisible('#editor'));
await p.click('#btn-play'); await p.click('#btn-new'); await p.click('#type-dialog [data-type="block"]');
log('New while in play -> form:', await p.isVisible('#editor'));

// phone
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
m.on('pageerror', (e) => errors.push('m: ' + e.message));
await m.goto(`${BASE}/index.html`);
await m.setInputFiles('#file-import', { name: 'play.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, blocks: [sheet] })) });
await m.click('.block-item'); await m.click('#btn-play'); await m.evaluate(() => document.fonts.ready);
log('phone no horizontal scroll:', await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
await m.screenshot({ path: `${OUT}/play-mobile.png`, fullPage: true });
await m.click('#play-conds .btn:has-text("+ Condition")'); await m.screenshot({ path: `${OUT}/play-cond-mobile.png` });

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

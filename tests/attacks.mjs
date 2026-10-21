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
const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await p.goto(`${BASE}/index.html`);

// saves of the three shapes attacks have had
const old = { version: 1, blocks: [{ id: 'r', name: 'The Rook', pl: 10, abilities: { AGL: 5, AWE: 2 },
    offense: [
        { name: 'Unarmed', bonus: 10, range: 'Close', effect: 'Damage 3' },                                    // oldest: text only
        { name: 'Stun gas', bonus: 0, range: 'Perception', effect: 'Affliction (Dazed, Stunned)', rank: 5, resist: '' },   // the brief "rank" shape, not damage
        { name: 'Blades', bonus: 8, range: 'Ranged', effect: 'Damage (Multiattack)', rank: 2, resist: 'Toughness' },      // the brief shape, damage
        { name: 'Taunt', bonus: 6, range: 'Ranged', effect: 'Insult' },
    ],
    skills: [{ name: 'Acrobatics', ability: 'AGL', ranks: 6 }, { name: 'Perception', ability: 'AWE', ranks: 8 }, { name: 'Stealth', ability: 'AGL', ranks: 4 }],
    powers: [{ name: 'Alpha', rank: 1, desc: '', cost: 1 }, { name: 'Beta', rank: 2, desc: '', cost: 2 }, { name: 'Gamma', rank: 3, desc: '', cost: 3 }] }] };
await p.setInputFiles('#file-import', { name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(old)) });
await p.click('.block-item');
await p.waitForTimeout(450);
const stored = (k) => p.evaluate((k) => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0][k], k);
log('migrated attacks (kind, rank, resist, text):', JSON.stringify((await stored('offense')).map((o) => [o.kind, o.damage, o.resist, o.effect])));

// a new attack
await p.click('[data-add="offense"]');
const row = '#offense .list-row:last-child';
await p.fill(`${row} input[type="text"]:not(.note)`, 'Mind blast');
await p.fill(`${row} .cell:nth-of-type(1) input`, '8');
await p.selectOption(`${row} .cell:nth-of-type(3) select`, 'effect');   // Kind: not damage
await p.fill(`${row} .cell:nth-of-type(4) input`, '7');
log('switching to Effect swapped the resist default:', await p.inputValue(`${row} .cell:nth-of-type(5) select`));
await p.selectOption(`${row} .cell:nth-of-type(5) select`, 'Will');
await p.waitForTimeout(450);
log('new attack stored:', JSON.stringify((await stored('offense')).at(-1)));

// reorder: keyboard on the skills list, mouse drag on the powers list
const names = (sel) => p.evaluate((sel) => [...document.querySelectorAll(sel + ' input[type="text"]:not(.note), ' + sel + ' .power-name')].map((i) => i.value).join(', '), sel);
await p.focus('#skills .list-row:nth-child(3) .grab');
await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp');
log('Stealth moved to the top (keys):', await names('#skills'));
await p.waitForTimeout(450); log('stored skills order:', (await stored('skills')).map((s) => s.name).join(', '));
await p.evaluate(() => document.getElementById('powers').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
const h = await p.locator('#powers .power-row:nth-child(1) .grab').boundingBox();
const target = await p.locator('#powers .power-row:nth-child(3)').boundingBox();
await p.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await p.mouse.down();
await p.mouse.move(h.x + h.width / 2, target.y + target.height - 4, { steps: 12 });
await p.mouse.up();
log('Alpha dragged to the bottom (mouse):', await names('#powers'));
await p.waitForTimeout(450); log('stored powers order:', (await stored('powers')).map((s) => s.name).join(', '));
log('focus stays on the handle after keys:', await p.evaluate(() => document.activeElement.classList.contains('grab')));

// play view follows the order; tables are back
await p.click('#btn-play'); await p.evaluate(() => document.fonts.ready);
log('attack rows:', await p.evaluate(() => [...document.querySelectorAll('#play-body tbody tr')].map((r) => [...r.children].map((c) => c.textContent.trim().replace(/\s+/g, ' ')).join(' / ')).join(' || ')));
await p.screenshot({ path: `${OUT}/attacks-desktop.png`, clip: { x: 370, y: 330, width: 860, height: 420 } });
await p.click('#play-tabs .tab:has-text("Powers")'); log('power rows:', await p.evaluate(() => [...document.querySelectorAll('#play-body td.name')].map((c) => c.textContent).join(', ')));

// phone: editor rows with the handles, and the stacked play rows
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
m.on('pageerror', (e) => errors.push('m: ' + e.message));
await m.goto(`${BASE}/index.html`);
await m.setInputFiles('#file-import', { name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(old)) });
await m.click('.block-item'); await m.evaluate(() => document.fonts.ready);
log('phone no overflow:', await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
const shot = async (sel, name) => { const b = await m.locator(sel).boundingBox(); await m.screenshot({ path: `${OUT}/${name}`, clip: { x: 0, y: Math.max(0, b.y - 8), width: 390, height: b.height + 16 }, fullPage: true }); };
await shot('#offense', 'offense-phone.png');
await shot('#powers', 'powers-phone.png');
// touch drag: Perception (2nd skill) to the top
await m.evaluate(() => document.getElementById('skills').scrollIntoView({ block: 'center' })); await m.waitForTimeout(300);
const hb = await m.locator('#skills .list-row:nth-child(2) .grab').boundingBox();
const tb = await m.locator('#skills .list-row:nth-child(1)').boundingBox();
const cdp = await m.context().newCDPSession(m);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hb.x + hb.width / 2, y: hb.y + hb.height / 2 }] });
for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: hb.x + hb.width / 2, y: hb.y + hb.height / 2 + (tb.y + 4 - (hb.y + hb.height / 2)) * i / 8 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await m.waitForTimeout(450);
log('touch drag Perception to the top:', await m.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].skills.map((s) => s.name).join(', ')));
await m.click('#btn-play'); await m.waitForTimeout(200);
await shot('#play-body', 'attacks-phone.png');

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

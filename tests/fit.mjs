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
await p.evaluate(() => document.fonts.ready);
await p.click('#btn-new'); await p.click('#type-dialog [data-type="block"]'); await p.fill('#f-name', 'Fit test');

// 1. names shrink before overflowing
await p.click('[data-add="skills"]');
const sk = '#skills .list-row:last-child input.fit';
await p.fill(sk, 'Perception');
log('short name font:', await p.evaluate((s) => getComputedStyle(document.querySelector(s)).fontSize, sk));
await p.fill(sk, 'Expertise: Theoretical and Applied Quantum Chromodynamics (Advanced)');
const long = await p.evaluate((s) => { const i = document.querySelector(s); return { font: getComputedStyle(i).fontSize, overflow: i.scrollWidth > i.clientWidth }; }, sk);
log('long name font / still overflows:', long.font + ' / ' + long.overflow);
await p.fill(sk, 'Perception');
log('back to short, font restored:', await p.evaluate((s) => getComputedStyle(document.querySelector(s)).fontSize, sk));

// 2. drag several rows in one go, up and back down
for (const n of ['A', 'B', 'C', 'D']) { await p.click('#btn-add-power'); await p.fill('#powers .power-row:last-child .power-name', n); }
await p.evaluate(() => document.getElementById('powers').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
const order = () => p.evaluate(() => [...document.querySelectorAll('#powers .power-name')].map((i) => i.value).join(''));
const box = async (sel) => p.locator(sel).boundingBox();
let h = await box('#powers .power-row:nth-child(4) .grab');
await p.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await p.mouse.down();
const top = await box('#powers .power-row:nth-child(1)');
await p.mouse.move(h.x + h.width / 2, top.y + 4, { steps: 15 });   // D all the way up
log('D dragged to the top (one gesture):', await order());
const third = await box('#powers .power-row:nth-child(3)');
await p.mouse.move(h.x + h.width / 2, third.y + third.height - 4, { steps: 15 });   // and back down past two
log('...then back down past two:', await order());
await p.mouse.up();
await p.waitForTimeout(450);
log('stored:', await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].powers.map((x) => x.name).join('')));
await p.focus('#powers .power-row:nth-child(1) .grab'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
log('keys: first row down twice:', await order());

// 3. note boxes grow to three lines, then scroll
await p.click('[data-add="advantages"]');
const note = '#advantages .list-row:last-child textarea.note';
const h1 = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, note);
await p.fill(note, 'line one\nline two');
const h2 = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, note);
await p.fill(note, 'one\ntwo\nthree\nfour\nfive\nsix');
const h6 = await p.evaluate((s) => { const t = document.querySelector(s); return { h: t.getBoundingClientRect().height, scrolls: t.scrollHeight > t.clientHeight }; }, note);
log('note height 1 line / 2 lines / 6 lines (capped, scrolls):', `${h1} / ${h2} / ${h6.h} (${h6.scrolls})`);
await p.waitForTimeout(450);
log('note stored:', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].advantages[0].note)));
await p.click('[data-add="offense"]'); await p.fill('#offense .list-row:last-child textarea.note', 'Affliction 5 (Dazed, Stunned)'); await p.waitForTimeout(450);
log('offense effect stored:', await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].offense[0].effect));
await p.evaluate(() => document.getElementById('advantages').scrollIntoView({ block: 'center' }));
await p.screenshot({ path: `${OUT}/notes-grow.png`, clip: { x: 370, y: 0, width: 860, height: 900 } });

// reload keeps sizes right
await p.reload(); await p.click('.block-item');
log('after reload: note height / long-name font:', (await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, note)) + ' / ' + (await p.evaluate((s) => getComputedStyle(document.querySelector(s)).fontSize, sk)));

// phone touch drag over two rows
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
m.on('pageerror', (e) => errors.push('m: ' + e.message));
const saved = await p.evaluate(() => localStorage.getItem('statblocks.v1'));
await m.goto(`${BASE}/index.html`); await m.evaluate((d) => localStorage.setItem('statblocks.v1', d), saved); await m.reload(); await m.click('.block-item');
await m.evaluate(() => document.getElementById('powers').scrollIntoView({ block: 'center' })); await m.waitForTimeout(300);
const hb = await m.locator('#powers .power-row:nth-child(4) .grab').boundingBox();
const tb = await m.locator('#powers .power-row:nth-child(1)').boundingBox();
const cdp = await m.context().newCDPSession(m);
const x = hb.x + hb.width / 2, y0 = hb.y + hb.height / 2, y1 = tb.y + 4;
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
for (let i = 1; i <= 12; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (y1 - y0) * i / 12 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await m.waitForTimeout(450);
log('phone: last power dragged to the top:', await m.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].powers.map((x) => x.name).join('')));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

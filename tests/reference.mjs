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
const log = (label, s) => console.log(label.padEnd(30), s);

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(`${BASE}/index.html`);
await page.click('#btn-new'); await page.click('#type-dialog [data-type="block"]');
await page.fill('#f-name', 'Ref test');
await page.click('label.chip:has([data-condition="Dazed"])');
await page.click('label.chip:has([data-condition="Prone"])');

log('dialog open at start:', await page.evaluate(() => document.getElementById('ref-dialog').open));
await page.click('#btn-checks');
log('dialog open after click:', await page.evaluate(() => document.getElementById('ref-dialog').open));
log('sections / entries:', await page.evaluate(() => `${document.querySelectorAll('.ref-section').length} / ${document.querySelectorAll('.ref-entry').length}`));
log('nav buttons:', await page.evaluate(() => [...document.querySelectorAll('#ref-nav button')].map((b) => b.textContent).join(' | ')));
log('active-tagged entries:', await page.evaluate(() => [...document.querySelectorAll('.ref-entry.active h4')].map((h) => h.firstChild.textContent).join(', ')));
log('verify-tagged count:', await page.evaluate(() => document.querySelectorAll('.tag.verify').length));
log('tables rendered:', await page.evaluate(() => document.querySelectorAll('.ref-entry table').length));

// filter
await page.fill('#ref-search', 'toughness');
log('filter "toughness":', await page.evaluate(() => `${document.querySelectorAll('.ref-entry').length} entries in ${document.querySelectorAll('.ref-section').length} sections`));
await page.fill('#ref-search', 'zzzz');
log('filter no match:', await page.textContent('.ref-empty'));
await page.fill('#ref-search', '');

// nav scrolls
await page.click('#ref-nav button:has-text("Conditions")');
await page.waitForTimeout(600);
log('conditions section visible:', await page.evaluate(() => {
    const s = document.getElementById('ref-conditions').getBoundingClientRect();
    const b = document.getElementById('ref-body').getBoundingClientRect();
    return s.top >= b.top - 2 && s.top < b.bottom;
}));

await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.getElementById('ref-body').scrollTop = 0);
await page.screenshot({ path: `${OUT}/reference-desktop.png` });

// close via Esc, reopen, close via button, reopen, close via backdrop
await page.keyboard.press('Escape');
log('closed by Esc:', !(await page.evaluate(() => document.getElementById('ref-dialog').open)));
await page.click('#btn-checks');
await page.click('#ref-close');
log('closed by button:', !(await page.evaluate(() => document.getElementById('ref-dialog').open)));
await page.click('#btn-checks');
await page.mouse.click(5, 450);   // far left edge = backdrop
log('closed by backdrop:', !(await page.evaluate(() => document.getElementById('ref-dialog').open)));

// editor still works after the popup
await page.fill('#f-name', 'Ref test 2');
await page.waitForTimeout(400);
log('name saved after popup:', await page.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].name));
await ctx.close();

// mobile
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
m.on('pageerror', (e) => errors.push('mobile: ' + e.message));
await m.goto(`${BASE}/index.html`);
await m.click('#btn-new'); await m.click('#type-dialog [data-type="block"]');
await m.tap('#btn-checks');
await m.evaluate(() => document.fonts.ready);
await m.waitForTimeout(300);
log('mobile dialog fills screen:', await m.evaluate(() => { const r = document.getElementById('ref-dialog').getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; }));
await m.screenshot({ path: `${OUT}/reference-mobile.png` });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();

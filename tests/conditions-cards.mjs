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
await p.click('#btn-new'); await p.click('#type-dialog [data-type="block"]'); await p.fill('#f-name', 'Cond test');
await p.click('label.chip:has-text("Unaware")');
const card = () => p.evaluate(() => { const c = document.getElementById('info-pop'); return c.hidden ? 'hidden' : c.textContent.replace(/\s+/g, ' ').trim().slice(0, 80); });

// editor: cards on the specifier chips
await p.hover('#condition-details .chip.mini:has-text("Tactile")'); await p.waitForTimeout(600);
log('editor Tactile chip card:', await card());
await p.mouse.move(5, 5); await p.waitForTimeout(100);
await p.click('label.chip:has-text("Unaware")'); await p.click('label.chip:has-text("Debilitated")');   // Debilitated (all) would drop Unaware
await p.hover('#condition-details .chip.mini:has-text("STR")'); await p.waitForTimeout(600);
log('editor STR chip card:', await card());
await p.mouse.move(5, 5); await p.waitForTimeout(100);

// play view: tabs without a scrollbar, quiet buttons, cards in the dialog
await p.click('#btn-play');
log('tabs box scrollable vertically:', await p.evaluate(() => { const t = document.getElementById('play-tabs'); return t.scrollHeight > t.clientHeight; }));
log('tabs height:', await p.evaluate(() => document.getElementById('play-tabs').getBoundingClientRect().height));
log('buttons quiet with conditions on:', await p.evaluate(() => [...document.querySelectorAll('#play-conds .btn')].map((b) => b.textContent + ':' + b.classList.contains('quiet')).join(' ')));
await p.screenshot({ path: `${OUT}/cond-quiet.png`, clip: { x: 370, y: 330, width: 860, height: 220 } });
await p.click('.play-cond:has-text("Debilitated") .x.edit');
await p.hover('#detail-body .chip.mini:has-text("AGL")'); await p.waitForTimeout(600);
log('dialog AGL chip card:', await card());
await p.screenshot({ path: `${OUT}/cond-card.png`, clip: { x: 250, y: 300, width: 780, height: 300 } });
await p.mouse.move(5, 5); await p.click('#detail-close');
await p.click('.play-cond:has-text("Debilitated") .x:not(.edit)');
log('buttons with no conditions:', await p.evaluate(() => [...document.querySelectorAll('#play-conds .btn')].map((b) => b.textContent + ':' + b.classList.contains('quiet')).join(' ')));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

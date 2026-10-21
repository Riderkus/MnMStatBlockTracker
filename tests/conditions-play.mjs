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
await p.click('#btn-play');
const conds = () => p.evaluate(() => [...document.querySelectorAll('.play-cond')].map((c) => c.firstChild.textContent).join(' | ') || '(none)');
const pills = () => p.evaluate(() => document.getElementById('play-conds').textContent.replace(/\s+/g, ' ').trim());

// filter
await p.click('#play-conds .btn:has-text("+ Condition")');
log('picker: all / focus on filter:', (await p.locator('#cond-body .pick-item').count()) + ' / ' + (await p.evaluate(() => document.activeElement.id)));
await p.fill('#cond-search', 'unaw');
log('filter "unaw":', await p.evaluate(() => [...document.querySelectorAll('#cond-body .pick-name')].map((n) => n.textContent).join(', ')));
await p.fill('#cond-search', 'zzz'); log('filter "zzz":', (await p.textContent('#cond-body')).trim());
await p.fill('#cond-search', 'unaware');

// Unaware -> specifier dialog opens with the senses
await p.click('#cond-body .pick-item:has(.pick-name:text-is("Unaware"))');
log('detail dialog open / title / chips:', (await p.evaluate(() => document.getElementById('detail-dialog').open)) + ' / ' + (await p.textContent('#detail-title')) + ' / ' + (await p.locator('#detail-body .chip').count()));
await p.click('#detail-body .chip:has-text("Visual")'); await p.click('#detail-body .chip:has-text("Tactile")');
log('picked Visual + Tactile, pill:', await conds());
await p.screenshot({ path: `${OUT}/cond-detail.png` });
await p.click('#detail-close');
await p.waitForTimeout(450);
log('stored details:', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].conditionDetails)));

// pencil reopens with the choice kept; Blind covers Visual
await p.click('.play-cond .x.edit');
log('reopened: checked chips:', await p.evaluate(() => [...document.querySelectorAll('#detail-body .chip.on')].map((c) => c.textContent.trim()).join(', ')));
await p.click('#detail-close');
await p.click('#play-conds .btn:has-text("+ Condition")'); await p.fill('#cond-search', 'deaf'); await p.click('#cond-body .pick-item:has(.pick-name:text-is("Deaf"))');
log('added Deaf, pills:', await conds());
await p.click('.play-cond:has-text("Unaware") .x.edit');
log('Unaware dialog: Auditory chip covered by:', await p.evaluate(() => document.querySelector('#detail-body .chip:has(input:disabled)')?.textContent.trim()));
await p.click('#detail-close');

// a text specifier: Impaired
await p.click('#play-conds .btn:has-text("+ Condition")'); await p.fill('#cond-search', 'impaired'); await p.click('#cond-body .pick-item:has(.pick-name:text-is("Impaired"))');
log('Impaired dialog: text field focused:', await p.evaluate(() => document.activeElement.classList.contains('detail-text')));
await p.keyboard.type('Strength');
log('typed, pill:', await conds());
await p.click('#detail-close');

// the editor shows the same specifiers
await p.click('#btn-play');
log('editor detail rows:', await p.evaluate(() => [...document.querySelectorAll('#condition-details .detail-row')].map((r) => r.querySelector('.detail-label').textContent + ' ' + ([...r.querySelectorAll('.chip.on')].map((c) => c.textContent.trim()).join(',') || r.querySelector('.detail-text')?.value)).join(' | ')));
log('pills summary:', await pills().catch(() => '-'));

// phone: the picker with its filter
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
m.on('pageerror', (e) => errors.push('m: ' + e.message));
await m.goto(`${BASE}/index.html`);
await m.click('#btn-new'); await m.click('#type-dialog [data-type="block"]'); await m.click('#btn-play');
await m.click('#play-conds .btn:has-text("+ Condition")'); await m.evaluate(() => document.fonts.ready);
await m.screenshot({ path: `${OUT}/cond-picker-mobile.png` });
await m.click('#cond-body .pick-item:has(.pick-name:text-is("Debilitated"))'); await m.waitForTimeout(200);
await m.screenshot({ path: `${OUT}/cond-detail-mobile.png` });

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

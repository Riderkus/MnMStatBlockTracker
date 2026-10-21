import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
// Screenshots go next to the tests; the app is the folder above.
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots'); fs.mkdirSync(OUT, { recursive: true });
const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://127.0.0.1:8765';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const chip = (name) => page.locator(`label.chip:has([data-condition="${name}"])`);
const ability = (name) => page.locator(`#condition-details label.chip.mini:has-text("${name}")`);
const grayed = () => page.evaluate(() => [...document.querySelectorAll('[data-condition]:disabled')].map((c) => c.dataset.condition).sort().join(', ') || '(none)');
const log = (label, s) => console.log(label.padEnd(28), s);

await page.goto(`${BASE}/index.html`);
await page.click('#btn-new'); await page.click('#type-dialog [data-type="block"]');
await page.fill('#f-name', 'Debilitated');

await chip('Debilitated').click();
log('hint:', await page.textContent('.detail-row .hint'));
log('none picked grays:', await grayed());

await ability('STA').click();
log('STA only:', await grayed());

await ability('STA').click();
await ability('DEX').click();
log('DEX only:', await grayed());

await ability('AWE').click();
log('DEX + AWE:', await grayed());

// Reverse direction unaffected: with AWE picked, Unaware is grayed; Blind should still be free
log('Blind while AWE picked:', await chip('Blind').evaluate((l) => l.classList.contains('superseded') ? 'grayed' : 'free'));

// Ticking a now-grayed condition does nothing
await chip('Unaware').click({ force: true });
log('tap grayed Unaware:', await page.evaluate(() => document.querySelector('[data-condition="Unaware"]').checked));

// Reload keeps it
await page.waitForTimeout(400);
await page.reload();
await page.click('.block-item');
log('after reload:', await grayed());
await page.evaluate(() => document.fonts.ready);
await page.locator('fieldset:has(#conditions)').screenshot({ path: `${OUT}/debilitated.png` });

// Import with Debilitated(STA) + Incapacitated together -> Incapacitated dropped
const dirty = { version: 1, blocks: [{ id: 'x', name: 'Dirty', conditions: ['Debilitated', 'Incapacitated', 'Dazed'], conditionDetails: { Debilitated: 'STA' } }] };
await page.evaluate((d) => {
    const f = new File([JSON.stringify(d)], 'd.json', { type: 'application/json' });
    const dt = new DataTransfer(); dt.items.add(f);
    const input = document.getElementById('file-import'); input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
}, dirty);
page.once('dialog', (d) => d.accept());
await page.waitForTimeout(500);
log('dirty import ->', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].conditions)));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

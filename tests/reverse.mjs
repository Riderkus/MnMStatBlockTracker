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
const sense = (name) => page.locator(`#condition-details label.chip.mini:has-text("${name}")`);
const chipState = (names) => page.evaluate((names) => names.map((n) => {
    const cb = document.querySelector(`[data-condition="${n}"]`);
    const by = cb.parentElement.querySelector('.chip-by').textContent;
    return `${n}=${cb.checked ? 'ON' : 'off'}${cb.disabled ? ' (' + by + ')' : ''}`;
}).join('  '), names);
const senseState = (names) => page.evaluate((names) => names.map((n) => {
    const l = [...document.querySelectorAll('#condition-details label.chip.mini')].find((l) => l.textContent.startsWith(n));
    if (!l) return `${n}=?`;
    const cb = l.querySelector('input');
    return `${n}=${cb.checked ? 'ON' : 'off'}${cb.disabled ? ' (' + l.querySelector('.chip-by').textContent + ')' : ''}`;
}).join('  '), names);
const clearAll = async () => {
    for (const cb of await page.$$('[data-condition]:checked')) await cb.evaluate((el) => el.parentElement.click());
};
const log = (label, s) => console.log(label.padEnd(40), s);

await page.goto(`${BASE}/index.html`);
await page.click('#btn-new'); await page.click('#type-dialog [data-type="block"]');
await page.fill('#f-name', 'Reverse');

// 1. plain Unaware (all senses) grays out Blind and Deaf
await chip('Unaware').click();
log('Unaware, none picked:', await chipState(['Unaware', 'Blind', 'Deaf']));

// 2. picking only Tactile frees them again
await sense('Tactile').click();
log('Unaware (Tactile):', await chipState(['Blind', 'Deaf']));

// 3. adding Auditory grays out Deaf only
await sense('Auditory').click();
log('Unaware (Tactile, Auditory):', await chipState(['Blind', 'Deaf']));

// 4. Blind can be ticked now; it then grays the Visual toggle
await chip('Blind').click();
log('+ Blind:', (await chipState(['Blind', 'Deaf'])) + '  ' + (await senseState(['Visual', 'Auditory'])));

// 5. unpick every sense -> "all senses" -> Blind gets superseded and Visual is free again
await sense('Tactile').click();
await sense('Auditory').click();
log('all senses unpicked:', (await chipState(['Unaware', 'Blind', 'Deaf'])) + '  ' + (await senseState(['Visual'])));

// 6. Blind first, then Unaware -> Unaware (all senses) wins, Blind drops
await clearAll();
await chip('Blind').click();
await chip('Unaware').click();
await page.waitForTimeout(400);
log('Blind then Unaware:', await chipState(['Unaware', 'Blind']));
console.log('stored:', await page.evaluate(() => { const b = JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0]; return JSON.stringify([b.conditions, b.conditionDetails]); }));

// 7. reload keeps it
await page.reload();
await page.click('.block-item');
log('after reload:', await chipState(['Unaware', 'Blind', 'Deaf']));
await page.evaluate(() => document.fonts.ready);
await page.locator('fieldset:has(#conditions)').screenshot({ path: `${OUT}/reverse.png` });

// 8. import with Blind + Unaware(Visual) together -> Blind dropped
const dirty = { version: 1, blocks: [{ id: 'x', name: 'Dirty', conditions: ['Blind', 'Deaf', 'Unaware'], conditionDetails: { Unaware: 'Visual' } }] };
await page.evaluate((d) => {
    const f = new File([JSON.stringify(d)], 'd.json', { type: 'application/json' });
    const dt = new DataTransfer(); dt.items.add(f);
    const input = document.getElementById('file-import'); input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
}, dirty);
page.once('dialog', (d) => d.accept());
await page.waitForTimeout(500);
console.log('import Blind+Deaf+Unaware(Visual) ->', await page.evaluate(() => { const b = JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0]; return JSON.stringify([b.conditions, b.conditionDetails]); }));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

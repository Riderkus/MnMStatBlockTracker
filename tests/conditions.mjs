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
const state = () => page.evaluate(() => {
    const out = {};
    for (const cb of document.querySelectorAll('[data-condition]')) {
        const by = cb.parentElement.querySelector('.chip-by').textContent;
        out[cb.dataset.condition] = (cb.checked ? 'ON' : 'off') + (cb.disabled ? ` (${by})` : '');
    }
    return out;
});
const active = () => page.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].conditions);
const show = (label, s, keys) => console.log(label.padEnd(34), keys.map((k) => `${k}=${s[k]}`).join('  '));

await page.goto(`${BASE}/index.html`);
await page.click('#btn-new'); await page.click('#type-dialog [data-type="block"]');
await page.fill('#f-name', 'Rules test');

// 1. Dazed, then Stunned -> Dazed off + grayed
await chip('Dazed').click();
await chip('Stunned').click();
let s = await state();
show('Dazed then Stunned:', s, ['Dazed', 'Stunned', 'Entranced']);

// 2. Tapping the grayed Dazed chip must do nothing
await chip('Dazed').click({ force: true });
s = await state();
show('tap grayed Dazed:', s, ['Dazed', 'Stunned']);

// 3. Unticking Stunned re-enables Dazed, still off
await chip('Stunned').click();
s = await state();
show('Stunned off again:', s, ['Dazed', 'Stunned', 'Entranced']);

// 4. Controlled supersedes Compelled
await chip('Compelled').click();
await chip('Controlled').click();
s = await state();
show('Compelled then Controlled:', s, ['Compelled', 'Controlled']);

// 5. Incapacitated covers the whole chain
await chip('Vulnerable').click();
await chip('Hindered').click();
await chip('Incapacitated').click();
s = await state();
show('Incapacitated chain:', s, ['Incapacitated', 'Staggered', 'Stunned', 'Dazed', 'Entranced', 'Defenseless', 'Vulnerable', 'Hindered', 'Prone']);
await page.waitForTimeout(400);
console.log('stored conditions:', JSON.stringify(await active()));

// 6. Reload keeps the grayed state
await page.reload();
await page.click('.block-item');
s = await state();
show('after reload:', s, ['Incapacitated', 'Dazed', 'Controlled', 'Compelled']);
await page.evaluate(() => document.fonts.ready);
await page.locator('#conditions').screenshot({ path: `${OUT}/conditions.png` });

// 7. Import a file that lists Dazed AND Stunned together -> Dazed dropped
const dirty = { version: 1, blocks: [{ id: 'abc', name: 'Dirty import', conditions: ['Stunned', 'Dazed', 'Fatigued', 'Exhausted', 'Bogus'] }] };
await page.evaluate((d) => {
    const f = new File([JSON.stringify(d)], 'dirty.json', { type: 'application/json' });
    const dt = new DataTransfer(); dt.items.add(f);
    const input = document.getElementById('file-import'); input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
}, dirty);
page.once('dialog', (d) => d.accept()); // "replace" prompt
await page.waitForTimeout(500);
const imported = await page.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks.map((b) => [b.name, b.conditions]));
console.log('imported + normalised:', JSON.stringify(imported));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

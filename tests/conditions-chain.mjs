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
const covered = () => page.evaluate(() => {
    const out = {};
    for (const cb of document.querySelectorAll('[data-condition]')) {
        if (cb.disabled) out[cb.dataset.condition] = cb.parentElement.querySelector('.chip-by').textContent.replace('← ', '');
    }
    return out;
});
const clearAll = async () => {
    for (const cb of await page.$$('[data-condition]:checked')) await cb.evaluate((el) => el.parentElement.click());
};

await page.goto(`${BASE}/index.html`);
await page.click('#btn-new'); await page.click('#type-dialog [data-type="block"]');
await page.fill('#f-name', 'All conditions');
console.log('chip count:', await page.locator('label.chip').count());

const cases = [
    ['Dying',      ['Incapacitated', 'Staggered', 'Stunned', 'Dazed', 'Entranced', 'Defenseless', 'Vulnerable', 'Unaware', 'Hindered']],
    ['Bound',      ['Defenseless', 'Vulnerable', 'Immobile', 'Hindered', 'Impaired', 'Restrained']],
    ['Paralyzed',  ['Defenseless', 'Vulnerable', 'Immobile', 'Hindered', 'Stunned', 'Dazed', 'Entranced']],
    ['Asleep',     ['Defenseless', 'Vulnerable', 'Stunned', 'Dazed', 'Entranced', 'Unaware']],
    ['Debilitated',['Disabled', 'Impaired']],
    ['Exhausted',  ['Fatigued', 'Hindered', 'Impaired']],
    ['Blind',      ['Hindered', 'Vulnerable']],
    ['Surprised',  ['Stunned', 'Dazed', 'Entranced', 'Vulnerable']],
    ['Deaf',       []],
    ['Weakened',   []],
    ['Transformed',[]],
    ['Unaware',    []],
];
let ok = true;
for (const [name, expect] of cases) {
    await clearAll();
    await chip(name).click();
    const got = Object.keys(await covered()).sort();
    const want = [...expect].sort();
    const pass = JSON.stringify(got) === JSON.stringify(want);
    if (!pass) ok = false;
    console.log((pass ? 'PASS' : 'FAIL').padEnd(5), name.padEnd(12), 'covers:', got.join(', ') || '(nothing)');
}
await page.evaluate(() => document.fonts.ready);
await clearAll();
await chip('Dying').click();
await chip('Bound').click();
await page.locator('#conditions').screenshot({ path: `${OUT}/conditions-all.png` });
console.log('all cases pass:', ok);
console.log('errors:', errors.length ? errors : 'none');
await browser.close();

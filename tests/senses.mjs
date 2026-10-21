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
const senseState = () => page.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll('#condition-details label.chip.mini')].map((l) => {
        const cb = l.querySelector('input');
        return [l.firstChild.nextSibling.textContent, (cb.checked ? 'ON' : 'off') + (cb.disabled ? ' (' + l.querySelector('.chip-by').textContent + ')' : '')];
    })
));
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].conditionDetails);
const badge = () => page.evaluate(() => [...document.querySelectorAll('.block-item .badge')].map((b) => b.textContent).join(' | '));

await page.goto(`${BASE}/index.html`);
await page.click('#btn-new'); await page.click('#type-dialog [data-type="block"]');
await page.fill('#f-name', 'Senses');

// placeholders
await chip('Disabled').click();
console.log('Disabled placeholder:  ', await page.getAttribute('.detail-row .detail-text', 'placeholder'));
await chip('Debilitated').click();
console.log('Debilitated toggles:    ', await page.locator('#condition-details label.chip.mini').count());
await chip('Debilitated').click();
await chip('Disabled').click();

// Unaware with only Tactile picked (so Blind/Deaf stay available), then Blind
await chip('Unaware').click();
for (const s of ['Tactile']) await sense(s).click();
await page.waitForTimeout(400);
console.log('before Blind:', JSON.stringify(await senseState()), '| stored:', JSON.stringify(await stored()));
await chip('Blind').click();
await page.waitForTimeout(400);
console.log('after Blind: ', JSON.stringify(await senseState()), '| stored:', JSON.stringify(await stored()), '| badges:', await badge());

// Deaf too
await chip('Deaf').click();
await page.waitForTimeout(400);
console.log('after Deaf:  ', JSON.stringify(await senseState()), '| stored:', JSON.stringify(await stored()));

// grayed Visual can't be tapped
await sense('Visual').click({ force: true });
await page.waitForTimeout(200);
console.log('tap grayed Visual:', (await senseState()).Visual);

// reload keeps grayed state
await page.reload();
await page.click('.block-item');
console.log('after reload:', JSON.stringify(await senseState()));
await page.evaluate(() => document.fonts.ready);
await page.locator('#condition-details').screenshot({ path: `${OUT}/senses.png` });

// unticking Blind frees Visual again (still off)
await chip('Blind').click();
await page.waitForTimeout(200);
console.log('Blind off:   ', JSON.stringify(await senseState()));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

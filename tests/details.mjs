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
const stored = () => page.evaluate(() => {
    const b = JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0];
    return { conditions: b.conditions, details: b.conditionDetails };
});
const badges = () => page.evaluate(() => [...document.querySelectorAll('.block-item .badge')].map((b) => b.textContent));

await page.goto(`${BASE}/index.html`);
await page.click('#btn-new'); await page.click('#type-dialog [data-type="block"]');
await page.fill('#f-name', 'Details test');

console.log('details hidden at start:', await page.locator('#condition-details').isHidden());

// Unaware -> sense toggles appear
await chip('Unaware').click();
console.log('rows after Unaware:', await page.locator('.detail-row').count(), '| hidden:', await page.locator('#condition-details').isHidden());
await sense('Visual').click();
await sense('Tactile').click();
await page.waitForTimeout(400);
console.log('after Visual+Tactile:', JSON.stringify(await stored()), '| badges:', JSON.stringify(await badges()));

// Impaired -> text field
await chip('Impaired').click();
await page.fill('.detail-row .detail-text', 'Strength, Perception');
await page.waitForTimeout(400);
console.log('after Impaired text:', JSON.stringify(await stored()), '| badges:', JSON.stringify(await badges()));

// Reload keeps both
await page.reload();
await page.click('.block-item');
console.log('after reload: rows =', await page.locator('.detail-row').count(),
    '| visual on =', await sense('Visual').evaluate((el) => el.classList.contains('on')),
    '| text =', await page.inputValue('.detail-row .detail-text'));

// Disabled supersedes Impaired -> Impaired row goes away and its detail is pruned
await chip('Disabled').click();
await page.waitForTimeout(400);
console.log('after Disabled:', JSON.stringify(await stored()), '| rows =', await page.locator('.detail-row').count());

// Turning Unaware off clears its senses
await chip('Unaware').click();
await page.waitForTimeout(400);
console.log('after Unaware off:', JSON.stringify(await stored()));

// Screenshot a representative state
await chip('Unaware').click();
await sense('Visual').click();
await page.fill('.detail-row .detail-text', 'Agility');
await page.evaluate(() => document.fonts.ready);
await page.locator('fieldset:has(#conditions)').screenshot({ path: `${OUT}/details.png` });

// Long detail must not overflow the list entry
await page.fill('.detail-row .detail-text', 'Strength, Agility, Dexterity, Fighting, Intellect');
await page.waitForTimeout(400);
console.log('badge inside entry:', await page.evaluate(() => {
    const li = document.querySelector('.block-item');
    return [...li.querySelectorAll('.badge')].every((b) => b.getBoundingClientRect().right <= li.getBoundingClientRect().right + 0.5);
}));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

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

// ---- 1. Render PNG icons from icon.svg ----
for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    const svg = fs.readFileSync(`${APP}/icon.svg`, 'utf8');
    await page.setContent(`<html><body style="margin:0;background:transparent">
        <img src="data:image/svg+xml;utf8,${encodeURIComponent(svg)}" width="${size}" height="${size}" style="display:block"></body></html>`);
    await page.screenshot({ path: `${APP}/icon-${size}.png`, omitBackground: true });
    await page.close();
}
console.log('icons written');

// ---- 2. Smoke test the app ----
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(`${BASE}/index.html`);
await page.waitForSelector('#btn-new');

// create a block
await page.click('#btn-new'); await page.click('#type-dialog [data-type="block"]');
await page.fill('#f-name', 'Doc Nova');
await page.fill('#f-pl', '12');
await page.fill('[data-group="abilities"][data-key="STR"]', '8');
await page.fill('[data-group="defenses"][data-key="Toughness"]', '12');
await page.click('label.chip:has-text("Dazed")');
await page.fill('#f-bruises', '2');
await page.click('#btn-add-power');
await page.fill('#powers .power-name', 'Flight 6');
await page.fill('#powers .power-desc', 'Wings; Subtle');
await page.click('[data-add="skills"]'); await page.fill('#skills .list-row input[type="text"]', 'Perception'); await page.fill('#skills .list-row input[type="number"]', '6');
await page.waitForTimeout(500); // debounce

await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/desktop.png`, fullPage: true });

// reload and verify persistence
await page.reload();
await page.waitForSelector('.block-item');
const listText = await page.textContent('.block-item');
await page.click('.block-item');
const got = await page.evaluate(() => ({
    name: document.querySelector('#f-name').value,
    pl: document.querySelector('#f-pl').value,
    str: document.querySelector('[data-group="abilities"][data-key="STR"]').value,
    tough: document.querySelector('[data-group="defenses"][data-key="Toughness"]').value,
    dazed: document.querySelector('[data-condition="Dazed"]').checked,
    bruises: document.querySelector('#f-bruises').value,
    power: document.querySelector('#powers .power-name').value,
    powerDesc: document.querySelector('#powers .power-desc').value,
    skills: document.querySelector('#skills .list-row input[type="text"]').value + ' ' + document.querySelector('#skills .list-row input[type="number"]').value,
    stored: JSON.parse(localStorage.getItem('statblocks.v1')),
}));
console.log('list item:', listText.trim());
console.log('after reload:', JSON.stringify({ ...got, stored: undefined }));
console.log('stored blocks:', got.stored.blocks.length, 'version', got.stored.version);

// duplicate
await page.click('#btn-duplicate');
await page.waitForTimeout(400);
console.log('after duplicate, list count:', await page.locator('.block-item').count());

// export: intercept download
const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btn-export'),
]);
const exportPath = `${OUT}/${download.suggestedFilename()}`;
await download.saveAs(exportPath);
const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
console.log('exported file:', download.suggestedFilename(), 'blocks:', exported.blocks.length);

// import into a fresh profile (merge path not needed: empty state)
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const m = await ctx2.newPage();
m.on('pageerror', (e) => errors.push('mobile pageerror: ' + e.message));
await m.goto(`${BASE}/index.html`);
await m.waitForSelector('#btn-import');
await m.setInputFiles('#file-import', exportPath);
await m.waitForSelector('.block-item');
console.log('mobile import, list count:', await m.locator('.block-item').count());
await m.evaluate(() => document.fonts.ready);
await m.screenshot({ path: `${OUT}/mobile-list.png` });
await m.click('.block-item');
await m.waitForTimeout(200);
console.log('mobile sidebar hidden while editing:', await m.locator('#sidebar').isHidden());
await m.screenshot({ path: `${OUT}/mobile-editor.png`, fullPage: true });

// service worker registered?
await page.waitForTimeout(800);
const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? (reg.active ? 'active' : reg.installing ? 'installing' : 'waiting') : 'none';
});
console.log('service worker:', swState);

// manifest reachable
const mres = await page.request.get(`${BASE}/manifest.json`);
console.log('manifest status:', mres.status());

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

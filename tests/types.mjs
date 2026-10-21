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
const log = (label, s) => console.log(label.padEnd(40), s);

const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await p.goto(`${BASE}/index.html`);
await p.evaluate(() => document.fonts.ready);

// Which fieldsets are visible, by legend text.
const visible = () => p.evaluate(() => [...document.querySelectorAll('#block-form fieldset')].filter((f) => !f.hidden && getComputedStyle(f).display !== 'none').map((f) => f.querySelector('legend').textContent));
const heroShown = () => p.evaluate(() => { const l = document.querySelector('#f-hero').closest('label'); return !l.hidden && getComputedStyle(l).display !== 'none'; });
const stored = async (i, k) => { await p.waitForTimeout(450); return p.evaluate(([i, k]) => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[i][k], [i, k]); };

// ---- chooser
await p.click('#btn-new');
log('chooser open / choices:', (await p.evaluate(() => document.getElementById('type-dialog').open)) + ' / ' + (await p.locator('#type-dialog .pick-item').count()));
await p.screenshot({ path: `${OUT}/type-chooser.png` });
await p.click('#type-close');
log('cancel closes, no block made:', (await p.evaluate(() => !document.getElementById('type-dialog').open)) + ' / ' + (await p.locator('.block-item').count()));

// ---- minion
await p.click('#btn-new'); await p.click('#type-dialog [data-type="minion"]');
await p.fill('#f-name', 'Thug');
await p.fill('#f-pl', '3');
await p.fill('[data-key="STR"]', '2'); await p.fill('[data-key="Toughness"]', '3');
await p.click('[data-add="offense"]'); await p.fill('#offense .list-row input[type="text"]', 'Club'); await p.fill('#offense .list-row input[type="number"]', '4'); await p.fill('#offense .list-row .note', 'Damage 3');
await p.fill('textarea[name="notes"]', 'Skills: Intimidation 4. Advantages: Teamwork.');
log('minion sections:', JSON.stringify(await visible()));
log('minion notes legend / hero pts shown:', (await p.textContent('#notes-legend')) + ' / ' + (await heroShown()));
log('minion dropdown value / stored type:', (await p.inputValue('#f-type')) + ' / ' + (await stored(0, 'type')));
log('sidebar meta:', (await p.textContent('.block-item .meta')).trim());
await p.screenshot({ path: `${OUT}/type-minion.png`, fullPage: true });

// ---- character sheet
await p.click('#btn-new'); await p.click('#type-dialog [data-type="sheet"]');
await p.fill('#f-name', 'The Rook');
await p.fill('[data-text="identity.realName"]', 'Jack Cooper');
await p.selectOption('[data-text="identity.status"]', 'Secret');
await p.fill('[data-text="identity.height"]', `6'0"`);
await p.fill('[data-text="background.history"]', 'Grew up in Emerald City.');
await p.fill('#f-hero', '3');
log('sheet sections:', JSON.stringify(await visible()));
log('sheet hero pts shown / legend:', (await heroShown()) + ' / ' + (await p.textContent('#notes-legend')));
await p.waitForTimeout(450);   // let the debounced save run before looking the block up
const sheetIdx = await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks.findIndex((b) => b.name === 'The Rook'));
log('stored identity:', JSON.stringify(await stored(sheetIdx, 'identity')));
log('stored background / hero pts:', JSON.stringify(await stored(sheetIdx, 'background')) + ' / ' + (await stored(sheetIdx, 'heroPoints')));
log('sidebar metas:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.block-item .meta')].map((m) => m.textContent.trim()))));
await p.evaluate(() => window.scrollTo(0, 0));
await p.screenshot({ path: `${OUT}/type-sheet.png`, fullPage: true });

// ---- hero points info card (mouse hover)
await p.hover('#f-hero');
await p.waitForTimeout(600);
log('hero points card:', (await p.evaluate(() => { const c = document.getElementById('info-pop'); return c.hidden ? 'hidden' : c.textContent.trim().slice(0, 70); })));
await p.mouse.move(5, 5);

// ---- switch kind with the dropdown: sheet -> block -> minion -> sheet, nothing lost
await p.selectOption('#f-type', 'block');
log('-> block sections:', JSON.stringify(await visible()));
log('-> block: identity hidden, kept in storage:', (await stored(sheetIdx, 'identity')).realName);
await p.selectOption('#f-type', 'minion');
log('-> minion sections:', JSON.stringify(await visible()));
await p.selectOption('#f-type', 'sheet');
log('-> sheet again, real name field:', await p.inputValue('[data-text="identity.realName"]'));

// ---- reload: everything persists
await p.waitForTimeout(450);
await p.reload();
await p.click('.block-item:has-text("The Rook")');
log('after reload: type / real name / hero:', (await p.inputValue('#f-type')) + ' / ' + (await p.inputValue('[data-text="identity.realName"]')) + ' / ' + (await p.inputValue('#f-hero')));
await p.click('.block-item:has-text("Thug")');
log('after reload: minion sections:', JSON.stringify(await visible()));

// ---- duplicate keeps the kind
await p.click('#btn-duplicate');
log('duplicate of minion is a:', await p.inputValue('#f-type'));

// ---- an old save with no type field becomes a block
await p.waitForTimeout(450);   // let the duplicate's save land first (leaving the page flushes a pending save)
const old = await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('statblocks.v1'));
    s.blocks.push({ id: 'old-1', name: 'Old save', pl: 8 });
    localStorage.setItem('statblocks.v1', JSON.stringify(s));
    return s.blocks.length;
});
await p.reload();
await p.click('.block-item:has-text("Old save")');
log('old save: type / hero pts / real name:', (await p.inputValue('#f-type')) + ' / ' + (await p.inputValue('#f-hero')) + ' / "' + (await p.inputValue('[data-text="identity.realName"]')) + '"');

// ---- phone
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
m.on('pageerror', (e) => errors.push('mobile: ' + e.message));
await m.goto(`${BASE}/index.html`);
await m.evaluate(() => document.fonts.ready);
await m.screenshot({ path: `${OUT}/type-list-mobile.png` });
await m.click('#btn-new');
await m.screenshot({ path: `${OUT}/type-chooser-mobile.png` });
await m.click('#type-dialog [data-type="sheet"]');
await m.waitForTimeout(200);
log('phone head row fits (no overflow):', await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
log('phone head row lines:', await m.evaluate(() => { const r = [...document.querySelectorAll('.editor-head > *')].map((e) => Math.round(e.getBoundingClientRect().top)); return [...new Set(r)].length; }));
await m.screenshot({ path: `${OUT}/type-sheet-mobile.png`, fullPage: true });
await m.click('.block-item, #btn-back').catch(() => {});
await m.selectOption('#f-type', 'minion');
await m.screenshot({ path: `${OUT}/type-minion-mobile.png`, fullPage: true });

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

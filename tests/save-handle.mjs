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
const log = (label, s) => console.log(label.padEnd(48), s);

const ctx = await browser.newContext();
const p = await ctx.newPage();
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
// The picker is the only thing stubbed: it hands back a REAL file handle from
// the origin's private file system, so createWritable, the IndexedDB round
// trip and the restore after reload are all the genuine article.
await p.addInitScript(() => {
    window.showSaveFilePicker = async () => {
        const dir = await navigator.storage.getDirectory();
        return dir.getFileHandle('heroes.json', { create: true });
    };
});
const fileText = () => p.evaluate(async () => { const dir = await navigator.storage.getDirectory(); const h = await dir.getFileHandle('heroes.json'); return (await h.getFile()).text(); });
const names = (txt) => JSON.parse(txt).blocks.map((b) => b.name).join(', ');

await p.goto(`${BASE}/index.html`);
await p.click('#btn-new'); await p.click('#type-dialog [data-type="block"]'); await p.fill('#f-name', 'Alpha');
await p.waitForTimeout(400);
await p.click('#btn-save'); await p.waitForTimeout(400);
log('first save, file holds:', names(await fileText()));

// edit the existing block in the same session: autosave
await p.fill('#f-name', 'Alpha Prime'); await p.waitForTimeout(600);
log('edited (same session), file holds:', names(await fileText()));

// reload: the handle comes back from IndexedDB
await p.reload(); await p.waitForSelector('.block-item');
log('after reload, button tooltip:', await p.getAttribute('#btn-save', 'title'));
await p.click('.block-item'); await p.fill('#f-name', 'Alpha Reloaded'); await p.waitForTimeout(600);
log('edited after reload, before Save, file holds:', names(await fileText()));
await p.click('#btn-save'); await p.waitForTimeout(600);
log('pressed Save, file holds:', names(await fileText()));
log('status:', (await p.textContent('#save-status')).trim());

// further edits after that press
await p.fill('#f-name', 'Alpha Again'); await p.waitForTimeout(600);
log('edited again (autosave), file holds:', names(await fileText()));

// a new block after reload without pressing Save
await p.reload(); await p.waitForSelector('.block-item');
await p.click('#btn-new'); await p.click('#type-dialog [data-type="minion"]'); await p.fill('#f-name', 'Thug'); await p.waitForTimeout(600);
log('new block after reload, before Save, file holds:', names(await fileText()));
await p.click('#btn-save'); await p.waitForTimeout(600);
log('pressed Save, file holds:', names(await fileText()));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

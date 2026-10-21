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

// ---- a browser without the File System Access API: no Save button
const noFs = await browser.newContext();
const n = await noFs.newPage();
await n.addInitScript(() => { delete window.showSaveFilePicker; });
await n.goto(`${BASE}/index.html`);
log('no API: Save button hidden:', await n.evaluate(() => document.getElementById('btn-save').hidden));
await noFs.close();

// ---- Chromium: the button shows; the picker is stubbed with a fake handle
const ctx = await browser.newContext({ acceptDownloads: true });
const p = await ctx.newPage();
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await p.addInitScript(() => {
    window.__written = [];
    window.__picks = 0;
    window.showSaveFilePicker = async (opts) => {
        window.__picks++;
        window.__suggested = opts.suggestedName;
        return {
            name: 'heroes.json',
            requestPermission: async () => 'granted',
            createWritable: async () => ({ write: async (s) => window.__written.push(s), close: async () => {} }),
            getFile: async () => ({ size: new TextEncoder().encode(window.__written.at(-1) || '').length }),   // the read-back check
        };
    };
});
await p.goto(`${BASE}/index.html`);
log('Chromium: Save button shown:', !(await p.evaluate(() => document.getElementById('btn-save').hidden)));

// import "heroes (2).json"
const data = JSON.stringify({ version: 1, blocks: [{ id: 'a1', name: 'Alpha', pl: 10 }, { id: 'b2', name: 'Beta', pl: 8 }] });
await p.setInputFiles('#file-import', { name: 'heroes (2).json', mimeType: 'application/json', buffer: Buffer.from(data) });
await p.waitForSelector('.block-item');
log('imported; remembered file:', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).file)));

// export twice: numbered names
const dl1 = p.waitForEvent('download'); await p.click('#btn-export'); log('export 1 name:', (await dl1).suggestedFilename());
const dl2 = p.waitForEvent('download'); await p.click('#btn-export'); log('export 2 name:', (await dl2).suggestedFilename());
log('counter in the file:', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).file)));

// Save: first press picks a file (suggested name = the imported base), writes it
await p.click('#btn-save'); await p.waitForTimeout(300);
log('picker calls / suggested name:', (await p.evaluate(() => window.__picks)) + ' / ' + (await p.evaluate(() => window.__suggested)));
log('writes so far / blocks in the file:', await p.evaluate(() => window.__written.length + ' / ' + JSON.parse(window.__written.at(-1)).blocks.length));
log('status / button tooltip:', (await p.textContent('#save-status')).trim() + ' / ' + (await p.getAttribute('#btn-save', 'title')));

// an edit now autosaves to the file
await p.click('.block-item:has-text("Alpha")'); await p.fill('#f-name', 'Alpha Prime'); await p.waitForTimeout(500);
log('after an edit: writes / name in file:', await p.evaluate(() => window.__written.length + ' / ' + JSON.parse(window.__written.at(-1)).blocks.find((b) => b.id === 'a1').name));

// second press: no picker, writes again
await p.click('#btn-save'); await p.waitForTimeout(300);
log('second press: picker calls / writes:', await p.evaluate(() => window.__picks + ' / ' + window.__written.length));

// no file from import: date name
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('statblocks.v1')); s.file = null; localStorage.setItem('statblocks.v1', JSON.stringify(s)); });
await p.reload(); await p.waitForSelector('.block-item');
const dl3 = p.waitForEvent('download'); await p.click('#btn-export'); log('export with no imported name:', (await dl3).suggestedFilename());

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

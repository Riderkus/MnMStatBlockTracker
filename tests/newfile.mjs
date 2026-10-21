import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
// Screenshots go next to the tests; the app is the folder above.
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots'); fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:8765';
const browser = await chromium.launch();
const errors = [];
const log = (label, s) => console.log(label.padEnd(44), s);
const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let answer = true, asked = 0;
p.on('dialog', (d) => { asked++; answer ? d.accept() : d.dismiss(); });
await p.addInitScript(() => {   // a fake file for the Save button
    window.__picks = 0; window.__last = '';
    window.showSaveFilePicker = async () => { window.__picks++; return { name: 'fresh.json', requestPermission: async () => 'granted', createWritable: async () => ({ write: async (s) => { window.__last = s; }, close: async () => {} }), getFile: async () => ({ size: new TextEncoder().encode(window.__last).length }) }; };
});
await p.goto(`${BASE}/index.html`);
const names = () => p.evaluate(() => [...document.querySelectorAll('.block-item .name')].map((n) => n.textContent).join(', ') || '(none)');
const stored = async () => { await p.waitForTimeout(450); return p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks.map((b) => b.name).join(', ') || '(none)'); };

// no blocks: no question, just a clean slate (and the file dialog)
await p.click('#btn-newfile'); await p.waitForTimeout(300);
log('empty app: asked / picker opened:', asked + ' / ' + (await p.evaluate(() => window.__picks)));

// with blocks: cancel keeps everything
await p.click('#btn-new'); await p.click('#type-dialog [data-type="block"]'); await p.fill('#f-name', 'Alpha');
await p.click('#btn-new'); await p.click('#type-dialog [data-type="minion"]'); await p.fill('#f-name', 'Thug');
await p.waitForTimeout(450);
answer = false; asked = 0;
await p.click('#btn-newfile'); await p.waitForTimeout(300);
log('cancelled: asked / blocks kept:', asked + ' / ' + (await names()));

// confirm: empty app, old blocks behind Undo, picker for the new file
answer = true; asked = 0;
const picksBefore = await p.evaluate(() => window.__picks);
await p.click('#btn-newfile'); await p.waitForTimeout(400);
log('confirmed: asked / blocks / stored:', asked + ' / ' + (await names()) + ' / ' + (await stored()));
log('editor closed / undo offered:', (await p.isHidden('#editor')) + ' / ' + (await p.textContent('#undo-text')));
log('new file picked / written empty:', ((await p.evaluate(() => window.__picks)) - picksBefore) + ' / ' + (await p.evaluate(() => JSON.parse(window.__last).blocks.length)));
log('Save tooltip names the new file:', await p.getAttribute('#btn-save', 'title'));
await p.screenshot({ path: `${OUT}/newfile.png`, clip: { x: 0, y: 0, width: 1280, height: 200 } });

// undo brings the blocks (and the old file link, none here) back
await p.click('#btn-undo');
log('undo: blocks / stored:', (await names()) + ' / ' + (await stored()));
log('undo: the earlier file link is back too:', await p.getAttribute('#btn-save', 'title'));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

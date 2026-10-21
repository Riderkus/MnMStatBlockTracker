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
const log = (label, s) => console.log(label.padEnd(46), s);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let dialogs = 0; p.on('dialog', (d) => { dialogs++; d.accept(); });   // the delete confirm box
await p.addInitScript(() => {   // a fake file for the Save button
    window.__written = 0;
    window.showSaveFilePicker = async () => ({ name: 'heroes.json', requestPermission: async () => 'granted', createWritable: async () => ({ write: async (s) => { window.__written++; window.__last = s; }, close: async () => {} }), getFile: async () => ({ size: new TextEncoder().encode(window.__last || '').length }) });
});
await p.goto(`${BASE}/index.html`);
await p.evaluate(() => document.fonts.ready);
const make = async (kind, name) => { await p.click('#btn-new'); await p.click(`#type-dialog [data-type="${kind}"]`); await p.fill('#f-name', name); await p.waitForTimeout(50); };
await make('sheet', 'The Rook'); await make('block', 'Dr. Zero'); await make('minion', 'Thug');
// The Play/Edit toggle keeps its state across blocks, so say which view a step needs.
const ensure = async (v) => { const label = await p.textContent('#btn-play'); if ((v === 'play') === (label === 'Play')) await p.click('#btn-play'); };
const names = () => p.evaluate(() => [...document.querySelectorAll('.block-item .name')].map((n) => n.textContent).join(', '));

// --- undo delete
await p.click('.block-item:has-text("Dr. Zero")');
await p.click('#btn-delete');
log('delete: confirm asked, gone, undo bar shown:', dialogs + ' | ' + (await names()) + ' | ' + !(await p.evaluate(() => document.getElementById('undo-bar').hidden)) + ' | ' + (await p.textContent('#undo-text')));
await p.click('#btn-undo');
log('undo: back, editor open on it:', (await names()) + ' | ' + (await p.inputValue('#f-name')));
await p.waitForTimeout(450);
log('stored after undo:', await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks.map((b) => b.name).join(', ')));

// --- undo clear conditions (editor and play view)
await p.click('label.chip:has-text("Dazed")'); await p.fill('#f-bruises', '2');
await p.click('#btn-clear-conditions');
log('clear: chips off, undo offered:', (await p.evaluate(() => document.querySelector('[data-condition="Dazed"]').checked)) + ' / ' + (await p.textContent('#undo-text')));
await p.click('#btn-undo');
log('undo clear: Dazed back, bruises back:', (await p.evaluate(() => document.querySelector('[data-condition="Dazed"]').checked)) + ' / ' + (await p.inputValue('#f-bruises')));
await p.click('#btn-play');
await p.click('#play-conds .btn:has-text("Clear")'); await p.click('#btn-undo');
log('play view: clear then undo, pills:', (await p.textContent('#play-conds')).replace(/\s+/g, ' ').trim());
await p.screenshot({ path: `${OUT}/undo-bar.png`, clip: { x: 700, y: 700, width: 580, height: 200 } });
await p.waitForTimeout(8500);
log('undo bar gone after 8 s:', await p.evaluate(() => document.getElementById('undo-bar').hidden));

// --- kind filter
await p.selectOption('#kind', 'minion'); log('filter minions:', await names());
await p.selectOption('#kind', 'sheet'); log('filter sheets:', await names());
await p.reload(); await p.waitForSelector('.block-item');
log('filter remembered after reload:', (await p.inputValue('#kind')) + ' -> ' + (await names()));
await p.selectOption('#kind', '');

// --- minion: no bruises, Take down
await p.click('.block-item:has-text("Thug")'); await ensure('edit');
log('minion editor: bruises field hidden:', await p.evaluate(() => { const l = document.querySelector('#f-bruises').closest('label'); return getComputedStyle(l).display === 'none'; }));
await ensure('play');
log('minion play counters:', (await p.textContent('#play-counters')).replace(/\s+/g, ' ').trim());
await p.click('.counter:has-text("Down") .btn:nth-of-type(2)');
log('Down +: counters:', (await p.textContent('#play-counters')).replace(/\s+/g, ' ').trim());
await p.click('.counter:has-text("Down") .btn:nth-of-type(1)');
log('Down -: back up:', (await p.textContent('#play-counters')).replace(/\s+/g, ' ').trim());

// --- perception-range bonus
await ensure('edit'); await p.click('[data-add="offense"]');
await p.fill('#offense .list-row:last-child input.fit', 'Gaze'); await p.fill('#offense .list-row:last-child .cell:nth-of-type(1) input', '5');
await p.selectOption('#offense .list-row:last-child .cell:nth-of-type(2) select', 'Perception');
await ensure('play');
log('perception attack bonus cell:', await p.evaluate(() => document.querySelector('#play-body td.num').textContent));

// --- portrait
await p.click('.block-item:has-text("The Rook")'); await ensure('edit');
p.on('framenavigated', (f) => { if (f === p.mainFrame()) errors.push('unexpected navigation to ' + f.url()); });
const png = await p.screenshot({ clip: { x: 0, y: 0, width: 120, height: 60 } });   // any real PNG will do
await p.setInputFiles('#file-portrait', { name: 'rook.png', mimeType: 'image/png', buffer: png });
await p.waitForTimeout(600);
const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks.find((b) => b.name === 'The Rook').portrait);
log('portrait stored as:', stored.slice(0, 22) + '... (' + stored.length + ' chars)');
log('portrait shown in editor / list / play:', (await p.isVisible('#portrait-img')) + ' / ' + (await p.locator('.block-item:has-text("The Rook") img.thumb').count()) + ' / ' + (await (async () => { await ensure('play'); const v = await p.isVisible('#play-portrait'); await ensure('edit'); return v; })()));
log('portrait sizes: editor box / play:', (await p.evaluate(() => document.getElementById('portrait').getBoundingClientRect().width)) + ' / ' + (await (async () => { await ensure('play'); const w = await p.evaluate(() => document.getElementById('play-portrait').getBoundingClientRect().width); await ensure('edit'); return w; })()));
await p.click('#btn-portrait');
log('tap the picture: lightbox open:', await p.evaluate(() => document.getElementById('lightbox').open));
await p.mouse.click(640, 450);
log('tap again: closed:', !(await p.evaluate(() => document.getElementById('lightbox').open)));
log('cross hidden until hover:', (await p.evaluate(() => getComputedStyle(document.getElementById('btn-portrait-remove')).opacity)) + ' -> ' + (await (async () => { await p.hover('#portrait'); await p.waitForTimeout(250); return p.evaluate(() => getComputedStyle(document.getElementById('btn-portrait-remove')).opacity); })()));
log('square 256:', await p.evaluate(() => new Promise((r) => { const i = new Image(); i.onload = () => r(i.width + 'x' + i.height); i.src = document.getElementById('portrait-img').src; })));
await p.screenshot({ path: `${OUT}/portrait-editor.png`, clip: { x: 370, y: 60, width: 860, height: 140 } });
await p.click('#btn-portrait-remove'); await p.waitForTimeout(450);
log('removed:', JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('statblocks.v1')).blocks.find((b) => b.name === 'The Rook').portrait)) + ' / plus shown: ' + (await p.isVisible('#portrait-plus')));
await p.setInputFiles('#file-portrait', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') }); await p.waitForTimeout(400);
log('empty square is small again:', await (async () => { await p.mouse.move(5, 5); return p.evaluate(() => document.getElementById('portrait').getBoundingClientRect().width); })());
log('a non-image is refused:', (await p.textContent('#save-status')).trim());

// --- save dot
log('no file yet: dot off:', !(await p.evaluate(() => document.getElementById('btn-save').classList.contains('dirty'))));
await p.click('#btn-save'); await p.waitForTimeout(300);
await p.fill('#f-name', 'The Rook II'); await p.waitForTimeout(500);
log('file linked and allowed: edit autosaved, dot off:', (await p.evaluate(() => window.__written)) + ' writes / dirty ' + (await p.evaluate(() => document.getElementById('btn-save').classList.contains('dirty'))));

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

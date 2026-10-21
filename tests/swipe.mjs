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
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
m.on('pageerror', (e) => errors.push(e.message));
await m.goto(`${BASE}/index.html`);
await m.click('#btn-new'); await m.click('#type-dialog [data-type="sheet"]');
for (const n of ['A', 'B']) { await m.click('[data-add="skills"]'); await m.fill('#skills .list-row:last-child input.fit', n); }
await m.click('#btn-play');
await m.evaluate(() => document.getElementById('play-tabs').scrollIntoView({ block: 'center' })); await m.waitForTimeout(300);
const active = () => m.evaluate(() => document.querySelector('#play-tabs .tab[aria-pressed="true"]').textContent);
const style = () => m.evaluate(() => { const s = document.getElementById('play-body').style; return `transform="${s.transform}" opacity="${s.opacity}"`; });
const cdp = await m.context().newCDPSession(m);
const swipe = async (dx, dy, sel) => {
    const r = await m.locator(sel).boundingBox(); const x0 = r.x + r.width / 2, y0 = r.y + Math.min(20, r.height / 2);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    let mid = '';
    for (let i = 1; i <= 6; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + dx * i / 6, y: y0 + dy * i / 6 }] });
        if (i === 4) mid = await style();
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await m.waitForTimeout(500);
    return mid;
};
log('start:', await active());
let mid = await swipe(-120, 5, '#play-body');
log('swipe left on the body: mid-swipe', mid);
log('  -> tab / settled:', (await active()) + ' / ' + (await style()));
await swipe(-120, 5, '#play-tabs');
log('swipe on the tab row: tab unchanged:', await active());
log('tab row: free to scroll sideways:', await m.evaluate(() => { const t = document.getElementById('play-tabs'); return getComputedStyle(t).touchAction + ', wider than box: ' + (t.scrollWidth > t.clientWidth); }));
mid = await swipe(-30, 0, '#play-body');
log('short flick: mid-swipe', mid);
log('  -> eases back, tab unchanged:', (await active()) + ' / ' + (await style()));
await swipe(120, 0, '#play-body'); log('swipe right ->', await active());
await swipe(120, 0, '#play-body'); log('right at the first tab (stays) ->', await active());
mid = await swipe(-10, 150, '#play-body');
log('vertical move: contents not dragged:', mid + ' -> ' + (await active()));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();

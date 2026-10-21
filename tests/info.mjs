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
const log = (label, s) => console.log(label.padEnd(36), s);
const popState = (p) => p.evaluate(() => {
    const pop = document.getElementById('info-pop');
    const r = pop.getBoundingClientRect();
    return { hidden: pop.hidden, title: pop.querySelector('.info-title')?.textContent, text: (pop.querySelector('p')?.textContent || '').slice(0, 40), inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight };
});

// ---------------- desktop: hover
const d = await browser.newPage({ viewport: { width: 1280, height: 900 } });
d.on('pageerror', (e) => errors.push('desktop: ' + e.message));
await d.goto(`${BASE}/index.html`);
await d.click('#btn-new'); await d.click('#type-dialog [data-type="block"]'); await d.fill('#f-name', 'Info test');
await d.click('label.chip:has([data-condition="Dazed"])');
await d.evaluate(() => document.fonts.ready);

await d.hover('label.chip:has([data-condition="Stunned"])');
await d.waitForTimeout(100);
log('hover 100ms (should still hide):', (await popState(d)).hidden);
await d.waitForTimeout(400);
let s = await popState(d);
log('hover Stunned:', `${s.hidden ? 'hidden' : 'shown'} | ${s.title} | "${s.text}…" | in view: ${s.inView}`);
await d.screenshot({ path: `${OUT}/info-hover.png`, clip: { x: 300, y: 300, width: 700, height: 350 } });

await d.hover('#abilities .stat:has([data-key="AWE"])'); await d.waitForTimeout(500);
s = await popState(d); log('hover AWE box:', `${s.title} | "${s.text}…"`);
await d.hover('#defenses .stat:has([data-key="Toughness"])'); await d.waitForTimeout(500);
s = await popState(d); log('hover Toughness box:', `${s.title} | "${s.text}…"`);
await d.hover('label.chip:has([data-condition="Debilitated"])'); await d.waitForTimeout(500);
log('hover Debilitated has table:', await d.evaluate(() => !!document.querySelector('#info-pop table')));
await d.hover('.block-item .badge'); await d.waitForTimeout(500);
s = await popState(d); log('hover list badge (Dazed):', `${s.title}`);

// move away -> hides
await d.mouse.move(640, 60); await d.waitForTimeout(300);
log('moved away:', (await popState(d)).hidden ? 'hidden' : 'STILL SHOWN');

// hover then move onto the card and click "More"
await d.hover('label.chip:has([data-condition="Dying"])'); await d.waitForTimeout(500);
await d.hover('#info-pop .info-more'); await d.waitForTimeout(200);
log('moved onto card:', (await popState(d)).hidden ? 'HIDDEN' : 'still shown');
await d.click('#info-pop .info-more');
await d.waitForTimeout(300);
log('after More:', await d.evaluate(() => {
    const dlg = document.getElementById('ref-dialog');
    const chosen = [...document.querySelectorAll('.ref-nav .tab[aria-pressed="true"]')].map((t) => t.textContent).join(',');
    const entry = document.getElementById('ref-entry-dying');
    const body = document.getElementById('ref-body').getBoundingClientRect();
    const r = entry?.getBoundingClientRect();
    return `dialog open: ${dlg.open} | tab: ${chosen} | Dying entry visible: ${r && r.top >= body.top - 2 && r.top < body.bottom} | card hidden: ${document.getElementById('info-pop').hidden}`;
}));
await d.click('#ref-close');
await d.close();

// ---------------- mobile: tap toggles, long press shows
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
m.on('pageerror', (e) => errors.push('mobile: ' + e.message));
await m.goto(`${BASE}/index.html`);
await m.click('#btn-new'); await m.click('#type-dialog [data-type="block"]'); await m.fill('#f-name', 'Info mobile');
await m.evaluate(() => document.fonts.ready);
const checked = (name) => m.evaluate((n) => document.querySelector(`[data-condition="${n}"]`).checked, name);

await m.tap('label.chip:has([data-condition="Prone"])');
await m.waitForTimeout(200);
log('mobile quick tap Prone:', `checked: ${await checked('Prone')} | card: ${(await popState(m)).hidden ? 'hidden' : 'SHOWN'}`);

// long press: pointerdown, hold, pointerup
const chip = await m.$('label.chip:has([data-condition="Stunned"])');
const box = await chip.boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
const cdp = await m.context().newCDPSession(m);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
await m.waitForTimeout(700);
s = await popState(m);
log('mobile long press Stunned (held):', `${s.hidden ? 'hidden' : 'shown'} | ${s.title} | in view: ${s.inView}`);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await m.waitForTimeout(300);
log('after release:', `Stunned checked: ${await checked('Stunned')} (should be false) | card stays: ${!(await popState(m)).hidden}`);
await m.screenshot({ path: `${OUT}/info-mobile.png` });

// tap elsewhere hides it
await m.tap('#f-name'); await m.waitForTimeout(200);
log('tap elsewhere:', (await popState(m)).hidden ? 'hidden' : 'STILL SHOWN');

// a normal tap afterwards must still toggle
await m.tap('label.chip:has([data-condition="Stunned"])');
await m.waitForTimeout(300);
log('mobile tap Stunned after:', `checked: ${await checked('Stunned')} (should be true) | card: ${(await popState(m)).hidden ? 'hidden' : 'SHOWN'}`);

console.log('errors:', errors.length ? errors : 'none');
await browser.close();

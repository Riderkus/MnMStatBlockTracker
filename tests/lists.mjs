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
const log = (label, s) => console.log(label.padEnd(34), s);

const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await p.goto(`${BASE}/index.html`);
await p.click('#btn-new'); await p.click('#type-dialog [data-type="block"]'); await p.fill('#f-name', 'Lists');
await p.fill('[data-key="AGL"]', '3'); await p.fill('[data-key="AWE"]', '2');
const pp = () => p.evaluate(() => ({ skills: +document.getElementById('pp-skills').textContent, adv: +document.getElementById('pp-advantages').textContent, powers: +document.getElementById('pp-powers').textContent, spent: +document.getElementById('pp-spent').textContent }));
const stored = async (k) => { await p.waitForTimeout(450); return p.evaluate((k) => JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0][k], k); };   // wait out the debounced save

// blank rows
await p.click('[data-add="skills"]');
await p.fill('#skills .list-row:nth-child(1) input[type="text"]', 'Acrobatics');
await p.selectOption('#skills .list-row:nth-child(1) select', 'AGL');
await p.fill('#skills .list-row:nth-child(1) input[type="number"]', '8');
log('skill Acrobatics 8 + AGL 3: total', await p.textContent('#skills .list-row:nth-child(1) .total'));
await p.fill('[data-key="AGL"]', '5'); log('AGL -> 5: total follows', await p.textContent('#skills .list-row:nth-child(1) .total'));
await p.click('[data-add="advantages"]'); await p.fill('#advantages .list-row:nth-child(1) input[type="text"]', 'Evasion'); await p.fill('#advantages .list-row:nth-child(1) input[type="number"]', '2');
await p.click('[data-add="offense"]'); await p.fill('#offense .list-row:nth-child(1) input[type="text"]', 'Unarmed'); await p.fill('#offense .list-row:nth-child(1) input[type="number"]', '10'); await p.selectOption('#offense .list-row:nth-child(1) select', 'Close'); await p.fill('#offense .list-row:nth-child(1) .note', 'Damage 2');
await p.click('[data-add="complications"]'); await p.fill('#complications .list-row:nth-child(1) input[type="text"]', 'Secret identity'); await p.fill('#complications .list-row:nth-child(1) textarea', 'Nobody knows');
await p.waitForTimeout(400);
log('PP after blank rows:', JSON.stringify(await pp()));   // skills ceil(8/2)=4, adv 2

// picker: skills
await p.click('[data-pick="skills"]');
log('picker open / items:', (await p.evaluate(() => document.getElementById('pick-dialog').open)) + ' / ' + (await p.locator('#pick-body .pick-item').count()));
await p.fill('#pick-search', 'percep'); log('filter "percep":', await p.locator('#pick-body .pick-item').count());
await p.click('#pick-body .pick-item');
log('picked Perception:', JSON.stringify((await stored('skills'))[1]) + ' | dialog closed: ' + !(await p.evaluate(() => document.getElementById('pick-dialog').open)));
log('Perception total (1 + AWE 2):', await p.textContent('#skills .list-row:nth-child(2) .total'));
// picker: advantages
await p.click('[data-pick="advantages"]'); await p.fill('#pick-search', 'improved initiative'); await p.click('#pick-body .pick-item');
log('picked Improved Initiative:', JSON.stringify((await stored('advantages'))[1]));
// picker: powers with per-rank cost
await p.click('[data-pick="powers"]'); await p.fill('#pick-search', 'flight'); await p.click('#pick-body .pick-item:has-text("Flight")');
await p.waitForTimeout(450);
log('picked Flight:', JSON.stringify(await p.evaluate(() => { const x = JSON.parse(localStorage.getItem('statblocks.v1')).blocks[0].powers[0]; return { name: x.name, rank: x.rank, cost: x.cost, perRank: x.perRank, desc: x.desc.slice(0, 40) }; })));
await p.fill('#powers .power-row:nth-child(1) .power-rank input', '6'); await p.waitForTimeout(300);
log('Flight rank 6 -> cost', await p.inputValue('#powers .power-row:nth-child(1) .power-cost input') + ' (2 per rank)');
await p.fill('#powers .power-row:nth-child(1) .power-cost input', '15'); await p.fill('#powers .power-row:nth-child(1) .power-rank input', '7'); await p.waitForTimeout(300);
log('cost edited to 15, rank 7: cost stays', await p.inputValue('#powers .power-row:nth-child(1) .power-cost input'));
// picker: complications
await p.click('[data-pick="complications"]'); await p.fill('#pick-search', 'phobia'); await p.click('#pick-body .pick-item');
log('picked Phobia:', JSON.stringify((await stored('complications'))[1]).slice(0, 90));
await p.waitForTimeout(400);
log('PP totals:', JSON.stringify(await pp()));   // skills ceil(9/2)=5, adv 3, powers 15
log('list meta:', await p.textContent('.block-item .meta'));

// remove a row
await p.click('#advantages .list-row:nth-child(1) .icon'); await p.waitForTimeout(300);
log('removed Evasion:', JSON.stringify((await stored('advantages')).map((a) => a.name)) + ' | adv PP ' + (await pp()).adv);

// reload
await p.reload(); await p.click('.block-item'); await p.waitForTimeout(100);
log('after reload rows:', `skills ${await p.locator('#skills .list-row').count()}, adv ${await p.locator('#advantages .list-row').count()}, offense ${await p.locator('#offense .list-row').count()}, comp ${await p.locator('#complications .list-row').count()} | PP ${JSON.stringify(await pp())}`);

// old free-text save migrates
const old = { version: 1, blocks: [{ id: 'o', name: 'Old text', pl: 10, abilities: { AGL: 2 }, skills: 'Acrobatics 8 (+10), Perception 6 (+8), Expertise: Science 4', advantages: 'Agile Feint, Evasion 2, Improved Initiative', offense: 'Unarmed +10 (Close, Damage 2), Blast +8 (Ranged, Damage 8)', complications: 'Motivation: Justice. Secret identity', powers: [{ name: 'Flight 6', desc: 'x', cost: 12 }], pp: { skills: 20, advantages: 4, other: 1 } }] };
await p.evaluate((d) => { const f = new File([JSON.stringify(d)], 'o.json', { type: 'application/json' }); const dt = new DataTransfer(); dt.items.add(f); const i = document.getElementById('file-import'); i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true })); }, old);
p.once('dialog', (d) => d.accept()); await p.waitForTimeout(500); await p.click('.block-item');
log('migrated skills:', JSON.stringify(await stored('skills')));
log('migrated advantages:', JSON.stringify(await stored('advantages')));
log('migrated offense:', JSON.stringify(await stored('offense')));
log('migrated complications:', JSON.stringify(await stored('complications')));
log('migrated pp (lumps vs lists):', JSON.stringify(await stored('pp')) + ' | PP ' + JSON.stringify(await pp()));
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: `${OUT}/lists-desktop.png`, fullPage: true });
await p.click('[data-pick="powers"]'); await p.waitForTimeout(200); await p.screenshot({ path: `${OUT}/picker.png` }); await p.click('#pick-close');
console.log('desktop errors:', errors.length ? errors : 'none');
await p.close();

const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
m.on('pageerror', (e) => errors.push('mobile: ' + e.message));
await m.goto(`${BASE}/index.html`); await m.click('#btn-new'); await m.click('#type-dialog [data-type="block"]');
await m.click('[data-add="skills"]'); await m.click('[data-add="offense"]'); await m.click('[data-add="advantages"]'); await m.click('#btn-add-power');
await m.evaluate(() => document.fonts.ready); await m.waitForTimeout(200);
log('mobile no horizontal scroll:', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
log('mobile rows inside editor:', await m.evaluate(() => { const ed = document.getElementById('editor').getBoundingClientRect(); return [...document.querySelectorAll('.list-row, .power-row')].every((r) => r.getBoundingClientRect().right <= ed.right + 1); }));
await m.screenshot({ path: `${OUT}/lists-mobile.png`, fullPage: true });
await m.tap('[data-pick="advantages"]'); await m.waitForTimeout(200); await m.screenshot({ path: `${OUT}/picker-mobile.png` });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();

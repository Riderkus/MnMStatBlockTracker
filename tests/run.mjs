/* Runs the test scripts in this folder against a local copy of the app.
 *
 *   node run.mjs            every *.mjs here except this file
 *   node run.mjs play swipe just those (names without .mjs)
 *
 * Starts `python -m http.server 8765` in the app folder (the folder above),
 * runs each script with node, prints its output, and stops the server.
 * A script "passes" when it exits 0 and its last line says "errors: none".
 */
import { spawn, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import http from 'node:http';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const wanted = process.argv.slice(2);
const scripts = readdirSync(here).filter((f) => f.endsWith('.mjs') && f !== 'run.mjs' && (!wanted.length || wanted.includes(f.replace(/\.mjs$/, '')))).sort();
if (!scripts.length) { console.error('No tests match', wanted); process.exit(2); }

// The server. "python" on Windows, "python3" elsewhere if that is what exists.
const python = process.platform === 'win32' ? 'python' : 'python3';
const server = spawn(python, ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { cwd: app, stdio: 'ignore' });
const up = () => new Promise((resolve) => { http.get('http://127.0.0.1:8765/index.html', (r) => { r.resume(); resolve(r.statusCode === 200); }).on('error', () => resolve(false)); });
for (let i = 0; i < 50 && !(await up()); i++) await new Promise((r) => setTimeout(r, 100));
if (!(await up())) { server.kill(); console.error('Could not start the test server on port 8765 (is python on the PATH, or the port in use?)'); process.exit(2); }

let failed = 0;
for (const script of scripts) {
    console.log(`\n=== ${script} ===`);
    const r = spawnSync(process.execPath, [path.join(here, script)], { encoding: 'utf8' });
    process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    const ok = r.status === 0 && /errors:\s+none\s*$/.test(r.stdout.trim());
    if (!ok) failed++;
    console.log(ok ? '--- ok' : '--- FAILED');
}
server.kill();
console.log(`\n${scripts.length - failed} of ${scripts.length} passed`);
process.exit(failed ? 1 : 0);

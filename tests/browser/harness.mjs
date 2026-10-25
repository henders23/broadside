// Shared set-up for the browser suites: a static server for the repository, headless Chromium with software WebGL,
// three.js served from node_modules instead of the CDN, and the helpers every suite uses.
// Run one suite with `node tests/browser/<suite>.mjs`, or all of them with `node tests/browser/run.mjs`.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
export const KEY = 'broadside-campaign-v1';
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg' };

async function playwright() {
  for (const spec of [process.env.PLAYWRIGHT, 'playwright', '/opt/node-tools/node_modules/playwright/index.mjs'].filter(Boolean)) {
    try { return await import(spec.startsWith('/') ? pathToFileURL(spec).href : spec); } catch (e) { /* try the next */ }
  }
  throw new Error('Playwright not found: npm install playwright, or set PLAYWRIGHT to its index.mjs');
}
function threeDir() {
  const dirs = [process.env.THREE_DIR, join(ROOT, 'node_modules', 'three')].filter(Boolean);
  const d = dirs.find(x => existsSync(join(x, 'build', 'three.module.js')));
  if (!d) throw new Error('three.js 0.169.0 not found: npm install three@0.169.0, or set THREE_DIR');
  return d;
}
function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!path.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try { const body = await readFile(path.endsWith('/') ? join(path, 'index.html') : path); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body); }
    catch (e) { res.writeHead(404).end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

// suite(name, opts, body): runs one suite. opts.random fixes the campaign's random rolls (e.g. 0.99: no ambushes).
export async function suite(name, opts, body) {
  const { chromium } = await playwright(), three = threeDir(), server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`, out = join(ROOT, 'tests', 'browser', 'out', name);
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  await ctx.route('https://cdn.jsdelivr.net/npm/three@0.169.0/**', r => { const p = new URL(r.request().url()).pathname.replace('/npm/three@0.169.0/', ''); r.fulfill({ body: readFileSync(join(three, p)), contentType: 'application/javascript' }); });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  if (opts.random != null) await ctx.addInitScript(v => { window.__campaignRandom = () => v; }, opts.random);
  const page = await ctx.newPage(), errors = [];
  page.setDefaultNavigationTimeout(120000);   // software WebGL on a busy runner can take a while to fire `load`
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_FAILED|404/.test(m.text())) errors.push('console: ' + m.text()); });
  let pass = 0, fail = 0;
  const check = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
  const t = {
    page, ctx, base, out, KEY, check, errors,
    shot: n => page.screenshot({ path: `${out}/${n}.png` }),
    read: (k = KEY) => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k),
    write: s => page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, s]),
    patch: p => page.evaluate(([k, p]) => { const s = JSON.parse(localStorage.getItem(k)); Object.assign(s, p); localStorage.setItem(k, JSON.stringify(s)); }, [KEY, p]),
    random: v => page.evaluate(v => { const q = [].concat(v); window.__campaignRandom = () => q.length > 1 ? q.shift() : q[0]; }, v),
    jump: async id => { await page.locator(`.sys[data-id="${id}"] .dot`).hover(); await page.waitForTimeout(200); await page.locator(`.sys[data-id="${id}"] .course button`).click(); },
    // Waits for a battle page (opened with ?sim) to be playing.
    playing: async (timeout = 240000) => { await page.waitForFunction(() => window.__sim && window.__sim.state === 'playing', null, { timeout }); await page.waitForTimeout(1000); }
  };
  try { await body(t); }
  catch (e) { check(false, 'suite crashed: ' + (e && e.message ? e.message.split('\n')[0] : e)); }
  check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 5).join(' | ') : ''));
  await browser.close(); server.close();
  console.log(`${name}: ${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

// Renders the prologue's ship shots from the original high-detail models (not in the repository: the .glb files
// are in Google Drive). Put the models in $S/models and this folder's files in $S/render, run `S=<dir> node daemon.mjs`,
// then GET http://127.0.0.1:8765/render?s=<scene>&w=1920&h=1080 (add &frames=216 for a clip's frames). Each scene
// is a JSON file: ships (model, pos, rot, engines), camera, planet, nebulae, lights, glows and tracers. Positions
// given as [from, to] move over a clip. Needs Playwright and three.js 0.169.0 (see tests/browser/run.mjs).
import { createServer } from 'node:http'; import { readFile, mkdir } from 'node:fs/promises'; import { join } from 'node:path';
const { chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs');
const S = process.env.S, roots = { '/three/': '/home/user/broadside/node_modules/three/', '/models/': S + '/models/', '/': S + '/render/' };
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let pg = null, busy = Promise.resolve();
async function render(name, frames, w, h) {
  if (!pg) { pg = await b.newPage({ viewport: { width: 1920, height: 1080 } }); pg.on('pageerror', e => console.log('ERR', e.message)); await pg.goto(base + '/scene.html'); await pg.waitForFunction(() => window.__done, null, { timeout: 600000 }); }
  const D = JSON.parse(await readFile(`${S}/render/${name}.json`, 'utf8')); D.w = w; D.h = h; await pg.setViewportSize({ width: w, height: h });
  await pg.evaluate(D => window.build(D), D);
  if (frames === 1) { await pg.screenshot({ path: `${S}/render/${name}.png` }); return 'ok ' + name; }
  await mkdir(`${S}/render/${name}`, { recursive: true });
  for (let i = 0; i < frames; i++) { await pg.evaluate(u => window.renderAt(u), i / (frames - 1)); await pg.screenshot({ path: `${S}/render/${name}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 95 }); }
  return 'ok ' + name + ' ' + frames;
}
const srv = createServer(async (q, res) => { const u = new URL(q.url, 'http://x'), p = decodeURIComponent(u.pathname);
  if (p === '/render') { const job = busy.then(() => render(u.searchParams.get('s'), +u.searchParams.get('frames') || 1, +u.searchParams.get('w') || 1280, +u.searchParams.get('h') || 720)).catch(e => 'FAIL ' + e.message); busy = job; res.writeHead(200).end(await job); return; }
  const k = Object.keys(roots).find(k => p.startsWith(k)); try { const body = await readFile(join(roots[k], p.slice(k.length))); res.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html' : p.endsWith('.js') ? 'application/javascript' : 'application/octet-stream' }).end(body); } catch (e) { res.writeHead(404).end(); } });
srv.requestTimeout = 0; srv.timeout = 0; await new Promise(r => srv.listen(8765, '127.0.0.1', r)); const base = 'http://127.0.0.1:8765'; console.log('up');

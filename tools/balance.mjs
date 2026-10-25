// Automated balance testing: the AI flies the player's ship against every story operation and act finale, many times,
// in headless Chromium, faster than real time (see __sim.fight in index.html for how it picks targets and uses officers).
// Prints win rates, fight lengths, hull left on both sides and how fights ended, and records them in
// docs/balance-results.json. Run: node tools/balance.mjs [--runs 3] [--only 8,9,10] [--quick] [--taken]
//   --only    story operations to fly (default: all ten)     --quick   Captain, solo only (no Ensign, Admiral or fleet rows)
//   --taken   also print where the flagship's damage came from (boss, lead, supporting ships)
//   --side    station missions to fly instead, by id (Captain, solo; each leg of a convoy run on its own): --side a2-lifeline,a3-swarm
//   --focused Captain comparative matrix: four solo classes, two mixed fleets of two and two of three
//   --output  write isolated result JSON to the given path (avoids overwriting the historical balance table)
// Needs the same set-up as the browser suites (Playwright and three.js 0.169.0; see tests/browser/harness.mjs).
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const SIDE = arg('side', '') ? arg('side').split(',') : null, RUNS = Number(arg('runs', 3)), ONLY = arg('only', '') ? arg('only').split(',').map(Number) : null, QUICK = process.argv.includes('--quick'), FOCUSED=process.argv.includes('--focused'), OUTPUT=arg('output','');
if(!Number.isInteger(RUNS)||RUNS<1||RUNS>30){console.error('--runs must be an integer from 1 to 30');process.exit(1);}
const HULLS = ['bastion', 'halberd', 'sabre', 'warden'];

async function load(spec) { try { return await import(spec.startsWith('/') ? pathToFileURL(spec).href : spec); } catch (e) { return null; } }
const pw = (await load(process.env.PLAYWRIGHT || 'playwright')) || (await load('/opt/node-tools/node_modules/playwright/index.mjs'));
const three = [process.env.THREE_DIR, join(ROOT, 'node_modules', 'three')].find(d => d && existsSync(join(d, 'build', 'three.module.js')));
if (!pw || !three) { console.error('Needs Playwright and three.js 0.169.0 (see tests/browser/harness.mjs).'); process.exit(1); }
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => { const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))); let body; try { body = await readFile(p); } catch (e) { res.writeHead(404).end(); return; } res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
await ctx.route('https://cdn.jsdelivr.net/npm/three@0.169.0/**', r => { const p = new URL(r.request().url()).pathname.replace('/npm/three@0.169.0/', ''); r.fulfill({ body: readFileSync(join(three, p)), contentType: 'application/javascript' }); });
await ctx.route(/fonts\.(googleapis|gstatic)\.com|\.mp3$/, r => r.abort());
const page = await ctx.newPage();
page.on('pageerror', e => console.error('page error:', String(e)));
await page.goto(base + '/index.html?sim');
await page.waitForFunction(() => window.__sim && window.__sim.state === 'menu', null, { timeout: 300000 });

// One fight: a fresh save with the given fleet and difficulty, the encounter staged as the campaign would stage it.
const fight = (story, fleet, difficulty, side, leg) => page.evaluate(({ story, fleet, difficulty, side, leg }) => {
  const C = window.BroadsideCampaign, save = { version: 1, ships: fleet.map((ship, i) => ({ id: 's' + i, ship, shipName: 'Test ' + ship, hull: 1, sub: null, torps: null, upgrades: [], reserve: false })), flag: 's0',
    completed: [], flags: {}, credits: 0, difficulty, tutorial: 'done', officers: {}, fronts: C.startFronts() };
  localStorage.setItem(C.saveKey(localStorage), JSON.stringify(save));
  const ctx = { flags: {}, fronts: save.fronts };
  return window.__sim.fight(side ? C.encounter({ ...C.sideLeg(C.sideById[side], { leg }), kind: 'side' }, ctx) : C.storyEncounter(story, ctx), 420);
}, { story, fleet, difficulty, side, leg });

const plan = [];
const stories = SIDE ? [] : (ONLY || [1, 2, 3, 8, 4, 6, 9, 5, 7, 10]);
const SIDES = SIDE ? await page.evaluate(ids => ids.map(id => { const m = window.BroadsideCampaign.sideById[id]; return m && { id, name: m.name, legs: m.legs ? m.legs.length : 1 }; }), SIDE) : [];
for (const m of SIDES.filter(Boolean)) for (let leg = 0; leg < m.legs; leg++) for (const h of HULLS) plan.push({ id: m.id, side: m.id, leg, label: m.legs > 1 ? `${m.name} ${leg + 1}/${m.legs}` : m.name, fleet: [h], difficulty: 'captain', group: 'solo, Captain' });
for (const id of stories) for (const h of HULLS) plan.push({ id, fleet: [h], difficulty: 'captain', group: 'solo, Captain' });
if (FOCUSED && !SIDE) for (const id of stories) for (const members of [
  ['halberd','sabre'], ['bastion','sabre'], ['halberd','sabre','warden'], ['bastion','sabre','warden']
]) plan.push({id,fleet:members,difficulty:'captain',group:members.length+'-ship, Captain'});
if (!QUICK && !FOCUSED && !SIDE) for (const id of stories.filter(id => id >= 8)) {
  for (const h of HULLS) for (const d of ['ensign', 'admiral']) plan.push({ id, fleet: [h], difficulty: d, group: 'solo, ' + d[0].toUpperCase() + d.slice(1) });
  plan.push({ id, fleet: ['bastion', 'sabre', 'warden'], difficulty: 'captain', group: 'fleet of three, Captain' });
}
const results = [], t0 = Date.now();
for (const p of plan) for (let r = 0; r < RUNS; r++) {
  const res = await fight(p.id, p.fleet, p.difficulty, p.side, p.leg);
  results.push({ ...p, ...res });
  process.stdout.write(`\r${results.length} of ${plan.length * RUNS} fights · ${Math.round((Date.now() - t0) / 1000)} s`);
}
console.log('\n');
const C = await page.evaluate(() => Object.fromEntries(window.BroadsideCampaign.STORY.map(m => [m.id, m.name])));
const rows = new Map();
for (const r of results) { const k = `${r.side ? r.id + '#' + r.leg : r.id}|${r.group}|${r.fleet.length > 1 ? (FOCUSED ? r.fleet.join('+') : 'fleet') : r.fleet[0]}`; if (!rows.has(k)) rows.set(k, []); rows.get(k).push(r); }
const table = [...rows.entries()].map(([k, rs]) => { const [id, group, who] = k.split('|'); return { id: rs[0].side ? id : +id, name: rs[0].label || C[id], group, who, runs: rs.length,
  win: rs.filter(r => r.outcome === 'win').length / rs.length, time: Math.round(rs.reduce((a, r) => a + r.time, 0) / rs.length), hull: Math.round(100 * rs.reduce((a, r) => a + r.hull, 0) / rs.length),
  foeHull: Math.round(100 * rs.reduce((a, r) => a + (r.foeHull || 0), 0) / rs.length),
  accuracy: Math.round(100 * rs.reduce((a,r)=>a+(r.accuracy||0),0)/rs.length),
  lanceDamage: Math.round(rs.reduce((a,r)=>a+(r.lanceDamage||0),0)/rs.length),
  lanceAlignment: Math.round(100*rs.reduce((a,r)=>a+(r.lanceAlignment||0),0)/rs.length),
  escortDamage: Math.round(rs.reduce((a,r)=>a+(r.escortDamage||0),0)/rs.length),
  taken: Object.entries(rs.reduce((a, r) => { for (const [k, v] of Object.entries(r.tally || {})) a[k] = (a[k] || 0) + v / rs.length; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + ' ' + Math.round(v)).join(', '),
  fleet: rs[0].fleet, timeouts: rs.filter(r => r.outcome === 'timeout').length, codes: Object.entries(rs.reduce((a, r) => (a[r.code || r.outcome] = (a[r.code || r.outcome] || 0) + 1, a), {})).map(([c, n]) => c + ' ' + n).join(', ') }; });
for (const t of table) console.log(`${String(t.id).padStart(2)} ${t.name.padEnd(24)} ${t.group.padEnd(24)} ${t.who.padEnd(8)} win ${String(Math.round(t.win * 100)).padStart(3)}%  ${String(t.time).padStart(4)} s  hull ${String(t.hull).padStart(3)}%  foe ${String(t.foeHull).padStart(3)}%  ${t.codes}  accuracy ${t.accuracy}%  lance ${t.lanceDamage}  aligned ${t.lanceAlignment}%  escort ${t.escortDamage}${process.argv.includes('--taken') ? '  | taken ' + t.taken : ''}`);
// A full run replaces docs/balance-results.json; a partial run (--only, --quick) replaces just the rows it flew.
const file = OUTPUT ? join(ROOT,OUTPUT) : join(ROOT, 'docs', 'balance-results.json'), key = t => `${t.id}|${t.group}|${t.who}`;
let merged = table;
if (!OUTPUT && (ONLY || QUICK || SIDE) && existsSync(file)) { const old = JSON.parse(readFileSync(file, 'utf8')).table || [], fresh = new Map(table.map(t => [key(t), t])); merged = old.map(t => fresh.get(key(t)) || t); for (const t of table) if (!old.some(o => key(o) === key(t))) merged.push(t); }
await writeFile(file, JSON.stringify({ when: new Date().toISOString(), runs: RUNS, table: merged }, null, 1) + '\n');
await browser.close(); server.close();

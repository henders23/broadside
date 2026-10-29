// Runs every browser suite in turn and prints a summary. Exit code 1 if any check fails.
// Needs Playwright and three.js 0.169.0: `npm install --no-save playwright three@0.169.0 && npx playwright install chromium`
// (or set PLAYWRIGHT and THREE_DIR). Pass suite names to run only those: node tests/browser/run.mjs war bosses
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ALL = ['map', 'officers', 'starbases', 'fleet', 'bosses', 'depth', 'war', 'skirmish', 'shields', 'impact', 'content', 'acts'];
const pick = process.argv.slice(2), suites = pick.length ? ALL.filter(s => pick.includes(s)) : ALL;
const rows = [];
for (const s of suites) {
  const t0 = Date.now(), r = spawnSync(process.execPath, [join(here, s + '.mjs')], { encoding: 'utf8', env: process.env, maxBuffer: 1 << 26 });
  const out = (r.stdout || '') + (r.stderr || ''), fails = out.split('\n').filter(l => l.startsWith('FAIL'));
  const m = out.match(/: (\d+) passed, (\d+) failed/);
  rows.push({ s, pass: m ? +m[1] : 0, fail: m ? +m[2] : 1, secs: Math.round((Date.now() - t0) / 1000), fails: m ? fails : [out.trim().split('\n').slice(-3).join(' / ')] });
  console.log(`${s.padEnd(10)} ${String(rows.at(-1).pass).padStart(3)} passed  ${String(rows.at(-1).fail).padStart(2)} failed  ${rows.at(-1).secs}s`);
  for (const f of rows.at(-1).fails) console.log('   ' + f);
}
const pass = rows.reduce((a, r) => a + r.pass, 0), fail = rows.reduce((a, r) => a + r.fail, 0);
console.log(`\n${pass} checks passed, ${fail} failed across ${rows.length} suites.`);
process.exitCode = fail ? 1 : 0;

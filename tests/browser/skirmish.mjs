// Skirmish is untouched by the campaign: two ships, no fleet controller, no escort panel.
// Run: node tests/browser/skirmish.mjs
import { suite } from './harness.mjs';

await suite('skirmish', {}, async ({ page, base, check }) => {
  await page.goto(base + '/index.html?sim');
  await page.waitForFunction(() => window.__sim && window.__sim.state === 'menu', null, { timeout: 240000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.__sim.start()); await page.evaluate(() => window.__sim.step(300));
  const r = await page.evaluate(() => ({ state: window.__sim.state, ships: window.__sim.ships.length, fleet: !!window.__sim.fleet, escorts: document.getElementById('escorts').hidden }));
  check(r.state === 'playing' && r.ships === 2, 'a skirmish runs with two ships');
  check(!r.fleet && r.escorts, 'no fleet controller or escort panel');
  const kinds = await page.evaluate(() => { const S = window.__sim, seen = new Set(); for (let i = 0; i < 40; i++) { S.start(); seen.add(S.enemy.key); } return [...seen]; });
  check(!kinds.some(k => ['pyre', 'arbiter', 'mother'].includes(k)), 'bosses never appear as skirmish enemies: ' + kinds.join(', '));
});

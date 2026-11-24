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
  // The quieter HUD: healthy systems are not listed, and a gun camera films the target under the enemy panel.
  await page.evaluate(() => { window.__sim.start(); window.__sim.step(30); }); await page.waitForTimeout(1500);
  const hud = () => page.evaluate(() => ({ cam: window.__sim.gcam.live, off: document.getElementById('gcam').classList.contains('off'), head: document.getElementById('own-subs-h').textContent,
    shown: [...document.querySelectorAll('#own-subs .sub')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.dataset.k) }));
  let h = await hud();
  check(h.cam && !h.off, 'the gun camera is filming the target');
  check(h.shown.length === 0 && /nominal/i.test(h.head), 'a healthy ship lists no systems: ' + h.head);
  await page.evaluate(() => { window.__sim.player.sub.engines = 40; window.__sim.step(10); }); await page.waitForTimeout(400);
  h = await hud();
  check(h.shown.length === 1 && h.shown[0] === 'engines' && /repair/i.test(h.head), 'a damaged system appears, to be clicked for repair: ' + h.shown.join(','));
  // The defeat screen says what sank you.
  const why = await page.evaluate(() => { const S = window.__sim, P = S.player, at = P.pos.clone().set(0, 0, 100); for (let i = 0; i < 40 && P.alive; i++) S.damage(P, 600, 'torp', at, S.enemy); return S.whatSankYou(); });
  check(/shield was the first to fail, at \d+:\d\d\. Torpedoes did 100% of the damage to your hull/.test(why) && /Torpedoes are weak against shields/.test(why), 'the defeat screen names what sank the ship: ' + why);
});

// Raking fire and the shield restart: hull damage by the facing it lands on, and a collapsed facing staying down.
// Run: node tests/browser/gunnery.mjs
import { suite } from './harness.mjs';

await suite('gunnery', {}, async ({ page, base, check, shot }) => {
  const S = (f, a) => page.evaluate(f, a);
  await page.goto(base + '/index.html?sim');
  await page.waitForFunction(() => window.__sim && window.__sim.state === 'menu', null, { timeout: 240000 });
  await S(() => { const s = window.__sim; s.start(); s.step(30); s.enemy.ai = null; s.enemy.pos.set(0, 0, -20000); s.player.step = 0; });
  // Hull damage from one 100-point hit on a bare facing: [x, z] is the hit in the ship's own space (-z is the bow).
  const hull = (who, x, z, kind = 'shell') => S(([who, x, z, kind]) => {
    const s = window.__sim, t = s[who], src = who === 'enemy' ? s.player : s.enemy;
    t.sh.fill(0); t.hull = t.C.hull; const sub = { ...t.sub };
    s.damage(t, 100, kind, t.pos.clone().set(x, 0, z), src); Object.assign(t.sub, sub);
    return Math.round((t.C.hull - t.hull) * 10) / 10;
  }, [who, x, z, kind]);
  check(await hull('enemy', 0, 100) === 140, 'a hit in the enemy stern does 40% more hull damage');
  check(await hull('enemy', 0, -100) === 100 && await hull('enemy', 40, 0) === 100 && await hull('enemy', -40, 0) === 100, 'a hit on the bow or either beam is unchanged');
  check(await hull('enemy', 0, 100, 'ram') === 100, 'ramming is not raking');
  check(await hull('player', 0, 100) === 140 && await hull('player', 0, -100) === 100, 'the same rule applies to the flagship');
  // A lighter hit, so no subsystem goes critical and takes the message line.
  await S(() => { const s = window.__sim, P = s.player; P.rakeT = -99; s.damage(P, 30, 'shell', P.pos.clone().set(0, 0, 100), s.enemy); });
  check(await S(() => document.getElementById('msg').textContent.startsWith('Raked from astern')), 'the bridge calls a raking hit on the flagship');
  // Shields take the same from every side.
  const drained = await S(() => { const s = window.__sim, E = s.enemy; E.sh = [500, 500, 500, 500]; E.hull = E.C.hull;
    s.damage(E, 100, 'shell', E.pos.clone().set(0, 0, 100), s.player); s.damage(E, 100, 'shell', E.pos.clone().set(0, 0, -100), s.player);
    return [E.sh[0], E.sh[1], E.C.hull - E.hull]; });
  check(drained[0] === 400 && drained[1] === 400 && drained[2] === 0, 'shields soak the same from bow and stern: ' + drained.join(', '));
  await S(() => { const s = window.__sim; s.enemy.rakeT = -99; s.enemy.sh.fill(0); s.enemy.pos.copy(s.player.pos).add(s.player.pos.clone().set(1500, 0, -600)); s.damage(s.enemy, 100, 'shell', s.enemy.pos.clone().set(0, 0, 100), s.player); });
  await page.waitForFunction(() => [...document.querySelectorAll('#dmgnums .dn.tag')].some(e => e.textContent === 'Raking fire'), null, { timeout: 30000 }).catch(() => {});
  check(await S(() => [...document.querySelectorAll('#dmgnums .dn.tag')].some(e => e.textContent === 'Raking fire')), 'a stern hit on the enemy is tagged Raking fire');
  await shot('1-raking');

  // The shield restart. The enemy is parked far off, so nothing else is firing.
  const st = await S(() => { const s = window.__sim, P = s.player, out = {};
    P.sh = P.cap.slice(); P.sh[2] = 10; P.hitT.fill(-9); P.focus = -1;
    s.damage(P, 50, 'shell', P.pos.clone().set(-40, 0, 0), s.enemy);
    out.down = P.sh[2]; out.lock = P.lock[2] - s.game.time;
    s.step(30 * 5); out.at5 = P.sh[2];           // five seconds on: still down
    s.step(30 * 1.2); out.at6 = P.sh[2]; out.cap = P.cap[2];   // just past six: restarted part-charged
    return out; });
  check(st.down === 0 && Math.abs(st.lock - 6) < 0.01, 'a collapsed facing is locked down for six seconds: ' + st.lock.toFixed(2));
  check(st.at5 === 0, 'it is still down five seconds later');
  check(st.at6 >= st.cap * 0.2 && st.at6 < st.cap * 0.3, 'it restarts with a fifth of its strength: ' + st.at6.toFixed(0) + ' of ' + st.cap.toFixed(0));
  await S(() => { const s = window.__sim, P = s.player; P.sh[3] = 10; s.damage(P, 50, 'shell', P.pos.clone().set(40, 0, 0), s.enemy); return 0; });
  await page.waitForFunction(() => /\d s/.test(document.getElementById('own-shl').textContent), null, { timeout: 30000 }).catch(() => {});
  check(await S(() => /\d s/.test(document.getElementById('own-shl').textContent)), 'the shield list counts down to the restart');
  await shot('2-restart');
  // Reinforcing a collapsed facing does not pull strength into it early.
  const pull = await S(() => { const s = window.__sim, P = s.player; for (const k in P.sub) P.sub[k] = 100; P.lock.fill(0); P.focus = -1; s.step(2); P.sh = P.cap.slice(); P.sh[0] = 10;
    s.damage(P, 50, 'shell', P.pos.clone().set(0, 0, -100), s.enemy); P.focus = 0; s.step(30 * 3); const v = P.sh[0]; P.focus = -1; return v; });
  check(pull === 0, 'reinforcing a collapsed facing does not bring it back early');
  const boss = await S(() => { const s = window.__sim, E = s.enemy; E.sh = E.cap.slice(); E.sh[1] = 10; s.damage(E, 50, 'shell', E.pos.clone().set(0, 0, 100), s.player); return E.lock[1] > s.game.time; });
  check(boss, 'enemy facings lock down the same way');
});

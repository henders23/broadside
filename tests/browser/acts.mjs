// Acts II and III content: the Sentinel and Thrall hulls in battle, the story fights that use them, and a convoy run
// in legs (the board, each leg's battle, damage carried between legs, the reward on the last leg, a failed leg),
// and the campaign's ship ambience and the afterburner sound.
// Run: node tests/browser/acts.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('acts', { random: 0.99 }, async ({ page, base, KEY, check, shot, read, patch, playing }) => {
  const S = (f, a) => page.evaluate(f, a);
  const fresh = async (extra = {}) => {
    await page.goto(base + '/campaign.html');
    await page.evaluate(k => localStorage.removeItem(k), KEY); await page.reload(); await page.click('#introgo');
    await patch({ tutorial: 'done', ...extra }); await page.reload();
  };
  const battle = async make => {
    await page.evaluate(([k, make]) => { const C = window.BroadsideCampaign, s = JSON.parse(localStorage.getItem(k)); s.launch = new Function('C', 'ctx', 's', 'return ' + make)(C, { flags: s.flags, fronts: s.fronts }, s); s.pendingResult = null; localStorage.setItem(k, JSON.stringify(s)); }, [KEY, make]);
    await page.goto(base + '/index.html?encounter=1&sim');
    await playing();
  };
  const over = async () => { for (let i = 0; i < 60 && await S(() => window.__sim.state) !== 'over'; i++) { await S(() => window.__sim.step(30)); await page.waitForTimeout(150); } return (await S(() => window.__sim.state)) === 'over'; };
  const killAll = () => S(() => { const s = window.__sim; for (const t of s.ships.filter(x => x.team === 'e' && x.alive)) s.damage(t, 1e6, 'shell', t.pos.clone().set(0, 0, 0), s.player); });
  const report = async () => { await page.goto(base + '/campaign.html'); await page.waitForTimeout(1200); return { title: await page.textContent('#modaltitle'), body: await page.textContent('#modalbody') }; };

  // --- The Sentinel: a lance frigate on the Halberd hull whose lance warns before it fires
  await fresh({ completed: [1, 2, 3, 8], actBriefed: 2, system: 'halcyon' });
  await battle("C.encounter({ ...C.sideById['a2-sightline'], kind: 'side' }, ctx)");
  let b = await S(() => { const s = window.__sim, e = s.ships.filter(x => x.team === 'e'); return e.map(x => ({ key: x.key, url: x.C.url, name: x.name, torps: x.groups.some(g => g.type === 'torpedo'), lance: x.groups.find(g => g.id === 'lance')?.special })); });
  check(b.length === 2 && b.every(x => x.key === 'sentinel' && x.url === 'models/sentinel.glb' && !x.torps && x.lance), 'two Sentinels with their own model, lances that warn: ' + JSON.stringify(b));
  const warn = await S(() => { const s = window.__sim, e = s.enemy, g = e.groups.find(x => x.id === 'lance'); g.warnAt = null; const first = s.armed(e, g); return { first, msg: document.getElementById('msg').textContent }; });
  check(warn.first === false && warn.msg.startsWith('Sentinel lance charging'), 'the lance warns before it fires: ' + warn.msg);
  await S(() => window.__sim.step(20)); await page.waitForTimeout(600);
  await shot('a01-sentinels');
  await killAll(); check(await over(), 'Sentinels destroyed');
  check((await read()).pendingResult.met.includes('sentinel'), 'the Sentinel is recorded as met (for the codex)');

  // --- Thralls: a pack of small, fast rammers
  await fresh({ completed: [1, 2, 3, 8, 4, 6, 9], actBriefed: 3, system: 'widow' });
  await battle("C.encounter({ ...C.sideById['a3-swarm'], kind: 'side' }, ctx)");
  b = await S(() => { const s = window.__sim, e = s.ships.filter(x => x.team === 'e'); return { n: e.length, keys: [...new Set(e.map(x => x.key))], rammer: e[0].C.rammer, size: e[0].C.hullE.r[2], wraith: s.CLASSES.wraith.hullE.r[2], status: document.getElementById('fleet-objective').textContent }; });
  check(b.n === 4 && b.keys.join() === 'thrall' && b.rammer && b.size < b.wraith * 0.6, 'a swarm of four small Thralls: ' + JSON.stringify(b));
  const gap = () => S(() => Math.min(...window.__sim.ships.filter(x => x.team === 'e' && x.alive).map(x => x.pos.distanceTo(window.__sim.player.pos))));
  const g0 = await gap(); await S(() => window.__sim.step(240)); await page.waitForTimeout(600); const g1 = await gap();
  check(g1 < g0 - 400, `the swarm closes in: ${Math.round(g0)} m to ${Math.round(g1)} m in 8 s`);
  await shot('a02-thralls');
  await killAll(); check(await over(), 'swarm destroyed');

  // --- Story fights with the new hulls: the Arbiter's escort, the Bloom-Mother's brood
  check(await S(() => { const C = window.BroadsideCampaign; return C.storyEncounter(9, {}).enemies[1].cls === 'sentinel' && C.storyById[10].boss.phases[1].spawn.every(e => e.cls === 'thrall'); }), 'the Arbiter brings a Sentinel and the Bloom-Mother a Thrall brood');

  // --- A convoy run in legs: The Ring Lifeline, Elysia → Citrine → Midway
  await fresh({ completed: [1, 2, 3, 8], actBriefed: 2, system: 'juniper', credits: 0 });
  await S(() => { openBoard('juniper'); });
  await page.waitForTimeout(600);
  const card = page.locator('#bsidelist .job', { hasText: 'The Ring Lifeline' });
  check(await card.count() === 1 && (await card.textContent()).includes('Elysia → Citrine → Midway'), 'the board shows the run’s route');
  await card.locator('button', { hasText: 'Accept' }).click(); await page.waitForTimeout(300);
  let st = await read();
  check(st.orders.includes('a2-lifeline') && !st.legs['a2-lifeline'], 'run accepted at leg 1');
  await shot('a03-board');
  // leg 1
  await battle("C.encounter({ ...C.sideLeg(C.sideById['a2-lifeline'], s.legs['a2-lifeline']), kind: 'side' }, ctx)");
  check((await page.textContent('#campaign-objective')).includes('Leg 1 of 3') && await S(() => window.__sim.enemy.key) === 'revenant', 'leg 1 at Elysia: an Ash Fleet raider');
  await S(() => { const c = window.__sim.fleet.convoy; c.hull *= 0.6; });
  await killAll(); check(await over(), 'leg 1 won');
  st = await read();
  check(Math.abs(st.pendingResult.convoyHull - 0.6) < 0.02, 'the convoy’s hull is saved with the result: ' + st.pendingResult.convoyHull);
  let r = await report();
  check(r.title === 'Leg 1 of 3 complete' && r.body.includes('through Elysia at 60% hull') && r.body.includes('Next: Citrine'), 'leg report: ' + r.title);
  await shot('a04-leg-report');
  await page.locator('#modalactions button', { hasText: 'Continue' }).click(); await page.waitForTimeout(500);
  st = await read();
  check(st.legs['a2-lifeline'].leg === 1 && Math.abs(st.legs['a2-lifeline'].hull - 0.6) < 0.02 && st.credits === 0 && st.orders.includes('a2-lifeline') && !st.sideDone.includes('a2-lifeline'), 'on to leg 2, no pay yet: ' + JSON.stringify(st.legs));
  check(await S(() => activeOrders().find(o => o.id === 'a2-lifeline').system) === 'citrine', 'the order now points at Citrine');
  // leg 2 starts with the damage
  await battle("C.encounter({ ...C.sideLeg(C.sideById['a2-lifeline'], s.legs['a2-lifeline']), kind: 'side' }, ctx)");
  const c2 = await S(() => { const c = window.__sim.fleet.convoy; return { f: c.hull / (c.C.hull * 0.65), foes: window.__sim.ships.filter(x => x.team === 'e').map(x => x.key) }; });
  check(Math.abs(c2.f - 0.6) < 0.02 && c2.foes.join() === 'seraph,seraph', 'leg 2 at Citrine: the convoy carries its damage, two pickets: ' + JSON.stringify(c2));
  await killAll(); check(await over(), 'leg 2 won');
  await report(); await page.locator('#modalactions button', { hasText: 'Continue' }).click(); await page.waitForTimeout(500);
  // leg 3, and the reward
  await battle("C.encounter({ ...C.sideLeg(C.sideById['a2-lifeline'], s.legs['a2-lifeline']), kind: 'side' }, ctx)");
  check(await S(() => window.__sim.enemy.key) === 'sentinel' && (await page.textContent('#campaign-objective')).includes('Leg 3 of 3'), 'leg 3 at Midway: a Sentinel');
  await killAll(); check(await over(), 'leg 3 won');
  r = await report();
  check(r.title === 'Mission complete' && /Reward:\s*\d+/.test(r.body), 'the last leg completes the mission');
  await page.locator('#modalactions button', { hasText: 'Continue' }).click(); await page.waitForTimeout(500);
  st = await read();
  check(st.sideDone.includes('a2-lifeline') && !st.orders.includes('a2-lifeline') && !st.legs['a2-lifeline'] && st.credits > 0, 'paid, and the run is closed');

  // --- A failed leg sends the run back to the start
  await fresh({ completed: [1, 2, 3, 8, 4, 6, 9], actBriefed: 3, system: 'nex', orders: ['a3-lastships'], legs: { 'a3-lastships': { leg: 1, hull: 0.5 } } });
  await battle("C.encounter({ ...C.sideLeg(C.sideById['a3-lastships'], s.legs['a3-lastships']), kind: 'side' }, ctx)");
  check(await S(() => window.__sim.ships.filter(x => x.team === 'e').map(x => x.key).join()) === 'wraith,thrall,thrall', 'Last Ships from Widow, leg 2 at Nex: a Wraith and its swarm');
  await S(() => { const s = window.__sim, c = s.fleet.convoy; s.damage(c, 1e6, 'shell', c.pos.clone().set(0, 0, 0), s.enemy); });
  check(await over() && (await page.textContent('#over-word')) === 'Convoy lost', 'the convoy is lost');
  r = await report();
  check(r.body.includes('starts again from Widow'), 'the report says the run starts again');
  await page.locator('#modalactions button').first().click(); await page.waitForTimeout(500);
  st = await read();
  check(!st.legs['a3-lastships'] && st.orders.includes('a3-lastships'), 'back to leg 1, order still open');

  // --- Sound: the ship's ambience on the campaign screens, and the afterburner in battle
  await page.goto(base + '/campaign.html'); await page.waitForTimeout(600);
  check(await S(() => !Ambience.started), 'no ambience before the first click (browsers block it)');
  await page.mouse.click(800, 860); await page.waitForFunction(() => Ambience.gain && Ambience.ctx.state === 'running', null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  const amb = await S(() => ({ g: Ambience.gain.gain.value, loop: true }));
  check(amb.g > 0.2 && amb.g <= 0.31, 'the hum fades in after the first click: ' + amb.g.toFixed(2));
  await S(() => harlanVoice('test')); await page.waitForTimeout(400);
  await S(() => { harlanAudio = harlanAudio || new Audio(); Ambience.level(0.01); }); await page.waitForTimeout(300);
  check(await S(() => Ambience.gain.gain.value < 0.15), 'it dips while Harlan speaks');
  await S(() => harlanQuiet()); await page.waitForTimeout(1500);
  check(await S(() => Ambience.gain.gain.value > 0.2), 'and comes back when he stops');
  await page.keyboard.press('KeyM'); await page.waitForTimeout(1500);
  check(await S(() => Ambience.gain.gain.value < 0.02 && localStorage.getItem('broadside-ambience') === 'off' && document.getElementById('ambToggle').classList.contains('off')), 'M turns it off, and the choice is remembered');
  await shot('a05-ambience-off');
  await page.click('#ambToggle'); await page.waitForTimeout(300);
  check(await S(() => Ambience.on && localStorage.getItem('broadside-ambience') === 'on'), 'the speaker button turns it back on');
  // afterburner
  await battle("C.encounter({ ...C.sideById['a3-swarm'], kind: 'side' }, ctx)");
  await page.mouse.click(800, 450);
  await page.waitForFunction(() => window.__sim.Sfx.buf.afterburner, null, { timeout: 30000 }).catch(() => {});
  check(await S(() => !!window.__sim.Sfx.buf.afterburner), 'the afterburner sample loads');
  await page.keyboard.down('ShiftLeft'); await S(() => window.__sim.step(6));
  check(await S(() => window.__sim.player.burn && !!window.__sim.Sfx.burnSrc), 'Shift lights the afterburner with its roar');
  await page.keyboard.up('ShiftLeft'); await S(() => window.__sim.step(6));
  check(await S(() => !window.__sim.player.burn && !window.__sim.Sfx.burnSrc), 'releasing Shift fades it out');
});

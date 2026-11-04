// Battle openings (crew/openings.js) and mid-battle twists (crew/twists.js) on the battle page: each opening's
// geometry, the jump-in and the ship hiding in the rocks, fixed-geometry goals left alone, and each twist played out.
// Run: node tests/browser/openings.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('openings', { random: 0.99 }, async ({ page, base, KEY, check, shot, read, patch, playing }) => {
  const S = (f, a) => page.evaluate(f, a);
  await page.goto(base + '/campaign.html');
  await page.evaluate(k => localStorage.removeItem(k), KEY); await page.reload(); await page.click('#introgo');
  await patch({ tutorial: 'done' }); await page.reload();
  // A generated bounty against a named pirate captain, the kind of fight that can open any way and take any turn.
  const BOUNTY = "({ id: 'test-bounty', kind: 'contract', story: null, system: 'kestrel', title: 'Bounty: Captain Mara Quill', label: 'BOUNTY CONTRACT', objective: 'Destroy the Saltjack.', reward: 200, env: 1, gate: false, hail: { name: 'Captain Mara Quill', faction: 'Corsair', line: 'Cut your engines, Navy.' }, enemies: [{ cls: 'scrapjaw', name: 'Saltjack', captain: 'Captain Mara Quill' }], goal: { type: 'destroy' }, ends: null, support: 0, boss: null })";
  const battle = async (make, url = '') => {
    await page.evaluate(([k, make]) => { const C = window.BroadsideCampaign, s = JSON.parse(localStorage.getItem(k)); s.launch = new Function('C', 'ctx', 'return ' + make)(C, { flags: s.flags, fronts: s.fronts }); s.pendingResult = null; localStorage.setItem(k, JSON.stringify(s)); }, [KEY, make]);
    await page.goto(base + '/index.html?encounter=1&sim' + url);
    await playing();
  };
  const over = async () => { for (let i = 0; i < 60 && await S(() => window.__sim.state) !== 'over'; i++) { await S(() => window.__sim.step(30)); await page.waitForTimeout(100); } return (await S(() => window.__sim.state)) === 'over'; };
  const geo = () => S(() => { const s = window.__sim, P = s.player, E = s.enemy, O = window.BroadsideOpenings, rel = Math.abs(Math.atan2(Math.sin(O.yawTo(P.pos, E.pos) - P.yaw), Math.cos(O.yawTo(P.pos, E.pos) - P.yaw))) * 180 / Math.PI;
    return { id: s.opening.id, theta: s.opening.theta, d: Math.round(P.pos.distanceTo(E.pos)), rel: Math.round(rel), dyaw: Math.round(Math.abs(Math.atan2(Math.sin(E.yaw - P.yaw), Math.cos(E.yaw - P.yaw))) * 180 / Math.PI),
      away: E.away || 0, hidden: !!E.hidden, visible: E.obj.visible, pz: Math.round(P.pos.z), range: document.getElementById('rl-range').textContent, twist: s.twist }; });

  // --- ?sim keeps the old start (balance runs stay comparable): head-on, unturned, and no twist
  await battle(BOUNTY);
  let g = await geo();
  check(g.id === 'headon' && g.theta === 0 && g.pz > 2550 && g.pz <= 2700 && g.dyaw === 180 && !g.twist, 'a ?sim battle opens the old way, with no twist: ' + JSON.stringify(g));

  // --- each opening
  await battle(BOUNTY, '&opening=crossing');
  g = await geo();
  check(g.id === 'crossing' && g.d > 3000 && g.d < 4000 && g.dyaw === 90 && g.rel < 60, 'crossing: the enemy is side-on across our bow: ' + JSON.stringify(g));
  await battle(BOUNTY, '&opening=running');
  g = await geo();
  check(g.id === 'running' && g.d > 1850 && g.d < 2300 && g.dyaw === 0 && g.rel > 60 && g.rel < 120, 'running: abeam on the same heading: ' + JSON.stringify(g));
  await battle(BOUNTY, '&opening=ambush');
  g = await geo();
  check(g.id === 'ambush' && g.d > 1700 && g.d < 2600 && g.rel > 120, 'ambush: they come in on our quarter: ' + JSON.stringify(g));
  check((await S(() => document.getElementById('msg').textContent)).includes('astern'), 'the bridge calls the ambush astern');

  // The rocks: hidden off the plot in a cluster of big rocks, until we get close.
  await battle(BOUNTY, '&opening=rocks');
  g = await geo();
  const rocks = await S(() => { const s = window.__sim; return s.asteroids.filter(a => a.pos.distanceTo(s.enemy.pos) < 1000).length; });
  check(g.id === 'rocks' && g.hidden && g.range === '—' && rocks >= 4, 'rocks: the enemy is hidden, off the plot, in a rock cluster: ' + JSON.stringify({ ...g, rocks }));
  check(await S(() => document.getElementById('mk').hidden && window.__sim.enemy.step <= 1), 'no target marker, and the lurker drifts');
  await shot('o01-rocks');
  await S(() => { const s = window.__sim, E = s.enemy; s.player.pos.set(E.pos.x + 1500, E.pos.y, E.pos.z); s.step(10); });
  await page.waitForFunction(() => document.getElementById('rl-range').textContent.endsWith('km'), null, { timeout: 15000 }).catch(() => {});   // the HUD refreshes on real frames
  g = await geo();
  check(!g.hidden && g.range !== '—' && (await S(() => document.getElementById('msg').textContent)).startsWith('Contact!'), 'it breaks cover when we close in: ' + g.range);

  // Jump-in: nobody there, then a flash and a contact at an unknown bearing.
  await battle(BOUNTY, '&opening=jumpin');
  g = await geo();
  check(g.id === 'jumpin' && g.away >= 6 && !g.visible && g.range === '—', 'jump-in: the enemy is not in the battle yet: ' + JSON.stringify(g));
  check(await S(() => window.__sim.player.stats.taken === 0 && !window.__sim.enemy.stats.shots), 'it neither moves nor fires while away');
  await S(() => window.__sim.step(Math.ceil(window.__sim.opening.enemy.away * 30) + 3));
  await page.waitForFunction(() => document.getElementById('rl-range').textContent.endsWith('km'), null, { timeout: 15000 }).catch(() => {});   // the HUD refreshes on real frames
  g = await geo();
  check(!g.away && g.visible && g.d > 1600 && g.d < 2600 && g.range.endsWith('km'), 'it jumps in 1.7 to 2.5 km out: ' + JSON.stringify(g));
  check((await S(() => document.getElementById('msg').textContent)).includes('out of the jump'), 'the bridge calls the arrival');
  await S(() => window.__sim.step(4)); await page.waitForTimeout(300);
  await shot('o02-jumpin');

  // Escorts keep their geometry: the convoy's beacon is fixed.
  await battle("C.storyEncounter(1, ctx)", '&opening=jumpin');
  g = await geo();
  check(await S(() => { const s = window.__sim; return s.opening.id === 'headon' && s.opening.theta === 0 && s.fleet.convoy.pos.z > 3500 && !s.enemy.away; }), 'an escort stays head-on and unturned even when asked: ' + g.id);

  // A story operation (unlocked first: the battle page sends a locked one back to the map) keeps head-on under ?sim,
  // and its hostiles all wait for the jump.
  await patch({ completed: [1, 2, 3, 8], actBriefed: 2 });
  await battle("C.storyEncounter(4, ctx)");
  check(await S(() => window.__sim.opening.id === 'headon'), 'a story operation still opens head-on under ?sim');
  await battle("C.storyEncounter(4, ctx)", '&opening=jumpin');
  check(await S(() => window.__sim.ships.filter(x => x.team === 'e').every(x => x.away > 0)), 'every hostile waits for the jump');

  // --- twists
  await battle(BOUNTY, '&opening=headon&twist=reinforcements');
  check(await S(() => window.__sim.twist.id === 'reinforcements'), 'a twist is staged');
  await S(() => window.__sim.step(30 * 4));
  let t = await S(() => { const s = window.__sim, e = s.ships.filter(x => x.team === 'e' && x.alive); return { n: e.length, d: Math.round(e[1] ? e[1].pos.distanceTo(s.player.pos) : 0), status: !document.getElementById('fleet-objective').hidden && document.getElementById('fleet-objective').textContent }; });
  check(t.n === 2 && t.d > 1500 && t.d < 3000 && t.status.includes('2 HOSTILES'), 'reinforcements jump in on the far side: ' + JSON.stringify(t));
  await S(() => { const s = window.__sim; for (const x of s.ships.filter(x => x.team === 'e')) s.damage(x, 1e6, 'shell', x.pos.clone().set(0, 0, 0), s.player); });
  check(await over(), 'the fight ends when the reinforcements are down too');
  check((await read()).pendingResult.honours.hostiles === 2, 'the after-action counts both hostiles');

  await battle(BOUNTY, '&opening=headon&twist=navy');
  await S(() => window.__sim.step(30 * 4));
  t = await S(() => { const s = window.__sim, a = s.fleet.allies[0]; return { n: s.fleet.allies.length, name: a && a.name, friend: a && a.friend, panel: !document.getElementById('escorts').hidden, d: a ? Math.round(a.pos.distanceTo(s.player.pos)) : 0 }; });
  check(t.n === 1 && /^MNS /.test(t.name) && t.friend && t.panel && t.d < 1600, 'a Navy ship joins the fight beside us: ' + JSON.stringify(t));
  await page.keyboard.press('KeyI'); await S(() => window.__sim.step(40));
  check(await S(() => window.__sim.fleet.order === 'defend'), 'and takes escort orders');
  await page.waitForTimeout(300); await shot('o03-navy');

  await battle(BOUNTY, '&opening=headon&twist=ionstorm');
  await S(() => window.__sim.step(30 * 4));
  t = await S(() => { const s = window.__sim, P = s.player; P.sh = P.sh.map(() => 5); s.step(60); return { storm: s.game.storm, sh: Math.max(...P.sh), line: document.getElementById('twist-line').textContent }; });
  check(t.storm > 0 && t.sh <= 5 && t.line.startsWith('ION STORM'), 'in the ion storm no shields recharge: ' + JSON.stringify(t));
  await page.waitForTimeout(200); await shot('o04-ionstorm');
  await S(() => window.__sim.step(30 * 20));
  t = await S(() => ({ storm: window.__sim.game.storm, sh: Math.max(...window.__sim.player.sh), hidden: document.getElementById('twist-line').hidden }));
  check(t.storm === 0 && t.sh > 5 && t.hidden, 'when it passes they recharge: ' + JSON.stringify(t));

  await battle(BOUNTY, '&opening=headon&twist=breach');
  await S(() => window.__sim.step(30 * 4));
  t = await S(() => { const s = window.__sim; s.step(30); return { sh: Math.max(...s.enemy.sh), T: s.enemy.breachT, line: document.getElementById('twist-line').textContent }; });
  check(t.sh === 0 && t.T > 0 && t.line.startsWith('REACTOR BREACH'), 'a reactor breach drops every enemy shield: ' + JSON.stringify(t));
  await S(() => window.__sim.step(30 * 13));
  t = await S(() => ({ sh: Math.max(...window.__sim.enemy.sh), T: window.__sim.enemy.breachT }));
  check(t.sh > 0 && t.T === 0, 'and they come back when it is contained: ' + JSON.stringify(t));

  // Surrender: offered when the captain is beaten and alone; Y accepts, and the ship can be claimed.
  await battle(BOUNTY, '&opening=headon&twist=surrender');
  await S(() => { const s = window.__sim; s.enemy.hull = s.enemy.maxHull * 0.3; s.step(5); });
  t = await S(() => ({ stage: window.__sim.twist.stage, cease: window.__sim.enemy.ceasefire, line: document.getElementById('twist-line').textContent, msg: document.getElementById('msg').textContent }));
  check(t.stage === 1 && t.cease && t.line.startsWith('SURRENDER OFFERED') && t.msg.includes('press Y'), 'a beaten captain offers to surrender: ' + JSON.stringify(t));
  await page.keyboard.press('KeyY');
  check(await over(), 'Y accepts and the battle ends');
  let r = (await read()).pendingResult;
  check(r.outcome === 'win' && r.tacticalOutcome === 'surrender' && r.wrecks.some(w => w.cls === 'scrapjaw'), 'a surrender is a win, with the ship to claim: ' + JSON.stringify({ o: r.tacticalOutcome, w: r.wrecks }));
  check((await S(() => document.getElementById('over-word').textContent)) === 'Enemy commander surrendered', 'the end screen says so');
  // Refused: fire on them during the offer and the fight goes on.
  await battle(BOUNTY, '&opening=headon&twist=surrender');
  await S(() => { const s = window.__sim; s.enemy.hull = s.enemy.maxHull * 0.3; s.step(5); s.damage(s.enemy, 40, 'shell', s.enemy.pos.clone().set(0, 0, 0), s.player); s.step(5); });
  t = await S(() => ({ stage: window.__sim.twist.stage, cease: window.__sim.enemy.ceasefire, state: window.__sim.state }));
  check(t.stage === -1 && !t.cease && t.state === 'playing', 'firing on them refuses the surrender: ' + JSON.stringify(t));

  // --- a skirmish opens any way too, and only has the twists that need no campaign
  await page.goto(base + '/index.html?sim&opening=running&twist=breach');
  await page.waitForFunction(() => window.__sim && window.__sim.state === 'menu', null, { timeout: 240000 });
  await page.evaluate(() => window.__sim.start()); await S(() => window.__sim.step(30 * 4));
  t = await S(() => ({ id: window.__sim.opening.id, n: window.__sim.ships.length, sh: Math.max(...window.__sim.enemy.sh) }));
  check(t.id === 'running' && t.n === 2 && t.sh === 0, 'a skirmish opens running, and the breach works: ' + JSON.stringify(t));
  await page.goto(base + '/index.html?sim&twist=navy');
  await page.waitForFunction(() => window.__sim && window.__sim.state === 'menu', null, { timeout: 240000 });
  await page.evaluate(() => window.__sim.start());
  check(await S(() => window.__sim.twist === null), 'no Navy help in a skirmish');
});

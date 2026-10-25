// The first-battle tutorial, boss entrances, special-weapon warnings and trophies, the defend and pursuit missions,
// and the art and voice files that are picked up when they exist.
// Run: node tests/browser/content.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('content', { random: 0.99 }, async ({ page, ctx, base, KEY, check, shot, read, patch, playing }) => {
  // Observe Harlan's requested voice clips; authored vector art is served by the repository.
  await ctx.addInitScript(() => { window.__audio = []; const A = window.Audio; window.Audio = function (src) { window.__audio.push(src); return new A(src); }; });
  const S = (f, a) => page.evaluate(f, a);
  const fresh = async (extra = {}) => {
    await page.goto(base + '/campaign.html');
    await page.evaluate(k => localStorage.removeItem(k), KEY); await page.reload(); await page.click('#introgo');
    if (Object.keys(extra).length) { await patch(extra); await page.reload(); }
  };
  // Stage a battle the way the campaign does (the spec travels in the save) and open it with the test hook.
  const battle = async (make, url = '') => {
    await page.evaluate(([k, make]) => { const C = window.BroadsideCampaign, s = JSON.parse(localStorage.getItem(k)); s.launch = new Function('C', 'ctx', 'return ' + make)(C, { flags: s.flags, fronts: s.fronts }); s.pendingResult = null; localStorage.setItem(k, JSON.stringify(s)); }, [KEY, make]);
    await page.goto(base + '/index.html?encounter=1&sim' + url);
    await playing();
  };
  const over = async () => { for (let i = 0; i < 60 && await S(() => window.__sim.state) !== 'over'; i++) { await S(() => window.__sim.step(30)); await page.waitForTimeout(150); } return (await S(() => window.__sim.state)) === 'over'; };
  const kill = name => S(n => { const s = window.__sim, t = s.ships.find(x => x.team === 'e' && x.alive && (!n || x.name === n)); if (t) s.damage(t, 1e6, 'shell', t.pos.clone().set(0, 0, 0), s.player); }, name);
  // Headless frames are slow: after a key press, run a few frames of the battle so the tutorial sees it.
  const tick = () => S(() => window.__sim.step(4)).then(() => page.waitForTimeout(150));
  const coach = () => S(() => ({ shown: !document.getElementById('coach').hidden, k: document.getElementById('coach-k').textContent, t: document.getElementById('coach-t').textContent }));

  // --- The tutorial: the first battle of a new campaign
  await fresh();
  await battle('C.storyEncounter(1, ctx)');
  let c = await coach();
  check(c.shown && c.k === 'Tutorial · 1 of 7' && c.t === 'Ahead full', 'the first battle opens the tutorial: ' + JSON.stringify(c));
  await S(() => window.__sim.step(300));
  check(await S(() => { const s = window.__sim; return s.player.stats.taken === 0 && s.fleet.convoy.stats.taken === 0 && s.tutorial.holdFire; }), 'hostiles hold fire while the controls are learned');
  await shot('c01-tutorial-throttle');
  await page.keyboard.press('KeyW'); await tick();
  check((await coach()).t === 'Set the rudder', 'W to full ahead: on to the rudder');
  await page.keyboard.down('KeyD'); await S(() => window.__sim.step(30)); await page.keyboard.up('KeyD'); await S(() => window.__sim.step(60)); await tick();
  check((await coach()).t === 'Reinforce a shield', 'rudder held: on to the shields');
  await page.keyboard.press('ArrowUp'); await tick();
  check((await coach()).t === 'Route the reactor', 'a facing reinforced: on to power');
  await page.keyboard.press('Digit3'); await tick();
  c = await coach();
  check(c.t === 'Fire a broadside', 'power moved: on to the broadsides');
  await shot('c02-tutorial-broadside');
  await S(() => { window.__sim.player.groups.find(g => g.sub === 'port').charge = 0.4; }); await tick();
  check((await coach()).t === 'Call on your officers' && !(await S(() => window.__sim.tutorial.holdFire)), 'a broadside fired: on to the officers, and the enemy opens fire');
  await page.keyboard.press('Digit5'); await tick();
  c = await coach();
  check(c.t === 'Good hunting, Captain', 'an officer command used: the last step');
  check((await S(() => document.getElementById('coach-p').textContent)).includes('MV Peregrine'), 'the last step names the transport');
  await page.click('#coach-skip'); await page.waitForTimeout(200);
  check(!(await coach()).shown, 'Skip tutorial closes the panel');
  await kill(); check(await over(), 'battle over');
  check((await read()).tutorial === 'done', 'the save remembers the tutorial was shown');
  // A second battle does not repeat it; Intel can queue it again.
  await battle('C.storyEncounter(1, ctx)');
  check(!(await coach()).shown && !(await S(() => window.__sim.tutorial)), 'no tutorial in the next battle');
  await page.goto(base + '/campaign.html'); await page.waitForTimeout(800);
  await S(() => { if (!document.getElementById('veil').hidden) closeModal(); document.getElementById('tabIntel').click(); });
  await page.locator('#modalactions button', { hasText: 'Replay the tutorial' }).click();
  check((await read()).tutorial === 'again', 'Intel: replay the tutorial');
  await battle('C.storyEncounter(1, ctx)');
  check((await coach()).shown, 'the replay coaches the next battle');

  // --- Act I finale: the boss entrance, a special-weapon warning, and the trophy
  await fresh({ completed: [1, 2, 3], actBriefed: 1, system: 'grimhold', tutorial: 'done' });
  await battle('C.storyEncounter(8, ctx)');
  const card = () => S(() => ({ shown: !document.getElementById('bosscard').hidden, title: document.getElementById('bosscard-title').textContent, cls: document.getElementById('bosscard-cls').textContent, who: document.getElementById('bosscard-who').textContent }));
  let k = await card();
  check(k.title === 'ASF PYRE' && k.cls === 'Ash Fleet dreadnought' && k.who === 'Commodore Halloran', 'boss entrance card: ' + JSON.stringify(k));
  await shot('c03-boss-entrance');
  await page.keyboard.press('KeyW'); await page.waitForTimeout(200);
  check(!(await card()).shown && await S(() => window.__sim.game.bossIntro === 0), 'any key skips the entrance');
  await S(() => { const s = window.__sim, b = s.fleet.boss.ship; b.hull = b.maxHull * 0.25; s.step(6); });
  const warn = await S(() => { const s = window.__sim, b = s.fleet.boss.ship, g = b.groups.find(x => x.id === 'inferno'); g.warnAt = null; const first = s.armed(b, g); return { first, at: g.warnAt - s.game.time, label: s.game.bossWarn && s.game.bossWarn.label }; });
  await page.waitForTimeout(400);
  check(warn.first === false && Math.abs(warn.at - 2.6) < 0.05 && warn.label === 'Inferno salvo', 'the inferno salvo charges before it fires: ' + JSON.stringify(warn));
  check(await S(() => document.getElementById('bossbar').classList.contains('warn') && document.getElementById('boss-phase').textContent.includes('Inferno salvo charging')), 'the boss bar warns the captain');
  await shot('c04-boss-warning');
  check(await S(() => { const s = window.__sim, b = s.fleet.boss.ship, g = b.groups.find(x => x.id === 'inferno'); s.step(90); return s.armed(b, g); }), 'after the charge the salvo is free to fire');
  await S(() => { const s = window.__sim, b = s.fleet.boss.ship; s.damage(b, 1e6, 'shell', b.pos.clone().set(0, 0, 0), s.player); });
  check(await over(), 'the Pyre destroyed');
  await page.goto(base + '/campaign.html'); await page.waitForTimeout(1200);
  const body = await page.textContent('#modalbody');
  check(body.includes('TROPHY') && body.includes('Pyre armour plate'), 'the after-action report offers the trophy');
  check((await S(() => window.__audio)).some(s => s.endsWith('voice/harlan-8.mp3')), 'Harlan’s transmission tries its voice clip');
  await shot('c05-trophy');
  await page.locator('#modalactions button').nth(1).click(); await page.waitForTimeout(600);
  let st = await read();
  check(st.ships[0].upgrades.includes('pyre_plating'), 'the trophy is fitted to the flagship');
  await S(() => { while (!document.getElementById('veil').hidden) closeModal(); document.getElementById('tabShip').click(); }); await page.waitForTimeout(800);
  check((await page.textContent('#marknote')).includes('Trophies fitted: Pyre armour plate'), 'the shipyard lists the trophy');

  // --- Defend: the Northpoint listening post, two waves
  await fresh({ completed: [1, 2, 3, 8], actBriefed: 2, system: 'northpoint', tutorial: 'done' });
  await battle("C.encounter({ ...C.sideById['a2-listening'], kind: 'side' }, ctx)");
  let d = await S(() => { const s = window.__sim, st = s.fleet.station; return { ok: !!st && st.alive, name: st && st.name, z: st && st.pos.z, status: document.getElementById('fleet-objective').textContent, foes: s.ships.filter(x => x.team === 'e' && x.alive).length }; });
  check(d.ok && d.name.startsWith('Northpoint listening post') && d.foes === 2, 'a listening post to defend and two pickets: ' + JSON.stringify(d));
  await S(() => window.__sim.step(150)); await page.waitForTimeout(400);
  check((await page.textContent('#fleet-objective')).includes('DEFEND · NORTHPOINT LISTENING POST') && (await page.textContent('#fleet-objective')).includes('WAVE 1 OF 2'), 'HUD shows the station and the wave');
  await shot('c06-defend');
  await kill(); await kill(); await S(() => window.__sim.step(240));
  d = await S(() => ({ wave: window.__sim.fleet.wave, foes: window.__sim.ships.filter(x => x.team === 'e' && x.alive).map(x => x.name), state: window.__sim.state }));
  check(d.state === 'playing' && d.wave === 1 && d.foes.length === 2 && d.foes[0] === 'Assault picket', 'the second wave arrives: ' + JSON.stringify(d));
  await kill(); await kill();
  check(await over() && (await page.textContent('#over-word')) === 'Station held', 'both waves beaten: station held');
  st = await read();
  check(st.pendingResult.tacticalOutcome === 'station_held' && st.pendingResult.outcome === 'win', 'the win is saved');

  // --- Pursuit: the Midway courier
  await fresh({ completed: [1, 2, 3, 8], actBriefed: 2, system: 'midway', tutorial: 'done' });
  await battle("C.encounter({ ...C.sideById['a2-courier'], kind: 'side' }, ctx)");
  const z0 = await S(() => window.__sim.enemy.pos.z);
  await S(() => window.__sim.step(300)); await page.waitForTimeout(300);
  const p = await S(() => { const s = window.__sim, q = s.fleet.quarry; return { z: q.pos.z, mode: q.ai.mode, vmax: q.C.vmax, base: s.CLASSES.seraph.vmax }; });
  check(p.mode === 'flee' && p.z < z0 - 150 && Math.abs(p.vmax - p.base * 0.78) < 0.01, 'the courier runs, slower than a seraph: ' + JSON.stringify({ z0, ...p }));
  check((await page.textContent('#fleet-objective')).includes('PURSUIT · COURIER THRESHOLD') && (await page.textContent('#fleet-objective')).includes('JUMPS IN'), 'HUD shows the jump clock');
  await shot('c07-pursuit');
  await S(() => { const s = window.__sim, q = s.fleet.quarry; q.hull = q.maxHull * 0.2; });
  check(await over() && (await page.textContent('#over-word')) === 'Quarry disabled', 'the courier disabled before it jumps');
  await page.goto(base + '/campaign.html'); await page.waitForTimeout(1200);
  check((await page.textContent('#modalbody')).includes('is dead in space'), 'the report says the quarry was taken');
  // and a quarry that gets away
  await battle("C.encounter({ ...C.sideById['a2-courier'], kind: 'side' }, ctx)");
  await S(() => { const s = window.__sim; for (let i = 0; i < 12 && s.state === 'playing'; i++) s.step(300); });
  check(await over() && (await page.textContent('#over-word')) === 'Quarry escaped', 'the clock runs out: quarry escaped');
  await page.goto(base + '/campaign.html'); await page.waitForTimeout(1200);
  check((await page.textContent('#modaltitle')) === 'Quarry escaped' && (await page.textContent('#modalbody')).includes('jumped out'), 'the report says it got away');

  // --- Portraits: both commissioned officers display their own illustrated portraits
  await S(() => { closeModal(); const P = window.BroadsidePersonnel; openModal('Test', 'X', txCard(P.recruits[0], 'K', 'Hello') + txCard(P.recruits[1], 'K', 'Hi'), [{ label: 'Close', run: close }]); });
  await page.waitForTimeout(1000);
  const art = await S(() => [...document.querySelectorAll('#modalbody img.art')].map(i => ({ src: i.getAttribute('src'), w: i.naturalWidth })));
  check(art.length === 2 && art.every(x => x.src.endsWith('.svg') && x.w === 768), 'Adeyemi and Fenn each show a 768-wide portrait: ' + JSON.stringify(art));
  await shot('c08-portraits');
});

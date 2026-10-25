// Milestone 3: act finales with bosses in phases; uneven fights; new game resets.
// Run: node tests/browser/bosses.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('bosses', { random: 0.99 }, async ({ page, ctx, base, out, KEY, check, shot, read, write, patch, random, jump, playing }) => {
  const fight = async () => {
    await page.waitForURL(/index\.html\?encounter=1/);
    await page.goto(base + '/index.html?encounter=1&sim');
    await page.waitForFunction(() => window.__sim && window.__sim.state === 'playing', null, { timeout: 240000 });
    await page.waitForTimeout(1200);
  };
  const bossState = () => page.evaluate(() => { const S = window.__sim, B = S.fleet.boss; return { key: B.ship.key, phase: B.phase, lattice: B.lattice, hostiles: S.ships.filter(s => s.team === 'e' && s.alive).map(s => s.name), bar: !document.getElementById('bossbar').hidden, barText: document.getElementById('boss-phase').textContent, ticks: document.querySelectorAll('#boss-track .tick').length, locked: B.ship.groups.filter(g => g.locked).map(g => g.id), size: B.ship.C.hullE.r[2] }; });
  const barSays = t => page.waitForFunction(t => document.getElementById('boss-phase').textContent.includes(t), t, { timeout: 20000 }).then(() => true, () => false);
  const hurt = f => page.evaluate(f => { const S = window.__sim, b = S.fleet.boss.ship; b.hull = (b.maxHull || b.C.hull) * f; S.step(6); }, f).then(() => page.waitForTimeout(400));

  await page.goto(base + '/campaign.html');
  await page.evaluate(k => localStorage.removeItem(k), KEY); await page.reload(); await page.click('#introgo');
  // --- Act I finale
  await patch({ completed: [1, 2, 3], actBriefed: 1, system: 'cinder' }); await page.reload();
  check((await page.textContent('#availlist')).includes('The Pyre at Grimhold') && (await page.textContent('#availlist .opitem .n')) === 'FINALE', 'the Act I finale is the open operation');
  check((await page.textContent('#fleetstatus')).startsWith('ACT I'), 'still Act I until the finale is won');
  await jump('grimhold');
  const card = page.locator('#arropslist .opcard.boss');
  check(await card.count() === 1 && (await card.textContent()).includes('ACT I FINALE · OPERATION 08'), 'finale card on arrival');
  await shot('b01-arrival-finale');
  await card.locator('button', { hasText: 'Open briefing' }).click();
  check((await page.textContent('#modalheader')).startsWith('ACT I FINALE') && (await page.textContent('#modalbody')).includes('BATTLE PHASES') && (await page.textContent('#modalbody')).includes('below 30% hull'), 'briefing lists the phases');
  await shot('b02-briefing-finale');
  await page.locator('#modalactions .primary').click();
  await fight();
  let b = await bossState();
  check(b.key === 'pyre' && b.bar && b.ticks === 2 && b.phase === 0, 'the Pyre with a boss bar and two phase marks');
  check(b.hostiles.length === 2, 'a lone flagship faces the Pyre and one escort: ' + b.hostiles.join(', '));
  check(b.locked.includes('inferno') && b.size > 200, 'inferno salvo held back; hull scaled up (' + b.size + ')');
  check((await page.textContent('#campaign-objective')).startsWith('ACT I FINALE //'), 'HUD objective names the finale');
  await shot('b03-pyre-phase1');
  await hurt(0.6); b = await bossState();
  check(b.phase === 1 && b.hostiles.filter(n => n === 'Clan raider').length === 2 && await barSays('The clans answer'), 'phase 2: the clans answer');
  await hurt(0.25); b = await bossState();
  check(b.phase === 2 && !b.locked.includes('inferno') && await barSays('Scorched earth'), 'phase 3: inferno salvo unlocked ' + JSON.stringify(b));
  await page.waitForTimeout(600);
  await shot('b04-pyre-phase3');
  await page.evaluate(() => { const S = window.__sim, b = S.fleet.boss.ship; S.damage(b, b.C.hull * 5, 'shell', S.player.pos.clone().set(0, 0, 0), S.player); });
  for (let i = 0; i < 40 && await page.evaluate(() => window.__sim.state) !== 'over'; i++) { await page.evaluate(() => window.__sim.step(30)); await page.waitForTimeout(200); }
  check(await page.evaluate(() => window.__sim.state) === 'over' && (await page.textContent('#over-word')) === 'The Pyre is burning', 'boss destroyed: ' + await page.textContent('#over-word'));
  await shot('b05-pyre-over');
  let st = await read();
  check(st.pendingResult.tacticalOutcome === 'boss_destroyed' && st.pendingResult.outcome === 'win', 'win saved');
  await page.goto(base + '/campaign.html');
  check((await page.textContent('#modalbody')).includes('The Pyre is burning.'), 'after-action report');
  await page.locator('#modalactions button', { hasText: 'Search the wreck' }).click();
  check(await page.locator('#intro').isVisible() && (await page.textContent('#introtitle')).startsWith('Act II'), 'winning the finale opens Act II');
  await page.click('#introgo');

  // --- Act II finale: the lattice
  await patch({ completed: [1, 2, 3, 8, 4, 6], actBriefed: 2, system: 'halcyon', pendingResult: null, launch: null }); await page.reload();
  await jump('halcyon');
  check((await page.textContent('#arropslist')).includes('The Arbiter'), 'Halcyon now offers the Arbiter, not the finished Ghost Frequency');
  await page.locator('#arropslist .opcard.boss button', { hasText: 'Open briefing' }).click();
  await page.locator('#modalactions .primary').click();
  await fight();
  await hurt(0.55); b = await bossState();
  check(b.key === 'arbiter' && b.phase === 1 && b.lattice && b.hostiles.filter(n => n === 'Lattice node').length === 2, 'lattice up with two nodes');
  const latticeBar = await page.waitForFunction(() => document.getElementById('bossbar').classList.contains('lattice') && document.getElementById('boss-phase').textContent.includes('destroy the nodes'), null, { timeout: 20000 }).then(() => true, () => false);
  check(latticeBar, 'boss bar shows the lattice: ' + await page.textContent('#boss-phase'));
  const soak = await page.evaluate(() => { const S = window.__sim, b = S.fleet.boss.ship; b.sh = [0, 0, 0, 0]; const h = b.hull; S.damage(b, 1000, 'shell', S.player.pos.clone().set(0, 0, 0), S.player); return h - b.hull; });
  check(soak > 0 && soak < 400, 'lattice soaks most of a 1,000 hit: ' + Math.round(soak));
  await page.waitForTimeout(500);
  await shot('b06-arbiter-lattice');
  await page.evaluate(() => { const S = window.__sim; for (const n of S.ships.filter(s => s.latticeNode)) S.damage(n, n.C.hull * 5, 'shell', S.player.pos.clone().set(0, 0, 0), S.player); S.step(10); });
  b = await bossState();
  check(!b.lattice, 'destroying the nodes drops the lattice');

  // --- Act III finale: the Bloom-Mother
  await page.goto(base + '/campaign.html');
  await patch({ completed: [1, 2, 3, 8, 4, 6, 9, 5, 7], actBriefed: 3, system: 'verdant', pendingResult: null, launch: null }); await page.reload();
  await jump('verdant');
  await page.locator('#arropslist .opcard.boss button', { hasText: 'Open briefing' }).click();
  await page.locator('#modalactions .primary').click();
  await fight();
  b = await bossState();
  check(b.key === 'mother' && b.hostiles.includes('Brood guardian'), 'the Bloom-Mother and her guardian');
  await page.waitForTimeout(800);
  await shot('b07-mother');
  await hurt(0.3); b = await bossState();
  check(b.phase === 2 && await page.evaluate(() => window.__sim.fleet.boss.ship.regenK) === 1.8, 'regrowth phase');

  // --- Uneven fights: Thorne stays alone against a full fleet
  await page.goto(base + '/campaign.html');
  await patch({ completed: [1, 2], actBriefed: 1, system: 'rednarrows', pendingResult: null, launch: null, credits: 9000,
    ships: [{ id: 's1', ship: 'bastion', shipName: 'MNS Resolute', hull: 1, sub: null, torps: null, upgrades: [], reserve: false }, { id: 's2', ship: 'sabre', shipName: 'MNS Harrier', hull: 1, sub: null, torps: null, upgrades: [], reserve: false }, { id: 's3', ship: 'warden', shipName: 'MNS Steadfast', hull: 1, sub: null, torps: null, upgrades: [], reserve: false }] });
  await page.reload();
  await jump('rednarrows');
  await page.locator('#arropslist .opcard button', { hasText: 'Open briefing' }).click();
  await page.locator('#modalactions .primary').click();
  await fight();
  const thorne = await page.evaluate(() => ({ e: window.__sim.ships.filter(s => s.team === 'e').length, p: window.__sim.ships.filter(s => s.team === 'p').length }));
  check(thorne.e === 1 && thorne.p === 3, `three ships against Thorne alone (${thorne.p} v ${thorne.e})`);

  // --- A new game starts with a fresh ship
  await page.goto(base + '/campaign.html');
  await patch({ pendingResult: null, launch: null, ships: [{ id: 's1', ship: 'bastion', shipName: 'MNS Resolute', hull: .4, sub: { engines: 20 }, torps: 2, upgrades: ['rapid_loaders', 'heavy_shells', 'capacitor_array'], reserve: false }, { id: 's2', ship: 'sabre', shipName: 'MNS Harrier', hull: 1, sub: null, torps: null, upgrades: ['vectored_thrusters'], reserve: false }], flag: 's1' });
  await page.reload();
  await page.click('#tabNew'); await page.locator('#savelist .slot-row.on [data-new]').click(); await page.locator('#modalactions .primary').click(); await page.click('#introgo');
  st = await read();
  check(st.ships.length === 1 && st.ships[0].upgrades.length === 0 && st.ships[0].hull === 1 && st.ships[0].sub === null && st.ships[0].torps === null && st.completed.length === 0 && st.credits === 850, 'new game: one fresh ship, no upgrades, no damage');
  await page.click('#tabShip');
  check(await page.locator('#markcards .upcard.got').count() === 0 && !(await page.textContent('#slots')).includes('FITTED'), 'the shipyard shows no fitted upgrades');
  await page.goto(base + '/index.html?campaign=1&sim');
  await page.waitForFunction(() => window.__sim && window.__sim.state === 'playing', null, { timeout: 240000 });
  const fresh = await page.evaluate(() => { const p = window.__sim.player, base = window.__sim.CLASSES[p.key]; return { up: !!p.C.upgrades, hull: p.C.hull === base.hull, reload: p.C.weapons.every((w, i) => w.reload === base.weapons[i].reload) }; });
  check(!fresh.up && fresh.hull && fresh.reload, 'and fights with the stock hull');
});

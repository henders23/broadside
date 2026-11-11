// Milestone 5: the Kestrel warning, fronts and push back, consequences, officer cards, the ending.
// Run: node tests/browser/war.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('war', { random: 0.99 }, async ({ page, ctx, base, out, KEY, check, shot, read, write, patch, random, jump, playing }) => {
  const battle = async () => { await page.waitForURL(/index\.html\?encounter=1/); await page.goto(base + '/index.html?encounter=1&sim'); await page.waitForFunction(() => window.__sim && window.__sim.state === 'playing', null, { timeout: 240000 }); await page.waitForTimeout(1000); };

  await page.goto(base + '/campaign.html');
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#introgo');
  let st = await read();
  check(st.fronts && st.fronts['Ash Marches'] === -6 && st.frontClock === 0, 'a new campaign starts the fronts');
  check((await page.textContent('#frontstrip')).includes('Ash Marches') && (await page.textContent('#frontstrip')).includes('Enemy-held') && (await page.textContent('#frontstrip')).includes('will counter-attack after 3 more battles'), 'the map shows the act front: ' + await page.textContent('#frontstrip'));
  await page.locator('.sys[data-id="scour"] .dot').click();
  check((await page.textContent('#selfront')) === 'Enemy-held', 'a selected system shows its front');
  const before = await page.evaluate(() => document.querySelector('#borders .r2').getAttribute('stroke'));
  await shot('w01-map-fronts');

  // Operation 3: Thorne surrenders. The report: officer, Harlan, the war, the stakes.
  await patch({ completed: [1, 2], system: 'rednarrows', pendingResult: { id: 3, kind: 'story', ref: 'story:3', system: 'rednarrows', outcome: 'win', tacticalOutcome: 'surrender' } });
  await page.reload();
  const body = await page.textContent('#modalbody');
  check(await page.locator('#modal.wide').count() === 1 && await page.locator('#modalbody .tx').count() === 2, 'after-action has two large cards');
  check(body.includes('Thorne talked') && body.includes('TRANSMISSION') && body.includes('Halloran is at Grimhold'), 'the lead officer reacts and Harlan transmits');
  check(body.includes('THE WAR') && body.includes('Red Narrows') && body.includes('This decision changes a later battle'), 'the war and the stakes are in the report');
  const tx = await page.evaluate(() => { const r = document.querySelector('#modalbody .tx .crew-portrait').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  check(tx[0] >= 120 && tx[1] >= 140, 'officer portrait is large: ' + tx.join('×'));
  const quotedReward=Number((body.match(/Operation reward:\s*(\d+)/)||[])[1]);
  const creditsBefore=(await read()).credits;
  check(quotedReward>0,'report specifies the mission payout before territory changes');
  await shot('w02-after-action');
  await page.keyboard.press('Escape');
  check(await page.locator('#veil').isVisible(), 'Escape cannot discard story progression while the choice is pending');
  await page.locator('#modalactions button', { hasText: 'Offer amnesty' }).click();
  st = await read();
  check(st.flags.thorne_amnesty && st.fronts['Red Narrows'] === -2 && st.credits === creditsBefore+quotedReward, 'amnesty and front recorded, the advertised danger pay was credited: ' + st.credits);

  check((await page.textContent('.sys[data-id="scour"] .war')) === '▲ TAKEN' && await page.locator('#zonefill polygon.navy.changed[data-id="scour"]').count() === 1 && (await page.textContent('.sys[data-id="rednarrows"] .war')) === 'FRONT', 'the map shows Scour taken and the front line moved on to the Red Narrows');
  await shot('w02b-map-taken');

  // Push back: three battles away from the Ash Marches
  for (const [i, sys] of ['kestrel', 'driftwall', 'vela'].entries()) {
    await patch({ pendingResult: { id: 'x:' + i, kind: 'intercept', ref: 'x:' + i, system: sys, outcome: 'win', tacticalOutcome: 'enemy_destroyed' }, launch: null });
    await page.reload();
    if (i === 1) { check((await page.textContent('#modalbody')).includes('counter-attacking at Emberfall') && (await page.textContent('#modalbody')).includes('Fleet orders: hold the post'), 'the third battle away (Thorne counted as the first) brings a counter-attack'); await shot('w03-counter-attack'); }
    await page.locator('#modalactions .primary').click();
  }
  st = await read();
  check(st.fronts['Ash Marches'] === -6 && st.offensive && st.offensive.order.system === 'emberfall' && st.offensive.left === 1, 'no ground is lost yet: Fleet Command orders Emberfall held, with one battle to spare');
  check(await page.locator('.sys.attack[data-id="emberfall"]').count() === 1 && (await page.textContent('.sys[data-id="emberfall"] .op')) === 'UNDER ATTACK', 'the map marks the system under attack');
  check((await page.textContent('#frontstrip')).includes('Counter-attack at Emberfall') && (await page.textContent('#availlist')).includes('Counter-attack at Emberfall'), 'the front strip and the orders list carry it');
  await shot('w03b-map-under-attack');
  await jump('emberfall');
  await page.locator('#arropslist .opcard', { hasText: 'Counter-attack at Emberfall' }).locator('button', { hasText: 'Engage' }).click();
  check((await page.textContent('#modalbody')).includes('forward post'), 'the order has a briefing');
  await page.locator('#modalactions .primary').click();
  await battle();
  check(await page.evaluate(() => window.__sim.ships.some(s => s.post && /Emberfall forward post/.test(s.name)) && window.__sim.ships.filter(s => s.team !== 'p').length === 2), 'the battle is a defence of the Emberfall forward post against the first wave');
  await page.goto(base + '/campaign.html');
  await patch({ pendingResult: { id: st.offensive.order.id, kind: 'contract', ref: st.offensive.order.id, system: 'emberfall', outcome: 'win', tacticalOutcome: 'station_held' } });
  await page.reload();
  check((await page.textContent('#modaltitle')) === 'The post held' && (await page.textContent('#modalbody')).includes('the counter-attack was thrown back'), 'holding the post is reported: ' + await page.textContent('#modaltitle'));
  await page.locator('#modalactions .primary').click();
  st = await read();
  check(st.fronts['Ash Marches'] === -4 && !st.offensive && await page.locator('.sys.attack').count() === 0, 'the front gains ground and the order is gone');
  // ignored instead: the line falls back
  await patch({ fronts: { ...st.fronts, 'Ash Marches': -4 }, frontClock: 0, offensive: { order: { ...(await page.evaluate(() => BroadsideCampaign.counterAttack('Ash Marches', 1, { 'Ash Marches': -4 }, 9))) }, left: 1 }, pendingResult: { id: 'x:9', kind: 'intercept', ref: 'x:9', system: 'kestrel', outcome: 'win', tacticalOutcome: 'enemy_destroyed' }, launch: null });
  await page.reload();
  check((await page.textContent('#modalbody')).includes('broke through while you fought elsewhere'), 'an unanswered counter-attack breaks through');
  await page.locator('#modalactions .primary').click();
  st = await read();
  check(st.fronts['Ash Marches'] === -6 && !st.offensive, 'Ash Marches slipped back to -6');

  // Time under way: the sixth jump counts as a battle elsewhere, and the third of those brings the counter-attack
  await patch({ system: 'meridian', frontClock: 2, jumpClock: 5 }); await page.reload();
  check((await page.textContent('#frontstrip')).includes('1 more battle, or 1 jump'), 'the strip counts the jumps left: ' + await page.textContent('#frontstrip'));
  await jump('tarn');
  st = await read();
  check(st.offensive && st.offensive.left === 2 && st.jumpClock === 0 && st.fronts['Ash Marches'] === -6 && (await page.textContent('#notice')).includes('While you were under way'), 'a jump too many and the Ash Fleet counter-attacks: ' + await page.textContent('#notice'));
  for (const id of ['meridian', 'tarn', 'meridian', 'tarn', 'meridian', 'tarn', 'meridian']) { await page.click('#arrback'); await jump(id); }
  st = await read();
  check(st.offensive && st.offensive.left === 2 && st.fronts['Ash Marches'] === -6, 'travel does not run a waiting counter-attack down');
  await page.click('#arrback');
  await patch({ offensive: null, frontClock: 0, jumpClock: 0 });

  // Closed lanes and blockades
  await patch({ system: 'meridian', broken: [] }); await page.reload();
  check(await page.locator('.sys.sealed').count() === 8 && await page.locator('.sys.blockade[data-id="cinder"]').count() === 1 && await page.locator('.sys.blockade[data-id="peregrine"]').count() === 0, 'machine and Wraith space is closed in Act I; enemy systems beyond the line are blockaded');
  await page.locator('.sys[data-id="halcyon"] .dot').click();
  check(await page.locator('#selgo').isDisabled() && (await page.textContent('#selroute')).includes('Closed by Fleet order until Act II') && (await page.textContent('#selhold')) === 'Lanes closed', 'no course can be set into closed lanes: ' + await page.textContent('#selroute'));
  await page.locator('.sys[data-id="grimhold"] .dot').click();
  check((await page.textContent('#selroute')).includes('Blockade at Cinder Wake') && await page.locator('#lanehot line.beyond').count() === 1, 'the course to Grimhold shows the blockade in its way: ' + await page.textContent('#selroute'));
  await shot('w03c-blockade-route');
  await page.click('#selgo');
  check((await page.textContent('#modaltitle')) === 'Blockade at Cinder Wake' && (await read()).system === 'cinder' && await page.locator('#modalactions button').count() === 3, 'the fleet is stopped at the blockade: turn back, run it, or fight');
  await shot('w03d-blockade');
  await page.keyboard.press('Escape');
  check(await page.locator('#veil').isVisible(), 'the blockade cannot be dismissed');
  await page.locator('#modalactions button', { hasText: 'Turn back' }).click();
  check((await read()).system === 'emberfall' && !(await read()).ambush, 'turning back returns the fleet to Emberfall');
  const hull0 = (await read()).ships[0].hull ?? 1;
  await page.locator('.sys[data-id="grimhold"] .dot').click(); await page.click('#selgo');
  await random(0); await page.locator('#modalactions button', { hasText: 'Run the blockade' }).click();
  st = await read();
  check(st.system === 'grimhold' && Math.abs((st.ships[0].hull ?? 1) - (hull0 - 0.06)) < 1e-6 && !(st.broken || []).includes('cinder') && (await page.textContent('#arrname')) === 'Grimhold', 'running it gets through to Grimhold for 6% hull, and the blockade still stands');
  await random(0.99); await page.click('#arrback');
  await page.locator('.sys[data-id="meridian"] .dot').click(); await page.click('#selgo');
  check((await page.textContent('#modaltitle')) === 'Blockade at Cinder Wake', 'and it is in the way again going home');
  await page.locator('#modalactions button', { hasText: 'Battle stations' }).click();
  await page.waitForURL(/index\.html\?encounter=1/);
  st = await read();
  check(st.launch.label === 'BLOCKADE' && st.launch.enemies.length === 2, 'fighting it stages the blockade battle');
  await page.goto(base + '/campaign.html');
  await patch({ pendingResult: { id: st.launch.id, kind: 'intercept', ref: st.launch.id, system: 'cinder', outcome: 'win', tacticalOutcome: 'fleet_destroyed' } });
  await page.reload();
  check((await page.textContent('#modaltitle')) === 'Blockade broken', 'the win is reported as a broken blockade');
  await page.locator('#modalactions .primary').click();
  st = await read();
  check(st.broken.includes('cinder') && await page.locator('.sys.blockade[data-id="cinder"]').count() === 0 && (await page.evaluate(() => BroadsideCampaign.route('meridian', 'grimhold', { fronts: JSON.parse(localStorage.getItem('broadside-campaign-v1')).fronts, act: 1, broken: ['cinder'] }).stop)) === null, 'the lane through Cinder Wake is open');
  await page.locator('.sys[data-id="cinder"] .dot').click();
  check((await page.textContent('#selhold')) === 'Enemy-held · blockade broken', 'the panel says so');
  await patch({ pendingResult: { id: 'x:10', kind: 'intercept', ref: 'x:10', system: 'cinder', outcome: 'loss', tacticalOutcome: 'flagship_lost' }, launch: null });
  await page.reload(); await page.locator('#modalactions .primary').click();
  st = await read();
  check(!st.broken.includes('cinder'), 'losing ground in the Ash Marches lets the blockade re-form');
  await patch({ ships: st.ships.map(x => ({ ...x, hull: 1, sub: null })) });

  // The Pyre briefing: Thorne's charts and a turning Red Narrows
  await patch({ completed: [1, 2, 3], system: 'grimhold', fronts: { ...st.fronts, 'Red Narrows': 3 } }); await page.reload();
  await jump('grimhold');
  await page.locator('#arropslist .opcard.boss button', { hasText: 'Open briefing' }).click();
  const brief = await page.textContent('#modalbody');
  check(brief.includes('WHAT HAS CHANGED') && brief.includes('Thorne’s charts') && brief.includes('only one clan answers') && brief.includes('TACTICAL READINESS') && brief.includes('Suggested deployment: 3 ships'), 'the briefing lists consequences and fleet guidance');
  check(await page.locator('#modalbody .tx').count() === 1 && await page.locator('#modalbody .commander-brief .crew-portrait').evaluate(e => e.getBoundingClientRect().width >= 120), 'briefing has the large officer and commander portraits');
  await shot('w04-briefing');
  await page.locator('#modalactions .primary').click();
  await battle();
  let b = await page.evaluate(() => { const S = window.__sim, B = S.fleet.boss.ship; return { mines: B.groups.find(g => g.id === 'mines'), hull: B.hull, max: B.maxHull, base: B.C.hull }; });
  check(b.mines.locked && b.mines.disabled, 'the Pyre’s mine layer is out of the fight');
  check(b.max === Math.round(b.base * 1.1), 'an enemy-held front reinforces the Pyre (+10%): ' + b.max);
  await page.evaluate(() => { const S = window.__sim, B = S.fleet.boss.ship; B.hull = B.maxHull * 0.6; S.step(6); });
  const clans = await page.evaluate(() => window.__sim.ships.filter(s => s.name === 'Clan raider').length);
  check(clans === 1, 'one clan answers: ' + clans);
  await page.evaluate(() => { const S = window.__sim, B = S.fleet.boss.ship; B.hull = B.maxHull * 0.2; S.step(6); });
  check(await page.evaluate(() => window.__sim.fleet.boss.ship.groups.find(g => g.id === 'mines').locked), 'and stays out after the last phase unlocks the inferno');

  // Exodus at Nex with an amnesty and a transmitted archive: the Penitence flies with you, the Lantern starts ahead
  await page.goto(base + '/campaign.html');
  await patch({ completed: [1, 2, 3, 8, 4, 6, 9, 5], flags: { ...st.flags, ash_amnesty: true, oracle_transmitted: true }, actBriefed: 3, system: 'nex', pendingResult: null, launch: null });
  await page.reload();
  await jump('nex');
  await page.locator('#arropslist .opcard button', { hasText: 'Open briefing' }).click();
  check((await page.textContent('#modalbody')).includes('ASF Penitence') && (await page.textContent('#modalbody')).includes('third of the way'), 'Nex briefing notes both consequences');
  await page.locator('#modalactions .primary').click();
  await battle();
  const nex = await page.evaluate(() => { const S = window.__sim; return { allies: S.fleet.allies.map(a => a.name), z: S.fleet.convoy.pos.z, panel: !document.getElementById('escorts').hidden }; });
  check(nex.allies.includes('ASF Penitence') && nex.panel, 'the Penitence flies with you: ' + nex.allies.join(', '));
  check(nex.z < 2900, 'the Long Lantern starts closer to the beacon: z ' + Math.round(nex.z));
  await shot('w05-nex');

  // Intel: the story so far and the fronts
  await page.goto(base + '/campaign.html');
  await page.click('#tabIntel');
  const intel = await page.textContent('#modalbody');
  check(intel.includes('The story so far') && intel.includes('At Kestrel you drove off Kora Vex') && intel.includes('Your decision: Offer amnesty for intelligence') && intel.includes('THE FRONTS'), 'Intel tells the story so far, with decisions and fronts');
  await shot('w06-intel');
  await page.keyboard.press('Escape');

  // The ending
  await patch({ completed: [1, 2, 3, 8, 4, 6, 9, 5, 7], system: 'verdant', flags: { ...(await read()).flags, arbiter_salvaged: true }, pendingResult: { id: 10, kind: 'story', ref: 'story:10', system: 'verdant', outcome: 'win', tacticalOutcome: 'boss_destroyed' } });
  await page.reload();
  await page.locator('#modalactions button', { hasText: 'Burn the nursery' }).click();
  const end = await page.textContent('#modalbody');
  check((await page.textContent('#modaltitle')) === 'The Reach endures' && end.includes('FINAL TRANSMISSION') && end.includes('pardoned crews') && end.includes('Arbiter’s core') && end.includes('THE FRONTS'), 'the ending reflects decisions and fronts');
  check(await page.locator('#frontstrip').isHidden(), 'no act front once the campaign is over');
  await shot('w07-ending');
});

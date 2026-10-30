// Milestone 1: starbases, mission boards, orders, interceptions, docking, acts.
// Run: node tests/browser/starbases.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('starbases', { random: 0.99 }, async ({ page, ctx, base, out, KEY, check, shot, read, write, patch, random, jump, playing }) => {
  const battle = async () => {
    await page.waitForFunction(() => document.getElementById('own-hull') && +document.getElementById('own-hull').textContent > 0, null, { timeout: 240000 });
    await page.waitForTimeout(1200);
    return page.evaluate(() => ({ objective: document.getElementById('campaign-objective').textContent, fleet: document.getElementById('fleet-objective').textContent, hold: !document.getElementById('escort-hold').hidden }));
  };

  // A legacy save (from before the grand campaign) loads and is migrated.
  await page.goto(base + '/campaign.html');
  await write({ version: 1, ship: 'bastion', shipName: 'MNS Resolute', system: 'meridian', completed: [], flags: {}, credits: 850, hull: 1, sub: null, torps: null, attempts: 0, pendingResult: null, upgrades: [], introSeen: true, officers: {} });
  await page.reload();
  let st = await read();
  check(st.actBriefed === 1 && Array.isArray(st.contracts) && st.boardCycle === 0 && st.ships.length === 1 && st.ships[0].ship === 'bastion' && st.flag === st.ships[0].id && !('hull' in st), 'legacy save migrated to a one-ship fleet without replaying the briefing');
  check(await page.locator('#intro').isHidden(), 'no Act I briefing for a captain who has read it');
  check((await page.textContent('#fleetstatus')).startsWith('ACT I'), 'top bar shows the act: ' + await page.textContent('#fleetstatus'));
  check(await page.locator('.sys.station').count() === 5, 'five starbases on the map');
  await page.locator('.sys[data-id="peregrine"] .dot').click();
  check((await page.textContent('#selstation')) === 'Peregrine Exchange', 'selected system lists its starbase');
  await shot('g01-map-stations');

  // Meridian arrival: starbase card, then the board
  await jump('meridian');
  check(await page.locator('#arrival').isVisible(), 'arrival screen for the home system');
  check((await page.textContent('#arropslist')).includes('Meridian Fleet Yards'), 'starbase card on arrival');
  await shot('g02-arrival-station');
  await page.locator('#arropslist button', { hasText: 'Mission board' }).click();
  check(await page.locator('#boardview').isVisible(), 'mission board opens');
  check(await page.locator('#bcontractlist .job').count() === 3, 'three contracts posted');
  check(await page.locator('#bsidelist .job:not(.hire)').count() === 1 && (await page.textContent('#bsidelist')).includes('The Deserter'), 'Meridian posts its Act I station mission');
  const first = await page.locator('#bcontractlist .job b').first().textContent();
  await shot('g03-board-meridian');
  await page.locator('#bcontractlist .job button').first().click();
  st = await read();
  check(st.contracts.length === 1 && st.contracts[0].name === first, 'contract accepted and saved: ' + first);
  check(await page.locator('#bcontractlist .job').count() === 2 && (await page.textContent('#bactive')).includes(first), 'accepted contract moves to active orders');
  const target = st.contracts[0].system;
  await page.keyboard.press('Escape');
  check(await page.locator('#arrival').isVisible(), 'Escape from the board returns to the arrival screen');
  await page.keyboard.press('Escape');
  check(await page.locator(`.sys.order[data-id="${target}"]`).count() === 1 || await page.locator(`.sys.avail[data-id="${target}"]`).count() === 1, 'order target marked on the map: ' + target);
  check(await page.locator('#availlist .opitem').count() === 2, 'orders list shows the story operation and the contract');
  await shot('g04-map-orders');

  // Shipyard away from a starbase
  await random(0.99);
  await jump('kestrel');
  await page.click('#arrback');
  await page.click('#tabShip');
  check((await page.textContent('#svclist')).includes('No starbase at Kestrel'), 'services explain that Kestrel has no dock');
  check(await page.locator('#svclist button:enabled').count() === 0, 'no services away from a starbase');
  check((await page.textContent('#marknote')).includes('only be fitted at a starbase'), 'upgrade note explains docking');
  check(await page.locator('#markcards button:enabled').count() === 0, 'upgrades cannot be bought undocked');
  await shot('g05-yard-undocked');
  await page.click('#tabMap');

  // Fly to the contract target and engage
  await jump(target);
  check(await page.locator('#arropslist .opcard', { hasText: first }).count() === 1, 'contract card on arrival at the target');
  await shot('g06-arrival-contract');
  await page.locator('#arropslist .opcard', { hasText: first }).locator('button', { hasText: 'Engage' }).click();
  check((await page.textContent('#modaltitle')) === first, 'contract briefing opens');
  await shot('g07-contract-briefing');
  await page.locator('#modalactions .primary').click();
  await page.waitForURL(/index\.html\?encounter=1/);
  let hud = await battle();
  check(hud.objective.includes('CONTRACT //'), 'battle shows the contract objective: ' + hud.objective);
  await shot('g08-contract-battle');
  st = await read();
  const spec = st.launch;
  check(spec && spec.kind === 'contract' && spec.id === st.contracts[0].id, 'launch spec saved for the battle');

  // Come back with a win
  await page.goto(base + '/campaign.html');
  await patch({ pendingResult: { id: spec.id, kind: 'contract', ref: spec.id, system: spec.system, outcome: 'win', tacticalOutcome: spec.goal.type === 'escort' ? 'escort_extracted' : spec.enemies.length > 1 ? 'fleet_destroyed' : 'enemy_destroyed', officerUses: { varro: 1 } } });
  const danger = await page.evaluate(sys => { const C = window.BroadsideCampaign, s = JSON.parse(localStorage.getItem('broadside-campaign-v1')), f = C.frontOf(s.fronts, sys); return f ? C.FRONT_EFFECTS.danger[f.level] : 1; }, spec.system);
  const before = (await read()).credits;
  await page.reload();
  check((await page.textContent('#modaltitle')) === 'Contract fulfilled', 'after-action report for the contract');
  await shot('g09-contract-after-action');
  await page.locator('#modalactions .primary').click();
  st = await read();
  check(st.credits === before + Math.round(spec.reward * danger) && st.contracts.length === 0 && st.boardCycle === 1 && st.launch === null && st.pendingResult === null, `paid ${spec.reward}, order cleared, boards refreshed`);
  check(st.officers.varro && st.officers.varro.xp > 0, 'officers gain experience from contracts');

  // Peregrine Exchange: two station missions in Act I
  await patch({ system: 'peregrine' }); await page.reload();
  await jump('peregrine');
  await page.locator('#arropslist button', { hasText: 'Mission board' }).click();
  check(await page.locator('#bsidelist .job:not(.hire)').count() === 2 && (await page.textContent('#bsidelist')).includes('Salvage Rights'), 'Peregrine posts its station missions');
  await page.locator('#bsidelist .job', { hasText: 'Salvage Rights' }).locator('button').click();
  check((await read()).orders.includes('a1-salvage'), 'station mission accepted');
  await shot('g10-board-peregrine');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');

  // Interception: hostile Scour on the way to Blackrift, then a clean breakaway
  await random(0);
  await jump('blackrift');
  check((await page.textContent('#modaltitle')).startsWith('Interception at'), 'ambush in pirate space: ' + await page.textContent('#modaltitle'));
  const at = (await read()).system;
  check(at !== 'blackrift' && (await read()).ambush, 'flagship stopped at ' + at);
  await page.keyboard.press('Escape');
  check(await page.locator('#veil').isVisible(), 'an interception cannot be dismissed');
  await shot('g11-interception');
  await page.reload();
  check((await page.textContent('#modaltitle')).startsWith('Interception at'), 'the ambush survives a reload');
  await random(0);
  const hullBefore = (await read()).ships[0].hull;
  await page.locator('#modalactions button', { hasText: 'Break away' }).click();
  st = await read();
  check(st.system === 'blackrift' && st.ambush === null && Math.abs(st.ships[0].hull - (hullBefore - 0.03)) < 1e-9, 'broke away and carried on to Blackrift with 3% hull lost');
  check(await page.locator('#arrival').isVisible(), 'arrival screen after the breakaway');

  // A failed breakaway forces the fight
  await page.click('#arrback');
  await random([0, 0.999]);
  await jump('rednarrows');
  check((await page.textContent('#modaltitle')).startsWith('Interception at'), 'second ambush');
  await page.locator('#modalactions button', { hasText: 'Break away' }).click();
  check((await page.textContent('#modaltitle')) === 'They have matched your vector', 'failed breakaway');
  await shot('g12-breakaway-failed');
  await page.locator('#modalactions .primary').click();
  await page.waitForURL(/index\.html\?encounter=1/);
  hud = await battle();
  check(hud.objective.startsWith('INTERCEPTION //'), 'interception battle: ' + hud.objective);
  await shot('g13-interception-battle');
  await page.goto(base + '/campaign.html');
  st = await read();
  await patch({ pendingResult: { id: st.launch.id, kind: 'intercept', ref: st.launch.id, system: st.launch.system, outcome: 'loss', tacticalOutcome: 'flagship_lost' }, hull: 0.45 });
  await page.reload();
  check((await page.textContent('#modalbody')).includes('towed her to Peregrine Exchange'), 'a lost fight tows the ship to the nearest starbase');
  await page.locator('#modalactions .primary').click();
  st = await read();
  check(st.system === 'peregrine' && st.ambush === null, 'flagship back at Peregrine');

  // Story operations launch through the same path
  await patch({ system: 'kestrel' }); await page.reload();
  await jump('kestrel');
  await page.locator('#arropslist .opcard', { hasText: 'Distress at Kestrel' }).locator('button', { hasText: 'Open briefing' }).click();
  await page.locator('#modalactions .primary').click();
  await page.waitForURL(/index\.html\?encounter=1/);
  hud = await battle();
  check(hud.objective.startsWith('OPERATION 01 //') && hud.hold, 'operation 1 staged from its spec, convoy hold button shown');
  await shot('g14-op1-battle');

  // Act II opens with its own briefing
  await page.goto(base + '/campaign.html');
  await patch({ completed: [1, 2, 3, 8], pendingResult: null, launch: null, system: 'elysia' });
  await page.reload();
  check(await page.locator('#intro').isVisible() && (await page.textContent('#introtitle')) === 'Act II · The Machine Signal', 'Act II briefing');
  check((await page.textContent('#intro')).includes('MNS Resolute'), 'briefing names the flagship');
  await page.waitForTimeout(4600);
  await shot('g15-act2-briefing');
  await page.click('#introgo');
  st = await read();
  check(st.actBriefed === 2, 'Act II briefing recorded');
  check((await page.textContent('#availlist')).includes('Ghost Frequency'), 'Ghost Frequency open in Act II');
  await jump('elysia');
  await page.locator('#arropslist button', { hasText: 'Mission board' }).click();
  check((await page.textContent('#bsidelist')).includes('Dead Reckoning'), 'Elysia posts its Act II mission');
  check((await page.textContent('#bcontractlist')).includes('Bounty'), 'Act II contracts posted');
  await shot('g16-board-elysia');
});

// Milestone 5: the Kestrel warning, fronts and push back, consequences, officer cards, the ending.
// Run: node tests/browser/war.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('war', { random: 0.99 }, async ({ page, ctx, base, out, KEY, check, shot, read, write, patch, random, jump, playing }) => {
  const battle = async () => { await page.waitForURL(/index\.html\?encounter=1/); await page.goto(base + '/index.html?encounter=1&sim'); await page.waitForFunction(() => window.__sim && window.__sim.state === 'playing', null, { timeout: 240000 }); await page.waitForTimeout(1000); };

  await page.goto(base + '/campaign.html');
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#introgo');
  let st = await read();
  check(st.fronts && st.fronts['Ash Marches'] === -6 && st.frontClock === 0, 'a new campaign starts the fronts');
  check((await page.textContent('#frontstrip')).includes('Ash Marches') && (await page.textContent('#frontstrip')).includes('Enemy-held') && (await page.textContent('#frontstrip')).includes('will push back after 3 more battles'), 'the map shows the act front: ' + await page.textContent('#frontstrip'));
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
  await shot('w02-after-action');
  await page.locator('#modalactions button', { hasText: 'Offer amnesty' }).click();
  st = await read();
  check(st.flags.thorne_amnesty && st.fronts['Red Narrows'] === -2, 'amnesty recorded; Red Narrows moved by 4: ' + st.fronts['Red Narrows']);

  // Push back: three battles away from the Ash Marches
  for (const [i, sys] of ['kestrel', 'driftwall', 'vela'].entries()) {
    await patch({ pendingResult: { id: 'x:' + i, kind: 'intercept', ref: 'x:' + i, system: sys, outcome: 'win', tacticalOutcome: 'enemy_destroyed' }, launch: null });
    await page.reload();
    if (i === 1) { check((await page.textContent('#modalbody')).includes('pushed back while you fought elsewhere'), 'the third battle away (Thorne counted as the first) brings the push back'); await shot('w03-pushback'); }
    await page.locator('#modalactions .primary').click();
  }
  st = await read();
  check(st.fronts['Ash Marches'] === -8 && st.frontClock === 1, 'Ash Marches slipped to -8; the clock restarted');

  // The Pyre briefing: Thorne's charts and a turning Red Narrows
  await patch({ completed: [1, 2, 3], system: 'grimhold', fronts: { ...st.fronts, 'Red Narrows': 3 } }); await page.reload();
  await jump('grimhold');
  await page.locator('#arropslist .opcard.boss button', { hasText: 'Open briefing' }).click();
  const brief = await page.textContent('#modalbody');
  check(brief.includes('WHAT HAS CHANGED') && brief.includes('Thorne’s charts') && brief.includes('only one clan answers'), 'the briefing lists what has changed');
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

// The sector map, arrival, briefing, shipyard, services, upgrades, officers and after-action.
// Run: node tests/browser/map.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('map', {}, async ({ page, ctx, base, out, KEY, check, shot, read, write, patch, random, jump, playing }) => {
  await page.goto(base + '/campaign.html');
  await page.evaluate(k => localStorage.removeItem(k), KEY); await page.reload();
  // opening briefing
  check(await page.locator('#intro').isVisible(), 'admiral’s briefing opens on a new campaign');
  check((await page.textContent('#introtitle')).includes('Act I') && (await page.textContent('#intro')).includes('MNS Resolute'), 'briefing names the act and the flagship');
  await page.waitForTimeout(4600);
  await shot('00-intro');
  await page.click('#introgo');
  check(await page.locator('#intro').isHidden() && await page.evaluate(k => JSON.parse(localStorage.getItem(k)).introSeen, KEY) === true, 'Take command closes it and records it as seen');
  await page.reload();
  check(await page.locator('#intro').isHidden(), 'briefing does not repeat on the next visit');
  await page.click('#tabIntel'); await page.locator('#modalactions button', { hasText: 'Replay' }).click();
  check(await page.locator('#intro').isVisible(), 'briefing can be replayed from Intel');
  await page.keyboard.press('Escape');
  check(await page.locator('#intro').isHidden(), 'Escape closes the briefing');
  check(await page.locator('.sys').count() === 33, '33 systems drawn');
  check(await page.locator('#borders line').count() > 50, 'faction borders drawn: ' + await page.locator('#borders line').count());
  check(await page.locator('#lanebase line').count() === 53, '53 jump lanes');
  check((await page.textContent('#selname')) === 'Kestrel', 'Kestrel selected at start');
  check(await page.locator('#availlist .opitem').count() === 1, 'only one available operation listed');
  await shot('01-map');

  const kes = page.locator('.sys[data-id="kestrel"]');
  await kes.locator('.dot').hover();
  await page.waitForTimeout(300);
  const pill = kes.locator('.course button');
  check(await pill.isVisible(), 'set course pill shows on hover: ' + await pill.textContent());
  await shot('02-hover');
  await pill.click();
  check(await page.locator('#arrival').isVisible(), 'arrival screen opens after jump');
  check((await page.textContent('#arrname')) === 'Kestrel', 'arrival shows Kestrel');
  check((await page.textContent('#arrkicker')).includes('1 jump from Meridian'), 'arrival kicker: ' + await page.textContent('#arrkicker'));
  check(await page.locator('#arropslist .opcard h2').count() === 1, 'operation card on arrival');
  await shot('03-arrival');
  await page.click('#arropslist .pill.solid');
  check(await page.locator('#veil').isVisible(), 'briefing modal opens');
  await shot('04-briefing');
  await page.keyboard.press('Escape');
  check(await page.locator('#veil').isHidden(), 'Escape closes briefing');
  await page.keyboard.press('Escape');
  check(await page.locator('#mapview').isVisible() && await page.locator('#arrival').isHidden(), 'Escape returns to map');
  check(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).system, KEY) === 'kestrel', 'jump saved to campaign state');
  check(await page.locator('.sys.home[data-id="kestrel"]').count() === 1, 'flagship marker moved to Kestrel');

  // a system with no open operation
  await page.locator('.sys[data-id="vela"] .dot').hover(); await page.waitForTimeout(250);
  await page.locator('.sys[data-id="vela"] .course button').click();
  check((await page.textContent('#arropslist')).includes('No operations in Vela'), 'empty arrival state for Vela');
  await shot('05-arrival-empty');
  await page.click('#arrback');

  // shipyard
  await page.click('#tabShip');
  check(await page.locator('#yard').isVisible(), 'shipyard opens');
  check(await page.locator('#slots .slot').count() === 7, 'seven system slots');
  await page.waitForFunction(() => document.getElementById('shipwait').hidden, null, { timeout: 90000 }).catch(() => {});
  check(await page.locator('#shipwait').isHidden(), '3D ship rendered (frames reached the overlay)');
  await page.waitForTimeout(600);
  await shot('06-yard');
  await page.locator('#slots .slot', { hasText: 'Shields' }).click();
  check((await page.textContent('#markk')).includes('Shields'), 'selecting a slot switches the upgrade list');
  check(await page.locator('#shieldline.on').count() === 1, 'shield envelope highlighted');
  await page.waitForTimeout(300);
  await shot('07-yard-shields');

  // damaged ship: services work
  await page.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); Object.assign(s.ships[0], { hull: 0.6, sub: { engines: 40, shields: 100, reactor: 80, port: 100, stbd: 60, fore: 100, torp: 100 }, torps: 3 }); Object.assign(s, { system: 'meridian', credits: 850 }); localStorage.setItem(k, JSON.stringify(s)); }, KEY);
  await page.reload(); await page.click('#tabShip');
  const eng = page.locator('#slots .slot', { hasText: 'Engines' });
  check((await eng.textContent()).includes('40%'), 'engine slot shows battle damage');
  const over = page.locator('#svclist button', { hasText: 'Overhaul' });
  check(await over.isEnabled(), 'overhaul offered: ' + await over.textContent());
  await over.click();
  let st = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  check(st.ships[0].hull === 1 && st.ships[0].sub === null && st.credits === 850 - 240, 'overhaul restores hull and subsystems, costs 240');
  await page.locator('#svclist button', { hasText: 'Resupply' }).click();
  st = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  check(st.ships[0].torps === 8 && st.credits === 610 - 125, 'torpedo resupply fills 5 torpedoes for 125');
  await shot('08-yard-after-services');

  // buying an upgrade
  await page.locator('#slots .slot', { hasText: 'Broadsides' }).click();
  const buy = page.locator('#markcards .upcard', { hasText: 'Rapid loaders' }).locator('button');
  check(await buy.isEnabled() && (await buy.textContent()).includes('400'), 'rapid loaders on sale for 400');
  await buy.click();
  check(await page.locator('#veil').isVisible() && (await page.textContent('#modaltitle')).includes('Rapid loaders'), 'purchase asks for confirmation');
  await page.locator('#modalactions .primary').click();
  st = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  check(st.credits === 85 && st.ships[0].upgrades.includes('rapid_loaders'), 'upgrade bought: 400 spent and saved');
  check((await page.textContent('#markspec')).includes('6.4 s reload'), 'broadside spec shows the faster reload: ' + await page.textContent('#markspec'));
  check((await page.locator('#slots .slot', { hasText: 'Broadsides' }).textContent()).includes('1/3 FITTED'), 'slot shows the fitted upgrade');
  check(await page.locator('#markcards .upcard.got').count() === 1, 'card marked installed');
  check(await page.locator('#markcards button:disabled').count() === 3, 'unaffordable upgrades are disabled');
  await shot('08b-yard-upgrade');

  // officers screen
  await page.click('#tabCrew');
  check(await page.locator('#crewview').isVisible() && await page.locator('#tabCrew.current').count() === 1, 'officers screen opens');
  check(await page.locator('#crewlist .officer').count() === 5, 'five officers listed');
  check((await page.textContent('#dosname')) === 'Ensign Elise Varro', 'first officer shown');
  await page.locator('#crewlist .officer', { hasText: 'Renn' }).click();
  check((await page.textContent('#dosname')) === 'Ensign Idris Renn' && (await page.textContent('#doskey')) === '9', 'Renn selected with his command key');
  check((await page.textContent('#dosreports')).includes('Operation 01'), 'Renn shows his operation 1 report');
  check((await page.textContent('#foelist')).includes('Captain Kora Vex') && (await page.textContent('#foelist')).includes('9 more commanders'), 'only identified adversaries shown');
  await shot('08c-officers');
  await page.keyboard.press('Escape');
  check(await page.locator('#crewview').isHidden(), 'Escape leaves the officers screen');

  // after-action report and unlocking the next operation
  await page.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); s.pendingResult = { id: 1, outcome: 'win', tacticalOutcome: 'escort_saved' }; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
  await page.reload();
  check(await page.locator('#veil').isVisible(), 'after-action report on return');
  await page.locator('#modalactions button', { hasText: 'Recover civilian survivors' }).click();
  check((await page.textContent('#availlist')).includes('The Cinder Wake'), 'operation 2 now available');
  check(await page.locator('#availlist .opitem').count() === 1, 'completed operation removed from list');
  await shot('09-after-action');

  // another hull
  await page.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); s.ships[0].ship = 'warden'; s.ships[0].torps = null; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
  await page.reload(); await page.click('#tabShip');
  await page.waitForFunction(() => document.getElementById('shipwait').hidden, null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(600);
  check((await page.textContent('#slots')).includes('Siege cannons'), 'Warden shows its own forward weapon');
  await shot('10-yard-warden');

  for (const [w, h] of [[1280, 720], [390, 844]]) { await page.setViewportSize({ width: w, height: h }); await page.click('#tabMap'); await page.waitForTimeout(200); await shot(`11-map-${w}`); }
});

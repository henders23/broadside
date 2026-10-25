// Milestone 2: buying hulls, a fleet of three, per-ship state, 3 v 3 battles.
// Run: node tests/browser/fleet.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('fleet', {}, async ({ page, ctx, base, out, KEY, check, shot, read, write, patch, random, jump, playing }) => {
  const waitShip = () => page.waitForFunction(() => document.getElementById('shipwait').hidden, null, { timeout: 90000 }).catch(() => {});

  await page.goto(base + '/campaign.html');
  await page.evaluate(k => localStorage.removeItem(k), KEY); await page.reload();
  await page.click('#introgo');
  await patch({ credits: 5000 }); await page.reload();
  await page.click('#tabShip'); await waitShip();
  check(await page.locator('#fleetlist .fship:not(.add)').count() === 1 && (await page.textContent('#fleetn')) === '1 of 3', 'one ship in the fleet');
  check((await page.textContent('#shiprole')) === 'Flagship' && (await page.textContent('#shipnm')) === 'MNS Resolute', 'the Resolute is the flagship');

  // Commission a Sabre
  await page.locator('#fleetlist .fship.add').click();
  check((await page.textContent('#modaltitle')) === 'Commission a hull' && await page.locator('#modalbody .choice').count() === 4, 'hull market lists four hulls');
  await shot('f01-hull-market');
  await page.locator('#modalbody .choice[data-k="sabre"]').click();
  check((await page.inputValue('#shipNameInput')) === 'MNS Valiant', 'a name is suggested');
  await page.fill('#shipNameInput', '  MNS   Harrier <b> ');
  await page.locator('#modalactions .primary').click();
  let st = await read();
  check(st.ships.length === 2 && st.ships[1].ship === 'sabre' && st.ships[1].shipName === 'MNS Harrier <b>' && st.credits === 5000 - 1100, 'Sabre commissioned for 1,100 and named (whitespace tidied)');
  check((await page.textContent('#shiprole')) === 'Escort' && (await page.textContent('#shipnm')) === 'MNS Harrier <b>', 'the new ship is selected, as an escort, name shown as text');
  await waitShip(); await page.waitForTimeout(500);
  check((await page.textContent('#slots')).includes('Bow battery'), 'the yard shows the Sabre’s own systems');
  await shot('f02-yard-sabre');

  // Upgrades belong to one ship
  await page.locator('#slots .slot', { hasText: 'Engines' }).click();
  await page.locator('#markcards .upcard', { hasText: 'Vectored thrusters' }).locator('button').click();
  await page.locator('#modalactions .primary').click();
  st = await read();
  check(st.ships[1].upgrades.includes('vectored_thrusters') && st.ships[0].upgrades.length === 0, 'upgrade fitted to the Harrier only');

  // Damage and services per ship
  await page.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); s.ships[1].hull = 0.5; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
  await page.reload(); await page.click('#tabShip');
  await page.locator('#fleetlist .fship', { hasText: 'Harrier' }).click();
  const over = page.locator('#svclist button', { hasText: 'Overhaul' });
  check((await over.textContent()).includes('300'), 'overhaul priced for the Harrier’s damage: ' + await over.textContent());
  await over.click();
  st = await read();
  check(st.ships[1].hull === 1 && st.ships[0].hull === 1, 'the Harrier is repaired');

  // A third ship, then a full fleet
  await page.locator('#fleetlist .fship.add').click();
  await page.locator('#modalbody .choice[data-k="halberd"]').click();
  await page.locator('#modalactions .primary').click();
  st = await read();
  check(st.ships.length === 3 && st.ships[2].shipName === 'MNS Valiant', 'Halberd commissioned as MNS Valiant');
  check(await page.locator('#fleetlist .fship.add').count() === 0, 'no commission slot with three ships');
  check((await page.textContent('#fleetstatus')).includes('FLEET 3/3'), 'top bar shows the fleet: ' + await page.textContent('#fleetstatus'));
  await shot('f03-fleet-of-three');

  // Make the Harrier flagship, put the Resolute in reserve, then deploy her again
  await page.locator('#fleetlist .fship', { hasText: 'Harrier' }).click();
  await page.locator('#shipacts button', { hasText: 'Make flagship' }).click();
  st = await read();
  check(st.flag === st.ships[1].id && (await page.textContent('#shiprole')) === 'Flagship', 'Harrier is now the flagship');
  await page.locator('#fleetlist .fship', { hasText: 'Resolute' }).click();
  await page.locator('#shipacts button', { hasText: 'Move to reserve' }).click();
  st = await read();
  check(st.ships[0].reserve === true && (await page.textContent('#fleetstatus')).includes('FLEET 2/3'), 'Resolute in reserve: two ships deploy');
  await page.locator('#shipacts button', { hasText: 'Deploy' }).click();

  // Selling a ship (and the flagship cannot be sold)
  await page.locator('#fleetlist .fship', { hasText: 'Valiant' }).click();
  await page.locator('#shipacts button', { hasText: 'Sell' }).click();
  await page.locator('#modalactions .primary').click();
  st = await read();
  check(st.ships.length === 2 && st.credits === 5000 - 1100 - 320 - 300 - 1250 + 625, 'Valiant sold for half her hull price: ' + st.credits);
  await page.locator('#fleetlist .fship', { hasText: 'Harrier' }).click();
  check(await page.locator('#shipacts button', { hasText: 'Sell' }).count() === 0, 'the flagship cannot be sold');

  // Undocked: no buying or selling
  await patch({ system: 'kestrel' }); await page.reload(); await page.click('#tabShip');
  check(await page.locator('#fleetlist .fship.add').isDisabled(), 'cannot commission away from a starbase');
  await page.locator('#fleetlist .fship', { hasText: 'Resolute' }).click();
  check(await page.locator('#shipacts button', { hasText: 'Sell' }).isDisabled(), 'cannot sell away from a starbase');

  // Buy back up to three and fly operation 1 as a fleet
  await patch({ system: 'meridian' }); await page.reload(); await page.click('#tabShip');
  await page.locator('#fleetlist .fship.add').click();
  await page.locator('#modalbody .choice[data-k="warden"]').click();
  await page.locator('#modalactions .primary').click();
  await patch({ system: 'kestrel' }); await page.reload();
  st = await read();
  check(st.ships.length === 3, 'three ships for the battle');
  await page.locator('.sys[data-id="kestrel"] .dot').hover(); await page.waitForTimeout(200);
  await page.locator('.sys[data-id="kestrel"] .course button').click();
  await page.locator('#arropslist .opcard', { hasText: 'Distress at Kestrel' }).locator('button', { hasText: 'Open briefing' }).click();
  check((await page.textContent('#modalbody')).includes('Fleet:') && (await page.textContent('#modalbody')).includes('MNS Harrier &lt;b&gt;'.replace('&lt;', '<').replace('&gt;', '>')), 'briefing lists the fleet');
  await page.locator('#modalactions .primary').click();
  await page.waitForURL(/index\.html\?encounter=1/);
  await page.goto(base + '/index.html?encounter=1&sim');
  await page.waitForFunction(() => window.__sim && window.__sim.state === 'playing', null, { timeout: 240000 });
  await page.waitForTimeout(1500);
  let b = await page.evaluate(() => { const S = window.__sim; return { player: S.player.name, cls: S.player.key, allies: S.fleet.allies.map(a => a.name + '/' + a.key), hostiles: S.ships.filter(s => s.team === 'e').map(s => s.name), panel: !document.getElementById('escorts').hidden, rows: document.querySelectorAll('#esc-list .esc').length, order: document.getElementById('esc-order').textContent }; });
  check(b.player === 'MNS Harrier <b>' && b.cls === 'sabre', 'flying the Harrier: ' + b.player);
  check(b.allies.length === 2 && b.allies.includes('MNS Resolute/bastion'), 'two escorts: ' + b.allies.join(', '));
  check(b.hostiles.length === 2 && b.hostiles.filter(n => n === 'Corsair escort').length === 1, 'Vex brings one escort against three ships (support cap 1): ' + b.hostiles.join(', '));
  check(b.panel && b.rows === 2 && b.order === 'Focus my target', 'escort panel shows both escorts and the order');
  await page.keyboard.press('KeyI'); await page.waitForTimeout(400);
  check(await page.evaluate(() => window.__sim.fleet.order) === 'defend' && (await page.textContent('#esc-order')) === 'Defend the flagship', 'I orders the escorts to defend');
  await page.locator('.escbtns button[data-o="free"]').click();
  check(await page.evaluate(() => window.__sim.fleet.order) === 'free', 'the Free button works');
  await page.evaluate(() => window.__sim.step(120));
  await page.waitForTimeout(800);
  const targets = await page.evaluate(() => window.__sim.fleet.allies.map(a => a.target && a.target.team));
  check(targets.every(t => t === 'e'), 'escorts have hostile targets');
  await shot('f04-fleet-battle');

  // Damage an escort, disable the other, win, and read the save
  await page.evaluate(() => { const S = window.__sim, [a, b] = S.fleet.allies; a.hull = a.C.hull * 0.6; const o = () => S.player.pos.clone().set(0, 0, 0); S.damage(b, b.C.hull * 5, 'shell', o(), null); for (const e of S.ships.filter(s => s.team === 'e')) if (e.alive) S.damage(e, e.C.hull * 5, 'shell', o(), S.player); });
  await page.waitForFunction(() => window.__sim.state === 'over', null, { timeout: 60000 }).catch(() => {});
  for (let i = 0; i < 40 && await page.evaluate(() => window.__sim.state) !== 'over'; i++) { await page.evaluate(() => window.__sim.step(30)); await page.waitForTimeout(250); }
  check(await page.evaluate(() => window.__sim.state) === 'over', 'battle over');
  await shot('f05-over');
  st = await read();
  const byName = n => st.ships.find(r => r.shipName === n);
  const [e1, e2] = await page.evaluate(() => window.__sim.fleet.allies.map(a => a.name));
  check(st.pendingResult && st.pendingResult.outcome === 'win', 'won: ' + JSON.stringify(st.pendingResult && st.pendingResult.tacticalOutcome));
  check(Math.abs(byName(e1).hull - 0.6) < 0.02, `${e1} kept her damage: ${byName(e1).hull}`);
  check(byName(e2).hull === 0.3 && byName(e2).sub === null, `${e2} recovered at 30%`);
  check(JSON.stringify(st.pendingResult.lost) === JSON.stringify([e2]), 'the after-action knows who was disabled');
  await page.goto(base + '/campaign.html');
  check((await page.textContent('#modalbody')).includes('was disabled in the fighting'), 'after-action report mentions the disabled escort');
  await shot('f06-after-action');
});

// Officer experience and promotions.
// Run: node tests/browser/officers.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('officers', {}, async ({ page, ctx, base, out, KEY, check, shot, read, write, patch, random, jump, playing }) => {
  const p = page, save = write;
  await p.goto(base + '/campaign.html');
  // returning from operation 2 with Varro used twice and Okoye three times
  await save({ version: 1, ship: 'bastion', shipName: 'MNS Resolute', system: 'cinder', completed: [1], flags: {}, credits: 900, hull: 0.8, sub: null, torps: null, attempts: 2, upgrades: [], introSeen: true,
    officers: { varro: { xp: 60, battles: 1, uses: 0 }, okoye: { xp: 75, battles: 1, uses: 1 }, vale: { xp: 60, battles: 1, uses: 0 }, sato: { xp: 60, battles: 1, uses: 0 }, renn: { xp: 90, battles: 1, uses: 2 } },
    pendingResult: { id: 2, outcome: 'win', tacticalOutcome: 'fleet_destroyed', officerUses: { varro: 2, okoye: 3, vale: 0, sato: 1, renn: 0 } } });
  await p.reload();
  const body = await p.textContent('#modalbody');
  check(body.includes('BRIDGE CREW EXPERIENCE') && body.includes('promoted to Lieutenant'), 'after-action report lists experience and promotions');
  let st = await read();
  check(st.officers.okoye.xp === 75 + 60 + 45 && st.officers.varro.xp === 60 + 90 && st.officers.okoye.battles === 2, 'experience saved: ' + JSON.stringify(st.officers));
  await p.screenshot({ path: `${out}/xp-after-action.png` });
  await p.locator('#modalactions button', { hasText: 'Review map' }).click();
  await p.reload();
  st = await read();
  check(st.officers.okoye.xp === 180, 'reloading before choosing does not award experience twice');
  await p.locator('#modalactions button').last().click();
  st = await read();
  check(st.pendingResult === null && st.completed.includes(2), 'after-action choice still completes the operation');
  await p.click('#tabCrew'); await p.waitForTimeout(300);
  await p.locator('#crewlist .officer', { hasText: 'Okoye' }).click();
  check((await p.textContent('#dosrank')).startsWith('Lieutenant · rank 2 of 5'), 'Okoye shows her new rank: ' + await p.textContent('#dosrank'));
  check((await p.textContent('#doseffect')).includes('13% more damage') && (await p.textContent('#doscool')).includes('105 s (base 110 s)'), 'command reflects the rank: ' + await p.textContent('#doseffect') + ' / ' + await p.textContent('#doscool'));
  check((await p.textContent('#crewlist')).includes('Lieutenant Imani Okoye') && (await p.textContent('#crewlist')).includes('Tactical Officer · 70 XP to Lt. Commander'), 'officer list shows rank in the name and progress below');
  await p.screenshot({ path: `${out}/xp-officers.png` });
  await p.locator('#crewlist .officer', { hasText: 'Varro' }).click();
  await p.screenshot({ path: `${out}/xp-officers-varro.png` });
  // Thorne's painted portrait appears on the arrival card at Red Narrows
  const thorne = await p.evaluate(() => { const s = document.createElement('div'); s.innerHTML = window.BroadsidePersonnel.portrait(window.BroadsidePersonnel.commanders[3]); return s.firstElementChild.style.backgroundImage; });
  check(thorne.includes('thorne.webp'), 'Thorne uses the new portrait');
});

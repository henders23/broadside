// Milestone 4: save slots, difficulty, reputation, recruits, captured hulls, codex.
// Run: node tests/browser/depth.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('depth', { random: 0.99 }, async ({ page, ctx, base, out, KEY, check, shot, read, write, patch, random, jump, playing }) => {
  const battle = async url => { await page.goto(base + url); await page.waitForFunction(() => window.__sim && window.__sim.state === 'playing', null, { timeout: 240000 }); await page.waitForTimeout(1000); };

  await page.goto(base + '/campaign.html');
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#introgo');

  // --- Save slots
  await page.click('#tabNew');
  check((await page.textContent('#modaltitle')) === 'Saved campaigns' && await page.locator('#savelist .slot-row').count() === 3, 'Saves lists three slots');
  check((await page.textContent('#savelist .slot-row.on')).includes('Slot 1 · playing'), 'slot 1 is playing');
  await shot('d01-saves');
  await page.locator('#savelist .slot-row', { hasText: 'Slot 2' }).locator('[data-new]').click();
  await page.selectOption('#pickShip', 'sabre'); await page.selectOption('#pickDiff2', 'admiral');
  await page.locator('#modalactions .primary').click();
  await page.waitForLoadState('load'); await page.waitForTimeout(500);
  check(await page.evaluate(() => localStorage.getItem('broadside-campaign-slot')) === '2', 'switched to slot 2');
  let s2 = await read('broadside-campaign-v1-s2');
  check(s2 && s2.ships[0].ship === 'sabre' && s2.difficulty === 'admiral', 'slot 2: a Sabre campaign on Admiral');
  check(await page.locator('#intro').isVisible(), 'the new campaign opens with the Act I briefing');
  await page.click('#introgo');
  check((await read()).ships[0].ship === 'bastion', 'slot 1 untouched');
  // Admiral in battle
  await page.evaluate(() => { const k = 'broadside-campaign-v1-s2', s = JSON.parse(localStorage.getItem(k)); s.system = 'kestrel'; localStorage.setItem(k, JSON.stringify(s)); });
  await battle('/index.html?campaign=1&sim');
  const adm = await page.evaluate(() => { const S = window.__sim, e = S.enemy; return { label: e.ai.diff.label, hull: e.hull, base: e.C.hull, player: S.player.key, foe: document.getElementById('foe-cls').textContent }; });
  check(adm.player === 'sabre' && adm.label === 'Admiral' && adm.hull === Math.round(adm.base * 1.15) && true, 'Admiral: sharper captain, 15% more hull: ' + JSON.stringify(adm));
  const hit = await page.evaluate(() => { const S = window.__sim, p = S.player; p.sh = [0, 0, 0, 0]; const h = p.hull; S.damage(p, 100, 'shell', p.pos.clone().set(0, 0, 0), S.enemy); return h - p.hull; });
  check(hit > 100 && hit < 130, 'enemy hits land 15% harder: ' + Math.round(hit));
  await page.goto(base + '/campaign.html');
  await page.click('#tabNew');
  await page.locator('#savelist .slot-row', { hasText: 'Slot 1' }).locator('[data-load]').click();
  await page.waitForLoadState('load'); await page.waitForTimeout(500);
  check(await page.evaluate(() => localStorage.getItem('broadside-campaign-slot')) === '1' && (await page.textContent('#fleetstatus')).includes('REQ 850'), 'loaded slot 1 back');
  await page.click('#tabNew');
  await page.locator('#savelist .slot-row', { hasText: 'Slot 2' }).locator('[data-del]').click();
  await page.locator('#modalactions .primary').click();
  check(await page.evaluate(() => localStorage.getItem('broadside-campaign-v1-s2')) === null && (await page.textContent('#savelist')).includes('Slot 2 · Empty'), 'slot 2 deleted');
  await page.keyboard.press('Escape');

  // --- Reputation at Peregrine (Trusted)
  await patch({ system: 'peregrine', credits: 6000, rep: { peregrine: 55 } }); await page.reload();
  await jump('peregrine');
  check((await page.textContent('#arropslist')).includes('TRUSTED'), 'arrival card shows the standing');
  await page.locator('#arropslist button', { hasText: 'Mission board' }).click();
  check((await page.textContent('#bstanding')).startsWith('Trusted · 55'), 'board shows standing: ' + await page.textContent('#bstanding'));
  check(await page.locator('#bcontractlist .job').count() === 4 && (await page.textContent('#bcontractlist')).includes('Priority bounty'), 'a Trusted station posts a priority contract');
  const base0 = await page.evaluate(() => window.BroadsideCampaign.contracts('peregrine', 0, 1, true)[0]);
  const danger0 = await page.evaluate(b => { const C = window.BroadsideCampaign, s = JSON.parse(localStorage.getItem('broadside-campaign-v1')), f = C.frontOf(s.fronts, b.system); return f ? C.FRONT_EFFECTS.danger[f.level] : 1; }, base0);
  check((await page.locator('#bcontractlist .job').first().textContent()).includes(`${Math.round(base0.reward * 1.1 * danger0)} REQ`), 'Trusted pays 10% more (times the front’s danger money ' + danger0 + ')');
  // recruit
  const hireCard = page.locator('#bsidelist .job.hire');
  check(await hireCard.count() === 1 && (await hireCard.textContent()).includes('Dario Fenn') && (await hireCard.textContent()).includes('Overcharge'), 'Fenn is for hire at Peregrine');
  await shot('d02-board-trusted');
  await hireCard.locator('button').click();
  check((await page.textContent('#modaltitle')).includes('Dario Fenn joins'), 'hiring opens the assignment choice');
  await page.locator('#modalactions .primary').click();
  let st = await read();
  check(st.hired.includes('fenn') && st.crew.okoye === 'fenn' && st.credits === 6000 - 432 && st.officers.fenn.xp === 100, 'Fenn hired at 10% off and on duty as Tactical Officer');
  await page.keyboard.press('Escape');
  // yard prices
  await page.click('#tabShip');
  await page.locator('#slots .slot', { hasText: 'Broadsides' }).click();
  check((await page.locator('#markcards .upcard', { hasText: 'Rapid loaders' }).textContent()).includes('Install · 360'), 'upgrades 10% off at a Trusted yard');
  check((await page.textContent('#svclist')).includes('Trusted, 10% off'), 'services note the discount');
  // officers screen
  await page.click('#tabCrew');
  check((await page.textContent('#crewlist')).includes('In reserve') && (await page.textContent('#crewlist')).includes('Imani Okoye'), 'Okoye is in reserve');
  await page.locator('#crewlist .officer', { hasText: 'Fenn' }).click();
  check((await page.textContent('#dosduty')).includes('On duty as Tactical Officer · command key 6') && (await page.textContent('#doskey')) === '6', 'Fenn holds key 6');
  await shot('d03-officers-recruit');
  await page.locator('#crewlist .officer', { hasText: 'Okoye' }).click();
  check((await page.textContent('#dosduty')).includes('Dario Fenn holds the post'), 'Okoye’s dossier says who holds her post');
  await page.locator('#dosduty button', { hasText: 'Assign' }).click();
  check((await read()).crew.okoye === 'okoye', 'Okoye back on duty');
  await page.locator('#crewlist .officer', { hasText: 'Fenn' }).click();
  await page.locator('#dosduty button', { hasText: 'Assign' }).click();
  check((await read()).crew.okoye === 'fenn', 'and Fenn again');

  // --- Capture a wreck after Distress at Kestrel
  await patch({ system: 'kestrel', pendingResult: { id: 1, kind: 'story', ref: 'story:1', system: 'kestrel', outcome: 'win', tacticalOutcome: 'escort_saved', met: ['scrapjaw'], wrecks: [{ cls: 'scrapjaw', name: 'Captain Kora Vex' }] } });
  await page.reload();
  check((await page.textContent('#modalbody')).includes('SALVAGE · CLAIM ONE WRECK') && (await page.textContent('#modalbody')).includes('Captain Kora Vex'), 'after-action offers Vex’s wreck');
  await shot('d04-claim');
  await page.locator('#modalbody [data-claim="0"]').click();
  st = await read();
  const prize = st.ships.find(r => r.ship === 'scrapjaw');
  check(prize && prize.shipName === 'MNS Jackal' && prize.reserve && prize.hull === 0.35 && st.pendingResult.claimed === 'MNS Jackal', 'Vex’s Scrapjaw claimed as MNS Jackal, in reserve at 35%');
  check(st.credits === 6000 - 432 - 650, 'refit cost 650 (no discount at Kestrel)');
  await page.locator('#modalactions button', { hasText: 'Recover civilian survivors' }).click();
  st = await read();
  check(st.completed.includes(1) && st.met.includes('scrapjaw') && st.rep.meridian === 5, 'operation complete, Scrapjaw met, Navy standing +5');
  // the codex
  await page.click('#tabCodex');
  check(await page.locator('#codexview').isVisible() && (await page.textContent('#cxcount')).startsWith('Codex ·'), 'codex opens: ' + await page.textContent('#cxcount'));
  await page.locator('#cxlist .cx', { hasText: 'Scrapjaw' }).click();
  check((await page.textContent('#cxtitle')) === 'Scrapjaw' && (await page.textContent('#cxstats')).includes('Capturable'), 'Scrapjaw entry unlocked by meeting one');
  check(await page.locator('#cxlist .cx.locked').count() > 0, 'undiscovered entries stay hidden');
  await shot('d05-codex');
  // fly the prize
  await patch({ system: 'meridian', pendingResult: null }); await page.reload();
  await page.click('#tabShip');
  await page.locator('#fleetlist .fship', { hasText: 'Jackal' }).click();
  await page.waitForFunction(() => document.getElementById('shipwait').hidden, null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(600);
  const slots = await page.locator('#slots .slot').allTextContents();
  check(slots.length === 6 && slots.some(t => t.includes('Scatterguns')) && slots.some(t => t.includes('Autocannons')) && !slots.some(t => t.includes('Torpedo')), 'the yard shows the Scrapjaw’s own six systems');
  await shot('d06-yard-scrapjaw');
  await page.locator('#svclist button', { hasText: 'Overhaul' }).click();
  await page.locator('#shipacts button', { hasText: 'Make flagship' }).click();
  st = await read();
  check(st.flag === prize.id && st.ships.find(r => r.id === prize.id).hull === 1, 'Jackal repaired and made flagship');
  await patch({ system: 'rednarrows', completed: [1, 2] }); await page.reload();
  await battle('/index.html?campaign=3&sim');
  const fly = await page.evaluate(() => { const S = window.__sim; return { key: S.player.key, name: S.player.name, groups: S.player.groups.map(g => g.label), deck: [...document.querySelectorAll('#bridge-orders .order b')].map(b => b.textContent) }; });
  check(fly.key === 'scrapjaw' && fly.name === 'MNS Jackal' && fly.groups.includes('Autocannons'), 'flying the captured Scrapjaw: ' + fly.groups.join(', '));
  check(fly.deck[1] === 'Overcharge', 'Fenn’s Overcharge is command 6 on the bridge deck');
  await page.evaluate(() => { for (const g of window.__sim.player.groups) g.charge = 0.1; });
  await page.keyboard.press('Digit6'); await page.waitForTimeout(300);
  check(await page.evaluate(() => window.__sim.bridge.uses.fenn === 1 && window.__sim.player.groups.every(g => g.charge >= 1)), 'Overcharge (key 6) reloads every gun in battle');
  await shot('d07-flying-scrapjaw');
  // Thorne surrenders; impound his ship
  await page.goto(base + '/campaign.html');
  await patch({ pendingResult: { id: 3, kind: 'story', ref: 'story:3', system: 'rednarrows', outcome: 'win', tacticalOutcome: 'surrender', wrecks: [{ cls: 'scrapjaw', name: 'Captain Garrick Thorne' }] } });
  await page.reload();
  check((await page.textContent('#modalbody')).includes('includes Thorne’s ship, The Widow'), 'impound offer explained');
  await page.locator('#modalactions button', { hasText: 'Impound' }).click();
  st = await read();
  check(st.ships.some(r => r.shipName === 'The Widow' && r.ship === 'scrapjaw' && r.reserve && r.hull === 0.5), 'The Widow impounded into the fleet');
});

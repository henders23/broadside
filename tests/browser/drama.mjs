// Campaign drama: a rival who jumps out and comes back refitted, a jump-lane event, a bridge casualty and the
// replacement posted after it, and battle honours (kill marks, a medal, a paint scheme it unlocks).
// Run: node tests/browser/drama.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('drama', { random: 0.99 }, async ({ page, base, check, shot, read, write, patch, random }) => {
  const S = (f, a) => page.evaluate(f, a);
  const battle = async () => { await page.goto(base + '/index.html?encounter=1&sim'); await page.waitForFunction(() => window.__sim && window.__sim.state === 'playing', null, { timeout: 240000 }); await page.waitForTimeout(800); };
  const over = async () => { for (let i = 0; i < 80 && await S(() => window.__sim.state) !== 'over'; i++) { await S(() => window.__sim.step(30)); await page.waitForTimeout(100); } return (await S(() => window.__sim.state)) === 'over'; };
  const campaign = async () => { await page.goto(base + '/campaign.html'); await page.waitForTimeout(900); };

  await page.goto(base + '/campaign.html');
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.click('#introgo');
  let s = await read();
  check(Array.isArray(s.rivals) && Array.isArray(s.fallen) && s.wounds && s.medals && s.replacements, 'a new campaign carries rivals, wounds, the fallen and medals');

  // --- A bounty target gets away
  const job = await S(() => { const k = Campaign.contracts('peregrine', 0, 1).find(c => c.type === 'bounty'); state.contracts = [k]; state.system = k.system; persist();
    const spec = Campaign.encounter(k, cctx()); spec.escape = { at: 0.25, window: 2 }; state.launch = spec; persist(); return { id: k.id, captain: k.captain, ship: k.enemies[0].name, system: k.system, reward: pay(k) }; });
  await battle();
  const b1 = await S(() => { const S = window.__sim, e = S.enemy; return { rival: !!e.rival, name: e.name, captain: e.captain, line: e.rivalLine, panel: document.getElementById('foe-name').textContent + ' / ' + document.getElementById('foe-cls').textContent }; });
  check(b1.rival && b1.name === job.ship && b1.captain === job.captain && b1.line, 'the bounty target is marked as a possible rival: ' + b1.captain + ' in the ' + b1.name);
  check(job.ship !== job.captain && b1.panel.startsWith(job.ship) && b1.panel.includes(job.captain), 'the target panel names the ship, with the captain under it: ' + b1.panel);
  await S(() => { const S = window.__sim, e = S.enemy; e.sh = [0, 0, 0, 0]; S.damage(e, e.hull * 0.82, 'shell', e.pos.clone().set(-40, 0, 0), S.player); S.step(12); });   // past the next refresh of the objective line
  const esc = await S(() => ({ t: window.__sim.fleet.escaping, msg: document.getElementById('fleet-objective').textContent, hidden: document.getElementById('fleet-objective').hidden, flee: !!window.__sim.enemy.ai.flee }));
  check(esc.t > 0 && esc.flee && /JUMPS IN/.test(esc.msg) && !esc.hidden, 'below a quarter hull the jump drive spools, with a countdown: ' + esc.msg);
  await shot('r1-escaping');
  check(await over(), 'the battle ends when the rival jumps');
  const r1 = await S(() => ({ code: window.__sim.game.campaignOutcome, word: document.getElementById('over-word').textContent, ships: window.__sim.ships.some(s => s.name === window.__sim.enemy.name && s.team === 'e') }));
  check(r1.code === 'driven_off' && r1.word === 'Driven off', 'driven off, not destroyed: ' + JSON.stringify(r1));
  s = await read();
  check(s.pendingResult.rival && s.pendingResult.rival.fate === 'escaped' && s.pendingResult.rival.memory.facing === 2, 'the result records the escape and the port side it lost: ' + JSON.stringify(s.pendingResult.rival));
  await campaign();
  const rep1 = await page.textContent('#modalbody');
  check(rep1.includes('RIVAL · GOT AWAY') && rep1.includes(job.captain) && rep1.includes('port shield emitters'), 'the report names the new rival and the refit aimed at the broken port side');
  check(rep1.includes(`${Math.round(job.reward / 2)} requisition`), 'a job half done pays half: ' + Math.round(job.reward / 2));
  await shot('r2-report-got-away');
  await page.locator('#modalactions .primary').click();
  s = await read();
  check(s.rivals.length === 1 && s.rivals[0].status === 'at large' && s.rivals[0].upgrades[0] === 'facing:2' && !s.pendingResult, 'the rival is on record, refitted');

  // --- A wanted poster at the nearest starbase
  const station = await S(() => Campaign.nearestStation(state.rivals[0].last));
  await patch({ system: station }); await campaign();
  await page.evaluate(st => openBoard(st), station);
  check((await page.textContent('#bcontractlist')).includes('Wanted · rival') && (await page.textContent('#bcontractlist')).includes('Wanted: ' + job.captain), 'a wanted poster goes up at ' + station);
  await shot('r3-wanted');

  // --- The rival comes back
  await S(() => { closeModal(); rivalAmbush(state.rivals[0], state.rivals[0].last, null); });
  const amb = await page.textContent('#modalbody');
  check(amb.includes(job.captain) && /port/i.test(amb), 'the ambush hail remembers the port side');
  await shot('r4-rival-returns');
  await page.locator('#modalactions button', { hasText: 'Battle stations' }).click();
  await page.waitForURL(/index\.html\?encounter=1/); await battle();
  const b2 = await S(() => { const e = window.__sim.enemy; return { name: e.name, captain: e.captain, port: e.cap[2], fore: e.cap[0], escape: window.__sim.fleet.spec.escape }; });
  check(b2.name === job.ship && b2.captain === job.captain && b2.port > b2.fore * 1.5, 'back with the port shield doubled: ' + JSON.stringify(b2));
  await S(() => { const S = window.__sim, e = S.enemy; e.sh = [0, 0, 0, 0]; S.fleet.spec.escape = null; S.damage(e, 1e6, 'torp', e.pos.clone().set(0, 0, -40), S.player); });
  check(await S(() => window.__sim.killCam && /“/.test(document.getElementById('kc-sub').textContent)), 'the kill cam carries the rival’s last words');
  await shot('r5-rival-killcam');
  check(await over(), 'the rival is destroyed');
  const end = await S(() => ({ word: document.getElementById('over-word').textContent, sub: document.getElementById('over-sub').textContent }));
  check(end.word === job.ship + ' destroyed' && end.sub.includes(job.captain) && /went down|killed/.test(end.sub), 'the end screen names the ship, and under it the captain’s fate: ' + JSON.stringify(end));
  await shot('r5b-end-screen');
  s = await read();
  check(s.pendingResult.honours.rivalKilled && s.pendingResult.ships[0].kills[0].rival, 'the kill is credited to the flagship as a rival');
  const credits0 = s.credits;
  await campaign();
  const rep2 = await page.textContent('#modalbody');
  check(rep2.includes('SCORE SETTLED') && rep2.includes('Old Score Settled') && rep2.includes('BATTLE HONOURS'), 'the report settles the score and awards the medal');
  check(rep2.includes('THE CAPTAINS') && rep2.includes(job.captain + ' · Killed'), 'the report says what became of the captain');
  await shot('r6-score-settled');
  await page.locator('#modalactions .primary').click();
  s = await read();
  check(s.rivals[0].status === 'dead' && s.medals.score && s.credits >= credits0 + 300, 'the rival is dead, the medal held and the bounty paid');
  check(s.ships[0].kills.length === 1 && s.ships[0].service.battles === 2 && s.ships[0].honours.includes('score'), 'the flagship’s service record: ' + JSON.stringify(s.ships[0].service));

  // --- Service record and paint
  await page.click('#tabShip'); await page.waitForTimeout(400);
  await page.locator('#shipacts button', { hasText: 'Service record' }).click();
  const rec = await page.textContent('#modalbody');
  check(rec.includes('KILL MARKS') && rec.includes(job.ship) && await page.locator('#modalbody .tally').count() === 1, 'the service record shows the kill mark and the named kill');
  await shot('r7-service-record'); await page.keyboard.press('Escape');
  await page.locator('#shipacts button', { hasText: 'Paint' }).click();
  check(await page.locator('[data-paint="gold"]').isEnabled() && await page.locator('[data-paint="crimson"]').isDisabled(), 'Gilded is unlocked by Old Score Settled; Crimson is not yet');
  await shot('r8-paint'); await page.locator('[data-paint="gold"]').click();
  check((await read()).ships[0].paint === 'gold', 'the flagship is repainted');

  // --- A jump-lane event
  await patch({ laneEvent: { id: 'distress', at: 'kestrel', from: 'meridian' }, system: 'kestrel' }); await campaign();
  check((await page.textContent('#modaltitle')) === 'A weak distress beacon' && await page.locator('#modalactions button').count() === 3 && (await page.textContent('#modalbody')).includes('THE OPTIONS'), 'a pending lane event opens on load with its choices and what they risk');
  await shot('r9-lane-event');
  const c0 = (await read()).credits; await random(0.1);
  await page.locator('#modalactions button', { hasText: 'Answer it' }).click();
  const ev = await page.textContent('#modalbody');
  check(ev.includes('+140 requisition') && (await read()).credits === c0 + 140 && !(await read()).laneEvent, 'answering pays, and the event is spent: ' + ev.slice(0, 80));
  await page.locator('#modalactions .primary').click();
  check(await page.locator('#arrival').isVisible(), 'then the arrival screen');
  // the bait version ends in a fight
  await patch({ laneEvent: { id: 'distress', at: 'kestrel', from: 'meridian' } }); await campaign(); await random(0.9);
  await page.locator('#modalactions button', { hasText: 'Answer it' }).click();
  check(await page.locator('#modalactions button', { hasText: 'Battle stations' }).count() === 1 && (await read()).ambush && (await read()).ambush.x.name === 'Bait at Kestrel', 'or the beacon was bait, and it is a fight');
  await random(0.99); await S(() => { state.ambush = null; persist(); closeModal(); });

  // --- A bridge casualty: the first officer came aboard wounded, and the bridge is hit
  await S(() => { state.wounds = { varro: { battles: 0, at: 'scour' } }; const k = Campaign.interception('scour', 1, 77); state.ambush = { x: k, dest: null }; state.launch = Campaign.encounter(k, cctx()); state.launch.escape = null; persist(); });
  await battle();
  check(await S(() => document.querySelector('#bridge-orders .order').textContent.includes('WOUNDED')), 'a wounded officer’s command is marked on the bridge');
  // the damage hook: a heavy hit on a badly damaged flagship reaches the bridge (every random draw comes up zero)
  const hit = await S(() => { const S = window.__sim, p = S.player, R = Math.random; p.hull = p.C.hull * 0.4; p.sh = [0, 0, 0, 0];
    Math.random = () => 0; try { S.damage(p, 200, 'shell', p.pos.clone().set(0, 0, 0), S.enemy); } finally { Math.random = R; } return S.bridge.casualties; });
  check(hit.length === 1 && hit[0].id === 'varro' && hit[0].severity === 'killed', 'the hit reaches the bridge and kills Varro, already wounded: ' + JSON.stringify(hit));
  check(await S(() => document.querySelector('#bridge-orders .order').textContent.includes('KILLED')), 'the command goes dark');
  await shot('r10-bridge-hit');
  await S(() => { const S = window.__sim; for (const e of S.ships.filter(x => x.team === 'e' && x.alive)) S.damage(e, 1e6, 'torp', e.pos.clone().set(0, 0, -40), S.player); });
  check(await over(), 'the battle ends');
  await campaign();
  const rep3 = await page.textContent('#modalbody');
  check(rep3.includes('BRIDGE CASUALTIES') && rep3.includes('was killed') && rep3.includes('Navy Command has posted'), 'the report names the fallen and the replacement');
  await shot('r11-casualty-report');
  await page.locator('#modalactions .primary').click();
  s = await read();
  const replacement = s.replacements.varro;
  check(s.fallen.length === 1 && s.fallen[0].id === 'varro' && replacement && s.crew.varro === replacement.id && !s.wounds.varro, 'Varro is among the fallen; the replacement holds the post');
  await page.click('#tabCrew'); await page.waitForTimeout(300);
  const crew = await page.textContent('#crewlist');
  check(crew.includes('Fallen') && crew.includes('Killed in action') && crew.includes(replacement.given), 'the Officers screen lists the fallen and the replacement on duty');
  await page.locator('#crewlist .officer', { hasText: replacement.given }).click();
  check((await page.textContent('#dosability')) === 'Brace' && (await page.textContent('#doskey')) === '5', 'the replacement gives Brace on key 5');
  await shot('r12-officers');
  // the replacement flies the next battle with the post's command
  await S(() => { const k = Campaign.interception('scour', 1, 78); state.ambush = { x: k, dest: null }; state.launch = Campaign.encounter(k, cctx()); persist(); });
  await battle();
  const deck = await S(() => { const S = window.__sim, p = S.player, id = Object.keys(S.bridge.cooldown)[0]; p.sh = [10, 10, 10, 10]; const ok = S.bridge.activate(id); return { ok, id, sh: p.sh[0] }; });
  check(deck.id === replacement.id && deck.ok && deck.sh > 10, 'in battle the replacement’s Brace works: ' + JSON.stringify(deck));
  await S(() => { const S = window.__sim; for (const e of S.ships.filter(x => x.team === 'e' && x.alive)) S.damage(e, 1e6, 'torp', e.pos.clone().set(0, 0, -40), S.player); }); await over();

  // --- Treating a wound at a starbase
  await campaign(); await page.locator('#modalactions .primary').click();
  await patch({ system: 'peregrine', wounds: { sato: { battles: 0 } }, credits: 2000 }); await campaign();
  await page.click('#tabCrew'); await page.locator('#crewlist .officer', { hasText: 'Sato' }).click();
  check((await page.textContent('#dosduty')).includes('Wounded') && (await page.textContent('#dosduty')).includes('second wound is fatal'), 'a wounded officer’s dossier says so');
  await page.locator('#dosduty button', { hasText: 'Treat in sickbay' }).click();
  check(!(await read()).wounds.sato && (await read()).credits < 2000, 'treated in the sickbay, for requisition');

  // --- Kora Vex becomes a rival if the Peregrine gets out with her still alive
  await S(() => { closeModal(); state.system = 'kestrel'; state.launch = Campaign.storyEncounter(1, cctx()); persist(); });
  await battle();
  await S(() => { const S = window.__sim, c = S.fleet.convoy, g = S.fleet.gate; c.pos.set(g.x, 0, g.z - 20); S.step(3); });
  check(await over() && await S(() => window.__sim.game.campaignOutcome === 'escort_extracted'), 'the Peregrine reaches the beacon');
  s = await read();
  check(s.pendingResult.rival && s.pendingResult.rival.name === 'Captain Kora Vex' && s.pendingResult.rival.fate === 'escaped', 'Vex is recorded as getting away');
  await campaign();
  check((await page.textContent('#modalbody')).includes('RIVAL · GOT AWAY') && await page.locator('#modalbody .rivalcard .enemy-portrait').count() === 1, 'the report names Vex as a rival, with her portrait');
  await page.locator('#modalactions button').first().click();
  s = await read();
  check(s.rivals.some(r => r.name === 'Captain Kora Vex' && r.asset === 'vex.webp' && r.status === 'at large') && s.completed.includes(1), 'Vex is at large, and Operation 1 is complete');
  check((await S(() => Rivals.lines(state.rivals.find(r => r.name === 'Captain Kora Vex')).back)).startsWith('Kestrel was business'), 'Vex has lines of her own');

  // --- A captain who escapes a sunk ship comes back as a rival, in a new ship
  await S(() => { closeModal(); state.rivals = state.rivals.filter(r => r.status === 'dead');   // earlier battles may have filled the three places at large
    const x = Campaign.interception('rednarrows', 1, 5); x.enemies = x.enemies.slice(0, 1); x.enemies[0].fate = 'wounded'; state.ambush = { x, dest: null }; state.system = 'rednarrows';
    state.launch = Campaign.encounter(x, cctx()); state.launch.escape = null; persist(); });
  const sunk = await S(() => ({ ship: state.launch.enemies[0].name, captain: state.launch.enemies[0].captain }));
  await battle();
  await S(() => { const S = window.__sim, e = S.enemy; S.damage(e, 1e6, 'torp', e.pos.clone().set(0, 0, -40), S.player); });
  check(await over(), 'the ship is sunk');
  const end2 = await S(() => document.getElementById('over-sub').textContent);
  check(end2.includes(sunk.captain) && /grave|burned/.test(end2), 'the end screen says the captain got out, gravely wounded: ' + end2);
  s = await read();
  check(s.pendingResult.rival.fate === 'escaped' && s.pendingResult.rival.how === 'wounded', 'recorded as escaping the wreck');
  await campaign();
  const rep4 = await page.textContent('#modalbody');
  check(rep4.includes('RIVAL · ESCAPED THE WRECK') && rep4.includes(sunk.ship) && rep4.includes('gravely wounded'), 'the report names the rival who escaped the wreck');
  await shot('r13-escaped-wreck');
  await page.locator('#modalactions .primary').click();
  s = await read();
  const back2 = s.rivals.find(r => r.name === sunk.captain);
  check(back2 && back2.lostShip === sunk.ship && back2.ship !== sunk.ship && back2.how === 'wounded', 'back in a new ship: the ' + (back2 && back2.ship));
  check((await S(n => Campaign.encounter(Rivals.encounterSrc(state.rivals.find(r => r.name === n), 'rednarrows', 1, 'intercept'), cctx()).hail.line, sunk.captain)).includes('burns ward'), 'and the hail remembers the burns ward');

  // --- Intel lists honours, rivals and the fallen
  await page.click('#tabIntel');
  const intel = await page.textContent('#modalbody');
  check(intel.includes('Battle honours') && intel.includes('Old Score Settled') && intel.includes('Rivals') && intel.includes('The fallen'), 'Intel lists honours, rivals and the fallen');
});

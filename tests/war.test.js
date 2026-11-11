'use strict';
// Milestone 5: the Kestrel warning (narrative and consequences) and the frontlines.
const assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
const ctx = { window: {} };
for (const f of ['crew/campaign-data.js', 'crew/fleet-controller.js']) vm.runInNewContext(fs.readFileSync(f, 'utf8'), ctx);
const C = ctx.window.BroadsideCampaign, Fleet = ctx.window.BroadsideFleet;
const plain = v => JSON.parse(JSON.stringify(v)), same = (a, b, m) => assert.deepEqual(plain(a), plain(b), m);

// The story spine: every operation reveals something, Harlan answers it, and the lead officer reacts either way.
for (const m of C.STORY) {
  assert.ok(m.log && m.log.length > 40, `operation ${m.id} has a story log entry`);
  assert.ok(m.win && m.loss, `operation ${m.id} has officer reactions`);
  if (m.id !== 10) assert.ok(m.harlan, `operation ${m.id} has a transmission from Harlan`);
}
assert.ok(C.ACTS[1].briefing.paras[1].includes('Kestrel warning'), 'Act II names the Kestrel warning');
assert.ok(C.storyById[8].boss.phases[2].line.includes('machine told me'), 'Halloran gives her reason');
for (const id of [3, 4, 8, 9]) {
  assert.ok(C.CHOICE_STAKES[id], `decision ${id} is flagged as having stakes`);
  assert.equal(C.storyById[id].choice.length, 2);
}
for (const c of C.CONSEQUENCES) {
  assert.ok(C.STORY.some(m => (m.flags || []).includes(c.flag)), `${c.flag} is a real decision`);
  for (const id of c.story) assert.ok(C.storyById[id], `${c.flag} changes operation ${id}`);
}

// Decisions reshape later battles, and each change is noted for the briefing.
const none = C.storyEncounter(8, { flags: {}, fronts: {} });
assert.equal(none.disable, undefined); assert.equal(none.boss.phases[1].spawn.length, 2, 'the clans answer by default');
const charts = C.storyEncounter(8, { flags: { thorne_amnesty: true }, fronts: {} });
same(charts.disable, ['mines']); assert.ok(charts.notes.some(n => n.includes('charts')));
assert.equal(C.storyEncounter(4, { flags: { halloran_logs: true } }).enemyShieldStart, 0.5);
assert.equal(C.storyEncounter(6, { flags: { halloran_logs: true } }).enemyShieldStart, 0.5);
const pen = C.storyEncounter(7, { flags: { ash_amnesty: true, oracle_transmitted: true } });
assert.equal(pen.friends[0].name, 'ASF Penitence'); assert.equal(pen.goal.headStart, 0.33);
assert.equal(C.storyEncounter(9, { flags: { oracle_sealed: true } }).boss.phases.find(p => p.lattice).lattice, 0.4);
assert.equal(C.storyEncounter(10, { flags: { arbiter_salvaged: true } }).boss.phases.find(p => p.regen).regen, 1.2);
assert.equal(C.storyById[9].boss.phases[1].lattice, 0.2, 'shaping a battle never changes the story data itself');
assert.equal(C.storyEncounter(1).notes.length, 0, 'no context, no changes');

// Fronts: start, levels, and what moves them
same(C.FRONT_REGIONS, ['Kestrel Verge', 'Red Narrows', 'Ash Marches', 'Halcyon Belt', 'Harrow Expanse']);
same([-10, -6, -5, -2, -1, 1, 2, 5, 6, 10].map(v => C.front({ 'Red Narrows': v }, 'Red Narrows').name),
  ['Enemy-held', 'Enemy-held', 'Enemy advantage', 'Enemy advantage', 'Contested', 'Contested', 'Navy advantage', 'Navy advantage', 'Secured', 'Secured']);
assert.equal(C.front({}, 'Ash Marches').name, 'Enemy-held', 'the Ash Marches start in enemy hands');
assert.equal(C.front({}, 'Meridian Core'), null, 'the Core has no front');
assert.equal(C.frontOf({}, 'kestrel').region, 'Kestrel Verge');
// Who holds what: read off the fronts, falling outward from Navy space
same(C.FRONT_ORDER['Ash Marches'], ['emberfall', 'kharon', 'cinder', 'vostok', 'grimhold'], 'the Ash Marches fall from the Core outward, the dockyard last');
for (const r of C.FRONT_REGIONS) same([...C.FRONT_ORDER[r]].sort(), C.SYSTEMS.filter(s => s.region === r).map(s => s.id).sort(), r + ': every system has its place in the order');
for (const [boss, r] of [['grimhold', 'Ash Marches'], ['verdant', 'Harrow Expanse']]) assert.equal(C.FRONT_ORDER[r].at(-1), boss, 'the finale system is the last to fall');
same([-10, -6, -4, -2, 0, 2, 4, 5, 6, 10].map(v => C.heldCount(v, 5)), [0, 0, 0, 1, 2, 3, 4, 4, 5, 5], 'nothing held while enemy-held, everything once secured');
const ctl0 = C.control(C.startFronts());
assert.ok(C.SYSTEMS.filter(s => s.region === 'Meridian Core').every(s => ctl0[s.id] === 'navy'), 'the Core is always Navy-held');
assert.equal(Object.keys(ctl0).length, C.SYSTEMS.length);
same(['northpoint', 'kestrel', 'driftwall', 'vela', 'peregrine', 'emberfall', 'kharon'].map(id => ctl0[id]), ['navy', 'navy', 'navy', 'front', 'enemy', 'front', 'enemy'], 'a new campaign: half the Verge held, the Ash Marches fought over at Emberfall');
assert.ok(C.FRONT_REGIONS.every(r => C.FRONT_ORDER[r].filter(id => ctl0[id] === 'front').length === 1), 'one system on each front is being fought over');
// On the map, a system whose story operation is still to be fought is never shown as held
assert.equal(C.control(C.startFronts(), [])['kestrel'], 'front', 'Kestrel is fought over until Operation 1 is won');
assert.equal(C.control(C.startFronts(), [1])['kestrel'], 'navy', 'and held afterwards');
assert.equal(C.control(C.startFronts(), [])['northpoint'], 'navy'); assert.equal(C.control(C.startFronts(), [])['cinder'], 'enemy', 'it never promotes a system');
assert.equal(C.route('meridian', 'vela', { fronts: C.startFronts(), act: 1 }).stop, null, 'routes do not depend on it');
const won = Object.fromEntries(C.FRONT_REGIONS.map(r => [r, 10]));
assert.ok(Object.values(C.control(won)).every(v => v === 'navy'), 'a secured Reach is all Navy-held');
assert.equal(C.control({})['emberfall'], 'front', 'missing fronts read as the starting ones');
same(C.controlNews(C.startFronts(), { ...C.startFronts(), 'Ash Marches': 0 }), { emberfall: 'won', kharon: 'won' }, 'ground taken is named');
same(C.controlNews({ 'Kestrel Verge': 0 }, { 'Kestrel Verge': -2 }), { driftwall: 'lost' }, 'and ground lost');
same(C.controlNews({ 'Ash Marches': -6 }, { 'Ash Marches': -8 }), {}, 'a front that moves without a system changing hands is no news');
// Route risk matches the interception roll
assert.equal(C.interceptRisk(['meridian', 'kestrel', 'vela'], 1), 0, 'no risk in contested Kestrel during act I');
assert.ok(Math.abs(C.interceptRisk(['peregrine', 'sable', 'scour'], 1) - 0.18) < 1e-9, 'one High system: 18%');
assert.ok(Math.abs(C.interceptRisk(['sable', 'rednarrows', 'razor'], 1, 0.5) - (1 - 0.88 * 0.91)) < 1e-9, 'risks compound along the route and follow the scale');
assert.equal(C.interceptRisk(['peregrine', 'sable', 'scour'], 1, () => 0), 0, 'a secured front has clear lanes');
const step = (f, k, o) => C.applyBattle(f, k, o);
let r = step(C.startFronts(), 0, { kind: 'contract', win: true, system: 'scour', act: 1 });
assert.equal(r.fronts['Red Narrows'], -4); assert.equal(r.changes[0].to.name, 'Enemy advantage'); assert.equal(r.clock, 1);
r = step(r.fronts, r.clock, { kind: 'story', win: false, system: 'rednarrows', act: 1 });
assert.equal(r.fronts['Red Narrows'], -6, 'a loss gives ground back');
r = step(r.fronts, r.clock, { kind: 'side', win: true, system: 'driftwall', act: 1 });
assert.equal(r.clock, 0, 'third battle away from the act front'); assert.equal(r.fronts['Ash Marches'], -6, 'no ground is lost yet');
assert.ok(r.raised, 'the Ash Fleet counter-attacks'); same(r.offensive, { region: 'Ash Marches', left: 2 });
// The counter-attack: answer it, lose it, or let it land
const raisedAt = r;
let d = step(raisedAt.fronts, 0, { kind: 'contract', win: true, system: 'emberfall', act: 1, offensive: raisedAt.offensive, defence: true });
assert.equal(d.fronts['Ash Marches'], -4, 'holding the post gains ground'); assert.equal(d.offensive, null); assert.equal(d.changes[0].why, 'held');
d = step(raisedAt.fronts, 0, { kind: 'contract', win: false, system: 'emberfall', act: 1, offensive: raisedAt.offensive, defence: true });
assert.equal(d.fronts['Ash Marches'], -8, 'losing the post loses ground, once'); assert.equal(d.offensive, null); same(d.changes.map(c => c.why), ['broken']);
d = step(raisedAt.fronts, 0, { kind: 'side', win: true, system: 'driftwall', act: 1, offensive: raisedAt.offensive });
same(d.offensive, { region: 'Ash Marches', left: 1 }, 'one battle elsewhere is allowed'); assert.equal(d.fronts['Ash Marches'], -6); assert.ok(!d.raised);
d = step(d.fronts, d.clock, { kind: 'contract', win: true, system: 'cinder', act: 1, offensive: d.offensive });
same(d.offensive, null, 'even a win elsewhere on that front does not answer it'); assert.equal(d.fronts['Ash Marches'], -6, 'the win (+2) and the breakthrough (-2)');
assert.ok(d.changes.some(c => c.why === 'pushback' && c.region === 'Ash Marches')); assert.equal(d.clock, 0);
assert.equal(step({ 'Ash Marches': -10 }, 2, { kind: 'side', win: true, system: 'driftwall', act: 1 }).raised, false, 'nothing is attacked where nothing is left to lose');
assert.equal(step(C.startFronts(), 0, { kind: 'story', win: true, system: 'halcyon', act: 2, offensive: { region: 'Ash Marches', left: 1 } }).offensive, null, 'a counter-attack does not outlive its act');
assert.equal(step({ 'Ash Marches': 4 }, 0, { kind: 'contract', win: true, system: 'cinder', act: 1, offensive: { region: 'Ash Marches', left: 2 } }).offensive, null, 'nor a secured front');
const ca = C.counterAttack('Ash Marches', 1, C.startFronts(), 1);
assert.equal(ca.system, 'emberfall', 'with nothing held the blow falls on the system being fought over'); assert.equal(ca.type, 'defence'); assert.equal(ca.kind, 'contract'); assert.equal(ca.station, 'tarn');
assert.equal(C.counterAttack('Kestrel Verge', 1, C.startFronts(), 1).system, 'driftwall', 'otherwise on the outermost system the Navy holds');
const caSpec = C.encounter(ca, { fronts: C.startFronts() });
assert.equal(caSpec.goal.type, 'defend'); assert.equal(caSpec.goal.waves.length, 1); assert.equal(caSpec.label, 'COUNTER-ATTACK'); assert.ok(caSpec.enemies.every(e => e.cls === 'revenant'));
for (const [reg, a] of [['Ash Marches', 1], ['Halcyon Belt', 2], ['Harrow Expanse', 3]]) { const o = C.counterAttack(reg, a, C.startFronts(), 3); assert.equal(C.byId[o.system].region, reg); assert.ok(C.STATIONS[o.station] && o.reward > 0 && !C.sealed(C.byId[o.system], a)); }
r = step(r.fronts, 2, { kind: 'contract', win: true, system: 'cinder', act: 1 });
assert.equal(r.clock, 0, 'a win on the act front resets the count'); assert.equal(r.fronts['Ash Marches'], -4);

// Time under way: a tick of the clock, which can provoke a counter-attack but never runs one down
let tr = C.applyTransit(C.startFronts(), 1, { act: 1 });
assert.equal(tr.clock, 2); assert.equal(tr.changes.length, 0); assert.ok(!tr.raised);
tr = C.applyTransit(tr.fronts, tr.clock, { act: 1 });
assert.ok(tr.raised && tr.offensive.region === 'Ash Marches' && tr.clock === 0, 'enough time under way brings on the counter-attack');
tr = C.applyTransit(tr.fronts, 0, { act: 1, offensive: tr.offensive });
same(tr.offensive, { region: 'Ash Marches', left: 2 }, 'a waiting counter-attack is not run down by travel'); assert.equal(tr.changes.length, 0);
assert.equal(C.PUSHBACK.jumps, 6);

// Travel: closed lanes, blockades and the course around them
const rc = { fronts: C.startFronts(), act: 1, broken: [] };
assert.ok(C.sealed(C.byId.halcyon, 1) && C.sealed(C.byId.nex, 2) && !C.sealed(C.byId.halcyon, 2) && !C.sealed(C.byId.nex, 3) && !C.sealed(C.byId.juniper, 1), 'machine and Wraith space opens with its act');
same(C.route('meridian', 'verdant', rc), { path: [], stop: null, sealed: true }, 'no course into closed lanes');
assert.ok(!C.route('meridian', 'juniper', rc).path.some(id => C.sealed(C.byId[id], 1)), 'and none through them');
same(C.route('meridian', 'cinder', rc), { path: ['meridian', 'tarn', 'emberfall', 'cinder'], stop: null, sealed: false }, 'an enemy-held destination is not a blockade');
assert.equal(C.route('meridian', 'grimhold', rc).stop, 'cinder', 'but an enemy-held system on the way is');
assert.equal(C.route('meridian', 'grimhold', { ...rc, broken: ['cinder'] }).stop, null, 'until its blockade is broken');
assert.equal(C.route('meridian', 'grimhold', { ...rc, fronts: { 'Ash Marches': 2 } }).stop, null, 'or the front takes it');
assert.ok(C.blockaded('cinder', rc) && !C.blockaded('emberfall', rc) && !C.blockaded('peregrine', rc) && !C.blockaded('meridian', rc), 'only enemy systems beyond the front line are blockaded, never independent ones');
// a longer way round is taken when it avoids a blockade
const around = C.route('scour', 'bastion', { fronts: { 'Red Narrows': -2 }, act: 1, broken: [] });   // Scour held, Red Narrows fought over, Blackrift enemy-held
same(around.path, ['scour', 'rednarrows', 'bastion']); assert.equal(around.stop, null);
same(C.route('kestrel', 'kestrel', rc).path, ['kestrel']);
same(C.route('verdant', 'juniper', rc).path, ['verdant', 'bloom', 'nex', 'juniper'], 'a fleet caught inside closed lanes by an older save can fly out');
for (const m of C.SIDE) for (const sys of [m.system, ...(m.legs || []).map(l => l.system)]) assert.ok(!C.sealed(C.byId[sys], m.act), m.id + ' is not behind closed lanes in its act');
for (const st of Object.keys(C.STATIONS)) for (let a = 1; a <= 3; a++) for (let cy = 0; cy < 12; cy++) for (const k of C.contracts(st, cy, a, true)) assert.ok(!C.sealed(C.byId[k.system], a), 'no contract targets closed lanes');
for (const m of C.STORY) assert.ok(!C.sealed(C.byId[m.system], m.act), 'every story operation can be reached in its act');
const bl = C.blockade('cinder', 1, 4), blSpec = C.encounter(bl, { fronts: C.startFronts() });
assert.equal(bl.kind, 'intercept'); assert.ok(bl.blockade && bl.enemies.length === 2 && bl.reward > C.interception('cinder', 1, 4).reward); assert.equal(blSpec.label, 'BLOCKADE');
r = step(r.fronts, 0, { kind: 'story', win: true, system: 'grimhold', boss: true, act: 1 });
assert.equal(r.fronts['Ash Marches'], 6, 'a finale takes ten'); assert.equal(C.front(r.fronts, 'Ash Marches').name, 'Secured');
const defendedLoss=step(C.startFronts(),2,{kind:'contract',win:false,system:'cinder',act:1});
assert.equal(defendedLoss.clock,2,'a failed defence on the act front is not an elsewhere battle');
assert.equal(defendedLoss.fronts['Ash Marches'],-8,'one loss costs ground without an extra pushback');
assert.ok(!defendedLoss.changes.some(c=>c.why==='pushback'));
r = step({ 'Halcyon Belt': 10 }, 0, { kind: 'contract', win: true, system: 'halcyon', act: 2 });
assert.equal(r.fronts['Halcyon Belt'], 10, 'fronts stop at secured'); assert.equal(r.changes.length, 0);
assert.equal(step(C.startFronts(), 0, { kind: 'contract', win: true, system: 'meridian', act: 1 }).changes.length, 0, 'fighting in the Core moves no front');

// Fronts shape the fights in their region
const narrows = C.encounter(C.contracts('peregrine', 0, 1)[0], { fronts: { 'Red Narrows': -8 } });
if (C.byId[narrows.system].region === 'Red Narrows') { assert.equal(narrows.front.hull, 1.1); assert.ok(narrows.notes.length); }
const kv = C.encounter(C.sideById['a1-salvage'], { fronts: { 'Kestrel Verge': 7 } });
assert.equal(kv.front.name, 'Secured'); assert.equal(kv.front.hull, 0.9);
assert.equal(C.FRONT_EFFECTS.ambush[4], 0, 'no ambushes in secured space');
assert.equal(C.rollInterception(['peregrine', 'sable', 'scour'], 1, () => 0, id => id === 'scour' ? 0 : 1), null, 'a secured system springs no ambush');
// and the finales
const pyre = C.storyEncounter(8, { fronts: { 'Red Narrows': 6, 'Ash Marches': 3 } });
assert.equal(pyre.boss.phases[1].spawn.length, 0, 'secured Narrows: no clans'); assert.equal(pyre.enemies.length, 1, 'turning Marches: no escort');
assert.equal(C.storyEncounter(8, { fronts: { 'Red Narrows': 3 } }).boss.phases[1].spawn.length, 1);
assert.equal(C.storyEncounter(9, { fronts: { 'Halcyon Belt': 7 } }).boss.phases[1].lattice, 0.5);
assert.equal(C.storyEncounter(9, { fronts: { 'Halcyon Belt': -8 } }).boss.phases[1].lattice, 0.2, 'the lattice never gets stronger than designed');
assert.equal(C.storyEncounter(10, { fronts: { 'Harrow Expanse': -8 } }).boss.phases[1].spawn.length, 3);
assert.equal(C.storyEncounter(10, { fronts: { 'Harrow Expanse': 8 } }).boss.phases[1].spawn.length, 0);

// The Long Lantern's head start puts it part of the way to the beacon.
{
  const ships = [], made = (key, team) => { const s = { key, team, name: key, alive: true, C: { hull: 100, shield: 50 }, hull: 100, sh: [50, 50, 50, 50], cap: [50, 50, 50, 50], groups: [], pos: null, ai: { side: 1 } }; ships.push(s); return s; };
  const player = made('bastion', 'p'), boss = made('wraith', 'e');
  const fl = Fleet.create({ encounter: pen, makeShip: made, placeShip: (s, p) => { s.pos = p; }, ships, player, primaryEnemy: boss, getSelected: () => boss, setSelected() {}, DIFF: { commander: {} }, endGame() {}, showMsg() {}, game: { ending: false }, V3: class { constructor(x, y, z) { Object.assign(this, { x, y, z }); } } });
  fl.setup();
  assert.ok(Math.abs(fl.convoy.pos.z - (3650 - 0.33 * (3650 - Fleet.GATE.z))) < 1e-6, 'convoy starts a third of the way along');
}

console.log('War and story tests passed (narrative, consequences, fronts, push back).');

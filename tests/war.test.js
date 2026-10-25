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
const step = (f, k, o) => C.applyBattle(f, k, o);
let r = step(C.startFronts(), 0, { kind: 'contract', win: true, system: 'scour', act: 1 });
assert.equal(r.fronts['Red Narrows'], -4); assert.equal(r.changes[0].to.name, 'Enemy advantage'); assert.equal(r.clock, 1);
r = step(r.fronts, r.clock, { kind: 'story', win: false, system: 'rednarrows', act: 1 });
assert.equal(r.fronts['Red Narrows'], -6, 'a loss gives ground back');
r = step(r.fronts, r.clock, { kind: 'side', win: true, system: 'driftwall', act: 1 });
assert.equal(r.clock, 0, 'third battle away from the act front'); assert.equal(r.fronts['Ash Marches'], -8, 'the Ash Fleet pushes back');
assert.ok(r.changes.some(c => c.why === 'pushback' && c.region === 'Ash Marches'));
r = step(r.fronts, 2, { kind: 'contract', win: true, system: 'cinder', act: 1 });
assert.equal(r.clock, 0, 'a win on the act front resets the push back'); assert.equal(r.fronts['Ash Marches'], -6);
r = step(r.fronts, 0, { kind: 'story', win: true, system: 'grimhold', boss: true, act: 1 });
assert.equal(r.fronts['Ash Marches'], 4, 'a finale takes ten'); assert.equal(C.front(r.fronts, 'Ash Marches').name, 'Navy advantage');
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

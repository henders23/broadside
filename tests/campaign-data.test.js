'use strict';
const assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync('crew/campaign-data.js', 'utf8'), ctx);
const C = ctx.window.BroadsideCampaign;
// Values from the vm context are compared as plain JSON.
const plain = v => JSON.parse(JSON.stringify(v)), same = (a, b, m) => assert.deepEqual(plain(a), plain(b), m);

// Map data and routes
assert.equal(C.SYSTEMS.length, 33);
assert.equal(C.ROUTES.length, 53);
for (const [a, b] of C.ROUTES) assert.ok(C.byId[a] && C.byId[b], `route ${a}-${b}`);
for (const s of C.SYSTEMS) assert.ok(C.jumps('meridian', s.id) >= 0, `${s.id} is reachable`);
same([...C.path('meridian', 'vela')], ['meridian', 'kestrel', 'vela']);

// Acts and the story order
assert.equal(C.ACTS.length, 3);
same([...C.STORY_ORDER], [1, 2, 3, 8, 4, 6, 9, 5, 7, 10]);
assert.equal(C.actOf([]), 1);
assert.equal(C.actOf([1, 2]), 1);
assert.equal(C.actOf([1, 2, 3]), 1, 'Act I ends with its finale');
assert.equal(C.actOf([1, 2, 3, 8]), 2);
assert.equal(C.actOf([1, 2, 3, 8, 4, 6, 9]), 3);
assert.equal(C.actOf([1, 2, 3, 8, 4, 6, 9, 5, 7, 10]), 4, 'past the last act once everything is done');
assert.equal(C.storyAvailable([], 1), true);
assert.equal(C.storyAvailable([], 2), false);
assert.equal(C.storyAvailable([1, 2, 3], 4), false, 'Act II waits for the Pyre');
assert.equal(C.storyAvailable([1, 2, 3], 8), true);
assert.equal(C.storyAvailable([1, 2, 3, 8, 4], 5), false, 'Harrow waits for the Midway relay');
assert.equal(C.storyAvailable([1, 2, 3, 8, 4], 6), true);
assert.equal(C.storyAvailable([1, 2, 3, 8, 4, 6, 9], 5), true);
same(C.openStory([1]).map(m => m.id), [2]);
for (const m of C.STORY) {
  assert.ok(C.byId[m.system], `story ${m.id} system`);
  assert.ok(C.ACTS[m.act - 1].story.includes(m.id), `story ${m.id} listed in its act`);
  assert.equal(m.choice.length, m.flags.length);
}

// Starbases and station missions
for (const id of Object.keys(C.STATIONS)) assert.ok(C.byId[id], `station ${id}`);
assert.equal(C.nearestStation('kestrel'), 'meridian');
assert.equal(C.nearestStation('rednarrows'), 'peregrine');
assert.equal(C.nearestStation('harrow').length > 0, true);
for (const m of C.SIDE) { assert.ok(C.STATIONS[m.station], `${m.id} station`); assert.ok(C.byId[m.system], `${m.id} target`); }
same(C.sideMissions('peregrine', 1, []).map(m => m.id), ['a1-salvage', 'a1-ledger']);
same(C.sideMissions('peregrine', 1, ['a1-salvage']).map(m => m.id), ['a1-ledger']);
assert.equal(C.sideMissions('elysia', 1, []).length, 0, 'act II missions wait for act II');
assert.equal(C.sideMissions('elysia', 3, []).length, 4);
// Convoy runs in legs: each leg has its own system and enemies, and the convoy's damage carries over.
{
  const m = C.sideById['a2-lifeline'];
  assert.equal(m.legs.length, 3); assert.equal(m.system, 'elysia'); assert.equal(m.enemies, m.legs[0].enemies, 'the first leg stands for the mission');
  const l1 = C.sideLeg(m, null), l3 = C.sideLeg(m, { leg: 2, hull: 0.4 });
  assert.equal(l1.leg, 0); assert.equal(l1.next, 'citrine'); assert.equal(l1.goal.convoyHull, 1); assert.match(l1.hud, /^Leg 1 of 3 · /);
  assert.equal(l3.system, 'midway'); assert.equal(l3.enemies[0].cls, 'sentinel'); assert.equal(l3.next, null); assert.equal(l3.goal.convoyHull, 0.4);
  assert.equal(C.sideLeg(m, { leg: 9 }).leg, 2, 'progress past the end is the last leg');
  assert.equal(m.legs[0].enemies[0].cls, 'revenant'); assert.equal(C.sideLeg(C.sideById['a2-scout'], { leg: 1 }), C.sideById['a2-scout'], 'single-battle missions are unchanged');
  const e = C.encounter({ ...l3, kind: 'side' }, {});
  assert.equal(e.system, 'midway'); assert.equal(e.goal.convoyHull, 0.4); assert.match(e.objective, /^Leg 3 of 3/);
  for (const x of C.SIDE.filter(x => x.legs)) for (const L of x.legs) assert.ok(C.byId[L.system] && L.enemies.length && L.objective, x.id + ' leg');
}
for (const [act, cls] of [[2, 'sentinel'], [3, 'thrall']]) assert.ok(C.SIDE.some(m => m.act === act && m.enemies.some(e => e.cls === cls)), `act ${act} mission against ${cls}`);
// Acts II and III each bring a defence and a pursuit
for (const [act, type] of [[2, 'defend'], [2, 'pursuit'], [3, 'defend'], [3, 'pursuit']]) assert.ok(C.SIDE.some(m => m.act === act && m.goal.type === type), `act ${act} ${type}`);
for (const m of C.SIDE.filter(m => m.goal.type === 'defend')) assert.ok(m.goal.station && m.goal.waves.length >= 1 && m.goal.waves.every(w => w.length >= 1), `${m.id} waves`);
for (const m of C.SIDE.filter(m => m.goal.type === 'pursuit')) assert.ok(m.goal.seconds > 0 && m.goal.at > 0 && m.goal.at < 1, `${m.id} pursuit`);

// Generated contracts: three per board, stable for a cycle, different the next cycle
const a = C.contracts('peregrine', 0, 1), b = C.contracts('peregrine', 0, 1), c = C.contracts('peregrine', 1, 1);
assert.equal(a.length, 3);
same(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
assert.notEqual(a.map(x => x.name + x.system).join(), c.map(x => x.name + x.system).join(), 'a new cycle posts new contracts');
same(a.map(x => x.type), ['bounty', 'patrol', 'escort']);
const advanced=C.contracts('peregrine',1,2),quarry=advanced.find(x=>x.type==='pursuit');
assert.ok(quarry,'Act II rotating boards add a pursuit rather than another patrol');
assert.equal(quarry.goal.type,'pursuit'); assert.equal(quarry.support,0,'pursuit has one quarry, not escort reinforcements');
assert.ok(quarry.goal.seconds>100&&quarry.goal.at===0.3);
assert.equal(C.contracts('peregrine',2,2).some(x=>x.type==='patrol'),true,'patrols return on alternating boards');
for (const station of Object.keys(C.STATIONS)) for (let act = 1; act <= 3; act++) for (const k of C.contracts(station, 7, act)) {
  const j = C.jumps(station, k.system);
  assert.ok(j >= 1 && j <= 3, `${k.id} target within three jumps (${j})`);
  assert.ok(k.reward > 0 && k.enemies.length >= 1);
  for (const e of k.enemies) assert.ok(e.hull > 0 && e.hull <= 1 && e.shield > 0 && e.shield <= 1, `${k.id} scale`);
  if (k.type === 'bounty') assert.ok(C.hostile(C.byId[k.system], act), `${k.id} bounty in hostile space`);
}
const act3 = C.contracts('juniper', 2, 3).find(k => k.type === 'bounty');
assert.ok(['wraith', 'thrall'].includes(act3.enemy), 'act III bounties out of Juniper hunt the Wraith');
// From Act II some Directorate work is against Sentinels, from Act III some Wraith work against Thrall swarms; never earlier.
{
  const seen = a => { const n = {}; for (let c = 0; c < 30; c++) for (const st of Object.keys(C.STATIONS)) for (const k of C.contracts(st, c, a)) n[k.enemy] = (n[k.enemy] || 0) + 1; return n; };
  const one = seen(1), two = seen(2), three = seen(3);
  assert.ok(!one.sentinel && !one.thrall && !two.thrall, 'no new hulls before their act');
  assert.ok(two.sentinel > 0.2 * (two.sentinel + two.seraph) && two.sentinel < 0.5 * (two.sentinel + two.seraph), 'a share of Act II machine work is Sentinels');
  assert.ok(three.thrall > 0.25 * (three.thrall + three.wraith), 'a share of Act III Wraith work is Thrall swarms');
  for (let c = 0; c < 30; c++) for (const st of Object.keys(C.STATIONS)) for (const k of C.contracts(st, c, 3)) if (k.enemy === 'thrall') assert.ok(k.type === 'pursuit' ? k.enemies.length === 1 : k.enemies.length >= 3 && k.enemies.every(e => e.cls === 'thrall'), k.id + (k.type === 'pursuit' ? ' is one quarry' : ' is a pack'));
}

// Interceptions only happen in hostile space
assert.equal(C.hostile(C.byId.kestrel, 1), false);
assert.equal(C.hostile(C.byId.scour, 1), true);
assert.equal(C.hostile(C.byId.halcyon, 1), false);
assert.equal(C.hostile(C.byId.halcyon, 2), true);
assert.equal(C.rollInterception(['meridian', 'kestrel', 'vela'], 1, () => 0), null, 'no ambush in contested Kestrel during act I');
assert.equal(C.rollInterception(['peregrine', 'sable', 'scour'], 1, () => 0), 'scour');
assert.equal(C.rollInterception(['peregrine', 'sable', 'scour'], 1, () => 0.99), null);
const x = C.interception('blackrift', 1, 4);
assert.equal(x.kind, 'intercept'); assert.equal(x.enemies.length, 2, 'severe systems send a pair'); assert.equal(x.enemy, 'scrapjaw');
assert.ok(C.fleeChance('sabre', 100) > C.fleeChance('warden', 100));
assert.ok(C.fleeChance('sabre', 20) < C.fleeChance('sabre', 100));

// Encounter specs are plain JSON the battle page can stage
const s1 = C.storyEncounter(1);
assert.equal(s1.kind, 'story'); assert.equal(s1.story, 1); assert.equal(s1.env, 1); assert.equal(s1.gate, true); assert.equal(s1.hail, 1);
assert.equal(s1.label, 'OPERATION 01');
const s6 = C.storyEncounter(6);
assert.equal(s6.env, 4, 'Midway uses the Halcyon scenery'); assert.equal(s6.enemies.length, 2);
const side = C.encounter(C.sideById['a1-emberfall']);
assert.equal(side.kind, 'side'); assert.equal(side.env, 2); assert.equal(side.gate, true); assert.equal(side.hail.faction, 'Ash Fleet');
const k = C.encounter(a[0]);
assert.equal(k.kind, 'contract'); assert.equal(k.label, 'BOUNTY CONTRACT');
same(JSON.parse(JSON.stringify(k)), k);
const xi = C.encounter(x);
assert.equal(xi.label, 'INTERCEPTION'); assert.equal(xi.env, 3);

// The fleet: prices, names, who deploys, ambush odds and enemy reinforcements
assert.equal(C.MAX_FLEET, 3);
for (const k of ['sabre', 'halberd', 'bastion', 'warden']) assert.equal(C.sellPrice(k), C.HULL_PRICES[k] / 2);
assert.equal(C.nextShipName(['MNS Resolute']), 'MNS Valiant');
assert.equal(C.nextShipName(['MNS Valiant', 'MNS Harrier']), 'MNS Steadfast');
const ships = [{ id: 'a', ship: 'bastion' }, { id: 'b', ship: 'sabre', reserve: true }, { id: 'c', ship: 'warden', sub: { engines: 50 } }, { id: 'd', ship: 'halberd' }];
same(C.deployed(ships, 'b').map(s => s.id), ['b', 'a', 'c'], 'flagship first even from reserve, then up to two escorts');
same(C.deployed(ships, 'a').map(s => s.id), ['a', 'c', 'd'], 'reserve ships stay behind');
same(C.deployed(ships, 'missing').map(s => s.id), ['a', 'c', 'd'], 'unknown flagship falls back to the first ship');
assert.equal(C.fleetFleeChance([ships[0]]), C.fleeChance('bastion', 100));
assert.equal(C.fleetFleeChance([ships[0], ships[2]]), C.fleeChance('warden', 50), 'the slowest, most damaged ship sets the odds');
assert.equal(C.reinforcements(C.storyEncounter(4), 1).length, 0, 'no support against a lone flagship');
assert.equal(C.reinforcements(C.storyEncounter(4), 3).length, 2);
assert.equal(C.reinforcements(C.storyEncounter(2), 3).length, 1, 'Sable already brings a pursuer');
assert.equal(C.reinforcements(C.storyEncounter(2), 3)[0].name, 'Ash Fleet escort');
assert.equal(C.reinforcements(C.storyEncounter(7), 3)[0].cls, 'wraith');
// Not every fight is matched to the fleet
assert.equal(C.reinforcements(C.storyEncounter(3), 3).length, 0, 'Thorne fights alone');
assert.equal(C.reinforcements(C.storyEncounter(5), 3).length, 0, 'the Cantor makes first contact alone');
const caps = new Set(); for (let i = 0; i < 40; i++) caps.add(C.supportCap({ id: 'c:meridian:' + i + ':0' }));
same([...caps].sort(), [0, 1, 2], 'generated fights draw 0, 1 or 2 support ships');
assert.equal(C.supportCap({ id: 'x', support: 0 }), 0);
const gen = C.encounter(C.contracts('meridian', 3, 1)[0]);
assert.equal(C.reinforcements(gen, 3).length, C.supportCap(gen));

// Act finales: a boss in phases
for (const [id, act, cls] of [[8, 1, 'pyre'], [9, 2, 'arbiter'], [10, 3, 'mother']]) {
  const m = C.storyById[id], e = C.storyEncounter(id), last = C.ACTS[act - 1].story;
  assert.equal(last[last.length - 1], id, `operation ${id} closes act ${act}`);
  assert.equal(e.enemies[0].cls, cls); assert.equal(e.goal.type, 'boss'); assert.equal(e.label, `ACT ${C.ACTS[act - 1].numeral} FINALE`);
  assert.ok(e.boss.phases.length === 3 && e.boss.phases[0].at === undefined, 'three phases, the first from the start');
  assert.ok(e.boss.phases[1].at > e.boss.phases[2].at, 'phase thresholds fall');
  assert.ok(e.boss.phases.slice(1).every(p => p.line), 'each later phase has a hail line');
  assert.ok(m.ends.boss_destroyed, 'a closing line');
  assert.equal(e.enemies.length, 2, 'the boss starts with an escort');
}
assert.equal(C.reinforcements(C.storyEncounter(8), 3)[0].name, 'Ash Fleet escort');
assert.equal(C.storyEncounter(9).boss.phases[1].lattice, 0.2);
assert.ok(C.storyEncounter(9).boss.phases[1].spawn.every(e => e.lattice));
assert.deepEqual(plain(C.storyEncounter(10).boss.phases[2].unlock), ['storm']);

console.log('Campaign data tests passed.');

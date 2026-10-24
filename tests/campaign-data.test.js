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
same([...C.STORY_ORDER], [1, 2, 3, 4, 6, 5, 7]);
assert.equal(C.actOf([]), 1);
assert.equal(C.actOf([1, 2]), 1);
assert.equal(C.actOf([1, 2, 3]), 2);
assert.equal(C.actOf([1, 2, 3, 4, 6]), 3);
assert.equal(C.actOf([1, 2, 3, 4, 6, 5, 7]), 4, 'past the last act once everything is done');
assert.equal(C.storyAvailable([], 1), true);
assert.equal(C.storyAvailable([], 2), false);
assert.equal(C.storyAvailable([1, 2, 3, 4], 5), false, 'Harrow waits for the Midway relay');
assert.equal(C.storyAvailable([1, 2, 3, 4], 6), true);
assert.equal(C.storyAvailable([1, 2, 3, 4, 6], 5), true);
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
assert.equal(C.sideMissions('elysia', 3, []).length, 2);

// Generated contracts: three per board, stable for a cycle, different the next cycle
const a = C.contracts('peregrine', 0, 1), b = C.contracts('peregrine', 0, 1), c = C.contracts('peregrine', 1, 1);
assert.equal(a.length, 3);
same(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
assert.notEqual(a.map(x => x.name + x.system).join(), c.map(x => x.name + x.system).join(), 'a new cycle posts new contracts');
same(a.map(x => x.type), ['bounty', 'patrol', 'escort']);
for (const station of Object.keys(C.STATIONS)) for (let act = 1; act <= 3; act++) for (const k of C.contracts(station, 7, act)) {
  const j = C.jumps(station, k.system);
  assert.ok(j >= 1 && j <= 3, `${k.id} target within three jumps (${j})`);
  assert.ok(k.reward > 0 && k.enemies.length >= 1);
  for (const e of k.enemies) assert.ok(e.hull > 0 && e.hull <= 1 && e.shield > 0 && e.shield <= 1, `${k.id} scale`);
  if (k.type === 'bounty') assert.ok(C.hostile(C.byId[k.system], act), `${k.id} bounty in hostile space`);
}
const act3 = C.contracts('juniper', 2, 3).find(k => k.type === 'bounty');
assert.equal(act3.enemy, 'wraith', 'act III bounties out of Juniper hunt the Wraith');

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

console.log('Campaign data tests passed.');

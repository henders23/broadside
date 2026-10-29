'use strict';
// Campaign drama: rivals who get away and come back, jump-lane events, bridge casualties and replacements, battle honours.
const assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
const ctx = { window: {}, document: { getElementById: () => null } };
for (const f of ['crew/campaign-data.js', 'crew/rivals.js', 'crew/events.js', 'crew/casualties.js', 'crew/honours.js', 'crew/personnel.js', 'crew/experience.js', 'crew/bridge-controller.js'])
  vm.runInNewContext(fs.readFileSync(f, 'utf8'), ctx);
const { BroadsideCampaign: C, BroadsideRivals: R, BroadsideEvents: E, BroadsideCasualties: K, BroadsideHonours: H, BroadsidePersonnel: P, BroadsideExperience: X, BroadsideBridge: B } = ctx.window;
const plain = v => JSON.parse(JSON.stringify(v));
const seq = (...v) => { const q = [...v]; return () => q.length > 1 ? q.shift() : q[0]; };

// ---------------- rivals ----------------
// Who can become a rival: a named bounty target, an ambusher, and Kora Vex. Patrols and story operations cannot.
const board = C.contracts('peregrine', 0, 1), bounty = board.find(k => k.type === 'bounty'), patrol = board.find(k => k.type === 'patrol');
assert.ok(R.eligible(bounty), 'a bounty target can get away');
assert.ok(!R.eligible(patrol), 'a patrol wing has no named captain');
assert.ok(R.eligible(C.interception('scour', 1, 3)), 'an ambusher can get away');
assert.ok(R.eligible(C.storyById[1]) && !R.eligible(C.storyById[3]), 'Vex at Kestrel, not Thorne');
// The spec carries the rival and their lines; whether they run is fixed by the encounter id.
const spec = C.encounter(bounty, { flags: {}, fronts: C.startFronts(), rivals: [] });
assert.equal(spec.rival.name, bounty.captain);
assert.ok(spec.enemies[0].rival && spec.rival.lines.flee && spec.rival.lines.death);
assert.deepEqual(plain(C.encounter(bounty, { rivals: [] }).escape), plain(spec.escape), 'the escape roll does not change on a reload');
let runs = 0; for (let i = 0; i < 200; i++) if (R.escapeFor('c:test:' + i, 0)) runs++;
assert.ok(runs > 60 && runs < 120, 'about 45% of first meetings can end in an escape: ' + runs);
assert.equal(R.escapeFor('anything', 2), null, 'a rival who has got away twice fights to the end');
assert.equal(C.encounter(C.storyById[1], {}).escape, undefined, 'story operations never run');
assert.equal(C.encounter(C.storyById[1], {}).rival.name, 'Captain Kora Vex');
// A first escape makes a rival, with a refit aimed at the facing that was broken.
let res = R.record([], { ...spec.rival, fate: 'escaped', memory: { facing: 2, share: 0.7, weapon: 'shell', ship: 'MNS Resolute' } }, { system: 'scour', mission: 'Bounty', clock: 5 });
assert.equal(res.event.type, 'new');
let rv = res.rivals[0];
assert.equal(rv.status, 'at large'); assert.equal(rv.escapes, 1); assert.deepEqual(plain(rv.upgrades), ['facing:2']);
assert.equal(rv.readyAt, 5 + R.RULES.readyAfter);
assert.equal(R.record([], { ...spec.rival, fate: 'killed', memory: {} }, { system: 'scour', clock: 1 }).rivals.length, 0, 'a captain killed on first meeting is not a rival');
// Lines remember the fight.
const L = R.lines(rv);
assert.match(L.back, /port/); assert.match(L.back, /Scour/); assert.match(L.back, /Resolute/);
// Coming back: a wingman from the third meeting, the refits applied, and the hail.
const comeback = R.encounterSrc(rv, 'blackrift', 1, 'intercept');
assert.equal(comeback.kind, 'intercept'); assert.equal(comeback.rivalId, rv.id); assert.equal(comeback.enemies.length, 1);
const back = C.encounter(comeback, { rivals: res.rivals });
assert.equal(back.rival.returning, true);
assert.deepEqual(plain(back.enemies[0].facing), [2, 1.6], 'the port shield is doubled');
assert.equal(back.hail.line, R.lines(rv).back);
assert.ok(back.notes.some(n => /port shield emitters/.test(n)));
// A bounty that happens to be led by a rival still at large is that rival, refitted.
assert.equal(C.encounter(bounty, { rivals: res.rivals }).rival.returning, true);
assert.equal(C.encounter(bounty, { rivals: [{ ...rv, status: 'dead' }] }).rival, undefined, 'a dead rival is not marked again');
// Getting away again adds a refit against the weapon; then she is killed and the score is settled.
res = R.record(res.rivals, { ...back.rival, fate: 'escaped', memory: { facing: 0, share: 0.3, weapon: 'lance', ship: 'MNS Resolute' } }, { system: 'blackrift', clock: 9 });
assert.equal(res.event.type, 'again'); rv = res.rivals[0];
assert.deepEqual(plain(rv.upgrades), ['facing:2', 'shields'], 'a lance makes shields the next refit');
assert.equal(rv.meetings, 2); assert.equal(R.encounterSrc(rv, 'blackrift', 1, 'intercept').enemies.length, 2, 'a wingman from the third meeting');
res = R.record(res.rivals, { id: rv.id, fate: 'killed', memory: { ship: 'MNS Resolute' } }, { system: 'blackrift', clock: 12 });
assert.equal(res.event.type, 'slain'); assert.equal(res.rivals[0].status, 'dead');
assert.equal(R.atLarge(res.rivals).length, 0);
// Ambushes: only once ready, only in the rival's own space.
const ready = [{ ...rv, status: 'at large', readyAt: 3, last: 'scour' }];
assert.equal(R.ambush(ready, ['peregrine', 'sable', 'scour'], 1, 2, () => 0), null, 'not ready yet');
assert.equal(R.ambush(ready, ['peregrine', 'sable', 'scour'], 1, 3, () => 0).at, 'scour', 'waiting in Corsair space');
assert.equal(R.ambush(ready, ['meridian', 'tarn'], 1, 3, () => 0), null, 'not in Navy space');
assert.equal(R.ambush(ready, ['peregrine', 'sable', 'scour'], 1, 3, () => 0.9), null, 'and only sometimes');
// Wanted posters go up at the starbase nearest where they were last seen.
const posters = R.wanted(ready, C.nearestStation('scour'), 1);
assert.equal(posters.length, 1); assert.equal(posters[0].kind, 'contract'); assert.equal(posters[0].type, 'bounty');
assert.ok(posters[0].reward > 300); assert.equal(R.wanted(ready, 'meridian', 1).length, C.nearestStation('scour') === 'meridian' ? 1 : 0);

// ---------------- jump-lane events ----------------
const at = (id, extra = {}) => ({ act: 1, sys: C.byId[id], region: C.byId[id].region, faction: C.byId[id].faction, hostile: C.hostile(C.byId[id], 1), lastLoss: false, wounded: 0, rival: null, torps: true, credits: 1000, ...extra });
assert.equal(E.roll(at('scour'), () => 0.9), null, 'most journeys are quiet');
assert.ok(E.roll(at('scour'), seq(0.1, 0)), 'a quarter of journeys bring an event');
for (const e of E.EVENTS) {
  assert.ok(e.title && e.text && e.choices.length >= 2, e.id + ' has a choice');
  for (const ch of e.choices) assert.ok(Math.abs(ch.outcomes.reduce((n, o) => n + o.p, 0) - 1) < 1e-9, `${e.id} / ${ch.label}: odds add up`);
}
const open = ctx => E.EVENTS.filter(e => e.when(ctx)).map(e => e.id);
assert.ok(!open(at('meridian')).includes('distress') && open(at('meridian')).includes('tender'), 'the Navy core is quiet, and has tenders');
assert.ok(open(at('rednarrows')).includes('smuggler'));
assert.ok(!open(at('harrow')).includes('spores') && open(at('harrow', { act: 3 })).includes('spores'), 'spores only once the Wraith arrive');
assert.ok(!open(at('scour')).includes('unrest') && open(at('scour', { lastLoss: true })).includes('unrest'), 'grumbling after a loss');
assert.ok(open(at('scour', { rival: 'Captain Mara Quill' })).includes('rumour'));
assert.equal(E.resolve(E.byId.distress, 0, () => 0.1).fx.credits, 140);
assert.ok(E.resolve(E.byId.distress, 0, () => 0.9).fx.battle, 'or it was bait');
assert.equal(E.fill('Near {system}, {ship}', { system: 'Scour', ship: 'Resolute' }), 'Near Scour, Resolute');

// ---------------- bridge casualties ----------------
const b0 = { time: 100, last: -99, count: 0 };
assert.equal(K.bridgeHit(0.8, 200, b0, () => 0), false, 'a healthy hull protects the bridge');
assert.equal(K.bridgeHit(0.4, 30, b0, () => 0), false, 'a light hit does not reach it');
assert.equal(K.bridgeHit(0.4, 200, b0, () => 0), true);
assert.equal(K.bridgeHit(0.4, 200, b0, () => 0.5), false, 'only sometimes');
assert.equal(K.bridgeHit(0.4, 200, { time: 100, last: 90, count: 1 }, () => 0), false, 'not twice in quick succession');
assert.equal(K.bridgeHit(0.4, 200, { time: 100, last: 0, count: 2 }, () => 0), false, 'two at most in a battle');
assert.deepEqual(plain(K.pick(['varro', 'okoye'], {}, [], () => 0.6)), { id: 'okoye', severity: 'wounded' });
assert.deepEqual(plain(K.pick(['varro', 'okoye'], { okoye: {} }, [], () => 0.6)), { id: 'okoye', severity: 'killed' }, 'a wounded officer hit again is killed');
assert.equal(K.pick(['okoye'], {}, ['okoye'], () => 0), null, 'nobody is hit twice in one battle');
const who = id => P.crew.find(c => c.id === id) || P.recruits.find(c => c.id === id) || null;
let crew = { wounds: {}, fallen: [], replacements: {}, crew: {}, hired: ['fenn'] };
let out = K.apply(crew, [{ id: 'okoye', severity: 'wounded' }], who, { system: 'scour', mission: 'Bounty' });
assert.ok(out.wounds.okoye); assert.equal(out.report[0].severity, 'wounded');
// Fenn holds Okoye's post and is killed: the post goes back to Okoye.
out = K.apply({ ...out, crew: { okoye: 'fenn' } }, [{ id: 'fenn', severity: 'killed' }], who, { system: 'scour', mission: 'Bounty' });
assert.equal(out.fallen[0].id, 'fenn'); assert.equal(out.fallen[0].post, 'okoye'); assert.ok(!out.hired.includes('fenn')); assert.equal(out.crew.okoye, undefined);
// Okoye, already wounded, is killed: Navy Command posts a replacement with her command.
out = K.apply(out, [{ id: 'okoye', severity: 'killed' }], who, { system: 'scour', mission: 'Bounty' });
const rep = out.replacements.okoye;
assert.equal(out.report[0].replacement, rep.id); assert.equal(out.crew.okoye, rep.id); assert.ok(!out.wounds.okoye);
const duty = P.activeCrew(out.crew, { replacements: out.replacements }), tac = duty.find(c => c.slot === 'okoye');
assert.equal(tac.id, rep.id); assert.equal(tac.cmd, 'okoye'); assert.equal(tac.ability, 'Target Solution'); assert.equal(tac.key, '6'); assert.equal(tac.portrait, null);
assert.match(X.displayName(tac, 1), /^Ensign /); assert.match(X.displayName({ id: 'rep-vale-1', given: 'Gus Merrow' }, 1), /^Petty Officer /, 'engineering replacements are enlisted');
assert.match(X.effect(tac, 1), /12% more damage/, 'the replacement gives the post’s command');
assert.match(X.effect(tac, 1, 0.6), /7% more damage/, 'wounded, it is weaker');
// The replacement dies too: a second replacement, with a different name.
out = K.apply({ ...out, wounds: { [rep.id]: {} } }, [{ id: rep.id, severity: 'killed' }], id => who(id) || (id === rep.id ? { ...rep, slot: 'okoye' } : null), { system: 'scour' });
assert.notEqual(out.replacements.okoye.id, rep.id); assert.equal(out.crew.okoye, out.replacements.okoye.id); assert.notEqual(out.replacements.okoye.name, rep.name);
// Wounds heal after RULES.heal engagements.
let w = { okoye: { battles: 0 } };
for (let i = 1; i < K.RULES.heal; i++) { const h = K.heal(w); w = h.wounds; assert.equal(h.recovered.length, 0); }
assert.deepEqual(plain(K.heal(w).recovered), ['okoye']);
// In battle: a wounded officer's command is weaker and slower; a bridge hit takes a command offline, or for good.
const player = { alive: true, sh: [100, 100, 100, 100], cap: [600, 600, 600, 600], C: { shield: 600, hull: 3000 }, sub: { engines: 50, shields: 100 }, fires: [], groups: [] };
const mk = wounds => B.create({ player, enemy: { alive: true }, showMsg() {}, facings: [], levels: {}, crew: P.activeCrew({}), wounds });
let br = mk(['varro']); br.activate('varro');
assert.ok(Math.abs(player.sh[0] - (100 + 600 * 0.16 * 0.6)) < 1e-6, 'a wounded first officer restores 60% as much shield');
assert.equal(Math.round(br.cooldown.varro), Math.round(100 * 1.4));
br = mk([]); const hit = br.bridgeHit(() => 0);
assert.deepEqual(plain(hit), { id: 'varro', severity: 'wounded' }); assert.equal(br.activate('varro'), false, 'the medics have the first officer');
assert.equal(br.down.varro, K.RULES.offline); br.tick(K.RULES.offline + 1); assert.equal(br.down.varro, undefined, 'back after the medics are done');
player.sh = [100, 100, 100, 100]; br.activate('varro'); assert.ok(player.sh[0] < 100 + 600 * 0.16, 'and serving wounded for the rest of the fight');
assert.deepEqual(plain(br.bridgeHit(() => 0)), { id: 'okoye', severity: 'wounded' }, 'the next hit finds someone else');
br = mk(['sato']); assert.equal(br.bridgeHit(() => 0.7).severity, 'killed'); assert.equal(br.down.sato, Infinity);
assert.deepEqual(plain(br.casualties), [{ id: 'sato', severity: 'killed' }]);

// ---------------- honours ----------------
const base = { win: true, kind: 'contract', code: 'enemy_destroyed', time: 120, hullStart: 1, hullEnd: 0.6, shots: 30, hits: 10, torpHits: 0, lanceDmg: 0, shieldMax: 0.8, hostiles: 1, escorts: 0, escortsLost: 0, boss: false, rivalKilled: false, convoyHull: null, rams: 0 };
const got = h => H.earned({ ...base, ...h }).map(m => m.id);
assert.deepEqual(plain(got({})), []);
assert.ok(got({ hullEnd: 0.99 }).includes('iron')); assert.ok(got({ hullEnd: 0.1 }).includes('laststand'));
assert.ok(got({ shieldMax: 0.2 }).includes('bare')); assert.ok(got({ shots: 50, hits: 40 }).includes('gunlayer'));
assert.ok(got({ torpHits: 3 }).includes('torpedo')); assert.ok(got({ lanceDmg: 3000 }).includes('lancer'));
assert.ok(got({ boss: true }).includes('giant')); assert.ok(got({ hostiles: 3 }).includes('odds')); assert.ok(!got({ hostiles: 3, escorts: 1 }).includes('odds'));
assert.ok(got({ time: 60 }).includes('swift')); assert.ok(!got({ time: 60, code: 'driven_off' }).includes('swift'));
assert.ok(got({ rivalKilled: true }).includes('score')); assert.ok(got({ convoyHull: 0.95 }).includes('shepherd'));
assert.ok(got({ escorts: 2 }).includes('noneleft')); assert.ok(got({ rams: 1 }).includes('ram'));
assert.ok(!got({ win: false, hullEnd: 0.99 }).includes('iron'), 'medals for winning need a win');
const ships = [{ id: 's1', shipName: 'MNS Resolute' }, { id: 's2', shipName: 'MNS Harrier' }];
let hon = H.apply({}, ships, { ...base, hullEnd: 0.99 }, [{ id: 's1', dealt: 900, kills: [{ cls: 'scrapjaw', name: 'Quill' }] }, { id: 's2', dealt: 300, kills: [], disabled: true }], { mission: 'Bounty', system: 'scour', flag: 's1', shipName: 'MNS Resolute' });
assert.deepEqual(plain(hon.earned), ['iron']); assert.equal(hon.medals.iron.n, 1); assert.equal(hon.medals.iron.first.system, 'scour');
assert.equal(hon.ships[0].kills.length, 1); assert.equal(hon.ships[0].kills[0].at, 'scour'); assert.deepEqual(plain(hon.ships[0].honours), ['iron']);
assert.deepEqual(plain(hon.ships[1].service), { battles: 1, wins: 1, dealt: 300, disabled: 1 });
hon = H.apply(hon.medals, hon.ships, { ...base, hullEnd: 0.99 }, [{ id: 's1', dealt: 100, kills: [] }], { system: 'tarn', flag: 's1' });
assert.equal(hon.medals.iron.n, 2); assert.equal(hon.medals.iron.first.system, 'scour', 'where it was first won stays');
assert.equal(hon.ships[1].service.battles, 1, 'a ship that did not fly keeps her record');
// Paint: Navy grey for everyone, the rest unlocked by medals.
assert.deepEqual(plain(H.paints({}).map(p => p.id)), ['navy']);
assert.ok(H.paints({ iron: { n: 1 } }).some(p => p.id === 'ivory'));
assert.equal(H.tint('navy'), null); assert.equal(H.tint(undefined), null); assert.equal(H.tint('ash').length, 3);

console.log('drama tests passed');

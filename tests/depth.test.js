'use strict';
// Grand campaign milestone 4: save slots, difficulty, reputation, captured hulls, recruitable officers, the codex.
const assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
const ctx = { window: {}, document: { getElementById: () => null } };
for (const f of ['crew/campaign-data.js', 'crew/personnel.js', 'crew/experience.js', 'crew/bridge-controller.js', 'crew/codex.js']) vm.runInNewContext(fs.readFileSync(f, 'utf8'), ctx);
const { BroadsideCampaign: C, BroadsidePersonnel: P, BroadsideExperience: X, BroadsideBridge: B, BroadsideCodex: K } = ctx.window;
const plain = v => JSON.parse(JSON.stringify(v)), same = (a, b, m) => assert.deepEqual(plain(a), plain(b), m);

// Save slots: slot 1 keeps the original key
const store = v => ({ getItem: () => v, setItem() {} });
assert.equal(C.slotKey(1), 'broadside-campaign-v1');
assert.equal(C.slotKey(3), 'broadside-campaign-v1-s3');
assert.equal(C.saveKey(store(null)), 'broadside-campaign-v1');
assert.equal(C.saveKey(store('2')), 'broadside-campaign-v1-s2');
assert.equal(C.saveKey(store('9')), 'broadside-campaign-v1', 'an invalid slot falls back to slot 1');
assert.equal(C.saveKey({ getItem() { throw new Error('blocked'); } }), 'broadside-campaign-v1', 'blocked storage falls back to slot 1');

// Difficulty
assert.equal(C.difficulty('nope').label, 'Captain');
assert.ok(C.difficulty('ensign').enemyHull < 1 && C.difficulty('ensign').enemyDamage < 1 && C.difficulty('ensign').ai === 'commander');
assert.ok(C.difficulty('admiral').enemyHull > 1 && C.difficulty('admiral').reward > 1 && C.difficulty('admiral').ai === 'admiral');
const route = ['peregrine', 'sable', 'scour'];
assert.equal(C.rollInterception(route, 1, () => 0.15, 1), 'scour', 'High threat: 18% at normal');
assert.equal(C.rollInterception(route, 1, () => 0.15, 0.6), null, 'Ensign makes it 10.8%');

// Reputation
assert.equal(C.standing({}, 'peregrine').name, 'Neutral');
same([24, 25, 50, 75, 140].map(v => C.standing({ peregrine: v }, 'peregrine').name), ['Neutral', 'Friendly', 'Trusted', 'Honoured', 'Honoured']);
assert.equal(C.standing({ peregrine: 30 }, 'peregrine').toNext, 20);
assert.equal(C.standing({ peregrine: 80 }, 'peregrine').next, null);
assert.equal(C.adjustRep({ peregrine: 98 }, 'peregrine', 10).peregrine, 100);
assert.equal(C.adjustRep({}, 'kestrel', 10).kestrel, undefined, 'only starbases keep standing');
same(C.repChanges('story', true), [['meridian', 5], ['tarn', 5]]);
same(C.repChanges('side', true, 'peregrine'), [['peregrine', 10]]);
same(C.repChanges('contract', false, 'elysia'), [['elysia', -2]]);
same(C.repChanges('intercept', true, null, 'scour'), [['peregrine', 2]]);
const pc = C.contracts('peregrine', 1, 1, true), base = C.contracts('peregrine', 1, 1, false);
assert.equal(pc.length, 4); assert.equal(base.length, 3);
const pr = pc[3];
assert.ok(pr.priority && pr.name.startsWith('Priority bounty') && pr.enemies.length === 2 && pr.support === 0);
assert.ok(pr.captain !== pc[0].captain, 'the priority bounty names a different captain');
for (const st of Object.keys(C.STATIONS)) for (let a = 1; a <= 3; a++) for (let c = 0; c < 20; c++) for (const k of C.contracts(st, c, a, true))
  if (k.type === 'escort') assert.ok(['Independent', 'Contested'].includes(C.byId[k.system].faction), `${k.id} escorts in safe space`);

// Captured hulls
assert.ok(C.capturable('scrapjaw') && C.capturable('revenant') && C.capturable('seraph'));
assert.ok(!C.capturable('wraith') && !C.capturable('pyre') && !C.capturable('bastion'));
assert.equal(C.prizeName('scrapjaw', []), 'MNS Jackal');
assert.equal(C.prizeName('scrapjaw', ['MNS Jackal']), 'MNS Scavenger');
assert.equal(C.sellPrice('seraph'), 650);
assert.ok(C.fleeChance('scrapjaw', 100) > C.fleeChance('revenant', 100));
same(C.deployed([{ id: 'a', ship: 'bastion' }, { id: 'b', ship: 'scrapjaw', reserve: true }], 'a').map(s => s.id), ['a'], 'prizes in reserve do not fly');
assert.equal(C.storyById[3].impound.name, 'The Widow');

// Recruitable officers
assert.equal(P.recruits.length, 5);
const posts = new Set(P.recruits.map(r => r.post));
assert.equal(posts.size, 5, 'one recruit for each post');
for (const r of P.recruits) { assert.ok(P.POSTS.includes(r.post)); assert.ok(C.STATIONS[r.station], r.id + ' hires at a starbase'); assert.ok(r.cost > 0 && r.ability && r.voice); }
same(P.activeCrew({}).map(c => c.id), ['varro', 'okoye', 'vale', 'sato', 'renn']);
const duty = P.activeCrew({ okoye: 'fenn', renn: 'achterberg', vale: 'fenn' });
same(duty.map(c => c.id), ['varro', 'fenn', 'vale', 'sato', 'achterberg'], 'a recruit only fills their own post');
same(duty.map(c => c.key), ['5', '6', '7', '8', '9'], 'keys follow the post');
assert.equal(duty[1].post, 'Tactical Officer');
assert.equal(X.displayName(P.recruits.find(r => r.id === 'osei'), 2), 'Chief Petty Officer Ama Osei');
assert.equal(X.displayName(P.recruits.find(r => r.id === 'fenn'), 2), 'Lieutenant Dario Fenn');
const a = X.award({ varro: { xp: 10 }, okoye: { xp: 40 } }, 'win', { fenn: 2 }, ['varro', 'fenn', 'vale', 'sato', 'renn']);
assert.equal(a.officers.okoye.xp, 40, 'an officer in reserve keeps their record unchanged');
assert.equal(a.officers.fenn.xp, 60 + 30); assert.equal(a.gains.length, 5);
assert.equal(X.levels({ fenn: { xp: 300 } }).fenn, 3);
assert.ok(X.effect(P.recruits.find(r => r.id === 'osei'), 3).includes('14%'));

// Recruit commands in battle
const ship = () => ({ alive: true, team: 'p', C: { hull: 1000, shield: 100 }, hull: 500, sh: [50, 50, 50, 50], cap: [100, 100, 100, 100], sub: { engines: 40, shields: 70, reactor: 100 }, fires: [], abFuel: 0, abLock: true,
  groups: [{ charge: 0.2 }, { charge: 1, tubesT: [3, 0] }] });
const make = (p, torps = []) => B.create({ player: p, enemy: { alive: true, sh: [1, 1, 1, 1], cap: [1, 1, 1, 1], sub: { engines: 1 } }, getTarget: () => null, showMsg() {}, facings: ['Fore', 'Aft', 'Port', 'Starboard'], levels: null, crew: P.activeCrew({ varro: 'adeyemi', okoye: 'fenn', vale: 'osei', sato: 'marlow', renn: 'achterberg' }), world: { torps } });
{ const p = ship(), b = make(p); assert.equal(b.activate('adeyemi'), true); assert.equal(p.hull, 560); assert.equal(p.sub.engines, 50); assert.equal(b.uses.adeyemi, 1); assert.equal(b.activate('adeyemi'), false, 'cooldown'); }
{ const p = ship(), b = make(p); assert.equal(b.activate('fenn'), true); assert.equal(p.groups[0].charge, 1); same(p.groups[1].tubesT, [0, 0]); }
{ const p = ship(), b = make(p); p.groups = [{ charge: 1 }]; assert.equal(b.activate('fenn'), false, 'nothing to reload'); }
{ const p = ship(), b = make(p); assert.equal(b.activate('osei'), true); assert.equal(p.hull, 620); }
{ const p = ship(), b = make(p); p.hull = 1000; assert.equal(b.activate('osei'), false, 'a sound hull needs no patch'); }
{ const p = ship(), b = make(p); assert.equal(b.activate('marlow'), true); assert.equal(p.abFuel, 1); assert.equal(p.abLock, false); assert.equal(p.sub.engines, 70); }
{ const p = ship(), t1 = { active: true, team: 'e', target: p, life: 20 }, t2 = { active: true, team: 'p', target: { team: 'e' }, life: 20 }, b = make(p, [t1, t2]);
  assert.equal(b.activate('achterberg'), true); assert.equal(t1.target, null); assert.equal(t1.life, 3); assert.ok(t2.target, 'our own torpedoes keep their lock'); }
{ const p = ship(), b = make(p, []); assert.equal(b.activate('achterberg'), false, 'nothing to jam'); }

// Codex
const ids = new Set(), cats = new Set(K.CATEGORIES);
for (const e of K.entries) { assert.ok(!ids.has(e.id), 'unique ' + e.id); ids.add(e.id); assert.ok(cats.has(e.cat)); assert.ok(e.text.length && e.title && e.sub); }
const fresh = { completed: [], unlocked: id => id === 1, act: 1, regions: ['Meridian Core'], met: [] };
const startOpen = K.open(fresh).map(e => e.id);
assert.ok(startOpen.includes('ship-bastion') && startOpen.includes('g-shields') && startOpen.includes('p-vex'));
assert.ok(!startOpen.includes('ship-scrapjaw') && !startOpen.includes('pl-narrows') && !startOpen.includes('ship-pyre'));
const later = K.open({ completed: [1, 2], unlocked: () => false, act: 1, regions: ['Red Narrows'], met: ['scrapjaw'] }).map(e => e.id);
assert.ok(later.includes('ship-scrapjaw') && later.includes('fac-ash') && later.includes('pl-narrows') && later.includes('g-capture'));
assert.equal(K.open({ completed: C.STORY_ORDER, unlocked: () => true, act: 4, regions: C.SYSTEMS.map(s => s.region), met: ['scrapjaw', 'revenant', 'seraph', 'wraith', 'sentinel', 'thrall'] }).length, K.entries.length, 'everything opens by the end');
assert.ok(!later.includes('ship-sentinel') && !later.includes('ship-thrall'), 'the new hulls open when met');

console.log('Campaign depth tests passed (slots, difficulty, reputation, captures, recruits, codex).');

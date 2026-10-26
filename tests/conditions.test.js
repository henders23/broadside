'use strict';
// Battlefield conditions and openings in battle (crew/conditions.js), without WebGL: node tests/conditions.test.js
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
class V3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setY(y) { this.y = y; return this; }
  clone() { return new V3(this.x, this.y, this.z); }
  copy(p) { return this.set(p.x, p.y, p.z); }
  add(p) { this.x += p.x; this.y += p.y; this.z += p.z; return this; }
  addScaledVector(p, k) { this.x += p.x * k; this.y += p.y * k; this.z += p.z * k; return this; }
  multiplyScalar(k) { this.x *= k; this.y *= k; this.z *= k; return this; }
  distanceTo(p) { return Math.hypot(this.x - p.x, this.y - p.y, this.z - p.z); }
  applyMatrix4() { return this; }
}
class Obj { constructor() { this.position = new V3(); this.rotation = { x: 0, set() {} }; this.scale = { set() {} }; this.children = []; } add(o) { this.children.push(o); } }
class Mesh extends Obj { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; } }
class Geo { dispose() { this.disposed = true; } }
class Mat { constructor(p) { Object.assign(this, p); } dispose() { this.disposed = true; } }
class FogExp2 { constructor(color, density) { this.color = color; this.density = density; } }
const THREE = { Mesh, Group: Obj, PointLight: Obj, MeshBasicMaterial: Mat, MeshStandardMaterial: Mat, SphereGeometry: Geo, TorusGeometry: Geo, FogExp2 };
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync('crew/conditions.js', 'utf8'), ctx);
const K = ctx.window.BroadsideConditions;

const scene = { fog: 'region fog', meshes: new Set(), add(m) { this.meshes.add(m); }, remove(m) { this.meshes.delete(m); } };
const ships = [], asteroids = [{ pos: new V3(9000, 0, 9000), r: 100 }], obstacles = [], msgs = [];
const mines = Array.from({ length: 72 }, () => ({ active: false, obj: { visible: false }, pos: new V3(), vel: new V3() }));
let hits = 0;
const field = K.create({ THREE, scene, V3, ships, asteroids, mines, obstacles, rockGeos: [new Geo()], rockMat: new Mat({}), showMsg: m => msgs.push(m), flash() {}, damage: () => hits++, Sfx: { alarm() {} } });
function ship(team, x, z, yaw = 0) {
  const s = { team, alive: true, pos: new V3(x, 0, z), yaw, fwd: new V3(-Math.sin(yaw), 0, -Math.cos(yaw)), C: { hullE: { r: [40, 20, 140] } }, sh: [500, 500, 500, 500], sub: { engines: 100, reactor: 100 }, inv: null };
  ships.push(s); return s;
}
const placeShip = (s, p, yaw) => { s.pos.copy(p); s.yaw = yaw; s.fwd = new V3(-Math.sin(yaw), 0, -Math.cos(yaw)); };
function battle(spec) {
  ships.length = 0; msgs.length = 0;
  const player = ship('p', 0, 2700), wing = ship('p', 560, 2950); wing.friend = false;
  ship('e', 0, -2700, Math.PI); ship('e', 2100, -1500, Math.PI);
  field.begin(spec, { player, allies: [wing], placeShip });
  return { player, wing, foes: ships.filter(s => s.team === 'e') };
}
const ahead = (p, s) => (s.pos.x - p.pos.x) * p.fwd.x + (s.pos.z - p.pos.z) * p.fwd.z;

// Plain fights change nothing
battle({ id: 'plain', goal: { type: 'destroy' } });
assert.equal(field.condition, null); assert.equal(field.regen, 1); assert.equal(field.sensor, Infinity); assert.equal(asteroids.length, 1);

// Rocks join the asteroid list clear of every ship, and leave with the battle
battle({ id: 'r1', condition: 'rocks', goal: { type: 'destroy' } });
assert.ok(field.rockCount >= 20 && asteroids.length === field.rockCount + 1, 'rocks added: ' + field.rockCount);
for (const a of asteroids.slice(1)) for (const s of ships) assert.ok(a.pos.distanceTo(s.pos) > a.r + 400, 'no rock on top of a ship');
field.clear();
assert.equal(asteroids.length, 1, 'rocks removed'); assert.equal([...scene.meshes].length, 0);

// An escort's convoy lane stays clear
battle({ id: 'r2', condition: 'rocks', goal: { type: 'escort' } });
assert.ok(asteroids.slice(1).every(a => Math.abs(a.pos.x - 570) > 480), 'the convoy lane is clear');

// The minefield borrows mines from the pool, belongs to no side, and goes back
battle({ id: 'm1', condition: 'mines', goal: { type: 'destroy' } });
const laid = mines.filter(m => m.active);
assert.ok(laid.length >= 20 && laid.every(m => m.team === 'x' && m.armT === 0) && obstacles.length === laid.length, 'mines laid: ' + laid.length);
field.clear();
assert.ok(mines.every(m => !m.active) && obstacles.length === 0, 'mines recovered');

// Ion storm: half-rate shields, a warning, then a surge
battle({ id: 'i1', condition: 'ion', goal: { type: 'destroy' } });
assert.equal(field.regen, 0.5); assert.ok(scene.fog instanceof FogExp2);
const { player } = { player: ships[0] }, before = player.sh[0];
for (let t = 0; t < 20 && player.sh[0] === before; t += 0.1) field.tick(0.1, player);
assert.ok(player.sh[0] < before * 0.7 && msgs.includes('Ion surge building') && msgs.includes('Ion surge · shields stripped'), 'surge strips shields after a warning');
field.clear(); assert.equal(scene.fog, 'region fog', 'the region fog comes back');

// Nebula: short sensors, poor gunnery beyond them
battle({ id: 'n1', condition: 'nebula', goal: { type: 'destroy' } });
assert.equal(field.sensor, 2400); assert.ok(field.scatter(3000) > 2 && field.scatter(1500) === 1);

// Gravity well: pulls warships in, leaves the convoy alone, burns at the core
const g = battle({ id: 'g1', condition: 'gravity', goal: { type: 'destroy' } });
const w = field.well, convoy = ship('p', w.pos.x + 2000, w.pos.z); convoy.civilian = true;
const d0 = g.player.pos.distanceTo(w.pos), c0 = convoy.pos.distanceTo(w.pos);
for (let i = 0; i < 100; i++) field.tick(0.1, g.player);
assert.ok(g.player.pos.distanceTo(w.pos) < d0 - 60 && convoy.pos.distanceTo(w.pos) === c0, 'the well drags warships, not the convoy');
assert.ok(asteroids.includes(w) && w.avoid > w.r, 'the AI steers wide of it');
g.player.pos.copy(w.pos).add(new V3(400, 0, 0)); hits = 0; field.tick(0.1, g.player); assert.ok(hits > 0, 'the core burns');
field.clear(); assert.ok(!asteroids.includes(w));

// Openings
let b = battle({ id: 'o1', opening: 'ambush', goal: { type: 'destroy' } });
assert.ok(b.foes.every(f => ahead(b.player, f) < -2000 && f.yaw === b.player.yaw), 'ambushers come up astern');
assert.ok(field.openingLine.startsWith('Contacts astern'));
b = battle({ id: 'o2', opening: 'close', goal: { type: 'destroy' } });
assert.ok(b.foes.every(f => f.pos.distanceTo(b.player.pos) < 2600 && Math.abs(ahead(b.player, f)) < 900), 'close quarters, on the beam');
b = battle({ id: 'o3', opening: 'pincer', goal: { type: 'destroy' } });
assert.ok(ahead(b.player, b.foes[0]) > 2000 && ahead(b.player, b.foes[1]) < -2000, 'one ahead, one astern');
b = battle({ id: 'o4', opening: 'hot', goal: { type: 'destroy' } });
assert.ok(b.player.sh.every(v => v === 200) && b.wing.sh[0] === 200 && b.player.sub.engines <= 70 && b.player.sub.reactor <= 75, 'running hot');
b = battle({ id: 'o5', opening: 'ambush', boss: { phases: [] }, goal: { type: 'boss' } });
assert.ok(b.foes.every(f => ahead(b.player, f) > 0), 'bosses keep their entrance');

console.log('Battlefield condition and opening tests passed.');

'use strict';
// Campaign flagship upgrade rules (node tests/upgrades.test.js).
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('crew/upgrades.js','utf8'),ctx);
const U=ctx.BroadsideUpgrades;
// A Bastion-shaped class: two broadsides, a forward battery and a torpedo group.
const base=Object.freeze({hull:3000,shield:620,regen:28,vmax:42,accel:2.2,turn:0.096,weapons:Object.freeze([
 Object.freeze({id:'port',sub:'port',type:'battery',reload:7.5,dmg:46,range:2700,speed:480}),
 Object.freeze({id:'stbd',sub:'stbd',type:'battery',reload:7.5,dmg:46,range:2700,speed:480}),
 Object.freeze({id:'dorsal',sub:'fore',type:'battery',reload:5.5,dmg:32,range:3000,speed:560}),
 Object.freeze({id:'torp',sub:'torp',type:'torpedo',reload:12,dmg:340,range:5200,tubes:4,ammo:8})])});
const w=(C,id)=>C.weapons.find(x=>x.id===id);

assert.equal(U.catalogue.length,21);
for(const slot of ['engines','hull','reactor','broadside','fore','shields','torp'])assert.equal(U.forSlot(slot).length,3,slot);
assert.equal(new Set(U.catalogue.map(u=>u.id)).size,21,'upgrade ids are unique');
assert.ok(U.catalogue.every(u=>Number.isInteger(u.cost)&&u.cost>0&&u.effect),'every upgrade has a cost and an effect');

assert.equal(U.apply(base,[]),base,'no upgrades returns the class unchanged');
assert.equal(U.apply(base,undefined),base,'old saves without upgrades still work');
assert.equal(U.apply(base,['not_a_real_upgrade']),base,'unknown ids are ignored');

const all=U.apply(base,U.catalogue.map(u=>u.id));
assert.notEqual(all,base);
assert.equal(all.hull,3450);assert.equal(all.shield,713);assert.equal(all.regen,35);
assert.ok(Math.abs(all.vmax-47.04)<1e-9);assert.ok(Math.abs(all.turn-0.096*1.2)<1e-9);
assert.equal(all.abBurn,10);assert.equal(all.armour,0.9);assert.equal(all.repairRate,1.5);assert.equal(all.power,14);
assert.equal(all.reactorHardened,true);assert.equal(all.shieldHardened,true);
assert.ok(Math.abs(w(all,'port').reload-7.5*0.94*0.85)<1e-9,'coolant loop and rapid loaders stack on broadsides');
assert.equal(w(all,'stbd').dmg,53);assert.equal(w(all,'port').range,3024);assert.equal(w(all,'port').speed,538);
assert.equal(w(all,'dorsal').dmg,37);assert.equal(w(all,'dorsal').range,3360);assert.ok(Math.abs(w(all,'dorsal').reload-5.5*0.94*0.85)<1e-9);
assert.equal(w(all,'torp').ammo,12);assert.equal(w(all,'torp').dmg,408);assert.ok(Math.abs(w(all,'torp').reload-12*0.94*0.8)<1e-9);

// Only the matching weapons change.
const shells=U.apply(base,['heavy_shells']);
assert.equal(w(shells,'port').dmg,53);assert.equal(w(shells,'dorsal').dmg,32);assert.equal(w(shells,'torp').dmg,340);
// A charged weapon (the Halberd lance) gets faster charging and more beam damage.
const lance=U.apply({...base,weapons:[{id:'lance',sub:'fore',type:'lance',chargeT:14,dps:600,range:3600}]},['faster_cycling','heavier_ordnance']);
assert.ok(Math.abs(lance.weapons[0].chargeT-11.9)<1e-9);assert.equal(lance.weapons[0].dps,690);

assert.equal(U.torpedoCap(8,[]),8);assert.equal(U.torpedoCap(8,['expanded_magazine']),12);assert.equal(U.torpedoCap(16,['expanded_magazine']),24);
assert.equal(base.hull,3000);assert.equal(base.weapons[0].dmg,46);
console.log('Flagship upgrade rules passed (21 upgrades).');

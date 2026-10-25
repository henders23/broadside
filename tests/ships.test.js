'use strict';
// The shared ship table (crew/ships.js): the battle page flies it, the shipyard draws and upgrades it.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};for(const f of ['crew/ships.js','crew/upgrades.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);
const {CLASSES,PLAYABLE,shipyardHull}=ctx.window.BroadsideShips,U=ctx.window.BroadsideUpgrades;

assert.equal(PLAYABLE.join(),'bastion,halberd,sabre,warden,scrapjaw,seraph,revenant','four Navy hulls and three claimable prizes');
for(const k of ['wraith','pyre','arbiter','mother'])assert.equal(shipyardHull(k),null,k+' cannot be flown');
for(const k of Object.keys(CLASSES)){
 const C=CLASSES[k];
 assert.ok(C.hull>0&&C.shield>0&&C.vmax>0&&C.turn>0,k+' stats');
 assert.ok(C.weapons.length>=(k==='thrall'?1:2)&&C.weapons.every(w=>w.id&&w.type&&Array.isArray(w.guns)&&w.guns.length),k+' weapons');
 assert.ok(C.hullE&&C.shieldE&&C.engines.length,k+' ellipsoids and engines');
}
for(const k of PLAYABLE){
 const H=shipyardHull(k),C=CLASSES[k];
 assert.equal(H.hull,C.hull);assert.equal(H.cls,C.cls);
 assert.ok(Math.abs(H.turn-C.turn*180/Math.PI)<0.01,k+' turn in degrees a second');
 assert.ok(H.weapons.every(w=>w.n>=1&&!('guns' in w)),k+' weapon gun counts');
 assert.ok([...H.stbd,...H.forePts,...H.torpPts,...H.eng].every(p=>p.length===3&&p[0]>=0),k+' starboard-side points');
 assert.ok(H.stbd.length>=1,k+' broadside points');
 // The shipyard's copy is what upgrades are applied to; it must not share arrays with the battle page's table.
 H.weapons[0].dmg=-1;assert.notEqual(C.weapons[0].dmg,-1);
 const up=U.apply(shipyardHull(k),['reinforced_plating']);assert.equal(up.hull,Math.round(C.hull*1.15));
}
// Act bosses: bigger copies of an existing hull, with the special weapons that warn before they fire.
for(const [k,base,special] of [['pyre','revenant','inferno'],['arbiter','seraph','judgement'],['mother','wraith','storm']]){
 const B=CLASSES[k];
 assert.ok(B.boss&&B.enemyOnly&&B.modelScale>1);assert.equal(B.model,CLASSES[base].model||base);
 assert.ok(B.hull>CLASSES[base].hull,k+' outweighs its base hull');
 assert.equal(B.weapons.find(w=>w.id===special).special,true,k+' '+special+' gives warning');
}
// Campaign-only hulls: variants of an existing model, never in skirmish or the shipyard.
for(const [k,base] of [['sentinel','halberd'],['thrall','wraith']]){
 const V=CLASSES[k];assert.ok(V.campaignOnly&&V.enemyOnly&&!V.boss&&!V.capturable,k);assert.equal(V.model,base);assert.equal(shipyardHull(k),null);
}
assert.equal(CLASSES.sentinel.weapons.find(w=>w.id==='lance').special,true,'the Sentinel lance gives warning');
assert.ok(!CLASSES.sentinel.weapons.some(w=>w.type==='torpedo'));
assert.ok(CLASSES.thrall.rammer&&CLASSES.thrall.vmax>CLASSES.wraith.vmax&&CLASSES.thrall.hullE.r[2]<CLASSES.wraith.hullE.r[2],'the Thrall: a small, fast rammer');
assert.ok(['pyre','arbiter','mother'].every(k=>CLASSES[k].campaignOnly));
console.log('Ship table tests passed ('+Object.keys(CLASSES).length+' classes).');

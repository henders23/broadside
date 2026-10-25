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
 assert.ok(C.hullE&&C.shieldE&&(C.engines.length||k==='station'),k+' ellipsoids and engines');
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
// Act bosses: re-armed versions of an existing hull, with the special weapons that warn before they fire.
for(const [k,base,special] of [['pyre','revenant','inferno'],['arbiter','seraph','judgement'],['mother','wraith','storm']]){
 const B=CLASSES[k];
 assert.ok(B.boss&&B.enemyOnly);
 assert.ok(B.hull>CLASSES[base].hull,k+' outweighs its base hull');
 assert.equal(B.weapons.find(w=>w.id===special).special,true,k+' '+special+' gives warning');
}
// Campaign-only hulls: variants of an existing class, never in skirmish or the shipyard.
for(const k of ['sentinel','thrall','transport','station']){
 const V=CLASSES[k];assert.ok(V.campaignOnly&&V.enemyOnly&&!V.boss&&!V.capturable,k);assert.equal(shipyardHull(k),null);
}
// Models: one file per hull. Only the Bloom-Mother still borrows another's (the Wraith's, scaled up). A model of its own
// is unit-sized and bow-forward, so the class's scale is its length and it needs no turn; the recorded size is the file's.
{
 const files=new Map();
 for(const [k,C] of Object.entries(CLASSES)){
  const f=C.model?CLASSES[C.model].url:C.url;assert.ok(fs.existsSync(f),k+' model file '+f);
  if(!C.model){assert.equal(fs.statSync(f).size,C.size,k+' size');assert.ok(!files.has(f),k+' shares '+f+' with '+files.get(f));files.set(f,k);}
 }
 assert.equal(Object.values(CLASSES).filter(C=>C.model).map(C=>C.key).join(),'mother','only the Bloom-Mother borrows a model');
 for(const k of ['revenant','sentinel','pyre','arbiter','thrall','transport','station']){const C=CLASSES[k];assert.equal(C.url,'models/'+k+'.glb');assert.equal(C.rotY,0);assert.ok(!C.tint&&!C.modelScale,k+' uses its own textures at its own size');
  assert.ok(C.hullE.r[2]<=C.scale/2&&C.shieldE.r[2]>C.hullE.r[2],k+' ellipsoids fit the hull');
  for(const w of C.weapons)for(const g of w.guns)assert.ok(Math.abs(g[2])<=C.scale*0.55,k+' '+w.id+' mounts on the hull');}
}
assert.equal(CLASSES.sentinel.weapons.find(w=>w.id==='lance').special,true,'the Sentinel lance gives warning');
assert.ok(!CLASSES.sentinel.weapons.some(w=>w.type==='torpedo'));
assert.ok(CLASSES.thrall.rammer&&CLASSES.thrall.vmax>CLASSES.wraith.vmax&&CLASSES.thrall.hullE.r[2]<CLASSES.wraith.hullE.r[2],'the Thrall: a small, fast rammer');
assert.ok(['pyre','arbiter','mother'].every(k=>CLASSES[k].campaignOnly));
console.log('Ship table tests passed ('+Object.keys(CLASSES).length+' classes).');

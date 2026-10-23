'use strict';
// Standalone pure contract test for fleet logic; run with: node tests/fleet-controller.test.js
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync('crew/fleet-controller.js','utf8');
const context={window:{}};vm.runInNewContext(code,context);
const create=context.window.BroadsideFleet.create;
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}length(){return Math.hypot(this.x,this.y,this.z)}}
function fixture(missionId){
  const ships=[];
  const makeShip=(k,team)=>{const s={key:k,team,name:k,alive:true,C:{hull:100,shield:50},hull:100,sh:[50,50,50,50],cap:[50,50,50,50],groups:[{type:'torpedo'}],pos:new V3(),step:3,target:null};ships.push(s);return s;};
  const player=makeShip('bastion','p'),boss=makeShip('scrapjaw','e');
  let selected=boss,ended=null;
  const fleet=create({missionId,makeShip,placeShip:(s,pos)=>s.pos=pos,ships,player,primaryEnemy:boss,getSelected:()=>selected,setSelected:s=>{selected=s;},DIFF:{commander:{}},endGame:r=>ended=r,showMsg:()=>{},game:{ending:false},V3});
  fleet.setup();
  return {fleet,player,boss,ships,selected:()=>selected,outcome:()=>ended};
}
{
  const f=fixture(1);assert.equal(f.ships.length,3);
  assert.equal(f.fleet.convoy.team,'p');assert.equal(f.fleet.convoy.groups.length,0);
  assert.equal(f.boss.target,f.fleet.convoy);
  f.boss.alive=false;f.fleet.onDestroyed(f.boss);assert.equal(f.outcome(),'win');
}
{
  const f=fixture(1);const civilian=f.fleet.convoy;civilian.alive=false;f.fleet.onDestroyed(civilian);assert.equal(f.outcome(),'lose');
}
{
  const f=fixture(2);assert.equal(f.ships.length,3);assert.equal(f.ships.filter(s=>s.team==='e').length,2);
  f.fleet.cycle();assert.equal(f.selected(),f.ships[2]);
  f.ships[2].alive=false;f.fleet.onDestroyed(f.ships[2]);
  assert.equal(f.outcome(),null);assert.equal(f.selected(),f.boss);
  f.boss.alive=false;f.fleet.onDestroyed(f.boss);assert.equal(f.outcome(),'win');
}
{
 const f=fixture(4);assert.equal(f.ships.length,2);
 f.boss.alive=false;f.fleet.onDestroyed(f.boss);assert.equal(f.outcome(),'win');
}
console.log('Fleet controller contract tests passed (4 scenarios).');

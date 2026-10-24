'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};for(const f of ['crew/campaign-data.js','crew/fleet-controller.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);
const Campaign=ctx.window.BroadsideCampaign;
const create=ctx.window.BroadsideFleet.create,GATE=ctx.window.BroadsideFleet.GATE;
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}length(){return Math.hypot(this.x,this.y,this.z)}}
function fixture(missionId,encounter,escortCount=0){
 const ships=[],events=[],game={ending:false};
 const makeShip=(key,team)=>{const s={key,team,name:key,alive:true,C:{hull:100,shield:50},hull:100,sh:[50,50,50,50],cap:[50,50,50,50],groups:[{type:'torpedo'}],pos:new V3(),step:3,ai:{side:1},target:null,fireQ:[]};ships.push(s);return s};
 const player=makeShip('bastion','p'),allies=Array.from({length:escortCount},(_,i)=>{const a=makeShip('sabre','p');a.name='Escort '+(i+1);return a;}),boss=makeShip('scrapjaw','e');let selected=boss,outcome=null,modelBuilt=false;
 const fleet=create({missionId,encounter,allies,makeShip,placeShip:(s,p)=>{s.pos=p},ships,player,primaryEnemy:boss,
  getSelected:()=>selected,setSelected:s=>selected=s,DIFF:{commander:{react:.8}},
  endGame:r=>{outcome=r;game.ending=true},showMsg:m=>events.push(m),game,V3,
  buildFreighter:()=>{modelBuilt=true}});
 fleet.setup();
 return {fleet,ships,player,allies,boss,events,game,selected:()=>selected,outcome:()=>outcome,modelBuilt:()=>modelBuilt};
}
{
 const f=fixture(1),c=f.fleet.convoy;
 assert.equal(f.ships.length,3);assert.equal(c.groups.length,0);assert.ok(f.modelBuilt());
 assert.equal(f.boss.target,c);assert.equal(f.fleet.toggleHold(),true);assert.equal(f.fleet.held,true);
 c.pos.z=GATE.z;f.fleet.tick(.25);assert.equal(f.outcome(),null,'A held convoy cannot extract');
 f.fleet.toggleHold();f.fleet.tick(.25);assert.equal(f.outcome(),'win');assert.equal(f.game.campaignOutcome,'escort_extracted');
}
{
 const f=fixture(1);f.boss.alive=false;f.fleet.onDestroyed(f.boss);
 assert.equal(f.outcome(),'win');assert.equal(f.game.campaignOutcome,'escort_saved');
}
{
 const f=fixture(1);const c=f.fleet.convoy;c.alive=false;f.fleet.onDestroyed(c);
 assert.equal(f.outcome(),'lose');assert.equal(f.game.campaignOutcome,'convoy_lost');
 assert.equal(f.player.isWinner,true);
}
{
 const f=fixture(1);f.player.pos=new V3(0,0,-2650);f.boss.pos=new V3(0,0,-2500);
 f.fleet.tick(12);assert.equal(f.boss.target,f.player,'Vex reacts to intercepting flagship');
}
{
 const f=fixture(2);assert.equal(f.ships.length,3);assert.equal(f.ships.filter(s=>s.team==='e').length,2);
 assert.equal(f.boss.ai.flankOffset,26);assert.equal(f.ships[2].ai.flankOffset,-27);
 f.fleet.cycle();assert.equal(f.selected(),f.ships[2]);f.ships[2].alive=false;f.fleet.onDestroyed(f.ships[2]);
 assert.equal(f.outcome(),null);assert.equal(f.selected(),f.boss);assert.equal(f.boss.ai.flankOffset,0);
 f.boss.alive=false;f.fleet.onDestroyed(f.boss);assert.equal(f.outcome(),'win');assert.equal(f.game.campaignOutcome,'fleet_destroyed');
}
{
 const f=fixture(4);f.boss.alive=false;f.fleet.onDestroyed(f.boss);assert.equal(f.outcome(),'win');
}
{
 // Thorne surrenders below 28% hull instead of fighting to the death.
 const f=fixture(3);f.fleet.tick(.1);assert.equal(f.outcome(),null);
 f.boss.hull=27;f.fleet.tick(.1);assert.equal(f.outcome(),'win');assert.equal(f.game.campaignOutcome,'surrender');
}
{
 // First contact is won by staying alive for 100 seconds.
 const f=fixture(5);for(let i=0;i<99;i++)f.fleet.tick(1);assert.equal(f.outcome(),null);assert.ok(f.fleet.status().includes('99 / 100'));
 f.fleet.tick(1);assert.equal(f.game.campaignOutcome,'extracted');
}
{
 // A generated escort contract builds its own convoy, and a station patrol spawns both hostiles.
 const escort=Campaign.contracts('peregrine',0,1).find(c=>c.type==='escort'),spec=Campaign.encounter(escort);
 const f=fixture(0,spec);assert.ok(f.fleet.convoy);assert.ok(f.fleet.convoy.name.includes(escort.name.replace('Escort: ','')));
 assert.equal(f.boss.target,f.fleet.convoy);assert.equal(f.boss.name,escort.enemies[0].name);
 const patrol=Campaign.encounter(Campaign.sideById['a1-salvage']),g=fixture(0,patrol);
 assert.equal(g.ships.filter(s=>s.team==='e').length,2);assert.equal(g.ships[2].hull,42,'wingman hull scaled');
 g.boss.alive=false;g.fleet.onDestroyed(g.boss);g.ships[2].alive=false;g.fleet.onDestroyed(g.ships[2]);assert.equal(g.game.campaignOutcome,'fleet_destroyed');
}
{
 // Two escorts: the enemy is reinforced to three ships, and escorts follow their orders.
 const f=fixture(4,null,2),foes=()=>f.ships.filter(s=>s.team==='e');
 assert.equal(foes().length,3,'ORACLE-9 gets two drones against a three-ship fleet');
 assert.ok(foes().slice(1).every(s=>s.name==='Directorate drone'&&s.hull===42));
 const [a,b]=f.allies,[boss,d1,d2]=foes();
 boss.pos=new V3(0,0,-3000);d1.pos=new V3(0,0,400);d2.pos=new V3(5000,0,0);a.pos=new V3(5000,0,100);b.pos=new V3(0,0,0);
 f.fleet.tick(1.1);assert.equal(a.target,f.selected(),'focus: escorts fire on the flagship target');assert.equal(f.fleet.order,'focus');
 d2.target=f.player;d1.target=b;boss.target=b;assert.equal(f.fleet.setOrder('defend'),true);f.fleet.tick(1.1);
 assert.equal(a.target,d2,'defend: escorts go for the ship attacking the flagship');
 f.fleet.setOrder('free');f.fleet.tick(1.1);assert.equal(a.target,d2,'free: nearest hostile to the escort');assert.equal(b.target,d1);
 assert.equal(f.fleet.order,'free');
 a.alive=false;f.fleet.onDestroyed(a);assert.equal(f.outcome(),null,'losing an escort does not lose the battle');
 for(const s of foes()){s.alive=false;f.fleet.onDestroyed(s);}assert.equal(f.outcome(),'win');assert.equal(b.isWinner,true);
}
{
 // Hostiles spread their fire across the player's ships, leaning toward the flagship.
 const f=fixture(2,null,1),[e1,e2]=f.ships.filter(s=>s.team==='e'),esc=f.allies[0];
 f.player.pos=new V3(0,0,0);esc.pos=new V3(4000,0,0);e1.pos=new V3(300,0,0);e2.pos=new V3(3900,0,0);
 f.fleet.tick(9.1);assert.equal(e1.target,f.player);assert.equal(e2.target,esc);
 assert.equal(fixture(2,null,0).fleet.setOrder('defend'),false,'no orders without escorts');
}
console.log('Campaign fleet contract tests passed (11 scenarios).');

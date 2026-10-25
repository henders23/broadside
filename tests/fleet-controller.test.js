'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};for(const f of ['crew/campaign-data.js','crew/fleet-controller.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);
const Campaign=ctx.window.BroadsideCampaign;
const create=ctx.window.BroadsideFleet.create,GATE=ctx.window.BroadsideFleet.GATE;
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}length(){return Math.hypot(this.x,this.y,this.z)}}
function fixture(missionId,encounter,escortCount=0){
 const ships=[],events=[],game={ending:false};
 const makeShip=(key,team)=>{const s={key,team,name:key,alive:true,C:{hull:100,shield:50},hull:100,sh:[50,50,50,50],cap:[50,50,50,50],groups:[{type:'torpedo',id:'torp'},{type:'missile',id:'inferno'},{type:'lance',id:'judgement'},{type:'missile',id:'storm'}],pos:new V3(),step:3,ai:{side:1},target:null,fireQ:[]};ships.push(s);return s};
 const player=makeShip('bastion','p'),allies=Array.from({length:escortCount},(_,i)=>{const a=makeShip('sabre','p');a.name='Escort '+(i+1);return a;}),boss=makeShip('scrapjaw','e');let selected=boss,outcome=null,modelBuilt=false;
 const fleet=create({missionId,encounter,allies,makeShip,placeShip:(s,p)=>{s.pos=p},ships,player,primaryEnemy:boss,
  getSelected:()=>selected,setSelected:s=>selected=s,DIFF:{commander:{react:.8}},
  endGame:r=>{outcome=r;game.ending=true},showMsg:m=>events.push(m),hail:h=>events.push('HAIL '+h.line),game,V3,
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
{
 // The Pyre: clans arrive at 65%, the inferno salvo unlocks at 30%, and the fight ends with the boss.
 const f=fixture(8),foes=()=>f.ships.filter(s=>s.team==='e'&&s.alive),inferno=f.boss.groups.find(g=>g.id==='inferno');
 assert.equal(foes().length,2);assert.equal(inferno.locked,true,'inferno held back');assert.equal(f.fleet.boss.phase,0);
 f.boss.sh=[1,1,1,1];f.boss.hull=64;f.fleet.tick(.1);
 assert.equal(f.fleet.boss.phase,1);assert.equal(foes().length,4,'two clan raiders join');assert.equal(f.boss.sh[0],f.boss.cap[0],'shields restored');
 assert.ok(f.events.some(e=>e.startsWith('HAIL Every clan')),'Halloran hails');assert.ok(f.fleet.status().includes('PHASE 2 OF 3'));
 f.boss.hull=29;f.fleet.tick(.1);assert.equal(f.fleet.boss.phase,2);assert.equal(inferno.locked,false,'inferno unlocked');
 f.boss.alive=false;f.fleet.onDestroyed(f.boss);assert.equal(f.outcome(),'win');assert.equal(f.game.campaignOutcome,'boss_destroyed','escorts still alive, boss dead: won');
}
{
 // The Arbiter: the lattice soaks damage until both nodes are destroyed.
 const f=fixture(9);f.boss.hull=59;f.fleet.tick(.1);
 assert.equal(f.boss.dmgTaken,.2);assert.equal(f.fleet.boss.lattice,true);
 const nodes=f.ships.filter(s=>s.latticeNode);assert.equal(nodes.length,2);
 nodes[0].alive=false;f.fleet.onDestroyed(nodes[0]);f.fleet.tick(.1);assert.equal(f.boss.dmgTaken,.2,'one node left');
 nodes[1].alive=false;f.fleet.onDestroyed(nodes[1]);f.fleet.tick(.1);assert.equal(f.boss.dmgTaken,1,'lattice down');
 f.boss.hull=20;f.fleet.tick(.1);assert.equal(f.boss.groups.find(g=>g.id==='judgement').locked,false);
}
{
 // The Bloom-Mother: a big hit can cross two phases at once.
 const f=fixture(10);f.boss.hull=30;f.fleet.tick(.1);
 assert.equal(f.fleet.boss.phase,2);assert.equal(f.boss.regenK,1.8);assert.equal(f.ships.filter(s=>s.name==='Wraith brood').length,2);
}
{
 // Defend: a fixed station the attackers go for; a second wave arrives when the first is beaten; losing the station loses.
 const m=Campaign.SIDE.find(x=>x.id==='a2-listening'),f=fixture(0,{enemies:m.enemies,goal:m.goal}),st=f.fleet.station;
 assert.ok(st&&st.post&&st.team==='p');assert.ok(st.C.vmax<.1);assert.equal(st.hull,160);assert.equal(f.boss.target,st);
 assert.match(f.fleet.status(),/DEFEND · NORTHPOINT LISTENING POST 100% HULL · WAVE 1 OF 2/);
 for(const s of f.ships.filter(s=>s.team==='e')){s.alive=false;f.fleet.onDestroyed(s);}
 assert.equal(f.outcome(),null,'a second wave is still to come');
 f.fleet.tick(7);assert.equal(f.fleet.wave,1);assert.equal(f.ships.filter(s=>s.team==='e'&&s.alive).length,2);
 for(const s of f.ships.filter(s=>s.team==='e'&&s.alive)){s.alive=false;f.fleet.onDestroyed(s);}
 assert.equal(f.outcome(),'win');assert.equal(f.game.campaignOutcome,'station_held');
 const g=fixture(0,{enemies:m.enemies,goal:m.goal});g.fleet.station.alive=false;g.fleet.onDestroyed(g.fleet.station);
 assert.equal(g.outcome(),'lose');assert.equal(g.game.campaignOutcome,'station_lost');
}
{
 // Pursuit: the quarry runs, slower than usual; disabling it wins, and its jump drive running out the clock loses.
 const m=Campaign.SIDE.find(x=>x.id==='a2-courier'),f=fixture(0,{enemies:m.enemies,goal:m.goal});
 assert.equal(f.fleet.quarry,f.boss);assert.ok(f.boss.ai.flee);assert.ok(f.boss.pos.z>0,'starts ahead of the enemy line');
 assert.equal(f.boss.maxHull,70);f.boss.hull=30;f.fleet.tick(.1);assert.equal(f.outcome(),null);
 f.boss.hull=24;f.fleet.tick(.1);assert.equal(f.outcome(),'win');assert.equal(f.game.campaignOutcome,'quarry_disabled');
 const g=fixture(0,{enemies:m.enemies,goal:m.goal});g.fleet.tick(60);assert.match(g.fleet.status(),/JUMPS IN 50 S/);g.fleet.tick(51);
 assert.equal(g.outcome(),'lose');assert.equal(g.game.campaignOutcome,'quarry_escaped');
}
console.log('Campaign fleet contract tests passed (16 scenarios).');

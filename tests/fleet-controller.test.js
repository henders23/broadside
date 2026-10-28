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
 assert.equal(a.dmgOut,.55,'AI escorts contribute at 55% weapon strength');
 assert.equal(b.dmgOut,.55,'second escort scales identically');
 assert.equal(f.player.dmgOut,undefined,'the human flagship retains full firepower');
 boss.pos=new V3(0,0,-3000);d1.pos=new V3(0,0,400);d2.pos=new V3(5000,0,0);a.pos=new V3(5000,0,100);b.pos=new V3(0,0,0);
 f.fleet.tick(1.1);assert.equal(a.target,f.selected(),'focus: escorts fire on the flagship target');assert.equal(a.orderIntent,'Focusing your target');assert.equal(f.fleet.order,'focus');
 d2.target=f.player;d1.target=b;boss.target=b;assert.equal(f.fleet.setOrder('defend'),true);f.fleet.tick(1.1);
 assert.equal(a.target,d2,'defend: escorts go for the ship attacking the flagship');assert.equal(a.orderIntent,'Intercepting flagship attacker');
 f.fleet.setOrder('free');f.fleet.tick(1.1);assert.equal(a.target,d2,'free: nearest hostile to the escort');assert.equal(b.target,d1);
 assert.equal(f.fleet.order,'free');assert.equal(a.orderIntent,'Engaging nearest threat');assert.equal(f.fleet.escortReport().length,2);
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
{
 // A convoy run's later leg: the convoy starts with the damage it carried, never below 15%.
 const leg=Campaign.sideLeg(Campaign.sideById['a2-lifeline'],{leg:1,hull:0.4}),f=fixture(0,{enemies:leg.enemies,goal:leg.goal});
 assert.equal(f.fleet.convoy.hull,26);assert.match(f.fleet.status(),/MV TESSALY 40% HULL/);
 const g=fixture(0,{enemies:leg.enemies,goal:{...leg.goal,convoyHull:0.01}});assert.equal(g.fleet.convoy.hull,10);
}
// Mid-battle twists: each springs once, when its trigger is met
const twisted=(type,goal,enemies)=>({enemies:enemies||[{cls:'scrapjaw',name:'Black Gull',captain:'Captain Mara Quill'}],goal,twist:Campaign.twistSpec(type,'scrapjaw','Corsair',2),hail:{faction:'Corsair'}});
const pair=[{cls:'scrapjaw',name:'Corsair lead'},{cls:'scrapjaw',name:'Corsair wingman',hull:.55}];
{
 // Reinforcements jump in astern after the first kill, a badly hurt lead, or 75 seconds
 const f=fixture(0,twisted('reinforce',{type:'destroy'}));
 for(let i=0;i<74;i++)f.fleet.tick(1);assert.equal(f.ships.filter(s=>s.team==='e').length,1,'nothing yet');
 f.fleet.tick(2);const foes=f.ships.filter(s=>s.team==='e');
 assert.equal(foes.length,3);assert.ok(foes[1].pos.z>500,'they come in astern of the flagship');
 assert.ok(f.events.some(e=>e.startsWith('Contacts jumping in astern'))&&f.events.some(e=>e.startsWith('HAIL Did you think')));
 assert.equal(f.fleet.twist,'reinforce');
 f.fleet.tick(80);assert.equal(f.ships.filter(s=>s.team==='e').length,3,'it springs once');
 const g=fixture(0,twisted('reinforce',{type:'destroy'}));g.boss.hull=50;g.fleet.tick(.1);assert.equal(g.ships.filter(s=>s.team==='e').length,3,'a hurt lead calls them in');
}
{
 // A badly damaged supporting ship changes sides; once the rest are gone the fight is won
 const f=fixture(0,twisted('defect',{type:'destroy'},pair)),wing=f.ships.find(s=>s.name==='Corsair wingman');
 f.fleet.tick(.1);assert.equal(wing.team,'e');
 wing.hull=20;f.fleet.tick(.1);
 assert.equal(wing.team,'p');assert.ok(f.allies.includes(wing)&&wing.target===f.boss,'the defector fights for us');
 assert.ok(f.events.some(e=>e==='Corsair wingman has changed sides'));
 f.boss.alive=false;f.fleet.onDestroyed(f.boss);assert.equal(f.outcome(),'win');
}
{
 // The lead breaks and runs: catch it inside 45 seconds or the bounty is lost
 const f=fixture(0,twisted('flee',{type:'destroy'}));
 f.boss.hull=30;f.fleet.tick(.1);
 assert.ok(f.boss.ai.flee&&f.fleet.status().startsWith('RUNNING · BLACK GULL 30% HULL'),f.fleet.status());
 for(let i=0;i<44;i++)f.fleet.tick(1);assert.equal(f.outcome(),null);
 f.fleet.tick(1.5);assert.equal(f.outcome(),'lose');assert.equal(f.game.campaignOutcome,'quarry_escaped');
 const g=fixture(0,twisted('flee',{type:'destroy'}));g.boss.hull=30;g.fleet.tick(.1);g.boss.alive=false;g.fleet.onDestroyed(g.boss);
 assert.equal(g.outcome(),'win','caught before it jumped');
}
{
 // The quarry was bait: it turns to fight, ambushers arrive, and the jump timer no longer matters
 const f=fixture(0,twisted('bait',{type:'pursuit',seconds:115,at:.3,speed:.8}));
 assert.ok(f.fleet.quarry&&f.boss.ai.flee);
 for(let i=0;i<41;i++)f.fleet.tick(1);
 assert.equal(f.fleet.quarry,null);assert.equal(f.boss.ai.flee,null);assert.equal(f.ships.filter(s=>s.team==='e').length,3);
 assert.ok(f.events.some(e=>e.startsWith('It was bait')));
 for(let i=0;i<90;i++)f.fleet.tick(1);assert.equal(f.outcome(),null,'no escape after the trap is sprung');
 f.boss.hull=20;f.fleet.tick(.1);assert.equal(f.outcome(),null,'disabling it is no longer enough');
 for(const s of f.ships.filter(s=>s.team==='e')){s.alive=false;f.fleet.onDestroyed(s);}
 assert.equal(f.game.campaignOutcome,'fleet_destroyed');
}
{
 // The beacon is compromised: the convoy turns for a new one, and only that one gets it out
 const f=fixture(0,twisted('divert',{type:'escort',convoy:'MV Hale · Freighter',hunter:true})),c=f.fleet.convoy;
 c.pos.z=1500;f.fleet.tick(.1);
 const g=f.fleet.gate;assert.ok(g!==GATE&&g.x<0,'a new beacon');assert.match(f.fleet.status(),/REROUTED 0%/);
 c.pos.x=GATE.x;c.pos.z=GATE.z;f.fleet.tick(.1);assert.equal(f.outcome(),null,'the old beacon is useless');
 c.pos.x=g.x;c.pos.z=g.z;f.fleet.tick(.1);assert.equal(f.game.campaignOutcome,'escort_extracted');
}
{
 // The convoy's drive fails for thirty seconds
 const f=fixture(0,twisted('stall',{type:'escort',convoy:'MV Hale · Freighter',hunter:true})),c=f.fleet.convoy;
 c.pos.z=2400;f.fleet.tick(.1);assert.equal(c.step,2);assert.match(f.fleet.status(),/DRIVE FAILURE · 30 S/);
 for(let i=0;i<31;i++)f.fleet.tick(1);assert.equal(c.step,3,'the drive comes back');
}
{
 // The defended station loses its shields for 35 seconds when the second wave arrives or it is badly hurt
 const m=Campaign.encounter(Campaign.sideById['a2-listening']);assert.equal(m.twist.type,'blackout');
 const f=fixture(0,m),st=f.fleet.station;
 st.hull=st.maxHull*.55;f.fleet.tick(.1);assert.ok(st.sh.every(v=>v===0));
 st.sh=[40,40,40,40];f.fleet.tick(10);assert.ok(st.sh.every(v=>v===0),'the generator stays down');assert.match(f.fleet.status(),/SHIELDS DOWN 25 S/);
 f.fleet.tick(26);st.sh=[40,40,40,40];f.fleet.tick(.1);assert.ok(st.sh[0]===40,'and comes back');
}
{
 // Bosses keep their own phases and never take a twist
 const f=fixture(8,{...Campaign.storyEncounter(8),twist:{type:'flee'}});f.boss.hull=10;f.fleet.tick(.1);assert.equal(f.fleet.twist,null);
}
console.log('Campaign fleet contract tests passed (25 scenarios).');

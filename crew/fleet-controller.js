(function(root){
'use strict';

// Campaign-only encounter logic, driven by an encounter spec from crew/campaign-data.js. Pure enough to test without WebGL.
// The battle page creates the flagship, its escorts and the first enemy; this adds the rest of the hostiles
// (topped up to match the player's fleet), any convoy, flies the escorts to their orders, and decides the result.
const GATE=Object.freeze({x:570,y:0,z:-1550,radius:340});
// Escort orders: focus fires on the flagship's target, defend goes for whatever is nearest the flagship,
// free picks the hostile nearest the escort itself.
const ORDERS=Object.freeze({focus:'Focus my target',defend:'Defend the flagship',free:'Engage freely'});

function create({encounter,missionId,makeShip,placeShip,ships,player,primaryEnemy,allies=[],getSelected,setSelected,DIFF,endGame,showMsg,hail,game,V3,buildFreighter}){
 const spec=encounter||(missionId&&root.BroadsideCampaign?root.BroadsideCampaign.storyEncounter(Number(missionId)):null)||{enemies:[],goal:{type:'destroy'}};
 const goal=spec.goal||{type:'destroy'},extras=[];
 let convoy=null,held=false,phase='transit',retargetTimer=0,noticeStage=0,elapsed=0,hostileCount=1,order='focus',escortT=0,spreadT=4,bossPhase=0;
 const boss=spec.boss&&spec.boss.phases?{...spec.boss,ship:primaryEnemy}:null;
 const hostile=()=>ships.filter(s=>s.team==='e'&&s.alive);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const convoyName=()=>(goal.convoy||'Convoy').split(' · ')[0];
 function scale(ship,e){
  if(!e)return;
  if(e.hull&&e.hull!==1)ship.hull=Math.round(ship.C.hull*e.hull);
  if(e.shield&&e.shield!==1){ship.sh=ship.sh.map(v=>Math.round(v*e.shield));ship.cap=ship.cap.map(v=>Math.round(v*e.shield));}
  ship.maxHull=ship.hull;
 }
 function stopHostiles(){
  for(const ship of hostile()){ship.ai=null;ship.target=null;ship.step=0;ship.fireQ=[];}
 }
 const escorts=()=>allies.filter(s=>s.alive);
 function finish(outcome,code){
  if(game.ending)return;
  game.campaignOutcome=code;
  if(outcome==='win'){player.isWinner=true;if(convoy?.alive)convoy.isWinner=true;for(const a of escorts())a.isWinner=true;}
  else if(player.alive)player.isWinner=true;
  stopHostiles();
  endGame(outcome);
  // End screen starts promptly; prevent minutes of inconsequential post-battle fire.
  game.endT=.8;
 }
 function setup(){
  const base=spec.enemies||[],extra=allies.length&&root.BroadsideCampaign&&base.length?root.BroadsideCampaign.reinforcements(spec,allies.length+1):[],list=[...base,...extra];
  if(list[0]){primaryEnemy.name=list[0].name||primaryEnemy.name;scale(primaryEnemy,list[0]);}
  if(goal.type==='escort'){
   convoy=makeShip('sabre','p');
   convoy.name=goal.convoy||'Civilian transport';
   convoy.civilian=true;
   convoy.hull=Math.round(convoy.C.hull*.65);
   convoy.sh=convoy.sh.map(v=>Math.round(v*.65));
   convoy.cap=convoy.cap.map(v=>Math.round(v*.65));
   for(const group of convoy.groups)for(const mount of group.mounts||[])if(mount.t)mount.t.visible=false;
   convoy.groups=[];convoy.step=3;
   placeShip(convoy,new V3(GATE.x,GATE.y,3650),0);
   buildFreighter?.(convoy);
   if(goal.hunter!==false)primaryEnemy.target=convoy;
   primaryEnemy.ai.side=1;
   extras.push(convoy);
  }
  // Further hostiles come in from alternating flanks so a pair works as a pincer.
  list.slice(1).forEach((e,i)=>{const side=i%2?1:-1;addHostile(e,side,new V3(side*(2100+i*250),90,-1500-i*400));});
  if(list.length>1){primaryEnemy.ai.flankOffset=26;primaryEnemy.ai.side=1;}
  hostileCount=Math.max(1,list.length);
  // A boss holds back the weapons its later phases unlock.
  if(boss){
   const held=new Set(boss.phases.flatMap(p=>p.unlock||[]));
   for(const g of primaryEnemy.groups)if(held.has(g.id))g.locked=true;
   primaryEnemy.isBoss=true;
  }
 }
 function addHostile(e,side,pos){
  const ship=makeShip(e.cls,'e');
  ship.name=e.name||ship.name;
  scale(ship,e);
  if(e.lattice)ship.latticeNode=true;
  ship.ai={diff:DIFF[e.diff]||DIFF.commander||DIFF.captain,side,flankOffset:side*27,shT:3,pwT:0,mode:'close',sideT:0};
  ship.target=player;
  placeShip(ship,pos,Math.PI);
  extras.push(ship);
  return ship;
 }
 // Boss phases: each begins when the boss's hull falls past its threshold.
 function enterPhase(i){
  const p=boss.phases[i],b=boss.ship;bossPhase=i;
  showMsg(boss.title+' · '+p.name,3.5);
  if(p.line)hail?.({name:b.name,faction:spec.hail&&spec.hail.faction||'',line:p.line});
  (p.spawn||[]).forEach((e,k)=>{const side=k%2?1:-1;addHostile(e,side,new V3(b.pos.x+side*800,b.pos.y+60,b.pos.z+300));hostileCount++;});
  if(p.shields)b.sh=b.cap.slice();
  for(const g of b.groups)if((p.unlock||[]).includes(g.id))g.locked=false;
  if(p.lattice)b.dmgTaken=p.lattice;
  if(p.regen)b.regenK=p.regen;
 }
 function bossTick(){
  const b=boss.ship;if(!b.alive)return;
  const f=b.hull/(b.maxHull||b.C.hull);
  while(bossPhase+1<boss.phases.length&&f<=boss.phases[bossPhase+1].at)enterPhase(bossPhase+1);
  if(b.dmgTaken<1&&!hostile().some(s=>s.latticeNode)){b.dmgTaken=1;showMsg('Lattice down · '+b.name+' is exposed',3);}
 }
 function toggleHold(){
  if(!convoy?.alive||game.ending)return false;
  held=!held;
  showMsg(held?convoyName()+' ordered to hold position':convoyName()+' resuming extraction route',2.3);
  return true;
 }
 function cycle(){
  const choices=hostile();
  if(!choices.length||game.ending)return;
  const index=choices.indexOf(getSelected()),next=choices[(index+1)%choices.length];
  setSelected(next);player.target=next;
  showMsg('Target selected: '+next.name,1.8);
 }
 function setOrder(next){
  if(!ORDERS[next]||!allies.length||game.ending)return false;
  order=next;escortT=0;
  showMsg('Escorts: '+ORDERS[next].toLowerCase(),2);
  return true;
 }
 // Escorts pick their targets once a second according to the standing order.
 function steerEscorts(){
  const foes=hostile();if(!foes.length)return;
  const near=(from,list)=>list.reduce((b,s)=>!b||distance(s.pos,from)<distance(b.pos,from)?s:b,null);
  for(const a of escorts()){
   let t=null;
   if(order==='focus')t=getSelected()?.alive&&getSelected().team==='e'?getSelected():null;
   else if(order==='defend'){const onUs=foes.filter(f=>f.target===player);t=near(player.pos,onUs.length?onUs:foes);}
   t=t||near(a.pos,foes);
   a.target=t;
  }
 }
 // Hostiles spread their fire: each picks the nearest of the player's ships, leaning towards the flagship.
 function spreadFire(){
  const ours=[player,...escorts()].filter(s=>s.alive);if(ours.length<2)return;
  for(const h of hostile()){
   if(convoy?.alive&&h===primaryEnemy&&goal.hunter!==false)continue;
   h.target=ours.reduce((b,s)=>{const d=distance(s.pos,h.pos)*(s===player?.75:1);return d<b.d?{s,d}:b;},{s:player,d:Infinity}).s;
  }
 }
 function onDestroyed(ship){
  if(game.ending)return;
  if(ship===player){finish('lose','flagship_lost');return;}
  if(ship.civilian){finish('lose','convoy_lost');return;}
  if(ship.team==='p'){showMsg(ship.name+' disabled · escort out of the fight',3);return;}
  if(boss&&ship===boss.ship){finish('win','boss_destroyed');return;}
  const alive=hostile();
  if(!alive.length){finish('win',convoy?.alive?'escort_saved':hostileCount>1?'fleet_destroyed':'enemy_destroyed');return;}
  if(getSelected()===ship||!getSelected()?.alive){
   setSelected(alive[0]);player.target=alive[0];
   showMsg('Hostile destroyed · new target '+alive[0].name,3);
  }
  // The last ship of a pincer stops flanking and comes straight in.
  if(alive.length===1&&alive[0].ai)alive[0].ai.flankOffset=0;
 }
 function tick(dt){
  if(game.ending)return;
  elapsed+=dt;
  if(goal.type==='surrender'&&primaryEnemy.alive&&player.alive&&primaryEnemy.hull<=primaryEnemy.C.hull*(goal.at||.28)){
   finish('win','surrender');game.endT=.35;return;
  }
  if(boss)bossTick();
  if(goal.type==='survive'&&player.alive&&elapsed>=(goal.seconds||100)){
   finish('win','extracted');game.endT=.35;return;
  }
  if(convoy?.alive){
   convoy.step=held?1:3;
   convoy.rudder=0;
   convoy.climb=0;
   // Holding is deliberate; extraction requires entering the visual gate.
   if(!held&&convoy.pos.z<=GATE.z&&Math.abs(convoy.pos.x-GATE.x)<GATE.radius&&Math.abs(convoy.pos.y-GATE.y)<GATE.radius){
    phase='extracted';finish('win','escort_extracted');return;
   }
   const progress=clamp((3650-convoy.pos.z)/(3650-GATE.z),0,1);
   if(progress>.4&&noticeStage===0){noticeStage=1;showMsg(convoyName()+': halfway to the extraction corridor',2.8);}
   if(progress>.78&&noticeStage===1){noticeStage=2;showMsg(convoyName()+': jump beacon in range soon',2.8);}
   // The lead hunter alternates between the easier civilian target and a captain who interferes.
   retargetTimer-=dt;
   if(goal.hunter!==false&&primaryEnemy.alive&&retargetTimer<=0){
    retargetTimer=12;
    const attackPlayer=player.alive&&distance(primaryEnemy.pos,player.pos)<1650;
    const next=attackPlayer?player:convoy;
    if(primaryEnemy.target!==next){
     primaryEnemy.target=next;
     showMsg(attackPlayer?primaryEnemy.name+' switching fire to '+player.name:primaryEnemy.name+' turning back toward the '+convoyName(),2.3);
    }
   }
  }
  if(player.alive&&(!getSelected()||!getSelected().alive)){
   const next=hostile()[0];if(next){setSelected(next);player.target=next;}
  }
  if(allies.length){
   escortT-=dt;if(escortT<=0){escortT=1;steerEscorts();}
   spreadT-=dt;if(spreadT<=0){spreadT=9;spreadFire();}
  }
  for(const ship of hostile())if(!ship.target?.alive)ship.target=player.alive?player:escorts()[0]||(convoy?.alive?convoy:null);
 }
 function status(){
  const n=hostile().length,contacts=n+(n===1?' HOSTILE':' HOSTILES');
  if(convoy){
   const pct=clamp(Math.round(100*(3650-convoy.pos.z)/(3650-GATE.z)),0,100);
   const health=Math.max(0,Math.round(convoy.hull/(convoy.C.hull*.65)*100));
   return 'ESCORT · '+convoyName().toUpperCase()+' '+health+'% HULL · '+(held?'HOLDING':'EXTRACTION '+pct+'%')+' · H HOLD/RESUME · '+contacts;
  }
  if(goal.type==='survive'){
   const s=Math.min(goal.seconds||100,Math.floor(elapsed));
   return (goal.label||'HOLD FAST')+' · '+s+' / '+(goal.seconds||100)+' SECONDS · '+contacts;
  }
  if(boss){const p=boss.phases[bossPhase];return boss.title+' · PHASE '+(bossPhase+1)+' OF '+boss.phases.length+' · '+p.name.toUpperCase()+(boss.ship.dmgTaken<1?' · LATTICE UP: DESTROY THE NODES':'')+' · '+contacts;}
  if(goal.type==='surrender')return 'FORCE SURRENDER BELOW '+Math.round((goal.at||.28)*100)+'% HULL · '+contacts;
  return 'CONTACTS · '+contacts+(n>1?' · J CYCLE TARGET':'');
 }

 return {setup,tick,onDestroyed,cycle,toggleHold,setOrder,status,get order(){return order},get boss(){return boss?{title:boss.title,phase:bossPhase,phases:boss.phases.map(p=>({name:p.name,at:p.at||1})),ship:boss.ship,lattice:boss.ship.dmgTaken<1}:null},get allies(){return allies},get spec(){return spec},get convoy(){return convoy},get extras(){return extras},get held(){return held},get phase(){return phase},get gate(){return GATE},get elapsed(){return elapsed}};
}
root.BroadsideFleet=Object.freeze({create,GATE,ORDERS});

})(typeof window!=='undefined'?window:globalThis);

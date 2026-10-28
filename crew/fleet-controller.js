(function(root){
'use strict';

// Campaign-only encounter logic, driven by an encounter spec from crew/campaign-data.js. Pure enough to test without WebGL.
// The battle page creates the flagship, its escorts and the first enemy; this adds the rest of the hostiles
// (topped up to match the player's fleet), any convoy, flies the escorts to their orders, and decides the result.
const GATE=Object.freeze({x:570,y:0,z:-1550,radius:340});
// Defend: the station sits between the flagship and the enemy. Pursuit: the quarry runs for this point to jump out.
const POST=Object.freeze({x:0,y:0,z:1400});
const ESCAPE=Object.freeze({x:0,z:-6200});
// Escort orders: focus fires on the flagship's target, defend goes for whatever is nearest the flagship,
// free picks the hostile nearest the escort itself.
const ORDERS=Object.freeze({focus:'Focus my target',defend:'Defend the flagship',free:'Engage freely'});

function create({encounter,missionId,makeShip,placeShip,ships,player,primaryEnemy,allies=[],getSelected,setSelected,DIFF,endGame,showMsg,hail,game,V3,buildFreighter,moveGate,setObjective}){
 const spec=encounter||(missionId&&root.BroadsideCampaign?root.BroadsideCampaign.storyEncounter(Number(missionId)):null)||{enemies:[],goal:{type:'destroy'}};
 const goal=spec.goal||{type:'destroy'},extras=[];
 let convoy=null,station=null,quarry=null,gate=GATE,gateFrom=0,kills=0,fleeing=null,fleeAt=null,fleeT=0,wave=0,waveT=0,held=false,phase='transit',retargetTimer=0,noticeStage=0,elapsed=0,hostileCount=1,order='focus',escortT=0,spreadT=4,bossPhase=0;
 const boss=spec.boss&&spec.boss.phases?{...spec.boss,ship:primaryEnemy}:null;
 // A mid-battle twist (crew/campaign-data.js TWISTS): sprung once, when its trigger is met. Bosses have phases instead.
 const twist=spec.twist&&spec.twist.type&&!boss?{...spec.twist,fired:false,until:0}:null;
 const hostile=()=>ships.filter(s=>s.team==='e'&&s.alive);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const convoyName=()=>(goal.convoy||'Convoy').split(' · ')[0];
 // Supporting ships (a lead's wingmen, reinforcements, boss adds) hit at 40% strength unless an entry sets `dmg`;
 // the battle page multiplies every hit a ship lands by its dmgOut.
 const SUPPORT_DMG=.4;
 // NPC-controlled escorts deal less than a human-led flagship. Two escorts should
 // create resilience and tactical choices, not overwhelm bosses without player input.
 const ESCORT_DMG=.55;
 function scale(ship,e,lead){
  if(!e)return;
  ship.dmgOut=Number.isFinite(e.dmg)?e.dmg:lead?1:SUPPORT_DMG;
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
  for(const wing of allies) wing.dmgOut=(Number.isFinite(wing.dmgOut)?wing.dmgOut:1)*ESCORT_DMG;
  const base=spec.enemies||[],extra=allies.length&&root.BroadsideCampaign&&base.length?root.BroadsideCampaign.reinforcements(spec,allies.length+1):[],list=[...base,...extra];
  if(list[0]){primaryEnemy.name=list[0].name||primaryEnemy.name;primaryEnemy.captain=list[0].captain||'';scale(primaryEnemy,list[0],true);}
  if(goal.type==='escort'){
   convoy=makeShip('transport','p');
   convoy.name=goal.convoy||'Civilian transport';
   convoy.civilian=true;
   // A convoy run in legs (campaign sideLeg) brings the damage it took in the last system.
   convoy.hull=Math.round(convoy.C.hull*.65*clamp(Number.isFinite(goal.convoyHull)?goal.convoyHull:1,.15,1));
   convoy.sh=convoy.sh.map(v=>Math.round(v*.65));
   convoy.cap=convoy.cap.map(v=>Math.round(v*.65));
   for(const group of convoy.groups)for(const mount of group.mounts||[])if(mount.t)mount.t.visible=false;
   convoy.groups=[];convoy.step=3;
   // A head start (the colonies were warned in time) puts the convoy part of the way to the beacon.
   placeShip(convoy,new V3(GATE.x,GATE.y,3650-(goal.headStart||0)*(3650-GATE.z)),0);
   buildFreighter?.(convoy);
   if(goal.hunter!==false)primaryEnemy.target=convoy;
   primaryEnemy.ai.side=1;
   extras.push(convoy);
  }
  // Defend: a fixed station with its own guns, the first thing the attackers go for. Later waves arrive when a wave is beaten.
  if(goal.type==='defend'){
   station=makeShip(goal.hull||'station','p');
   station.name=goal.station||'Picket station';station.post=true;
   station.C={...station.C,vmax:.01,accel:.01,turn:1e-4};   // all but fixed (zero would divide by zero in the helm)
   station.hull=station.maxHull=Math.round(station.C.hull*(goal.stationHull||1.6));
   station.sh=station.sh.map(v=>Math.round(v*1.3));station.cap=station.cap.map(v=>Math.round(v*1.3));
   station.dmgOut=.5;station.step=0;
   station.ai={diff:DIFF.captain||DIFF.commander,side:1,shT:2,pwT:0,mode:'close',sideT:0};station.target=primaryEnemy;
   placeShip(station,new V3(POST.x,POST.y,POST.z),0);
   primaryEnemy.target=station;
   extras.push(station);
  }
  // Pursuit: the quarry starts ahead, already running, slower than a warship at full burn; its jump drive is spooling.
  if(goal.type==='pursuit'){
   quarry=primaryEnemy;
   quarry.C={...quarry.C,vmax:quarry.C.vmax*(goal.speed||.8)};
   placeShip(quarry,new V3(0,60,500),0);
   quarry.ai.flee=ESCAPE;
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
 function addHostile(e,side,pos,yaw=Math.PI){
  const ship=makeShip(e.cls,'e');
  ship.name=e.name||ship.name;ship.captain=e.captain||'';
  scale(ship,e);
  if(e.lattice)ship.latticeNode=true;
  ship.ai={diff:DIFF[e.diff]||DIFF.commander||DIFF.captain,side,flankOffset:side*27,shT:3,pwT:0,mode:'close',sideT:0};
  ship.target=station?.alive&&Math.random()<.5?station:player;
  placeShip(ship,pos,yaw);
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
  for(const g of b.groups)if((p.unlock||[]).includes(g.id)&&!g.disabled)g.locked=false;
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
   let t=null,reason='Engaging nearest contact';
   if(order==='focus'){t=getSelected()?.alive&&getSelected().team==='e'?getSelected():null;if(t)reason='Focusing your target';}
   else if(order==='defend'){
     const onUs=foes.filter(f=>f.target===player);
     t=near(player.pos,onUs.length?onUs:foes);
     reason=onUs.length?'Intercepting flagship attacker':'Covering flagship';
   }else if(order==='free'){reason='Engaging nearest threat';}
   t=t||near(a.pos,foes);
   a.target=t;
   a.orderIntent=reason;
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
  if(ship.team==='e')kills++;
  if(ship===fleeing)fleeing=null;
  if(ship===player){finish('lose','flagship_lost');return;}
  if(ship.civilian){finish('lose','convoy_lost');return;}
  if(ship.post){finish('lose','station_lost');return;}
  if(ship.team==='p'){showMsg(ship.name+' disabled · escort out of the fight',3);return;}
  if(boss&&ship===boss.ship){finish('win','boss_destroyed');return;}
  const alive=hostile();
  if(!alive.length&&station&&wave+1<waves().length){waveT=6;showMsg('Wave '+(wave+1)+' beaten · more contacts inbound',3);return;}
  if(!alive.length){finish('win',station?'station_held':convoy?.alive?'escort_saved':hostileCount>1?'fleet_destroyed':'enemy_destroyed');return;}
  if(getSelected()===ship||!getSelected()?.alive){
   setSelected(alive[0]);player.target=alive[0];
   showMsg('Hostile destroyed · new target '+alive[0].name,3);
  }
  // The last ship of a pincer stops flanking and comes straight in.
  if(alive.length===1&&alive[0].ai)alive[0].ai.flankOffset=0;
 }
 // Waves after the first, for a defend mission (the first wave is the encounter's own enemies).
 const waves=()=>[spec.enemies||[],...(goal.waves||[])];
 function nextWave(){
  wave++;const list=waves()[wave]||[];
  list.forEach((e,i)=>{const side=i%2?1:-1;addHostile(e,side,new V3(side*(1400+i*300),90,-3200-i*300));hostileCount++;});
  showMsg('Wave '+(wave+1)+' of '+waves().length+' · '+list.length+(list.length===1?' hostile':' hostiles'),3);
  const first=hostile()[0];if(first){setSelected(first);player.target=first;}
 }
 function tick(dt){
  if(game.ending)return;
  elapsed+=dt;
  if(waveT>0&&(waveT-=dt)<=0)nextWave();
  if(quarry){
   if(quarry.alive&&quarry.hull<=(quarry.maxHull||quarry.C.hull)*(goal.at||.3)){finish('win','quarry_disabled');game.endT=.35;return;}
   const left=(goal.seconds||100)-elapsed;
   if(quarry.alive&&(left<=0||distance(quarry.pos,{x:ESCAPE.x,y:quarry.pos.y,z:ESCAPE.z})<400)){finish('lose','quarry_escaped');game.endT=.35;return;}
   if(left<=30&&noticeStage===0){noticeStage=1;showMsg(quarry.name+': jump drive at ninety percent',2.8,true);}
   if(left<=10&&noticeStage===1){noticeStage=2;showMsg(quarry.name+': jump imminent',2.4,true);}
  }
  if(station?.alive&&primaryEnemy.alive){
   // The lead attacker goes back to the station unless the flagship is right on top of it.
   retargetTimer-=dt;
   if(retargetTimer<=0){retargetTimer=10;primaryEnemy.target=player.alive&&distance(primaryEnemy.pos,player.pos)<1300?player:station;}
   if(!station.target?.alive){const f=hostile();station.target=f.reduce((b,h)=>!b||distance(h.pos,station.pos)<distance(b.pos,station.pos)?h:b,null);}
  }
  if(goal.type==='surrender'&&primaryEnemy.alive&&player.alive&&primaryEnemy.hull<=primaryEnemy.C.hull*(goal.at||.28)){
   finish('win','surrender');game.endT=.35;return;
  }
  if(boss)bossTick();
  if(twist){twistTick(dt);if(game.ending)return;}
  if(goal.type==='survive'&&player.alive&&elapsed>=(goal.seconds||100)){
   finish('win','extracted');game.endT=.35;return;
  }
  if(convoy?.alive){
   convoy.step=held?1:stalled()?2:3;
   convoy.rudder=steerConvoy();
   convoy.climb=0;
   // Holding is deliberate; extraction requires entering the visual gate (wherever it now is).
   const inGate=gate===GATE?convoy.pos.z<=GATE.z&&Math.abs(convoy.pos.x-GATE.x)<GATE.radius:Math.hypot(convoy.pos.x-gate.x,convoy.pos.z-gate.z)<gate.radius;
   if(!held&&inGate&&Math.abs(convoy.pos.y-gate.y)<gate.radius){
    phase='extracted';finish('win','escort_extracted');return;
   }
   const progress=convoyProgress();
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
 // ---- mid-battle twists ----
 const towards=(from,to)=>Math.atan2(-(to.x-from.x),-(to.z-from.z));   // the yaw that points from one spot at another
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 // Spots astern of the flagship, alternating sides, for ships jumping in behind it.
 function astern(i){
  const f=player.fwd||{x:0,z:-1},side=i%2?1:-1,w=500+i*380;
  return new V3(player.pos.x-f.x*2400-f.z*side*w,(player.pos.y||0)+60,player.pos.z-f.z*2400+f.x*side*w);
 }
 function convoyProgress(){
  if(gate===GATE)return clamp((3650-convoy.pos.z)/(3650-GATE.z),0,1);
  return clamp(1-Math.hypot(convoy.pos.x-gate.x,convoy.pos.z-gate.z)/(gateFrom||1),0,1);
 }
 // The convoy flies straight for the beacon, and turns for a new one when it has been rerouted.
 function steerConvoy(){
  if(gate===GATE||!Number.isFinite(convoy.yaw))return 0;
  return clamp(-wrap(towards(convoy.pos,gate)-convoy.yaw)*3,-1,1);
 }
 const stalled=()=>twist?.type==='stall'&&twist.fired&&elapsed<twist.until;
 const blackedOut=()=>twist?.type==='blackout'&&twist.fired&&elapsed<twist.until;
 const defector=()=>hostile().find(s=>s!==primaryEnemy&&!s.isBoss&&s.hull<(s.maxHull||s.C.hull)*.45);
 const leadSays=line=>{if(line&&primaryEnemy.alive)hail?.({name:primaryEnemy.captain||primaryEnemy.name,faction:spec.hail&&spec.hail.faction||'',line});};
 function ambush(list){
  list.forEach((e,i)=>{const p=astern(i);addHostile(e,i%2?1:-1,p,towards(p,player.pos));hostileCount++;});
  if(list.length&&!getSelected()?.alive){const t=hostile()[0];setSelected(t);player.target=t;}
 }
 function spring(){
  const t=twist.type;twist.fired=true;
  if(t==='reinforce'){
   ambush(twist.enemies||[]);
   showMsg('Contacts jumping in astern',3.4,true);
   leadSays(twist.line);
  }
  if(t==='defect'){
   const d=defector();if(!d)return;
   d.team='p';d.friend=true;d.escort=true;d.defector=true;d.ai.flankOffset=0;allies.push(d);
   const foes=hostile();d.target=foes.reduce((b,h)=>!b||distance(h.pos,d.pos)<distance(b.pos,d.pos)?h:b,null);
   showMsg(d.name+' has changed sides',3.4);
   hail?.({name:d.captain||d.name,faction:spec.hail&&spec.hail.faction||'',line:'We are done dying for them. Firing on your target.'});
   if(getSelected()===d){const n=foes[0];if(n){setSelected(n);player.target=n;}}
   if(!foes.length)finish('win',hostileCount>1?'fleet_destroyed':'enemy_destroyed');
  }
  if(t==='flee'){
   // it runs for the edge of the system on the far side from the flagship
   const l=primaryEnemy,dx=l.pos.x-player.pos.x,dz=l.pos.z-player.pos.z,d=Math.hypot(dx,dz),ux=d>1?dx/d:0,uz=d>1?dz/d:-1;
   fleeing=l;fleeT=45;fleeAt={x:ux*6000,z:uz*6000};
   l.C={...l.C,vmax:l.C.vmax*.75};   // running on damaged engines, so it can be caught
   if(l.ai)l.ai.flee=fleeAt;
   showMsg(l.name+' is running for it',3.4,true);
   setObjective?.('Catch the '+l.name+' before it jumps');
   leadSays(twist.line);
  }
  if(t==='bait'&&quarry){
   const q=quarry;q.C={...q.C,vmax:q.C.vmax/(goal.speed||.8)};if(q.ai)q.ai.flee=null;
   quarry=null;goal.type='destroy';
   ambush(twist.enemies||[]);
   showMsg('It was bait · ambushers jumping in astern',3.4,true);
   setObjective?.('Destroy the '+q.name+' and the ambushers');
   hail?.({name:q.captain||q.name,faction:spec.hail&&spec.hail.faction||'',line:'You took the bait, Navy. Now you are the quarry.'});
  }
  if(t==='divert'&&convoy){
   gate=Object.freeze({x:GATE.x>0?-2500:2500,y:GATE.y,z:-700,radius:GATE.radius});
   gateFrom=Math.hypot(convoy.pos.x-gate.x,convoy.pos.z-gate.z);noticeStage=Math.max(noticeStage,1);
   moveGate?.(gate);
   showMsg('Beacon compromised · convoy rerouting',3.6,true);
   setObjective?.('Get the '+convoyName()+' to the auxiliary beacon');
  }
  if(t==='stall'&&convoy){twist.until=elapsed+30;showMsg(convoyName()+': drive failure',3.4,true);}
  if(t==='blackout'&&station){twist.until=elapsed+35;station.sh=station.sh.map(()=>0);showMsg('Station shields down · 35 seconds',3.4,true);}
 }
 function twistTick(dt){
  if(!twist.fired){
   const t=twist.type,l=primaryEnemy,f=l.alive?l.hull/(l.maxHull||l.C.hull):1;
   const go=t==='reinforce'?kills>0||f<.55||elapsed>75
    :t==='defect'?!!defector()
    :t==='flee'?l.alive&&f<.35&&hostile().includes(l)
    :t==='bait'?!!quarry?.alive&&(elapsed>(goal.seconds||100)*.35||f<.6)
    :t==='divert'?!!convoy?.alive&&convoyProgress()>.35
    :t==='stall'?!!convoy?.alive&&convoyProgress()>.22
    :t==='blackout'?!!station?.alive&&(wave>=1||station.hull<station.maxHull*.6):false;
   if(go)spring();
   return;
  }
  if(blackedOut())station.sh=station.sh.map(()=>0);
  if(fleeing?.alive){
   fleeT-=dt;
   if(fleeT<=15&&fleeT+dt>15)showMsg(fleeing.name+': jump drive spooling',2.4,true);
   if(fleeT<=0||Math.hypot(fleeing.pos.x-fleeAt.x,fleeing.pos.z-fleeAt.z)<400){setSelected(fleeing);finish('lose','quarry_escaped');game.endT=.35;}
  }
 }
 function status(){
  const n=hostile().length,contacts=n+(n===1?' HOSTILE':' HOSTILES'),left=()=>Math.max(0,Math.ceil(twist.until-elapsed));
  if(fleeing?.alive){
   const hp=Math.round(100*Math.max(0,fleeing.hull)/(fleeing.maxHull||fleeing.C.hull));
   return 'RUNNING · '+fleeing.name.toUpperCase()+' '+hp+'% HULL · JUMPS IN '+Math.max(0,Math.ceil(fleeT))+' S · '+contacts;
  }
  if(convoy){
   const pct=Math.round(100*convoyProgress());
   const health=Math.max(0,Math.round(convoy.hull/(convoy.C.hull*.65)*100));
   return 'ESCORT · '+convoyName().toUpperCase()+' '+health+'% HULL · '+(held?'HOLDING':stalled()?'DRIVE FAILURE · '+left()+' S':(gate===GATE?'EXTRACTION ':'REROUTED ')+pct+'%')+' · H HOLD/RESUME · '+contacts;
  }
  if(station){
   const hp=Math.max(0,Math.round(100*station.hull/station.maxHull));
   return 'DEFEND · '+station.name.split(' · ')[0].toUpperCase()+' '+hp+'% HULL · WAVE '+(wave+1)+' OF '+waves().length+(blackedOut()?' · SHIELDS DOWN '+left()+' S':'')+' · '+contacts;
  }
  if(quarry){
   const left=Math.max(0,Math.ceil((goal.seconds||100)-elapsed)),hp=Math.round(100*Math.max(0,quarry.hull)/(quarry.maxHull||quarry.C.hull));
   return 'PURSUIT · '+quarry.name.toUpperCase()+' '+hp+'% HULL · DISABLE BELOW '+Math.round((goal.at||.3)*100)+'% · JUMPS IN '+left+' S · '+contacts;
  }
  if(goal.type==='survive'){
   const s=Math.min(goal.seconds||100,Math.floor(elapsed));
   return (goal.label||'HOLD FAST')+' · '+s+' / '+(goal.seconds||100)+' SECONDS · '+contacts;
  }
  if(boss){const p=boss.phases[bossPhase];return boss.title+' · PHASE '+(bossPhase+1)+' OF '+boss.phases.length+' · '+p.name.toUpperCase()+(boss.ship.dmgTaken<1?' · LATTICE UP: DESTROY THE NODES':'')+' · '+contacts;}
  if(goal.type==='surrender')return 'FORCE SURRENDER BELOW '+Math.round((goal.at||.28)*100)+'% HULL · '+contacts;
  return 'CONTACTS · '+contacts+(n>1?' · J CYCLE TARGET':'');
 }

 // Show measurable ally contributions rather than treating escorts as invisible damage bonuses.
 function escortReport(){return allies.map(a=>({
   name:a.name,alive:!!a.alive,damage:Math.round(a.stats?.dealt||0),taken:Math.round(a.stats?.taken||0),
   shots:a.stats?.shots||0,hits:a.stats?.hits||0,orderIntent:a.orderIntent||'Awaiting orders'
 }));}
 return {setup,tick,onDestroyed,cycle,toggleHold,setOrder,status,escortReport,get order(){return order},get boss(){return boss?{title:boss.title,phase:bossPhase,phases:boss.phases.map(p=>({name:p.name,at:p.at||1})),ship:boss.ship,lattice:boss.ship.dmgTaken<1}:null},get allies(){return allies},get spec(){return spec},get convoy(){return convoy},get station(){return station},get quarry(){return quarry},get wave(){return wave},get extras(){return extras},get held(){return held},get phase(){return phase},get gate(){return gate},get twist(){return twist&&twist.fired?twist.type:null},get elapsed(){return elapsed}};
}
root.BroadsideFleet=Object.freeze({create,GATE,ORDERS});

})(typeof window!=='undefined'?window:globalThis);

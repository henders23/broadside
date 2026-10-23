(function(root){
'use strict';
// Campaign-only encounter logic. Pure enough to test without WebGL.
const GATE=Object.freeze({x:570,y:0,z:-1550,radius:340});
function create({missionId,makeShip,placeShip,ships,player,primaryEnemy,getSelected,setSelected,DIFF,endGame,showMsg,game,V3,buildFreighter}){
 const mission=Number(missionId),extras=[];
 let convoy=null,held=false,phase='transit',retargetTimer=0,noticeStage=0;
 const hostile=()=>ships.filter(s=>s.team==='e'&&s.alive);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function stopHostiles(){
   for(const ship of hostile()){ship.ai=null;ship.target=null;ship.step=0;ship.fireQ=[];}
 }
 function finish(outcome,code){
   if(game.ending)return;
   game.campaignOutcome=code;
   if(outcome==='win'){player.isWinner=true;if(convoy?.alive)convoy.isWinner=true;}
   else if(player.alive)player.isWinner=true;
   stopHostiles();
   endGame(outcome);
   // End screen starts promptly; prevent minutes of inconsequential post-battle fire.
   game.endT=.8;
 }
 function setup(){
   if(mission===1){
     convoy=makeShip('sabre','p');
     convoy.name='MV Peregrine · Civilian transport';
     convoy.civilian=true;
     convoy.hull=Math.round(convoy.C.hull*.65);
     convoy.sh=convoy.sh.map(v=>Math.round(v*.65));
     convoy.cap=convoy.cap.map(v=>Math.round(v*.65));
     convoy.groups=[];convoy.step=3;
     placeShip(convoy,new V3(GATE.x,GATE.y,3650),0);
     buildFreighter?.(convoy);
     primaryEnemy.target=convoy;
     primaryEnemy.ai.side=1;
     extras.push(convoy);
   }else if(mission===2){
     const wing=makeShip('scrapjaw','e');
     wing.name='Ash Fleet Pursuer';
     wing.hull=Math.round(wing.C.hull*.38);
     wing.sh=wing.sh.map(v=>Math.round(v*.58));
     wing.cap=wing.cap.map(v=>Math.round(v*.58));
     wing.ai={diff:DIFF.commander,side:-1,flankOffset:-27,shT:3,pwT:0,mode:'close',sideT:0};
     primaryEnemy.ai.flankOffset=26;primaryEnemy.ai.side=1;
     wing.target=player;
     placeShip(wing,new V3(2100,90,-1500),Math.PI);
     extras.push(wing);
   }
 }
 function toggleHold(){
   if(!convoy?.alive||game.ending)return false;
   held=!held;
   showMsg(held?'Convoy ordered to hold position':'Convoy resuming extraction route',2.3);
   return true;
 }
 function cycle(){
   const choices=hostile();
   if(!choices.length||game.ending)return;
   const index=choices.indexOf(getSelected()),next=choices[(index+1)%choices.length];
   setSelected(next);player.target=next;
   showMsg('Target selected: '+next.name,1.8);
 }
 function onDestroyed(ship){
   if(game.ending)return;
   if(ship===player){finish('lose','flagship_lost');return;}
   if(ship.civilian){finish('lose','convoy_lost');return;}
   const alive=hostile();
   if(!alive.length){finish('win',convoy?.alive?'escort_saved':mission===2?'fleet_destroyed':'enemy_destroyed');return;}
   if(getSelected()===ship||!getSelected()?.alive){
     setSelected(alive[0]);player.target=alive[0];
     showMsg('Hostile destroyed · new target '+alive[0].name,3);
   }
   if(mission===2 && primaryEnemy.alive && alive.length===1)primaryEnemy.ai.flankOffset=0;
 }
 function tick(dt){
   if(game.ending)return;
   if(convoy?.alive){
     convoy.step=held?1:3;
     convoy.rudder=0;
     convoy.climb=0;
     // Holding is deliberate; extraction requires entering the visual gate.
     if(!held&&convoy.pos.z<=GATE.z&&distance(convoy.pos,GATE)<GATE.radius){
       phase='extracted';finish('win','escort_extracted');return;
     }
     const progress=clamp((3650-convoy.pos.z)/(3650-GATE.z),0,1);
     if(progress>.4 && noticeStage===0){noticeStage=1;showMsg('Peregrine: halfway to the extraction corridor',2.8);}
     if(progress>.78 && noticeStage===1){noticeStage=2;showMsg('Peregrine: jump beacon in range soon',2.8);}
     // Vex alternates between the easier civilian target and a captain who interferes.
     retargetTimer-=dt;
     if(primaryEnemy.alive&&retargetTimer<=0){
       retargetTimer=12;
       const attackPlayer=player.alive&&distance(primaryEnemy.pos,player.pos)<1650;
       const next=attackPlayer?player:convoy;
       if(primaryEnemy.target!==next){
         primaryEnemy.target=next;
         showMsg(attackPlayer?'Vex switching fire to Resolute':'Vex turning back toward the transport',2.3);
       }
     }
   }
   if(player.alive && (!getSelected()||!getSelected().alive)){
     const next=hostile()[0];if(next){setSelected(next);player.target=next;}
   }
   for(const ship of hostile())if(!ship.target?.alive)ship.target=player.alive?player:convoy?.alive?convoy:null;
 }
 function status(){
   if(convoy){
     const pct=clamp(Math.round(100*(3650-convoy.pos.z)/(3650-GATE.z)),0,100);
     const health=Math.max(0,Math.round(convoy.hull/(convoy.C.hull*.65)*100));
     return 'ESCORT · PEREGRINE '+health+'% HULL · '+(held?'HOLDING':'EXTRACTION '+pct+'%')+' · H HOLD/RESUME · '+hostile().length+' HOSTILE';
   }
   if(mission===2)return 'CINDER WAKE · '+hostile().length+' HOSTILES · PINCER FORMATION · J CYCLE TARGET';
   return 'CONTACTS · '+hostile().length+' HOSTILE · J CYCLE TARGET';
 }
 return {setup,tick,onDestroyed,cycle,toggleHold,status,get convoy(){return convoy},get extras(){return extras},get held(){return held},get phase(){return phase},get gate(){return GATE}};
}
root.BroadsideFleet=Object.freeze({create,GATE});
})(window);

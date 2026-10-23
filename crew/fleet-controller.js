(function(root){
'use strict';
// Mission-scoped fleet controller: the original skirmish remains a one-on-one duel.
// A ship's team determines friend/foe damage; missions determine victory.
function create({missionId,makeShip,placeShip,ships,player,primaryEnemy,getSelected,setSelected,DIFF,endGame,showMsg,game,V3}){
  let convoy=null;
  const extras=[];
  const mission=Number(missionId);
  const hostile=()=>ships.filter(s=>s.team==='e'&&s.alive);
  function setup(){
    if(mission===1){
      convoy=makeShip('sabre','p');
      convoy.name='MV Peregrine · Civilian transport';
      convoy.civilian=true;
      convoy.hull=Math.round(convoy.C.hull*.55);
      convoy.sh=convoy.sh.map(v=>Math.round(v*.50));
      convoy.cap=convoy.cap.map(v=>Math.round(v*.50));
      convoy.groups=[]; // a merchant hull, not an armed player ally
      convoy.step=2;
      placeShip(convoy,new V3(570,0,3650),0);
      primaryEnemy.target=convoy;
      extras.push(convoy);
    } else if(mission===2){
      const wing=makeShip('scrapjaw','e');
      wing.name='Ash Fleet Pursuer';
      wing.hull=Math.round(wing.C.hull*.40);
      wing.sh=wing.sh.map(v=>Math.round(v*.56));
      wing.cap=wing.cap.map(v=>Math.round(v*.56));
      wing.ai={diff:DIFF.commander,side:-1,shT:3,pwT:0,mode:'close',sideT:0};
      wing.target=player;
      placeShip(wing,new V3(1800,90,-1600),Math.PI);
      extras.push(wing);
    }
  }
  function cycle(){
    const choices=hostile();
    if(!choices.length)return;
    const index=choices.indexOf(getSelected());
    const next=choices[(index+1)%choices.length];
    setSelected(next);
    player.target=next;
    showMsg('Target selected: '+next.name,1.8);
  }
  function onDestroyed(ship){
    if(game.ending)return;
    if(ship===player){endGame('lose');return;}
    if(ship.civilian){game.campaignOutcome='convoy_lost';endGame('lose');return;}
    const alive=hostile();
    if(!alive.length){if(convoy&&convoy.alive)game.campaignOutcome='escort_saved';else if(mission===2)game.campaignOutcome='fleet_destroyed';endGame('win');return;}
    if(getSelected()===ship||!getSelected()?.alive){
      setSelected(alive[0]);player.target=alive[0];
      showMsg('Hostile destroyed · new target '+alive[0].name,3);
    }
  }
  function tick(dt){
    if(game.ending)return;
    if(convoy&&convoy.alive){
      convoy.step=2;
      // Keep the merchant inside the battle volume and on its departure bearing.
      if(convoy.pos.length()>6500)convoy.rudder=convoy.pos.x>0?0.55:-0.55;
      else convoy.rudder=0;
    }
    if(player.alive&&(!getSelected()||!getSelected().alive)){
      const next=hostile()[0];
      if(next){setSelected(next);player.target=next;}
    }
    for(const ship of hostile()){
      if(!ship.target?.alive){
        ship.target=player.alive?player:convoy?.alive?convoy:null;
      }
    }
  }
  function status(){
    if(convoy)return 'ESCORT · MV PEREGRINE '+Math.max(0,Math.round(convoy.hull/(convoy.C.hull*.55)*100))+'% HULL · HOSTILES '+hostile().length;
    if(mission===2)return 'CINDER WAKE · HOSTILE CONTACTS '+hostile().length+' / 2 · J CYCLES TARGETS';
    return 'CONTACTS · '+hostile().length+' HOSTILE · J CYCLES TARGETS';
  }
  return {setup,tick,onDestroyed,cycle,status,get convoy(){return convoy},get extras(){return extras}};
}
root.BroadsideFleet=Object.freeze({create});
})(window);

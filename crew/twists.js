(function(root){
'use strict';

// Mid-battle twists: in about one battle in three, one thing changes partway through the fight. This file decides
// which twist a battle gets and when; index.html carries it out (the ships, the effects and the messages).
// Pure, so it runs without WebGL (tests/twists.test.js).
//
//   reinforcements  enemy support jumps in, on the far side from the lead (campaign battles only)
//   navy            a Navy ship drops out of the lane to fight beside you (campaign battles only)
//   ionstorm        an ion storm rolls through: no ship's shields recharge for a while
//   breach          the enemy lead's reactor vents: its shields fail for a few seconds
//   surrender       a beaten human captain offers to strike their colours (campaign battles only)
const TWISTS=Object.freeze({
 reinforcements:{label:'Enemy reinforcements',fleet:true,weight:26},
 navy:{label:'Navy support',fleet:true,weight:18},
 ionstorm:{label:'Ion storm',fleet:false,weight:20},
 breach:{label:'Reactor breach',fleet:false,weight:20},
 surrender:{label:'Surrender offer',fleet:true,weight:16}
});
const CHANCE=.36;
// How long the timed twists last, the warning before ships arrive, and the surrender offer's window.
const TIMING=Object.freeze({warn:4,storm:20,breach:12,offer:10,surrenderAt:.35});
// Navy ships that answer a call for help (the hull is chosen on the battle page).
const NAVY_NAMES=Object.freeze(['MNS Kittiwake','MNS Lantern','MNS Steadfast','MNS Tern','MNS Corrigan','MNS Hearthguard']);
const NAVY_LINES=Object.freeze([
 'Flagship, this is {ship}. Heard your call on the lane. Coming in on your flank.',
 '{ship} to flagship: we were two jumps out and burning hard. Point us at something.',
 'This is {ship}. Command sends its regards, and our guns.'
]);
const REINFORCE_LINES=Object.freeze({
 Corsair:'Brothers, the Navy ship is bleeding. Come and take your share.',
 'Ash Fleet':'Ash Fleet units, converge on my position. We finish this here.',
 Directorate:'Additional platforms allocated. Outcome probability revised.',
 Wraith:'The harmonic in the hull deepens. Something else is answering it.'
});
// What answers the enemy's call, by the lead's hull: lighter support at reduced strength (as crew/campaign-data.js
// tops up a fleet fight).
const SUPPORT=Object.freeze({
 scrapjaw:{cls:'scrapjaw',name:'Corsair reinforcement'},revenant:{cls:'scrapjaw',name:'Ash Fleet reinforcement'},
 seraph:{cls:'seraph',name:'Directorate drone'},sentinel:{cls:'seraph',name:'Directorate drone'},
 wraith:{cls:'thrall',name:'Thrall'},thrall:{cls:'thrall',name:'Thrall'}
});
function support(cls){const s=SUPPORT[cls]||SUPPORT.scrapjaw;return {cls:s.cls,name:s.name,hull:.45,shield:.6,diff:'commander',support:true};}
const SURRENDER_LINES=Object.freeze([
 'Hold your fire! We strike, we strike. Take the ship and spare the crew.',
 'Enough. My engines are gone and half my crew with them. We yield, Navy.',
 'Cease fire, cease fire! Colours struck. Nobody else has to die today.'
]);
function surrenderLine(rnd=Math.random){return SURRENDER_LINES[Math.floor(rnd()*SURRENDER_LINES.length)];}
// Factions with no captain to bargain with.
const NO_SURRENDER=/Wraith|Directorate|machine|ORACLE|VIGIL/i;

// The twist a battle gets, or null. mission: the encounter spec (or null for a skirmish). opts: {fleet: is there a
// fleet controller, tutorial, force: a twist id (a test, or ?twist=), none: true to turn twists off (?sim runs)}.
// Returns {id, at} where `at` is when it starts, in battle seconds; a surrender waits for the lead's hull instead.
function choose(mission,rnd=Math.random,opts={}){
 const m=mission||null,goal=(m&&m.goal&&m.goal.type)||'destroy';
 const allowed=allowedTwists(m,opts);
 if(opts.force){return TWISTS[opts.force]&&allowed.includes(opts.force)?{id:opts.force,at:timing(opts.force,rnd,true)}:null;}
 if(opts.none||opts.tutorial)return null;
 // An act finale already has its phases, a defence its waves and a pursuit its clock: they are twist enough.
 if(m&&(m.boss||['boss','defend','pursuit'].includes(goal)))return null;
 if(rnd()>=CHANCE||!allowed.length)return null;
 const total=allowed.reduce((n,k)=>n+TWISTS[k].weight,0);
 let r=rnd()*total,id=allowed[allowed.length-1];
 for(const k of allowed){r-=TWISTS[k].weight;if(r<0){id=k;break;}}
 return {id,at:timing(id,rnd,false)};
}
function allowedTwists(m,opts){
 const goal=(m&&m.goal&&m.goal.type)||'destroy';
 return Object.keys(TWISTS).filter(k=>{
  if(TWISTS[k].fleet&&!opts.fleet)return false;
  if(k==='surrender')return !!m&&canSurrender(m);
  if(k==='breach')return goal!=='survive';   // a hold-out is not won by hurting the enemy
  return true;
 });
}
// Only a human captain fighting for themselves will strike their colours, and only in a plain fight: a rival
// running for it, a forced-surrender operation or an escort's hunter has other ideas.
function canSurrender(m){
 const lead=(m.enemies||[])[0]||{},hail=m.hail&&typeof m.hail==='object'?m.hail:{};
 if(m.story||(m.goal&&m.goal.type)!=='destroy'||m.rival)return false;
 if(!lead.captain||NO_SURRENDER.test(String(hail.faction||''))||NO_SURRENDER.test(String(lead.captain)))return false;
 return ['scrapjaw','revenant'].includes(lead.cls);
}
function timing(id,rnd,forced){
 if(id==='surrender')return 0;
 if(forced)return 3;
 const span={reinforcements:[38,62],navy:[30,55],ionstorm:[22,48],breach:[30,58]}[id]||[30,60];
 return Math.round(span[0]+(span[1]-span[0])*rnd());
}
const fill=(line,ship)=>line.replace(/\{ship\}/g,ship);
function navyCall(rnd=Math.random){
 const ship=NAVY_NAMES[Math.floor(rnd()*NAVY_NAMES.length)];
 return {name:ship,line:fill(NAVY_LINES[Math.floor(rnd()*NAVY_LINES.length)],ship)};
}
function reinforceLine(faction){
 const k=Object.keys(REINFORCE_LINES).find(f=>String(faction||'').includes(f));
 return k?REINFORCE_LINES[k]:REINFORCE_LINES.Corsair;
}

const api={TWISTS,CHANCE,TIMING,NAVY_NAMES,SUPPORT,choose,canSurrender,allowedTwists,navyCall,reinforceLine,support,surrenderLine};
root.BroadsideTwists=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

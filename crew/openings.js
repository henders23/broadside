(function(root){
'use strict';

// Battle openings: where the ships start and how they are moving when control is handed over. Pure data and geometry,
// so it runs (and is tested) without WebGL; index.html places the ships from a layout.
//
// Coordinates follow the battle page: x and z on the plane, y up, and a ship with yaw ψ heads (-sin ψ, -cos ψ), so
// yaw 0 runs toward -z. A layout is drawn in its own frame and then turned about the arena centre by a random angle,
// so the same opening never sits against the same stars and rocks twice.
const OPENINGS=Object.freeze({
 headon:{label:'Head-on',line:null},
 crossing:{label:'Crossing',line:'Contact crossing our bow, captain. She has not turned to meet us yet.'},
 running:{label:'Running battle',line:'Contact pacing us off the beam, captain. Same heading, two kilometres.'},
 ambush:{label:'Ambushed',line:'They dropped out of the lane right behind us. Contact astern, captain!'},
 rocks:{label:'Out of the rocks',line:'They went dark in the rocks ahead, captain. I have lost them on the plot.'},
 jumpin:{label:'Jump-in',line:'Jump signature building, captain. I cannot fix a bearing yet.'}
});
// Escorts, station defences and pursuits keep their own geometry: it is tied to the jump gate, the station or the
// quarry's escape point (crew/fleet-controller.js), so they always open head-on and unturned.
const FIXED=new Set(['escort','defend','pursuit']);
const WEIGHTS=Object.freeze({
 standard:{headon:14,crossing:22,running:18,ambush:12,rocks:16,jumpin:18},
 intercept:{ambush:45,jumpin:30,crossing:15,rocks:10},
 rival:{jumpin:35,ambush:25,crossing:20,running:20},
 // An act finale opens on the boss's entrance, so the boss is never hidden or late.
 boss:{headon:50,crossing:25,running:25}
});
const DEG=Math.PI/180;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

function weighted(table,rnd){
 const keys=Object.keys(table),total=keys.reduce((n,k)=>n+table[k],0);
 let r=rnd()*total;
 for(const k of keys){r-=table[k];if(r<0)return k;}
 return keys[keys.length-1];
}
// Which opening a battle gets. Fixed-geometry goals always open head-on; then opts.force (a test or ?opening=);
// the tutorial; an encounter's own `opening`; otherwise a weighted draw by the kind of fight.
function choose(mission,rnd=Math.random,opts={}){
 const m=mission||{},goal=(m.goal&&m.goal.type)||'destroy';
 if(FIXED.has(goal))return 'headon';
 if(opts.force&&OPENINGS[opts.force])return opts.force;
 if(opts.tutorial)return 'headon';
 const boss=!!m.boss||goal==='boss';
 if(m.opening&&OPENINGS[m.opening]&&!(boss&&['ambush','rocks','jumpin'].includes(m.opening)))return m.opening;
 return weighted(boss?WEIGHTS.boss:m.rival&&m.rival.returning?WEIGHTS.rival:m.kind==='intercept'?WEIGHTS.intercept:WEIGHTS.standard,rnd);
}
// Does this opening keep the battle's own geometry (no turn about the centre)?
function fixed(mission){return FIXED.has(((mission||{}).goal||{}).type);}

// Geometry helpers on {x,z,yaw} placements.
const forward=yaw=>({x:-Math.sin(yaw),z:-Math.cos(yaw)});
const right=yaw=>({x:Math.cos(yaw),z:-Math.sin(yaw)});
// The heading that points a ship at `to`.
function yawTo(from,to){return Math.atan2(-(to.x-from.x),-(to.z-from.z));}
// A point at `bearing` radians off a ship's bow (positive to starboard), `dist` metres out.
function at(p,bearing,dist){const f=forward(p.yaw-bearing);return {x:p.x+f.x*dist,z:p.z+f.z*dist};}
// A point beside and behind a ship, in its own frame: `lateral` to starboard, `astern` behind.
function beside(p,lateral,astern){const f=forward(p.yaw),r=right(p.yaw);return {x:p.x+r.x*lateral-f.x*astern,z:p.z+r.z*lateral-f.z*astern,yaw:p.yaw};}
function turn(p,theta){
 if(!p)return p;
 const c=Math.cos(theta),s=Math.sin(theta);
 return {...p,x:p.x*c+p.z*s,z:-p.x*s+p.z*c,yaw:wrap((p.yaw||0)+theta)};
}

// The layout of an opening: player and enemy {x,y,z,yaw,speed} (speed a fraction of top speed), and flags:
// enemy.hidden (off the plot until found), enemy.away (seconds before it jumps in), rocks (pull asteroids round it).
function layout(id,rnd=Math.random,opts={}){
 const side=rnd()<.5?1:-1,r=(a,b)=>a+(b-a)*rnd(),y=()=>Math.round(r(-110,110));
 let p,e;
 const out={id:OPENINGS[id]?id:'headon',side,label:'',line:null,rocks:false};
 switch(out.id){
  case 'crossing':{   // the enemy passes ahead of you, side-on, about three and a half kilometres out
   p={x:0,z:2000,yaw:0,speed:.5};
   e={x:side*r(1300,1700),y:y(),z:r(-1500,-1000),yaw:side*90*DEG,speed:.6};
   break;}
  case 'running':{   // side by side on the same heading, two kilometres apart
   p={x:-side*1000,z:2400,yaw:0,speed:.6};
   e={x:side*1000,y:y(),z:r(1900,2300),yaw:0,speed:.6};
   break;}
  case 'ambush':{   // they come out of the lane on your quarter, already closing
   p={x:0,z:500,yaw:0,speed:.7};
   const q=at(p,side*r(130,160)*DEG,r(1900,2400));
   e={...q,y:y(),yaw:wrap(yawTo(q,p)+side*r(0,14)*DEG),speed:.8};
   break;}
  case 'rocks':{   // hidden in a rock cluster ahead, drifting, until you get close or they open fire
   p={x:0,z:2300,yaw:0,speed:.4};
   const q=at(p,side*r(14,36)*DEG,r(2700,3200));
   e={...q,y:y(),yaw:wrap(yawTo(q,p)+side*r(40,75)*DEG),speed:.15,hidden:true};
   out.rocks=true;
   break;}
  case 'jumpin':{   // you hold the field alone; they drop out of a jump at a bearing nobody can call
   p={x:r(-400,400),z:r(200,900),yaw:0,speed:.5};
   e={x:0,y:0,z:-9000,yaw:Math.PI,speed:.7,away:Math.round(r(6,13)*10)/10};
   break;}
  default:{   // the old opening: nose to nose, five kilometres apart
   const off=r(-900,900);
   p={x:off*.3,z:2700,yaw:0,speed:.5};
   e={x:-off,y:y(),z:-2700,yaw:Math.PI,speed:.5};
  }
 }
 out.label=OPENINGS[out.id].label;out.line=OPENINGS[out.id].line;
 // Turn the whole layout about the centre (a jump-in's enemy is placed on arrival, so only the player turns).
 const theta=opts.turn===false?0:Number.isFinite(opts.turn)?opts.turn:r(0,2*Math.PI);
 out.theta=theta;out.player=turn(p,theta);out.enemy=e.away?{...e}:turn(e,theta);
 return out;
}
// Where a ship jumping in arrives: anywhere round `p` (the player now), 1.7 to 2.5 km out, facing it, and well inside
// the arena. Bearings astern are a little likelier: it is a nastier surprise.
function arrival(p,rnd=Math.random,opts={}){
 const arena=opts.arena||7500,limit=arena-1500;
 for(let k=0;k<12;k++){
  const b=(rnd()<.4?Math.PI:0)+(rnd()*2-1)*(k<8?Math.PI*.6:Math.PI),d=1700+rnd()*800,q=at(p,b,d);
  if(Math.hypot(q.x,q.z)>limit)continue;
  return {x:q.x,y:Math.round((rnd()*2-1)*90),z:q.z,yaw:wrap(yawTo(q,p)+(rnd()*2-1)*20*DEG),bearing:wrap(b)};
 }
 // Too near the edge for any of those: come in on the side toward the centre.
 const toward=yawTo(p,{x:0,z:0}),q=at({...p,yaw:toward},0,1900);
 return {x:q.x,y:0,z:q.z,yaw:yawTo(q,p),bearing:wrap(p.yaw-toward)};
}
// How the bridge calls a bearing: "off the port quarter", "dead astern" and so on (positive bearings are starboard).
function bearingWords(b){
 const d=Math.abs(wrap(b))/DEG,s=wrap(b)>=0?'starboard':'port';
 if(d<15)return 'dead ahead';if(d>165)return 'dead astern';
 return d<60?'off the '+s+' bow':d<120?'off the '+s+' beam':'off the '+s+' quarter';
}

const api={OPENINGS,WEIGHTS,FIXED,choose,fixed,layout,arrival,bearingWords,yawTo,at,beside,turn,forward,right};
root.BroadsideOpenings=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

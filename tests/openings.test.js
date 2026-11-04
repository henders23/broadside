'use strict';
// Battle openings and mid-battle twists (crew/openings.js, crew/twists.js): node tests/openings.test.js
const assert=require('node:assert/strict');
const O=require('../crew/openings.js'),X=require('../crew/twists.js');
// A small seeded generator so every run checks the same draws.
const seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const close=(a,b,m)=>assert.ok(Math.abs(a-b)<1e-9,m+': '+a+' vs '+b);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

// --- geometry: yaw 0 heads toward -z, positive bearings are to starboard (+x at yaw 0)
close(O.forward(0).z,-1,'yaw 0 runs toward -z');
close(O.at({x:0,z:0,yaw:0},Math.PI/2,100).x,100,'a starboard bearing lies to +x');
close(O.yawTo({x:0,z:0},{x:0,z:-5}),0,'yawTo points a ship at its target');
for(const th of [0.4,2,-2.7]){
 const p={x:300,z:-200,yaw:1.1},q=O.at(p,0.3,800),pt=O.turn(p,th),qt=O.turn({...q,yaw:0},th);
 const back=O.at(pt,0.3,800);close(back.x,qt.x,'turning a layout keeps bearings (x)');close(back.z,qt.z,'turning a layout keeps bearings (z)');
}

// --- every opening, many draws: inside the arena, sensible ranges and geometry
const r=seeded(7);
for(const id of Object.keys(O.OPENINGS))for(let k=0;k<200;k++){
 const L=O.layout(id,r),P=L.player,E=L.enemy;
 assert.equal(L.id,id);assert.ok(L.label);
 assert.ok(Math.hypot(P.x,P.z)<5000,id+': the player starts well inside the arena');
 if(E.away){assert.equal(id,'jumpin');assert.ok(E.away>=6&&E.away<=13,'a jump-in arrives in 6 to 13 s');continue;}
 assert.ok(Math.hypot(E.x,E.z)<5000,id+': the enemy starts well inside the arena');
 const d=dist(P,E),rel=Math.abs(wrap(O.yawTo(P,E)-P.yaw))*180/Math.PI;
 if(id==='headon'){assert.ok(d>5000&&d<5800,'head-on: about five kilometres');assert.ok(rel<20,'head-on: ahead');}
 if(id==='crossing'){assert.ok(d>3000&&d<4000,'crossing: three to four kilometres');assert.ok(Math.abs(Math.abs(wrap(E.yaw-P.yaw))-Math.PI/2)<1e-9,'crossing: side-on');}
 if(id==='running'){assert.ok(d>1900&&d<2200,'running: two kilometres');close(wrap(E.yaw-P.yaw),0,'running: the same heading');}
 if(id==='ambush'){assert.ok(d>1800&&d<2500,'ambush: close');assert.ok(rel>125,'ambush: on the quarter or astern ('+rel.toFixed(0)+'°)');}
 if(id==='rocks'){assert.ok(E.hidden&&L.rocks,'rocks: hidden in a cluster');assert.ok(d>2600&&d<3300&&rel<40,'rocks: ahead, about three kilometres');}
}
// A head-on layout with no turn is the old start: player at +z facing -z, enemy at -z facing +z.
{const L=O.layout('headon',seeded(3),{turn:0});assert.equal(L.player.z,2700);assert.equal(L.enemy.z,-2700);close(L.enemy.yaw,Math.PI,'the old enemy heading');}
// Turned layouts really turn.
{const a=new Set();const rr=seeded(11);for(let k=0;k<20;k++)a.add(Math.round(O.layout('crossing',rr).theta*10));assert.ok(a.size>10,'layouts turn about the centre');}
// Escorts form up beside and behind the flagship.
{const p={x:0,z:0,yaw:0},b=O.beside(p,560,250);close(b.x,560,'escort to starboard');close(b.z,250,'escort astern');}
// Arrivals: 1.7 to 2.5 km out, facing the player, inside the arena even from the edge.
{const rr=seeded(5);for(let k=0;k<300;k++){const p={x:(rr()*2-1)*5500,z:(rr()*2-1)*4000,yaw:rr()*6.28},a=O.arrival(p,rr);
 assert.ok(Math.hypot(a.x,a.z)<6100,'arrival inside the arena');const d=dist(p,a);assert.ok(d>1650&&d<2550,'arrival range '+d);
 assert.ok(Math.abs(wrap(O.yawTo(a,p)-a.yaw))<0.36,'arrives facing the player');}}
assert.equal(O.bearingWords(0),'dead ahead');assert.equal(O.bearingWords(Math.PI),'dead astern');
assert.equal(O.bearingWords(-2.4),'off the port quarter');assert.equal(O.bearingWords(1.5),'off the starboard beam');

// --- choosing an opening
const tally=(m,o={})=>{const c={},rr=seeded(9);for(let k=0;k<2000;k++){const id=O.choose(m,rr,o);c[id]=(c[id]||0)+1;}return c;};
for(const g of ['escort','defend','pursuit'])assert.deepEqual(Object.keys(tally({goal:{type:g}})),['headon'],g+' keeps its fixed geometry');
assert.ok(O.fixed({goal:{type:'escort'}})&&!O.fixed({goal:{type:'destroy'}}));
assert.deepEqual(Object.keys(tally({goal:{type:'destroy'}},{tutorial:true})),['headon'],'the tutorial battle opens head-on');
{const c=tally({goal:{type:'destroy'}});assert.equal(Object.keys(c).length,6,'a contract can open any of six ways');assert.ok(c.headon<0.2*2000,'head-on is now the exception');}
{const c=tally({kind:'intercept',goal:{type:'destroy'}});assert.ok(!c.headon&&c.ambush>c.crossing,'interceptions ambush');}
{const c=tally({boss:{},goal:{type:'boss'}});assert.ok(!c.ambush&&!c.rocks&&!c.jumpin,'a boss is never hidden or late');}
assert.equal(O.choose({opening:'jumpin',goal:{type:'destroy'}},seeded(1)),'jumpin','an operation can name its opening');
assert.notEqual(O.choose({opening:'rocks',boss:{},goal:{type:'boss'}},seeded(1)),'rocks','but not hide a boss');
assert.equal(O.choose({goal:{type:'destroy'}},seeded(1),{force:'running'}),'running','?opening= forces one');
assert.equal(O.choose({goal:{type:'escort'}},seeded(1),{force:'running'}),'headon','but never breaks an escort\'s geometry');

// --- twists
const contract={kind:'contract',goal:{type:'destroy'},enemies:[{cls:'scrapjaw',name:'Saltjack',captain:'Captain Mara Quill'}],hail:{name:'Captain Mara Quill',faction:'Corsair',line:'x'}};
const tw=(m,o)=>{const c={none:0},rr=seeded(21);for(let k=0;k<3000;k++){const t=X.choose(m,rr,o);if(!t)c.none++;else{c[t.id]=(c[t.id]||0)+1;assert.ok(t.at>=0&&t.at<70,'a twist starts in the first minute');}}return c;};
{const c=tw(contract,{fleet:true}),share=1-c.none/3000;assert.ok(share>0.3&&share<0.42,'about one battle in three has a twist: '+share.toFixed(2));
 for(const id of Object.keys(X.TWISTS))assert.ok(c[id]>0,'a contract can bring '+id);}
{const c=tw(contract,{fleet:false});assert.ok(!c.reinforcements&&!c.navy&&!c.surrender&&c.ionstorm&&c.breach,'a skirmish has only the storm and the breach');}
for(const m of [{boss:{},goal:{type:'boss'}},{goal:{type:'defend'}},{goal:{type:'pursuit'}}])assert.equal(tw(m,{fleet:true}).none,3000,'no twist in a '+m.goal.type);
assert.equal(tw(contract,{fleet:true,tutorial:true}).none,3000,'none in the tutorial');
assert.equal(tw(contract,{fleet:true,none:true}).none,3000,'none when switched off (?sim)');
assert.ok(!tw({...contract,goal:{type:'survive'}},{fleet:true}).breach,'a hold-out gets no reactor breach');
// Who will surrender: a human pirate or renegade captain in a plain fight, never a machine, the Wraith, a story foe or a rival.
assert.ok(X.canSurrender(contract));
assert.ok(!X.canSurrender({...contract,enemies:[{cls:'seraph',name:'PICKET-12'}],hail:{faction:'Directorate'}}));
assert.ok(!X.canSurrender({...contract,enemies:[{cls:'wraith',name:'Brood-singer'}],hail:{faction:'Wraith'}}));
assert.ok(!X.canSurrender({...contract,story:3}));
assert.ok(!X.canSurrender({...contract,rival:{name:'x'}}));
assert.ok(!X.canSurrender({...contract,goal:{type:'escort'}}));
assert.ok(!X.canSurrender({...contract,enemies:[{cls:'scrapjaw',name:'Corsair raider'}]}),'a crew with no named captain does not bargain');
assert.deepEqual(X.choose(contract,seeded(1),{fleet:true,force:'navy'}),{id:'navy',at:3},'?twist= forces one, soon');
assert.equal(X.choose(contract,seeded(1),{fleet:false,force:'navy'}),null,'but only where it can happen');
assert.equal(X.support('revenant').cls,'scrapjaw');assert.equal(X.support('wraith').cls,'thrall');assert.ok(X.support('nothing').cls);
assert.ok(X.navyCall(seeded(2)).line.includes(X.navyCall(seeded(2)).name),'the Navy ship names itself');
console.log('openings and twists: all checks passed');

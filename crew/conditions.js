(function(root){'use strict';
// Battlefield conditions and openings in battle: the encounter spec names them (crew/campaign-data.js, CONDITIONS and
// OPENINGS) and this stages them. Conditions change the space a fight happens in; openings change how it starts.
// Rocks, mines and the gravity well join the battle page's own asteroid and mine lists, so collisions, shell hits,
// the tactical plot and the AI's steering treat them like any other rock or mine; clear() takes them out again.
const ION={regen:.5,every:[13,18],loss:.34,warn:2.5};
const NEBULA={sensor:2400,scatter:2.6,fog:.00035,color:0x2c3b52};
const ROCKS={count:36,radius:4300,clear:650};
const MINES={count:30,dmg:240,trigger:150,band:[-1700,1700],width:3800};
const WELL={core:300,avoid:750,pull:24,ref:1400,maxPull:34,burn:60};
// Where the start lanes run: an escorted convoy flies x≈570 to the beacon, a defended station sits at z=1400.
const LANE={x:570,half:480},POST={x:0,z:1400,r:900};

function create({THREE,scene,V3,ships,asteroids,mines,obstacles,rockGeos,rockMat,showMsg,flash,damage,Sfx,clock}){
 let spec=null,cond=null,line='',added=[],fieldMines=[],surgeT=0,warned=false,sparkT=0,savedFog=null,well=null,rnd=Math.random;
 const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 const seedOf=str=>{let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
 const between=(a,b)=>a+(b-a)*rnd();
 // A spot is free when it is clear of every ship, the convoy lane and the defended station.
 function free(p,room){
  if(ships.some(s=>s.pos.distanceTo(p)<room+ (s.C.hullE?s.C.hullE.r[2]:150)))return false;
  if(spec.goal&&spec.goal.type==='escort'&&Math.abs(p.x-LANE.x)<LANE.half+room*.5)return false;
  if(spec.goal&&spec.goal.type==='defend'&&Math.hypot(p.x-POST.x,p.z-POST.z)<POST.r+room*.5)return false;
  return !asteroids.some(a=>a.pos.distanceTo(p)<a.r+room*.5);
 }
 function addRocks(){
  for(let n=0,tries=0;n<ROCKS.count&&tries<4000;tries++){
   const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*ROCKS.radius,s=55+Math.pow(rnd(),2)*210;
   const p=new V3(Math.cos(a)*d,between(-350,350),Math.sin(a)*d);
   if(!free(p,s+ROCKS.clear))continue;
   const m=new THREE.Mesh(rockGeos[Math.floor(rnd()*rockGeos.length)],rockMat);
   m.position.copy(p);m.scale.set(s,s*(.75+rnd()*.4),s*(.8+rnd()*.3));m.rotation.set(rnd()*6,rnd()*6,rnd()*6);scene.add(m);
   const rock={mesh:m,pos:m.position,r:s*1.02,spin:new V3(rnd()-.5,rnd()-.5,rnd()-.5).multiplyScalar(.05),field:true};
   asteroids.push(rock);added.push(rock);n++;
  }
 }
 function addMines(){
  for(let n=0,tries=0;n<MINES.count&&tries<3000;tries++){
   const p=new V3(between(-MINES.width,MINES.width),between(-220,220),between(MINES.band[0],MINES.band[1]));
   if(!free(p,450))continue;
   const m=mines.find(x=>!x.active);if(!m)break;
   m.active=true;m.obj.visible=true;m.team='x';m.owner=null;m.dmg=MINES.dmg;m.trig=MINES.trigger;m.life=1e9;m.armT=0;m.field=true;
   m.pos.copy(p);m.vel.set(rnd()-.5,0,rnd()-.5).multiplyScalar(4);
   fieldMines.push(m);obstacles.push({pos:m.pos,r:MINES.trigger+40,mine:m});n++;
  }
 }
 function addWell(){
  let p=null;
  for(let i=0;i<60&&!p;i++){const c=new V3((rnd()<.5?-1:1)*between(1500,2600),0,between(-900,900));if(free(c,1100))p=c;}
  p=p||new V3(2200,0,0);
  const g=new THREE.Group();g.position.copy(p);
  const dark=new THREE.MeshBasicMaterial({color:0x000000}),ring=new THREE.MeshStandardMaterial({color:0xff9a4a,emissive:0xff6a1f,emissiveIntensity:1.4,roughness:.6}),halo=new THREE.MeshStandardMaterial({color:0x6a3a7a,emissive:0x40205a,emissiveIntensity:.9,transparent:true,opacity:.35,roughness:1});
  g.add(new THREE.Mesh(new THREE.SphereGeometry(WELL.core,32,16),dark));
  const r1=new THREE.Mesh(new THREE.TorusGeometry(WELL.core*1.8,26,8,64),ring);r1.rotation.x=Math.PI/2*.88;g.add(r1);
  const r2=new THREE.Mesh(new THREE.TorusGeometry(WELL.core*2.7,60,6,64),halo);r2.rotation.x=Math.PI/2*.9;g.add(r2);
  const light=new THREE.PointLight(0xff7a33,900,4200);g.add(light);
  scene.add(g);
  well={mesh:g,pos:g.position,r:WELL.core,avoid:WELL.avoid,spin:new V3(0,.12,0),field:true,well:true,mats:[dark,ring,halo]};
  asteroids.push(well);added.push(well);
 }
 // Openings move the hostiles (and, running hot, knock the fleet about) after the fleet controller has placed them.
 function stage(opening,{player,allies,placeShip}){
  const foes=ships.filter(s=>s.team==='e'&&s.alive),P=player,fwd=P.fwd,right=new V3(-fwd.z,0,fwd.x);
  const at=(along,side,y=0)=>P.pos.clone().addScaledVector(fwd,along).addScaledVector(right,side).setY(P.pos.y+y);
  const facing=(from)=>Math.atan2(-(P.pos.x-from.x),-(P.pos.z-from.z));
  if(opening==='ambush'){
   foes.forEach((s,i)=>{const side=(i%2?1:-1)*(250+i*380);placeShip(s,at(-(2300+i*220),side,between(-80,80)),P.yaw);});
   line='Contacts astern · they came out of our jump wake';
  }
  if(opening==='close'){
   const side=rnd()<.5?1:-1;
   foes.forEach((s,i)=>placeShip(s,at(i*380-200,side*(1450+i*420),between(-60,60)),P.yaw+Math.PI));
   line='Close quarters · hostiles on the '+(side>0?'starboard':'port')+' beam';
  }
  if(opening==='pincer'){
   const spots=[[2600,0],[-2500,300],[200,2500],[-300,-2600]];
   foes.forEach((s,i)=>{const [a,b]=spots[i%spots.length],p=at(a,b,between(-90,90));placeShip(s,p,facing(p));});
   line='Hostiles ahead and astern · we are surrounded';
  }
  if(opening==='hot'){
   for(const s of [P,...allies.filter(a=>!a.friend)]){
    s.sh=s.sh.map(v=>Math.round(v*.4));
    s.sub.engines=Math.min(s.sub.engines,Math.round(between(55,70)));s.sub.reactor=Math.min(s.sub.reactor,Math.round(between(60,75)));
   }
   line='Running hot · shields at forty percent, engines and reactor damaged';
  }
  if(opening==='relief'){
   const picket=allies.find(a=>a.picket);
   if(picket)for(const s of foes)s.target=picket;
   if(picket)line=picket.name+' under fire · get in there';
  }
 }
 function begin(encounter,ctx){
  clear();spec=encounter||{};cond=spec.condition||null;line='';
  rnd=mulberry(seedOf(String(spec.id||'')+':battle'));
  if(spec.opening&&!spec.boss)stage(spec.opening,ctx);
  if(cond==='rocks')addRocks();
  if(cond==='mines')addMines();
  if(cond==='gravity')addWell();
  if(cond==='nebula'||cond==='ion'){savedFog=scene.fog;scene.fog=new THREE.FogExp2(cond==='nebula'?NEBULA.color:0x23355a,cond==='nebula'?NEBULA.fog:.00006);}
  surgeT=between(...ION.every);warned=false;sparkT=0;
  return cond;
 }
 function tick(dt,player){
  if(!cond)return;
  if(cond==='ion'){
   surgeT-=dt;sparkT-=dt;
   // the storm flickers around the flagship; a surge is called out before it lands
   if(sparkT<=0&&player){sparkT=between(.5,1.8);const p=player.pos.clone().add(new V3(between(-2600,2600),between(-500,700),between(-2600,2600)));flash(p,between(500,1100),1.1,1.6,3.2,.22);}
   if(!warned&&surgeT<=ION.warn){warned=true;showMsg('Ion surge building',2.2,true);Sfx?.alarm?.();}
   if(surgeT<=0){
    surgeT=between(...ION.every);warned=false;
    for(const s of ships)if(s.alive&&!s.civilian)s.sh=s.sh.map(v=>v*(1-ION.loss));
    if(player)flash(player.pos,2600,1.4,2,4,.45);
    showMsg('Ion surge · shields stripped',2,true);
   }
  }
  if(well){
   // the well drags every ship in (the convoy and fixed stations hold their course); its core burns
   for(const s of ships){
    if(!s.alive||s.civilian||s.post)continue;
    const dx=well.pos.x-s.pos.x,dy=well.pos.y-s.pos.y,dz=well.pos.z-s.pos.z,d=Math.hypot(dx,dy,dz)||1;
    const v=Math.min(WELL.maxPull,WELL.pull*WELL.ref/Math.max(d,WELL.core));
    s.pos.x+=dx/d*v*dt;s.pos.y+=dy/d*v*dt;s.pos.z+=dz/d*v*dt;
    if(d<WELL.core*2.2)damage(s,WELL.burn*dt,'shell',well.pos.clone().applyMatrix4(s.inv),null);
   }
  }
 }
 function clear(){
  for(const a of added){const i=asteroids.indexOf(a);if(i>=0)asteroids.splice(i,1);scene.remove(a.mesh);}
  if(well){for(const c of well.mesh.children)c.geometry?.dispose();for(const m of well.mats)m.dispose();}
  for(const m of fieldMines){m.active=false;m.obj.visible=false;m.field=false;}
  obstacles.length=0;added=[];fieldMines=[];well=null;
  if(savedFog!==null){scene.fog=savedFog;savedFog=null;}
  cond=null;spec=null;line='';
 }
 return {begin,tick,clear,stage,
  get condition(){return cond},get openingLine(){return line},
  get regen(){return cond==='ion'?ION.regen:1},
  get sensor(){return cond==='nebula'?NEBULA.sensor:Infinity},
  // gunnery falls off beyond sensor range in a nebula
  scatter(d){return cond==='nebula'&&d>NEBULA.sensor?NEBULA.scatter:1},
  get well(){return well},get surgeIn(){return cond==='ion'?surgeT:null},get mineCount(){return fieldMines.filter(m=>m.active).length},get rockCount(){return added.filter(a=>!a.well).length}};
}
root.BroadsideConditions=Object.freeze({create,ION,NEBULA,ROCKS,MINES,WELL});
})(typeof window!=='undefined'?window:globalThis);

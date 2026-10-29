(function(root){'use strict';
// The bridge in a campaign battle: the five officers' commands (keys 5–9), their reports and incoming hails, and
// casualties when the bridge takes a hit (crew/casualties.js). Each officer's `cmd` names the command they give:
// a regular's own, a recruit's, or, for a replacement, the command that goes with the post.
const P=root.BroadsidePersonnel;
if(!P)return;
function create({player,enemy,getTarget,showMsg,facings,levels,crew,world,wounds}){
 const CREW=crew&&crew.length?crew:P.crew,W=world||{},K=root.BroadsideCasualties,HURT=K?K.RULES.wounded:{strength:1,cooldown:1};
 const cooldown=Object.fromEntries(CREW.map(o=>[o.id,0])),uses=Object.fromEntries(CREW.map(o=>[o.id,0]));
 // Serving wounded: officers who came aboard wounded, and anyone wounded in this battle. Down: commands out (Infinity: killed).
 const hurt=new Set(wounds||[]),down={},casualties=[];
 const X=root.BroadsideExperience,rank=id=>(levels&&levels[id])||1;
 const str=id=>(X?X.scale(rank(id)).strength:1)*(hurt.has(id)?HURT.strength:1),cdn=id=>(X?X.scale(rank(id)).cooldown:1)*(hurt.has(id)?HURT.cooldown:1);
 const active={target:0,evasion:0,targetK:1,evasionK:1};
 const targetEnemy=()=>getTarget?.()||enemy;
 let reportTime=0,refresh=0,ended=false;
 const deck=document.getElementById('bridge-orders'),comms=document.getElementById('bridge-comms');
 let statusNodes={};
 const officer=id=>CREW.find(c=>c.id===id)||CREW.find(c=>c.slot===id||c.cmd===id);
 function report(id,line){const o=officer(id)||CREW[0];
  if(!comms)return;
  comms.innerHTML=P.portrait(o)+'<div><strong>'+o.short.toUpperCase()+' // '+o.post.toUpperCase()+'</strong><div class="line"></div></div>';
  comms.querySelector('.line').textContent=line;
  comms.classList.add('on');
  reportTime=5.5;}
 function refreshDeck(){for(const o of CREW){const b=statusNodes[o.id];
  if(!b)continue;
  const busy=cooldown[o.id]>0,out=down[o.id]>0;
  b.button.disabled=ended||!player.alive||busy||out;
  b.button.classList.toggle('down',out);b.button.classList.toggle('hurt',hurt.has(o.id)&&!out);
  b.timer.textContent=down[o.id]===Infinity?'KILLED':out?'MEDICS '+Math.ceil(down[o.id])+'s':busy?Math.ceil(cooldown[o.id])+'s':hurt.has(o.id)?'WOUNDED · READY':'READY';}}
 function mount(){deck.hidden=false;
  comms.hidden=false;
  deck.innerHTML='<div class="order-title">BRIDGE COMMANDS / 5–9</div>';
  statusNodes={};
  for(const o of CREW){const b=document.createElement('button');
   b.type='button';
   b.className='order';
   b.setAttribute('aria-label',(X?X.displayName(o,rank(o.id)):o.name)+': '+o.ability+'. '+o.effect);
   b.innerHTML=P.portrait(o)+'<span class="order-text"><b>'+o.ability+'</b><small></small></span><kbd>'+o.key+'</kbd>';
   b.addEventListener('click',()=>activate(o.id));
   deck.append(b);
   statusNodes[o.id]={button:b,timer:b.querySelector('small')};}
  refreshDeck();}
 function activate(id){const o=CREW.find(p=>p.id===id);
  if(!o||ended||!player.alive||cooldown[id]>0||down[id]>0)return false;
  const cmd=o.cmd||o.id;
  if(cmd==='varro'){let restored=0;
   for(let i=0;i<4;i++){const b=player.sh[i];
    player.sh[i]=Math.min(player.cap[i],b+player.C.shield*.16*str(id));
    restored+=player.sh[i]-b;}
   if(restored<1){report(id,'Shields at capacity. Holding reserve power.');
    return false;}}
  else if(cmd==='okoye'){if(!targetEnemy().alive)return false;
   active.target=o.duration;active.targetK=1+.12*str(id);}
  else if(cmd==='vale'){const k=Object.keys(player.sub).sort((a,b)=>player.sub[a]-player.sub[b])[0];
   if(!k||(player.sub[k]>=99.5&&!player.fires.length)){report(id,'No repairs needed. Engineering standing by.');
    return false;}
   player.sub[k]=Math.min(100,player.sub[k]+24*str(id));
   if(player.fires.length)player.fires.shift();}
  else if(cmd==='sato'){active.evasion=o.duration;active.evasionK=1-.22*str(id);}
  else if(cmd==='adeyemi'){const max=player.maxHull||player.C.hull;
   if(player.hull>=max-1&&Object.values(player.sub).every(v=>v>=99.5)){report(id,'Hull and systems are holding. Saving the crews for when we need them.');
    return false;}
   player.hull=Math.min(max,player.hull+player.C.hull*.06*str(id));
   for(const k of Object.keys(player.sub))player.sub[k]=Math.min(100,player.sub[k]+10*str(id));}
  else if(cmd==='fenn'){let n=0;
   for(const g of player.groups){if(g.charge!=null&&g.charge<1){g.charge=1;
     n++;}
    if(g.tubesT)for(let i=0;i<g.tubesT.length;i++)if(g.tubesT[i]>0){g.tubesT[i]=0;
     n++;}}
   if(!n){report(id,'Every gun is already loaded.');
    return false;}}
  else if(cmd==='osei'){const max=player.maxHull||player.C.hull;
   if(player.hull>=max-1){report(id,'The hull is sound. Nothing to patch.');
    return false;}
   player.hull=Math.min(max,player.hull+player.C.hull*.12*str(id));}
  else if(cmd==='marlow'){player.abFuel=1;
   player.abLock=false;
   player.sub.engines=Math.min(100,player.sub.engines+30*str(id));}
  else if(cmd==='achterberg'){let n=0;
   for(const t of W.torps||[])if(t.active&&t.team!==player.team&&t.target&&t.target.team===player.team){t.target=null;
    t.life=Math.min(t.life,3);
    n++;}
   if(!n){report(id,'No hostile guidance signals to jam.');
    return false;}
   report(id,'Jammed '+n+(n===1?' warhead':' warheads')+'. They are flying blind.');}
  else if(cmd==='renn'){if(!targetEnemy().alive)return false;
   let f=0,min=Infinity;
   for(let i=0;i<4;i++){const v=targetEnemy().sh[i]/Math.max(1,targetEnemy().cap[i]);
    if(v<min){min=v;
     f=i;}}
   const k=Object.keys(targetEnemy().sub).sort((a,b)=>targetEnemy().sub[a]-targetEnemy().sub[b])[0];
   report(id,facings[f]+' shield weakest ('+Math.round(min*100)+'%). '+k+' integrity '+Math.round(targetEnemy().sub[k])+'%.');}
  cooldown[id]=o.cooldown*cdn(id);
  uses[id]++;
  if(cmd!=='renn'&&cmd!=='achterberg')report(id,o.voice);
  showMsg?.(o.ability+' activated',1.6);
  refreshDeck();
  return true;}
 // The bridge takes a hit: one officer on duty is wounded, or killed if they came aboard wounded. Another officer reports it.
 function bridgeHit(random=Math.random){if(ended||!K)return null;
  const k=K.pick(CREW.map(o=>o.id),Object.fromEntries([...hurt].map(id=>[id,true])),[...Object.keys(down),...casualties.map(c=>c.id)],random);   // anyone hit once this battle is spared
  if(!k)return null;
  const o=officer(k.id),by=CREW.find(c=>c.id!==k.id&&!(down[c.id]>0))||o;
  casualties.push(k);
  if(k.severity==='killed'){down[k.id]=Infinity;hurt.delete(k.id);
   report(by.id,'We have lost '+o.short+'. Bridge hit, '+o.post.toLowerCase()+'’s station is gone. Keep fighting, captain.');
   showMsg?.('Bridge hit · '+o.short+' killed',3,true);}
  else{down[k.id]=K.RULES.offline;hurt.add(k.id);
   report(by.id,'Bridge hit! '+o.short+' is down. Medics to the bridge.');
   showMsg?.('Bridge hit · '+o.short+' wounded',3,true);}
  refreshDeck();
  return k;}
 function tick(dt){if(ended)return;
  for(const id of Object.keys(cooldown))cooldown[id]=Math.max(0,cooldown[id]-dt);
  for(const id of Object.keys(down))if(down[id]!==Infinity&&(down[id]-=dt)<=0){delete down[id];report(id,'Patched up and back at my station, captain.');}
  active.target=Math.max(0,active.target-dt);
  active.evasion=Math.max(0,active.evasion-dt);
  if(reportTime>0){reportTime-=dt;
   if(reportTime<=0)comms?.classList.remove('on');}
  refresh-=dt;
  if(refresh<=0){refresh=.25;
   refreshDeck();}}
 function onEnd(){ended=true;
  refreshDeck();}
 function activateByKey(code){const id=CREW.find(o=>'Digit'+o.key===code||'Numpad'+o.key===code)?.id;
  return id?activate(id):false;}
 function incomingHail(n){const c=n&&typeof n==='object'?n:P.commanders[n];
  if(!c||!comms)return;
  comms.innerHTML=P.portrait(c)+'<div><strong>INCOMING // '+c.name.toUpperCase()+'</strong><div class="line"></div></div>';
  comms.querySelector('.line').textContent=c.line;
  comms.classList.add('on');
  reportTime=7;}
 return{mount,activate,activateByKey,tick,onEnd,report,incomingHail,bridgeHit,
  attackMultiplier:()=>active.target>0?active.targetK:1,defenseMultiplier:()=>active.evasion>0?active.evasionK:1,
  get cooldown(){return{...cooldown}},get uses(){return{...uses}},get active(){return{...active}},get casualties(){return casualties.slice()},get down(){return{...down}}};}
root.BroadsideBridge={create};
})(window);

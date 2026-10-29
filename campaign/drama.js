// Campaign drama: bridge casualties and the fallen, rivals who got away, jump-lane events, and battle honours.
// Part of the campaign page (campaign.html); its scripts share one scope and load in order: core, map, board, shipyard, crew, drama, reports.
// The rules live in crew/casualties.js, crew/rivals.js, crew/events.js and crew/honours.js; this applies them to the save and shows them.
'use strict';
const Casualties=window.BroadsideCasualties,Rivals=window.BroadsideRivals,Events=window.BroadsideEvents,Honours=window.BroadsideHonours;
const isFallen=id=>(state.fallen||[]).some(f=>f.id===id);
const woundOf=id=>(state.wounds||{})[id]||null;
// A post's holder for an effect aimed at it: 'duty' is everyone on duty, 'random' any of them, otherwise the post (regular id).
function postHolders(post){const d=onDuty();return post==='duty'?d:post==='random'?[d[Math.floor(rand()*d.length)]]:d.filter(c=>c.slot===post);}

// ---------------- after a battle ----------------
// Everything a battle result does to the crew, rivals and honours, worked out and saved once (stored on the pending
// result, like the experience award, so a reload shows the same report and cannot repeat it).
function dramaFor(r,ctx){
 if(r.drama)return r.drama;
 const out={casualties:[],recovered:[],rival:null,medals:[],kills:[],bounty:0};
 // Wounds heal with each engagement; then this battle's casualties.
 const h=Casualties.heal(state.wounds);state.wounds=h.wounds;out.recovered=h.recovered.filter(id=>!isFallen(id));
 if((r.casualties||[]).length){
  const who=id=>crewById(id),rankOf=id=>Experience.progress((state.officers||{})[id],id).rank,res=Casualties.apply(state,r.casualties,who,{system:r.system||state.system,mission:ctx.mission,rank:rankOf,battles:id=>((state.officers||{})[id]||{}).battles||0});
  Object.assign(state,{wounds:res.wounds,fallen:res.fallen,replacements:res.replacements,crew:res.crew,hired:res.hired});
  out.casualties=res.report.map(k=>({...k,name:officerName(crewById(k.id)),post:postTitle(crewById(k.id))}));
 }
 // A rival in the fight: a new one, one getting away again, or the score settled.
 if(r.rival){const res=Rivals.record(state.rivals,r.rival,{system:r.system||state.system,mission:ctx.mission,clock:state.attempts});state.rivals=res.rivals;
  if(res.event){out.rival={type:res.event.type,id:res.event.rival.id,upgrade:res.event.upgrade||null};
   if(res.event.type==='slain'){out.bounty=Rivals.RULES.settle;state.credits+=out.bounty;state.contracts=state.contracts.filter(c=>c.rivalId!==res.event.rival.id);}}}
 // Medals, kill marks and each ship's service record.
 if(r.honours&&r.ships){const f=flag(),res=Honours.apply(state.medals,state.ships,r.honours,r.ships,{mission:ctx.mission,system:r.system||state.system,flag:state.flag,shipName:f.shipName});
  state.medals=res.medals;state.ships=res.ships;out.medals=res.earned;
  out.kills=r.ships.filter(s=>s.kills&&s.kills.length).map(s=>({ship:(state.ships.find(x=>x.id===s.id)||{}).shipName||'',kills:s.kills}));}
 state.lastLoss=r.outcome!=='win';r.drama=out;persist();return out;}
function rivalCard(rv,kicker,text){return `<div class="commander-brief rivalcard">${Personnel.portrait({name:rv.name,faction:rv.faction,asset:rv.asset||undefined})}<div><small>${kicker}</small><b>${esc(rv.name)}</b><p>${text}</p></div></div>`;}
function upgradeText(rv,u){if(!u)return '';const [k,f]=u.split(':');return Rivals.UPGRADES[k]?' '+Rivals.UPGRADES[k].note({...rv},Number(f)):'';}
function dramaHtml(d){if(!d)return '';let h='';
 if(d.casualties.length||d.recovered.length){h+=`<div class="notes casualties"><small>BRIDGE CASUALTIES</small>${d.casualties.map(k=>{const o=crewById(k.id),rep=k.replacement&&crewById(k.replacement);
   return k.severity==='killed'?`<div class="kia">${Personnel.portrait(o,'fallen')}<span><b>${esc(k.name)}</b> was killed when the bridge was hit. ${rep?`Navy Command has posted <b>${esc(officerName(rep))}</b> to the ${esc(k.post.toLowerCase())}’s station.`:`The ${esc(k.post.toLowerCase())}’s station passes back to its regular officer.`}</span></div>`
    :`<div>${Personnel.portrait(o)}<span><b>${esc(k.name)}</b> was wounded on the bridge. Serving wounded: the command works at ${Math.round(Casualties.RULES.wounded.strength*100)}% until healed, in ${Casualties.RULES.heal} engagements or at a starbase sickbay. Hit again while wounded, ${esc(o.short||o.name)} will not survive.</span></div>`;}).join('')}${d.recovered.map(id=>`<div><span><b>${esc(officerName(crewById(id)))}</b> has recovered and is back to full strength.</span></div>`).join('')}</div>`;}
 if(d.rival){const rv=(state.rivals||[]).find(x=>x.id===d.rival.id);if(rv){
  if(d.rival.type==='new')h+=rivalCard(rv,'RIVAL · GOT AWAY',`Jumped out before you could finish the job. ${esc(rv.name.split(' ').pop())} will be back, refitted against how you fought today.${upgradeText(rv,d.rival.upgrade)} Watch the lanes in ${esc(rv.faction)} space, and the starbase boards for a wanted poster.`);
  else if(d.rival.type==='again')h+=rivalCard(rv,`RIVAL · GOT AWAY AGAIN · ${rv.meetings} MEETINGS`,`Slipped away again.${upgradeText(rv,d.rival.upgrade)}`);
  else if(d.rival.type==='slain')h+=rivalCard(rv,'RIVAL · SCORE SETTLED',`Destroyed after ${rv.meetings} meetings. Every station in the Reach will hear of it. <b>+${d.bounty} requisition</b> from the bounty on the rival’s head.`);
  else if(d.rival.type==='gloat')h+=rivalCard(rv,'RIVAL · STILL AT LARGE',`Beat you this time, and will come looking for you again.`);}}
 if(d.medals.length||d.kills.length){h+=`<div class="trophy honours"><small>BATTLE HONOURS</small>${d.medals.map(id=>{const m=Honours.byId[id];return `<div class="medal">${ribbon(m)}<span><b>${m.name}</b> · ${m.text}</span></div>`;}).join('')}${d.kills.map(k=>`<span>${killMarks(k.kills.length)} <b>${esc(k.ship)}</b>: ${k.kills.map(x=>esc(x.name)).join(', ')}</span>`).join('')}</div>`;}
 return h;}
const ribbon=m=>`<i class="ribbon" title="${esc(m.name)}" style="background:linear-gradient(90deg,${m.ribbon[1]} 0 18%,${m.ribbon[0]} 18% 82%,${m.ribbon[1]} 82%)"></i>`;
// Kill marks as a tally: four strokes and a bar struck through them for every five.
function killMarks(n){const g=[];for(let i=0;i<n;i+=5){const k=Math.min(5,n-i);g.push(`<span class="tg">${'<i class="tally"></i>'.repeat(Math.min(k,4))}${k===5?'<i class="tally bar"></i>':''}</span>`);}return `<span class="tallies" role="img" aria-label="${n} ${n===1?'kill':'kills'}">${g.join('')}</span>`;}

// ---------------- rivals on the map ----------------
// A ready rival may be waiting on the route, as an ambush that can be fought or fled like any other.
function rivalAmbush(rv,at,dest){state.interceptSeed++;state.ambush={x:Rivals.encounterSrc(rv,at,act(),'intercept'),dest};persist();showAmbush();}
function rivalsHtml(){const list=state.rivals||[];if(!list.length)return '';
 return `<h3 class="ih">Rivals</h3><div class="rivals">${list.map(r=>`<div class="foe${r.status==='dead'?' dead':''}">${Personnel.portrait({name:r.name,faction:r.faction,asset:r.asset||undefined},r.status==='dead'?'fallen':'')}<div><b>${esc(r.name)}</b><small>${esc(r.faction)} · ${r.status==='dead'?`destroyed at ${esc(byId[r.killed&&r.killed.system]?.name||'')}`:`at large · last seen at ${esc(r.lastSystem)}`}</small><span class="k">Met ${r.meetings} · got away ${r.escapes}${r.upgrades.length?' · refits: '+r.upgrades.length:''}</span></div></div>`).join('')}</div>`;}

// ---------------- jump-lane events ----------------
// What an event can see of the journey: where it ends, the act, the crew and the fleet.
function eventCtx(dest){const s=byId[dest];return {act:Math.min(act(),3),sys:s,region:s.region,faction:s.faction,hostile:Campaign.hostile(s,Math.min(act(),3)),lastLoss:!!state.lastLoss,wounded:Object.keys(state.wounds||{}).length,rival:(Rivals.atLarge(state.rivals)[0]||{}).name||null,torps:torpStock(flag()).cap>0,credits:state.credits};}
function eventWords(at){return {system:byId[at].name,ship:esc(flag().shipName),rival:esc((Rivals.atLarge(state.rivals)[0]||{}).name||'')};}
function showLaneEvent(){const L=state.laneEvent,e=L&&Events.byId[L.id];if(!e){state.laneEvent=null;persist();return;}const w=eventWords(L.at);setView('map');selectSystem(L.at);
 const hints=e.choices.filter(c=>c.hint);
 openModal(e.title,'ON THE LANE / '+byId[L.at].name.toUpperCase(),`<p>${Events.fill(e.text,w)}</p>${hints.length?`<div class="notes"><small>THE OPTIONS</small>${hints.map(c=>`<div><b>${esc(c.label)}</b> · ${esc(c.hint)}</div>`).join('')}</div>`:''}${flagshipLine()}`,e.choices.map((c,i)=>({label:c.label,disabled:!!c.cost&&state.credits<c.cost,run:()=>chooseLaneEvent(i)})),{locked:true});
 e.choices.forEach((c,i)=>{const b=$('modalactions').children[i];if(b&&c.hint)b.title=c.hint;});}
function chooseLaneEvent(i){const L=state.laneEvent,e=L&&Events.byId[L.id];if(!e)return;const o=Events.resolve(e,i,rand),w=eventWords(L.at);state.laneEvent=null;
 const notes=applyFx(o.fx,L.at),battle=o.fx.battle?laneBattle(o.fx.battle,L.at,w):null;persist();refresh();
 openModal(e.title,'ON THE LANE / '+byId[L.at].name.toUpperCase(),`<p>${Events.fill(o.text,w)}</p>${notes.length?`<div class="notes"><small>WHAT IT COST, AND WHAT IT GAVE</small>${notes.map(n=>`<div>${n}</div>`).join('')}</div>`:''}`,
  battle?[{label:'Battle stations',primary:true,run:()=>launch(Campaign.encounter(battle,cctx()))}]:[{label:'Continue',primary:true,run:()=>{closeModal();showArrival(L.at,L.from,getPath(L.from,L.at).length-1);}}],{locked:!!battle});}
// A trap sprung on the lane: an interception at the destination, written up by the event.
function laneBattle(b,at,w){state.interceptSeed++;const x=Campaign.interception(at,act(),state.interceptSeed);x.name=Events.fill(b.name,w);x.brief=Events.fill(b.brief,w);
 if(b.weak){x.enemies=[{...x.enemies[0],hull:Math.round(x.enemies[0].hull*60)/100,shield:Math.round(x.enemies[0].shield*70)/100}];x.objective=`Destroy ${x.enemies[0].name}.`;x.intel='A lone scavenger, light and fast.';}
 state.ambush={x,dest:null,event:true};return x;}
const pct=v=>Math.round(Math.abs(v)*100)+'%';
// An event's effects on the save. Returns a line for each, for the outcome card.
function applyFx(fx,at){const n=[],f=flag(),near=()=>Campaign.nearestStation(at);
 if(fx.credits){state.credits=Math.max(0,state.credits+fx.credits);n.push(`${fx.credits>0?'+':'−'}${Math.abs(fx.credits)} requisition`);}
 if(fx.hull){f.hull=Math.max(.25,Math.min(1,(f.hull??1)+fx.hull));n.push(`${esc(f.shipName)} hull ${fx.hull>0?'+':'−'}${pct(fx.hull)}, now ${Math.round(f.hull*100)}%`);}
 if(fx.fleetHull){for(const s of deployedShips())s.hull=Math.max(.25,Math.min(1,(s.hull??1)+fx.fleetHull));n.push(`Every ship flying patched by ${pct(fx.fleetHull)} hull`);}
 if(fx.torps){const t=torpStock(f);if(t.cap){f.torps=fx.torps==='full'?t.cap:Math.min(t.cap,t.have+fx.torps);n.push(`${esc(f.shipName)}: ${f.torps} of ${t.cap} torpedoes`);}}
 if(fx.fleetTorps){for(const s of deployedShips()){const t=torpStock(s);if(t.cap)s.torps=t.cap;}n.push('Torpedo magazines full');}
 if(fx.repair){f.sub=null;n.push(`${esc(f.shipName)}: every subsystem repaired`);}
 if(fx.sub){const sub={engines:100,shields:100,reactor:100,port:100,stbd:100,fore:100,torp:100,...(f.sub||{})};for(const [k,d] of Object.entries(fx.sub)){sub[k]=Math.max(0,Math.min(100,(sub[k]??100)+d));n.push(`${k[0].toUpperCase()+k.slice(1)} ${d>0?'+':'−'}${Math.abs(d)} integrity`);}f.sub=sub;}
 if(fx.rep){const st=fx.rep[0]==='near'?near():fx.rep[0];if(STATIONS[st]){state.rep=Campaign.adjustRep(state.rep,st,fx.rep[1]);n.push(`${STATIONS[st].name} ${fx.rep[1]>0?'+':''}${fx.rep[1]} standing`);}}
 if(fx.front){const reg=byId[at].region;if(reg in Campaign.FRONTS){state.fronts={...state.fronts,[reg]:Math.max(-10,Math.min(10,(state.fronts[reg]??Campaign.FRONTS[reg].start)+fx.front))};n.push(`${reg} front ${fx.front>0?'gains':'loses'} ground`);}}
 if(fx.xp){const [post,x]=fx.xp;for(const c of postHolders(post)){const r=(state.officers||{})[c.id]||{xp:0,battles:0,uses:0};state.officers={...state.officers,[c.id]:{...r,xp:(r.xp||0)+x}};n.push(`${esc(officerName(c))} +${x} XP`);}}
 if(fx.wound){const pool=postHolders(fx.wound==='random'?'duty':fx.wound).filter(c=>!woundOf(c.id)),c=fx.wound==='random'?pool[Math.floor(rand()*pool.length)]:pool[0];
  if(c){state.wounds={...state.wounds,[c.id]:{battles:0,at,mission:'On the lane'}};n.push(`${esc(officerName(c))} wounded: serving at reduced strength until healed`);}}
 if(fx.heal){const k=Object.keys(state.wounds||{});state.wounds={};if(k.length)n.push(`${k.length===1?'One officer':k.length+' officers'} healed`);}
 if(fx.rival){const r=Rivals.atLarge(state.rivals)[0];if(r){state.rivals=state.rivals.map(x=>x.id===r.id?{...x,readyAt:state.attempts}:x);n.push(`${esc(r.name)} last seen at ${esc(r.lastSystem)}. Expect a meeting soon`);}}
 return n;}

// ---------------- officers: wounds, treatment and the fallen ----------------
function treat(id){const cost=price(Casualties.RULES.treat);if(!docked()||!woundOf(id)||state.credits<cost)return;state.credits-=cost;const w={...state.wounds};delete w[id];state.wounds=w;persist();refresh();renderCrew();toast(`${officerName(crewById(id))} treated in the sickbay and back to full strength.`);}
function fallenHtml(){const list=state.fallen||[];if(!list.length)return '';return `<h3 class="ih">The fallen</h3><div class="notes fallen">${list.map(f=>`<div><b>${esc(f.rank?f.rank+' ':'')}${esc(f.name)}</b> · ${esc(f.mission||'')}${f.system&&byId[f.system]?`, ${esc(byId[f.system].name)}`:''} · ${f.battles} ${f.battles===1?'engagement':'engagements'}</div>`).join('')}</div>`;}

// ---------------- honours: service records and paint ----------------
function medalsHtml(){const m=state.medals||{},got=Honours.MEDALS.filter(x=>m[x.id]);
 return `<h3 class="ih">Battle honours</h3>${got.length?`<div class="medals">${got.map(x=>`<div class="medal">${ribbon(x)}<span><b>${x.name}</b>${m[x.id].n>1?` ×${m[x.id].n}`:''} · ${x.text}${m[x.id].first?` First won by ${esc(m[x.id].first.ship||'')} at ${esc(byId[m[x.id].first.system]?.name||'')}.`:''}</span></div>`).join('')}</div>`:'<p>No medals yet. They are won in battle, for feats like finishing a fight with barely a scratch, or barely a hull.</p>'}<p class="dim">${Honours.MEDALS.length-got.length} more to win.${Honours.PAINTS.length>paintsOpen().length?' Some unlock paint schemes in the shipyard.':''}</p>`;}
const paintsOpen=()=>Honours.paints(state.medals||{});
function serviceRecord(r){const s={battles:0,wins:0,dealt:0,disabled:0,...(r.service||{})},kills=r.kills||[],named=kills.slice(-8).reverse(),hon=(r.honours||[]).map(id=>Honours.byId[id]).filter(Boolean);
 openModal(`${r.shipName} · service record`,`${HULLS[r.ship].cls.toUpperCase()} / ${roleOf(r).toUpperCase()}`,`<div class="record"><div><span class="k">Engagements</span><b>${s.battles}</b></div><div><span class="k">Victories</span><b>${s.wins}</b></div><div><span class="k">Kills</span><b>${kills.length}</b></div><div><span class="k">Damage dealt</span><b>${s.dealt.toLocaleString('en-GB')}</b></div><div><span class="k">Times disabled</span><b>${s.disabled}</b></div></div>
  ${kills.length?`<div class="notes"><small>KILL MARKS</small><div>${killMarks(kills.length)}</div>${named.length?named.map(k=>`<div>${k.boss?'<b>Finale</b> · ':k.rival?'<b>Rival</b> · ':''}${esc(k.name)}${k.at&&byId[k.at]?` · ${esc(byId[k.at].name)}`:''}</div>`).join(''):''}</div>`:'<p>No kills yet.</p>'}
  ${hon.length?`<div class="trophy honours"><small>HONOURS WON AS FLAGSHIP</small>${hon.map(m=>`<div class="medal">${ribbon(m)}<span><b>${m.name}</b></span></div>`).join('')}</div>`:''}
  <p>Paint: <b>${(Honours.paintById[r.paint]||Honours.PAINTS[0]).name}</b>.</p>`,[{label:'Close',primary:true,run:close}],{wide:true});}
function paintShop(r){const open=new Set(paintsOpen().map(p=>p.id)),cur=r.paint||'navy';
 openModal(`Paint ${r.shipName}`,'SHIPYARD / PAINT AND MARKINGS',`<p>A paint scheme shows in battle and in the yard. New schemes are unlocked by battle honours anywhere in the fleet.</p>${Honours.PAINTS.map(p=>{const ok=open.has(p.id),sw=p.tint?`rgb(${p.tint.map(v=>Math.round(Math.min(1,v*.55)*255)).join(',')})`:'#6c7480';return `<button type="button" class="choice paint" data-paint="${p.id}" ${ok?'':'disabled'}><span class="swatch" style="background:${sw}"></span><span><b>${p.name}${p.id===cur?' · current':''}</b><br><small>${ok?(p.medal?`Unlocked by ${Honours.byId[p.medal].name}`:'Standard issue'):`Win ${Honours.byId[p.medal].name}: ${Honours.byId[p.medal].text}`}</small></span></button>`;}).join('')}`,[{label:'Close',run:close}]);
 for(const b of $('modalbody').querySelectorAll('[data-paint]'))b.addEventListener('click',()=>{r.paint=b.dataset.paint==='navy'?undefined:b.dataset.paint;persist();close();renderYard();toast(`${r.shipName} repainted: ${Honours.paintById[b.dataset.paint].name}.`);});}

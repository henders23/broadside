// The shipyard: the fleet column, slots and upgrades for the selected ship, and dockyard services.
// Part of the campaign page (campaign.html); its scripts share one scope and load in order: core, map, board, shipyard, crew, reports.
'use strict';
// Shipyard: the flagship side-on, its seven systems as slots, upgrades for each, and the dockyard's repair services.
// Stats, starboard hardpoints and hull/shield ellipsoids per hull, from the battle page's own ship table (crew/ships.js).
const HULLS=Object.fromEntries(window.BroadsideShips.PLAYABLE.map(k=>[k,window.BroadsideShips.shipyardHull(k)]));
const Upgrades=window.BroadsideUpgrades;
const SLOT_ICON={hull:'M3 14 L6 9 L18 9 L21 14 L18 17 L6 17 Z',shields:'M12 3 L20 6 V12 C20 16.5 16.5 19.5 12 21 C7.5 19.5 4 16.5 4 12 V6 Z',reactor:'M13 3 L6 13 H11 L10 21 L18 10 H13 Z',engines:'M4 12 H14 M14 8 L20 12 L14 16 M4 8 H9 M4 16 H9',broadside:'M4 8 H16 M4 12 H20 M4 16 H16',fore:'M5 16 H19 M8 16 V12 H16 V16 M12 12 V6 H19',torp:'M3 12 H17 L21 12 L17 9 M17 15 L21 12 M6 9 V15'};
const SHIP_BOX=[250,60],SLOT_X=[78,196,12],SLOT_TOP=430;
let yardFocus='broadside',yardLayout=null,shipViewTimer=0;
const n1=v=>String(Math.round(v*10)/10),num=v=>Math.round(v).toLocaleString('en-GB');
function owned(){return Upgrades.owned(yardShip().upgrades);}
function shipStats(){const H=HULLS[yardShip().ship]||HULLS.bastion;return Upgrades.apply(H,yardShip().upgrades);}
function torpStock(r=yardShip()){const cap=Upgrades.torpedoCap(TORPEDO_CAP[r.ship]??8,r.upgrades);return {cap,have:r.torps==null?cap:Math.max(0,Math.min(cap,r.torps))};}
// A one-line summary of any weapon, for the slot spec.
function weaponSpec(w,t){
 if(w.type==='lance')return `Fires dead ahead · ${w.dps} damage a second for ${w.dur} s · ${n1(w.chargeT)} s charge · range ${num(w.range)}`;
 if(w.type==='beam')return `${w.n} beam emitters · ${w.dps} damage a second for ${w.dur} s · ${n1(w.chargeT)} s charge · range ${num(w.range)}`;
 if(w.type==='missile')return `Salvo of ${w.salvo} missiles · ${w.dmg} damage each · ${n1(w.reload)} s reload · range ${num(w.range)}`;
 if(w.type==='mine')return `${w.tubes} mine tubes · ${w.ammo} mines · ${w.dmg} damage · ${n1(w.reload)} s reload`;
 if(w.type==='torpedo')return `${w.tubes} tubes · ${t.have} of ${t.cap} torpedoes · ${w.dmg} damage · ${n1(w.reload)} s reload · range ${num(w.range)}`;
 return `${w.n} ${w.sub==='fore'?'guns':'turrets on each beam'} · ${w.dmg} damage × ${w.shots}${w.pellets?` (${w.pellets} pellets)`:''} · ${n1(w.reload)} s reload · range ${num(w.range)}`;}
// The ship's systems as slots: engines, hull, reactor and shields always; weapon slots only for what the hull carries.
function yardSlots(){const H=HULLS[yardShip().ship]||HULLS.bastion,C=shipStats(),W=id=>C.weapons.find(w=>w.sub===id),sub=yardShip().sub||{},hc=H.hullE,sc=H.shieldE,t=torpStock(),c=k=>Math.round(typeof sub[k]==='number'?sub[k]:100);
 const b=W('stbd')||W('port'),f=W('fore'),tp=W('torp');
 const slots=[
  {id:'engines',name:'Engines',kind:'Propulsion',cond:c('engines'),spec:`Top speed ${n1(C.vmax)} · turns ${n1(C.turn)}° a second · afterburner 1.7× for ${C.abBurn||7} s`,pts:H.eng},
  {id:'hull',name:'Hull & armour',kind:'Defence',cond:Math.round((yardShip().hull??1)*100),spec:`${num(C.hull)} hull points`+(C.armour?` · takes ${Math.round(C.armour*100)}% hull damage`:'')+(C.repairRate?' · subsystems repair 50% faster':' · damage carries between operations'),pts:[[0,hc.c[1]-hc.r[1]*.7,hc.r[2]*.25]]},
  {id:'reactor',name:'Reactor',kind:'Power',cond:c('reactor'),spec:`${C.power||12} power pips for engines, shields and weapons`+(C.reactorHardened?' · hardened against damage':' (keys 1–4 in battle)'),pts:[[0,hc.c[1]+hc.r[1]*.2,hc.r[2]*.05]]},
  b&&{id:'broadside',name:H.broadName||'Broadsides',kind:'Weapons',cond:Math.min(c('port'),c('stbd')),spec:weaponSpec(b,t),pts:H.stbd,mid:true},
  f&&{id:'fore',name:f.label,kind:'Weapons',cond:c('fore'),spec:weaponSpec(f,t),pts:H.forePts},
  {id:'shields',name:'Shields',kind:'Defence',cond:c('shields'),spec:`${num(C.shield)} strength · regenerates ${n1(C.regen)} per second`+(C.shieldHardened?' · hardened emitters':''),pts:[[0,sc.c[1]+sc.r[1]*.8,-sc.r[2]*.6]]},
  tp&&{id:'torp',name:tp.type==='mine'?'Mine layer':'Torpedo bay',kind:'Weapons',cond:c('torp'),spec:weaponSpec(tp,t),pts:H.torpPts}].filter(Boolean);
 for(const s of slots)s.anchor=s.pts[s.mid?Math.floor(s.pts.length/2):0];
 if(!slots.some(s=>s.id===yardFocus))yardFocus=slots.find(s=>s.kind==='Weapons')?.id||'hull';
 // Seen from starboard the stern is on the left, so slots run stern to bow.
 return slots.sort((a,b)=>b.anchor[2]-a.anchor[2]);}
function renderYard(){renderFleetCol();const H=HULLS[yardShip().ship]||HULLS.bastion,slots=yardSlots(),have=owned(),box=$('slots'),cards=$('markcards'),leaders=$('leaders'),marks=$('yardmarks');
 box.replaceChildren();
 slots.forEach(s=>{const on=s.id===yardFocus,b=el('button','slot'+(on?' on':'')),top=el('span','top'),fitted=Upgrades.forSlot(s.id).filter(u=>have.has(u.id)).length;b.type='button';b.setAttribute('aria-pressed',String(on));
  top.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${SLOT_ICON[s.id]}"></path></svg>`;top.append(el('span','tier'+(fitted?' up':''),fitted?`${fitted}/3 FITTED`:'MK I'));
  b.append(top,el('b',null,s.name),el('small',s.cond<50?'bad':s.cond<100?'warn':'',`${s.kind} · ${s.cond}%`));b.addEventListener('click',()=>{yardFocus=s.id;renderYard();});box.append(b);});
 const f=slots.find(s=>s.id===yardFocus);$('markk').textContent='Upgrades for · '+f.name;$('markspec').textContent=f.spec;cards.replaceChildren();
 for(const u of Upgrades.forSlot(f.id)){const got=have.has(u.id),cost=price(u.cost),short=!got&&state.credits<cost,c=el('article','upcard'+(got?' got':'')),btn=el('button',got?'':'buy',got?'Installed':docked()?`Install · ${cost}`:'Dock to install');btn.type='button';btn.disabled=got||short||!docked();if(short)btn.title=`Needs ${cost} requisition`;btn.addEventListener('click',()=>confirmUpgrade(u));
  c.append(el('span','k',got?'Fitted':`Upgrade · ${price(u.cost)} req`),el('b',null,u.name),el('span',null,u.effect),btn);cards.append(c);}
 $('marknote').textContent=docked()?'Upgrades are permanent for this campaign and apply in every operation.':`Upgrades can only be fitted at a starbase. ${dockHint()}`;$('marknote').classList.toggle('yardnote',!docked());{const t=Upgrades.trophies(yardShip().upgrades);if(t.length)$('marknote').textContent+=` Trophies fitted: ${t.map(u=>u.name).join(', ')}.`;}
 renderServices();
 leaders.replaceChildren();for(const m of [...marks.querySelectorAll('i')])m.remove();
 const points=[],rows=[];
 box.style.gridTemplateColumns=`repeat(${slots.length},minmax(0,1fr))`;const sw=(1444-SLOT_X[2]*(slots.length-1))/slots.length;
 slots.forEach((s,i)=>{const on=s.id===yardFocus,x=SLOT_X[0]+sw/2+i*(sw+SLOT_X[2]),line=svgEl('line',{x1:x,y1:SLOT_TOP,x2:x,y2:SLOT_TOP,stroke:on?'rgba(255,214,150,.9)':'rgba(255,255,255,.22)'});leaders.append(line);rows.push({line,idx:points.length});points.push(s.anchor);
  for(const p of s.pts){const m=el('i',on?'on':'');m.style.left='-100px';marks.append(m);rows.push({mark:m,idx:points.length});points.push(p);}});
 const sc=H.shieldE,si=points.length;points.push(sc.c,[sc.c[0],sc.c[1],sc.c[2]+sc.r[2]],[sc.c[0],sc.c[1]+sc.r[1],sc.c[2]]);const ei=points.length;points.push(H.eng[H.eng.length-1]);
 $('shieldline').classList.toggle('on',yardFocus==='shields');yardLayout={points,rows,si,ei};startShipView();}
// Fleet column: the ships, a slot to commission a new hull, and what can be done with the one selected.
function roleOf(r){return r.id===state.flag?'Flagship':r.reserve?'Reserve':'Escort';}
function renderFleetCol(){const list=$('fleetlist'),Y=yardShip();list.replaceChildren();$('fleetn').textContent=`${state.ships.length} of ${Campaign.MAX_FLEET}`;
 for(const r of state.ships){const b=el('button','fship'+(r===Y?' on':'')),role=roleOf(r);b.type='button';b.setAttribute('aria-pressed',String(r===Y));b.append(el('span','tag'+(role==='Flagship'?' flag':role==='Reserve'?' res':''),role.toUpperCase()),el('b',null,r.shipName),el('small',null,`${HULLS[r.ship].cls} · hull ${Math.round((r.hull??1)*100)}%`));b.addEventListener('click',()=>{yardShipId=r.id;renderYard();});list.append(b);}
 if(state.ships.length<Campaign.MAX_FLEET){const b=el('button','fship add','+ Commission a hull');b.type='button';b.disabled=!docked();if(!docked())b.title='Dock at a starbase to buy a ship';b.addEventListener('click',hullMarket);list.append(b);}
 const role=roleOf(Y),acts=$('shipacts');$('shiprole').textContent=role;$('shiprole').style.color=role==='Flagship'?'var(--amber)':'#9fd8ff';$('shipnm').textContent=Y.shipName;$('shipcls').textContent=HULLS[Y.ship].cls;acts.replaceChildren();
 const act=(label,run,{solid,disabled,title}={})=>{const b=el('button',solid?'solid':'',label);b.type='button';b.disabled=!!disabled;if(title)b.title=title;b.addEventListener('click',run);acts.append(b);};
 if(role!=='Flagship')act('Make flagship',()=>makeFlagship(Y),{solid:true});
 act('Rename',()=>renameShip(Y));
 if(role!=='Flagship')act(Y.reserve?'Deploy':'Move to reserve',()=>{Y.reserve=!Y.reserve;persist();renderYard();refresh();toast(Y.reserve?`${Y.shipName} will sit out the next battles.`:`${Y.shipName} will fly as an escort.`);});
 if(role!=='Flagship')act(`Sell · ${Campaign.sellPrice(Y.ship)}`,()=>sellShip(Y),{disabled:!docked(),title:docked()?'':'Dock at a starbase to sell a ship'});}
function hullMarket(){if(!docked()||state.ships.length>=Campaign.MAX_FLEET)return;const st=STATIONS[state.system];
 openModal('Commission a hull',`${st.name.toUpperCase()} / SHIPYARD`,`<p>A new ship joins the fleet as an escort. Escorts fly under the AI in every battle and follow your orders (U focus my target, I defend the flagship, O engage freely). Any ship can be made the flagship.</p>${shipChoices.map(k=>{const H=HULLS[k],p=price(Campaign.HULL_PRICES[k]),short=state.credits<p;return `<button type="button" class="choice" data-k="${k}" ${short?'disabled':''}><span class="hull"><b>${k[0].toUpperCase()+k.slice(1)} · ${H.cls}</b><span>${p.toLocaleString()} req</span></span><small>${H.hull.toLocaleString()} hull · ${H.shield} shields · top speed ${H.vmax}${short?' · needs '+p.toLocaleString()+' requisition':''}</small></button>`;}).join('')}<p>Requisition available: <b>${state.credits.toLocaleString()}</b>.</p>`,[{label:'Cancel',run:close}]);
 for(const b of $('modalbody').querySelectorAll('.choice'))b.addEventListener('click',()=>nameNewShip(b.dataset.k));}
function nameNewShip(k){const p=price(Campaign.HULL_PRICES[k]),name=Campaign.nextShipName(state.ships.map(r=>r.shipName));
 openModal('Name the ship',`NEW ${HULLS[k].cls.toUpperCase()} / ${p.toLocaleString()} REQUISITION`,`<label for="shipNameInput">SHIP NAME</label><input type="text" id="shipNameInput" maxlength="28" value="${esc(name)}">`,[{label:'Back',run:hullMarket},{label:`Commission · ${p.toLocaleString()}`,primary:true,run:()=>buyShip(k,$('shipNameInput').value)}]);$('shipNameInput').select();}
function cleanName(v,fallback){const t=String(v||'').replace(/\s+/g,' ').trim().slice(0,28);return t||fallback;}
function buyShip(k,name){const p=price(Campaign.HULL_PRICES[k]);if(!docked()||state.credits<p||state.ships.length>=Campaign.MAX_FLEET)return;state.credits-=p;const id='s'+(++state.shipSeq),r=newShip(id,k,cleanName(name,Campaign.nextShipName(state.ships.map(x=>x.shipName))));state.ships.push(r);yardShipId=id;persist();close();renderYard();refresh();toast(`${r.shipName} commissioned. She flies as an escort from the next battle.`);}
function renameShip(r){openModal('Rename ship',`${HULLS[r.ship].cls.toUpperCase()} / ${roleOf(r).toUpperCase()}`,`<label for="shipNameInput">SHIP NAME</label><input type="text" id="shipNameInput" maxlength="28" value="${esc(r.shipName)}">`,[{label:'Cancel',run:close},{label:'Rename',primary:true,run:()=>{r.shipName=cleanName($('shipNameInput').value,r.shipName);persist();close();renderYard();refresh();}}]);$('shipNameInput').select();}
function makeFlagship(r){state.flag=r.id;r.reserve=false;persist();renderYard();refresh();toast(`${r.shipName} is now the flagship. You will fly her in battle.`);}
function sellShip(r){if(r.id===state.flag||!docked())return;const p=Campaign.sellPrice(r.ship);
 openModal(`Sell ${r.shipName}?`,'SHIPYARD / DECOMMISSION',`<p>The yard will pay <b>${p.toLocaleString()}</b> requisition for the ${HULLS[r.ship].cls.toLowerCase()}. Her ${r.upgrades.length?r.upgrades.length+' fitted upgrades are':'fittings are'} not refunded.</p>`,[{label:'Keep her',run:close},{label:`Sell · ${p.toLocaleString()}`,primary:true,run:()=>{state.credits+=p;state.ships=state.ships.filter(x=>x!==r);yardShipId=state.flag;persist();close();renderYard();refresh();toast(`${r.shipName} decommissioned for ${p.toLocaleString()} requisition.`);}}]);}
function dockHint(){const n=Campaign.nearestStation(state.system),j=getPath(state.system,n).length-1;return `Nearest: ${STATIONS[n].name}, ${jumpsText(j).toLowerCase()}.`;}
function confirmUpgrade(u){const cost=price(u.cost);if(owned().has(u.id)||state.credits<cost||!docked())return;
 openModal(`Install ${u.name}?`,'REFIT DIVISION / FLAGSHIP UPGRADE',`<p>${u.effect}</p><p>Cost <b>${cost}</b> requisition${cost<u.cost?` (${u.cost} before your standing here)`:''}. You have <b>${state.credits.toLocaleString()}</b>.</p><p>Upgrades are permanent for this campaign and apply in every operation.</p>`,[
  {label:'Cancel',run:close},{label:`Install · ${cost}`,primary:true,run:()=>buyUpgrade(u)}]);}
function buyUpgrade(u){const have=owned(),cost=price(u.cost);if(have.has(u.id)||state.credits<cost||!docked())return;state.credits-=cost;yardShip().upgrades=[...have,u.id];persist();close();refresh();toast(`${u.name} installed. ${state.credits.toLocaleString()} requisition left.`);}
// Called by the 3D view every frame with each layout point projected into the ship canvas.
function yardFrame(sc){if(!yardLayout||view!=='yard')return;$('shipwait').hidden=true;const P=i=>[sc[i][0]+SHIP_BOX[0],sc[i][1]+SHIP_BOX[1]];
 for(const r of yardLayout.rows){const [x,y]=P(r.idx);if(r.line){r.line.setAttribute('x2',x.toFixed(1));r.line.setAttribute('y2',y.toFixed(1));}else{r.mark.style.left=x+'px';r.mark.style.top=y+'px';}}
 const c=P(yardLayout.si),ez=P(yardLayout.si+1),ey=P(yardLayout.si+2),e=$('shieldline');e.setAttribute('cx',c[0].toFixed(1));e.setAttribute('cy',c[1].toFixed(1));e.setAttribute('rx',Math.hypot(ez[0]-c[0],ez[1]-c[1]).toFixed(1));e.setAttribute('ry',Math.hypot(ey[0]-c[0],ey[1]-c[1]).toFixed(1));
 const pl=P(yardLayout.ei);$('plume').style.left=pl[0]+'px';$('plume').style.top=pl[1]+'px';}
function startShipView(){const api=window.BroadsideShipView;if(!api||view!=='yard'||!yardLayout)return;api.show($('shipgl'),yardShip().ship,yardLayout.points,yardFrame).catch(e=>{console.warn('Ship view unavailable',e);$('shipwait').hidden=false;$('shipwait').textContent='The 3D ship view is unavailable in this browser.';});}
function openYard(){$('shipwait').hidden=false;$('shipwait').textContent='Bringing the ship into the floodlights…';$('plume').style.left='-300px';renderYard();clearTimeout(shipViewTimer);shipViewTimer=setTimeout(()=>{if(!window.BroadsideShipView)$('shipwait').textContent='The 3D ship view could not be loaded.';},12000);}
function closeYard(){if(window.BroadsideShipView)window.BroadsideShipView.hide();}
function renderServices(){const list=$('svclist'),hull=yardShip().hull??1,pts=Math.ceil((1-hull)*100),cost=price(pts*6),t=torpStock(),tc=price((t.cap-t.have)*25),patch=price(100),dock=docked(),status=el('div',dock?null:'yardnote',dock?`Docked at ${STATIONS[state.system].name} · ${standingOf(state.system).name}${standingOf(state.system).discount?`, ${Math.round(standingOf(state.system).discount*100)}% off`:''} · hull ${Math.round(hull*100)}% · requisition ${state.credits.toLocaleString()}`:`No starbase at ${byId[state.system].name}. ${dockHint()}`);list.replaceChildren();status.style.cssText='font-size:14px;line-height:1.4;color:var(--dim)';list.append(status);
 const row=(title,sub,label,disabled,run,solid)=>{const r=el('div','svc'),d=el('div'),b=el('button',solid?'solid':'',label);d.append(el('b',null,title),el('small',null,sub));b.type='button';b.disabled=disabled||!dock;b.addEventListener('click',run);r.append(d,b);list.append(r);};
 row('Full overhaul',pts?'Restores the hull and every damaged subsystem':'The hull is fully repaired',pts?`Overhaul · ${cost}`:'Not needed',!(pts>0&&state.credits>=cost),()=>{state.credits-=cost;yardShip().hull=1;yardShip().sub=null;persist();refresh();toast('Overhaul complete. Hull and subsystems restored.');},true);
 row('Emergency repair','Patches up to 15% of the hull',`Repair · ${patch}`,state.credits<patch||hull>=1,()=>{state.credits-=patch;yardShip().hull=Math.min(1,hull+.15);persist();refresh();toast('Emergency repairs complete.');});
 if(t.cap)row('Torpedo resupply',`${t.have} of ${t.cap} aboard · ${price(25)} each`,tc?`Resupply · ${tc}`:'Full',!tc||state.credits<tc,()=>{state.credits-=tc;yardShip().torps=t.cap;persist();refresh();toast('Torpedo magazine replenished.');});}

// The star chart: systems, regions and fronts, routes, jumping, interceptions, and launching battles.
// Part of the campaign page (campaign.html); its scripts share one scope and load in order: core, map, board, shipyard, crew, reports.
'use strict';
// Maps the stored atlas coordinates onto the 1600 × 900 star field.
function proj(s){return [150+(s.x-380)/1120*1300,96+(s.y-110)/510*520];}
let view='map';
function frameSize(){const w=innerWidth,h=innerHeight;const s=Math.max(.5,Math.min(w/STAGE_W,h/STAGE_H));$('holder').style.width=(STAGE_W*s)+'px';$('holder').style.height=(STAGE_H*s)+'px';$('stage').style.transform=`scale(${s})`;$('viewport').style.display=w>=STAGE_W*s?'flex':'block';$('viewport').style.alignItems='center';$('viewport').style.justifyContent='center';}
function neighbors(id){return ROUTES.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[])}
// Courses (Campaign.route) keep out of lanes closed by Fleet order and run through as few blockades as they can.
function routeCtx(){return {fronts:state.fronts,act:act(),broken:state.broken||[]};}
function courseTo(from,to){return Campaign.route(from,to,routeCtx());}
function getPath(from,to){return courseTo(from,to).path;}
// The part of a course flown before anything stops it: up to and including the first blockade.
function legOf(c){return c.stop?c.path.slice(0,c.path.indexOf(c.stop)+1):c.path;}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function svgEl(tag,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}
function rng(seed){return ()=>(seed=(seed*16807)%2147483647)/2147483647;}
function drawSky(canvas,seed){const g=canvas.getContext('2d'),r=rng(seed);g.clearRect(0,0,STAGE_W,STAGE_H);
 for(let i=0;i<620;i++){g.fillStyle=`rgba(255,255,255,${(.15+r()*.45).toFixed(2)})`;g.fillRect(Math.round(r()*STAGE_W),Math.round(r()*STAGE_H),1,1);}
 for(let i=0;i<110;i++){const t=r();g.fillStyle=`rgba(${t<.3?'190,210,255':t<.5?'255,225,190':'255,255,255'},${(.35+r()*.4).toFixed(2)})`;g.fillRect(Math.round(r()*STAGE_W),Math.round(r()*STAGE_H),2,2);}
 for(let i=0;i<26;i++){const x=r()*STAGE_W,y=r()*STAGE_H,gr=g.createRadialGradient(x,y,0,x,y,4);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x-4,y-4,8,8);}}
// Faction influence: each system claims the part of a 125 px disc nearer to it than to any other system (a clipped Voronoi cell).
// Only edges facing another region, or open space, are drawn, pulled 3 px inside so neighbouring regions show side-by-side lines.
function clipHalf(poly,nx,ny,k,lab){const out=[];for(let i=0;i<poly.length;i++){const A=poly[i],B=poly[(i+1)%poly.length],da=nx*A.p[0]+ny*A.p[1]-k,db=nx*B.p[0]+ny*B.p[1]-k,ain=da<=0;if(ain)out.push(A);if(ain!==(db<=0)){const t=da/(da-db);out.push({p:[A.p[0]+(B.p[0]-A.p[0])*t,A.p[1]+(B.p[1]-A.p[1])*t],e:ain?lab:A.e});}}return out;}
function cellPoly(i,pts,regs,R,gap){const p=pts[i];let poly=[];for(let k=0;k<36;k++){const a=k/36*Math.PI*2;poly.push({p:[p[0]+Math.cos(a)*R,p[1]+Math.sin(a)*R],e:-1});}
 for(let j=0;j<pts.length&&poly.length;j++){if(j===i)continue;const q=pts[j],dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy);if(L>R*2.2)continue;const nx=dx/L,ny=dy/L;poly=clipHalf(poly,nx,ny,nx*(p[0]+q[0])/2+ny*(p[1]+q[1])/2-(regs[i]===regs[j]?0:gap),j);}
 return poly;}
// A cell's sides, each with the system across it (-1 for open space).
function cellSides(poly){return poly.map((A,k)=>({a:A.p,b:poly[(k+1)%poly.length].p,to:A.e}));}
let CELLS=[];
function buildMap(){drawSky($('sky'),7);
 $('selgo').addEventListener('click',()=>travel(selected));
 // The system being fought over is hatched in Navy blue over its region's colour.
 REGIONS.forEach((r,k)=>{const pt=svgEl('pattern',{id:'hatch'+k,width:8,height:8,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'});pt.append(svgEl('rect',{width:8,height:8,fill:`rgb(${REGION_HUE[k].join(',')})`,'fill-opacity':.14}),svgEl('rect',{width:3,height:8,fill:`rgb(${NAVY.join(',')})`,'fill-opacity':.3}));$('hatches').append(pt);});
 const neb=$('nebulae');REGIONS.forEach((r,k)=>{const ps=SYSTEMS.filter(s=>regionOf(s)===k).map(proj),cx=ps.reduce((a,p)=>a+p[0],0)/ps.length,cy=ps.reduce((a,p)=>a+p[1],0)/ps.length,d=el('div','neb');d.style.left=(cx-230)+'px';d.style.top=(cy-150)+'px';d.style.background=`radial-gradient(closest-side,${hue(k,.16)},${hue(k,0)})`;neb.append(d);});
 const pts=SYSTEMS.map(proj),regs=SYSTEMS.map(regionOf),b=$('borders');
 CELLS=SYSTEMS.map((s,i)=>cellSides(cellPoly(i,pts,regs,125,3)));
 const zg=$('zonefill');SYSTEMS.forEach((s,i)=>zg.append(svgEl('polygon',{points:CELLS[i].map(e=>e.a.map(v=>v.toFixed(1)).join(',')).join(' '),'data-id':s.id})));
 SYSTEMS.forEach((s,i)=>{for(const {a:p,b:q} of CELLS[i].filter(e=>e.to===-1||regs[e.to]!==regs[i]))b.append(svgEl('line',{x1:p[0].toFixed(1),y1:p[1].toFixed(1),x2:q[0].toFixed(1),y2:q[1].toFixed(1),class:'r'+regs[i],stroke:`rgb(${REGION_HUE[regs[i]].join(',')})`}));});
 const lb=$('lanebase');for(const [a,c] of ROUTES){const p=proj(byId[a]),q=proj(byId[c]);lb.append(svgEl('line',{x1:p[0].toFixed(1),y1:p[1].toFixed(1),x2:q[0].toFixed(1),y2:q[1].toFixed(1)}));}
 const nodes=$('nodes');
 for(const s of SYSTEMS){const [x,y]=proj(s),k=regionOf(s),w=el('div','sys');w.dataset.id=s.id;w.style.left=x+'px';w.style.top=y+'px';
  const halo=el('span','halo');halo.style.background=`radial-gradient(closest-side,${hue(k,.35)},${hue(k,0)})`;
  const dot=el('button','dot'),core=el('span');dot.type='button';dot.setAttribute('aria-label',`${s.name}, ${s.region}`);core.style.boxShadow=`0 0 6px rgba(255,255,255,.9),0 0 14px ${hue(k,.9)}`;dot.append(core);
  // A click selects; a double-click, or Enter on a star that is already selected, jumps there.
  dot.addEventListener('click',e=>{if(e.detail===0&&selected===s.id)travel(s.id);else selectSystem(s.id);});dot.addEventListener('dblclick',()=>travel(s.id));
  if(STATIONS[s.id]){w.classList.add('station');dot.setAttribute('aria-label',`${s.name}, ${s.region}, starbase`);}
  w.append(halo,el('span','spk'),el('span','rings'),el('span','stn'),dot,el('span','lbl',s.name),el('span','op'),el('span','war'),el('span','ship'),el('span','tip'));nodes.append(w);}}
function availableOps(){return Campaign.openStory(state.completed);}
function jumpsText(n){return n<0?'Closed':n===0?'Here':n+(n===1?' jump':' jumps');}
function opNo(m){return String(m.id).padStart(2,'0');}
function opTag(m){return m.boss?'FINALE':'OP '+opNo(m);}
function finaleOf(m){return `Act ${Campaign.ACTS[m.act-1].numeral} finale`;}
function fillBars(box,n){box.replaceChildren();for(let i=1;i<=5;i++){const b=el('i');if(i<=n)b.className='on';box.append(b);}}
function orderTag(o){return o.kind==='side'?'MISSION':o.type==='defence'?'DEFEND':Campaign.CONTRACT_TYPES[o.type].label.toUpperCase();}
// The odds of an ambush in a system follow difficulty and the state of its front; a route's risk is the chance of any on the way.
function ambushScale(id){const f=frontAt(id);return diff().intercept*(f?Campaign.FRONT_EFFECTS.ambush[f.level]:1);}
function risky(id){return Campaign.hostile(byId[id],act())&&ambushScale(id)>0;}
function routeRisk(path){return Math.round(Campaign.interceptRisk(path,act(),ambushScale)*100);}
function riskText(path){const r=routeRisk(path);return r?`${r}% interception risk`:'Clear lanes';}
// What a course costs: the blockade it runs into, or else the chance of an interception on the way.
function courseText(c){return c.stop?`Blockade at ${byId[c.stop].name}`:riskText(c.path);}
function closedText(s){return `Closed by Fleet order until Act ${Campaign.ACTS.find(a=>a.foes.includes(s.faction)).numeral}`;}
function goButton(id,here){const b=el('button','go',id===here?'Open →':'Jump →');b.type='button';b.setAttribute('aria-label',id===here?`Open system details for ${byId[id].name}`:`Jump to ${byId[id].name}`);b.addEventListener('click',()=>travel(id));return b;}
function opRow(cls,tag,tagCls,name,sub,sys,here){const row=el('div','opitem'+cls+(sys===selected?' active':'')),b=el('button','pick'),t=el('span','t');b.type='button';t.append(el('b',null,name),el('small',null,sub));b.append(el('span',tagCls,tag),t,el('span','d',jumpsText(getPath(here,sys).length-1).toUpperCase()));b.addEventListener('click',()=>selectSystem(sys));row.append(b,goButton(sys,here));return row;}
function refresh(){const here=state.system&&byId[state.system]?state.system:HOME,course=courseTo(here,selected),path=course.path,onPath=new Set(path),rc=routeCtx(),avail=availableOps(),availAt=new Map(avail.map(m=>[m.system,m])),orders=activeOrders(),ctl=Campaign.control(state.fronts,state.completed),news=state.frontNews||{};
 for(const w of $('nodes').children){const id=w.dataset.id,s=byId[id],m=availAt.get(id),here_o=orders.filter(o=>o.system===id);
  w.classList.toggle('sel',id===selected);w.classList.toggle('home',id===here);w.classList.toggle('path',onPath.has(id));w.classList.toggle('avail',!!m||here_o.length>0);w.classList.toggle('order',!m&&here_o.length>0);
  const hit=here_o.some(o=>o.type==='defence');w.classList.toggle('attack',hit);w.classList.toggle('blockade',Campaign.blockaded(id,rc));w.classList.toggle('sealed',Campaign.sealed(s,rc.act));
  w.querySelector('.op').textContent=m?opTag(m):hit?'UNDER ATTACK':here_o.length>1?here_o.length+' ORDERS':here_o.length?orderTag(here_o[0]):'';w.querySelector('.ship').textContent='▲ '+flag().shipName.toUpperCase();
  const wt=w.querySelector('.war'),nw=news[id];wt.textContent=nw==='won'?'▲ TAKEN':nw==='lost'?'▼ LOST':ctl[id]==='front'?'FRONT':'';wt.className='war'+(nw?' '+nw:'');w.dataset.ctl=ctl[id];
  const c=id===here?null:courseTo(here,id);w.querySelector('.tip').textContent=!c?'':c.sealed?'LANES CLOSED':c.path.length>1?`${jumpsText(c.path.length-1)} · ${courseText(c)}`.toUpperCase():'';}
 // The plotted route: a leg into a system where hostiles may be waiting is drawn in red, and everything past a blockade is dashed.
 const hot=$('lanehot'),stopAt=course.stop?path.indexOf(course.stop):Infinity;hot.replaceChildren();for(let i=1;i<path.length;i++){const a=proj(byId[path[i-1]]),b=proj(byId[path[i]]);hot.append(svgEl('line',{x1:a[0].toFixed(1),y1:a[1].toFixed(1),x2:b[0].toFixed(1),y2:b[1].toFixed(1),class:i>stopAt?'beyond':i===stopAt||risky(path[i])?'risk':''}));}
 const s=byId[selected],[x,y]=proj(s);$('cross').querySelector('.h').style.top=y+'px';$('cross').querySelector('.v').style.left=x+'px';$('borders').dataset.sel=regionOf(s);
 $('selname').textContent=s.name;$('seldesc').textContent=s.description;$('selfaction').textContent=s.faction;$('selthreat').textContent=s.threat;fillBars($('selbars'),threatLevel(s));$('selstation').textContent=STATIONS[s.id]?STATIONS[s.id].name:'None';const sf=frontAt(s.id);$('selfront').textContent=sf?sf.name:'Navy space';$('selhold').textContent=Campaign.sealed(s,rc.act)?'Lanes closed':ctl[s.id]==='navy'?'Navy-held':ctl[s.id]==='front'?'Front line':Campaign.blockaded(s.id,rc)?'Enemy-held · blockaded':(rc.broken.includes(s.id)&&ctl[s.id]==='enemy')?'Enemy-held · blockade broken':FOE_FACTIONS.includes(s.faction)?'Enemy-held':'Unsecured';
 const jumps=path.length-1,go=$('selgo');go.textContent=selected===here?'System details →':`Jump to ${s.name} →`;go.disabled=selected!==here&&jumps<1;
 $('selroute').textContent=selected===here?'Your flagship is here':course.sealed?closedText(s):jumps<1?'No established jump route':`${jumpsText(jumps)} · ${courseText(course)}${course.stop&&routeRisk(legOf(course).slice(0,-1))?` · ${routeRisk(legOf(course).slice(0,-1))}% risk on the way`:''}`;$('selroute').classList.toggle('risk',selected!==here&&(!!course.stop||course.sealed||routeRisk(path)>0));drawFronts(ctl);
 const list=$('availlist');list.replaceChildren();
 for(const m of avail)list.append(opRow('',opTag(m),'n'+(m.boss?' boss':''),m.name,`${byId[m.system].name} · ${m.captain}`,m.system,here));
 for(const o of orders)list.append(opRow(o.type==='defence'?' order attack':' order',orderTag(o),'n',o.name,`${byId[o.system].name} · ${stationOf(o)}`,o.system,here));
 if(!avail.length&&!orders.length)list.append(el('div','empty',act()>Campaign.ACTS.length?'Every operation in the Reach is complete. Starbases still post work for any captain.':'No open orders. Starbases post station missions and contracts.'));
 const t=torpStock(flag());$('fleetstatus').innerHTML=`${act()<=Campaign.ACTS.length?'ACT '+actInfo().numeral+' · ':''}REQ <b>${state.credits.toLocaleString()}</b> · HULL ${Math.round((flag().hull??1)*100)}% · ${t.cap?`TORP ${t.have}/${t.cap}`:'NO TORPEDOES'}${state.ships.length>1?` · FLEET ${deployedShips().length}/${state.ships.length}`:''}`;
 if(view==='yard')renderYard();}
// Fronts on the map: each region's border shifts from its own colour toward Navy blue and brightens as it is won.
// Zones: every system's territory is tinted Navy blue where the Navy holds it and in its region's colour where the enemy does;
// the system being fought over is hatched, and the front line runs along the edge of what the Navy holds.
const NAVY=[110,170,255];
// Beyond the front line, a system belonging to one of the Reach's enemies is theirs; an independent or contested one is only unsecured.
const FOE_FACTIONS=['Pirates','Renegades','Machines','Aliens'];
function drawZones(ctl){const news=state.frontNews||{},fl=$('frontline');fl.replaceChildren();
 SYSTEMS.forEach((s,i)=>{const c=ctl[s.id],pg=$('zonefill').children[i],k=regionOf(s);pg.setAttribute('class',c+(news[s.id]?' changed':''));pg.setAttribute('fill',c==='navy'?`rgb(${NAVY.join(',')})`:c==='front'?`url(#hatch${k})`:`rgb(${REGION_HUE[k].join(',')})`);
  if(c==='navy')for(const e of CELLS[i])if(e.to>=0&&ctl[SYSTEMS[e.to].id]!=='navy')fl.append(svgEl('line',{x1:e.a[0].toFixed(1),y1:e.a[1].toFixed(1),x2:e.b[0].toFixed(1),y2:e.b[1].toFixed(1)}));});}
function drawFronts(ctl){drawZones(ctl||Campaign.control(state.fronts,state.completed));
 for(const [k,r] of REGIONS.entries()){const f=Campaign.front(state.fronts,r),t=f?(f.value+10)/20:1,c=REGION_HUE[k].map((v,i)=>Math.round(v+(NAVY[i]-v)*t)).join(','),op=f?(0.14+0.3*t).toFixed(2):'0.3';
  for(const l of $('borders').querySelectorAll('.r'+k)){l.setAttribute('stroke',`rgb(${c})`);l.style.strokeOpacity=op;}}
 const n=Math.min(act(),Campaign.ACTS.length),r=Campaign.ACT_FRONT[n],f=Campaign.front(state.fronts,r),left=Campaign.PUSHBACK.every-state.frontClock,el=$('frontstrip'),off=offensive(),jl=Math.max(1,left*Campaign.PUSHBACK.jumps-(state.jumpClock||0));
 if(act()>Campaign.ACTS.length){el.hidden=true;return;}el.hidden=false;
 el.innerHTML=`<span class="k">Act ${Campaign.ACTS[n-1].numeral} front</span><b>${r}</b><span class="fbar"><i style="width:${((f.value+10)/20*100).toFixed(0)}%"></i></span><span>${f.name}</span><span class="k${off?' alarm':''}">${off?`Counter-attack at ${byId[off.order.system].name} · ${off.left===1?'the next battle elsewhere':off.left+' more battles elsewhere'} and the line falls back`:f.level===4?'Secured':f.value<=-10?'Nothing left here to lose':`${f.foe} will counter-attack after ${left} more ${left===1?'battle':'battles'}, or ${jl} ${jl===1?'jump':'jumps'}, without a win here`}</span>`;}
function selectSystem(id){if(!byId[id])return;selected=id;refresh();}
function updateFleet(){refresh();}
function setView(v){view=v;$('codexview').hidden=v!=='codex';$('tabCodex').classList.toggle('current',v==='codex');if(v==='codex')renderCodex();$('arrival').hidden=v!=='arrival';$('boardview').hidden=v!=='board';$('yard').hidden=v!=='yard';$('crewview').hidden=v!=='crew';$('tabMap').classList.toggle('current',v==='map'||v==='arrival'||v==='board');if(v==='board')renderBoard();$('tabShip').classList.toggle('current',v==='yard');$('tabCrew').classList.toggle('current',v==='crew');if(v==='yard')openYard();else closeYard();if(v==='crew')renderCrew();}
// Jumping moves the flagship at once and opens the arrival screen for the new system.
// A course that runs into a blockade stops there: fight it, run it, or turn back.
function travel(id){const here=state.system&&byId[state.system]?state.system:HOME;if(id===here){showArrival(id,here,0);return;}const course=courseTo(here,id),path=course.path;if(path.length<2){toast(course.sealed?`The lanes into ${byId[id].name} are closed by Fleet order.`:'No established jump route.');return;}
 // Ambushes can only come before the blockade: the blockade itself is the fight waiting there.
 const leg=legOf(course),open=course.stop?leg.slice(0,-1):leg;
 const hit=Campaign.rollInterception(open,act(),rand,ambushScale);
 if(hit){underWay(open.indexOf(hit));arriveAt(hit);ambush(hit,id);return;}
 // A rival who got away may be waiting in their own space (crew/rivals.js), and anything can happen on the lane (crew/events.js).
 const rv=Rivals.ambush(state.rivals,open,Math.min(act(),3),state.attempts,rand);
 if(rv){underWay(open.indexOf(rv.at));arriveAt(rv.at);rivalAmbush(rv.rival,rv.at,id);return;}
 underWay(leg.length-1);
 if(course.stop){arriveAt(course.stop);blockade(course.stop,id,leg[leg.length-2]);return;}
 arriveAt(id);
 const ev=Events.roll(eventCtx(id),rand);
 if(ev){state.laneEvent={id:ev.id,at:id,from:here};persist();showLaneEvent();return;}
 showArrival(id,here,path.length-1);}
// Carrying on after slipping an ambush or running a blockade: no new ambush rolls, but the next blockade still stops the fleet.
function onward(dest){const from=state.system,course=courseTo(from,dest),leg=legOf(course);if(leg.length<2){refresh();return;}
 underWay(leg.length-1);
 if(course.stop){arriveAt(course.stop);blockade(course.stop,dest,leg[leg.length-2]);return;}
 arriveAt(dest);showArrival(dest,from,leg.length-1);}
function blockade(at,dest,back){const dead=new Set((state.rivals||[]).filter(r=>r.status==='dead').map(r=>r.name));let x;for(let i=0;i<6;i++){state.interceptSeed++;x=Campaign.blockade(at,act(),state.interceptSeed);if(!dead.has(x.captain))break;}state.ambush={x,dest,blockade:true,back};persist();showAmbush();}
// Running a blockade is harder than slipping an ambush, and costs more hull either way.
const BLOCKADE_RUN={chance:.75,cost:.06,fail:.1};
function arriveAt(id){state.system=id;selected=id;if(!state.visited.includes(id))state.visited.push(id);const news=state.transitNews;state.transitNews=null;persist();refresh();if(news)toast(news);}
// Interceptions: hostiles drop out of the lane in enemy space. Fight, or try to break away and carry on.
// A captain you killed as a rival does not come back from the dead under the same name: draw again.
function ambush(at,dest){const dead=new Set((state.rivals||[]).filter(r=>r.status==='dead').map(r=>r.name));let x;for(let i=0;i<6;i++){state.interceptSeed++;x=Campaign.interception(at,act(),state.interceptSeed);if(!dead.has(x.captain))break;}state.ambush={x,dest};persist();showAmbush();}
function showAmbush(){const a=state.ambush;if(!a)return;const x=a.x,spec=Campaign.encounter(x,cctx()),fleet=deployedShips(),eng=Math.round(Math.min(...fleet.map(r=>(r.sub||{}).engines??100))),chance=Campaign.fleetFleeChance(fleet),pct=Math.round(chance*100),onward=a.dest&&a.dest!==x.system;setView('map');selectSystem(x.system);
 if(a.blockade){const run=Math.round(chance*BLOCKADE_RUN.chance*100)/100,rp=Math.round(run*100),back=byId[a.back]?a.back:null;
  openModal(x.name,'CONTACT / THE LANE IS HELD',`<p>${x.brief}</p><div class="commander-brief">${Personnel.portrait({name:x.captain,faction:spec.hail.faction,asset:spec.hail.asset})}<div><small>${spec.hail.faction}</small><b>${x.captain}</b><blockquote>“${spec.hail.line}”</blockquote><p>${x.intel}</p></div></div><p>Break the blockade for salvage worth about <b>${pay(x)}</b> requisition and the lane stays open while the ${byId[x.system].region} front holds. Or run it${onward?' for '+byId[a.dest].name:''}: a <b>${rp}%</b> chance, ${Math.round(BLOCKADE_RUN.cost*100)}% of every hull if you get through and ${Math.round(BLOCKADE_RUN.fail*100)}% and the fight if you do not.${back?` Or turn back to ${byId[back].name} untouched.`:''}</p>${flagshipLine()}`,[
   ...(back?[{label:'Turn back',run:()=>{state.ambush=null;closeModal();underWay(1);arriveAt(back);toast(`The fleet fell back to ${byId[back].name}.`);}}]:[]),{label:`Run the blockade · ${rp}%`,run:()=>flee(run)},{label:'Battle stations',primary:true,run:()=>launch(spec)}],{locked:true});return;}
 openModal(x.name,'CONTACT / HOSTILES IN THE LANE',`<p>${x.brief}</p><div class="commander-brief">${Personnel.portrait({name:x.captain,faction:spec.hail.faction,asset:spec.hail.asset})}<div><small>${spec.hail.faction}</small><b>${x.captain}</b><blockquote>“${spec.hail.line}”</blockquote><p>${x.intel}</p></div></div><p>Turn and fight for salvage worth about <b>${pay(x)}</b> requisition, or try to break away${onward?' and carry on to '+byId[a.dest].name:''}. ${fleet.length>1?'Your fleet moves at the pace of its slowest ship and':flag().shipName} has a <b>${pct}%</b> chance of slipping them${eng<100?` with ${fleet.length>1?'the worst':'her'} engines at ${eng}%`:''}.</p>${flagshipLine()}`,[
  {label:`Break away · ${pct}%`,run:()=>flee(chance)},{label:'Battle stations',primary:true,run:()=>launch(spec)}],{locked:true});}
function flee(chance){const a=state.ambush;if(!a)return;const x=a.x,b=a.blockade;
 if(rand()<chance){if(x.rivalId)state.rivals=state.rivals.map(r=>r.id===x.rivalId?{...r,readyAt:state.attempts+1}:r);state.ambush=null;scrape(b?BLOCKADE_RUN.cost:.03);persist();closeModal();if(a.dest&&a.dest!==x.system)onward(a.dest);else refresh();toast(b?'You ran the blockade. It still holds the lane behind you.':deployedShips().length>1?'The fleet slipped the ambush with minor damage.':'You slipped the ambush with minor damage.');return;}
 scrape(b?BLOCKADE_RUN.fail:.06);a.failed=true;persist();refresh();
 openModal('They have matched your vector','CONTACT / BREAKAWAY FAILED',`<p>The drive spooled too slowly. ${x.captain} raked your hulls as you turned, costing ${b?Math.round(BLOCKADE_RUN.fail*100):6}% of each, and is closing to engage.</p>${flagshipLine()}`,[{label:'Battle stations',primary:true,run:()=>launch(Campaign.encounter(x,cctx()))}],{locked:true});}
function flagshipLine(){const f=deployedShips(),row=r=>`${esc(r.shipName)} (${r.ship}, hull ${Math.round((r.hull??1)*100)}%)`;return `<p><b>${f.length>1?'Fleet':'Flagship'}:</b> ${f.map(row).join(' · ')} · Requisition ${state.credits.toLocaleString()}</p>`;}
// Breaking away from an ambush costs every ship that is flying a little hull.
function scrape(d){for(const r of deployedShips())r.hull=Math.max(.25,(r.hull??1)-d);}
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
// Every battle goes through here: the encounter spec travels to the battle page in the save.
function launch(spec){if(!spec)return;closeModal();state.launch=spec;state.pendingResult=null;state.attempts++;persist();location.href='index.html?encounter=1';}
function showArrival(id,from,jumps){const s=byId[id],k=regionOf(s),h=REGION_HUE[k],tone=t=>h.map(v=>Math.round(v*t)).join(','),light=t=>h.map(v=>Math.round(v+(255-v)*t)).join(','),accent=`rgb(${light(.45)})`;
 $('planet').style.background=`radial-gradient(circle at 26% 80%, rgb(${light(.55)}) 0%, rgb(${tone(1)}) 12%, rgb(${tone(.45)}) 30%, rgb(${tone(.12)}) 52%, #020306 70%)`;$('planet').style.boxShadow=`0 0 160px ${hue(k,.28)}`;
 $('arrkicker').textContent=jumps?`Arrived · ${jumps} ${jumps===1?'jump':'jumps'} from ${byId[from].name}`:`Current position · ${s.region}`;$('arrkicker').style.color=accent;
 $('arrname').textContent=s.name;$('arrregion').textContent=`${s.region} · ${REGION_SUB[k]}`;$('arrregion').style.color=accent;$('arrdesc').textContent=s.description;$('arrfaction').textContent=s.faction;$('arrthreat').textContent=s.threat;fillBars($('arrbars'),threatLevel(s));
 const nb=neighbors(id),on=$('arronward');$('arrlanes').textContent=nb.length+(nb.length===1?' system':' systems');on.replaceChildren();
 for(const n of nb){const t=byId[n],b=el('button','lane'),d=el('i');b.type='button';if(Campaign.sealed(t,act())){b.disabled=true;b.append(d,el('span',null,t.name),el('small',null,'CLOSED'));d.style.background='#555';b.setAttribute('aria-label',`${t.name}: ${closedText(t)}`);on.append(b);continue;}d.style.background=`rgb(${REGION_HUE[regionOf(t)].join(',')})`;b.append(d,el('span',null,t.name),el('small',null,risky(n)?riskText([id,n]).toUpperCase():t.threat.toUpperCase()),el('span','arrow','→'));if(risky(n))b.classList.add('risk');b.setAttribute('aria-label',`Jump to ${t.name}, ${t.threat} threat${risky(n)?', '+riskText([id,n]):''}`);b.addEventListener('click',()=>travel(n));on.append(b);}
 renderArrivalOps(id);setView('arrival');$('arrback').focus();}
function storyCard(m){const c=commanderByMission(m.id)||{},lead=leadFor(m),card=el('article','opcard'+(m.boss?' boss':'')),row=el('div','row'),num=el('span',null,(m.boss?finaleOf(m).toUpperCase()+' · ':'')+'OPERATION '+opNo(m));num.style.color=m.boss?'#ff9a7a':'var(--amber)';row.append(num,el('span',null,`REWARD ${pay(m)} REQ`));
  const who=el('div','who'),two=el('div','two'),obj=el('div'),intel=el('div'),off=el('div','officer'),go=el('button','pill solid','Open briefing →');
  who.append(el('b',null,m.captain),el('span',null,[c.faction,m.kind].filter(Boolean).join(' · ')));obj.append(el('span','k','Objective'),document.createTextNode(m.objective));intel.append(el('span','k','Enemy intel'),document.createTextNode(m.intel));two.append(obj,intel);
  off.append(el('span',null,officerName(lead).toUpperCase()+' · '),document.createTextNode(`“${Personnel.briefLines[m.id]}”`));go.type='button';go.addEventListener('click',()=>briefing(m));
  card.append(row,el('h2',null,m.name),who);if(c.line)card.append(el('p','taunt',`“${c.line}”`));card.append(el('div','rule'),el('p',null,m.brief),two,off,go);return card;}
function stationCard(id){const st=STATIONS[id],side=boardSide(id),jobs=boardContracts(id),card=el('article','opcard compact'),row=el('div','row'),k=el('span',null,'STARBASE · '+st.owner.toUpperCase()),acts=el('div','acts'),b1=el('button','pill solid','Mission board →'),b2=el('button','pill quiet','Shipyard & repairs →');
 k.style.color='#9fd8ff';row.append(k,el('span',null,`${standingOf(id).name.toUpperCase()} · ${side.length} ${side.length===1?'MISSION':'MISSIONS'} · ${jobs.length} CONTRACTS`));b1.type=b2.type='button';b1.addEventListener('click',()=>openBoard(id));b2.addEventListener('click',()=>setView('yard'));acts.append(b1,b2);
 card.append(row,el('h2',null,st.name),el('p',null,st.blurb),acts);return card;}
function orderCard(o){const card=el('article','opcard compact'),row=el('div','row'),k=el('span',null,orderLabel(o).toUpperCase()),two=el('div','two'),obj=el('div'),intel=el('div'),go=el('button','pill solid','Engage →');
 k.style.color='#9fd8ff';row.append(k,el('span',null,`REWARD ${pay(o)} REQ`));obj.append(el('span','k','Objective'),document.createTextNode(o.hud||o.objective));intel.append(el('span','k','Enemy intel'),document.createTextNode(o.intel));two.append(obj,intel);
 go.type='button';go.addEventListener('click',()=>orderBriefing(o));card.append(row,el('h2',null,o.name),el('p',null,`Posted by ${o.giver?o.giver+', ':''}${stationOf(o)}`),two,go);return card;}
function renderArrivalOps(id){const list=$('arropslist'),m=missionFor(id),open=m&&isUnlocked(m.id)&&!state.completed.includes(m.id),orders=ordersAt(id);list.replaceChildren();const n=(open?1:0)+orders.length;$('arropsk').textContent=STATIONS[id]?`In this system · starbase${n?` and ${n} ${n===1?'operation':'operations'}`:''}`:`Available operations · ${n}`;
 if(STATIONS[id])list.append(stationCard(id));
 if(open)list.append(storyCard(m));
 for(const o of orders)list.append(orderCard(o));
 if(open||orders.length||STATIONS[id])return;
 const done=m&&state.completed.includes(m.id),card=el('div','opcard small'),next=availableOps().map(x=>({m:x,d:getPath(id,x.system).length-1})).sort((p,q)=>p.d-q.d)[0];
 card.append(el('strong',null,done?`Operation ${opNo(m)} complete`:`No operations in ${byId[id].name}.`),el('div',null,next?`Nearest open operation: ${next.m.name} at ${byId[next.m.system].name}, ${jumpsText(next.d).toLowerCase()} away.`:'Every operation in the Reach is complete.'));
 if(next){const b=el('button','pill quiet','Show on map →');b.type='button';b.style.alignSelf='flex-start';b.style.marginTop='6px';b.addEventListener('click',()=>{setView('map');selectSystem(next.m.system);});card.append(b);}
 list.append(card);}

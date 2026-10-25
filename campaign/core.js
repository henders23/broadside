// Campaign state: the save and its slots, pay and prices, reputation, the war, officer cards, Harlan's voice, and orders.
// Part of the campaign page (campaign.html); its scripts share one scope and load in order: core, map, board, shipyard, crew, reports.
'use strict';
const Personnel=window.BroadsidePersonnel;
// Star chart, acts, story operations, starbases and contracts live in crew/campaign-data.js.
const Campaign=window.BroadsideCampaign;
const MISSIONS=Campaign.STORY,SYSTEMS=Campaign.SYSTEMS,byId=Campaign.byId,ROUTES=Campaign.ROUTES,STATIONS=Campaign.STATIONS;
// The active save slot's key (slot 1 is the original 'broadside-campaign-v1').
const KEY=Campaign.saveKey(localStorage);
const $=id=>document.getElementById(id);
const shipChoices=['bastion','halberd','sabre','warden'];
// Hulls a fleet can hold: the four Navy classes and the three that can be claimed from wrecks.
const FLEET_CLASSES=[...shipChoices,'scrapjaw','revenant','seraph'];
const TORPEDO_CAP={bastion:8,halberd:6,sabre:6,warden:16,scrapjaw:0,revenant:0,seraph:0};
const CREW=Personnel.crew,RECRUITS=Personnel.recruits;
function crewById(id){return CREW.find(c=>c.id===id)||RECRUITS.find(c=>c.id===id)||CREW[0]}
// Officers on duty: one per post, regular or hired (state.crew maps each post to its holder). Everyone else is in reserve.
function onDuty(){return Personnel.activeCrew(state.crew);}
function dutyOf(id){return onDuty().find(c=>c.id===id)||null;}
function slotOf(o){return RECRUITS.includes(o)?o.post:o.id;}
function postTitle(o){return RECRUITS.includes(o)?o.postName:o.post;}
function reserves(){const duty=new Set(onDuty().map(c=>c.id));return [...CREW,...state.hired.map(id=>RECRUITS.find(r=>r.id===id)).filter(Boolean)].filter(c=>!duty.has(c.id));}
function leadFor(m){return onDuty().find(c=>c.slot===Personnel.leads[m.id])||leadFor(m);}
function commanderByMission(n){return Personnel.commanders[n]}
function newShip(id,ship,shipName){return {id,ship,shipName,hull:1,sub:null,torps:null,upgrades:[],reserve:false};}
function initial(){let pick='bastion';try{const v=JSON.parse(localStorage.getItem('broadside')||'{}');if(shipChoices.includes(v.ship))pick=v.ship;}catch(e){}return {version:1,ships:[newShip('s1',pick,'MNS Resolute')],flag:'s1',shipSeq:1,system:'meridian',completed:[],flags:{},credits:850,attempts:0,pendingResult:null,introSeen:false,officers:{},actBriefed:0,boardCycle:0,orders:[],contracts:[],sideDone:[],launch:null,interceptSeed:0,ambush:null,difficulty:'captain',rep:{},updated:0,met:[],visited:['meridian'],codexRead:[],crew:{},hired:[],fronts:Campaign.startFronts(),frontClock:0};}
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.version===1&&Array.isArray(v.completed)&&(Array.isArray(v.ships)&&v.ships.some(r=>FLEET_CLASSES.includes(r.ship))||shipChoices.includes(v.ship)))return migrate(v);}catch(e){}return initial();}
// Saves from before the grand campaign gain its fields; an Act I briefing already read counts as briefed.
// Single-ship saves become a one-ship fleet.
function migrate(v){const d=initial();for(const k of ['orders','contracts','sideDone'])if(!Array.isArray(v[k]))v[k]=[];for(const k of ['boardCycle','interceptSeed'])if(!Number.isFinite(v[k]))v[k]=0;if(!Number.isFinite(v.actBriefed))v.actBriefed=v.introSeen||v.completed.length?1:0;if(!v.officers)v.officers={};if(!('launch' in v))v.launch=d.launch;if(!Campaign.DIFFICULTY[v.difficulty])v.difficulty='captain';if(!v.rep||typeof v.rep!=='object')v.rep={};for(const k of ['met','visited','codexRead','hired'])if(!Array.isArray(v[k]))v[k]=[];if(!v.crew||typeof v.crew!=='object')v.crew={};if(!v.fronts||typeof v.fronts!=='object'){v.fronts=Campaign.startFronts();for(const id of v.completed){const m=Campaign.storyById[id],r=m&&Campaign.byId[m.system].region;if(r in v.fronts)v.fronts[r]=Math.min(10,v.fronts[r]+(m.boss?10:4));}}if(!Number.isFinite(v.frontClock))v.frontClock=0;if(!v.met.length)for(const id of v.completed){const m=Campaign.storyById[id];if(m)for(const e of m.enemies)if(!v.met.includes(e.cls))v.met.push(e.cls);}for(const id of [v.system,...v.completed.map(id=>Campaign.storyById[id]&&Campaign.storyById[id].system)])if(id&&Campaign.byId[id]&&!v.visited.includes(id))v.visited.push(id);
 if(!Array.isArray(v.ships)||!v.ships.length){v.ships=[Object.assign(newShip('s1',v.ship,v.shipName||'MNS Resolute'),{hull:typeof v.hull==='number'?v.hull:1,sub:v.sub||null,torps:v.torps??null,upgrades:Array.isArray(v.upgrades)?v.upgrades:[]})];v.flag='s1';}
 for(const k of ['ship','shipName','hull','sub','torps','upgrades'])delete v[k];
 v.ships=v.ships.filter(r=>FLEET_CLASSES.includes(r.ship));for(const r of v.ships){if(!Array.isArray(r.upgrades))r.upgrades=[];if(typeof r.hull!=='number')r.hull=1;r.reserve=!!r.reserve;}
 if(!v.ships.some(r=>r.id===v.flag))v.flag=v.ships[0].id;if(!Number.isFinite(v.shipSeq))v.shipSeq=v.ships.length;return v;}
let state=load(),selected='kestrel';
function persist(){state.updated=Date.now();localStorage.setItem(KEY,JSON.stringify(state));}
// The fleet: every ship keeps its own hull, damage, torpedoes, upgrades and name. The flagship is the one the captain flies.
function flag(){return state.ships.find(s=>s.id===state.flag)||state.ships[0];}
function deployedShips(){return Campaign.deployed(state.ships,state.flag);}
let yardShipId=null;
function yardShip(){return state.ships.find(s=>s.id===yardShipId)||flag();}
function isUnlocked(n){return Campaign.storyUnlocked(state.completed,n);}
// A system can host more than one story operation (Halcyon has two): prefer the one that is open, then one not yet flown.
function missionFor(system){const here=MISSIONS.filter(m=>m.system===system);return here.find(m=>Campaign.storyAvailable(state.completed,m.id))||here.find(m=>!state.completed.includes(m.id))||here[here.length-1];}
function act(){return Campaign.actOf(state.completed);}
function diff(){return Campaign.difficulty(state.difficulty);}
// Pay: difficulty, plus the posting station's goodwill. Prices: the docked station's goodwill takes a share off.
function pay(o){const st=o&&o.station?Campaign.standing(state.rep,o.station).bonus:0,f=o&&o.system?frontAt(o.system):null,danger=f?Campaign.FRONT_EFFECTS.danger[f.level]:1;return Math.round(((o&&o.reward)||0)*diff().reward*(1+st)*danger);}
function price(base){const f=frontAt(state.system),k=f?Campaign.FRONT_EFFECTS.prices[f.level]:1;return Math.round(base*(1-Campaign.standing(state.rep,state.system).discount)*k);}
function standingOf(id){return Campaign.standing(state.rep,id);}
function standingText(id){const st=standingOf(id);return `${st.name} (${st.value})${st.discount?` · ${Math.round(st.discount*100)}% off the yard, ${Math.round(st.bonus*100)}% more pay`:''}${st.next?` · ${st.toNext} to ${st.next}`:''}`;}
// Reputation from a result: previewed in the report, applied when the captain closes it.
// Campaign context for staging battles: earlier decisions and the state of the fronts.
function cctx(){return {flags:state.flags,fronts:state.fronts};}
function frontAt(id){return Campaign.frontOf(state.fronts,id);}
// The war: a result moves the region's front, and the act's front slips if neglected. Previewed in reports, applied on closing.
function war(kind,win,system,boss,apply){const r=Campaign.applyBattle(state.fronts,state.frontClock,{kind,win,system,boss,act:Math.min(act(),Campaign.ACTS.length)});if(apply){state.fronts=r.fronts;state.frontClock=r.clock;}return r.changes;}
function warHtml(ch){if(!ch.length)return '';const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);return `<div class="warlog"><small>THE WAR</small>${ch.map(c=>`<div><span><b>${c.region}</b>${c.why==='pushback'?` · ${cap(c.to.foe)} pushed back while you fought elsewhere`:''}</span><span>${c.from.name===c.to.name?`${c.to.value>c.from.value?'ground gained':'ground lost'} · ${c.to.name}`:`${c.from.name} → <b>${c.to.name}</b>`}</span></div>`).join('')}</div>`;}
// Officer and admiral cards: a large portrait, who is speaking, and what they say.
function txCard(person,kicker,text,tone=''){return `<div class="tx ${tone}">${Personnel.portrait(person)}<div><small>${kicker}</small><p>“${text}”</p></div></div>`;}
function harlanCard(text,kicker='FLEET ADMIRAL GIDEON HARLAN · TRANSMISSION'){return txCard(Personnel.harlan,kicker,text,'admiral');}
// Harlan's recorded transmissions (docs/ART-BRIEF.md): voice/harlan-<clip>.mp3 plays with the text when the file exists.
let harlanAudio=null;
function harlanVoice(clip){if(harlanAudio)harlanAudio.pause();harlanAudio=null;if(window.__noVoice)return;const a=new Audio(`voice/harlan-${clip}.mp3`);a.volume=.9;a.addEventListener('error',()=>{if(harlanAudio===a)harlanAudio=null;});a.play().catch(()=>{});harlanAudio=a;}
function harlanQuiet(){if(harlanAudio){harlanAudio.pause();harlanAudio=null;}}
function notesHtml(spec){return spec&&spec.notes&&spec.notes.length?`<div class="notes"><small>WHAT HAS CHANGED</small>${spec.notes.map(n=>`<div>${n}</div>`).join('')}</div>`:'';}
const ORDER_LINES={win:['Clean work, captain. The station will hear about this.','That is one less threat on the lanes. The crew earned their pay today.','Job done. The yards will want to know what we broke this time.'],loss:['We got hurt, captain. The order is still open when we are ready.','That went badly. We regroup, repair, and go back.']};
function gainRep(kind,win,station,system,apply=true){let rep=state.rep;const out=[];for(const [id,d] of Campaign.repChanges(kind,win,station,system)){const before=Campaign.standing(rep,id);rep=Campaign.adjustRep(rep,id,d);const after=Campaign.standing(rep,id);out.push({id,d:after.value-before.value,tier:after.level>before.level?after.name:null});}if(apply)state.rep=rep;return out;}
function repHtml(list){const l=list.filter(x=>x.d);return l.length?`<p>${l.map(x=>`<b>${STATIONS[x.id].name}</b> ${x.d>0?'+':''}${x.d} standing${x.tier?` · now <b>${x.tier}</b>`:''}`).join('<br>')}</p>`:'';}
function actInfo(n=act()){return Campaign.ACTS[Math.min(n,Campaign.ACTS.length)-1];}
const rand=()=>(window.__campaignRandom||Math.random)();
// Orders: station missions and contracts the captain has accepted. Story operations are not orders.
const MAX_ORDERS=4;
function activeOrders(){return [...state.orders.map(id=>Campaign.sideById[id]).filter(Boolean),...state.contracts];}
function ordersAt(id){return activeOrders().filter(o=>o.system===id);}
function orderLabel(o){return o.kind==='side'?'Station mission':Campaign.CONTRACT_TYPES[o.type].label+' contract';}
function docked(){return !!STATIONS[state.system];}
function stationOf(o){return STATIONS[o.station]?.name||'Navy Command';}
function displayName(s){return s?s.name:'Unknown';}
let toastTimer=0;function toast(t){$('notice').textContent=t;$('notice').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('notice').classList.remove('show'),3000);}
const STAGE_W=1600,STAGE_H=900,HOME='meridian';
const REGIONS=['Meridian Core','Kestrel Verge','Red Narrows','Ash Marches','Halcyon Belt','Harrow Expanse'];
const REGION_SUB=['Human Navy territory','Contested space','Pirate influence','Renegade fleet activity','Trade & research','Alien bioship threat'];
const REGION_HUE=[[70,120,255],[255,150,60],[255,60,80],[255,80,160],[120,95,255],[50,230,155]];
const THREATS=['Low','Moderate','High','Severe','Extreme'];
const hue=(k,a)=>`rgba(${REGION_HUE[k].join(',')},${a})`;
const regionOf=s=>REGIONS.indexOf(s.region);
const threatLevel=s=>THREATS.indexOf(s.threat)+1;

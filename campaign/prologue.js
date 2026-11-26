// The prologue: a short film before Fleet Admiral Harlan's Act I briefing, the first time a campaign opens.
// Generated stills with slow camera moves, one drawn shot (the Kestrel beacons going dark) and one generated clip,
// cut to a narration over a score (voice/prologue.mp3, mixed by tools/prologue.sh). Every time below is in seconds
// from the start of that file, which is also the film's clock; without sound the film runs on the wall clock and
// the narration is read from the subtitles. Escape or Skip ends it. Intel replays it.
const PROLOGUE={len:56.6,audio:'voice/prologue.mp3',fade:[54,56.3],title:[50.2,55.4],
 // from/to: [scale, x%, y%] at the start and the end of the shot.
 shots:[
  {id:'reach',at:0,img:'img/prologue/reach.webp',from:[1.2,-2.5,0],to:[1.04,1,0]},
  {id:'settlers',at:10.7,img:'img/prologue/settlers.webp',from:[1.1,2.6,-1],to:[1.1,-2.6,.6]},
  {id:'war',at:19,img:'img/prologue/war.webp',from:[1.04,0,0],to:[1.17,-1.8,1],flicker:true},
  {id:'reserve',at:26.3,img:'img/prologue/reserve.webp',from:[1.14,-3,1],to:[1.06,2,-.5]},
  {id:'corsairs',at:33,img:'img/prologue/corsairs.webp',from:[1.03,0,0],to:[1.13,1.5,-1]},
  {id:'lane',at:37.1,plot:true},
  {id:'resolute',at:44.9,img:'img/prologue/resolute.webp',from:[1.14,1.5,0],to:[1.08,0,0]},
  {id:'departure',at:47.3,video:['video/prologue-departure.webm','video/prologue-departure.mp4'],rate:.8,from:[1.02,0,0],to:[1.02,0,0]}
 ],
 cues:[
  [3,5.3,'They call it the Shattered Reach.'],
  [5.6,10.3,'Broken worlds and long, dark lanes, at the far edge of everything.'],
  [10.8,12,'People came anyway.'],
  [12.3,14.9,'Miners, traders, colonists.'],
  [15.1,18.7,'They strung their stations along the jump lanes, and called it home.'],
  [19,21.7,'The Meridian Navy came out to hold the line for them.'],
  [21.9,26.1,'It fought a war here, and it won a peace that not everyone accepted.'],
  [26.4,28.5,'Fourteen quiet years followed.'],
  [28.7,32.8,'The fleet was cut back, ship by ship, until the watch grew thin.'],
  [33.1,36.9,'Now corsairs hunt the eastern lanes with guns they should not have.'],
  [37.2,39.4,'The far colonies are slow to answer.'],
  [39.6,44.6,'And on the Kestrel run, merchant ships are sailing into the dark, and not coming out.'],
  [45,47.1,'One capital ship is left to answer.'],
  [47.4,49.2,'She is yours.']
 ]};
const PRO_X=.9;   // seconds of cross-fade between shots
let prologue=null;
const proClamp=v=>v<0?0:v>1?1:v;

// Plays the film over the whole stage, then calls done(). Safe to call while it is already playing (restarts it).
function playPrologue(done){if(prologue)stopPrologue();const box=$('prologue'),host=$('proshots');host.innerHTML='';
 const still=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const layers=PROLOGUE.shots.map(s=>{let e;if(s.plot)e=$('proplot');else if(s.video){e=document.createElement('video');e.muted=true;e.playsInline=true;e.preload='auto';for(const src of s.video){const c=document.createElement('source');c.src=src;c.type=src.endsWith('.webm')?'video/webm':'video/mp4';e.appendChild(c);}e.className='proshot';host.appendChild(e);}
  else{e=document.createElement('div');e.className='proshot';e.style.backgroundImage=`url('${s.img}')`;host.appendChild(e);}e.style.opacity=0;return e;});
 const p=prologue={done,layers,still,t:0,last:performance.now(),clock:'held',audio:null,cue:-1,raf:0};
 box.hidden=false;$('prosub').textContent='';$('progate').hidden=true;$('proskip').focus();harlanQuiet();Ambience.level(.2);
 // The film's clock is the soundtrack. With no sound (or sound refused) it runs on the wall clock instead.
 const silent=()=>{if(prologue===p&&p.clock!=='wall'){p.clock='wall';p.last=performance.now();$('progate').hidden=true;}};
 if(window.__noVoice)silent();
 else{const a=p.audio=new Audio(PROLOGUE.audio);a.preload='auto';a.addEventListener('error',silent);a.addEventListener('ended',silent);a.addEventListener('playing',()=>{if(prologue===p&&p.clock!=='wall')p.clock='audio';});
  // Browsers refuse sound until the page has been clicked or a key pressed: wait for one, on a black screen.
  a.play().catch(()=>{if(prologue===p&&p.clock==='held')$('progate').hidden=false;});}
 window.__prologue={get t(){return p.t;},seek(v){p.t=v;if(p.audio&&p.clock==='audio')p.audio.currentTime=v;},get clock(){return p.clock;}};
 p.raf=requestAnimationFrame(prologueTick);}

function prologueBegin(){const p=prologue;if(!p||p.clock!=='held'||!p.audio)return;$('progate').hidden=true;p.audio.play().catch(()=>{p.clock='wall';p.last=performance.now();});}

function prologueTick(now){const p=prologue;if(!p)return;
 if(p.clock==='audio')p.t=Math.max(p.t,p.audio.currentTime);else if(p.clock==='wall')p.t+=Math.min(.1,(now-p.last)/1000);p.last=now;
 if(p.t>=PROLOGUE.len){stopPrologue(true);return;}
 prologueDraw(p,p.t);p.raf=requestAnimationFrame(prologueTick);}

function prologueDraw(p,t){const S=PROLOGUE.shots;
 for(let i=0;i<S.length;i++){const s=S[i],e=p.layers[i],start=s.at,end=i+1<S.length?S[i+1].at:PROLOGUE.len+PRO_X;
  // Each shot fades in over the one before it and stays up until the next has covered it.
  const a=i===0?proClamp(t/2.4):proClamp((t-(start-PRO_X/2))/PRO_X),on=a>0&&t<end+PRO_X/2;
  e.style.opacity=on?a:0;if(!on){if(s.video&&!e.paused)e.pause();continue;}
  const k=p.still?.5:proClamp((t-start+PRO_X/2)/(end-start+PRO_X)),f=s.from||[1,0,0],g=s.to||f,m=j=>f[j]+(g[j]-f[j])*k;
  if(!s.plot)e.style.transform=`scale(${m(0).toFixed(4)}) translate(${m(1).toFixed(3)}%,${m(2).toFixed(3)}%)`;
  if(s.flicker&&!p.still)e.style.filter=`brightness(${(1+.09*Math.max(0,Math.sin(t*23)*Math.sin(t*7.3))).toFixed(3)})`;
  if(s.plot)prologuePlot(e,t-start,end-start,p.still);
  if(s.video){const want=Math.max(0,(t-start)*s.rate);if(e.readyState>=2&&want<(e.duration||9)){e.playbackRate=s.rate;if(Math.abs(e.currentTime-want)>.35)e.currentTime=want;if(e.paused&&!p.still)e.play().catch(()=>{});}}}
 let c=-1;for(let i=0;i<PROLOGUE.cues.length;i++)if(t>=PROLOGUE.cues[i][0]&&t<PROLOGUE.cues[i][1]){c=i;break;}
 if(c!==p.cue){p.cue=c;const el=$('prosub');if(c>=0)el.textContent=PROLOGUE.cues[c][2];el.classList.toggle('on',c>=0);}
 const [t0,t1]=PROLOGUE.title;$('protitle').style.opacity=proClamp((t-t0)/1.6)*(1-proClamp((t-t1)/1));
 $('profade').style.opacity=proClamp((t-PROLOGUE.fade[0])/(PROLOGUE.fade[1]-PROLOGUE.fade[0]));}

// The drawn shot: the Kestrel run as a navigation plot. Beacons run from the foreground to a vanishing point; three
// merchant ships sail up the lane; the far beacons stop answering, the dark comes down the lane and takes the ships.
const PRO_BEACONS=14;
function prologuePlot(cv,t,len,still){const x=cv.getContext('2d'),W=1600,H=900;x.fillStyle='#02050a';x.fillRect(0,0,W,H);
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<260;i++){const sx=rnd()*W,sy=rnd()*H,r=rnd();x.fillStyle=`rgba(190,215,235,${(.12+r*.4).toFixed(2)})`;x.fillRect(sx,sy,r>.93?2:1,r>.93?2:1);}
 const at=u=>{const d=1-1/(1+u*2.6);return [250+(1210-250)*d*1.385,770-(770-300)*d*1.385,1-d*1.385*.86];};   // u 0..1 along the lane
 // Dark reaches beacon i (0 nearest) from the far end; the nearest two keep answering.
 const t0=len*.36,per=(len*.56)/(PRO_BEACONS-2),darkAt=i=>t0+(PRO_BEACONS-1-i)*per,frontier=()=>{let f=1.2;for(let i=PRO_BEACONS-1;i>=2;i--)if(t>=darkAt(i))f=i/(PRO_BEACONS-1);return f;};
 const fr=frontier();let lit=0;
 x.strokeStyle='rgba(140,200,220,.14)';x.lineWidth=1;x.beginPath();const a0=at(0),a1=at(1);x.moveTo(a0[0],a0[1]);x.lineTo(a1[0],a1[1]);x.stroke();
 for(let i=0;i<PRO_BEACONS;i++){const u=i/(PRO_BEACONS-1),[bx,by,sc]=at(u),dark=i>=2&&t>=darkAt(i),fade=dark?Math.max(0,1-(t-darkAt(i))/.5):1;if(!dark)lit++;
  const blink=still?1:.6+.4*Math.sin(t*3.1+i*1.7),r=2+9*sc;
  x.strokeStyle=`rgba(150,205,225,${(.08+.25*fade).toFixed(2)})`;x.beginPath();x.arc(bx,by,r*2.2,0,7);x.stroke();
  if(fade>0){const g=x.createRadialGradient(bx,by,0,bx,by,r*5);g.addColorStop(0,`rgba(130,235,235,${(.9*fade*blink).toFixed(2)})`);g.addColorStop(.25,`rgba(90,200,215,${(.35*fade*blink).toFixed(2)})`);g.addColorStop(1,'rgba(90,200,215,0)');x.fillStyle=g;x.beginPath();x.arc(bx,by,r*5,0,7);x.fill();}}
 for(let j=0;j<3;j++){const u=.1+j*.17+(still?.2:t/len*.62);if(u>=Math.min(1,fr)-.02)continue;const [sx,sy,sc]=at(u),w=5+16*sc;
  x.fillStyle=`rgba(255,214,150,${(.55+.4*sc).toFixed(2)})`;x.beginPath();x.moveTo(sx+w,sy-w*.5);x.lineTo(sx-w*.7,sy-w*.1);x.lineTo(sx-w*.3,sy+w*.55);x.closePath();x.fill();}
 x.font="500 13px 'JetBrains Mono',monospace";x.textBaseline='top';x.fillStyle='rgba(255,255,255,.5)';x.letterSpacing='2.5px';
 x.fillText('KESTREL RUN · LANE BEACONS',96,178);x.fillStyle=lit<PRO_BEACONS?'rgba(255,138,112,.95)':'rgba(255,214,150,.9)';x.fillText(`ANSWERING ${String(lit).padStart(2,'0')} / ${PRO_BEACONS}`,96,202);}

// ended: the film ran to its end (true) or was skipped. Either way the campaign carries on with done().
function stopPrologue(ended){const p=prologue;if(!p)return;prologue=null;cancelAnimationFrame(p.raf);if(p.audio){p.audio.pause();p.audio=null;}
 for(const e of p.layers)if(e.tagName==='VIDEO'){e.pause();e.removeAttribute('src');e.innerHTML='';e.load();}
 $('prologue').hidden=true;$('proshots').innerHTML='';window.__prologue=null;Ambience.level();if(ended!==undefined&&p.done)p.done();}
function skipPrologue(){stopPrologue(false);}

// The opening of an act: Act I is the film and then the briefing; later acts are the briefing alone.
function openAct(n){if(n===1&&!window.__noPrologue)playPrologue(()=>showIntro(1));else showIntro(n);}

$('proskip').addEventListener('click',skipPrologue);$('progate').addEventListener('click',prologueBegin);
window.addEventListener('keydown',e=>{if(prologue&&e.key!=='Escape')prologueBegin();});

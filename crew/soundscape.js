(function(root){
'use strict';
// A quiet synthesised bed for each region of the Reach, so a place can be heard as well as seen. No samples: a few
// low oscillators, a band of filtered noise that swells and fades, and for the machines a far-off ping. It sits under
// the music (battle page) or the ship ambience (campaign page) and follows the same switch.
//
// Indexed like the battle scenery (ENV_BY_REGION in crew/campaign-data.js):
// 0 Meridian Core, 1 Kestrel Verge, 2 Ash Marches, 3 Red Narrows, 4 Halcyon Belt, 5 Harrow Expanse.
// tones: [wave, Hz, level]; air: a noise band {hz, q, level, rate} that breathes at `rate` Hz;
// drift: vibrato on the last tone {rate, cents}; ping: {hz, every} a short high tone every few seconds.
const BEDS=Object.freeze({
 0:{name:'Meridian Core',tones:[['sine',65.4,.5],['sine',98,.32],['sine',130.8,.14]],air:{hz:900,q:.6,level:.05,rate:.04}},
 1:{name:'Kestrel Verge',tones:[['sine',55,.5],['sine',82.4,.34],['sine',123.5,.16]],air:{hz:2400,q:.7,level:.09,rate:.05}},
 2:{name:'Ash Marches',tones:[['sawtooth',41.2,.34],['sawtooth',43.65,.26],['sine',82.4,.14]],cut:260,air:{hz:180,q:.9,level:.3,rate:.11}},
 3:{name:'Red Narrows',tones:[['triangle',49,.5],['triangle',69.3,.3],['sine',98.2,.12]],cut:700,air:{hz:620,q:4,level:.16,rate:.07}},
 4:{name:'Halcyon Belt',tones:[['sine',110,.34],['sine',164.8,.24],['sine',220.6,.16]],air:{hz:5200,q:2,level:.03,rate:.03},ping:{hz:1318.5,every:5.5}},
 5:{name:'Harrow Expanse',tones:[['sine',61.7,.46],['sine',63,.4],['sine',92.5,.22]],air:{hz:420,q:1.6,level:.26,rate:.16},drift:{rate:.3,cents:28}}
});
const idOf=v=>BEDS[v]?Number(v):0;
// The bed for a region name, with the campaign's own table when it is loaded.
function forRegion(region){
 const t=root.BroadsideCampaign&&root.BroadsideCampaign.ENV_BY_REGION;
 return idOf(t&&t[region]);
}

// create(ctx, dest, level): a player on an AudioContext, feeding `dest`. set(id) cross-fades to that region's bed,
// set(null) fades to silence; level(v) scales the whole bed (0..1), e.g. while paused.
function create(ctx,dest,level=.06){
 const out=ctx.createGain();out.gain.value=level;out.connect(dest);
 let noise=null,cur=null,curId=null;
 function noiseBuffer(){
  if(noise)return noise;
  const n=ctx.sampleRate*4,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
  let s=22222;for(let i=0;i<n;i++){s=(s*16807)%2147483647;d[i]=s/1073741823.5-1;}
  return noise=b;
 }
 function build(def){
  const g=ctx.createGain(),lp=ctx.createBiquadFilter(),nodes=[];g.gain.value=0;
  lp.type='lowpass';lp.frequency.value=def.cut||1600;lp.connect(g);g.connect(out);
  const osc=(type,hz)=>{const o=ctx.createOscillator();o.type=type;o.frequency.value=hz;o.start();nodes.push(o);return o;};
  let last=null;
  for(const [type,hz,lv] of def.tones){const o=osc(type,hz),v=ctx.createGain();v.gain.value=lv;o.connect(v);v.connect(lp);last=o;}
  if(def.drift&&last){const l=osc('sine',def.drift.rate),d=ctx.createGain();d.gain.value=def.drift.cents;l.connect(d);d.connect(last.detune);}
  if(def.air){
   const src=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),v=ctx.createGain(),l=osc('sine',def.air.rate),d=ctx.createGain();
   src.buffer=noiseBuffer();src.loop=true;bp.type='bandpass';bp.frequency.value=def.air.hz;bp.Q.value=def.air.q;
   v.gain.value=def.air.level*.55;d.gain.value=def.air.level*.45;l.connect(d);d.connect(v.gain);
   src.connect(bp);bp.connect(v);v.connect(g);src.start();nodes.push(src);
  }
  let timer=null;
  if(def.ping){
   const o=osc('sine',def.ping.hz),v=ctx.createGain();v.gain.value=0;o.connect(v);v.connect(g);
   const fire=()=>{const t=ctx.currentTime+.05;v.gain.cancelScheduledValues(t);v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(.05,t+.02);v.gain.exponentialRampToValueAtTime(.0004,t+1.6);v.gain.setValueAtTime(0,t+1.65);};
   timer=setInterval(fire,def.ping.every*1000);
  }
  return {g,stop(after){if(timer)clearInterval(timer);for(const n of nodes){try{n.stop(ctx.currentTime+after);}catch(e){}}setTimeout(()=>{try{g.disconnect();}catch(e){}},after*1000+200);}};
 }
 function set(id){
  const next=id==null?null:idOf(id);
  if(next===curId)return curId;
  const t=ctx.currentTime;
  if(cur){cur.g.gain.cancelScheduledValues(t);cur.g.gain.setValueAtTime(cur.g.gain.value,t);cur.g.gain.linearRampToValueAtTime(0,t+2.5);cur.stop(2.6);cur=null;}
  curId=next;
  if(next!=null){cur=build(BEDS[next]);cur.g.gain.setValueAtTime(0,t);cur.g.gain.linearRampToValueAtTime(1,t+3.5);}
  return curId;
 }
 return {set,stop(){set(null);},level(v){out.gain.setTargetAtTime(Math.max(0,v),ctx.currentTime,.25);},get id(){return curId;},out};
}
const api=Object.freeze({BEDS,create,forRegion});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BroadsideSoundscape=api;
})(typeof globalThis!=='undefined'?globalThis:this);

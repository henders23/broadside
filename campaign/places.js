// The view from the bridge on arrival: a code-drawn backdrop for each system. Every region has its own kind of sky
// (the Core's lit homeworlds, Kestrel's rock belts, the Ash Marches' ember sun, the wrecks of the Red Narrows, the
// machine relays of Halcyon, the growth of the Harrow Expanse), and a system's id seeds the details, so no two
// arrivals look the same and a system always looks like itself.
// drawPlace(canvas, system, hue): system is a campaign system record, hue its region colour [r,g,b].
function drawPlace(canvas,s,h){
 const g=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
 let seed=1;for(const c of s.id)seed=(seed*131+c.charCodeAt(0))%2147483647;
 const r=()=>(seed=(seed*16807)%2147483647)/2147483647,R=(a,b)=>a+(b-a)*r();
 const tone=(t,a=1)=>`rgba(${h.map(v=>Math.round(v*t)).join(',')},${a})`,light=(t,a=1)=>`rgba(${h.map(v=>Math.round(v+(255-v)*t)).join(',')},${a})`;
 g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.fillStyle='#000';g.fillRect(0,0,W,H);
 // stars
 for(let i=0;i<520;i++){g.fillStyle=`rgba(255,255,255,${(.12+r()*.4).toFixed(2)})`;g.fillRect(Math.round(r()*W),Math.round(r()*H),1,1);}
 for(let i=0;i<70;i++){g.fillStyle=`rgba(${r()<.4?'190,210,255':'255,235,210'},${(.3+r()*.4).toFixed(2)})`;g.fillRect(Math.round(r()*W),Math.round(r()*H),2,2);}
 const glow=(x,y,rad,col0,col1)=>{const q=g.createRadialGradient(x,y,0,x,y,rad);q.addColorStop(0,col0);q.addColorStop(1,col1||'rgba(0,0,0,0)');g.fillStyle=q;g.fillRect(x-rad,y-rad,rad*2,rad*2);};
 // drifting gas: a few soft blots of the region's colour
 const haze=(n,a,x0=700)=>{g.globalCompositeOperation='lighter';for(let i=0;i<n;i++)glow(R(x0,W),R(0,H),R(180,420),tone(R(.5,1),a));g.globalCompositeOperation='source-over';};
 // A world lit from one side. opts: bands (a gas giant), night (city lights on the dark side), cracks (a cinder).
 function planet(cx,cy,rad,opts={}){
  const la=opts.light??R(-2.6,-.6),lx=Math.cos(la),ly=Math.sin(la);
  g.globalCompositeOperation='lighter';glow(cx,cy,rad*1.5,tone(1,.2));g.globalCompositeOperation='source-over';
  g.save();g.beginPath();g.arc(cx,cy,rad,0,7);g.clip();
  const q=g.createRadialGradient(cx+lx*rad*.75,cy+ly*rad*.75,rad*.05,cx+lx*rad*.2,cy+ly*rad*.2,rad*1.45);
  q.addColorStop(0,light(.6));q.addColorStop(.16,tone(1));q.addColorStop(.42,tone(.42));q.addColorStop(.7,tone(.1));q.addColorStop(1,'#020306');
  g.fillStyle=q;g.fillRect(cx-rad,cy-rad,rad*2,rad*2);
  if(opts.bands){g.translate(cx,cy);g.rotate(R(-.5,.5));for(let i=0;i<9;i++){const y=R(-rad,rad),t=R(8,rad*.16);g.fillStyle=r()<.5?`rgba(0,0,0,${R(.05,.2).toFixed(2)})`:light(.5,R(.03,.1));g.fillRect(-rad,y,rad*2,t);}g.setTransform(1,0,0,1,0,0);}
  if(opts.blots)for(let i=0;i<opts.blots;i++){const a=R(0,7),d=Math.sqrt(r())*rad*.9;g.fillStyle=`rgba(0,0,0,${R(.06,.2).toFixed(2)})`;g.beginPath();g.ellipse(cx+Math.cos(a)*d,cy+Math.sin(a)*d,R(20,rad*.3),R(12,rad*.16),R(0,3),0,7);g.fill();}
  if(opts.night)for(let i=0;i<opts.night;i++){const a=la+Math.PI+R(-1.1,1.1),d=R(.25,.92)*rad,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d;g.fillStyle=`rgba(255,${Math.round(R(190,235))},150,${R(.35,.9).toFixed(2)})`;g.fillRect(x,y,r()<.2?2:1,1);if(r()<.18){g.globalCompositeOperation='lighter';glow(x,y,R(5,12),'rgba(255,205,140,.3)');g.globalCompositeOperation='source-over';}}
  if(opts.cracks){g.lineCap='round';g.globalCompositeOperation='lighter';for(let i=0;i<opts.cracks;i++){let a=R(0,7),d=R(.1,.85)*rad,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d,dir=R(0,7);g.beginPath();g.moveTo(x,y);for(let k=0;k<6;k++){dir+=R(-.8,.8);x+=Math.cos(dir)*R(10,34);y+=Math.sin(dir)*R(10,34);g.lineTo(x,y);}g.strokeStyle=`rgba(255,${Math.round(R(90,160))},40,${R(.25,.7).toFixed(2)})`;g.lineWidth=R(.8,2.2);g.stroke();}g.globalCompositeOperation='source-over';}
  g.restore();
  g.strokeStyle=light(.5,.22);g.lineWidth=1.5;g.beginPath();g.arc(cx,cy,rad,la-1.3,la+1.3);g.stroke();
  return {la};
 }
 const moon=(cx,cy,rad,la)=>{const q=g.createRadialGradient(cx+Math.cos(la)*rad*.6,cy+Math.sin(la)*rad*.6,1,cx,cy,rad*1.2);q.addColorStop(0,'#d9dde6');q.addColorStop(.5,'#5d6470');q.addColorStop(1,'#07080b');g.fillStyle=q;g.beginPath();g.arc(cx,cy,rad,0,7);g.fill();};
 // A flattened ring round (cx,cy): `back` draws the far half only, so a planet can be painted between the two halves.
 const ring=(cx,cy,rx,ry,tilt,col,w,half)=>{g.save();g.translate(cx,cy);g.rotate(tilt);g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.ellipse(0,0,rx,ry,0,half==='back'?Math.PI:0,half==='back'?Math.PI*2:half==='front'?Math.PI:Math.PI*2);g.stroke();g.restore();};
 const rock=(x,y,sz,shade)=>{const n=5+Math.floor(r()*3),a0=R(0,7);g.beginPath();for(let k=0;k<n;k++){const a=a0+k/n*6.283,d=sz*R(.65,1);g[k?'lineTo':'moveTo'](x+Math.cos(a)*d,y+Math.sin(a)*d*.8);}g.closePath();g.fillStyle=`rgb(${shade},${shade},${Math.round(shade*1.08)})`;g.fill();g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=1;g.stroke();};
 const px=R(1220,1470),top=r()<.6,py=top?R(-60,230):R(640,900),pr=R(300,440);
 switch(s.region){
  case 'Meridian Core':{   // a settled world: lights on the night side, a ring of yards and traffic in orbit
   haze(3,.05);const tilt=R(-.5,.5),rx=pr*R(1.35,1.6),ry=rx*R(.12,.22);
   ring(px,py,rx,ry,tilt,light(.6,.25),1,'back');
   const p=planet(px,py,pr,{blots:8,night:260});
   ring(px,py,rx,ry,tilt,light(.6,.4),1,'front');
   g.save();g.translate(px,py);g.rotate(tilt);for(let i=0;i<46;i++){const a=R(0,Math.PI),x=Math.cos(a)*rx,y=Math.sin(a)*ry;g.fillStyle=r()<.25?'rgba(255,200,130,.95)':'rgba(190,220,255,.9)';g.fillRect(x,y,2,2);}g.restore();
   if(r()<.7)moon(px-pr*R(1.3,1.7),py+(top?1:-1)*pr*R(.5,.9),R(14,30),p.la);
   break;}
  case 'Kestrel Verge':{   // frontier: a pale world behind a belt of tumbling rock
   haze(4,.06);const p=planet(px,py,pr*.8,{bands:r()<.5,blots:5});
   const cx=R(1050,1250),cy=top?R(520,640):R(240,360),tilt=R(-.35,.2);
   g.save();g.translate(cx,cy);g.rotate(tilt);for(let i=0;i<150;i++){const a=R(0,6.283),rx=R(430,760),x=Math.cos(a)*rx,y=Math.sin(a)*rx*.2+R(-16,16),near=Math.sin(a)>0;rock(x,y,near?R(3,15):R(1.5,6),Math.round(near?R(46,96):R(26,54)));}g.restore();
   if(r()<.5)moon(px+pr*R(.9,1.2),py+(top?1:-1)*pr*R(.7,1),R(12,24),p.la);
   break;}
  case 'Ash Marches':{   // a low red sun, a burnt world cracked with fire, embers on the drift
   const sx=R(980,1180),sy=top?R(620,780):R(120,280);
   g.globalCompositeOperation='lighter';glow(sx,sy,520,'rgba(255,90,40,.5)');glow(sx,sy,150,'rgba(255,210,150,.95)');g.globalCompositeOperation='source-over';
   haze(3,.07);planet(px,py,pr,{light:Math.atan2(sy-py,sx-px),cracks:34,blots:10});
   g.globalCompositeOperation='lighter';for(let i=0;i<150;i++){const x=R(760,W),y=R(0,H);g.fillStyle=`rgba(255,${Math.round(R(110,190))},60,${R(.15,.8).toFixed(2)})`;g.fillRect(x,y,r()<.15?2:1,r()<.15?2:1);}g.globalCompositeOperation='source-over';
   break;}
  case 'Red Narrows':{   // pirate space: dead hulls and broken stations against a crimson band
   g.globalCompositeOperation='lighter';for(let i=0;i<9;i++)glow(R(820,W),(top?560:300)+R(-150,150),R(200,380),tone(R(.5,.9),.11));g.globalCompositeOperation='source-over';
   planet(px,py,pr*.7,{blots:9});
   for(let i=0;i<7;i++){   // wrecks: long broken slabs with a few lights still burning
    const x=R(880,1540),y=R(top?380:120,top?820:520),L=R(60,230),t=R(-1,1),w=L*R(.1,.2);g.save();g.translate(x,y);g.rotate(t);
    g.fillStyle=`rgb(${Math.round(R(14,30))},${Math.round(R(12,22))},${Math.round(R(16,28))})`;g.beginPath();g.moveTo(-L/2,-w/2);g.lineTo(L*R(.1,.3),-w*R(.5,.9));g.lineTo(L/2,-w*R(0,.3));g.lineTo(L*R(.3,.5),w/2);g.lineTo(-L*R(.1,.4),w*R(.5,1));g.lineTo(-L/2,w*R(.1,.4));g.closePath();g.fill();g.strokeStyle='rgba(255,120,120,.16)';g.lineWidth=1;g.stroke();
    for(let k=0;k<3;k++)if(r()<.6){g.fillStyle='rgba(255,70,60,.9)';g.fillRect(R(-L*.4,L*.4),R(-w*.3,w*.3),2,2);}
    g.restore();for(let k=0;k<6;k++)rock(x+R(-L,L),y+R(-70,70),R(1.5,6),Math.round(R(22,44)));
   }
   break;}
  case 'Halcyon Belt':{   // machine space: a cold world ringed by relay arcs, and straight lines of light between nodes
   haze(3,.06);const tilt=R(-.7,.7);
   for(let i=0;i<4;i++)ring(px,py,pr*(1.25+i*.2),pr*(1.25+i*.2)*.2,tilt,light(.55,.28-i*.05),1,'back');
   planet(px,py,pr,{bands:true});
   for(let i=0;i<4;i++)ring(px,py,pr*(1.25+i*.2),pr*(1.25+i*.2)*.2,tilt,light(.55,.42-i*.07),i?1:1.6,'front');
   const nodes=[];for(let i=0;i<9;i++)nodes.push([R(860,1560),R(top?360:60,top?860:560)]);
   g.lineWidth=1;for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(Math.hypot(nodes[i][0]-nodes[j][0],nodes[i][1]-nodes[j][1])<330){g.strokeStyle=light(.5,.16);g.beginPath();g.moveTo(...nodes[i]);g.lineTo(...nodes[j]);g.stroke();}
   g.globalCompositeOperation='lighter';for(const [x,y] of nodes){glow(x,y,14,light(.7,.6));g.fillStyle='#fff';g.fillRect(x-1,y-1,2,2);}g.globalCompositeOperation='source-over';
   break;}
  default:{   // the Harrow Expanse: green murk, a world being overgrown, tendrils and spores
   haze(7,.09,600);const p=planet(px,py,pr,{blots:14});
   g.lineCap='round';
   for(let i=0;i<13;i++){const a=R(0,6.283),x0=px+Math.cos(a)*pr*.92,y0=py+Math.sin(a)*pr*.92,L=R(120,380),b=a+R(-.9,.9),x1=x0+Math.cos(b)*L,y1=y0+Math.sin(b)*L,c=a+R(-1.6,1.6);
    g.beginPath();g.moveTo(x0,y0);g.quadraticCurveTo(x0+Math.cos(c)*L*.6,y0+Math.sin(c)*L*.6,x1,y1);g.strokeStyle=tone(.55,.5);g.lineWidth=R(2,7);g.stroke();g.strokeStyle=light(.4,.3);g.lineWidth=1;g.stroke();
    g.globalCompositeOperation='lighter';glow(x1,y1,R(8,18),light(.5,.5));g.globalCompositeOperation='source-over';}
   g.globalCompositeOperation='lighter';for(let i=0;i<190;i++){const x=R(700,W),y=R(0,H);g.fillStyle=light(.4,R(.12,.6));g.fillRect(x,y,r()<.12?2:1,r()<.12?2:1);}g.globalCompositeOperation='source-over';
   void p;
  }
 }
}

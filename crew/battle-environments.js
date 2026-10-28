(function(root){'use strict';
// Reusable 3D mission scenery. Decorative meshes are deliberately non-colliding.
const PRESETS={
  0:{name:'Open Space',blue:[.02,.055,.085],red:[.09,.022,.045],sun:[1,.72,.42],rock:0x6d655d,fog:0},
  1:{name:'Kestrel Transit Corridor',blue:[.045,.11,.19],red:[.04,.03,.04],sun:[.9,.9,1.1],rock:0x576f82,fog:.000012},
  2:{name:'The Cinder Wake',blue:[.047,.022,.03],red:[.23,.072,.025],sun:[1.5,.55,.25],rock:0x704c43,fog:.000045},
  3:{name:'Red Narrows Ruins',blue:[.024,.014,.027],red:[.20,.03,.058],sun:[1.2,.40,.29],rock:0x6b3c48,fog:.000032},
  4:{name:'Halcyon Ghost Relay',blue:[.035,.11,.19],red:[.06,.035,.13],sun:[.4,.95,1.6],rock:0x456577,fog:.000021},
  5:{name:'Harrow First Bloom',blue:[.02,.12,.07],red:[.058,.15,.06],sun:[.52,1.4,.78],rock:0x36584d,fog:.000028}
};
function create({THREE,scene,sky,planet,rockMat,rebakeSky}){
  const savedFog=scene.fog,savedPlanet=planet.position.clone(),savedRock=rockMat.color.clone();
  let group=null,gate=null;const geometries=[],materials=[],ships=[];
  function material(hex,glow=0){const m=new THREE.MeshStandardMaterial({color:hex,roughness:.42,metalness:.62,emissive:glow,emissiveIntensity:glow?.72:0});materials.push(m);return m;}
  function add(geometry,paint,parent=group){geometries.push(geometry);const o=new THREE.Mesh(geometry,paint);parent.add(o);return o;}
  function cube(parent,x,y,z,w,h,d,paint){const o=add(new THREE.BoxGeometry(w,h,d),paint,parent);o.position.set(x,y,z);return o;}
  function hoop(parent,x,y,z,r,paint){const o=add(new THREE.TorusGeometry(r,10,8,48),paint,parent);o.position.set(x,y,z);return o;}
  function station(x,y,z,color){
    const body=material(0x35404c),edge=material(0x82929e),lit=material(color,color);
    const g=new THREE.Group();g.position.set(x,y,z);group.add(g);
    cube(g,0,0,0,72,72,430,body);cube(g,0,0,0,46,270,130,edge);
    hoop(g,0,0,0,260,edge);hoop(g,0,0,-12,240,lit);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      const p=cube(g,260*Math.cos(a),260*Math.sin(a),0,35,35,105,body);p.rotation.z=a;
    }
    for(const x2 of [-160,160])for(const y2 of [-82,82]){
      const p=cube(g,x2,y2,0,175,12,230,body);p.rotation.z=y2>0?.16:-.16;
      cube(g,x2,y2+8,0,156,3,200,lit);
    }
    return g;
  }
  function sceneKestrel(){
    station(-3400,180,-2850,0x4e9de3);
    jumpGate();
  }
  // The illuminated jump beacon an escorted convoy has to reach (crew/fleet-controller.js GATE).
  function jumpGate(){
    const m=material(0x486078),lit=material(0x82cfea,0x139fff),amber=material(0xb7a17c,0x7d4c1d);
    const p=new THREE.Group();p.position.set(570,0,-1550);group.add(p);gate=p;
    hoop(p,0,0,0,308,lit);hoop(p,0,0,-20,274,amber);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,c=cube(p,315*Math.cos(a),315*Math.sin(a),0,24,36,108,m);c.rotation.z=a;}
    const beacon=new THREE.PointLight(0x4ba8ff,400,1800);p.add(beacon);
  }
  function sceneCinder(){
    station(3700,120,-3700,0xcc5933);
    const hull=material(0x40373e),burnt=material(0x1a2025),flame=material(0xe3945c,0xce4727);
    for(let i=0;i<25;i++){
      const x=2600+Math.sin(i*6.1)*1250,y=Math.sin(i*3.3)*550,z=-2900+Math.cos(i*10.7)*1300;
      const p=cube(group,x,y,z,85+(i%4)*50,12+(i%3)*25,160+(i%5)*85,i%7===0?flame:i%3===0?burnt:hull);
      p.rotation.set(i*.7,i*.44,i*1.3);
    }
    const light=new THREE.PointLight(0xf58742,950,3300);light.position.set(3000,150,-2700);group.add(light);
  }
  function sceneNarrows(){
    station(-3300,380,-3700,0xd45656);
    const stone=material(0x44313a),edge=material(0x7e3645,0x5a171c);
    for(let i=0;i<12;i++){
      const side=i%2?-1:1;
      const o=add(new THREE.CylinderGeometry(17,105,900+(i%4)*170,6),i%3?stone:edge);
      o.position.set(side*(2400+i%3*260),-70,-5100+i*650);o.rotation.z=side*.2;
    }
  }
  function sceneRelay(){
    station(3300,200,-3300,0x49c1ff);
    const neon=material(0x8ee4fc,0x298aff);
    for(const z of [-210,-70,70,210]){
      const o=hoop(group,3260,180,-3300+z,370,neon);o.rotation.y=.2;
    }
    const light=new THREE.PointLight(0x4f8eff,800,2700);light.position.set(2800,300,-3000);group.add(light);
  }
  function sceneBloom(){
    const membrane=material(0x4b7358,0x1c503c),core=material(0x88b998,0x36b976);
    for(let i=0;i<11;i++){
      const a=i*Math.PI/5.5,x=3000+580*Math.cos(a),z=-2800+520*Math.sin(a);
      const o=add(new THREE.ConeGeometry(60,600+(i%3)*130,7),membrane);
      o.position.set(x,150,z);o.rotation.z=Math.sin(a)*.3;
      const bulb=add(new THREE.IcosahedronGeometry(75+i%3*18,1),core);
      bulb.position.set(x,470,z);
    }
    const light=new THREE.PointLight(0x4fdb8d,700,2600);light.position.set(3000,250,-2800);group.add(light);
  }
  function buildFreighter(ship){
    if(!ship?.body)return;
    const hull=material(0x5c6773),cargo=material(0x778794),dark=material(0x243746),stripe=material(0xd0a56f,0x43321d),drive=material(0x80d9f6,0x219bed);
    const g=new THREE.Group();g.name='Peregrine civilian modular freighter';ship.body.add(g);ships.push(g);
    ship.model.visible=false;
    cube(g,0,0,0,66,40,248,hull);
    cube(g,0,28,-62,43,24,82,dark);cube(g,0,42,-85,35,7,30,drive);
    for(const x of [-56,56]){
      cube(g,x,-5,5,45,39,160,cargo);
      for(let z=-60;z<82;z+=35)cube(g,x,17,z,47,5,5,stripe);
      cube(g,x,-15,106,30,28,60,dark);hoop(g,x,-15,135,17,drive);
    }
    for(let z=-95;z<105;z+=40)cube(g,0,-26,z,60,5,7,stripe);
  }
  function clear(){
    if(group){scene.remove(group);group=null;}gate=null;
    for(const s of ships)s.removeFromParent();ships.length=0;
    for(const g of geometries)g.dispose();geometries.length=0;
    for(const m of materials)m.dispose();materials.length=0;
    scene.fog=savedFog;rockMat.color.copy(savedRock);
  }
  function configure(id,opts={}){
    clear();const preset=PRESETS[id]||PRESETS[0];
    for(const [key,values] of [['nebBlue',preset.blue],['nebRed',preset.red],['sunTint',preset.sun]])
      if(sky.material.uniforms[key])sky.material.uniforms[key].value.set(...values);
    rockMat.color.setHex(preset.rock);
    planet.position.copy(savedPlanet);
    if(id===2||id===5)planet.position.x*=-1;
    if(id===4)planet.position.y=7000;
    scene.fog=preset.fog?new THREE.FogExp2(preset.rock,preset.fog):savedFog;
    if(id||opts.gate){
      group=new THREE.Group();group.name=preset.name;scene.add(group);
      if(id===1)sceneKestrel();else if(id===2)sceneCinder();else if(id===3)sceneNarrows();else if(id===4)sceneRelay();else if(id===5)sceneBloom();
      if(opts.gate&&id!==1)jumpGate();
    }
    rebakeSky();return preset.name;
  }
  // A compromised beacon (crew/fleet-controller.js, the divert twist): the gate moves to the auxiliary beacon.
  function moveGate(p){if(gate)gate.position.set(p.x,p.y,p.z);return !!gate;}
  return {configure,clear,buildFreighter,moveGate};
}
root.BroadsideEnvironments=Object.freeze({create,PRESETS});
})(window);

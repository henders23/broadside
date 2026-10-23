'use strict';
// Three.js-free lifecycle regression test for battle scenery (node tests/environment.test.js).
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Vector3{
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
 clone(){return new Vector3(this.x,this.y,this.z)}
 copy(p){return this.set(p.x,p.y,p.z)}
}
class Color{
 constructor(hex=0){this.hex=hex}
 clone(){return new Color(this.hex)}
 copy(c){this.hex=c.hex;return this}
 setHex(hex){this.hex=hex;return this}
}
class Obj{
 constructor(){this.position=new Vector3();this.rotation={x:0,y:0,z:0};this.children=[];this.parent=null;this.visible=true}
 add(o){this.children.push(o);o.parent=this;return this}
 remove(o){this.children=this.children.filter(c=>c!==o);o.parent=null;return this}
 removeFromParent(){this.parent?.remove(this)}
}
class Mesh extends Obj{constructor(geo,mat){super();this.geometry=geo;this.material=mat}}
class Geo{constructor(...args){this.args=args}dispose(){this.disposed=true}}
class Mat{constructor(p){Object.assign(this,p)}dispose(){this.disposed=true}}
class FogExp2{constructor(color,density){this.color=color;this.density=density}}
const THREE={Vector3,Mesh,Group:Obj,PointLight:Obj,MeshStandardMaterial:Mat,
 BoxGeometry:Geo,TorusGeometry:Geo,CylinderGeometry:Geo,ConeGeometry:Geo,IcosahedronGeometry:Geo,FogExp2};
const context={window:{}};vm.runInNewContext(fs.readFileSync('crew/battle-environments.js','utf8'),context);
const {create,PRESETS}=context.window.BroadsideEnvironments;
assert.equal(Object.keys(PRESETS).length,6);
const scene=new Obj(),planet=new Obj(),rockMat={color:new Color(0x6d655d)};
const sky={material:{uniforms:{nebBlue:{value:new Vector3()},nebRed:{value:new Vector3()},sunTint:{value:new Vector3()}}}};
let baked=0;const env=create({THREE,scene,sky,planet,rockMat,rebakeSky:()=>baked++});
for(let i=0;i<=5;i++){
 assert.equal(env.configure(i),PRESETS[i].name);
 assert.equal(scene.children.length,i===0?0:1);
 assert.equal(rockMat.color.hex,PRESETS[i].rock);
}
const ship={body:new Obj(),model:{visible:true}};
env.buildFreighter(ship);
assert.equal(ship.model.visible,false);assert.ok(ship.body.children.length>0);
env.configure(0);assert.equal(ship.body.children.length,0);
assert.equal(scene.children.length,0);assert.equal(baked,8);
env.clear();
console.log('All six battle environment presets and scene reset passed.');

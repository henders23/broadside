// The shipyard's 3D view of the selected ship (three.js), drawn into the yard canvas.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Side-on view of the flagship for the shipyard. Scale, rotation and finish match CLASSES and lookMaterial in index.html.
const LOOK = { bastion: { scale: 300, rotY: Math.PI, rough: 0.45, metal: 0.55 }, halberd: { scale: 265, rotY: Math.PI / 2 }, sabre: { scale: 286, rotY: Math.PI }, warden: { scale: 320, rotY: Math.PI },
  scrapjaw: { scale: 255, rotY: Math.PI }, seraph: { scale: 280, rotY: Math.PI }, revenant: { scale: 320, rotY: 0 } };
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const V3 = THREE.Vector3, models = {}, v = new V3();
let renderer = null, scene, cam, hold, canvas, current = null, points = [], onFrame = null, raf = 0, size = [0, 0, 0], active = false;
let showReq = 0; const loaded = {};

function init(c) {
  canvas = c;
  renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
  const key = new THREE.DirectionalLight(0xfff1dc, 3.2); key.position.set(600, 700, -500);
  const rim = new THREE.DirectionalLight(0x7fb6ff, 2.4); rim.position.set(-500, 250, 700);
  const fill = new THREE.DirectionalLight(0x9aa8c0, 0.5); fill.position.set(300, -500, 200);
  hold = new THREE.Group(); scene.add(key, rim, fill, hold);
  cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 5000);
}
function model(k) {
  const L = LOOK[k] || LOOK.bastion;
  return models[k] || (models[k] = new Promise((res, rej) => loader.load('models/' + (LOOK[k] ? L.file || k : 'bastion') + '.glb', g => {
    const root = g.scene, wrap = new THREE.Group(); wrap.add(root);
    root.position.sub(new THREE.Box3().setFromObject(wrap).getCenter(new V3()));
    wrap.scale.setScalar(L.scale); wrap.rotation.y = L.rotY;
    if (L.rough) root.traverse(o => { if (o.isMesh) { o.material.metalness *= L.metal; o.material.roughness = Math.max(o.material.roughness, 0.55); } });
    if (L.tint) root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiply(new THREE.Color().fromArray(L.tint)); } });
    res(wrap);
  }, undefined, e => { delete models[k]; rej(e); })));
}
// Frame the whole hull side-on from starboard, bow to the right.
function fit(w, h) {
  hold.rotation.set(0, 0, 0); hold.position.set(0, 0, 0); hold.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(current), bc = box.getCenter(new V3()), bs = box.getSize(new V3());
  const halfW = Math.max(bs.z / 2 * 1.04, bs.y / 2 * 1.1 * w / h), halfH = halfW * h / w;
  Object.assign(cam, { left: -halfW, right: halfW, top: halfH, bottom: -halfH });
  cam.position.set(bc.x + 2000, bc.y, bc.z); cam.lookAt(bc.x, bc.y, bc.z); cam.updateProjectionMatrix();
}
function frame(t) {
  raf = requestAnimationFrame(frame);
  const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
  const pr = Math.min(2, (window.devicePixelRatio || 1) * (canvas.getBoundingClientRect().width / w || 1));
  if (size[0] !== w || size[1] !== h || size[2] !== pr) { size = [w, h, pr]; renderer.setPixelRatio(pr); renderer.setSize(w, h, false); fit(w, h); }
  hold.rotation.y = Math.sin(t * 0.00025) * 0.03; hold.position.y = Math.sin(t * 0.0004) * 1.2; hold.updateMatrixWorld();
  renderer.render(scene, cam);
  if (onFrame) onFrame(points.map(p => { v.set(p[0], p[1], p[2]).applyMatrix4(hold.matrixWorld).project(cam); return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h]; }));
}
window.BroadsideShipView = {
  // Switching ships loads another model; only the latest request wins, and the old hull is hidden meanwhile.
  async show(c, k, pts, cb) {
    active = true; const req = ++showReq;
    if (!renderer) init(c);
    if (current && current !== loaded[k]) { hold.visible = false; onFrame = null; }
    const m = await model(k);
    if (!active || req !== showReq) return;
    loaded[k] = m; points = pts; onFrame = cb; hold.visible = true;
    if (current !== m) { if (current) hold.remove(current); hold.add(m); current = m; size = [0, 0, 0]; }
    if (!raf) raf = requestAnimationFrame(frame);
  },
  hide() { active = false; cancelAnimationFrame(raf); raf = 0; onFrame = null; }
};
window.dispatchEvent(new Event('shipviewready'));

'use strict';
// The first-battle tutorial (crew/tutorial.js): steps finish when the captain does what they teach.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('crew/tutorial.js','utf8'),ctx);
const T=ctx.window.BroadsideTutorial;
const pips0={eng:4,shd:4,wpn:4},base={step:3,rudder:0,focus:-1,pips:{...pips0},pips0,broadside:false,uses:0};
assert.equal(T.STEPS.map(s=>s.id).join(),'throttle,rudder,shields,power,broadside,officers,go');

const t=T.create({ship:'MNS Resolute',enemy:'Captain Kora Vex',convoy:'MV Peregrine'});
assert.equal(t.step.n,1);assert.match(t.step.text,/MNS Resolute/);assert.ok(t.holdFire,'hostiles hold fire at the start');
let s={...base};
assert.equal(t.update(s,.5),false);
s.step=4;assert.equal(t.update(s,.1),true);assert.equal(t.step.id,'rudder');
s.rudder=.6;t.update(s,1);assert.equal(t.step.id,'rudder','the rudder has to stay set for a moment');t.update(s,.6);assert.equal(t.step.id,'shields');
s.focus=0;t.update(s,.1);assert.equal(t.step.id,'power');
s.pips={eng:3,shd:4,wpn:5};t.update(s,.1);assert.equal(t.step.id,'broadside');assert.ok(t.holdFire);
s.broadside=true;t.update(s,.1);assert.equal(t.step.id,'officers');assert.equal(t.holdFire,false,'the shooting starts after the first broadside');
s.uses=1;t.update(s,.1);assert.equal(t.step.id,'go');assert.match(t.step.text,/MV Peregrine/);
t.update(s,5);assert.equal(t.finished,false);t.update(s,4.5);assert.equal(t.finished,true);assert.equal(t.step,null);

// Hostiles do not wait for ever, and a skipped tutorial lets them fire at once.
const u=T.create({});u.update(base,T.HOLD_MAX+1);assert.equal(u.holdFire,false);
const v=T.create({});v.skip();assert.equal(v.finished,true);assert.equal(v.holdFire,false);
assert.equal(T.wanted({}),true);assert.equal(T.wanted({completed:[1,2]}),false,'a campaign already under way');assert.equal(T.wanted({completed:[1,2],tutorial:'again'}),true);assert.equal(T.wanted({tutorial:'again'}),true);assert.equal(T.wanted({tutorial:'done'}),false);assert.equal(T.wanted(null),false);
console.log('Tutorial tests passed ('+T.STEPS.length+' steps).');

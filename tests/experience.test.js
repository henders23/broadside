'use strict';
// Bridge-officer experience rules and their battle effects (node tests/experience.test.js).
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={document:{getElementById:()=>null}};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['crew/personnel.js','crew/experience.js','crew/bridge-controller.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const X=ctx.BroadsideExperience,P=ctx.BroadsidePersonnel;

assert.equal(X.levelOf(0),1);assert.equal(X.levelOf(99),1);assert.equal(X.levelOf(100),2);assert.equal(X.levelOf(699),4);assert.equal(X.levelOf(5000),5);
const p=X.progress({xp:175,battles:2,uses:3});
assert.equal(p.rank,'Seasoned');assert.equal(p.next,'Veteran');assert.equal(p.toNext,75);assert.equal(p.fraction,0.5);
assert.equal(X.progress(undefined).level,1,'officers without a record start as Regulars');
assert.equal(X.progress({xp:800}).max,true);

// One engagement: a win with two Brace orders and five Target Solutions (uses count up to three).
const r=X.award(undefined,'win',{varro:2,okoye:5});
const g=Object.fromEntries(r.gains.map(x=>[x.id,x]));
assert.equal(g.varro.gained,90);assert.equal(g.okoye.gained,105);assert.equal(g.vale.gained,60);
assert.equal(r.officers.okoye.uses,5);assert.equal(r.officers.renn.battles,1);
assert.equal(g.okoye.promoted,true,'105 XP after one engagement is Seasoned');assert.equal(g.varro.promoted,false);
assert.equal(X.award(r.officers,'loss',{}).gains.find(x=>x.id==='varro').promoted,true,'90 + 30 XP crosses into Seasoned');
assert.equal(X.award(undefined,'loss',null).gains[0].gained,30);

// Rank scales strength and cooldown, and the text matches.
const varro=P.crew.find(c=>c.id==='varro');
assert.equal(X.cooldown(varro,1),100);assert.equal(X.cooldown(varro,5),80);
assert.equal(X.effect(varro,1),varro.effect,'Regular text matches the personnel file');
assert.match(X.effect(varro,5),/Restore 21% of each/);

// The bridge controller applies ranks in battle and counts uses.
const ship=()=>({alive:true,sh:[0,0,0,0],cap:[1000,1000,1000,1000],C:{shield:1000},sub:{engines:50,shields:100},fires:[]});
const plain=ctx.BroadsideBridge.create({player:ship(),enemy:ship(),showMsg:()=>{},facings:['F','A','P','S']});
const player=ship(),ace=ctx.BroadsideBridge.create({player,enemy:ship(),showMsg:()=>{},facings:['F','A','P','S'],levels:{varro:5,okoye:5,vale:5,sato:5}});
assert.equal(plain.activate('varro'),true);assert.equal(plain.cooldown.varro,100);
assert.equal(ace.activate('varro'),true);assert.ok(Math.abs(player.sh[0]-1000*0.16*1.32)<1e-6,'Ace Brace restores 21.1%');assert.equal(ace.cooldown.varro,80);
ace.activate('okoye');ace.activate('sato');
assert.ok(Math.abs(ace.attackMultiplier()-(1+0.12*1.32))<1e-9);assert.ok(Math.abs(ace.defenseMultiplier()-(1-0.22*1.32))<1e-9);
assert.equal(ace.activate('vale'),true);assert.ok(Math.abs(player.sub.engines-(50+24*1.32))<1e-9);
assert.equal(ace.activate('varro'),false,'cooldown still applies');
assert.equal(ace.uses.varro,1);assert.equal(ace.uses.okoye,1);assert.equal(ace.uses.renn,0);
console.log('Officer experience rules passed.');

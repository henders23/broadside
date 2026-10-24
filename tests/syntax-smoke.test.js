'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
for(const name of ['crew/personnel.js','crew/bridge-controller.js','crew/fleet-controller.js','crew/battle-environments.js','crew/upgrades.js','crew/experience.js','crew/campaign-data.js','crew/codex.js']){
  const code=fs.readFileSync(name,'utf8');
  new Function(code);
}
for(const name of ['index.html','campaign.html']){
  const html=fs.readFileSync(name,'utf8');
  const scripts=[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)];
  for(const [,raw] of scripts){
    if(raw.includes('"imports"'))continue;
    const code=raw.split('\n').filter(line=>!line.trim().startsWith('import ')).join('\n');
    if(code.trim())new Function(code);
  }
}
for(const name of ['sable','cantor']){
  const asset=fs.readFileSync('img/commanders/'+name+'.svg','utf8');
  assert.match(asset,/<svg\s/);
  assert.match(asset,/<\/svg>/);
}
// Vex and Thorne use painted portraits; each must be a WebP image (RIFF....WEBP header).
for(const name of ['vex','thorne']){
  const head=fs.readFileSync('img/commanders/'+name+'.webp').subarray(0,12).toString('latin1');
  assert.ok(head.startsWith('RIFF')&&head.endsWith('WEBP'),name+'.webp is a WebP image');
}
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/fleet\.onDestroyed\(s\)/);
assert.match(html,/battleEnvironment\.configure\(campaignMission \? campaignMission\.env/);
assert.match(html,/crew\/campaign-data\.js/);
assert.match(fs.readFileSync('campaign.html','utf8'),/crew\/campaign-data\.js/);
assert.match(html,/escort-hold/);
assert.match(html,/fleet\?\.tick\(dt\)/);
assert.match(html,/getTarget:\(\)=>player\.target/);
assert.match(html,/if\(k==='KeyJ'&&fleet\)/);
console.log('Static browser-syntax and fleet integration smoke tests passed.');

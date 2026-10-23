'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
for(const name of ['crew/personnel.js','crew/bridge-controller.js','crew/fleet-controller.js','crew/battle-environments.js','crew/upgrades.js']){
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
for(const name of ['vex','sable','thorne','cantor']){
  const asset=fs.readFileSync('img/commanders/'+name+'.svg','utf8');
  assert.match(asset,/<svg\s/);
  assert.match(asset,/<\/svg>/);
}
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/fleet\.onDestroyed\(s\)/);
assert.match(html,/battleEnvironment\.configure\(campaignMissionId\)/);
assert.match(html,/escort-hold/);
assert.match(html,/fleet\?\.tick\(dt\)/);
assert.match(html,/getTarget:\(\)=>player\.target/);
assert.match(html,/if\(k==='KeyJ'&&fleet\)/);
console.log('Static browser-syntax and fleet integration smoke tests passed.');

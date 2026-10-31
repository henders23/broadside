// Run with: node tests/portrait-coverage.mjs
import { readFileSync,existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import vm from 'node:vm';
const root={};vm.runInNewContext(readFileSync(new URL('../crew/personnel.js',import.meta.url),'utf8'),{window:root});
const P=root.BroadsidePersonnel;
const css=readFileSync(new URL('../crew/personnel.css',import.meta.url),'utf8');
assert.equal(P.ART.length,25,'25 photographic tiles expected');
assert.ok(existsSync(new URL('../img/commanders/portrait-atlas-v2.webp',import.meta.url)),'generated atlas must be committed');
for(const person of [...P.crew,...P.recruits,...Object.values(P.commanders)]){
 const id=P.photoId(person),html=P.portrait(person);
 assert.ok(P.ART.includes(id),'missing character '+person.name);
 assert.ok(html.includes('art-'+id),'portrait renderer did not add photograph for '+person.name);
 assert.ok(css.includes('.art-'+id+'{background-position:'),'missing CSS atlas position for '+person.name);
}
for(const faction of ['Corsair','Ash Fleet','Directorate','Wraith','Meridian Navy']){
 const x={name:'Generated Rival 42',faction};
 assert.ok(P.portrait(x).includes('art-'+P.photoId(x)),'procedural character still shows initials for '+faction);
 assert.equal(P.photoId(x),P.photoId({...x}),'fallback portraits should be stable');
}
assert.ok(P.portrait({id:'post-replacement',name:'Ensign Ada Example',initials:'AE'}).includes('art-ensign-'),'replacement officers must have faces');
console.log('Portrait coverage: 20 named identities and procedural fallbacks verified.');

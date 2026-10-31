// Shared character identities, portrait metadata, battlefield orders, and narrative dialogue.
// Loaded by both the campaign map and the main battle renderer.
(function (root) {
  'use strict';
  const crew = [
    {id:'varro', name:'Ensign Elise Varro', given:'Elise Varro', short:'Varro', rank:'Ensign', post:'First Officer', portrait:0,
      bio:'Varro has survived two failed evacuations. She distrusts grand gestures and specialises in keeping the bridge functional during disasters.',
      ability:'Brace', key:'5', cooldown:100, duration:0,
      effect:'Restore 16% of each directional shield bank immediately.',
      voice:'All stations, brace. Shield reserves committed.'},
    {id:'okoye',name:'Ensign Imani Okoye',given:'Imani Okoye',short:'Okoye',rank:'Ensign',post:'Tactical Officer',portrait:1,
      bio:'A gifted gunnery officer who trusts measured trajectories more than heroic instincts. She is exceptionally good at recognising target weaknesses.',
      ability:'Target Solution',key:'6',cooldown:110,duration:14,
      effect:'Weapons deal 12% more damage for 14 seconds.',
      voice:'Firing solution locked. Concentrate your batteries.'},
    {id:'vale',name:'Petty Officer Tomas Vale',given:'Tomas Vale',short:'Vale',rank:'Petty Officer',post:'Chief Engineer',portrait:2,
      bio:'Vale rebuilt the Resolute after the Outer Dock disaster. His improvised fixes keep systems fighting long after they should have failed.',
      ability:'Damage Control',key:'7',cooldown:125,duration:0,
      effect:'Restore 24 integrity to the worst damaged subsystem and suppress one onboard fire.',
      voice:'Repair crews are on it. Give me thirty seconds and a miracle.'},
    {id:'sato',name:'Ensign Nara Sato',given:'Nara Sato',short:'Sato',rank:'Ensign',post:'Helm Officer',portrait:3,
      bio:'Once a frontier courier pilot, Sato knows exactly how late a ship can turn before it is committed to a collision course.',
      ability:'Evasive Pattern',key:'8',cooldown:105,duration:12,
      effect:'Reduce incoming damage by 22% for 12 seconds.',
      voice:'Evasive pattern running. Hold onto something.'},
    {id:'renn',name:'Ensign Idris Renn',given:'Idris Renn',short:'Renn',rank:'Ensign',post:'Intelligence Officer',portrait:4,
      bio:'Renn recognised the repeating transponder signatures on the frontier. His analytical instincts are stronger than his confidence.',
      ability:'Threat Scan',key:'9',cooldown:80,duration:0,
      effect:'Identify the weakest enemy shield facing and most damaged subsystem.',
      voice:'I have a partial target profile. Transmitting vulnerabilities.'}
  ];
  // Officers for hire at starbases. Each serves at one of the five posts in place of its regular officer
  // (`post` is that officer's id) and brings a different battle command. `rep` is the standing level required
  // at the hiring station (1 Friendly, 2 Trusted); `startXp` is the experience they arrive with.
  const recruits = [
    {id:'adeyemi',name:'Yusuf Adeyemi',given:'Yusuf Adeyemi',short:'Adeyemi',post:'varro',postName:'First Officer',initials:'YA',station:'meridian',cost:520,rep:1,startXp:100,
      bio:'Adeyemi held the bridge of a burning frigate for nine hours at the Outer Dock. He believes a crew that is told the truth will do anything.',
      ability:'Rally the Crew',cooldown:140,duration:0,effect:'Restore 6% of the hull and 10 integrity to every subsystem.',
      voice:'All hands, damage-control stations. We are not finished.'},
    {id:'fenn',name:'Dario Fenn',given:'Dario Fenn',short:'Fenn',post:'okoye',postName:'Tactical Officer',initials:'DF',station:'peregrine',cost:480,rep:1,startXp:100,
      bio:'A merchant-marine gunner who learned his trade fighting off raiders on the eastern spur. He does not wait for a firing solution; he makes one.',
      ability:'Overcharge',cooldown:120,duration:0,effect:'Every weapon and torpedo tube reloads at once.',
      voice:'Bypassing the safeties. Every gun, ready now.'},
    {id:'osei',name:'Ama Osei',given:'Ama Osei',short:'Osei',post:'vale',postName:'Chief Engineer',initials:'AO',station:'tarn',cost:450,rep:0,startXp:100,
      bio:'Osei ran the Tarn repair yards for eleven years. She can patch a hull breach with whatever is in reach, and frequently does.',
      ability:'Hull Patch',cooldown:150,duration:0,effect:'Restore 12% of the hull.',
      voice:'Sealing the breaches. Hold her steady for me.'},
    {id:'marlow',name:'Kit Marlow',given:'Kit Marlow',short:'Marlow',post:'sato',postName:'Helm Officer',initials:'KM',station:'juniper',cost:420,rep:1,startXp:0,
      bio:'A Juniper ring pilot who has flown every lane in the Halcyon Belt, most of them faster than the port authority allows.',
      ability:'Burn Hard',cooldown:90,duration:0,effect:'Refuel the afterburner and restore 30 engine integrity.',
      voice:'Hang on to something. We are leaving.'},
    {id:'achterberg',name:'Soren Achterberg',given:'Soren Achterberg',short:'Achterberg',post:'renn',postName:'Intelligence Officer',initials:'SA',station:'elysia',cost:560,rep:1,startXp:100,
      bio:'An Elysia signals scientist who spent six years listening to the Halcyon relay. He knows how the machines talk to their missiles.',
      ability:'Jamming Field',cooldown:100,duration:0,effect:'Hostile missiles and torpedoes in flight lose their lock.',
      voice:'Jamming every guidance band. They are flying blind.'}
  ];
  const POSTS = crew.map(c => c.id);   // post order sets the command keys 5–9
  // The five officers on duty: `assign` maps each post (its regular officer's id) to whoever holds it.
  // `extra.replacements` maps a post to the officer posted after its regular fell (crew/casualties.js): they bring the
  // post's own command, so `cmd` names which command an officer gives.
  function activeCrew(assign, extra) {
    const reps = (extra && extra.replacements) || {};
    return POSTS.map((post, i) => {
      const base = crew[i], id = assign && assign[post], r = id && id !== post ? recruits.find(x => x.id === id && x.post === post) : null;
      const p = !r && id && reps[post] && reps[post].id === id ? reps[post] : null;
      if (p) return Object.assign({}, base, p, { key: base.key, post: base.post, slot: post, cmd: post, rank: undefined, portrait: null });
      return r ? Object.assign({}, r, { key: base.key, post: base.post, slot: post, cmd: r.id }) : Object.assign({}, base, { slot: post, cmd: post });
    });
  }
  const commanders = {
    1:{id:'vex',name:'Captain Kora Vex',faction:'Corsair Clans',title:'THE KESTREL MARAUDER',line:'Navy hull, turn away. These transports are my business.',portrait:null,asset:'vex.webp',tactics:'Targets civilians and aggressively closes to ram.'},
    2:{id:'sable',name:'Commander Orren Sable',faction:'Ash Fleet',title:'THE EXILE',line:'You are trespassing among the dead, captain. Turn back.',portrait:null,asset:'sable.svg',tactics:'Commands a minelayer supported by an Ash Fleet raider.'},
    3:{id:'thorne',name:'Captain Garrick Thorne',faction:'Corsair Clans',title:'THE WIDOWMAKER',line:'Pay the toll, Meridian, or I take it from your wreck.',portrait:null,asset:'thorne.webp',tactics:'May surrender rather than lose his ship.'},
    4:{id:'oracle',name:'ORACLE-9',faction:'Autonomous Directorate',title:'AUTONOMOUS PURSUIT INTELLIGENCE',line:'Unknown human platform: your presence is statistically unacceptable.',portrait:5},
    5:{id:'cantor',name:'The Cantor',faction:'Wraith',title:'UNKNOWN BIOLOGICAL ENTITY',line:'...harmonic emission detected. No comprehensible translation.',portrait:null,asset:'cantor.svg',tactics:'A living vessel with regenerative hull and homing spores.'},
    6:{id:'vigil',name:'VIGIL Array',faction:'Autonomous Directorate',title:'DISTRIBUTED PICKET INTELLIGENCE',line:'Picket nodes synchronised. Human platform reclassified: obstruction.',portrait:null,tactics:'Two pickets sharing one mind: they hold range together and alternate railgun shots.'},
    7:{id:'choir',name:'The Choir',faction:'Wraith',title:'BROOD CHORUS',line:'...the harmonic splits into two voices, then three. It is louder than at Harrow.',portrait:null,asset:'cantor.svg',tactics:'A bioship and its brood hunt the slowest ship in the system first.'},
    8:{id:'halloran',name:'Commodore Ingrid Halloran',faction:'Ash Fleet',title:'COMMANDER OF THE ASH FLEET',line:'You fly well, captain. I should know. I wrote the manual you learned from.',portrait:null,tactics:'Fights from a fortress dreadnought, calls the pirate clans when pressed, and turns every gun loose at the end.'},
    9:{id:'arbiter',name:'THE ARBITER',faction:'Autonomous Directorate',title:'DIRECTORATE CORE INTELLIGENCE',line:'Every outcome has been modelled. In none of them do you leave.',portrait:5,tactics:'Shields up behind a lattice of node ships, then a spinal lance when the numbers turn against it.'},
    10:{id:'mother',name:'The Bloom-Mother',faction:'Wraith',title:'MOTHER OF THE BROOD',line:'...one note, so low the hull hums with it. Everything green in the system turns toward you.',portrait:null,asset:'cantor.svg',tactics:'Guarded by her brood, filling the sky with spores, and healing faster the more she is hurt.'}
  };
  const leads={1:'renn',2:'okoye',3:'varro',4:'renn',5:'sato',6:'okoye',7:'varro',8:'vale',9:'renn',10:'sato'};
  const briefLines={
    1:'Civilian beacons are cutting out. One raider is trying to drive the convoy into the rocks.',
    2:'The mine pattern matches a navy doctrine manual, but these signal codes were deleted years ago.',
    3:'Thorne values his ship more than his cause. If we can break his nerve, we can take prisoners.',
    4:'That frequency is correcting for us before we change course. Something is predicting our intentions.',
    5:'Its hull is alive. We are here to record what we can, not prove we can kill it.',
    6:'Two ships, one set of decisions. Break the link between them and they are just two thin hulls.',
    7:'Eleven thousand people on one ship. Whatever happens to us, the Lantern reaches that beacon.',
    8:'The Pyre is twice our tonnage and she knows every trick we do. Keep the damage-control teams close, captain.',
    9:'Its shields lean on those node ships. Kill the nodes and the numbers stop working for it.',
    10:'The longer this takes, the more of it grows back. We go in, we keep firing, and we do not stop.'
  };
  // Fleet Admiral Harlan, who briefs each act and sends a transmission after every story operation.
  const harlan = {id:'harlan',name:'Fleet Admiral Gideon Harlan',title:'Commander, Frontier Fleet',image:'img/admiral-harlan.webp'};
  // Twenty unique named characters and five additional faces for procedurally named people.
  // Five columns x five rows; all tiles use 180 x 225 source pixels (4:5).
  // The old sprite, SVG and classification badges remain behind the photograph as load fallbacks.
  const ART = ["varro","okoye","vale","sato","renn","adeyemi","fenn","osei","marlow","achterberg","vex","sable","thorne","oracle","cantor","vigil","choir","halloran","arbiter","mother","pirate-1","pirate-2","pirate-3","ensign-1","ensign-2"];
  const canonical = [...crew,...recruits,...Object.values(commanders)];
  const byName = Object.fromEntries(canonical.map(p => [p.name.toLowerCase(),p.id]));
  function photoId(person){
    if(!person) return null;
    if(ART.includes(person.id)) return person.id;
    const name=String(person.name||'').toLowerCase().trim();
    if(byName[name]) return byName[name];
    const familiar=canonical.find(p=>name && (name.endsWith(' '+p.name.toLowerCase().split(' ').pop())));
    if(familiar) return familiar.id;
    // Legacy saves can contain hired ensigns and rivals without a canonical ID.
    // Stable selection by name keeps the same portrait across the roster, reports and hails.
    let h=0;for(const c of name) h=(Math.imul(h,33)+c.charCodeAt(0))>>>0;
    const faction=String(person.faction||'').toLowerCase();
    if(/corsair|pirate/.test(faction)) return 'pirate-'+(1+h%3);
    if(/ash fleet/.test(faction)) return ['sable','pirate-2','pirate-3'][h%3];
    if(/directorate|machine/.test(faction)) return ['oracle','vigil','arbiter'][h%3];
    if(/wraith|alien/.test(faction)) return ['cantor','choir','mother'][h%3];
    return 'ensign-'+(1+h%2);
  }
  function portrait(person,extra=''){
    const html=badge(person,extra);
    if(!person||person.image) return html;
    const id=photoId(person);
    return id?html.replace(/<\/span>$/, `<span class="art-photo art-${id}" aria-hidden="true"></span></span>`):html;
  }
  function badge(person, extra){
    if(person && person.image){
      const src=String(person.image).replace(/[^a-z0-9./-]/gi,'');
      return `<span class="crew-portrait ${extra}" role="img" aria-label="Portrait of ${person.name}" style="background-image:url('${src}');background-size:cover;background-position:center 18%"></span>`;
    }
    if(person && person.initials && !person.asset && !Number.isInteger(person.portrait)){
      const t=String(person.initials).replace(/[^A-Z]/g,'').slice(0,2);
      return `<span class="crew-portrait classified recruit ${extra}" role="img" aria-label="Portrait of ${person.name}"><span>${t}</span></span>`;
    }
    if(person && person.asset){
      const asset=String(person.asset).replace(/[^a-z.]/g,'');
      return `<span class="crew-portrait enemy-portrait ${extra}" role="img" aria-label="Portrait of ${person.name}" style="background-image:url('img/commanders/${asset}');background-size:cover;background-position:center"></span>`;
    }
    if (person && Number.isInteger(person.portrait)){
      const n=person.portrait;
      return `<span class="crew-portrait ${extra}" role="img" aria-label="Portrait of ${person.name}" style="background-position:${(n%3)*50}% ${Math.floor(n/3)*100}%"></span>`;
    }
    // A classification medallion intentionally replaces artwork not yet commissioned.
    const code=(person?.faction||'UNKNOWN').slice(0,2).toUpperCase();
    return `<span class="crew-portrait classified ${extra}" role="img" aria-label="Commander identity classified"><span>${code}</span></span>`;
  }
  root.BroadsidePersonnel = Object.freeze({crew,recruits,POSTS,activeCrew,commanders,leads,briefLines,portrait,photoId,harlan,ART});
})(window);

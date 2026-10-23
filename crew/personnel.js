// Shared character identities, portrait metadata, battlefield orders, and narrative dialogue.
// Loaded by both the campaign map and the main battle renderer.
(function (root) {
  'use strict';
  const crew = [
    {id:'varro', name:'Commander Elise Varro', short:'Varro', rank:'Commander', post:'First Officer', portrait:0,
      bio:'Varro has survived two failed evacuations. She distrusts grand gestures and specialises in keeping the bridge functional during disasters.',
      ability:'Brace', key:'5', cooldown:100, duration:0,
      effect:'Restore 16% of each directional shield bank immediately.',
      voice:'All stations, brace. Shield reserves committed.'},
    {id:'okoye',name:'Lt. Commander Imani Okoye',short:'Okoye',rank:'Lt. Commander',post:'Tactical Officer',portrait:1,
      bio:'A gifted gunnery officer who trusts measured trajectories more than heroic instincts. She is exceptionally good at recognising target weaknesses.',
      ability:'Target Solution',key:'6',cooldown:110,duration:14,
      effect:'Weapons deal 12% more damage for 14 seconds.',
      voice:'Firing solution locked. Concentrate your batteries.'},
    {id:'vale',name:'Chief Tomas Vale',short:'Vale',rank:'Chief',post:'Chief Engineer',portrait:2,
      bio:'Vale rebuilt the Resolute after the Outer Dock disaster. His improvised fixes keep systems fighting long after they should have failed.',
      ability:'Damage Control',key:'7',cooldown:125,duration:0,
      effect:'Restore 24 integrity to the worst damaged subsystem and suppress one onboard fire.',
      voice:'Repair crews are on it. Give me thirty seconds and a miracle.'},
    {id:'sato',name:'Lieutenant Nara Sato',short:'Sato',rank:'Lieutenant',post:'Helm Officer',portrait:3,
      bio:'Once a frontier courier pilot, Sato knows exactly how late a ship can turn before it is committed to a collision course.',
      ability:'Evasive Pattern',key:'8',cooldown:105,duration:12,
      effect:'Reduce incoming damage by 22% for 12 seconds.',
      voice:'Evasive pattern running. Hold onto something.'},
    {id:'renn',name:'Ensign Idris Renn',short:'Renn',rank:'Ensign',post:'Intelligence Officer',portrait:4,
      bio:'Renn recognised the repeating transponder signatures on the frontier. His analytical instincts are stronger than his confidence.',
      ability:'Threat Scan',key:'9',cooldown:80,duration:0,
      effect:'Identify the weakest enemy shield facing and most damaged subsystem.',
      voice:'I have a partial target profile. Transmitting vulnerabilities.'}
  ];
  const commanders = {
    1:{id:'vex',name:'Captain Kora Vex',faction:'Corsair Clans',title:'THE KESTREL MARAUDER',line:'Navy hull, turn away. These transports are my business.',portrait:null,asset:'vex.svg',tactics:'Targets civilians and aggressively closes to ram.'},
    2:{id:'sable',name:'Commander Orren Sable',faction:'Ash Fleet',title:'THE EXILE',line:'You are trespassing among the dead, captain. Turn back.',portrait:null,asset:'sable.svg',tactics:'Commands a minelayer supported by an Ash Fleet raider.'},
    3:{id:'thorne',name:'Captain Garrick Thorne',faction:'Corsair Clans',title:'THE WIDOWMAKER',line:'Pay the toll, Meridian, or I take it from your wreck.',portrait:null,asset:'thorne.svg',tactics:'May surrender rather than lose his ship.'},
    4:{id:'oracle',name:'ORACLE-9',faction:'Autonomous Directorate',title:'AUTONOMOUS PURSUIT INTELLIGENCE',line:'Unknown human platform: your presence is statistically unacceptable.',portrait:5},
    5:{id:'cantor',name:'The Cantor',faction:'Wraith',title:'UNKNOWN BIOLOGICAL ENTITY',line:'...harmonic emission detected. No comprehensible translation.',portrait:null,asset:'cantor.svg',tactics:'A living vessel with regenerative hull and homing spores.'}
  };
  const leads={1:'renn',2:'okoye',3:'varro',4:'renn',5:'sato'};
  const briefLines={
    1:'Civilian beacons are cutting out. One raider is trying to drive the convoy into the rocks.',
    2:'The mine pattern matches a navy doctrine manual, but these signal codes were deleted years ago.',
    3:'Thorne values his ship more than his cause. If we can break his nerve, we can take prisoners.',
    4:'That frequency is correcting for us before we change course. Something is predicting our intentions.',
    5:'Its hull is alive. We are here to record what we can, not prove we can kill it.'
  };
  function portrait(person, extra=''){
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
  root.BroadsidePersonnel = Object.freeze({crew,commanders,leads,briefLines,portrait});
})(window);

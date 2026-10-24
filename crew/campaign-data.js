// The Shattered Reach as data: the star chart, the three acts, story operations, starbases, station missions,
// generated contracts and interceptions. Every battle the campaign launches is described by an encounter spec
// (see encounter()) that the battle page and crew/fleet-controller.js build the fight from.
// Loaded by both the campaign map and the battle renderer, and by the Node tests.
(function (root) {
  'use strict';

  // Coordinates come from the original 1672 × 941 concept atlas; campaign.html maps them onto its star field.
  const SYSTEMS = [
    ['aurelian', 'Aurelian', 517, 136, 'Meridian Core', 'Navy', 'Low', 'Homeworld relay and secure defensive anchor.'],
    ['meridian', 'Meridian', 532, 237, 'Meridian Core', 'Navy', 'Low', 'Regional command hub and home of the Meridian Fleet Yards.'],
    ['solace', 'Solace', 402, 259, 'Meridian Core', 'Navy', 'Low', 'Hospitality and medical logistics serving the frontier.'],
    ['tarn', 'Tarn', 478, 305, 'Meridian Core', 'Navy', 'Low', 'Mining and propulsion parts depot on the road to the Ash Marches.'],
    ['innerpost', 'Innerpost', 605, 287, 'Meridian Core', 'Navy', 'Low', 'Fleet listening station with navigational forecasts.'],
    ['northpoint', 'Northpoint', 843, 134, 'Kestrel Verge', 'Contested', 'Moderate', 'Northern approach to Kestrel Verge.'],
    ['kestrel', 'Kestrel', 830, 205, 'Kestrel Verge', 'Contested', 'High', 'Kestrel’s civilian transports are under attack; immediate naval intervention requested.'],
    ['vela', 'Vela', 943, 221, 'Kestrel Verge', 'Contested', 'High', 'A drifting wreck emits a coded Meridian Navy transponder.'],
    ['driftwall', 'Driftwall', 864, 274, 'Kestrel Verge', 'Contested', 'Moderate', 'Salvage fields shelter merchants and opportunistic raiders.'],
    ['peregrine', 'Peregrine', 997, 309, 'Kestrel Verge', 'Independent', 'Moderate', 'Refuelling and commerce along the eastern spur.'],
    ['sable', 'Sable', 1063, 261, 'Kestrel Verge', 'Independent', 'Moderate', 'Outpost between contested space and pirate territory.'],
    ['razor', 'Razor', 1265, 138, 'Red Narrows', 'Pirates', 'High', 'A concealed staging ground for fast raiders.'],
    ['rednarrows', 'Red Narrows', 1218, 225, 'Red Narrows', 'Pirates', 'Severe', 'Pirates levy illegal tolls on a crucial jump-lane bottleneck.'],
    ['scour', 'Scour', 1195, 291, 'Red Narrows', 'Pirates', 'High', 'Scarred metal moons and a hidden market for stolen ship systems.'],
    ['bastion', 'Bastion', 1340, 260, 'Red Narrows', 'Pirates', 'High', 'Old fortifications adapted as a pirate supply station.'],
    ['blackrift', 'Blackrift', 1313, 327, 'Red Narrows', 'Pirates', 'Severe', 'Uncharted debris belt sheltering heavily armed corsair vessels.'],
    ['emberfall', 'Emberfall', 435, 454, 'Ash Marches', 'Renegades', 'High', 'Refugee system under disputed military protection.'],
    ['kharon', 'Kharon', 585, 443, 'Ash Marches', 'Renegades', 'High', 'An ominous naval signal has recently appeared here.'],
    ['cinder', 'Cinder Wake', 508, 523, 'Ash Marches', 'Renegades', 'High', 'The Ash Fleet conceals warship activity in a turbulent debris field.'],
    ['vostok', 'Vostok', 420, 582, 'Ash Marches', 'Renegades', 'High', 'An industrial outpost controlled by dissident officers.'],
    ['grimhold', 'Grimhold', 599, 583, 'Ash Marches', 'Renegades', 'High', 'A fortified naval dockyard beyond Meridian jurisdiction.'],
    ['thalos', 'Thalos', 801, 345, 'Halcyon Belt', 'Independent', 'Low', 'Sparsely inhabited observation system in the Halcyon Belt.'],
    ['elysia', 'Elysia', 714, 442, 'Halcyon Belt', 'Independent', 'Low', 'Neutral research colony with a deep-space observatory.'],
    ['halcyon', 'Halcyon', 862, 461, 'Halcyon Belt', 'Machines', 'Severe', 'An abandoned relay broadcasts a repeating navigation signal.'],
    ['citrine', 'Citrine', 771, 507, 'Halcyon Belt', 'Independent', 'Moderate', 'A supply port at the boundary of unknown machine activity.'],
    ['juniper', 'Juniper', 994, 475, 'Halcyon Belt', 'Independent', 'Moderate', 'The great ringed planet makes this a busy transit hub.'],
    ['midway', 'Midway', 900, 554, 'Halcyon Belt', 'Machines', 'High', 'Trade transfers between colonies have stopped; the relay buoys answer in machine code.'],
    ['nex', 'Nex', 1164, 459, 'Harrow Expanse', 'Unknown', 'Severe', 'Strange organic signatures on outbound probes.'],
    ['widow', 'Widow’s Toll', 1288, 522, 'Harrow Expanse', 'Unknown', 'Severe', 'A formerly quiet corridor now awash in alien biological signals.'],
    ['harrow', 'Harrow', 1423, 461, 'Harrow Expanse', 'Aliens', 'Extreme', 'Frontier colony whose entire defence force has disappeared.'],
    ['mire', 'Mire', 1470, 522, 'Harrow Expanse', 'Aliens', 'Extreme', 'Organic debris and electromagnetic interference impede mapping.'],
    ['bloom', 'Bloom', 1163, 575, 'Harrow Expanse', 'Aliens', 'High', 'Regenerating matter now coats the wreckage of an old outpost.'],
    ['verdant', 'Verdant', 1385, 599, 'Harrow Expanse', 'Aliens', 'Extreme', 'A green world from which no probe has returned.']
  ].map(([id, name, x, y, region, faction, threat, description]) => ({ id, name, x, y, region, faction, threat, description }));
  const byId = Object.fromEntries(SYSTEMS.map(s => [s.id, s]));
  const ROUTES = [
    ['solace', 'tarn'], ['solace', 'meridian'], ['tarn', 'meridian'], ['meridian', 'aurelian'], ['meridian', 'innerpost'], ['meridian', 'kestrel'], ['aurelian', 'northpoint'], ['innerpost', 'kestrel'],
    ['northpoint', 'kestrel'], ['northpoint', 'vela'], ['kestrel', 'vela'], ['kestrel', 'driftwall'], ['vela', 'driftwall'], ['vela', 'sable'], ['vela', 'peregrine'], ['driftwall', 'peregrine'], ['sable', 'peregrine'],
    ['sable', 'scour'], ['sable', 'rednarrows'], ['razor', 'rednarrows'], ['rednarrows', 'scour'], ['rednarrows', 'bastion'], ['bastion', 'blackrift'], ['scour', 'blackrift'],
    ['tarn', 'emberfall'], ['emberfall', 'kharon'], ['emberfall', 'cinder'], ['emberfall', 'vostok'], ['kharon', 'cinder'], ['cinder', 'vostok'], ['cinder', 'grimhold'], ['kharon', 'elysia'],
    ['driftwall', 'thalos'], ['thalos', 'elysia'], ['thalos', 'halcyon'], ['elysia', 'halcyon'], ['elysia', 'citrine'], ['halcyon', 'citrine'], ['halcyon', 'juniper'], ['halcyon', 'midway'], ['citrine', 'midway'], ['juniper', 'midway'], ['peregrine', 'juniper'],
    ['juniper', 'nex'], ['nex', 'widow'], ['nex', 'bloom'], ['widow', 'harrow'], ['widow', 'mire'], ['widow', 'bloom'], ['harrow', 'mire'], ['harrow', 'verdant'], ['mire', 'verdant'], ['bloom', 'verdant']
  ];
  const THREATS = ['Low', 'Moderate', 'High', 'Severe', 'Extreme'];
  const threatLevel = s => THREATS.indexOf(s.threat) + 1;

  function neighbors(id) { return ROUTES.flatMap(([a, b]) => a === id ? [b] : b === id ? [a] : []); }
  function path(from, to) {
    const q = [from], prev = { [from]: null };
    for (let i = 0; i < q.length && !(to in prev); i++) for (const n of neighbors(q[i])) if (!(n in prev)) { prev[n] = q[i]; q.push(n); }
    if (!(to in prev)) return [];
    const out = []; for (let s = to; s !== null; s = prev[s]) out.unshift(s); return out;
  }
  const jumps = (a, b) => path(a, b).length - 1;

  // ---------------- acts ----------------
  // An act's foes are the factions whose space is hostile (and can intercept you) while it runs;
  // its main foes are the ones the starbases mostly post work against.
  const ACTS = [
    { n: 1, numeral: 'I', name: 'The Long Watch', foes: ['Pirates', 'Renegades'], main: ['Pirates', 'Renegades'], story: [1, 2, 3],
      briefing: {
        sub: 'From Fleet Admiral Gideon Harlan, to the captain of {ship}',
        paras: [
          'For fourteen years the Shattered Reach has been quiet. That quiet is over. Three merchant ships have vanished on the Kestrel lanes in six days, and the last signal out of Kestrel was not a distress call. It was a warning.',
          'Command calls it piracy. I am not convinced. Corsairs do not fly with Navy transponders, and they do not vanish without wreckage. Someone is arming them, and someone wants this frontier empty.',
          'You will take {ship} out of Meridian and answer that warning. She is the only capital ship I can spare, so bring her home. Every plate of hull you lose comes out of the fleet’s requisition, and the frontier cannot afford to lose you.'
        ],
        orders: ['Answer the call at Kestrel and protect the civilian traffic there.', 'Trace the stolen Navy hardware to whoever is supplying it.', 'Starbases post work for any captain who wants it. Take it, and keep the dockyards on our side.'] } },
    { n: 2, numeral: 'II', name: 'The Machine Signal', foes: ['Pirates', 'Renegades', 'Machines'], main: ['Machines'], story: [4, 6],
      briefing: {
        sub: 'From Fleet Admiral Gideon Harlan, to the captain of {ship}',
        paras: [
          'Good work in the Narrows. Thorne’s people talked, and what they told us is worse than piracy. The Ash Fleet was never the end of the chain. Someone has been feeding them patrol schedules that no human officer could have known.',
          'Our listening posts have traced the leak to a signal in the Halcyon Belt. It repeats every eleven minutes, and every repetition answers a question we have not yet asked. The colonies at Midway have stopped talking to anyone.',
          'Find the source of that signal, captain. Whatever is out there has been watching this frontier longer than we have.'
        ],
        orders: ['Investigate the ghost relay at Halcyon.', 'Follow the signal wherever it leads.', 'The Elysia observatory and Juniper Ringport will need protecting while you do.'] } },
    { n: 3, numeral: 'III', name: 'The Wraith', foes: ['Pirates', 'Renegades', 'Machines', 'Aliens', 'Unknown'], main: ['Aliens', 'Unknown'], story: [5, 7],
      briefing: {
        sub: 'From Fleet Admiral Gideon Harlan, to the captain of {ship}',
        paras: [
          'The machines were not the enemy. They were the alarm. Every message they sent, every ship they turned, was an attempt to empty the Reach before something else arrived.',
          'That something is here. Harrow has gone silent, and our probes are coming back coated in living tissue. The Directorate archive calls it the Wraith, and its estimates for the Reach are not survivable.',
          'I need you to look this thing in the eye and bring back everything you see. Then I need you to get our people out.'
        ],
        orders: ['Make first contact at Harrow and survive it.', 'Evacuate the colonies in the Wraith’s path.', 'Hold the quarantine line from Juniper. Nothing green gets past it.'] } }
  ];
  const STORY_ORDER = ACTS.flatMap(a => a.story);

  // ---------------- story operations ----------------
  // env picks the battle scenery preset in crew/battle-environments.js; goal is the win condition (see fleet-controller.js).
  const STORY = [
    { id: 1, act: 1, system: 'kestrel', name: 'Distress at Kestrel', enemy: 'scrapjaw', captain: 'Captain Kora Vex', kind: 'Pirate ram', reward: 420,
      objective: 'Keep the MV Peregrine alive until it reaches the jump beacon, OR destroy Vex’s raider first.',
      brief: 'MV Peregrine is carrying evacuees toward the illuminated Kestrel jump beacon. You can win by protecting it until extraction OR by destroying Kora Vex first. Press H or use the on-screen command to hold or resume the convoy. If Peregrine is lost, the operation fails.',
      intel: 'Vex prioritises the unarmed civilian freighter but will turn toward your flagship if you intercept her.',
      hud: 'Defeat Captain Kora Vex and secure the trade lane',
      enemies: [{ cls: 'scrapjaw', name: 'Captain Kora Vex' }], goal: { type: 'escort', convoy: 'MV Peregrine · Civilian transport', hunter: true },
      choice: ['Recover civilian survivors', 'Pursue the escaping pirate network'], flags: ['kestrel_rescue', 'kestrel_pursuit'] },
    { id: 2, act: 1, system: 'cinder', name: 'The Cinder Wake', enemy: 'revenant', captain: 'Commander Orren Sable', kind: 'Renegade minelayer', reward: 540,
      objective: 'Destroy the Ash Fleet Revenant and its raider escort to recover a navy transponder.',
      brief: 'A military transponder lies among the burning wreckage. Sable’s Revenant minelayer and a fast Scrapjaw pursuer attack from opposite sides. Defeat both to secure the transponder, using J to switch targets. Beware of chasing directly into the mine trail.',
      intel: 'Long-range missile salvos and proximity mines deployed astern. Avoid chasing directly behind the ship.',
      hud: 'Defeat the Ash Fleet minelayer and recover the transponder evidence',
      enemies: [{ cls: 'revenant', name: 'Commander Orren Sable' }, { cls: 'scrapjaw', name: 'Ash Fleet Pursuer', hull: 0.38, shield: 0.58, diff: 'commander' }], goal: { type: 'destroy' },
      choice: ['Rescue the surviving crew', 'Recover the intact coded transponder'], flags: ['vela_rescue', 'vela_transponder'] },
    { id: 3, act: 1, system: 'rednarrows', name: 'The Widow’s Toll', enemy: 'scrapjaw', captain: 'Captain Garrick Thorne', kind: 'Pirate commander', reward: 570,
      objective: 'Reopen the Red Narrows trade route.',
      brief: 'An illegal toll operation is strangling the jump route. Captain Garrick Thorne offers a bargain: leave the corridor or take his scrap-armoured cruiser head-on. His crew may surrender if their hull is severely damaged.',
      intel: 'A Scrapjaw rammer. Force Thorne below 28% hull integrity to compel surrender, or destroy the raider.',
      hud: 'Force Captain Thorne to surrender or destroy his toll raider',
      enemies: [{ cls: 'scrapjaw', name: 'Captain Garrick Thorne' }], goal: { type: 'surrender', at: 0.28 },
      ends: { surrender: ['Pirate commander surrendered', 'Captain Thorne has powered down his weapons and surrendered the Red Narrows toll lane.'] },
      choice: ['Offer amnesty for intelligence', 'Impound all captured pirate matériel'], flags: ['thorne_amnesty', 'thorne_impounded'] },
    { id: 4, act: 2, system: 'halcyon', name: 'Ghost Frequency', enemy: 'seraph', captain: 'ORACLE-9', kind: 'Autonomous warship', reward: 700,
      objective: 'Disable ORACLE-9 and recover the anomalous signal archive.',
      brief: 'A deserted relay broadcasts coordinates with impossible precision. A machine warship called ORACLE-9 guards the transmission. Disable it and download the surviving data core.',
      intel: 'The Seraph fights at long range with tracking beams and a devastating railgun. Close distance while controlling your shield facings.',
      hud: 'Disable ORACLE-9 and recover its transmission archive',
      enemies: [{ cls: 'seraph', name: 'ORACLE-9' }], goal: { type: 'destroy' },
      choice: ['Transmit the archive to Fleet Command', 'Seal the archive pending investigation'], flags: ['oracle_transmitted', 'oracle_sealed'] },
    { id: 6, act: 2, system: 'midway', name: 'The Quiet Relay', enemy: 'seraph', captain: 'VIGIL Array', kind: 'Machine picket pair', reward: 760,
      objective: 'Destroy both VIGIL pickets and take the Midway relay off the air.',
      brief: 'ORACLE-9’s archive names a second transmitter: the Midway trade relay, silent to human traffic for three weeks. Two Directorate pickets share a single mind there and fight as one. Break them apart and the signal goes dark.',
      intel: 'Twin Seraph pickets on thinner hulls. They hold range and alternate railgun shots; when one falls, the other closes to finish the fight.',
      hud: 'Destroy both VIGIL pickets and silence the Midway relay',
      enemies: [{ cls: 'seraph', name: 'VIGIL-4 picket', hull: 0.62, shield: 0.75 }, { cls: 'seraph', name: 'VIGIL-7 picket', hull: 0.55, shield: 0.7, diff: 'captain' }], goal: { type: 'destroy' },
      choice: ['Destroy the relay outright', 'Capture the relay core for analysis'], flags: ['relay_destroyed', 'relay_captured'] },
    { id: 5, act: 3, system: 'harrow', name: 'The First Bloom', enemy: 'wraith', captain: 'The Cantor', kind: 'Alien bioship', reward: 900,
      objective: 'Survive contact for 100 seconds and transmit your sensor archive, or defeat the bioship.',
      brief: 'The colonial guard at Harrow has vanished. A vessel that appears to be alive enters sensor range. Stay intact long enough for the automatic hundred-second sensor transmission to complete.',
      intel: 'Its plasma eats shields. Spore salvos track your course. Its hull regenerates, so the safest objective is survival, not destruction.',
      hud: 'Survive 100 seconds of first contact or destroy the bioship',
      enemies: [{ cls: 'wraith', name: 'The Cantor' }], goal: { type: 'survive', seconds: 100, label: 'FIRST CONTACT // TRANSMITTING' },
      ends: { extracted: ['First contact survived', 'The Cantor remains at large. Your ship has transmitted alien biosignatures and escaped the engagement.'] },
      choice: ['Warn every frontier colony immediately', 'Classify the encounter while the navy prepares'], flags: ['harrow_warning', 'harrow_classified'] },
    { id: 7, act: 3, system: 'nex', name: 'Exodus at Nex', enemy: 'wraith', captain: 'The Choir', kind: 'Wraith brood', reward: 980,
      objective: 'Escort the colony ship Long Lantern to the jump beacon, OR destroy the brood hunting it.',
      brief: 'Nex is the last colony between the Wraith and Juniper. Eleven thousand people are packed into the Long Lantern, and a Wraith brood is already in the system. Get the ship to the beacon. Press H to hold or resume it if the path ahead is not clear.',
      intel: 'A Wraith bioship escorted by a younger brood vessel. They hunt the slowest target first and their spores follow it through the debris.',
      hud: 'Get the Long Lantern to the jump beacon',
      enemies: [{ cls: 'wraith', name: 'The Choir' }, { cls: 'wraith', name: 'Choir brood vessel', hull: 0.4, shield: 0.55, diff: 'commander' }], goal: { type: 'escort', convoy: 'Long Lantern · Colony ship', hunter: true },
      choice: ['Hold the Juniper quarantine line', 'Fall back to Meridian with the refugees'], flags: ['quarantine_held', 'refugees_withdrawn'] }
  ];
  const storyById = Object.fromEntries(STORY.map(m => [m.id, m]));

  function actOf(completed) {
    const done = new Set(completed || []);
    for (const a of ACTS) if (a.story.some(id => !done.has(id))) return a.n;
    return ACTS.length + 1;   // every story operation complete
  }
  function storyUnlocked(completed, id) {
    const done = new Set(completed || []), i = STORY_ORDER.indexOf(Number(id));
    return i >= 0 && STORY_ORDER.slice(0, i).every(n => done.has(n));
  }
  function storyAvailable(completed, id) { return storyUnlocked(completed, id) && !(completed || []).includes(Number(id)); }
  function openStory(completed) { return STORY_ORDER.map(id => storyById[id]).filter(m => storyAvailable(completed, m.id)); }

  // ---------------- starbases ----------------
  const STATIONS = {
    meridian: { name: 'Meridian Fleet Yards', owner: 'Navy', blurb: 'The frontier fleet’s home dock. Full refit, repair and rearming facilities, and a duty board kept by Navy Command.' },
    tarn: { name: 'Tarn Propulsion Depot', owner: 'Navy', blurb: 'A mining depot turned forward dock on the road into the Ash Marches. Rough berths, honest mechanics.' },
    peregrine: { name: 'Peregrine Exchange', owner: 'Independent', blurb: 'A trade station on the eastern spur. Merchants post bounties here when the Navy is too slow to answer.' },
    elysia: { name: 'Elysia Research Station', owner: 'Independent', blurb: 'An observatory colony with a small civilian yard. Its scientists pay well for escorts and survey cover.' },
    juniper: { name: 'Juniper Ringport', owner: 'Independent', blurb: 'The busiest port in the Reach, strung around the great ringed planet. Every captain passes through Juniper.' }
  };
  function nearestStation(from) {
    let best = null, d = Infinity;
    for (const id of Object.keys(STATIONS)) { const j = jumps(from, id); if (j >= 0 && j < d) { d = j; best = id; } }
    return best || 'meridian';
  }

  // ---------------- station missions ----------------
  // Hand-written side missions, posted at one starbase from their act onwards.
  const SIDE = [
    { id: 'a1-deserter', act: 1, station: 'meridian', system: 'vostok', name: 'The Deserter', giver: 'Commander Lena Ashdown, Navy Intelligence', reward: 460,
      brief: 'An Ash Fleet signals officer wants to come home, and she is bringing the fleet’s codebooks with her. Her shuttle is hiding in the Vostok yards with a hunter between it and the jump beacon.',
      objective: 'Escort the shuttle Kittiwake to the jump beacon, or destroy the hunter.', intel: 'A Revenant hunter. It will try to mine the shuttle’s route.',
      enemies: [{ cls: 'revenant', name: 'Ash Fleet hunter', hull: 0.55, shield: 0.7 }], goal: { type: 'escort', convoy: 'Shuttle Kittiwake · Defector', hunter: true } },
    { id: 'a1-salvage', act: 1, station: 'peregrine', system: 'driftwall', name: 'Salvage Rights', giver: 'Harbourmaster Ines Kaur', reward: 420,
      brief: 'Two scavenger crews are cutting apart a Navy frigate wreck in the Driftwall fields. The wreck still has its logs aboard, and the Exchange would rather the Navy read them than the clans.',
      objective: 'Destroy both scavenger raiders.', intel: 'Light Scrapjaw hulls stripped for speed. They will try to box you in.',
      enemies: [{ cls: 'scrapjaw', name: 'Scavenger Rook', hull: 0.42, shield: 0.6 }, { cls: 'scrapjaw', name: 'Scavenger Lark', hull: 0.42, shield: 0.6, diff: 'commander' }], goal: { type: 'destroy' } },
    { id: 'a1-emberfall', act: 1, station: 'tarn', system: 'emberfall', name: 'The Emberfall Lift', giver: 'Commodore Aris Penn', reward: 480,
      brief: 'A refugee transport is trying to leave Emberfall before the Ash Fleet seals the system. An interdictor is already waiting for it. Penn cannot spare a ship; you are the ship.',
      objective: 'Escort the MV Hearthstone to the jump beacon, or destroy the interdictor.', intel: 'A Revenant interdictor laying mines across the transport’s path.',
      enemies: [{ cls: 'revenant', name: 'Ash Fleet interdictor', hull: 0.6, shield: 0.7 }], goal: { type: 'escort', convoy: 'MV Hearthstone · Refugee transport', hunter: true } },
    { id: 'a1-ledger', act: 1, station: 'peregrine', system: 'scour', name: 'The Scour Ledger', giver: 'Factor Odile Marsh', reward: 520,
      brief: 'A smuggler called the Ledger keeps the books for every stolen Navy part sold at Scour. Kill the ship and the market loses its memory. The Exchange will pay handsomely for that.',
      objective: 'Destroy the smuggler ship Ledger.', intel: 'An armed Revenant conversion. Missile salvos at range, mines when chased.',
      enemies: [{ cls: 'revenant', name: 'The Ledger', hull: 0.78, shield: 0.8 }], goal: { type: 'destroy' } },
    { id: 'a2-scout', act: 2, station: 'meridian', system: 'northpoint', name: 'Eyes on Northpoint', giver: 'Commander Lena Ashdown, Navy Intelligence', reward: 520,
      brief: 'A Directorate scout has been mapping the northern approaches to Meridian for a week. Whatever it learns goes straight back to the machines. Make sure it learns nothing more.',
      objective: 'Destroy the machine scout.', intel: 'A light Seraph scout. Fast shields, thin hull, and a railgun it will use from extreme range.',
      enemies: [{ cls: 'seraph', name: 'Directorate scout', hull: 0.6, shield: 0.75 }], goal: { type: 'destroy' } },
    { id: 'a2-survey', act: 2, station: 'elysia', system: 'thalos', name: 'Dead Reckoning', giver: 'Dr. Halima Oduya', reward: 560,
      brief: 'Elysia’s survey buoys can triangulate the machine signal if they get eighty seconds of quiet. A machine hunter is already sweeping Thalos for them. Give them their eighty seconds.',
      objective: 'Hold the survey area for 80 seconds, or destroy the machine hunter.', intel: 'A Seraph hunter. It keeps its distance and works on your shields with beams.',
      enemies: [{ cls: 'seraph', name: 'Directorate hunter', hull: 0.7, shield: 0.8 }], goal: { type: 'survive', seconds: 80, label: 'SURVEY BUOYS // TRIANGULATING' } },
    { id: 'a2-static', act: 2, station: 'juniper', system: 'citrine', name: 'Static on the Ring', giver: 'Portmaster Tobias Grail', reward: 600,
      brief: 'Machine pickets have parked over the Citrine supply lanes and every freighter that passes them loses its navigation. Juniper’s portmaster wants them gone before the ring runs out of food.',
      objective: 'Destroy both machine pickets.', intel: 'Two light Seraph pickets. Close the range quickly and they come apart.',
      enemies: [{ cls: 'seraph', name: 'Picket LATTICE-2', hull: 0.5, shield: 0.65 }, { cls: 'seraph', name: 'Picket LATTICE-5', hull: 0.5, shield: 0.65, diff: 'commander' }], goal: { type: 'destroy' } },
    { id: 'a3-stowaway', act: 3, station: 'meridian', system: 'innerpost', name: 'Stowaway', giver: 'Commander Lena Ashdown, Navy Intelligence', reward: 640,
      brief: 'A freighter out of Juniper arrived at Innerpost with something growing in its hold. The something has left the freighter. It is the first Wraith inside Navy space, and it must be the last.',
      objective: 'Destroy the Wraith before it reaches the core worlds.', intel: 'A young bioship, hungry and fast-growing. Its hull regenerates when it is not under fire.',
      enemies: [{ cls: 'wraith', name: 'Innerpost stowaway', hull: 0.6, shield: 0.7 }], goal: { type: 'destroy' } },
    { id: 'a3-quarantine', act: 3, station: 'juniper', system: 'bloom', name: 'Quarantine Line', giver: 'Portmaster Tobias Grail', reward: 700,
      brief: 'Wraith spawn are budding off the wreckage at Bloom. If they reach the Juniper lanes, the ring has to be abandoned. Burn the nursery out while it is still small.',
      objective: 'Destroy both Wraith spawn.', intel: 'Two young bioships. Their hulls regrow, so finish one before you turn to the next.',
      enemies: [{ cls: 'wraith', name: 'Wraith spawn', hull: 0.45, shield: 0.6 }, { cls: 'wraith', name: 'Wraith spawn', hull: 0.45, shield: 0.6, diff: 'commander' }], goal: { type: 'destroy' } },
    { id: 'a3-lastlight', act: 3, station: 'elysia', system: 'mire', name: 'Last Light', giver: 'Dr. Halima Oduya', reward: 760,
      brief: 'The research vessel Lantern Moth went into Mire to sample the Wraith and has been hiding in the debris for two days. Bring her and her samples home.',
      objective: 'Escort the RV Lantern Moth to the jump beacon, or destroy the Wraith stalking her.', intel: 'A mature Wraith. Expect spore salvos aimed at the slower ship.',
      enemies: [{ cls: 'wraith', name: 'Mire stalker', hull: 0.75, shield: 0.8 }], goal: { type: 'escort', convoy: 'RV Lantern Moth · Research vessel', hunter: true } }
  ];
  for (const m of SIDE) m.kind = 'side';
  const sideById = Object.fromEntries(SIDE.map(m => [m.id, m]));
  function sideMissions(station, act, done) { const d = new Set(done || []); return SIDE.filter(m => m.station === station && m.act <= act && !d.has(m.id)); }

  // ---------------- generated contracts ----------------
  const FOES = {
    Pirates: { cls: 'scrapjaw', group: 'Corsair', names: ['Captain Mara Quill', 'Captain Jessup Crane', 'Captain Hollis Teague', 'Captain Dace Varga', 'Captain Tamsin Roe', 'Captain Ivo Strake', 'Captain Bryn Kessler', 'Old Saul Mott'] },
    Renegades: { cls: 'revenant', group: 'Ash Fleet', names: ['Lt. Cmdr. Halvard Rook', 'Commander Ysolde Marr', 'Lieutenant Cass Ferro', 'Commander Edrik Vane', 'Lt. Cmdr. Juno Albright'] },
    Machines: { cls: 'seraph', group: 'Directorate', names: ['PICKET-12', 'WARDEN-3', 'SENTINEL-8', 'AUGUR-5', 'LATTICE-9', 'CENSOR-1'] },
    Aliens: { cls: 'wraith', group: 'Wraith', names: ['Brood-singer', 'Spore matron', 'Thorn choir', 'Pale drifter', 'Hollow cantor'] }
  };
  FOES.Unknown = FOES.Aliens;
  const CONVOYS = ['MV Calloway', 'MV Sunward', 'MV Brightwater', 'MV Tessaly', 'MV Orison', 'MV Hale', 'MV Quiet Harbour'];
  // The independent and contested systems belong to whoever is raiding them in the current act.
  const LOCAL = { 1: 'Pirates', 2: 'Machines', 3: 'Aliens' };
  function foeFor(sys, act) { return FOES[sys.faction] || FOES[LOCAL[Math.min(act, 3)]] || FOES.Pirates; }
  function hostile(sys, act) { const a = ACTS[Math.min(act, ACTS.length) - 1]; return !!(a && a.foes.includes(sys.faction)); }

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let s = (seed % 2147483646) + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const pick = (r, list) => list[Math.floor(r() * list.length)];
  const round = v => Math.round(v * 100) / 100;
  // Enemy hull and shield scale for generated fights: tougher in dangerous systems and later acts.
  const strength = (sys, act) => Math.min(1, 0.36 + 0.07 * threatLevel(sys) + 0.1 * (Math.min(act, 3) - 1));

  const CONTRACT_TYPES = {
    bounty: { label: 'Bounty', verb: 'Destroy' },
    patrol: { label: 'Patrol', verb: 'Clear' },
    escort: { label: 'Escort', verb: 'Escort' }
  };
  function contractFor(type, station, sys, act, r, id) {
    const foe = foeFor(sys, act), s = strength(sys, act), lvl = threatLevel(sys), a = Math.min(act, 3), ship = { scrapjaw: 'raider', revenant: 'warship', seraph: 'machine', wraith: 'bioship' }[foe.cls];
    const base = { id, kind: 'contract', type, station, system: sys.id, act: a, enemy: foe.cls };
    if (type === 'bounty') {
      const who = pick(r, foe.names);
      return Object.assign(base, { name: 'Bounty: ' + who, captain: who, reward: 200 + 60 * lvl + 90 * (a - 1),
        brief: `${who} has been raiding traffic out of ${sys.name}. ${STATIONS[station].name} has posted a bounty for the ${ship} and a bonus for doing it quietly.`,
        objective: `Destroy ${who}.`, intel: `${foe.group} ${ship}, rated ${sys.threat.toLowerCase()} threat.`,
        enemies: [{ cls: foe.cls, name: who, hull: round(Math.min(1, s + 0.15)), shield: round(Math.min(1, s + 0.2)) }], goal: { type: 'destroy' } });
    }
    if (type === 'patrol') {
      return Object.assign(base, { name: `Patrol: ${sys.name} lanes`, captain: `${foe.group} wing`, reward: 230 + 70 * lvl + 90 * (a - 1),
        brief: `A ${foe.group} wing has been stopping ships in ${sys.name}. Sweep the lanes and break it up so traffic can move again.`,
        objective: 'Destroy both hostile ships.', intel: `Two light ${foe.group} ${ship}s working as a pair.`,
        enemies: [{ cls: foe.cls, name: `${foe.group} lead`, hull: round(s * 0.62), shield: round(s * 0.75) }, { cls: foe.cls, name: `${foe.group} wingman`, hull: round(s * 0.55), shield: round(s * 0.7), diff: 'commander' }], goal: { type: 'destroy' } });
    }
    const convoy = pick(r, CONVOYS);
    return Object.assign(base, { name: `Escort: ${convoy}`, captain: `${foe.group} ${ship}`, reward: 240 + 65 * lvl + 90 * (a - 1),
      brief: `The ${convoy} is waiting in ${sys.name} for a jump window, and a ${foe.group} ${ship} is waiting for it. See her through to the beacon.`,
      objective: `Escort the ${convoy} to the jump beacon, or destroy the attacker.`, intel: `A ${foe.group} ${ship} that will go for the freighter first. Press H to hold or resume the convoy.`,
      enemies: [{ cls: foe.cls, name: `${foe.group} ${ship}`, hull: round(s), shield: round(Math.min(1, s + 0.1)) }], goal: { type: 'escort', convoy: `${convoy} · Freighter`, hunter: true } });
  }
  // Three contracts per starbase. The board changes whenever `cycle` does (the campaign bumps it after each victory).
  function contracts(station, cycle, act) {
    const r = rng(hash(station + ':' + cycle)), a = Math.min(act, 3), out = [];
    const near = SYSTEMS.filter(s => { const j = jumps(station, s.id); return j >= 1 && j <= 3; });
    const main = near.filter(s => ACTS[a - 1].main.includes(s.faction)), foes = near.filter(s => hostile(s, a));
    const targets = { bounty: main.length ? main : foes, patrol: near.filter(s => hostile(s, a) || s.faction === 'Contested'), escort: near.filter(s => !hostile(s, a) && s.faction !== 'Navy') };
    for (const [i, type] of ['bounty', 'patrol', 'escort'].entries()) {
      const pool = targets[type].length ? targets[type] : near.filter(s => s.faction !== 'Navy');
      if (!pool.length) continue;
      out.push(contractFor(type, station, pick(r, pool), a, r, `c:${station}:${cycle}:${i}`));
    }
    return out;
  }

  // ---------------- interceptions ----------------
  const INTERCEPT_CHANCE = [0, 0.06, 0.12, 0.18, 0.24, 0.3];   // by threat level
  // Returns the first system on the way (not counting the start) where hostiles drop out of the lane, or null.
  function rollInterception(route, act, random) {
    for (const id of route.slice(1)) { const s = byId[id]; if (s && hostile(s, act) && random() < INTERCEPT_CHANCE[threatLevel(s)]) return id; }
    return null;
  }
  function interception(id, act, seed) {
    const sys = byId[id], foe = foeFor(sys, act), s = strength(sys, act), r = rng(hash(id + ':' + seed)), pair = threatLevel(sys) >= 4 || r() < 0.3, who = pick(r, foe.names);
    const enemies = pair
      ? [{ cls: foe.cls, name: who, hull: round(s * 0.6), shield: round(s * 0.7) }, { cls: foe.cls, name: `${foe.group} wingman`, hull: round(s * 0.5), shield: round(s * 0.65), diff: 'commander' }]
      : [{ cls: foe.cls, name: who, hull: round(Math.min(1, s * 0.85)), shield: round(Math.min(1, s * 0.9)) }];
    return { id: `x:${id}:${seed}`, kind: 'intercept', system: id, act: Math.min(act, 3), name: `Interception at ${sys.name}`, captain: who, enemy: foe.cls,
      reward: 90 + 35 * threatLevel(sys) + (pair ? 60 : 0), objective: pair ? 'Destroy both ambushers.' : `Destroy ${who}.`,
      brief: `${foe.group} ships dropped out of the jump lane at ${sys.name} and matched your vector before the drive could cycle.`,
      intel: `${pair ? 'Two' : 'One'} ${foe.group} ${{ scrapjaw: 'raider', revenant: 'warship', seraph: 'machine', wraith: 'bioship' }[foe.cls]}${pair ? 's' : ''}.`, enemies, goal: { type: 'destroy' } };
  }
  // The chance of slipping an ambush: fast hulls and healthy engines get away more often.
  const FLEE = { sabre: 0.8, halberd: 0.7, bastion: 0.5, warden: 0.4 };
  function fleeChance(ship, engines) { return round((FLEE[ship] || 0.5) * (0.55 + 0.45 * Math.max(0, Math.min(100, engines == null ? 100 : engines)) / 100)); }

  // ---------------- encounter specs ----------------
  const ENV_BY_REGION = { 'Meridian Core': 0, 'Kestrel Verge': 1, 'Ash Marches': 2, 'Red Narrows': 3, 'Halcyon Belt': 4, 'Harrow Expanse': 5 };
  // Everything the battle page needs to stage a fight, as plain JSON (it travels in the save under `launch`).
  function encounter(src) {
    const story = storyById[src.id] === src, sys = byId[src.system] || byId.kestrel;
    const label = story ? 'OPERATION ' + String(src.id).padStart(2, '0') : src.kind === 'side' ? 'STATION MISSION' : src.kind === 'intercept' ? 'INTERCEPTION' : (CONTRACT_TYPES[src.type] || { label: 'Contract' }).label.toUpperCase() + ' CONTRACT';
    const lead = src.enemies[0], foe = foeFor(sys, src.act || 1);
    return {
      id: story ? 'story:' + src.id : src.id, kind: story ? 'story' : src.kind, story: story ? src.id : null, system: sys.id,
      title: src.name, label, objective: src.hud || src.objective, reward: src.reward || 0,
      env: story && src.id <= 5 ? src.id : ENV_BY_REGION[sys.region] || 0, gate: src.goal.type === 'escort',
      hail: story ? src.id : { name: lead.name, faction: foe.group, line: src.taunt || HAILS[lead.cls] },
      enemies: src.enemies.map(e => Object.assign({}, e)), goal: Object.assign({}, src.goal), ends: src.ends || null
    };
  }
  const HAILS = {
    scrapjaw: 'Cut your engines, Navy. Whatever is in your hold is ours now.',
    revenant: 'This sector is closed by order of the Ash Fleet. Turn back or be counted with the dead.',
    seraph: 'Human platform: your trajectory has been predicted. Your outcome has been predicted.',
    wraith: '...a low harmonic rises through the hull. It is not a language. It is a hunting call.'
  };
  const storyEncounter = id => storyById[id] ? encounter(storyById[id]) : null;

  root.BroadsideCampaign = Object.freeze({
    SYSTEMS, byId, ROUTES, THREATS, threatLevel, neighbors, path, jumps,
    ACTS, STORY, STORY_ORDER, storyById, actOf, storyUnlocked, storyAvailable, openStory,
    STATIONS, nearestStation, SIDE, sideById, sideMissions,
    CONTRACT_TYPES, contracts, hostile, rollInterception, interception, fleeChance,
    ENV_BY_REGION, encounter, storyEncounter
  });
})(typeof window !== 'undefined' ? window : globalThis);

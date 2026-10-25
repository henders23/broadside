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
    { n: 1, numeral: 'I', name: 'The Long Watch', foes: ['Pirates', 'Renegades'], main: ['Pirates', 'Renegades'], story: [1, 2, 3, 8],
      briefing: {
        sub: 'From Fleet Admiral Gideon Harlan, to the captain of {ship}',
        paras: [
          'For fourteen years the Shattered Reach has been quiet. That quiet is over. Three merchant ships have vanished on the Kestrel lanes in six days, and the last signal out of Kestrel was not a distress call. It was a warning.',
          'Command calls it piracy. I am not convinced. Corsairs do not fly with Navy transponders, and they do not vanish without wreckage. Someone is arming them, and someone wants this frontier empty.',
          'You will take {ship} out of Meridian and answer that warning. Find out who sent it, and who is acting on it. She is the only capital ship I can spare, so bring her home. Every plate of hull you lose comes out of the fleet’s requisition, and the frontier cannot afford to lose you.'
        ],
        orders: ['Answer the call at Kestrel and protect the civilian traffic there.', 'Trace the stolen Navy hardware to whoever is supplying it, and end the Ash Fleet at its source.', 'Starbases post work for any captain who wants it. Take it, and keep the dockyards on our side.'] } },
    { n: 2, numeral: 'II', name: 'The Machine Signal', foes: ['Pirates', 'Renegades', 'Machines'], main: ['Machines'], story: [4, 6, 9],
      briefing: {
        sub: 'From Fleet Admiral Gideon Harlan, to the captain of {ship}',
        paras: [
          'Halloran is dead, and the Ash Fleet with her. Before the Pyre went down she told you why she did it: eleven years ago a machine signal out of the Halcyon Belt warned her what was coming to the Reach. Command buried the report. She took the fleet and set about emptying the frontier the only way she could.',
          'The Kestrel warning was that same signal. It repeats every eleven minutes, and every repetition answers a question we have not yet asked. The colonies at Midway have stopped talking to anyone.',
          'Find the source, captain. I want to know what it saw, and why it never said so plainly.'
        ],
        orders: ['Investigate the ghost relay at Halcyon.', 'Follow the signal back to the mind that is sending it.', 'The Elysia observatory and Juniper Ringport will need protecting while you do.'] } },
    { n: 3, numeral: 'III', name: 'The Wraith', foes: ['Pirates', 'Renegades', 'Machines', 'Aliens', 'Unknown'], main: ['Aliens', 'Unknown'], story: [5, 7, 10],
      briefing: {
        sub: 'From Fleet Admiral Gideon Harlan, to the captain of {ship}',
        paras: [
          'The machines were never the enemy. They were the alarm. Halloran heard it eleven years ago, and she and the Directorate each tried to empty the Reach before something else arrived: she by terror, they by silence. We fought them both, and we were wrong about why.',
          'That something is here. Harrow has gone silent, and our probes are coming back coated in living tissue. The Directorate called it the Wraith, and its projections for the Reach are not survivable.',
          'So we do what they tried to do, and we do it properly. Look this thing in the eye, get our people out of its way, and then find where it grows and burn it.'
        ],
        orders: ['Make first contact at Harrow and survive it, then evacuate the colonies in its path.', 'Find where the Wraith is growing, and burn it out.', 'Hold the quarantine line from Juniper. Nothing green gets past it.'] } }
  ];
  const STORY_ORDER = ACTS.flatMap(a => a.story);

  // ---------------- story operations ----------------
  // env picks the battle scenery preset in crew/battle-environments.js; goal is the win condition (see fleet-controller.js).
  const STORY = [
    { id: 1, act: 1, system: 'kestrel', name: 'Distress at Kestrel', enemy: 'scrapjaw', captain: 'Captain Kora Vex', kind: 'Pirate ram', reward: 420, support: 1,
      objective: 'Keep the MV Peregrine alive until it reaches the jump beacon, OR destroy Vex’s raider first.',
      brief: 'MV Peregrine is carrying evacuees toward the illuminated Kestrel jump beacon. You can win by protecting it until extraction OR by destroying Kora Vex first. Press H or use the on-screen command to hold or resume the convoy. If Peregrine is lost, the operation fails.',
      intel: 'Vex prioritises the unarmed civilian freighter but will turn toward your flagship if you intercept her.',
      hud: 'Defeat Captain Kora Vex and secure the trade lane',
      enemies: [{ cls: 'scrapjaw', name: 'Captain Kora Vex' }], goal: { type: 'escort', convoy: 'MV Peregrine · Civilian transport', hunter: true },
      choice: ['Recover civilian survivors', 'Pursue the escaping pirate network'], flags: ['kestrel_rescue', 'kestrel_pursuit'] },
    { id: 2, act: 1, system: 'cinder', name: 'The Cinder Wake', enemy: 'revenant', captain: 'Commander Orren Sable', kind: 'Renegade minelayer', reward: 540, support: 1,
      objective: 'Destroy the Ash Fleet Revenant and its raider escort to recover a navy transponder.',
      brief: 'A military transponder lies among the burning wreckage. Sable’s Revenant minelayer and a fast Scrapjaw pursuer attack from opposite sides. Defeat both to secure the transponder, using J to switch targets. Beware of chasing directly into the mine trail.',
      intel: 'Long-range missile salvos and proximity mines deployed astern. Avoid chasing directly behind the ship.',
      hud: 'Defeat the Ash Fleet minelayer and recover the transponder evidence',
      enemies: [{ cls: 'revenant', name: 'Commander Orren Sable', hull: 0.85, dmg: 0.75 }, { cls: 'scrapjaw', name: 'Ash Fleet Pursuer', hull: 0.38, shield: 0.58, diff: 'commander' }], goal: { type: 'destroy' },
      choice: ['Rescue the surviving crew', 'Recover the intact coded transponder'], flags: ['vela_rescue', 'vela_transponder'] },
    { id: 3, act: 1, system: 'rednarrows', name: 'The Widow’s Toll', enemy: 'scrapjaw', captain: 'Captain Garrick Thorne', kind: 'Pirate commander', reward: 570, support: 0,
      objective: 'Reopen the Red Narrows trade route.',
      brief: 'An illegal toll operation is strangling the jump route. Captain Garrick Thorne offers a bargain: leave the corridor or take his scrap-armoured cruiser head-on. His crew may surrender if their hull is severely damaged.',
      intel: 'A Scrapjaw rammer. Force Thorne below 28% hull integrity to compel surrender, or destroy the raider.',
      hud: 'Force Captain Thorne to surrender or destroy his toll raider',
      enemies: [{ cls: 'scrapjaw', name: 'Captain Garrick Thorne' }], goal: { type: 'surrender', at: 0.28 },
      ends: { surrender: ['Pirate commander surrendered', 'Captain Thorne has powered down his weapons and surrendered the Red Narrows toll lane.'] },
      choice: ['Offer amnesty for intelligence', 'Impound all captured pirate matériel'], flags: ['thorne_amnesty', 'thorne_impounded'],
      impound: { choice: 1, cls: 'scrapjaw', name: 'The Widow', hull: 0.5, needs: 'surrender' } },
    { id: 4, act: 2, system: 'halcyon', name: 'Ghost Frequency', enemy: 'seraph', captain: 'ORACLE-9', kind: 'Autonomous warship', reward: 700, support: 2,
      objective: 'Disable ORACLE-9 and recover the anomalous signal archive.',
      brief: 'A deserted relay broadcasts coordinates with impossible precision. A machine warship called ORACLE-9 guards the transmission. Disable it and download the surviving data core.',
      intel: 'The Seraph fights at long range with tracking beams and a devastating railgun. Close distance while controlling your shield facings.',
      hud: 'Disable ORACLE-9 and recover its transmission archive',
      enemies: [{ cls: 'seraph', name: 'ORACLE-9' }], goal: { type: 'destroy' },
      choice: ['Transmit the archive to Fleet Command', 'Seal the archive pending investigation'], flags: ['oracle_transmitted', 'oracle_sealed'] },
    { id: 6, act: 2, system: 'midway', name: 'The Quiet Relay', enemy: 'seraph', captain: 'VIGIL Array', kind: 'Machine picket pair', reward: 760, support: 1,
      objective: 'Destroy both VIGIL pickets and take the Midway relay off the air.',
      brief: 'ORACLE-9’s archive names a second transmitter: the Midway trade relay, silent to human traffic for three weeks. Two Directorate pickets share a single mind there and fight as one. Break them apart and the signal goes dark.',
      intel: 'Twin Seraph pickets on thinner hulls. They hold range and alternate railgun shots; when one falls, the other closes to finish the fight.',
      hud: 'Destroy both VIGIL pickets and silence the Midway relay',
      enemies: [{ cls: 'seraph', name: 'VIGIL-4 picket', hull: 0.62, shield: 0.75, dmg: 0.55 }, { cls: 'seraph', name: 'VIGIL-7 picket', hull: 0.55, shield: 0.7, diff: 'commander' }], goal: { type: 'destroy' },
      choice: ['Destroy the relay outright', 'Capture the relay core for analysis'], flags: ['relay_destroyed', 'relay_captured'] },
    { id: 5, act: 3, system: 'harrow', name: 'The First Bloom', enemy: 'wraith', captain: 'The Cantor', kind: 'Alien bioship', reward: 900, support: 0,
      objective: 'Survive contact for 100 seconds and transmit your sensor archive, or defeat the bioship.',
      brief: 'The colonial guard at Harrow has vanished. A vessel that appears to be alive enters sensor range. Stay intact long enough for the automatic hundred-second sensor transmission to complete.',
      intel: 'Its plasma eats shields. Spore salvos track your course. Its hull regenerates, so the safest objective is survival, not destruction.',
      hud: 'Survive 100 seconds of first contact or destroy the bioship',
      enemies: [{ cls: 'wraith', name: 'The Cantor' }], goal: { type: 'survive', seconds: 100, label: 'FIRST CONTACT // TRANSMITTING' },
      ends: { extracted: ['First contact survived', 'The Cantor remains at large. Your ship has transmitted alien biosignatures and escaped the engagement.'] },
      choice: ['Warn every frontier colony immediately', 'Classify the encounter while the navy prepares'], flags: ['harrow_warning', 'harrow_classified'] },
    { id: 7, act: 3, system: 'nex', name: 'Exodus at Nex', enemy: 'wraith', captain: 'The Choir', kind: 'Wraith brood', reward: 980, support: 1,
      objective: 'Escort the colony ship Long Lantern to the jump beacon, OR destroy the brood hunting it.',
      brief: 'Nex is the last colony between the Wraith and Juniper. Eleven thousand people are packed into the Long Lantern, and a Wraith brood is already in the system. Get the ship to the beacon. Press H to hold or resume it if the path ahead is not clear.',
      intel: 'A Wraith bioship escorted by a younger brood vessel. They hunt the slowest target first and their spores follow it through the debris.',
      hud: 'Get the Long Lantern to the jump beacon',
      enemies: [{ cls: 'wraith', name: 'The Choir', hull: 0.85, dmg: 0.75 }, { cls: 'wraith', name: 'Choir brood vessel', hull: 0.4, shield: 0.55, diff: 'commander' }], goal: { type: 'escort', convoy: 'Long Lantern · Colony ship', hunter: true },
      choice: ['Hold the Juniper quarantine line', 'Fall back to Meridian with the refugees'], flags: ['quarantine_held', 'refugees_withdrawn'] },
    // Act finales: a boss flagship with escorts, fought in phases. Each phase starts when the boss's hull falls past `at`
    // and can bring in more ships, restore its shields, unlock a weapon held back until then, raise a damage-soaking
    // lattice that holds while its node ships live, or speed up a living hull's regrowth (see fleet-controller.js).
    { id: 8, act: 1, system: 'grimhold', name: 'The Pyre at Grimhold', enemy: 'pyre', captain: 'Commodore Ingrid Halloran', kind: 'Ash Fleet dreadnought', reward: 1500,
      objective: 'Destroy the Ash Fleet flagship Pyre and end the renegade fleet.',
      brief: 'Every stolen transponder, every mine field and every bribed pirate leads back to Grimhold and the dreadnought Pyre. Commodore Ingrid Halloran was a Navy officer once; she taught half the frontier fleet. She will not surrender, and she will not fight alone.',
      intel: 'A Warden-class dreadnought rebuilt as a fortress: siege cannons, flak, missiles and mines. Expect the pirate clans to answer her call, and a final firestorm when she is desperate.',
      hud: 'Destroy the dreadnought Pyre', support: 1,
      enemies: [{ cls: 'pyre', name: 'ASF Pyre · Commodore Halloran', dmg: 0.38 }, { cls: 'scrapjaw', name: 'Ash Fleet escort', dmg: 0.25, hull: 0.45, shield: 0.6, diff: 'commander' }],
      goal: { type: 'boss' },
      trophy: 'pyre_plating',
      boss: { title: 'ASF PYRE', phases: [
        { name: 'Fortress', note: 'Siege cannons and minefields' },
        { at: 0.65, name: 'The clans answer', line: 'Every clan in the Narrows owes me a debt. I am calling it in.', shields: true,
          spawn: [{ cls: 'scrapjaw', name: 'Clan raider', dmg: 0.25, hull: 0.35, shield: 0.55, diff: 'commander' }, { cls: 'scrapjaw', name: 'Clan raider', dmg: 0.25, hull: 0.35, shield: 0.55, diff: 'commander' }] },
        { at: 0.3, name: 'Scorched earth', line: 'Eleven years ago a machine told me what is coming, Captain. Command buried it. I emptied what I could. All batteries, fire at will.', unlock: ['inferno'] }] },
      ends: { boss_destroyed: ['The Pyre is burning', 'Commodore Halloran’s flagship broke apart over Grimhold. Without her, the Ash Fleet is finished.'] },
      choice: ['Search the wreck for Halloran’s logs', 'Offer her surviving crews amnesty'], flags: ['halloran_logs', 'ash_amnesty'] },
    { id: 9, act: 2, system: 'halcyon', name: 'The Arbiter', enemy: 'arbiter', captain: 'THE ARBITER', kind: 'Directorate core warship', reward: 1900,
      objective: 'Destroy the Arbiter, the warship that carries the Directorate’s mind.',
      brief: 'With the Midway relay silent, the Directorate has nowhere left to hide its mind. It has put it in a ship. The Arbiter surfaced at the Halcyon relay an hour ago, and every machine in the Belt has turned to face it.',
      intel: 'A huge Seraph-pattern warship with heavy shields, beam arrays and a railgun. When pressed it raises a shield lattice held up by node ships: destroy the nodes or your guns barely scratch it. At the end it charges a spinal lance.',
      hud: 'Destroy the Arbiter', support: 1,
      enemies: [{ cls: 'arbiter', name: 'THE ARBITER', dmg: 0.32 }, { cls: 'sentinel', name: 'Directorate sentinel', dmg: 0.2, hull: 0.45, shield: 0.6, diff: 'commander' }],
      goal: { type: 'boss' },
      trophy: 'lattice_emitter',
      boss: { title: 'THE ARBITER', phases: [
        { name: 'Overwatch', note: 'Beam arrays and railgun' },
        { at: 0.6, name: 'Shield lattice', line: 'Lattice engaged. You keep sending ships into the dark, Captain. We keep counting the dead.', lattice: 0.2,
          spawn: [{ cls: 'seraph', name: 'Lattice node', dmg: 0.25, hull: 0.32, shield: 0.5, diff: 'commander', lattice: true }, { cls: 'seraph', name: 'Lattice node', dmg: 0.25, hull: 0.32, shield: 0.5, diff: 'commander', lattice: true }] },
        { at: 0.3, name: 'Judgement', line: 'Calculation complete. You will not leave the Reach. Neither will they.', shields: true, unlock: ['judgement'] }] },
      ends: { boss_destroyed: ['The Arbiter is silent', 'The Directorate’s mind went dark with its ship. Across the Belt, the machines have stopped moving.'] },
      choice: ['Salvage the Arbiter’s core', 'Destroy every trace of it'], flags: ['arbiter_salvaged', 'arbiter_destroyed'] },
    { id: 10, act: 3, system: 'verdant', name: 'Mother of the Bloom', enemy: 'mother', captain: 'The Bloom-Mother', kind: 'Wraith brood-mother', reward: 2400,
      objective: 'Destroy the Bloom-Mother before the Wraith brood can spread beyond Verdant.',
      brief: 'Verdant was a green world before the Wraith came. Now it is a nursery, and something vast is tending it. Every bioship in the Reach grew from what is in orbit there. Kill it and the Wraith stop growing.',
      intel: 'A Wraith many times the size of the Cantor. Its brood guards it, its spores fill the sky, and its hull grows back faster the more it is hurt. Keep firing: every pause gives it time to heal.',
      hud: 'Destroy the Bloom-Mother', support: 1,
      enemies: [{ cls: 'mother', name: 'The Bloom-Mother', dmg: 0.34 }, { cls: 'wraith', name: 'Brood guardian', dmg: 0.25, hull: 0.45, shield: 0.6, diff: 'commander' }],
      goal: { type: 'boss' },
      trophy: 'living_graft',
      boss: { title: 'THE BLOOM-MOTHER', phases: [
        { name: 'The nursery', note: 'Plasma and spore swarms' },
        { at: 0.65, name: 'The brood wakes', line: '...the song swells, and the green answers it.',
          spawn: [{ cls: 'thrall', name: 'Wraith brood', dmg: 0.55, hull: 1, shield: 0.8, diff: 'commander' }, { cls: 'thrall', name: 'Wraith brood', dmg: 0.55, hull: 1, shield: 0.8, diff: 'commander' }] },
        { at: 0.35, name: 'Regrowth', line: '...a low note, felt more than heard. The wounds are closing.', regen: 1.8, unlock: ['storm'] }] },
      ends: { boss_destroyed: ['The Bloom is dying', 'The Bloom-Mother came apart in Verdant’s upper atmosphere. The brood ships are drifting, and the green is turning brown.'] },
      choice: ['Burn the nursery from orbit', 'Quarantine Verdant and study it'], flags: ['verdant_burned', 'verdant_quarantined'] }
  ];
  // The story spine: what each operation reveals about the Kestrel warning (`log`, for the Story so far), Harlan's
  // transmission after a win, and the lead officer's reaction to a win or a loss.
  const NARRATIVE = {
    1: { log: 'At Kestrel you drove off Kora Vex and saved the Peregrine. Vex took no cargo from the ships she hunted: she was paid to scare traffic off the lanes.',
      harlan: 'Pirates who do not take cargo are not pirates. Somebody is paying them to empty the Kestrel lanes, and I want to know who.',
      win: 'Vex’s hold was empty, captain. Every ship she hit, she let the cargo drift. She was not stealing; she was clearing the lane.', loss: 'We lost the Peregrine’s trail. Vex will hit the next convoy the same way. We need to be there first.' },
    2: { log: 'In the Cinder Wake you destroyed Commander Sable’s minelayer. His transponder used Navy codes deleted eleven years ago, and his logs showed the Ash Fleet paying the pirate clans.',
      harlan: 'The Ash Fleet. Halloran’s people. I signed her death certificate myself, eleven years ago. If she is alive, she has had a long time to plan.',
      win: 'The transponder is genuine, captain. Navy hardware, Navy codes, and payments to the clans going back years.', loss: 'Sable’s mines did their job. Next time we keep out of his wake.' },
    3: { log: 'In the Red Narrows you broke Garrick Thorne’s toll. Thorne said Halloran never wanted the cargo, only for the ships to turn back. She told the clans something was coming.',
      harlan: 'Halloran is at Grimhold. Whatever she thinks is coming, she is killing people to keep them out of its way. End it, captain.',
      win: 'Thorne talked. Halloran pays the clans to turn ships around, not to rob them. He says she is frightened, and Thorne does not frighten easily.', loss: 'Thorne holds the Narrows for now. He will not wait for us to come back stronger.' },
    8: { log: 'At Grimhold you destroyed the Pyre. Halloran’s last words: a machine signal from the Halcyon Belt warned her of what was coming. Command buried her report, so she tried to empty the Reach by force.',
      harlan: 'She was right about one thing. There is a signal in the Halcyon Belt, and it has been talking for eleven years. It was the Kestrel warning. I want to know what it is saying.',
      win: 'The Pyre is gone, captain. Before she went, Halloran sent one last message. It was not a threat. It was the same warning Kestrel heard.', loss: 'The Pyre outgunned us. Halloran knows our doctrine; we need to fight her with something she did not teach.' },
    4: { log: 'At Halcyon you silenced ORACLE-9. Its archive was a casualty projection for the Reach, colony by colony, falling to nothing in three years. The machines had been keeping people away.',
      harlan: 'It is a casualty projection, captain. Ours. The machines have been counting our dead before we die. What you do with the archive is your call.',
      win: 'The archive is intact. It does not predict a war. It predicts an extinction, and it has been right about everything else.', loss: 'ORACLE saw every move before we made it. We need to be less predictable.' },
    6: { log: 'At Midway you broke the VIGIL pickets. The relay had been jamming Midway’s calls to keep its traffic from flying toward Harrow. The Directorate’s mind is coming out to stop you: the Arbiter.',
      harlan: 'It is not hiding any more. It is coming out to stop us, and it thinks it is protecting someone. So do I.',
      win: 'The relay is down. It was not cutting Midway off from us; it was cutting Midway off from Harrow.', loss: 'The pickets held. Two minds working as one; we need to split them.' },
    9: { log: 'At Halcyon you destroyed the Arbiter. As it died it sent one coordinate: Harrow. The thing the machines had warned of all along was already there.',
      harlan: 'We killed the only thing in the Reach that saw this coming. Then we had better be as good as it feared we were not. Harrow, captain.',
      win: 'The Arbiter is silent. Its last transmission was a single set of coordinates: Harrow. Then nothing.', loss: 'The lattice held and the lance found us. We need those node ships dead first.' },
    5: { log: 'At Harrow you met the Wraith and lived. Your sensor archive is the first record of a living warship, and it is heading for every colony in the Expanse.',
      harlan: 'Every colony from Nex to Mire evacuates. Today. Halloran tried to do this with fear and the machines with silence. We do it with ships.',
      win: 'We have the recording, captain. It is alive, it is hungry, and there are more of them behind it.', loss: 'We did not get the whole archive out. Whatever that was, it learned something about us too.' },
    7: { log: 'At Nex you brought the Long Lantern and its eleven thousand colonists out. The brood that hunted it came from Verdant, where something vast is growing them.',
      harlan: 'The brood is coming from Verdant. Burn it out, captain, and the Reach is ours again.',
      win: 'The Lantern is through the beacon. Every one of them. The brood ships turned back toward Verdant when we broke them.', loss: 'The Lantern did not make it. We will not get another chance like that one.' },
    10: { log: 'At Verdant you killed the Bloom-Mother. The brood is dying in the sky, and the warning that began at Kestrel eleven years ago has finally been answered.',
      harlan: '', win: 'She is dead, captain. The brood ships are drifting. It is over.', loss: 'She grows back faster than we can hurt her. We go back in harder.' }
  };
  for (const m of STORY) Object.assign(m, NARRATIVE[m.id]);
  // Four decisions change later battles. Each consequence notes itself in the briefing of the battle it changes.
  const CONSEQUENCES = [
    { flag: 'thorne_amnesty', story: [8], note: 'Thorne’s charts of Grimhold: the Pyre’s minefields are mapped and its mine layer is out of the fight.', apply: spec => { spec.disable = [...(spec.disable || []), 'mines']; } },
    { flag: 'halloran_logs', story: [4, 6], note: 'Halloran’s logs carry the Directorate’s shield frequencies: machine shields start the fight at half strength.', apply: spec => { spec.enemyShieldStart = 0.5; } },
    { flag: 'ash_amnesty', story: [7, 10], note: 'The ASF Penitence, crewed by Halloran’s pardoned officers, flies at your side.', apply: spec => { spec.friends = [...(spec.friends || []), { cls: 'revenant', name: 'ASF Penitence', hull: 0.7, shield: 0.8 }]; } },
    { flag: 'oracle_transmitted', story: [7], note: 'Command acted on ORACLE’s archive: the Long Lantern is already a third of the way to the beacon.', apply: spec => { spec.goal.headStart = 0.33; } },
    { flag: 'oracle_sealed', story: [9], note: 'With the archive sealed, the Arbiter never learned how much you know: its shield lattice is weaker.', apply: spec => { const p = spec.boss && spec.boss.phases.find(x => x.lattice); if (p) p.lattice = Math.max(p.lattice, 0.4); } },
    { flag: 'arbiter_salvaged', story: [10], note: 'The Arbiter’s salvaged core models the Bloom-Mother’s growth: her regrowth is slower.', apply: spec => { const p = spec.boss && spec.boss.phases.find(x => x.regen); if (p) p.regen = 1.2; } }
  ];
  // Which decisions have later consequences (shown when the choice is offered).
  const CHOICE_STAKES = { 3: 'Amnesty brings Thorne’s charts of Grimhold; impounding brings his ship.', 8: 'His logs help in the Halcyon Belt; an amnesty brings an Ash Fleet ship to your side.', 4: 'Transmitting warns the colonies; sealing keeps the Arbiter in the dark.', 9: 'A salvaged core could help against the Wraith; destroying it earns Command’s trust.' };
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
    { id: 'a1-deserter', act: 1, station: 'meridian', system: 'vostok', name: 'The Deserter', giver: 'Commander Lena Ashdown, Navy Intelligence', reward: 460, support: 0,
      brief: 'An Ash Fleet signals officer wants to come home, and she is bringing the fleet’s codebooks with her. Her shuttle is hiding in the Vostok yards with a hunter between it and the jump beacon.',
      objective: 'Escort the shuttle Kittiwake to the jump beacon, or destroy the hunter.', intel: 'A Revenant hunter. It will try to mine the shuttle’s route.',
      enemies: [{ cls: 'revenant', name: 'Ash Fleet hunter', hull: 0.55, shield: 0.7 }], goal: { type: 'escort', convoy: 'Shuttle Kittiwake · Defector', hunter: true } },
    { id: 'a1-salvage', act: 1, station: 'peregrine', system: 'driftwall', name: 'Salvage Rights', giver: 'Harbourmaster Ines Kaur', reward: 420, support: 1,
      brief: 'Two scavenger crews are cutting apart a Navy frigate wreck in the Driftwall fields. The wreck still has its logs aboard, and the Exchange would rather the Navy read them than the clans.',
      objective: 'Destroy both scavenger raiders.', intel: 'Light Scrapjaw hulls stripped for speed. They will try to box you in.',
      enemies: [{ cls: 'scrapjaw', name: 'Scavenger Rook', hull: 0.42, shield: 0.6 }, { cls: 'scrapjaw', name: 'Scavenger Lark', hull: 0.42, shield: 0.6, diff: 'commander' }], goal: { type: 'destroy' } },
    { id: 'a1-emberfall', act: 1, station: 'tarn', system: 'emberfall', name: 'The Emberfall Lift', giver: 'Commodore Aris Penn', reward: 480, support: 0,
      brief: 'A refugee transport is trying to leave Emberfall before the Ash Fleet seals the system. An interdictor is already waiting for it. Penn cannot spare a ship; you are the ship.',
      objective: 'Escort the MV Hearthstone to the jump beacon, or destroy the interdictor.', intel: 'A Revenant interdictor laying mines across the transport’s path.',
      enemies: [{ cls: 'revenant', name: 'Ash Fleet interdictor', hull: 0.6, shield: 0.7 }], goal: { type: 'escort', convoy: 'MV Hearthstone · Refugee transport', hunter: true } },
    { id: 'a1-ledger', act: 1, station: 'peregrine', system: 'scour', name: 'The Scour Ledger', giver: 'Factor Odile Marsh', reward: 520, support: 1,
      brief: 'A smuggler called the Ledger keeps the books for every stolen Navy part sold at Scour. Kill the ship and the market loses its memory. The Exchange will pay handsomely for that.',
      objective: 'Destroy the smuggler ship Ledger.', intel: 'An armed Revenant conversion. Missile salvos at range, mines when chased.',
      enemies: [{ cls: 'revenant', name: 'The Ledger', hull: 0.78, shield: 0.8 }], goal: { type: 'destroy' } },
    { id: 'a2-scout', act: 2, station: 'meridian', system: 'northpoint', name: 'Eyes on Northpoint', giver: 'Commander Lena Ashdown, Navy Intelligence', reward: 520, support: 0,
      brief: 'A Directorate scout has been mapping the northern approaches to Meridian for a week. Whatever it learns goes straight back to the machines. Make sure it learns nothing more.',
      objective: 'Destroy the machine scout.', intel: 'A light Seraph scout. Fast shields, thin hull, and a railgun it will use from extreme range.',
      enemies: [{ cls: 'seraph', name: 'Directorate scout', hull: 0.6, shield: 0.75 }], goal: { type: 'destroy' } },
    { id: 'a2-survey', act: 2, station: 'elysia', system: 'thalos', name: 'Dead Reckoning', giver: 'Dr. Halima Oduya', reward: 560, support: 1,
      brief: 'Elysia’s survey buoys can triangulate the machine signal if they get eighty seconds of quiet. A machine hunter is already sweeping Thalos for them. Give them their eighty seconds.',
      objective: 'Hold the survey area for 80 seconds, or destroy the machine hunter.', intel: 'A Seraph hunter. It keeps its distance and works on your shields with beams.',
      enemies: [{ cls: 'seraph', name: 'Directorate hunter', hull: 0.7, shield: 0.8 }], goal: { type: 'survive', seconds: 80, label: 'SURVEY BUOYS // TRIANGULATING' } },
    { id: 'a2-static', act: 2, station: 'juniper', system: 'citrine', name: 'Static on the Ring', giver: 'Portmaster Tobias Grail', reward: 600, support: 1,
      brief: 'Machine pickets have parked over the Citrine supply lanes and every freighter that passes them loses its navigation. Juniper’s portmaster wants them gone before the ring runs out of food.',
      objective: 'Destroy both machine pickets.', intel: 'Two light Seraph pickets. Close the range quickly and they come apart.',
      enemies: [{ cls: 'seraph', name: 'Picket LATTICE-2', hull: 0.5, shield: 0.65 }, { cls: 'seraph', name: 'Picket LATTICE-5', hull: 0.5, shield: 0.65, diff: 'commander' }], goal: { type: 'destroy' } },
    { id: 'a2-listening', act: 2, station: 'tarn', system: 'northpoint', name: 'The Northpoint Watch', giver: 'Commodore Aris Penn', reward: 640, support: 1,
      brief: 'The Navy listening post at Northpoint is the only thing that hears the machines coming. The machines have worked that out. Two waves of pickets are on their way to switch it off.',
      objective: 'Defend the listening post through both waves.', intel: 'Seraph pickets. The first wave goes for the post; the second comes in faster. The post has guns of its own and will fight beside you.',
      enemies: [{ cls: 'seraph', name: 'Strike picket', hull: 0.5, shield: 0.65, dmg: 0.75 }, { cls: 'seraph', name: 'Strike picket', hull: 0.45, shield: 0.6, diff: 'commander' }],
      goal: { type: 'defend', station: 'Northpoint listening post · Navy', waves: [[{ cls: 'seraph', name: 'Assault picket', hull: 0.55, shield: 0.7, dmg: 0.6 }, { cls: 'seraph', name: 'Assault picket', hull: 0.45, shield: 0.6, diff: 'commander' }]] } },
    { id: 'a2-courier', act: 2, station: 'juniper', system: 'midway', name: 'The Midway Courier', giver: 'Portmaster Tobias Grail', reward: 620, support: 0,
      brief: 'A machine courier lifted the ring’s navigation keys from a freighter it disabled at Citrine and is running for Midway. Once it jumps the keys are gone. Run it down before its drive spools up.',
      objective: 'Disable the courier before it jumps (bring it below 35% hull).', intel: 'A Seraph courier stripped for speed: it will not turn to fight, but its shields are strong. Burn hard and stay on its tail.',
      enemies: [{ cls: 'seraph', name: 'Courier THRESHOLD', hull: 0.7, shield: 0.8, dmg: 0.6 }], goal: { type: 'pursuit', seconds: 110, at: 0.35, speed: 0.78 } },
    { id: 'a2-sightline', act: 2, station: 'elysia', system: 'halcyon', name: 'The Halcyon Sightline', giver: 'Dr. Halima Oduya', reward: 680, support: 1,
      brief: 'Two Directorate lance frigates hold the approaches to Halcyon. From four kilometres out they can put a lance through anything that tries to reach the relay. Elysia needs that line open.',
      objective: 'Destroy both Sentinels.', intel: 'Sentinel lance frigates. Their lances charge with a warning before they fire; turn out of the line when you hear it, then close the range. Up close their broadsides are light.',
      enemies: [{ cls: 'sentinel', name: 'Sentinel AUGUR-2', hull: 0.7, shield: 0.8, dmg: 0.75 }, { cls: 'sentinel', name: 'Sentinel AUGUR-7', hull: 0.6, shield: 0.7, diff: 'commander' }], goal: { type: 'destroy' } },
    { id: 'a2-lifeline', act: 2, station: 'juniper', system: 'elysia', name: 'The Ring Lifeline', giver: 'Portmaster Tobias Grail', reward: 980, support: 1,
      brief: 'Juniper ring is down to nine days of grain. The MV Tessaly is loaded at Elysia, and the only way home runs through Citrine and Midway, past pickets and a Sentinel. Take her all the way. Damage she takes in one system she carries into the next; lose her anywhere and the run starts again.',
      objective: 'Escort the MV Tessaly through Elysia, Citrine and Midway to Juniper.', intel: 'Three jumps, three fights: an Ash Fleet raider at Elysia, two machine pickets at Citrine, a Sentinel at Midway.',
      goal: { type: 'escort', convoy: 'MV Tessaly · Grain hauler', hunter: true },
      legs: [
        { system: 'elysia', objective: 'See the MV Tessaly out of Elysia.', enemies: [{ cls: 'revenant', name: 'Ash Fleet raider', hull: 0.55, shield: 0.7 }] },
        { system: 'citrine', objective: 'Get the MV Tessaly past the Citrine pickets.', enemies: [{ cls: 'seraph', name: 'Picket TOLL-3', hull: 0.5, shield: 0.65 }, { cls: 'seraph', name: 'Picket TOLL-6', hull: 0.45, shield: 0.6, diff: 'commander' }] },
        { system: 'midway', objective: 'Run the Midway gauntlet and bring the MV Tessaly home.', enemies: [{ cls: 'sentinel', name: 'Sentinel GAUNT-4', hull: 0.75, shield: 0.8, dmg: 0.8 }] }] },
    { id: 'a3-hospital', act: 3, station: 'elysia', system: 'thalos', name: 'Mercy at Thalos', giver: 'Dr. Halima Oduya', reward: 760, support: 1,
      brief: 'The hospital station at Thalos took in two hundred survivors from Harrow. The brood has followed their scent. Hold the station until the evacuation ships are clear.',
      objective: 'Defend the hospital station through all three waves.', intel: 'Young Wraith in three waves. They want the station, not you; make them want you.',
      enemies: [{ cls: 'wraith', name: 'Brood hunter', hull: 0.45, shield: 0.6, dmg: 0.7 }],
      goal: { type: 'defend', station: 'Thalos hospital station · Civilian', stationHull: 1.4, waves: [[{ cls: 'wraith', name: 'Brood hunter', hull: 0.4, shield: 0.55, dmg: 0.6 }, { cls: 'wraith', name: 'Brood hunter', hull: 0.4, shield: 0.55, diff: 'commander' }], [{ cls: 'wraith', name: 'Brood matron', hull: 0.6, shield: 0.7, dmg: 0.7 }]] } },
    { id: 'a3-sporerunner', act: 3, station: 'peregrine', system: 'widow', name: 'The Spore Runner', giver: 'Harbourmaster Ines Kaur', reward: 720, support: 0,
      brief: 'A clan smuggler has been buying Wraith spores at Widow and selling them to anyone with a grudge. She is leaving with a full hold. Stop her before she jumps.',
      objective: 'Disable the smuggler before she jumps (bring her below 30% hull).', intel: 'A fast Scrapjaw runner. She will not stop to fight, and an escort will try to block you.',
      enemies: [{ cls: 'scrapjaw', name: 'The Gallowglass', hull: 0.45, shield: 0.6, dmg: 0.6 }, { cls: 'scrapjaw', name: 'Gallowglass escort', hull: 0.4, shield: 0.55, diff: 'commander' }], goal: { type: 'pursuit', seconds: 120, at: 0.3, speed: 0.62 } },
    { id: 'a3-stowaway', act: 3, station: 'meridian', system: 'innerpost', name: 'Stowaway', giver: 'Commander Lena Ashdown, Navy Intelligence', reward: 640, support: 0,
      brief: 'A freighter out of Juniper arrived at Innerpost with something growing in its hold. The something has left the freighter. It is the first Wraith inside Navy space, and it must be the last.',
      objective: 'Destroy the Wraith before it reaches the core worlds.', intel: 'A young bioship, hungry and fast-growing. Its hull regenerates when it is not under fire.',
      enemies: [{ cls: 'wraith', name: 'Innerpost stowaway', hull: 0.6, shield: 0.7 }], goal: { type: 'destroy' } },
    { id: 'a3-quarantine', act: 3, station: 'juniper', system: 'bloom', name: 'Quarantine Line', giver: 'Portmaster Tobias Grail', reward: 700, support: 1,
      brief: 'Wraith spawn are budding off the wreckage at Bloom. If they reach the Juniper lanes, the ring has to be abandoned. Burn the nursery out while it is still small.',
      objective: 'Destroy both Wraith spawn.', intel: 'Two young bioships. Their hulls regrow, so finish one before you turn to the next.',
      enemies: [{ cls: 'wraith', name: 'Wraith spawn', hull: 0.45, shield: 0.6 }, { cls: 'wraith', name: 'Wraith spawn', hull: 0.45, shield: 0.6, diff: 'commander' }], goal: { type: 'destroy' } },
    { id: 'a3-lastlight', act: 3, station: 'elysia', system: 'mire', name: 'Last Light', giver: 'Dr. Halima Oduya', reward: 760, support: 0,
      brief: 'The research vessel Lantern Moth went into Mire to sample the Wraith and has been hiding in the debris for two days. Bring her and her samples home.',
      objective: 'Escort the RV Lantern Moth to the jump beacon, or destroy the Wraith stalking her.', intel: 'A mature Wraith. Expect spore salvos aimed at the slower ship.',
      enemies: [{ cls: 'wraith', name: 'Mire stalker', hull: 0.75, shield: 0.8 }], goal: { type: 'escort', convoy: 'RV Lantern Moth · Research vessel', hunter: true } },
    { id: 'a3-swarm', act: 3, station: 'tarn', system: 'widow', name: 'The Swarm at Widow', giver: 'Commodore Aris Penn', reward: 780, support: 1,
      brief: 'Something small and fast is stripping the picket buoys at Widow, four at a time. The last buoy saw them before it went dark: a swarm of young Wraith, hunting together. Burn it out before it grows.',
      objective: 'Destroy the Thrall swarm.', intel: 'Four Thralls: small, quick Wraith swarmers that close to ram and spit plasma. Thin hulls that knit fast. Pick one and finish it before turning to the next.',
      enemies: [{ cls: 'thrall', name: 'Thrall swarm-leader', hull: 0.9, shield: 0.9, dmg: 0.7 }, { cls: 'thrall', name: 'Thrall', hull: 0.7, shield: 0.7, diff: 'commander' }, { cls: 'thrall', name: 'Thrall', hull: 0.7, shield: 0.7, diff: 'commander' }, { cls: 'thrall', name: 'Thrall', hull: 0.7, shield: 0.7, diff: 'commander' }],
      goal: { type: 'destroy' } },
    { id: 'a3-lastships', act: 3, station: 'juniper', system: 'widow', name: 'Last Ships from Widow', giver: 'Portmaster Tobias Grail', reward: 1080, support: 1,
      brief: 'The last evacuation transport out of Widow is waiting for an escort. The road to Juniper runs through Widow and Nex, and the brood has both. Bring the MV Orison home. Damage she takes at Widow she carries into Nex; lose her and the run starts again.',
      objective: 'Escort the MV Orison through Widow and Nex to Juniper.', intel: 'Two jumps, two fights: a Thrall pack at Widow, then a Wraith and its swarm at Nex.',
      goal: { type: 'escort', convoy: 'MV Orison · Evacuee transport', hunter: true },
      legs: [
        { system: 'widow', objective: 'Get the MV Orison clear of the Widow swarm.', enemies: [{ cls: 'thrall', name: 'Thrall swarm-leader', hull: 0.9, shield: 0.9 }, { cls: 'thrall', name: 'Thrall', hull: 0.8, shield: 0.8, diff: 'commander' }, { cls: 'thrall', name: 'Thrall', hull: 0.8, shield: 0.8, diff: 'commander' }] },
        { system: 'nex', objective: 'Bring the MV Orison through Nex to the Juniper beacon.', enemies: [{ cls: 'wraith', name: 'Nex brood-singer', hull: 0.65, shield: 0.75 }, { cls: 'thrall', name: 'Thrall', hull: 0.8, shield: 0.8, diff: 'commander' }, { cls: 'thrall', name: 'Thrall', hull: 0.8, shield: 0.8, diff: 'commander' }] }] }
  ];
  for (const m of SIDE) m.kind = 'side';
  for (const m of SIDE) if (m.legs) Object.assign(m, { system: m.legs[0].system, enemies: m.legs[0].enemies });
  const sideById = Object.fromEntries(SIDE.map(m => [m.id, m]));
  // A convoy run in legs: the mission as it stands at `progress` ({ leg, hull }), with that leg's system, enemies and
  // objective, and the convoy's hull carried over from the last leg. Missions without legs come back unchanged.
  function sideLeg(m, progress) {
    if (!m || !m.legs) return m;
    const n = Math.max(0, Math.min((progress && progress.leg) || 0, m.legs.length - 1)), L = m.legs[n], hull = progress && Number.isFinite(progress.hull) ? progress.hull : 1;
    return { ...m, system: L.system, enemies: L.enemies, hud: `Leg ${n + 1} of ${m.legs.length} · ${L.objective}`, leg: n, legCount: m.legs.length,
      next: m.legs[n + 1] ? m.legs[n + 1].system : null, goal: { ...m.goal, ...(L.goal || {}), convoyHull: hull } };
  }
  function sideMissions(station, act, done) { const d = new Set(done || []); return SIDE.filter(m => m.station === station && m.act <= act && !d.has(m.id)); }

  // ---------------- generated contracts ----------------
  const FOES = {
    Pirates: { cls: 'scrapjaw', group: 'Corsair', names: ['Captain Mara Quill', 'Captain Jessup Crane', 'Captain Hollis Teague', 'Captain Dace Varga', 'Captain Tamsin Roe', 'Captain Ivo Strake', 'Captain Bryn Kessler', 'Old Saul Mott'] },
    Renegades: { cls: 'revenant', group: 'Ash Fleet', names: ['Lt. Cmdr. Halvard Rook', 'Commander Ysolde Marr', 'Lieutenant Cass Ferro', 'Commander Edrik Vane', 'Lt. Cmdr. Juno Albright'] },
    // `alt`: from that act on, a share of the work is against a different hull (a pack of them, for Thralls).
    Machines: { cls: 'seraph', alt: { cls: 'sentinel', act: 2, chance: 0.35 }, group: 'Directorate', names: ['PICKET-12', 'WARDEN-3', 'SENTINEL-8', 'AUGUR-5', 'LATTICE-9', 'CENSOR-1'] },
    Aliens: { cls: 'wraith', alt: { cls: 'thrall', act: 3, chance: 0.4, pack: 3 }, group: 'Wraith', names: ['Brood-singer', 'Spore matron', 'Thorn choir', 'Pale drifter', 'Hollow cantor'] }
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
  const SHIP_WORD = { scrapjaw: 'raider', revenant: 'warship', seraph: 'machine', wraith: 'bioship', sentinel: 'lance frigate', thrall: 'swarm' };
  function contractFor(type, station, sys, act, r, id) {
    const k = contractBase(type, station, sys, act, r, id), alt = foeFor(sys, act).alt;
    // A Thrall swarm comes as a pack: the contract's ships, topped up to the pack size, at nearly full strength (they are small).
    if (k.enemy === 'thrall') {
      for (const e of k.enemies) { e.hull = round(Math.min(1, e.hull + 0.35)); e.shield = round(Math.min(1, e.shield + 0.3)); }
      while (k.enemies.length < alt.pack) k.enemies.push({ cls: 'thrall', name: 'Thrall', hull: 0.8, shield: 0.8, diff: 'commander' });
      k.intel = `A Wraith swarm of ${k.enemies.length} Thralls. Small, fast and thin-hulled; they close to ram. Break the pack apart.`;
      if (k.type !== 'escort') k.objective = 'Destroy the swarm.';
    }
    return k;
  }
  function contractBase(type, station, sys, act, r, id) {
    let foe = foeFor(sys, act);
    const s = strength(sys, act), lvl = threatLevel(sys), a = Math.min(act, 3);
    if (foe.alt && a >= foe.alt.act && r() < foe.alt.chance) foe = { ...foe, cls: foe.alt.cls };
    const ship = SHIP_WORD[foe.cls];
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
  function contracts(station, cycle, act, priority = false) {
    const r = rng(hash(station + ':' + cycle)), a = Math.min(act, 3), out = [];
    const near = SYSTEMS.filter(s => { const j = jumps(station, s.id); return j >= 1 && j <= 3; });
    const main = near.filter(s => ACTS[a - 1].main.includes(s.faction)), foes = near.filter(s => hostile(s, a));
    const targets = { bounty: main.length ? main : foes, patrol: near.filter(s => hostile(s, a) || s.faction === 'Contested'), escort: near.filter(s => s.faction === 'Independent' || s.faction === 'Contested') };
    for (const [i, type] of ['bounty', 'patrol', 'escort'].entries()) {
      const pool = targets[type].length ? targets[type] : near.filter(s => s.faction !== 'Navy');
      if (!pool.length) continue;
      out.push(contractFor(type, station, pick(r, pool), a, r, `c:${station}:${cycle}:${i}`));
    }
    // A station that trusts you posts a fourth, harder bounty at higher pay.
    const pool = targets.bounty.length ? targets.bounty : near.filter(s => s.faction !== 'Navy');
    if (priority && pool.length) {
      let k = contractFor('bounty', station, pick(r, pool), a, r, `c:${station}:${cycle}:p`);
      for (let n = 0; n < 4 && out.some(o => o.captain === k.captain); n++) k = contractFor('bounty', station, pick(r, pool), a, r, `c:${station}:${cycle}:p`);
      k.priority = true; k.name = 'Priority ' + k.name.charAt(0).toLowerCase() + k.name.slice(1); k.reward = Math.round(k.reward * 1.4);
      for (const e of k.enemies) { e.hull = round(Math.min(1, e.hull + 0.15)); e.shield = round(Math.min(1, e.shield + 0.15)); }
      k.enemies.push({ cls: k.enemies[0].cls, name: k.enemies[0].name.split(' ').pop() + '’s wingman', hull: 0.4, shield: 0.55, diff: 'commander' });
      k.objective = `Destroy ${k.captain} and the wingman.`; k.support = 0;
      out.push(k);
    }
    return out;
  }

  // ---------------- interceptions ----------------
  const INTERCEPT_CHANCE = [0, 0.06, 0.12, 0.18, 0.24, 0.3];   // by threat level
  // Returns the first system on the way (not counting the start) where hostiles drop out of the lane, or null.
  // scale: a multiplier, or a function of the system id (difficulty and the state of its front).
  function rollInterception(route, act, random, scale = 1) {
    for (const id of route.slice(1)) { const s = byId[id], k = typeof scale === 'function' ? scale(id) : scale; if (s && hostile(s, act) && k > 0 && random() < INTERCEPT_CHANCE[threatLevel(s)] * k) return id; }
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
  const FLEE = { sabre: 0.8, halberd: 0.7, bastion: 0.5, warden: 0.4, scrapjaw: 0.75, seraph: 0.7, revenant: 0.5 };
  function fleeChance(ship, engines) { return round((FLEE[ship] || 0.5) * (0.55 + 0.45 * Math.max(0, Math.min(100, engines == null ? 100 : engines)) / 100)); }

  // ---------------- save slots and difficulty ----------------
  // Three campaign slots. Slot 1 keeps the original key so older saves stay where they were; the active slot's
  // number is stored separately and both pages read the save from saveKey().
  const SAVE_BASE = 'broadside-campaign-v1', SLOT_KEY = 'broadside-campaign-slot', SLOTS = 3;
  const slotKey = n => n > 1 ? SAVE_BASE + '-s' + n : SAVE_BASE;
  function activeSlot(storage) { try { const n = Number(storage.getItem(SLOT_KEY)); return n >= 1 && n <= SLOTS ? n : 1; } catch (e) { return 1; } }
  const saveKey = storage => slotKey(activeSlot(storage));
  // Difficulty is chosen per campaign: the enemy captains' skill, enemy hull and damage, pay and how often ambushes spring.
  const DIFFICULTY = {
    ensign: { label: 'Ensign', blurb: 'Weaker, less skilled enemies and fewer ambushes. For learning the ropes.', ai: 'commander', enemyHull: 0.85, enemyDamage: 0.8, reward: 1, intercept: 0.6 },
    captain: { label: 'Captain', blurb: 'The campaign as designed.', ai: 'captain', enemyHull: 1, enemyDamage: 1, reward: 1, intercept: 1 },
    admiral: { label: 'Admiral', blurb: 'Tougher, sharper enemies that hit harder, and more ambushes. Pays a quarter more.', ai: 'admiral', enemyHull: 1.15, enemyDamage: 1.15, reward: 1.25, intercept: 1.3 }
  };
  const difficulty = key => DIFFICULTY[key] || DIFFICULTY.captain;

  // ---------------- reputation ----------------
  // Standing with each starbase, 0–100. Work done for a station raises it; story operations raise the Navy yards.
  const REP_TIERS = [
    { at: 0, name: 'Neutral', discount: 0, bonus: 0 }, { at: 25, name: 'Friendly', discount: 0.05, bonus: 0.05 },
    { at: 50, name: 'Trusted', discount: 0.1, bonus: 0.1 }, { at: 75, name: 'Honoured', discount: 0.15, bonus: 0.15 }
  ];
  const REP = { side: 10, contract: 6, story: 5, intercept: 2, abandon: -5, loss: -2 };
  function standing(rep, station) {
    const value = Math.max(0, Math.min(100, Math.round((rep && rep[station]) || 0)));
    let i = 0; for (let k = 0; k < REP_TIERS.length; k++) if (value >= REP_TIERS[k].at) i = k;
    const next = REP_TIERS[i + 1] || null;
    return Object.assign({ value, level: i, next: next ? next.name : null, toNext: next ? next.at - value : 0 }, REP_TIERS[i]);
  }
  function adjustRep(rep, station, delta) { const out = Object.assign({}, rep); if (STATIONS[station]) out[station] = Math.max(0, Math.min(100, (out[station] || 0) + delta)); return out; }
  // What a result is worth to whom: the posting station for its own work, the Navy yards for story operations,
  // the nearest starbase for clearing an ambush.
  function repChanges(kind, win, station, system) {
    if (kind === 'story') return win ? [['meridian', REP.story], ['tarn', REP.story]] : [];
    if (kind === 'intercept') return win ? [[nearestStation(system), REP.intercept]] : [];
    if (!STATIONS[station]) return [];
    return [[station, win ? REP[kind] || REP.contract : REP.loss]];
  }

  // ---------------- frontlines ----------------
  // One front for each contested region, -10 (held by the enemy) to +10 (secured), moved only by battle results.
  // The current act's front also slips back if the captain fights elsewhere for too long.
  const FRONTS = {
    'Kestrel Verge': { start: 0, foe: 'the Corsair Clans' }, 'Red Narrows': { start: -6, foe: 'the Corsair Clans' },
    'Ash Marches': { start: -6, foe: 'the Ash Fleet' }, 'Halcyon Belt': { start: -2, foe: 'the Directorate' }, 'Harrow Expanse': { start: -6, foe: 'the Wraith' }
  };
  const FRONT_REGIONS = Object.keys(FRONTS);
  const ACT_FRONT = { 1: 'Ash Marches', 2: 'Halcyon Belt', 3: 'Harrow Expanse' };
  const FRONT_STATES = ['Enemy-held', 'Enemy advantage', 'Contested', 'Navy advantage', 'Secured'];
  const PUSHBACK = { every: 3, by: 2 };   // the act's front loses 2 after 3 battles without a win there
  // What each state does, from Enemy-held to Secured.
  const FRONT_EFFECTS = { ambush: [1.5, 1.2, 1, 0.6, 0], enemyHull: [1.1, 1.05, 1, 0.95, 0.9], danger: [1.2, 1.1, 1, 1, 1], prices: [1.1, 1.05, 1, 0.97, 0.94] };
  const startFronts = () => Object.fromEntries(FRONT_REGIONS.map(r => [r, FRONTS[r].start]));
  function frontLevel(v) { return v <= -6 ? 0 : v <= -2 ? 1 : v < 2 ? 2 : v < 6 ? 3 : 4; }
  function front(fronts, region) {
    if (!FRONTS[region]) return null;
    const value = Math.max(-10, Math.min(10, Math.round(fronts && Number.isFinite(fronts[region]) ? fronts[region] : FRONTS[region].start))), level = frontLevel(value);
    return { region, value, level, name: FRONT_STATES[level], foe: FRONTS[region].foe };
  }
  const frontOf = (fronts, systemId) => byId[systemId] ? front(fronts, byId[systemId].region) : null;
  // How much a result moves the front of the region it was fought in.
  function frontShift(kind, win, isBoss) {
    if (!win) return kind === 'intercept' ? -1 : -2;
    return isBoss ? 10 : kind === 'story' ? 4 : kind === 'intercept' ? 1 : 2;
  }
  // Applies one result: the battle's front moves, and the act's front slips if it was neglected. Returns what changed.
  function applyBattle(fronts, clock, { kind, win, system, boss, act }) {
    const out = Object.assign(startFronts(), fronts || {}), changes = [], region = byId[system] && byId[system].region, actFront = ACT_FRONT[Math.min(act, 3)];
    const move = (r, d, why) => { if (!FRONTS[r] || !d) return; const before = front(out, r); out[r] = Math.max(-10, Math.min(10, out[r] + d)); const after = front(out, r); if (after.value !== before.value) changes.push({ region: r, from: before, to: after, why }); };
    if (FRONTS[region]) move(region, frontShift(kind, win, boss), 'battle');
    let next = clock || 0;
    if (actFront && act <= 3) {
      if (region === actFront && win) next = 0;
      else if (++next >= PUSHBACK.every) { move(actFront, -PUSHBACK.by, 'pushback'); next = 0; }
    }
    return { fronts: out, clock: next, changes };
  }

  // ---------------- the fleet ----------------
  // Hulls for sale at every starbase. A ship sells back for half its hull price; upgrades are not refunded.
  const MAX_FLEET = 3;
  const HULL_PRICES = { sabre: 1100, halberd: 1250, bastion: 1500, warden: 1700 };
  const SHIP_NAMES = ['MNS Valiant', 'MNS Harrier', 'MNS Steadfast', 'MNS Vigilant', 'MNS Corvid', 'MNS Lantern', 'MNS Indomitable', 'MNS Swiftsure', 'MNS Aurelian', 'MNS Kestrel'];
  // Wrecks that can be claimed after a victory: towed home and refitted for a Navy helm, at a price, badly damaged.
  // Bosses and the Wraith (whose ships die without their brood) cannot be claimed.
  const CAPTURE = {
    scrapjaw: { refit: 650, hull: 0.35, value: 1200, names: ['MNS Jackal', 'MNS Scavenger', 'MNS Reprisal'] },
    revenant: { refit: 800, hull: 0.35, value: 1500, names: ['MNS Penitent', 'MNS Ember', 'MNS Homecoming'] },
    seraph: { refit: 700, hull: 0.35, value: 1300, names: ['MNS Turncoat', 'MNS Echo', 'MNS Second Opinion'] }
  };
  const capturable = cls => !!CAPTURE[cls];
  function prizeName(cls, taken) { const t = new Set(taken), c = CAPTURE[cls]; return (c && c.names.find(n => !t.has(n))) || nextShipName(taken); }
  const sellPrice = cls => Math.round((HULL_PRICES[cls] || (CAPTURE[cls] && CAPTURE[cls].value) || 1000) / 2);
  function nextShipName(taken) { const t = new Set(taken); return SHIP_NAMES.find(n => !t.has(n)) || 'MNS Escort ' + (t.size + 1); }
  // The ships that fly: the flagship first, then up to two escorts not held in reserve.
  function deployed(ships, flag) {
    const f = ships.find(s => s.id === flag) || ships[0];
    return f ? [f, ...ships.filter(s => s !== f && !s.reserve)].slice(0, MAX_FLEET) : [];
  }
  // A fleet slips an ambush only as well as its slowest ship.
  function fleetFleeChance(list) { return list.length ? Math.min(...list.map(s => fleeChance(s.ship, (s.sub || {}).engines))) : 0; }
  // When the player brings escorts, the enemy brings support too: hostiles are topped up to match, up to three.
  const SUPPORT = {
    scrapjaw: { cls: 'scrapjaw', name: 'Corsair escort' }, revenant: { cls: 'scrapjaw', name: 'Ash Fleet escort' },
    seraph: { cls: 'seraph', name: 'Directorate drone' }, wraith: { cls: 'wraith', name: 'Wraith brood' }, thrall: { cls: 'thrall', name: 'Thrall' }
  };
  // Not every fight is matched: a spec's `support` caps how many ships the enemy may add (story operations and station
  // missions set it); for generated fights it is drawn from the encounter id, so some stay outnumbered.
  function supportCap(spec) { return Number.isInteger(spec.support) ? spec.support : hash(String(spec.id)) % MAX_FLEET; }
  function reinforcements(spec, fleetSize) {
    const want = Math.min(MAX_FLEET, Math.max(1, fleetSize)), have = spec.enemies.length, add = Math.min(Math.max(0, want - have), supportCap(spec));
    const sup = SUPPORT[spec.enemies[0].cls] || SUPPORT[{ pyre: 'revenant', arbiter: 'seraph', mother: 'wraith', sentinel: 'seraph', thrall: 'thrall' }[spec.enemies[0].cls]] || SUPPORT.scrapjaw, out = [];
    for (let i = 0; i < add; i++) out.push({ cls: sup.cls, name: sup.name, hull: 0.42, shield: 0.6, diff: 'commander', support: true });
    return out;
  }

  // ---------------- encounter specs ----------------
  const ENV_BY_REGION = { 'Meridian Core': 0, 'Kestrel Verge': 1, 'Ash Marches': 2, 'Red Narrows': 3, 'Halcyon Belt': 4, 'Harrow Expanse': 5 };
  // Everything the battle page needs to stage a fight, as plain JSON (it travels in the save under `launch`).
  // ctx (optional): { flags, fronts } from the save, so a battle reflects earlier decisions and the war.
  function encounter(src, ctx) {
    const story = storyById[src.id] === src, sys = byId[src.system] || byId.kestrel;
    const label = story && src.boss ? 'ACT ' + ACTS[src.act - 1].numeral + ' FINALE' : story ? 'OPERATION ' + String(src.id).padStart(2, '0') : src.kind === 'side' ? 'STATION MISSION' : src.kind === 'intercept' ? 'INTERCEPTION' : (CONTRACT_TYPES[src.type] || { label: 'Contract' }).label.toUpperCase() + ' CONTRACT';
    const lead = src.enemies[0], foe = foeFor(sys, src.act || 1);
    const spec = {
      id: story ? 'story:' + src.id : src.id, kind: story ? 'story' : src.kind, story: story ? src.id : null, system: sys.id,
      title: src.name, label, objective: src.hud || src.objective, reward: src.reward || 0,
      env: story && src.id <= 5 ? src.id : ENV_BY_REGION[sys.region] || 0, gate: src.goal.type === 'escort',
      hail: story ? src.id : { name: lead.name, faction: foe.group, line: src.taunt || HAILS[lead.cls] },
      enemies: src.enemies.map(e => Object.assign({}, e)), goal: Object.assign({}, src.goal), ends: src.ends || null,
      support: Number.isInteger(src.support) ? src.support : null, boss: src.boss && typeof src.boss === 'object' ? JSON.parse(JSON.stringify(src.boss)) : null
    };
    return shape(spec, story ? src.id : null, ctx);
  }
  const HAILS = {
    scrapjaw: 'Cut your engines, Navy. Whatever is in your hold is ours now.',
    revenant: 'This sector is closed by order of the Ash Fleet. Turn back or be counted with the dead.',
    seraph: 'Human platform: your trajectory has been predicted. Your outcome has been predicted.',
    wraith: '...a low harmonic rises through the hull. It is not a language. It is a hunting call.',
    sentinel: 'Firing solution acquired at four kilometres. Hold your course, human platform. It will be quicker.',
    thrall: '...a chorus of small, sharp clicks, closing from every bearing at once.'
  };
  const storyEncounter = (id, ctx) => storyById[id] ? encounter(storyById[id], ctx) : null;
  // Decisions and fronts reshape a battle. Every change is listed in spec.notes for the briefing.
  function shape(spec, storyId, ctx) {
    spec.notes = [];
    if (!ctx) return spec;
    const flags = ctx.flags || {};
    if (storyId) for (const c of CONSEQUENCES) if (flags[c.flag] && c.story.includes(storyId)) { c.apply(spec); spec.notes.push(c.note); }
    const f = frontOf(ctx.fronts, spec.system);
    if (f) {
      spec.front = { region: f.region, level: f.level, name: f.name, hull: FRONT_EFFECTS.enemyHull[f.level] };
      if (f.level !== 2) spec.notes.push(`${f.region} front: ${f.name.toLowerCase()}. Enemy ships here are ${f.level < 2 ? 'reinforced' : 'worn down'} (${Math.round((spec.front.hull - 1) * 100) > 0 ? '+' : ''}${Math.round((spec.front.hull - 1) * 100)}% hull).`);
    }
    // The war shapes the finales.
    const level = r => front(ctx.fronts, r).level;
    if (storyId === 8) {
      const clans = [2, 2, 2, 1, 0][level('Red Narrows')], p = spec.boss.phases[1];
      p.spawn = p.spawn.slice(0, clans);
      spec.notes.push(clans === 2 ? 'The Red Narrows clans still answer Halloran’s call.' : clans === 1 ? 'With the Red Narrows front turning, only one clan answers Halloran.' : 'The Red Narrows are secured: no clan will answer Halloran.');
      if (level('Ash Marches') >= 3) { spec.enemies = spec.enemies.slice(0, 1); spec.notes.push('The Ash Marches are turning: the Pyre has lost its escort.'); }
    }
    if (storyId === 9) {
      const p = spec.boss.phases.find(x => x.lattice), l = level('Halcyon Belt'), k = [0.15, 0.2, 0.2, 0.35, 0.5][l];
      if (p) { p.lattice = Math.max(p.lattice, k); if (l !== 1 && l !== 2) spec.notes.push(l > 2 ? 'Navy gains in the Halcyon Belt have thinned the Arbiter’s lattice.' : 'The Directorate holds the Halcyon Belt: the Arbiter’s lattice is at full strength.'); }
    }
    if (storyId === 10) {
      const brood = [3, 2, 2, 1, 0][level('Harrow Expanse')], p = spec.boss.phases[1];
      p.spawn = brood > p.spawn.length ? [...p.spawn, ...p.spawn.slice(0, brood - p.spawn.length)] : p.spawn.slice(0, brood);
      if (brood !== 2) spec.notes.push(brood > 2 ? 'The Wraith hold the Harrow Expanse: a larger brood wakes for the Mother.' : brood === 1 ? 'With the Harrow front turning, only one brood ship wakes.' : 'The Harrow Expanse is secured: the Mother’s brood never wakes.');
    }
    return spec;
  }

  root.BroadsideCampaign = Object.freeze({
    SYSTEMS, byId, ROUTES, THREATS, threatLevel, neighbors, path, jumps,
    ACTS, STORY, STORY_ORDER, storyById, actOf, storyUnlocked, storyAvailable, openStory,
    STATIONS, nearestStation, SIDE, sideById, sideMissions, sideLeg,
    CONTRACT_TYPES, contracts, hostile, rollInterception, interception, fleeChance,
    ENV_BY_REGION, encounter, storyEncounter, supportCap, NARRATIVE, CONSEQUENCES, CHOICE_STAKES,
    FRONTS, FRONT_REGIONS, ACT_FRONT, FRONT_STATES, PUSHBACK, FRONT_EFFECTS, startFronts, front, frontOf, frontShift, applyBattle,
    SAVE_BASE, SLOT_KEY, SLOTS, slotKey, activeSlot, saveKey, DIFFICULTY, difficulty,
    REP_TIERS, REP, standing, adjustRep, repChanges,
    MAX_FLEET, HULL_PRICES, CAPTURE, capturable, prizeName, SHIP_NAMES, sellPrice, nextShipName, deployed, fleetFleeChance, reinforcements
  });
})(typeof window !== 'undefined' ? window : globalThis);

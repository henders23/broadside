// The campaign codex: ships, factions, people, places and a captain's guide. Entries unlock as the campaign
// reveals them (see `unlock`, checked by campaign.html against the save). Loaded by the campaign map and the Node tests.
(function (root) {
  'use strict';
  // unlock: 'start' | { met: shipClass } | { story: id } (completed) | { open: id } (unlocked) | { act: n } | { region: name } (visited) | { rep: tier level }
  const CATEGORIES = ['Ships', 'Factions', 'People', 'Places', 'Guide'];
  const entries = [
    // Ships: the player's hulls
    { id: 'ship-bastion', cat: 'Ships', title: 'Bastion', sub: 'Heavy battleship · Meridian Navy', unlock: 'start',
      text: ['The backbone of the frontier fleet: slow, broad and thick-shielded, with six turrets on each beam and a pair of dorsal turrets that cover the forward arcs.', 'A Bastion wins by turning its stronger beam toward the enemy and keeping it there. It turns badly, so plan the turn before you need it.'],
      stats: [['Hull', '3,000'], ['Shields', '4 × 620'], ['Top speed', '42 m/s'], ['Torpedoes', '8']] },
    { id: 'ship-halberd', cat: 'Ships', title: 'Halberd', sub: 'Lance cruiser · Meridian Navy', unlock: 'start',
      text: ['A narrow, quick cruiser built around a spinal lance that fires only dead ahead. Four turrets on each beam fill the time while the lance charges.', 'Line up, fire the lance, then turn away while it recharges.'],
      stats: [['Hull', '2,500'], ['Shields', '4 × 520'], ['Top speed', '58 m/s'], ['Lance', '600 a second for 2.4 s']] },
    { id: 'ship-sabre', cat: 'Ships', title: 'Sabre', sub: 'Battlecruiser · Meridian Navy', unlock: 'start',
      text: ['The fastest hull in the fleet, with a three-turret bow battery covering the forward quarter and thin shields.', 'Sabres fight charging in at an angle, and are the best ships in the fleet at breaking away from an ambush.'],
      stats: [['Hull', '2,400'], ['Shields', '4 × 500'], ['Top speed', '62 m/s'], ['Torpedoes', '6']] },
    { id: 'ship-warden', cat: 'Ships', title: 'Warden', sub: 'Siege dreadnought · Meridian Navy', unlock: 'start',
      text: ['The heaviest and slowest ship the Navy flies. Its siege cannons outrange everything else in the Reach, and it carries six torpedo tubes.', 'A Warden wants the fight at long range and dead ahead. Up close it is a large, slow target.'],
      stats: [['Hull', '3,600'], ['Shields', '4 × 600'], ['Top speed', '36 m/s'], ['Torpedoes', '16']] },
    // Ships: hostile classes
    { id: 'ship-scrapjaw', cat: 'Ships', title: 'Scrapjaw', sub: 'Pirate ram · Corsair Clans', unlock: { met: 'scrapjaw' },
      text: ['A pirate hull built from salvage: heavy armour, weak shields, autocannon tracer streams and scatterguns that shred at close range.', 'Its prow is reinforced for ramming. Keep your distance and turn away when it charges. A Scrapjaw wreck can be claimed and refitted.'],
      stats: [['Hull', '5,000'], ['Shields', '4 × 420'], ['Top speed', '60 m/s'], ['Capturable', 'Yes']] },
    { id: 'ship-revenant', cat: 'Ships', title: 'Revenant', sub: 'Minelayer · Ash Fleet', unlock: { met: 'revenant' },
      text: ['A Warden hull rebuilt by the Ash Fleet with missile racks, flak broadsides and a mine layer astern.', 'It keeps you on its quarter and drops mines for anyone chasing it. Revenant wrecks can be claimed; the refit keeps the mine layer.'],
      stats: [['Hull', '4,400'], ['Shields', '4 × 600'], ['Top speed', '42 m/s'], ['Capturable', 'Yes']] },
    { id: 'ship-seraph', cat: 'Ships', title: 'Seraph', sub: 'Beam frigate · Autonomous Directorate', unlock: { met: 'seraph' },
      text: ['A machine frigate with strong, fast-recharging shields on a fragile hull, three tracking beam emitters and a long-range railgun.', 'It holds range and snipes. Close in and work one shield facing down. Navy engineers can make a captured Seraph answer a human helm.'],
      stats: [['Hull', '2,000'], ['Shields', '4 × 620'], ['Top speed', '58 m/s'], ['Capturable', 'Yes']] },
    { id: 'ship-wraith', cat: 'Ships', title: 'Wraith', sub: 'Bioship · Wraith', unlock: { met: 'wraith' },
      text: ['A living ship. Its green plasma eats shields, its spore swarms home on their target, and its hull grows back whenever it is left alone.', 'Keep firing: a Wraith you stop shooting is a Wraith that heals. Wraith hulls cannot be captured; they die when they stop being fed.'],
      stats: [['Hull', '3,000'], ['Shields', '4 × 460'], ['Regrowth', '12 a second'], ['Capturable', 'No']] },
    { id: 'ship-pyre', cat: 'Ships', title: 'Pyre', sub: 'Dreadnought · Ash Fleet flagship', unlock: { open: 8 },
      text: ['Commodore Halloran’s flagship: a Warden hull enlarged into a fortress, with siege cannons, flak, missiles, mines and an inferno salvo held back for the end.'],
      stats: [['Hull', '9,500'], ['Shields', '4 × 950'], ['Phases', '3']] },
    { id: 'ship-arbiter', cat: 'Ships', title: 'Arbiter', sub: 'Core warship · Autonomous Directorate', unlock: { open: 9 },
      text: ['The ship that carries the Directorate’s mind. Heavy shields, beam arrays, a railgun and a spinal lance, and a shield lattice held up by node ships.'],
      stats: [['Hull', '7,000'], ['Shields', '4 × 1,300'], ['Phases', '3']] },
    { id: 'ship-mother', cat: 'Ships', title: 'Bloom-Mother', sub: 'Brood-mother · Wraith', unlock: { open: 10 },
      text: ['The mother of the Wraith brood, many times the size of a bioship. Its hull regrows faster the more it is hurt.'],
      stats: [['Hull', '8,500'], ['Regrowth', '26 a second, faster when wounded'], ['Phases', '3']] },
    // Factions
    { id: 'fac-navy', cat: 'Factions', title: 'Meridian Navy', sub: 'Frontier Fleet', unlock: 'start',
      text: ['The Navy holds the Meridian Core and is meant to hold the Reach. After fourteen quiet years it has too few ships and too much frontier.', 'The Meridian Fleet Yards and the Tarn depot are Navy starbases; story operations raise your standing with both.'] },
    { id: 'fac-independents', cat: 'Factions', title: 'The independent stations', sub: 'Peregrine, Elysia, Juniper', unlock: 'start',
      text: ['Traders, scientists and port authorities who answer to nobody. When the Navy is slow they post their own work, and they remember who took it.', 'Standing with a station brings discounts at its yard, better pay and, once it trusts you, priority contracts.'] },
    { id: 'fac-corsairs', cat: 'Factions', title: 'Corsair Clans', sub: 'Pirates of the Red Narrows', unlock: { met: 'scrapjaw' },
      text: ['A loose federation of raiders based around the Red Narrows. They have always preyed on the eastern lanes; lately they have been doing it with Navy hardware.'] },
    { id: 'fac-ash', cat: 'Factions', title: 'The Ash Fleet', sub: 'Renegades of the Ash Marches', unlock: { story: 2 },
      text: ['Navy crews who never accepted the peace, led by officers who were declared dead. They fly rebuilt Navy hulls out of Grimhold and the Cinder Wake.'] },
    { id: 'fac-directorate', cat: 'Factions', title: 'The Autonomous Directorate', sub: 'Machines of the Halcyon Belt', unlock: { open: 4 },
      text: ['An intelligence that answers questions before they are asked. Its warships have been watching the Reach for longer than anyone has been looking.'] },
    { id: 'fac-wraith', cat: 'Factions', title: 'The Wraith', sub: 'Harrow Expanse', unlock: { open: 5 },
      text: ['Living ships that grow, heal and hunt. They do not answer hails. The Directorate’s archive suggests the machines were trying to empty the Reach before the Wraith arrived.'] },
    // People
    { id: 'p-harlan', cat: 'People', title: 'Fleet Admiral Gideon Harlan', sub: 'Commander, Frontier Fleet', unlock: 'start',
      text: ['Harlan has commanded the frontier since before the quiet years. He sent you out of Meridian because there was nobody else to send.'] },
    { id: 'p-vex', cat: 'People', title: 'Captain Kora Vex', sub: 'Corsair Clans · The Kestrel Marauder', unlock: { open: 1 },
      text: ['A raider who prefers unarmed targets and rams anything that gets in her way.'] },
    { id: 'p-sable', cat: 'People', title: 'Commander Orren Sable', sub: 'Ash Fleet · The Exile', unlock: { open: 2 },
      text: ['An Ash Fleet commander who lays mines by a Navy doctrine manual that was withdrawn years ago.'] },
    { id: 'p-thorne', cat: 'People', title: 'Captain Garrick Thorne', sub: 'Corsair Clans · The Widowmaker', unlock: { open: 3 },
      text: ['The pirate who held the Red Narrows toll. He values his ship more than his cause, which makes him one of the few enemies who will surrender.'] },
    { id: 'p-halloran', cat: 'People', title: 'Commodore Ingrid Halloran', sub: 'Ash Fleet commander', unlock: { open: 8 },
      text: ['A Navy officer who taught half the frontier fleet, then left with the Ash Fleet. She knows every tactic you were taught because she wrote most of them.'] },
    { id: 'p-oracle', cat: 'People', title: 'ORACLE-9', sub: 'Directorate pursuit intelligence', unlock: { open: 4 },
      text: ['The machine guarding the Halcyon relay: the first Directorate mind to speak to a Navy ship in living memory.'] },
    { id: 'p-arbiter', cat: 'People', title: 'The Arbiter', sub: 'Directorate core intelligence', unlock: { open: 9 },
      text: ['The Directorate itself, or as much of it as fits in one hull.'] },
    { id: 'p-cantor', cat: 'People', title: 'The Cantor', sub: 'Wraith', unlock: { open: 5 },
      text: ['The first Wraith ever met. It sings, or something like it, on frequencies the bridge can feel through the deck.'] },
    { id: 'p-mother', cat: 'People', title: 'The Bloom-Mother', sub: 'Wraith', unlock: { open: 10 },
      text: ['What the Wraith grow from. As long as it lives in Verdant’s orbit, the brood keeps coming.'] },
    // Places
    { id: 'pl-core', cat: 'Places', title: 'Meridian Core', sub: 'Human Navy territory', unlock: 'start',
      text: ['Five safe systems around Meridian: the fleet yards, the Tarn depot, the Solace hospitals and the Innerpost listening station.'] },
    { id: 'pl-kestrel', cat: 'Places', title: 'Kestrel Verge', sub: 'Contested space', unlock: { region: 'Kestrel Verge' },
      text: ['The trade spur east of Meridian, through which every merchant bound for the frontier passes. Peregrine Exchange is its port.'] },
    { id: 'pl-narrows', cat: 'Places', title: 'Red Narrows', sub: 'Pirate space', unlock: { region: 'Red Narrows' },
      text: ['A bottleneck of jump lanes and scarred moons, home to the Corsair Clans and the hidden market at Scour.'] },
    { id: 'pl-ash', cat: 'Places', title: 'Ash Marches', sub: 'Renegade space', unlock: { region: 'Ash Marches' },
      text: ['Industrial systems south of the Core that slipped out of Navy control. Grimhold’s dockyard is the Ash Fleet’s fortress.'] },
    { id: 'pl-halcyon', cat: 'Places', title: 'Halcyon Belt', sub: 'Trade and research', unlock: { region: 'Halcyon Belt' },
      text: ['Independent colonies, the Elysia observatory and the Juniper Ringport, and in the middle of them the relay at Halcyon that has been broadcasting for years.'] },
    { id: 'pl-harrow', cat: 'Places', title: 'Harrow Expanse', sub: 'Alien space', unlock: { region: 'Harrow Expanse' },
      text: ['The far frontier. Its colonies are going quiet one by one, and Verdant, once the greenest world in the Reach, no longer answers at all.'] },
    // Guide
    { id: 'g-shields', cat: 'Guide', title: 'Shields and facings', sub: 'Captain’s guide', unlock: 'start',
      text: ['Every ship has four shield banks: fore, aft, port and starboard. Damage hits the facing toward the shot. Arrow keys reinforce one facing at the others’ expense.', 'Keep your strongest facing toward the enemy, and move reactor power to shields when a facing runs low.'] },
    { id: 'g-power', cat: 'Guide', title: 'Reactor power', sub: 'Captain’s guide', unlock: 'start',
      text: ['Keys 1, 2 and 3 move power to engines, shields and weapons; 4 balances it. Damage to the reactor costs power, so protect it.'] },
    { id: 'g-officers', cat: 'Guide', title: 'Bridge officers', sub: 'Captain’s guide', unlock: 'start',
      text: ['Each officer gives one battle command on keys 5–9. Officers gain experience in every engagement and are promoted, which makes their command stronger and quicker to recharge.', 'Officers for hire at starbases can replace any of the five; the Officers screen assigns who serves at each post.'] },
    { id: 'g-stations', cat: 'Guide', title: 'Starbases and standing', sub: 'Captain’s guide', unlock: 'start',
      text: ['Repairs, rearming, upgrades and ships are only available at a starbase. Each starbase posts station missions and contracts.', 'Work for a station raises your standing there: Friendly (25) takes 5% off its yard and adds 5% to its pay, Trusted (50) 10% and a priority contract, Honoured (75) 15%. Abandoning its work costs standing.'] },
    { id: 'g-fleet', cat: 'Guide', title: 'Commanding a fleet', sub: 'Captain’s guide', unlock: 'start',
      text: ['You can command up to three ships. You fly the flagship; escorts follow your standing order: U focus my target, I defend the flagship, O engage freely.', 'Bring escorts and the enemy may bring support of its own, but not every fight is matched.'] },
    { id: 'g-ambush', cat: 'Guide', title: 'Interceptions', sub: 'Captain’s guide', unlock: 'start',
      text: ['Jumps are free, but hostile space can spring an ambush. Fight it for salvage or try to break away; the fleet escapes only as well as its slowest, most damaged ship.'] },
    { id: 'g-capture', cat: 'Guide', title: 'Claiming wrecks', sub: 'Captain’s guide', unlock: { met: 'scrapjaw' },
      text: ['After a victory, salvage crews can tow a defeated Scrapjaw, Revenant or Seraph home and refit it for a Navy helm, if you have a berth free and can pay for the refit.', 'Claimed ships join the fleet damaged and fly like any other ship. Wraith and the act bosses cannot be claimed.'] },
    { id: 'g-bosses', cat: 'Guide', title: 'Act finales', sub: 'Captain’s guide', unlock: { open: 8 },
      text: ['Each act ends with a boss that fights in three phases. The boss bar marks where each phase begins; a phase can bring reinforcements, restore shields, unlock a weapon, or raise a lattice that only falls with its node ships.'] }
  ];
  const byId = Object.fromEntries(entries.map(e => [e.id, e]));
  // ctx: { completed, unlocked(id), act, regions (visited), met (ship classes) }
  function isOpen(e, ctx) {
    const u = e.unlock;
    if (u === 'start') return true;
    if (u.met) return ctx.met.includes(u.met);
    if (u.story) return ctx.completed.includes(u.story);
    if (u.open) return ctx.unlocked(u.open) || ctx.completed.includes(u.open);
    if (u.act) return ctx.act >= u.act;
    if (u.region) return ctx.regions.includes(u.region);
    return false;
  }
  const open = ctx => entries.filter(e => isOpen(e, ctx));
  root.BroadsideCodex = Object.freeze({ CATEGORIES, entries, byId, isOpen, open });
})(typeof window !== 'undefined' ? window : globalThis);

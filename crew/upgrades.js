// Flagship upgrades bought at the campaign shipyard and applied to the player's ship in campaign battles.
// Loaded by both the campaign map and the battle renderer, and by the Node tests.
(function (root) {
  'use strict';
  const catalogue = [
    { id: 'vectored_thrusters', slot: 'engines', name: 'Vectored thrusters', cost: 320, effect: 'Turns 20% faster.' },
    { id: 'high_yield_drive', slot: 'engines', name: 'High-yield drive', cost: 380, effect: '12% more top speed and acceleration.' },
    { id: 'afterburner_injectors', slot: 'engines', name: 'Afterburner injectors', cost: 260, effect: 'The afterburner lasts 10 s instead of 7.' },
    { id: 'reinforced_plating', slot: 'hull', name: 'Reinforced plating', cost: 420, effect: '15% more hull points.' },
    { id: 'ablative_belt', slot: 'hull', name: 'Ablative belt', cost: 380, effect: '10% less hull damage from every hit.' },
    { id: 'damage_control', slot: 'hull', name: 'Damage-control teams', cost: 280, effect: 'Subsystems repair 50% faster in battle.' },
    { id: 'overcharged_core', slot: 'reactor', name: 'Overcharged core', cost: 450, effect: '14 power pips to share instead of 12.' },
    { id: 'hardened_conduits', slot: 'reactor', name: 'Hardened conduits', cost: 260, effect: 'Reactor damage costs half as much power.' },
    { id: 'coolant_loop', slot: 'reactor', name: 'Coolant loop', cost: 340, effect: 'Every weapon reloads or charges 6% faster.' },
    { id: 'rapid_loaders', slot: 'broadside', name: 'Rapid loaders', cost: 400, effect: 'Broadsides reload 15% faster.' },
    { id: 'heavy_shells', slot: 'broadside', name: 'Heavy shells', cost: 380, effect: '15% more damage per broadside shell.' },
    { id: 'extended_barrels', slot: 'broadside', name: 'Extended barrels', cost: 300, effect: '12% more broadside range and shell speed.' },
    { id: 'fire_control', slot: 'fore', name: 'Fire-control computer', cost: 300, effect: '12% more range (and shell speed) for the forward weapon.' },
    { id: 'heavier_ordnance', slot: 'fore', name: 'Heavier ordnance', cost: 400, effect: '15% more damage from the forward weapon.' },
    { id: 'faster_cycling', slot: 'fore', name: 'Faster cycling', cost: 360, effect: 'The forward weapon reloads or charges 15% faster.' },
    { id: 'capacitor_array', slot: 'shields', name: 'Capacitor array', cost: 420, effect: '15% stronger shields.' },
    { id: 'regeneration_coils', slot: 'shields', name: 'Regeneration coils', cost: 340, effect: 'Shields recover 25% faster.' },
    { id: 'hardened_emitters', slot: 'shields', name: 'Hardened emitters', cost: 260, effect: 'Generator damage weakens shields half as much.' },
    { id: 'expanded_magazine', slot: 'torp', name: 'Expanded magazine', cost: 300, effect: 'Carries 50% more torpedoes.' },
    { id: 'fast_reload_tubes', slot: 'torp', name: 'Fast-reload tubes', cost: 320, effect: 'Torpedo tubes reload 20% faster.' },
    { id: 'heavy_warheads', slot: 'torp', name: 'Heavy warheads', cost: 380, effect: '20% more damage per torpedo.' }
  ];
  const byId = Object.fromEntries(catalogue.map(u => [u.id, u]));
  const owned = list => new Set((Array.isArray(list) ? list : []).filter(id => byId[id]));
  const forSlot = slot => catalogue.filter(u => u.slot === slot);
  const torpedoCap = (base, list) => owned(list).has('expanded_magazine') ? Math.round(base * 1.5) : base;

  // Returns a copy of a ship class with the owned upgrades applied; the class itself is never changed.
  // Weapon groups are matched by role: port/stbd broadsides, the 'fore' weapon and the torpedo group.
  function apply(base, list) {
    const has = owned(list);
    if (!has.size) return base;
    const C = { ...base, weapons: base.weapons.map(w => ({ ...w })), upgrades: [...has] };
    const broad = C.weapons.filter(w => w.sub === 'port' || w.sub === 'stbd');
    const fore = C.weapons.filter(w => w.sub === 'fore');
    const torps = C.weapons.filter(w => w.type === 'torpedo' || w.type === 'mine');   // a claimed minelayer's mine layer takes the torpedo-bay upgrades
    const faster = (w, k) => { if (w.reload) w.reload *= k; if (w.chargeT) w.chargeT *= k; };
    const harder = (w, k) => { if (w.dmg) w.dmg = Math.round(w.dmg * k); if (w.dps) w.dps = Math.round(w.dps * k); };
    const longer = (w, k) => { w.range = Math.round(w.range * k); if (w.speed) w.speed = Math.round(w.speed * k); };
    if (has.has('vectored_thrusters')) C.turn *= 1.2;
    if (has.has('high_yield_drive')) { C.vmax *= 1.12; C.accel *= 1.12; }
    if (has.has('afterburner_injectors')) C.abBurn = 10;
    if (has.has('reinforced_plating')) C.hull = Math.round(C.hull * 1.15);
    if (has.has('ablative_belt')) C.armour = 0.9;
    if (has.has('damage_control')) C.repairRate = 1.5;
    if (has.has('overcharged_core')) C.power = 14;
    if (has.has('hardened_conduits')) C.reactorHardened = true;
    if (has.has('coolant_loop')) C.weapons.forEach(w => faster(w, 0.94));
    if (has.has('rapid_loaders')) broad.forEach(w => faster(w, 0.85));
    if (has.has('heavy_shells')) broad.forEach(w => harder(w, 1.15));
    if (has.has('extended_barrels')) broad.forEach(w => longer(w, 1.12));
    if (has.has('fire_control')) fore.forEach(w => longer(w, 1.12));
    if (has.has('heavier_ordnance')) fore.forEach(w => harder(w, 1.15));
    if (has.has('faster_cycling')) fore.forEach(w => faster(w, 0.85));
    if (has.has('capacitor_array')) C.shield = Math.round(C.shield * 1.15);
    if (has.has('regeneration_coils')) C.regen *= 1.25;
    if (has.has('hardened_emitters')) C.shieldHardened = true;
    if (has.has('expanded_magazine')) torps.forEach(w => { w.ammo = torpedoCap(w.ammo, ['expanded_magazine']); });
    if (has.has('fast_reload_tubes')) torps.forEach(w => faster(w, 0.8));
    if (has.has('heavy_warheads')) torps.forEach(w => harder(w, 1.2));
    return C;
  }

  root.BroadsideUpgrades = Object.freeze({ catalogue, byId, forSlot, owned, apply, torpedoCap });
})(typeof window !== 'undefined' ? window : globalThis);

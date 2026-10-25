// Ship classes: every hull's stats, weapons, hardpoints and hull/shield ellipsoids, shared by the battle page
// (index.html), the campaign shipyard (campaign.html, via shipyardHull) and the Node tests.
// Angles (turn, angAcc, pitchMax) are in radians; weapon positions are model units with -z the bow.
(function (root) {
  'use strict';
  const deg = d => d * Math.PI / 180;
  const CLASSES = {
    bastion: {
      key: 'bastion', name: 'Bastion', cls: 'Heavy battleship', url: 'models/bastion.glb', size: 919464, scale: 300, rotY: Math.PI,
      hull: 3000, shield: 620, regen: 28, vmax: 42, accel: 2.2, turn: deg(5.5), angAcc: deg(1.5), pitchMax: deg(14), grip: 0.45,
      hullE: { c: [0, -15, 0], r: [40, 17, 146] }, shieldE: { c: [0, -10, 0], r: [64, 40, 178] },
      engines: [[-22, -20, 143], [0, -18, 144], [22, -20, 143]], glow: 16,
      weapons: [
        { id: 'port', label: 'Port battery', key: 'Q', type: 'battery', sub: 'port', center: -90, half: 68, elevMin: -35, elev: 35, range: 2700, reload: 7.5, dmg: 46, speed: 480, shots: 3, snd: 'cannon',
          guns: [-100, -60, -20, 20, 60, 100].map(z => [-31, -8, z]) },
        { id: 'stbd', label: 'Starboard battery', key: 'E', type: 'battery', sub: 'stbd', center: 90, half: 68, elevMin: -35, elev: 35, range: 2700, reload: 7.5, dmg: 46, speed: 480, shots: 3, snd: 'cannon',
          guns: [-100, -60, -20, 20, 60, 100].map(z => [31, -8, z]) },
        { id: 'dorsal', label: 'Dorsal turrets', key: 'Space', type: 'battery', sub: 'fore', center: 0, half: 150, elevMin: -8, elev: 70, range: 3000, reload: 5.5, dmg: 32, speed: 560, shots: 3, snd: 'turret',
          guns: [[0, 17, -62], [0, 9, 70]] },
        { id: 'torp', label: 'Torpedoes', key: 'T', type: 'torpedo', sub: 'torp', center: 0, half: 70, elevMin: -40, elev: 40, range: 5200, reload: 12, tubes: 4, ammo: 8, dmg: 340,
          guns: [[-14, -22, -146], [14, -22, -146]] }
      ],
      fore: 'Dorsal turrets', tip: 'Dorsal turrets (<b>Space</b>) cover almost every bearing: use them whenever they are loaded.',
      len: 294, blurb: 'Slow and wide. Six-gun broadsides on each beam and dorsal turrets that cover almost every bearing. Thick shields, wide turning circle.',
      arm: '2 × 6-turret broadside (18 shells a salvo) · 2 dorsal turrets · 4 torpedo tubes, 8 torpedoes',
      pref: 1900, camDist: 820, menuRot: 0.4,
      look: { rough: 0.45, metal: 0.55 }   // its texture is near-mirror smooth, so the sun glared off it
    },
    halberd: {
      key: 'halberd', name: 'Halberd', cls: 'Lance cruiser', url: 'models/halberd.glb', size: 910540, scale: 265, rotY: Math.PI / 2,
      hull: 2500, shield: 520, regen: 26, vmax: 58, accel: 3.4, turn: deg(9), angAcc: deg(2.7), pitchMax: deg(18), grip: 0.65,
      hullE: { c: [0, -10, 0], r: [30, 28, 128] }, shieldE: { c: [0, -4, 0], r: [50, 50, 154] },
      engines: [[-10, -10, 127], [10, -10, 127], [0, -24, 125]], glow: 13,
      weapons: [
        { id: 'lance', label: 'Spinal lance', key: 'Space', type: 'lance', sub: 'fore', center: 0, half: 4, elevMin: -4, elev: 4, range: 3600, chargeT: 14, dps: 600, dur: 2.4,
          guns: [[0, -14, -133]] },
        { id: 'port', label: 'Port battery', key: 'Q', type: 'battery', sub: 'port', center: -90, half: 70, elevMin: -35, elev: 35, range: 2500, reload: 5, dmg: 44, speed: 500, shots: 4, snd: 'lasercannon',
          guns: [-60, -20, 20, 60].map(z => [-30, -4, z]) },
        { id: 'stbd', label: 'Starboard battery', key: 'E', type: 'battery', sub: 'stbd', center: 90, half: 70, elevMin: -35, elev: 35, range: 2500, reload: 5, dmg: 44, speed: 500, shots: 4, snd: 'lasercannon',
          guns: [-60, -20, 20, 60].map(z => [30, -4, z]) },
        { id: 'torp', label: 'Torpedoes', key: 'T', type: 'torpedo', sub: 'torp', center: 0, half: 70, elevMin: -40, elev: 40, range: 5200, reload: 10, tubes: 2, ammo: 6, dmg: 340,
          guns: [[-8, -30, -124], [8, -30, -124]] }
      ],
      fore: 'Spinal lance', tip: 'The lance (<b>Space</b>) fires only dead ahead: point the bow, then fire. It strips shields fast.',
      len: 260, blurb: 'Narrow and quick on the helm. Built around a spinal lance that only fires dead ahead, so you aim it by pointing the whole ship. Lighter broadsides.',
      arm: 'Spinal lance · 2 × 4-turret broadside (16 shells a salvo) · 2 torpedo tubes, 6 torpedoes',
      pref: 2000, camDist: 700, menuRot: -0.3
    },
    sabre: {
      key: 'sabre', name: 'Sabre', cls: 'Battlecruiser', url: 'models/sabre.glb', size: 798228, scale: 286, rotY: Math.PI,
      hull: 2400, shield: 500, regen: 26, vmax: 62, accel: 3.8, turn: deg(7.5), angAcc: deg(2.1), pitchMax: deg(16), grip: 0.55,
      hullE: { c: [0, -10, 0], r: [36, 30, 139] }, shieldE: { c: [0, 0, 0], r: [58, 64, 168] },
      engines: [[-17, 5, 139], [17, 5, 139], [0, 11, 139], [-10, -5, 139], [10, -5, 139]], glow: 12,
      weapons: [
        { id: 'bow', label: 'Bow battery', key: 'Space', type: 'battery', sub: 'fore', center: 0, half: 55, elevMin: -20, elev: 30, range: 3100, reload: 6, dmg: 50, speed: 540, shots: 3, snd: 'turret', mount: 1.4,
          guns: [[0, 4, -96], [0, 7, -78], [0, 10, -60]] },
        { id: 'port', label: 'Port battery', key: 'Q', type: 'battery', sub: 'port', center: -90, half: 66, elevMin: -35, elev: 35, range: 2600, reload: 6, dmg: 42, speed: 500, shots: 3, snd: 'lasercannon',
          guns: [[-32, -4, -40], [-35, -4, -10], [-43, -4, 30], [-43, -4, 70]] },
        { id: 'stbd', label: 'Starboard battery', key: 'E', type: 'battery', sub: 'stbd', center: 90, half: 66, elevMin: -35, elev: 35, range: 2600, reload: 6, dmg: 42, speed: 500, shots: 3, snd: 'lasercannon',
          guns: [[32, -4, -40], [35, -4, -10], [43, -4, 30], [43, -4, 70]] },
        { id: 'torp', label: 'Torpedoes', key: 'T', type: 'torpedo', sub: 'torp', center: 0, half: 70, elevMin: -40, elev: 40, range: 5200, reload: 10, tubes: 2, ammo: 6, dmg: 340,
          guns: [[-8, -28, -128], [8, -28, -128]] }
      ],
      fore: 'Bow battery', tip: 'The bow battery (<b>Space</b>) covers the forward quarter. Close in bow-first, then turn to bring a broadside to bear as well.',
      len: 280, blurb: 'The fastest hull in the fleet. Three heavy turrets on the foredeck fire across the forward quarter, so it fights best charging in at an angle. Thin shields.',
      arm: '3-turret bow battery · 2 × 4-turret broadside (12 shells a salvo) · 2 torpedo tubes, 6 torpedoes',
      pref: 2300, beam: 45, camDist: 760, menuRot: 0.6
    },
    warden: {
      key: 'warden', name: 'Warden', cls: 'Siege dreadnought', url: 'models/warden.glb', size: 831496, scale: 320, rotY: Math.PI,
      hull: 3600, shield: 600, regen: 24, vmax: 36, accel: 1.8, turn: deg(4.5), angAcc: deg(1.2), pitchMax: deg(12), grip: 0.4,
      hullE: { c: [0, -12, 0], r: [36, 32, 155] }, shieldE: { c: [0, 0, 0], r: [58, 64, 188] },
      engines: [[-23, 13, 156], [23, 13, 156], [-13, -4, 156], [13, -4, 156]], glow: 15,
      weapons: [
        { id: 'siege', label: 'Siege cannons', key: 'Space', type: 'battery', sub: 'fore', center: 0, half: 22, elevMin: -12, elev: 20, range: 4200, reload: 12, dmg: 150, speed: 640, shots: 2, snd: 'cannon', mount: 2.2, bow: true,
          guns: [[0, 10, -118], [0, 12, -86]] },
        { id: 'port', label: 'Port battery', key: 'Q', type: 'battery', sub: 'port', center: -90, half: 64, elevMin: -35, elev: 35, range: 2700, reload: 8, dmg: 44, speed: 470, shots: 3, snd: 'cannon',
          guns: [[-28, -4, -90], [-40, -4, -50], [-40, -4, -10], [-39, -4, 30], [-40, -4, 70]] },
        { id: 'stbd', label: 'Starboard battery', key: 'E', type: 'battery', sub: 'stbd', center: 90, half: 64, elevMin: -35, elev: 35, range: 2700, reload: 8, dmg: 44, speed: 470, shots: 3, snd: 'cannon',
          guns: [[28, -4, -90], [40, -4, -50], [40, -4, -10], [39, -4, 30], [40, -4, 70]] },
        { id: 'torp', label: 'Torpedoes', key: 'T', type: 'torpedo', sub: 'torp', center: 0, half: 80, elevMin: -40, elev: 40, range: 5200, reload: 11, tubes: 6, ammo: 16, dmg: 340,
          guns: [[-10, -35, -140], [10, -35, -140], [-16, -40, -120], [16, -40, -120], [-20, -40, -100], [20, -40, -100]] }
      ],
      fore: 'Siege cannons', tip: 'Siege cannons (<b>Space</b>) hit hardest and reach farthest, but only within a narrow arc ahead. Point the bow and fire from long range.',
      len: 314, blurb: 'The heaviest hull and the slowest helm. Two siege cannons out-range every other gun but only fire ahead, and six torpedo tubes finish what they open up.',
      arm: '2 siege cannons · 2 × 5-turret broadside (15 shells a salvo) · 6 torpedo tubes, 16 torpedoes',
      pref: 2500, camDist: 880, menuRot: -0.5
    },

    // enemy-only ships: never offered in the picker, only met in battle
    wraith: {
      key: 'wraith', name: 'Wraith', cls: 'Alien bioship', enemyOnly: true, url: 'models/wraith.glb', size: 834700, scale: 270, rotY: Math.PI,
      hull: 3000, shield: 460, regen: 30, hullRegen: 12, vmax: 60, accel: 3.6, turn: deg(10), angAcc: deg(2.8), pitchMax: deg(20), grip: 0.7,
      hullE: { c: [0, 4, 0], r: [70, 22, 112] }, shieldE: { c: [0, 4, 0], r: [118, 52, 140] },
      engines: [[0, 14, 116], [-10, 2, 114], [10, 2, 114]], glow: 14, glowCol: [0.5, 3, 0.9],
      weapons: [
        { id: 'plasma', label: 'Plasma spitters', key: 'Space', type: 'battery', sub: 'fore', center: 0, half: 110, elevMin: -40, elev: 40, range: 2600, reload: 5, dmg: 70, speed: 380, shots: 2, style: 'plasma', kind: 'plasma', bare: true, snd: 'lasercannon', sndRate: 0.55,
          guns: [[-40, 10, -60], [40, 10, -60], [-20, 18, -90], [20, 18, -90]] },
        { id: 'spores', label: 'Spore swarm', key: 'T', type: 'missile', sub: 'torp', center: 0, half: 160, elevMin: -60, elev: 60, range: 3200, reload: 12, salvo: 8, dmg: 45, speed: 90, vmax: 260, turn: 1.6, life: 16, col: [0.6, 3.2, 1], snd: 'torplaunch', sndRate: 1.5,
          guns: [[-60, 2, 0], [60, 2, 0], [-30, 4, 40], [30, 4, 40]] }
      ],
      fore: 'Plasma spitters', pref: 1900, beam: 35,
      intel: 'Alien bioship. Its green plasma eats shields and its hull grows back, so keep the pressure on. Spore swarms home in on you; point defence thins them out.'
    },
    scrapjaw: {
      key: 'scrapjaw', name: 'Scrapjaw', cls: 'Pirate ram', enemyOnly: true, url: 'models/scrapjaw.glb', size: 904216, scale: 255, rotY: Math.PI,
      hull: 5000, shield: 420, regen: 24, vmax: 60, accel: 3.4, turn: deg(7.5), angAcc: deg(2.2), pitchMax: deg(16), grip: 0.6, ram: 0.35, ramDmg: 1.6,
      hullE: { c: [0, -8, 0], r: [34, 30, 122] }, shieldE: { c: [0, 0, 0], r: [56, 62, 150] },
      engines: [[-34, 2, 124], [34, 2, 124], [-14, -22, 122], [14, -22, 122]], glow: 16, glowCol: [3.2, 1.3, 0.4],
      weapons: [
        { id: 'auto', label: 'Autocannons', key: 'Space', type: 'battery', sub: 'fore', center: 0, half: 60, elevMin: -30, elev: 30, range: 2500, reload: 4, dmg: 13, speed: 760, shots: 14, gap: 0.07, sndEvery: 3, style: 'tracer', snd: 'pd2', sndRate: 0.7,
          guns: [[0, 6, -85], [0, 9, -62]] },
        { id: 'port', label: 'Port scatterguns', key: 'Q', type: 'battery', sub: 'port', center: -90, half: 70, elevMin: -35, elev: 35, range: 2000, reload: 3.5, dmg: 18, speed: 640, shots: 2, pellets: 5, spread: 0.06, style: 'flak', snd: 'cannon', sndRate: 1.3,
          guns: [[-26, -6, -40], [-29, -6, -10], [-36, -6, 20], [-36, -6, 60]] },
        { id: 'stbd', label: 'Starboard scatterguns', key: 'E', type: 'battery', sub: 'stbd', center: 90, half: 70, elevMin: -35, elev: 35, range: 2000, reload: 3.5, dmg: 18, speed: 640, shots: 2, pellets: 5, spread: 0.06, style: 'flak', snd: 'cannon', sndRate: 1.3,
          guns: [[26, -6, -40], [29, -6, -10], [36, -6, 20], [36, -6, 60]] }
      ],
      fore: 'Autocannons', pref: 1100, beam: 60, rammer: true,
      intel: 'Pirate ram. Thick armour, weak shields, and scatterguns that shred at close range. It will try to ram you: keep your distance and turn away when it charges.'
    },
    seraph: {
      key: 'seraph', name: 'Seraph', cls: 'Beam frigate', enemyOnly: true, url: 'models/seraph.glb', size: 853132, scale: 280, rotY: Math.PI,
      hull: 2000, shield: 620, regen: 42, vmax: 58, accel: 3.4, turn: deg(7), angAcc: deg(2), pitchMax: deg(16), grip: 0.6,
      hullE: { c: [0, -4, 0], r: [80, 18, 130] }, shieldE: { c: [0, 0, 0], r: [112, 40, 160] },
      engines: [[-8, -2, 137], [8, -2, 137], [-8, -16, 137], [8, -16, 137]], glow: 13, glowCol: [1.6, 2.6, 4],
      weapons: [
        { id: 'rail', label: 'Railgun', key: 'Space', type: 'battery', sub: 'fore', center: 0, half: 8, elevMin: -8, elev: 8, range: 4800, reload: 11, dmg: 240, speed: 2600, shots: 1, style: 'rail', kind: 'rail', bare: true, bow: true, snd: 'lasercannon', sndRate: 1.6,
          guns: [[0, 2, -128]] },
        { id: 'beams', label: 'Beam arrays', key: 'E', type: 'beam', sub: 'port', center: 0, half: 160, elevMin: -50, elev: 50, range: 2900, chargeT: 6, dur: 2.2, dps: 90, col: [1.4, 3, 5], width: 2.5, snd: 'lance', sndRate: 1.7,
          guns: [[-70, 6, 0], [70, 6, 0], [0, 20, -50]] }
      ],
      fore: 'Railgun', pref: 2700, beam: 70,
      intel: 'Beam frigate. Strong shields that recharge fast but a fragile hull. It keeps its distance and snipes with a railgun, so close in and work one shield facing down.'
    },
    revenant: {
      key: 'revenant', name: 'Revenant', cls: 'Minelayer', enemyOnly: true, model: 'warden', url: 'models/warden.glb', size: 831496, scale: 320, rotY: Math.PI, tint: [0.62, 0.34, 0.32],
      hull: 4400, shield: 600, regen: 28, vmax: 42, accel: 2.2, turn: deg(5.5), angAcc: deg(1.5), pitchMax: deg(12), grip: 0.45,
      hullE: { c: [0, -12, 0], r: [36, 32, 155] }, shieldE: { c: [0, 0, 0], r: [58, 64, 188] },
      engines: [[-23, 13, 156], [23, 13, 156], [-13, -4, 156], [13, -4, 156]], glow: 15, glowCol: [4, 0.7, 0.5],
      weapons: [
        { id: 'missiles', label: 'Missile racks', key: 'Space', type: 'missile', sub: 'fore', center: 0, half: 180, elevMin: -90, elev: 90, range: 3600, reload: 12, salvo: 8, dmg: 58, speed: 70, vmax: 320, turn: 1.1, life: 15, pdK: 0.11, col: [4, 1, 0.6], snd: 'torplaunch', sndRate: 1.15,
          guns: [[-12, 26, -40], [12, 26, -40], [-12, 28, 10], [12, 28, 10]] },
        { id: 'port', label: 'Port flak', key: 'Q', type: 'battery', sub: 'port', center: -90, half: 70, elevMin: -35, elev: 35, range: 2500, reload: 5, dmg: 22, speed: 620, shots: 2, pellets: 5, spread: 0.04, style: 'flak', snd: 'cannon', sndRate: 1.15,
          guns: [[-40, -4, -50], [-40, -4, -10], [-39, -4, 30], [-40, -4, 70]] },
        { id: 'stbd', label: 'Starboard flak', key: 'E', type: 'battery', sub: 'stbd', center: 90, half: 70, elevMin: -35, elev: 35, range: 2500, reload: 5, dmg: 22, speed: 620, shots: 2, pellets: 5, spread: 0.04, style: 'flak', snd: 'cannon', sndRate: 1.15,
          guns: [[40, -4, -50], [40, -4, -10], [39, -4, 30], [40, -4, 70]] },
        { id: 'mines', label: 'Mine layer', key: 'T', type: 'mine', sub: 'torp', center: 180, half: 75, elevMin: -60, elev: 60, range: 1800, reload: 5, tubes: 2, ammo: 14, dmg: 320, trigger: 300,
          guns: [[-20, -10, 150], [20, -10, 150]] }
      ],
      fore: 'Missile racks', pref: 1300, beam: 135,
      intel: 'Minelayer. It keeps you on its quarter and drops proximity mines astern, so chasing it means flying through them. Watch the plot for red mine markers.'
    }
  };
  // Hulls that can be claimed from wrecks in the campaign and flown by the player (they stay out of skirmish).
  for (const [k, d, broadName] of [['scrapjaw', 760, 'Scatterguns'], ['seraph', 800, 'Beam arrays'], ['revenant', 880, 'Flak broadsides']]) Object.assign(CLASSES[k], { capturable: true, camDist: d, broadName });
  CLASSES.seraph.yardStbd = [[70, 6, 0], [0, 20, -50]];   // its beam arrays sit on the wing and the spine, not along a broadside
  // Act bosses (campaign only): an existing hull scaled up and re-armed. Weapons a later phase unlocks are listed
  // in the encounter's boss phases (crew/campaign-data.js) and stay silent until crew/fleet-controller.js frees them.
  // A variant of an existing hull: its model scaled by modelScale (hit ellipsoids, gun and engine positions scale with
  // it), new stats, boosted weapons (`boost`, by weapon id), some dropped (`drop`) and extra ones (`extra`).
  function variant(key, base, o) {
    const B = CLASSES[base], k = o.modelScale || 1, sc = p => p.map(v => v * k), arm = w => ({ ...w, guns: w.guns.map(sc) });
    CLASSES[key] = { ...B, ...o.stats, key, name: o.name, cls: o.cls, enemyOnly: true, campaignOnly: true, capturable: false,
      model: B.model || base, url: B.url, modelScale: k, tint: o.tint || B.tint,
      hullE: { c: sc(B.hullE.c), r: sc(B.hullE.r) }, shieldE: { c: sc(B.shieldE.c), r: sc(B.shieldE.r) }, engines: B.engines.map(sc), glow: B.glow * k,
      weapons: [...B.weapons.filter(w => !(o.drop || []).includes(w.id)).map(w => arm({ ...w, ...((o.boost || {})[w.id] || {}) })), ...(o.extra || []).map(arm)], intel: o.intel };
    return CLASSES[key];
  }
  // Act bosses: variants that only appear in their finale.
  function bossClass(key, base, o) { return Object.assign(variant(key, base, o), { boss: true }); }
  // Acts II and III: hulls met only in the campaign.
  variant('sentinel', 'halberd', { name: 'Sentinel', cls: 'Directorate lance frigate', tint: [0.78, 0.88, 1.12],
    stats: { hull: 2200, shield: 700, regen: 44, vmax: 54, accel: 3.2, turn: deg(8), pref: 3400, beam: 110 },
    boost: { lance: { label: 'Sentinel lance', special: true, range: 4400, dps: 420, chargeT: 16 }, port: { dmg: 30, label: 'Port arrays' }, stbd: { dmg: 30, label: 'Starboard arrays' } },
    drop: ['torp'],
    intel: 'A Directorate lance frigate. It holds at long range and lines up its spinal lance, which charges with a warning before it fires: turn out of its line, then close in. Its broadsides are light.' });
  variant('thrall', 'wraith', { name: 'Thrall', cls: 'Wraith swarmer', modelScale: 0.55, tint: [1.1, 1.15, 0.8],
    stats: { hull: 1100, shield: 220, regen: 22, hullRegen: 8, vmax: 78, accel: 5, turn: deg(14), angAcc: deg(4), rammer: true, ram: 0.5, ramDmg: 0.8, pref: 900, beam: 25 },
    boost: { plasma: { dmg: 24, reload: 3.8 } },
    drop: ['spores'],
    intel: 'A small, fast Wraith swarmer that hunts in packs. It closes to ram and spit plasma; its hull is thin but knits quickly. Break the pack apart and finish them one at a time.' });
  bossClass('pyre', 'revenant', { name: 'Pyre', cls: 'Ash Fleet dreadnought', modelScale: 1.4, tint: [0.42, 0.24, 0.22],
    stats: { hull: 5000, shield: 760, regen: 34, vmax: 34, accel: 1.8, turn: deg(4.2), pref: 1600, beam: 120 },
    boost: { missiles: { salvo: 10 }, port: { dmg: 26 }, stbd: { dmg: 26 }, mines: { reload: 4, ammo: 24 } },
    extra: [{ ...CLASSES.warden.weapons.find(w => w.id === 'siege'), key: '' },
      { ...CLASSES.revenant.weapons.find(w => w.id === 'missiles'), id: 'inferno', label: 'Inferno salvo', special: true, sub: 'torp', salvo: 16, reload: 9, dmg: 70, col: [4, 1.6, 0.3] }],
    intel: 'The Ash Fleet flagship: a dreadnought fortress with siege cannons, flak, missiles and mines. Stay off its bow and out of its wake.' });
  bossClass('arbiter', 'seraph', { name: 'Arbiter', cls: 'Directorate core warship', modelScale: 1.6, tint: [0.82, 0.92, 1.15],
    stats: { hull: 3300, shield: 900, regen: 40, vmax: 50, accel: 3, turn: deg(6), pref: 2800 },
    boost: { rail: { dmg: 320, reload: 9 }, beams: { dps: 95 } },
    extra: [{ ...CLASSES.halberd.weapons.find(w => w.id === 'lance'), id: 'judgement', label: 'Judgement lance', special: true, key: '', dps: 600, guns: [[0, 2, -128]] }],
    intel: 'The Directorate mind in a hull: heavy, fast-recharging shields, beam arrays and a railgun. Its shield lattice only falls when the node ships do.' });
  bossClass('mother', 'wraith', { name: 'Bloom-Mother', cls: 'Wraith brood-mother', modelScale: 1.8, tint: [0.85, 1.1, 0.85],
    stats: { hull: 4500, shield: 640, regen: 34, hullRegen: 12, vmax: 46, accel: 3, turn: deg(6.5), pref: 1900 },
    boost: { plasma: { dmg: 85 }, spores: { salvo: 10 } },
    extra: [{ ...CLASSES.wraith.weapons.find(w => w.id === 'spores'), id: 'storm', label: 'Spore storm', special: true, salvo: 20, reload: 9, dmg: 40 }],
    intel: 'The mother of the Wraith. Plasma, spore swarms and a hull that regrows faster the more it is hurt. Never let up.' });

  // The shipyard's view of a hull: stats with turn in degrees a second, the weapons BroadsideUpgrades.apply() works on
  // (with their gun count), and the starboard hardpoints, forward and torpedo mounts, engines and ellipsoids it draws.
  const ROLE = { port: 'port', stbd: 'stbd', fore: 'fore', torp: 'torp' };
  function shipyardHull(key) {
    const C = CLASSES[key]; if (!C || C.boss || (C.enemyOnly && !C.capturable)) return null;
    const stbdSide = list => list.filter(g => g[0] >= 0).map(g => g.slice());   // the yard draws the hull from starboard
    const pts = sub => stbdSide(C.weapons.filter(w => w.sub === sub).flatMap(w => w.guns));
    const weapons = C.weapons.filter(w => ROLE[w.sub]).map(w => { const o = { ...w, n: w.guns.length }; delete o.guns; delete o.key; return o; });
    return { cls: C.cls, captured: !!C.capturable || undefined, hull: C.hull, shield: C.shield, regen: C.regen, vmax: C.vmax, accel: C.accel,
      turn: Math.round(C.turn * 180 / Math.PI * 100) / 100, broadName: C.broadName, weapons,
      stbd: C.yardStbd ? C.yardStbd.map(g => g.slice()) : pts('stbd'), forePts: pts('fore'), torpPts: pts('torp'), eng: stbdSide(C.engines), hullE: C.hullE, shieldE: C.shieldE };
  }
  const PLAYABLE = Object.keys(CLASSES).filter(k => shipyardHull(k));   // hulls a captain can fly: the four Navy classes and the claimable prizes

  root.BroadsideShips = Object.freeze({ CLASSES, PLAYABLE, shipyardHull, deg });
})(typeof window !== 'undefined' ? window : globalThis);

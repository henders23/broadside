// Rivals: named enemy captains who get away. A bounty target or ambusher may jump out at low hull, then comes back
// later in their own space with a refit aimed at how you hurt them last time, remembers the fight, and says so.
// Kora Vex becomes one if still alive when the Peregrine escapes Kestrel. Kill a rival to settle the score.
// Loaded by the campaign map (after crew/campaign-data.js) and the Node tests. The battle page only reads what
// this puts in the encounter spec: spec.rival (who, and their lines) and spec.escape (when they run).
(function (root) {
  'use strict';
  const C = root.BroadsideCampaign;
  const RULES = {
    escape: { at: 0.25, window: 14, chance: [0.45, 0.3, 0] },   // below 25% hull the rival spools a jump drive, with 14 s to stop it. Chance by escapes so far.
    readyAfter: 2,   // battles before a rival who got away comes looking for you
    hunt: 0.35,      // chance a ready rival springs on a journey through their own space
    bounty: 1.6,     // a wanted poster pays this much over a bounty
    settle: 300,     // bonus requisition for killing a rival
    maxUpgrades: 3
  };
  const FACING = ['bow', 'stern', 'port', 'starboard'];
  const WEAPON = { torp: 'torpedo', lance: 'lance', shell: 'broadside', beam: 'beam', ram: 'ram', mine: 'mine', missile: 'missile', plasma: 'plasma', rail: 'railgun' };
  // What each refit does to the rival's ship, and how the briefing describes it.
  const UPGRADES = {
    facing: { apply: (e, f) => { e.facing = [f, 1.6]; }, note: (r, f) => `${r.name} has had the ${FACING[f]} shield emitters doubled, where you broke them at ${r.lastSystem}.` },
    plating: { apply: e => { e.hull = Math.min(1.4, (e.hull || 1) * 1.25); }, note: r => `${r.name}’s hull has been plated over since ${r.lastSystem}: a quarter more to cut through.` },
    shields: { apply: e => { e.shieldK = 1.25; }, note: r => `${r.name} has had the shields hardened against your beams and lance.` },
    gunnery: { apply: e => { e.dmg = Math.round(((e.dmg || 1) * 1.2) * 100) / 100; }, note: r => `${r.name} has new gunners aboard. The guns hit a fifth harder.` },
    drives: { apply: e => { e.speed = 1.15; }, note: r => `${r.name} has had the drives tuned. The ship is faster than it was.` }
  };
  // A rival's lines, by faction: `back` on arrival (with what they remember), `hurt` at half hull, `flee` as they run, `death`.
  const VOICES = {
    Corsair: {
      facing: 'Remember {system}, {ship}? You opened up my {facing} side like a ration tin. I have had it plated twice over.',
      weapon: 'Thought I would forget {system}? I count your {weapon} hits every night. Tonight I give them back.',
      hurt: 'You are good, Navy. Not good enough.', flee: 'Not today, Navy! Keep a berth warm for me.', death: 'Damn you, {ship}...' },
    'Ash Fleet': {
      facing: '{ship}. You burned my {facing} side to the frames at {system}. The Ash Fleet does not forget, and neither do I.',
      weapon: '{ship}. You left me burning at {system} with your {weapon}s. I have been waiting for this.',
      hurt: 'Is that all the Navy taught you?', flee: 'This is not over, {ship}. Not by a long way.', death: 'So this is how the Ash Fleet ends.' },
    Directorate: {
      facing: 'Unit {name} recalls {system}. {Facing} emitter losses: catalogued. Countermeasures: installed.',
      weapon: 'Unit {name} recalls {system}. Your {weapon} has been modelled. Outcome revised in our favour.',
      hurt: 'Damage within projected tolerance.', flee: 'Withdrawal optimal. We will meet again. It is predicted.', death: 'Prediction... incorrect.' },
    Wraith: {
      facing: '...the song from {system} again. Where you cut it, along the {facing} flank, the scar has grown thick and hard.',
      weapon: '...it sings the shape of your {weapon} back to you. It remembers {system}.',
      hurt: '...the harmonic falters, then steadies.', flee: '...a falling note, and the hull folds away into the dark.', death: '...the song stops.' }
  };
  // Named rivals with lines of their own.
  const PERSONAL = {
    'Captain Kora Vex': { asset: 'vex.webp', back: 'Kestrel was business, {ship}. This is personal.', hurt: 'Every plate you crack, I bill to Meridian.', flee: 'I got away from you once. Watch me do it twice.', death: 'Should have stuck to freighters...' }
  };
  const voice = faction => VOICES[faction] || VOICES.Corsair;
  const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (_, k) => k === 'Facing' ? (v.facing || '').replace(/^./, c => c.toUpperCase()) : v[k] != null ? v[k] : '');
  const words = r => ({ name: r.name, ship: (r.memory && r.memory.ship) || 'Navy', system: r.lastSystem || 'the last fight', facing: r.memory && Number.isInteger(r.memory.facing) ? FACING[r.memory.facing] : 'port', weapon: WEAPON[r.memory && r.memory.weapon] || 'broadside' });
  function lines(r) {
    const v = voice(r.faction), p = PERSONAL[r.name] || {}, w = words(r), last = (r.upgrades || [])[r.upgrades.length - 1] || '';
    return { back: fill(p.back || (last.startsWith('facing') ? v.facing : v.weapon), w), hurt: fill(p.hurt || v.hurt, w), flee: fill(p.flee || v.flee, w), death: fill(p.death || v.death, w) };
  }
  // A fight can make a rival if its lead is a named captain: bounties, ambushes and Kora Vex at Kestrel.
  function eligible(src) {
    if (!src || !src.enemies || !src.enemies[0] || src.goal.type !== 'destroy' && src.id !== 1) return false;
    if (src.id === 1 && C && C.storyById[1] === src) return true;
    return (src.kind === 'intercept' || src.kind === 'contract' && src.type === 'bounty') && !!src.captain && src.enemies[0].name === src.captain;
  }
  const hashOf = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  // Whether (and when) the rival runs, fixed by the encounter so a reload cannot reroll it. Story operations never run.
  function escapeFor(id, escapes) { const p = RULES.escape.chance[Math.min(escapes || 0, RULES.escape.chance.length - 1)]; return (hashOf(String(id)) % 1000) / 1000 < p ? { at: RULES.escape.at, window: RULES.escape.window } : null; }
  // Called by Campaign.encounter() with the save's rivals: marks the rival in the spec, refits a returning one and gives them lines.
  function shape(spec, src, ctx) {
    // A returning rival: named by the encounter, or a bounty or ambush that happens to be led by a rival still at large.
    const list = (ctx && ctx.rivals) || [], r = src.rivalId ? list.find(x => x.id === src.rivalId && x.status !== 'dead') : eligible(src) ? list.find(x => x.status !== 'dead' && x.name === src.enemies[0].name) : null;
    if (r) {
      const e = spec.enemies[0];
      e.rival = true;
      for (const u of r.upgrades || []) { const [k, f] = u.split(':'); if (UPGRADES[k]) { UPGRADES[k].apply(e, Number(f)); spec.notes.push(UPGRADES[k].note(r, Number(f))); } }
      const L = lines(r);
      spec.rival = { id: r.id, name: r.name, cls: r.cls, faction: r.faction, asset: r.asset || null, returning: true, meetings: r.meetings, lines: L };
      spec.hail = { name: r.name, faction: r.faction, line: L.back, asset: r.asset || undefined };
      spec.escape = escapeFor(spec.id, r.escapes);
      spec.notes.unshift(`${r.name} has met you ${r.meetings === 1 ? 'once' : r.meetings + ' times'} and got away ${r.escapes === 1 ? 'once' : r.escapes + ' times'}. ${r.name.split(' ').pop()} remembers.`);
      return spec;
    }
    if (!eligible(src) || list.some(x => x.name === src.enemies[0].name)) return spec;
    const faction = src.id === 1 ? 'Corsair' : spec.hail && spec.hail.faction || 'Corsair', name = src.enemies[0].name, p = PERSONAL[name];
    spec.enemies[0].rival = true;
    spec.rival = { name, cls: src.enemies[0].cls, faction, asset: p ? p.asset : null, returning: false, meetings: 0, lines: lines({ name, faction, memory: {}, upgrades: [] }) };
    if (!spec.story) spec.escape = escapeFor(spec.id, 0);
    return spec;
  }
  // The next refit, aimed at how the rival was hurt: the facing you broke if you kept to one side, otherwise your weapon.
  function nextUpgrade(r, m) {
    const have = new Set((r.upgrades || []).map(u => u.split(':')[0]));
    if (m && m.share >= 0.45 && Number.isInteger(m.facing) && !have.has('facing')) return 'facing:' + m.facing;
    const weapon = m && m.weapon, armour = ['lance', 'beam'].includes(weapon) ? 'shields' : 'plating';
    for (const k of [armour, 'gunnery', armour === 'shields' ? 'plating' : 'shields', 'drives']) if (!have.has(k)) return k;
    return null;
  }
  // A battle result for a fight with a rival in it. `res` is spec.rival plus how it ended (fate: escaped, killed, won)
  // and what the rival remembers (memory: { facing, share, weapon, ship }); `ctx` is { system, mission, clock }.
  // Returns the new list and what happened: a new rival, an old one getting away again, a score settled, or nothing.
  function record(list, res, ctx) {
    const out = (list || []).map(r => ({ ...r })), sys = C && C.byId[ctx.system] ? C.byId[ctx.system].name : ctx.system;
    if (!res) return { rivals: out, event: null };
    let r = res.id ? out.find(x => x.id === res.id) : null;
    if (r) {
      r.meetings++;
      if (res.fate === 'killed') { Object.assign(r, { status: 'dead', killed: { system: ctx.system, mission: ctx.mission, ship: res.memory && res.memory.ship } }); return { rivals: out, event: { type: 'slain', rival: r } }; }
      if (res.fate === 'escaped') {
        r.escapes++; const u = r.upgrades.length < RULES.maxUpgrades ? nextUpgrade(r, res.memory) : null; if (u) r.upgrades = [...r.upgrades, u];
        Object.assign(r, { memory: res.memory || r.memory, lastSystem: sys, last: ctx.system, readyAt: (ctx.clock || 0) + RULES.readyAfter });
        return { rivals: out, event: { type: 'again', rival: r, upgrade: u } };
      }
      Object.assign(r, { last: ctx.system, lastSystem: sys, readyAt: (ctx.clock || 0) + RULES.readyAfter });   // the rival beat you, and comes looking again
      return { rivals: out, event: { type: 'gloat', rival: r } };
    }
    if (res.fate !== 'escaped') return { rivals: out, event: null };
    r = { id: 'rv' + (out.length + 1), name: res.name, cls: res.cls, faction: res.faction, asset: res.asset || null, status: 'at large', meetings: 1, escapes: 1, upgrades: [],
      first: { system: ctx.system, mission: ctx.mission }, memory: res.memory || {}, last: ctx.system, lastSystem: sys, readyAt: (ctx.clock || 0) + RULES.readyAfter };
    const u = nextUpgrade(r, res.memory); if (u) r.upgrades = [u];
    out.push(r);
    return { rivals: out, event: { type: 'new', rival: r, upgrade: u } };
  }
  const atLarge = list => (list || []).filter(r => r.status !== 'dead');
  // A rival's space: the hostile systems this act whose raiders fly the rival's colours.
  function inHerSpace(r, sysId, act) { const s = C.byId[sysId]; return !!s && C.hostile(s, act) && C.foeGroup(s, act) === r.faction; }
  // On a journey: a ready rival may be waiting at the first system of their space on the route.
  function ambush(list, route, act, clock, random) {
    for (const r of atLarge(list)) {
      if ((clock || 0) < (r.readyAt || 0)) continue;
      const at = route.slice(1).find(id => inHerSpace(r, id, act));
      if (at && random() < RULES.hunt) return { rival: r, at };
    }
    return null;
  }
  // The fight when a rival comes for you: their own ship, stronger every time, with a wingman from the third meeting.
  function encounterSrc(r, sysId, act, kind) {
    const sys = C.byId[sysId], s = C.strength(sys, act), lvl = C.threatLevel(sys), vet = Math.min(0.3, 0.1 * r.meetings);
    const enemies = [{ cls: r.cls, name: r.name, hull: Math.round(Math.min(1, s * 0.9 + vet) * 100) / 100, shield: Math.round(Math.min(1, s * 0.95 + vet) * 100) / 100 }];
    if (r.meetings >= 2) enemies.push({ cls: r.cls, name: `${r.name.split(' ').pop()}’s wingman`, hull: 0.4, shield: 0.55, diff: 'commander' });
    const base = { system: sysId, act: Math.min(act, 3), captain: r.name, enemy: r.cls, enemies, goal: { type: 'destroy' }, rivalId: r.id, support: kind === 'intercept' ? 0 : 1 };
    if (kind === 'intercept') return { ...base, id: `n:${r.id}:${r.meetings}`, kind: 'intercept', name: `${r.name} returns`, reward: 160 + 45 * lvl,
      objective: `Destroy ${r.name}.`, brief: `A transponder you know drops out of the lane at ${sys.name}. ${r.name} has been waiting for you.`, intel: `Your rival, refitted since ${r.lastSystem}, and who knows how you fight.` };
    const station = C.nearestStation(sysId);
    return { ...base, id: `w:${r.id}:${r.meetings}`, kind: 'contract', type: 'bounty', station, name: 'Wanted: ' + r.name, reward: Math.round((200 + 60 * lvl + 90 * (Math.min(act, 3) - 1)) * RULES.bounty),
      objective: `Destroy ${r.name}.`, brief: `${r.name} was last seen at ${sys.name}. ${C.STATIONS[station].name} wants this finished, and pays well for it.`, intel: `Your rival, refitted since you last met. You have met ${r.meetings === 1 ? 'once' : r.meetings + ' times'}.` };
  }
  // The wanted poster on a station's board: the starbase nearest where the rival was last seen.
  function wanted(list, station, act) {
    return atLarge(list).filter(r => C.nearestStation(r.last) === station && C.byId[r.last] && C.byId[r.last].faction !== 'Navy').map(r => encounterSrc(r, r.last, act, 'contract'));
  }
  root.BroadsideRivals = Object.freeze({ RULES, FACING, UPGRADES, VOICES, lines, eligible, escapeFor, shape, nextUpgrade, record, atLarge, inHerSpace, ambush, encounterSrc, wanted });
})(typeof window !== 'undefined' ? window : globalThis);

// Battle honours: medals for feats in a single battle, each ship's service record and kill marks, and the paint
// schemes medals unlock. The battle page records what happened (pendingResult.honours); this decides what it earns.
// Loaded by the campaign map, the battle page (for paint) and the Node tests.
(function (root) {
  'use strict';
  // `test(h)` reads one battle's record: { win, kind, code, time, hullStart, hullEnd, shots, hits, torpHits, lanceDmg,
  // shieldMax, hostiles, escorts, escortsLost, boss, rivalKilled, convoyHull, rams }.
  const MEDALS = [
    { id: 'iron', name: 'Iron Hull', ribbon: ['#c9ced6', '#3c4654'], text: 'Won a battle without losing more than 2% of the flagship’s hull.', test: h => h.win && h.hullStart - h.hullEnd <= 0.02 && h.time >= 30 },
    { id: 'laststand', name: 'Last Stand', ribbon: ['#7a1f1f', '#e2a23b'], text: 'Won with the flagship below 15% hull.', test: h => h.win && h.hullEnd > 0 && h.hullEnd <= 0.15 },
    { id: 'bare', name: 'Bare Hull', ribbon: ['#1f4f7a', '#b9dcff'], text: 'Won a long fight with no shield facing above a quarter at the end.', test: h => h.win && h.time >= 60 && h.shieldMax <= 0.25 },
    { id: 'gunlayer', name: 'Gunlayer’s Star', ribbon: ['#e2a23b', '#1c2a3a'], text: 'Landed 65% of at least 40 shots in one battle.', test: h => h.shots >= 40 && h.hits / h.shots >= 0.65 },
    { id: 'torpedo', name: 'Torpedo Ace', ribbon: ['#2a7a5a', '#d6f0e2'], text: 'Three torpedo hits in one battle.', test: h => h.torpHits >= 3 },
    { id: 'lancer', name: 'Lancer’s Mark', ribbon: ['#5a3f9a', '#e8dcff'], text: '2,500 lance damage in one battle.', test: h => h.lanceDmg >= 2500 },
    { id: 'giant', name: 'Giant Killer', ribbon: ['#9a2f2f', '#1a1a1a'], text: 'Destroyed an act’s finale flagship.', test: h => h.win && h.boss },
    { id: 'odds', name: 'Against the Odds', ribbon: ['#c46a1e', '#2a1a10'], text: 'Won alone against three or more hostiles.', test: h => h.win && h.escorts === 0 && h.hostiles >= 3 },
    { id: 'swift', name: 'Swift Sword', ribbon: ['#d8d8d8', '#9a2f2f'], text: 'Destroyed every hostile inside 75 seconds.', test: h => h.win && h.time < 75 && ['enemy_destroyed', 'fleet_destroyed'].includes(h.code) },
    { id: 'score', name: 'Old Score Settled', ribbon: ['#e8c25a', '#5a1f1f'], text: 'Killed a rival who had got away before.', test: h => h.rivalKilled },
    { id: 'shepherd', name: 'Shepherd’s Crook', ribbon: ['#3f8f5a', '#f0e6c8'], text: 'Brought a convoy through with 90% of its hull.', test: h => h.win && h.convoyHull != null && h.convoyHull >= 0.9 },
    { id: 'noneleft', name: 'No One Left Behind', ribbon: ['#1f4f7a', '#e2a23b'], text: 'Won with two escorts and none disabled.', test: h => h.win && h.escorts >= 2 && h.escortsLost === 0 },
    { id: 'ram', name: 'Ramming Speed', ribbon: ['#5a4a3a', '#e2a23b'], text: 'Destroyed a ship by ramming it.', test: h => h.rams > 0 }
  ];
  const byId = Object.fromEntries(MEDALS.map(m => [m.id, m]));
  const earned = h => h ? MEDALS.filter(m => { try { return m.test(h); } catch (e) { return false; } }) : [];
  // Paint schemes: Navy grey for everyone, the rest unlocked by a medal held anywhere in the campaign.
  const PAINTS = [
    { id: 'navy', name: 'Navy grey', tint: null, medal: null },
    { id: 'ivory', name: 'Parade ivory', tint: [1.25, 1.2, 1.1], medal: 'iron' },
    { id: 'ash', name: 'Ash black', tint: [0.42, 0.42, 0.46], medal: 'laststand' },
    { id: 'cobalt', name: 'Cobalt', tint: [0.72, 0.86, 1.2], medal: 'gunlayer' },
    { id: 'olive', name: 'Frontier olive', tint: [0.86, 0.95, 0.68], medal: 'odds' },
    { id: 'crimson', name: 'Crimson', tint: [1.15, 0.6, 0.56], medal: 'giant' },
    { id: 'gold', name: 'Gilded', tint: [1.3, 1.08, 0.68], medal: 'score' }
  ];
  const paintById = Object.fromEntries(PAINTS.map(p => [p.id, p]));
  const paints = medals => PAINTS.filter(p => !p.medal || (medals && medals[p.medal]));
  const tint = id => (paintById[id] || PAINTS[0]).tint;
  // One battle applied to the campaign: medals (counted, with where each was first won) and each ship's service record.
  // `flown` is pendingResult.ships: [{ id, dealt, kills: [{ cls, name, boss, rival }], disabled }]; `ctx` is { mission, system, flag }.
  function apply(medals, ships, h, flown, ctx) {
    const got = earned(h), m = { ...(medals || {}) };
    for (const x of got) m[x.id] = { n: ((m[x.id] && m[x.id].n) || 0) + 1, first: (m[x.id] && m[x.id].first) || { mission: ctx.mission, system: ctx.system, ship: ctx.shipName } };
    const out = (ships || []).map(r => {
      const f = (flown || []).find(x => x.id === r.id); if (!f) return r;
      const s = { battles: 0, wins: 0, dealt: 0, disabled: 0, ...(r.service || {}) };
      s.battles++; if (h && h.win) s.wins++; s.dealt += Math.round(f.dealt || 0); if (f.disabled) s.disabled++;
      const next = { ...r, service: s, kills: [...(r.kills || []), ...(f.kills || []).map(k => ({ ...k, at: ctx.system }))] };
      if (r.id === ctx.flag && got.length) next.honours = [...(r.honours || []), ...got.map(x => x.id)];
      return next;
    });
    return { medals: m, ships: out, earned: got.map(x => x.id) };
  }
  root.BroadsideHonours = Object.freeze({ MEDALS, byId, earned, PAINTS, paintById, paints, tint, apply });
})(typeof window !== 'undefined' ? window : globalThis);

// Bridge-officer experience: earned in each campaign engagement, raising rank, command strength and cooldown.
// Loaded by the campaign map, the battle page (via the bridge controller) and the Node tests.
(function (root) {
  'use strict';
  const RANKS = ['Regular', 'Seasoned', 'Veteran', 'Elite', 'Ace'];
  const LEVEL_XP = [0, 100, 250, 450, 700];   // XP needed to reach each rank
  const XP = { win: 60, loss: 30, perUse: 15, maxUses: 3 };
  const IDS = ['varro', 'okoye', 'vale', 'sato', 'renn'];

  const levelOf = xp => { let n = 1; for (let i = 1; i < LEVEL_XP.length; i++) if ((xp || 0) >= LEVEL_XP[i]) n = i + 1; return n; };
  function progress(rec) {
    const xp = Math.max(0, Math.round((rec && rec.xp) || 0)), level = levelOf(xp), max = level === LEVEL_XP.length;
    const from = LEVEL_XP[level - 1], to = max ? from : LEVEL_XP[level];
    return { xp, level, rank: RANKS[level - 1], max, next: max ? null : RANKS[level], toNext: max ? 0 : to - xp, fraction: max ? 1 : (xp - from) / (to - from),
      battles: (rec && rec.battles) || 0, uses: (rec && rec.uses) || 0 };
  }
  // Each rank above Regular: cooldown 5% shorter, command 8% stronger.
  const scale = level => ({ cooldown: 1 - 0.05 * (level - 1), strength: 1 + 0.08 * (level - 1) });
  const levels = officers => Object.fromEntries(IDS.map(id => [id, progress(officers && officers[id]).level]));

  // Command text at a given rank, matching what the bridge controller applies in battle.
  function effect(officer, level) {
    const s = scale(level).strength, r = v => Math.round(v * s);
    switch (officer.id) {
      case 'varro': return `Restore ${r(16)}% of each directional shield bank immediately.`;
      case 'okoye': return `Weapons deal ${r(12)}% more damage for ${officer.duration} seconds.`;
      case 'vale': return `Restore ${r(24)} integrity to the worst damaged subsystem and suppress one onboard fire.`;
      case 'sato': return `Reduce incoming damage by ${r(22)}% for ${officer.duration} seconds.`;
      default: return officer.effect;
    }
  }
  const cooldown = (officer, level) => Math.round(officer.cooldown * scale(level).cooldown);

  // Applies one engagement to the officers' records. Returns new records and what each officer gained.
  function award(officers, outcome, uses) {
    const out = {}, gains = [];
    for (const id of IDS) {
      const before = (officers && officers[id]) || { xp: 0, battles: 0, uses: 0 }, used = Math.max(0, Math.floor((uses && uses[id]) || 0));
      const gained = (outcome === 'win' ? XP.win : XP.loss) + XP.perUse * Math.min(used, XP.maxUses);
      const rec = { xp: (before.xp || 0) + gained, battles: (before.battles || 0) + 1, uses: (before.uses || 0) + used };
      const was = levelOf(before.xp), now = levelOf(rec.xp);
      out[id] = rec; gains.push({ id, gained, used, promoted: now > was, rank: RANKS[now - 1] });
    }
    return { officers: out, gains };
  }

  root.BroadsideExperience = Object.freeze({ RANKS, LEVEL_XP, XP, levelOf, progress, scale, levels, effect, cooldown, award });
})(typeof window !== 'undefined' ? window : globalThis);

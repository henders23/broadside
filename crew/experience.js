// Bridge-officer experience: earned in each campaign engagement, raising rank, command strength and cooldown.
// Loaded by the campaign map, the battle page (via the bridge controller) and the Node tests.
(function (root) {
  'use strict';
  // Officers start at the bottom of their career track and are promoted as they gain experience.
  const TRACKS = {
    officer: ['Ensign', 'Lieutenant', 'Lt. Commander', 'Commander', 'Captain'],
    enlisted: ['Petty Officer', 'Chief Petty Officer', 'Senior Chief', 'Master Chief', 'Chief Warrant Officer']
  };
  const TRACK_OF = { vale: 'enlisted', osei: 'enlisted' };   // the engineers rose through the enlisted rates
  const ranks = id => TRACKS[TRACK_OF[id] || TRACK_OF[String(id).split('-')[1]] || 'officer'];   // a replacement (rep-vale-1) follows its post
  const LEVEL_XP = [0, 100, 250, 450, 700];   // XP needed to reach each rank
  const XP = { win: 60, loss: 30, perUse: 15, maxUses: 3 };
  const IDS = ['varro', 'okoye', 'vale', 'sato', 'renn'];

  const levelOf = xp => { let n = 1; for (let i = 1; i < LEVEL_XP.length; i++) if ((xp || 0) >= LEVEL_XP[i]) n = i + 1; return n; };
  function progress(rec, id) {
    const R = ranks(id);
    const xp = Math.max(0, Math.round((rec && rec.xp) || 0)), level = levelOf(xp), max = level === LEVEL_XP.length;
    const from = LEVEL_XP[level - 1], to = max ? from : LEVEL_XP[level];
    return { xp, level, rank: R[level - 1], max, next: max ? null : R[level], toNext: max ? 0 : to - xp, fraction: max ? 1 : (xp - from) / (to - from),
      battles: (rec && rec.battles) || 0, uses: (rec && rec.uses) || 0 };
  }
  // Each promotion: cooldown 5% shorter, command 8% stronger.
  const scale = level => ({ cooldown: 1 - 0.05 * (level - 1), strength: 1 + 0.08 * (level - 1) });
  // Ranks for the five regulars and anyone hired since.
const levels = officers => Object.fromEntries([...new Set([...IDS, ...Object.keys(officers || {})])].map(id => [id, progress(officers && officers[id], id).level]));
  const displayName = (officer, level) => `${ranks(officer.id)[level - 1]} ${officer.given || officer.name}`;

  // Command text at a given rank, matching what the bridge controller applies in battle.
  function effect(officer, level, k = 1) {   // k: a wounded officer's command is weaker (crew/casualties.js)
    const s = scale(level).strength * k, r = v => Math.round(v * s);
    switch (officer.cmd || officer.id) {
      case 'varro': return `Restore ${r(16)}% of each directional shield bank immediately.`;
      case 'okoye': return `Weapons deal ${r(12)}% more damage for ${officer.duration} seconds.`;
      case 'vale': return `Restore ${r(24)} integrity to the worst damaged subsystem and suppress one onboard fire.`;
      case 'sato': return `Reduce incoming damage by ${r(22)}% for ${officer.duration} seconds.`;
      case 'adeyemi': return `Restore ${r(6)}% of the hull and ${r(10)} integrity to every subsystem.`;
      case 'osei': return `Restore ${r(12)}% of the hull.`;
      case 'marlow': return `Refuel the afterburner and restore ${r(30)} engine integrity.`;
      default: return officer.effect;
    }
  }
  const cooldown = (officer, level) => Math.round(officer.cooldown * scale(level).cooldown);

  // Applies one engagement to the officers' records. Returns new records and what each officer gained.
  // `ids` are the officers on duty (the five regulars unless recruits have taken posts); everyone else keeps their record.
  function award(officers, outcome, uses, ids = IDS) {
    const out = Object.assign({}, officers || {}), gains = [];
    for (const id of ids) {
      const before = (officers && officers[id]) || { xp: 0, battles: 0, uses: 0 }, used = Math.max(0, Math.floor((uses && uses[id]) || 0));
      const gained = (outcome === 'win' ? XP.win : XP.loss) + XP.perUse * Math.min(used, XP.maxUses);
      const rec = { xp: (before.xp || 0) + gained, battles: (before.battles || 0) + 1, uses: (before.uses || 0) + used };
      const was = levelOf(before.xp), now = levelOf(rec.xp);
      out[id] = rec; gains.push({ id, gained, used, promoted: now > was, rank: ranks(id)[now - 1] });
    }
    return { officers: out, gains };
  }

  root.BroadsideExperience = Object.freeze({ TRACKS, ranks, displayName, LEVEL_XP, XP, levelOf, progress, scale, levels, effect, cooldown, award });
})(typeof window !== 'undefined' ? window : globalThis);

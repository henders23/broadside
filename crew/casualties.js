// Bridge casualties: officers wounded or killed when the flagship's bridge takes a hit, treatment, and replacements.
// A wounded officer keeps their post but their command is weaker until they heal; a wounded officer hit again is killed.
// Loaded by the campaign map, the battle page and the Node tests.
(function (root) {
  'use strict';
  const RULES = {
    hullBelow: 0.55,   // the bridge is exposed once the flagship's hull is below this
    minHit: 70,        // a hull hit at least this heavy can reach the bridge
    chance: 0.09,      // per qualifying hit
    cooldown: 25,      // battle seconds between casualties
    max: 2,            // casualties in one battle at most
    offline: 30,       // seconds a newly wounded officer's command is out while the medics work
    heal: 3,           // engagements for a wound to heal by itself
    treat: 120,        // requisition to treat one officer in a starbase sickbay
    wounded: { strength: 0.6, cooldown: 1.4 }   // a wounded officer's command
  };
  // Does this hit reach the bridge? `b` is the battle so far: { time, last (time of the last casualty), count }.
  function bridgeHit(hullFrac, hullD, b, random) {
    if (hullFrac >= RULES.hullBelow || hullD < RULES.minHit || b.count >= RULES.max || b.time - b.last < RULES.cooldown) return false;
    return random() < RULES.chance;
  }
  // Who is hit, among the officers on duty: a wounded officer hit again is killed. Officers already hit this battle are spared.
  function pick(ids, wounds, down, random) {
    const open = ids.filter(id => !(down || []).includes(id));
    if (!open.length) return null;
    const id = open[Math.min(open.length - 1, Math.floor(random() * open.length))];
    return { id, severity: wounds && wounds[id] ? 'killed' : 'wounded' };
  }
  // Replacements Navy Command posts when a regular officer falls: fresh ensigns (petty officers for engineering).
  const POOL = {
    varro: [['Ensign Mira Castell', 'Mira Castell', 'Castell'], ['Ensign Joss Hadley', 'Joss Hadley', 'Hadley'], ['Ensign Pell Ardent', 'Pell Ardent', 'Ardent']],
    okoye: [['Ensign Teodor Lisk', 'Teodor Lisk', 'Lisk'], ['Ensign Rhea Banfield', 'Rhea Banfield', 'Banfield'], ['Ensign Sami Oduya', 'Sami Oduya', 'Oduya']],
    vale: [['Petty Officer Gus Merrow', 'Gus Merrow', 'Merrow'], ['Petty Officer Ilse Varga', 'Ilse Varga', 'Varga'], ['Petty Officer Den Holt', 'Den Holt', 'Holt']],
    sato: [['Ensign Kaito Ren', 'Kaito Ren', 'Ren'], ['Ensign Bea Lowry', 'Bea Lowry', 'Lowry'], ['Ensign Anouk Faro', 'Anouk Faro', 'Faro']],
    renn: [['Ensign Olu Mbeki', 'Olu Mbeki', 'Mbeki'], ['Ensign Petra Sand', 'Petra Sand', 'Sand'], ['Ensign Cy Navarro', 'Cy Navarro', 'Navarro']]
  };
  function replacement(post, n) {
    const pool = POOL[post] || POOL.varro, [name, given, short] = pool[n % pool.length];
    return { id: `rep-${post}-${n + 1}`, name, given: given + (n >= pool.length ? ' II' : ''), short, post, replacement: true, initials: given.split(' ').map(w => w[0]).join(''),
      bio: `${given} came up from the Meridian reserve pool to take a dead officer’s post. The crew are still deciding what to make of ${short}.` };
  }
  // A new casualty list applied to the campaign's crew records. `c` is { wounds, fallen, replacements, crew, hired };
  // `who(id)` finds an officer (regular, recruit or replacement); `ctx` says where it happened. Returns the new records and a report.
  function apply(c, casualties, who, ctx) {
    const out = { wounds: { ...(c.wounds || {}) }, fallen: [...(c.fallen || [])], replacements: { ...(c.replacements || {}) }, crew: { ...(c.crew || {}) }, hired: [...(c.hired || [])] }, report = [];
    for (const k of casualties || []) {
      const o = who(k.id); if (!o || out.fallen.some(f => f.id === k.id)) continue;
      if (k.severity !== 'killed' && !out.wounds[k.id]) { out.wounds[k.id] = { battles: 0, at: ctx.system || null, mission: ctx.mission || '' }; report.push({ id: k.id, severity: 'wounded' }); continue; }
      delete out.wounds[k.id];
      const post = POOL[o.slot] ? o.slot : POOL[o.post] ? o.post : o.id;   // the post (its regular officer's id): on duty it is `slot`, a recruit names it in `post`, a regular is it
      out.fallen.push({ id: k.id, name: o.given || o.name, short: o.short, post, rank: ctx.rank ? ctx.rank(k.id) : '', system: ctx.system || null, mission: ctx.mission || '', battles: ctx.battles ? ctx.battles(k.id) : 0 });
      if (out.hired.includes(k.id)) out.hired = out.hired.filter(id => id !== k.id);
      const dead = id => out.fallen.some(f => f.id === id);
      let rep = null;
      // The post goes back to its regular if they still live; otherwise to its replacement, posted when the regular falls.
      if (out.crew[post] === k.id) delete out.crew[post];
      if (dead(post)) {
        let r = out.replacements[post];
        if (!r || dead(r.id)) r = rep = out.replacements[post] = replacement(post, out.fallen.filter(f => f.post === post && String(f.id).startsWith('rep-')).length);
        if (!out.crew[post] || dead(out.crew[post])) out.crew[post] = r.id;
      }
      report.push({ id: k.id, severity: 'killed', replacement: rep ? rep.id : null });
    }
    return { ...out, report };
  }
  // One engagement passes: wounds heal by themselves after RULES.heal of them. Returns the new wounds and who recovered.
  function heal(wounds) {
    const out = {}, recovered = [];
    for (const [id, w] of Object.entries(wounds || {})) { const n = (w.battles || 0) + 1; if (n >= RULES.heal) recovered.push(id); else out[id] = { ...w, battles: n }; }
    return { wounds: out, recovered };
  }
  const battlesLeft = w => Math.max(1, RULES.heal - ((w && w.battles) || 0));

  root.BroadsideCasualties = Object.freeze({ RULES, bridgeHit, pick, POOL, replacement, apply, heal, battlesLeft });
})(typeof window !== 'undefined' ? window : globalThis);

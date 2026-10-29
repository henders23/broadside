// Jump-lane events: short encounters on the way between systems, each a choice with outcomes that can go well or
// badly. Some cost requisition or hull, some pay, some wound an officer, and a few are traps that end in a fight.
// Loaded by the campaign map (campaign/drama.js runs them) and the Node tests.
(function (root) {
  'use strict';
  const CHANCE = 0.25;   // per journey
  // Effects (`fx`), applied by the campaign: credits, hull (flagship, a fraction), fleetHull (every ship that flies),
  // torps ('full' or a number), fleetTorps, sub ({ subsystem: change }), repair (flagship subsystems to 100), rep ([station | 'near', n]),
  // front (the region's front), xp ([post | 'duty', n]), wound (post | 'random'), heal ('all'), battle ({ name, brief, weak }), rival (a rival comes sooner).
  // `when(c)` gates an event on the journey: c = { act, sys, region, faction, hostile, lastLoss, wounded, rival, torps, credits }.
  const core = c => c.region === 'Meridian Core';
  const EVENTS = [
    { id: 'distress', title: 'A weak distress beacon', weight: 3, when: c => !core(c),
      text: 'Halfway to {system} the comms board picks up a distress beacon, faint and repeating. A freighter, by the signature, drifting just off the lane.',
      choices: [
        { label: 'Answer it', hint: 'Someone may need help, or it may be bait.', outcomes: [
          { p: 0.65, text: 'The freighter’s crew are alive, cold and very grateful. Their shipping line wires a reward, and word of it reaches the nearest starbase.', fx: { credits: 140, rep: ['near', 6], xp: ['varro', 20] } },
          { p: 0.35, text: 'The freighter is a hulk with a beacon bolted to it. Raiders come out of its shadow as soon as you match course.', fx: { battle: { name: 'Bait at {system}', brief: 'The distress beacon was bait. Raiders dropped out of the freighter’s shadow as you closed to help.' } } }] },
        { label: 'Hail from range first', hint: 'Safer, slower.', outcomes: [
          { p: 0.5, text: 'Nobody answers. After a minute the beacon cuts out. Whatever it was, you will never know.', fx: {} },
          { p: 0.5, text: 'A frightened voice answers. You talk them through a reactor restart and send them on their way.', fx: { credits: 60, rep: ['near', 3] } }] },
        { label: 'Log it and fly on', outcomes: [{ p: 1, text: 'You log the beacon for the next Navy patrol and hold course.', fx: {} }] }] },
    { id: 'derelict', title: 'A dead frigate', weight: 2, when: c => ['Kestrel Verge', 'Ash Marches', 'Red Narrows'].includes(c.region) && c.act <= 2,
      text: 'A Navy frigate tumbles across the lane near {system}, cold and dark, its name burned off the hull. Her magazines may still be full.',
      choices: [
        { label: 'Strip her for parts', hint: 'Torpedoes and spares, if the reactor stays quiet.', outcomes: [
          { p: 0.75, text: 'The salvage teams come back with torpedoes, spares and a crate of requisition chits nobody will miss.', fx: { torps: 3, credits: 90 } },
          { p: 0.25, text: 'Her reactor flares as the cutters reach it. The salvage teams get clear; your hull does not.', fx: { hull: -0.06, credits: 40 } }] },
        { label: 'Pull her logs', hint: 'Your intelligence officer will want to see them.', outcomes: [
          { p: 0.5, text: 'The logs name the ships that killed her and where they went. The front moves a little your way.', fx: { xp: ['renn', 40], front: 1 } },
          { p: 0.5, text: 'The logs are mostly corrupt, but what is left is worth studying.', fx: { xp: ['renn', 40] } }] },
        { label: 'Leave her to the dead', outcomes: [{ p: 1, text: 'The bridge is quiet as she drifts out of the floodlights.', fx: {} }] }] },
    { id: 'smuggler', title: 'Surplus parts, no questions', weight: 2, when: c => ['Red Narrows', 'Kestrel Verge'].includes(c.region),
      text: 'A smuggler’s cutter pulls alongside on the approach to {system}. Its captain has a crate of “surplus” Navy ship systems, and a price.',
      choices: [
        { label: 'Buy the crate · 250', cost: 250, hint: 'Could be genuine. Could be scrap.', outcomes: [
          { p: 0.7, text: 'Genuine Navy spares, still in the wrappers. The engineers have every damaged system back to full by the next watch.', fx: { credits: -250, repair: true, hull: 0.08 } },
          { p: 0.3, text: 'Scrap, painted to look like spares. The cutter is long gone by the time the engineers open the crate.', fx: { credits: -250 } }] },
        { label: 'Report them to the Navy', outcomes: [{ p: 1, text: 'Meridian Command thanks you for the tip. The smuggler curses you on an open channel.', fx: { rep: ['meridian', 5] } }] },
        { label: 'Wave them off', outcomes: [{ p: 1, text: 'The cutter peels away to find a less principled buyer.', fx: {} }] }] },
    { id: 'unrest', title: 'Grumbling below decks', weight: 3, when: c => c.lastLoss || c.wounded > 0,
      text: 'After the last fight the mood below decks has soured. The chief of the boat asks, quietly, whether the captain would say a few words.',
      choices: [
        { label: 'Address the crew', hint: 'Your first officer will back you up.', outcomes: [
          { p: 0.75, text: 'You tell them the truth: it was hard, and it will be harder. They cheer anyway. The bridge officers walk a little taller.', fx: { xp: ['duty', 25] } },
          { p: 0.25, text: 'It goes badly. A scuffle breaks out on the hangar deck, and an officer trying to break it up comes off worst.', fx: { wound: 'random' } }] },
        { label: 'Pay a bonus · 150', cost: 150, outcomes: [{ p: 1, text: 'A bonus in every pay packet. The grumbling stops, for now.', fx: { credits: -150, xp: ['duty', 10] } }] },
        { label: 'Let it pass', outcomes: [{ p: 1, text: 'You let it blow over. It mostly does.', fx: {} }] }] },
    { id: 'refugees', title: 'A liner out of fuel', weight: 2, when: c => c.act >= 2 && !core(c),
      text: 'A refugee liner hangs dead in the lane near {system}, two thousand people aboard and her tanks dry. Her captain is not asking for much.',
      choices: [
        { label: 'Share fuel and stores · 120', cost: 120, outcomes: [{ p: 1, text: 'Your tankers top her up. The liner limps on toward safety, and the frontier hears who stopped to help.', fx: { credits: -120, rep: ['near', 8], front: 1 } }] },
        { label: 'Tow her to the beacon', hint: 'Slow, in hostile space.', outcomes: [
          { p: 0.6, text: 'A long, slow tow, but the liner reaches the beacon. Her passengers line the viewports as you pass.', fx: { rep: ['near', 5] } },
          { p: 0.4, text: 'Raiders have been shadowing the liner. With your ship tied to her, they come for you.', fx: { battle: { name: 'Raiders at {system}', brief: 'Raiders had been shadowing the refugee liner. With your ship tethered to her, they struck.' } } }] },
        { label: 'Leave her', outcomes: [{ p: 1, text: 'The liner’s running lights fade behind you. Nobody on the bridge says anything.', fx: {} }] }] },
    { id: 'probe', title: 'A machine probe', weight: 2, when: c => c.act >= 2 && c.region === 'Halcyon Belt',
      text: 'A Directorate probe falls in beside you on the lane to {system}, matching every correction you make, transmitting on a band nobody can read.',
      choices: [
        { label: 'Let intelligence study it', hint: 'It may be listening back.', outcomes: [
          { p: 0.7, text: 'Two hours of recordings, and your intelligence officer looks as though Midsummer came early.', fx: { xp: ['renn', 50] } },
          { p: 0.3, text: 'It was not listening. It was calling. A machine hunter answers.', fx: { battle: { name: 'Called in at {system}', brief: 'The probe was a beacon. A Directorate hunter answered its call.' } } }] },
        { label: 'Shoot it down', outcomes: [{ p: 1, text: 'One broadside, and the salvage is worth a little.', fx: { credits: 60 } }] },
        { label: 'Ignore it', outcomes: [{ p: 1, text: 'It follows you to the edge of the system and then is simply not there.', fx: {} }] }] },
    { id: 'spores', title: 'Spores on the hull', weight: 3, when: c => c.act >= 3 && c.region === 'Harrow Expanse',
      text: 'Something drifting in the lane near {system} has left the hull crawling with green spores. They are already working into the seams.',
      choices: [
        { label: 'Vent the reactor over the hull', hint: 'It will cook the shield emitters too.', outcomes: [{ p: 1, text: 'A burst of plasma down the hull, and the spores are ash. So are some of the shield emitters.', fx: { sub: { shields: -20 } } }] },
        { label: 'Scrape it off by hand', hint: 'Crews on the hull, in Wraith space.', outcomes: [
          { p: 0.7, text: 'Eight hours of hard, careful work. The hull is clean.', fx: { xp: ['vale', 20] } },
          { p: 0.3, text: 'A cluster of spores bursts in an engineer’s face. They get the hull clean, but your chief engineer goes to the sickbay.', fx: { wound: 'vale' } }] },
        { label: 'Bag a sample for Elysia', hint: 'They pay well. Containment may not hold.', outcomes: [
          { p: 0.6, text: 'A sealed sample, alive and furious. Elysia’s scientists will be delighted.', fx: { credits: 150, rep: ['elysia', 6] } },
          { p: 0.4, text: 'The containment cracks. The spores eat a strip of hull before the crews burn them off.', fx: { hull: -0.08, rep: ['elysia', 3] } }] }] },
    { id: 'tender', title: 'A Navy supply tender', weight: 1, when: c => core(c) || c.region === 'Kestrel Verge',
      text: 'A Navy supply tender on its way to {system} flashes a greeting and offers to top you up from its stores.',
      choices: [
        { label: 'Take on torpedoes', outcomes: [{ p: 1, text: 'Every magazine in the fleet filled to the brim.', fx: { fleetTorps: 'full' } }] },
        { label: 'Borrow the repair crews', outcomes: [{ p: 1, text: 'The tender’s crews swarm over your hulls for a watch and patch what they can.', fx: { fleetHull: 0.1 } }] }] },
    { id: 'storm', title: 'An ion storm', weight: 2, when: c => !core(c),
      text: 'An ion storm is sweeping across the lane to {system}, wide enough to fly through, dense enough to hurt.',
      choices: [
        { label: 'Push straight through', outcomes: [
          { p: 0.5, text: 'The storm is thinner than it looked. You come out the far side with nothing worse than a static headache.', fx: {} },
          { p: 0.5, text: 'Lightning crawls over the hull for ten long minutes. Shields and engines both take a beating.', fx: { sub: { shields: -15, engines: -10 } } }] },
        { label: 'Ride the edge of it', hint: 'A job for the helm.', outcomes: [
          { p: 0.6, text: 'Your helm officer skims the edge of the storm like a racing pilot. Not a scratch.', fx: { xp: ['sato', 30] } },
          { p: 0.4, text: 'A gust of charged gas catches the hull broadside on.', fx: { hull: -0.05 } }] },
        { label: 'Wait it out · 60', cost: 60, outcomes: [{ p: 1, text: 'Six hours holding station, burning fuel and wages. The storm passes.', fx: { credits: -60 } }] }] },
    { id: 'rumour', title: 'Someone is asking about you', weight: 3, when: c => !!c.rival,
      text: 'At the beacon before {system}, a trader hails you on a private channel. {rival} has been asking after your ship, and paying for answers.',
      choices: [
        { label: 'Buy what the trader knows · 80', cost: 80, outcomes: [{ p: 1, text: 'You learn where {rival} has been and what has been fitted since. You will be ready. So will {rival}: word gets around that you are asking too.', fx: { credits: -80, rival: true } }] },
        { label: 'Laugh it off', outcomes: [{ p: 1, text: 'You tell the trader to pass on your regards. The bridge crew laugh. Most of them.', fx: {} }] }] },
    { id: 'pod', title: 'An escape pod', weight: 2, when: c => !core(c),
      text: 'An escape pod tumbles past on the approach to {system}, one life sign aboard.',
      choices: [
        { label: 'Take them aboard', outcomes: [
          { p: 0.5, text: 'A merchant captain, the last of her crew. Her company pays for her safe return.', fx: { credits: 180 } },
          { p: 0.3, text: 'A Navy rating, three weeks adrift. The story of how he survived does the rounds of the ship.', fx: { xp: ['duty', 15] } },
          { p: 0.2, text: 'A pirate spy. By the time you find out, he has helped himself to the paymaster’s safe and a shuttle.', fx: { credits: -100 } }] },
        { label: 'Leave it for a patrol', outcomes: [{ p: 1, text: 'You log the pod’s position and fly on.', fx: {} }] }] },
    { id: 'race', title: 'A salvage race', weight: 2, when: c => ['Kestrel Verge', 'Red Narrows'].includes(c.region) && c.hostile,
      text: 'A fresh wreck is spilling cargo near {system}, and a scavenger raider is already burning toward it.',
      choices: [
        { label: 'Race them for it', hint: 'They will fight for it.', outcomes: [{ p: 1, text: 'The scavenger turns to fight rather than give up the wreck.', fx: { battle: { name: 'Salvage race at {system}', brief: 'A scavenger raider would rather fight you than give up a fresh wreck.', weak: true } } }] },
        { label: 'Let them have it', outcomes: [{ p: 1, text: 'Not worth the trouble. The scavenger salutes you on the way past.', fx: {} }] }] },
    { id: 'hospital', title: 'A hospital ship', weight: 4, when: c => c.wounded > 0 && (core(c) || c.region === 'Kestrel Verge' || c.region === 'Halcyon Belt'),
      text: 'The hospital ship Mercy of Solace is crossing the lane to {system}. Her chief surgeon has heard you have wounded aboard.',
      choices: [
        { label: 'Send the wounded across', outcomes: [{ p: 1, text: 'They come back two days later, patched, rested and complaining about the food. Every wound has healed.', fx: { heal: 'all' } }] },
        { label: 'Thank her and fly on', outcomes: [{ p: 1, text: 'The Mercy dips her lights and is gone.', fx: {} }] }] }
  ];
  const byId = Object.fromEntries(EVENTS.map(e => [e.id, e]));
  // Does an event happen on this journey, and which? `random` is the campaign's random source.
  function roll(c, random) {
    if (random() >= CHANCE) return null;
    const open = EVENTS.filter(e => { try { return e.when(c); } catch (x) { return false; } }), total = open.reduce((n, e) => n + e.weight, 0);
    if (!total) return null;
    let r = random() * total;
    for (const e of open) if ((r -= e.weight) < 0) return e;
    return open[open.length - 1];
  }
  // The outcome of choosing `choice` (an index) in `e`.
  function resolve(e, choice, random) {
    const ch = e.choices[choice]; if (!ch) return null;
    let r = random();
    for (const o of ch.outcomes) if ((r -= o.p) < 0) return o;
    return ch.outcomes[ch.outcomes.length - 1];
  }
  const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (_, k) => v[k] != null ? v[k] : '');
  root.BroadsideEvents = Object.freeze({ CHANCE, EVENTS, byId, roll, resolve, fill });
})(typeof window !== 'undefined' ? window : globalThis);

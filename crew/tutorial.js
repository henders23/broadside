// First-battle tutorial: a short run of coached steps, each finished by doing the thing it teaches. The battle page
// feeds it a snapshot of the flagship every frame and shows the current step; hostiles hold their fire until the
// captain has fired a broadside (or HOLD_MAX seconds pass), so the controls can be learned before the shooting starts.
// Loaded by the battle page and the Node tests.
(function (root) {
  'use strict';
  // Each step: what to do, and `until(s)` over the snapshot, which must hold for `hold` seconds in total.
  // Snapshot: { step, rudder, focus, pips: {eng, shd, wpn}, pips0, broadside, uses }.
  const STEPS = [
    { id: 'throttle', title: 'Ahead full', keys: 'W · S',
      text: n => `${n.ship} starts at two-thirds ahead. Ring the engine telegraph up to full with W; S brings it back down.`,
      until: s => s.step >= 4 },
    { id: 'rudder', title: 'Set the rudder', keys: 'A · D · X',
      text: n => `A and D move the rudder, and it stays where you leave it; X centres it. Swing towards ${n.enemy}, the red contact on the plot.`,
      until: s => Math.abs(s.rudder) > 0.25, hold: 1.5 },
    { id: 'shields', title: 'Reinforce a shield', keys: '← ↑ → ↓',
      text: () => 'The arrow keys move shield strength to one facing: ↑ the bow, ↓ the stern, ← port, → starboard. Put it where the enemy is. Press the same key again to balance them.',
      until: s => s.focus >= 0 },
    { id: 'power', title: 'Route the reactor', keys: '1 · 2 · 3 · 4',
      text: () => '1, 2 and 3 move reactor power to engines, shields or weapons, one pip at a time; 4 splits it evenly. Give the guns a pip with 3.',
      until: s => !!s.pips0 && ['eng', 'shd', 'wpn'].some(k => s.pips[k] !== s.pips0[k]) },
    { id: 'broadside', title: 'Fire a broadside', keys: 'Q · E · B',
      text: n => `Your heaviest guns fire from the sides. Turn until ${n.enemy} sits off your port or starboard beam, then fire with Q (port) or E (starboard). B lets the batteries fire on their own.`,
      until: s => s.broadside },
    { id: 'officers', title: 'Call on your officers', keys: '5 – 9',
      text: () => 'Your bridge officers each have a command on 5 to 9: brace for impact, a firing solution, damage control, evasive manoeuvres and a threat scan. Each one needs time to recover. Try one now.',
      until: s => s.uses > 0 },
    { id: 'go', title: 'Good hunting, Captain', keys: '',
      text: n => n.convoy ? `${n.enemy} is after the ${n.convoy}. Stay between them until the transport reaches the jump beacon, or drive ${n.enemy} off. Tab enlarges the plot; P pauses.`
        : `Bring ${n.enemy} down. Tab enlarges the plot; P pauses.`,
      until: () => true, hold: 9 }
  ];
  // The training exercise (title menu, or index.html?training): every key in turn, against a target that never fires.
  // Its snapshot adds { climb, burn, looked, fore, torp }.
  const pick = id => STEPS.find(s => s.id === id);
  const TRAINING = [
    { ...pick('throttle'), text: n => `${n.ship} starts at two-thirds ahead. Ring the engine telegraph up to full with W; S brings it back down.` },
    { ...pick('rudder'), text: n => `A and D move the rudder, and it stays where you leave it; X centres it. Swing towards ${n.enemy}, the red contact on the plot.` },
    { id: 'climb', title: 'Climb and dive', keys: 'R · F',
      text: () => 'Hold R to climb and F to dive. The ship levels off when you let go. A shot from above or below lands on the same four shields.',
      until: s => Math.abs(s.climb) > 0, hold: 0.8 },
    { id: 'burn', title: 'Light the afterburner', keys: 'Shift',
      text: () => 'Hold Shift for a burst of speed. The burner runs out and has to cool, so save it for closing the range or getting clear.',
      until: s => s.burn, hold: 1 },
    pick('shields'), pick('power'),
    { id: 'look', title: 'Look around', keys: 'Tab · C · drag · wheel',
      text: () => 'Tab enlarges the tactical plot. C swings the camera to look at the enemy and back. Drag turns the view and the wheel zooms.',
      until: s => s.looked },
    pick('broadside'),
    { id: 'fore', title: 'Fire the forward guns', keys: 'Space',
      text: n => `The forward weapon covers the bow. Point the bow at ${n.enemy} and fire with Space.`,
      until: s => s.fore },
    { id: 'torpedo', title: 'Launch a torpedo', keys: 'T',
      text: () => 'T launches a torpedo from the bow tubes. Torpedoes are slow, weak against shields and deadly against bare hull, so knock a shield down first.',
      until: s => s.torp },
    { id: 'go', title: 'Finish the exercise', keys: 'P · N · M · G',
      text: n => `Sink ${n.enemy}. It will not fire back. P pauses, N and M turn the music and the sound effects off, and G changes the graphics quality. Every key is listed under Controls on the title screen.`,
      until: () => true, hold: 14 }
  ];
  const FIRE_STEP = STEPS.findIndex(s => s.id === 'broadside');   // hostiles open fire once this step is done
  const HOLD_MAX = 50;

  // opts.training: the training exercise's steps, and the target holds its fire throughout.
  function create(names = {}, opts = {}) {
    const STEPS = opts.training ? TRAINING : CAMPAIGN_STEPS;
    let i = 0, acc = 0, t = 0, skipped = false;
    const n = { ship: names.ship || 'the ship', enemy: names.enemy || 'the enemy', convoy: names.convoy || '' };
    return {
      update(s, dt) {
        t += dt; const st = STEPS[i]; if (!st || skipped) return false;
        if (st.until(s)) acc += dt;
        if (acc >= (st.hold || 0) && st.until(s)) { i++; acc = 0; return true; }   // true: moved on to the next step
        return false;
      },
      skip() { skipped = true; i = STEPS.length; },
      get index() { return i; },
      get step() { const st = STEPS[i]; return st ? { id: st.id, title: st.title, keys: st.keys, text: st.text(n), n: i + 1, of: STEPS.length } : null; },
      get finished() { return i >= STEPS.length; },
      get training() { return !!opts.training; },
      get holdFire() { return opts.training ? true : !skipped && i <= FIRE_STEP && t < HOLD_MAX; }
    };
  }
  // A new campaign shows the tutorial in its first battle, and any save shows it again after the captain asks to replay it
  // (campaign Intel). Saves from before the tutorial existed, with operations already flown, are left alone.
  const wanted = save => !!save && (save.tutorial === 'again' || (save.tutorial == null && !(save.completed && save.completed.length)));

  const CAMPAIGN_STEPS = STEPS;
  root.BroadsideTutorial = Object.freeze({ TRAINING, STEPS, FIRE_STEP, HOLD_MAX, create, wanted });
})(typeof window !== 'undefined' ? window : globalThis);

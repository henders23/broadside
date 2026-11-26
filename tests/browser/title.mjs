// The title screen (menu, campaign summary, keyboard, stepping back when idle) and the training exercise.
// Run: node tests/browser/title.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('title', {}, async ({ page, base, KEY, check, shot }) => {
  const txt = sel => page.evaluate(s => document.querySelector(s).textContent.trim(), sel);
  await page.goto(base + '/index.html'); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForSelector('#menu.live.main', { timeout: 240000 }); await page.waitForTimeout(2500);
  check(await txt('#mv-camp-label') === 'Campaign' && await txt('#mv-camp') === 'The Shattered Reach', 'with no save the campaign is offered new');
  check(await txt('#mv-skirm') === 'Bastion · Captain', 'skirmish shows the ship and the enemy captain: ' + await txt('#mv-skirm'));
  check(await page.locator('#training-menu.fresh').count() === 1 && await txt('#mv-train') === 'New captains start here', 'a new captain is pointed at training');
  check(await page.locator('#m-main .msub .mbtn').count() === 6 && await page.locator('#m-main .mlist > .mbtn').count() === 3, 'three ways to play, six options under them');
  check(await page.evaluate(() => /event-horizon-drift/.test(Object.values(document.querySelectorAll('script')).map(s => s.textContent).join(''))), 'the title track is Event Horizon Drift');
  await shot('01-title');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
  const f1 = await page.evaluate(() => document.activeElement.textContent.trim().slice(0, 8)); await page.keyboard.press('ArrowUp');
  const f2 = await page.evaluate(() => document.activeElement.textContent.trim().slice(0, 8));
  check(f1 !== f2 && f1.length > 0 && f2.length > 0, 'the arrow keys walk the menu: ' + f1 + ' / ' + f2);
  await page.waitForFunction(() => document.getElementById('menu').classList.contains('idle'), null, { timeout: 60000 });
  await page.waitForTimeout(1200); await shot('02-idle');
  check(await page.evaluate(() => +getComputedStyle(document.querySelector('#m-main .mlist')).opacity < 0.1 && +getComputedStyle(document.querySelector('.title')).opacity === 1), 'left alone, the menu steps back and the title stays');
  await page.mouse.move(300, 300); await page.mouse.move(340, 320);
  check(await page.waitForFunction(() => !document.getElementById('menu').classList.contains('idle') && +getComputedStyle(document.querySelector('#m-main .mlist')).opacity > 0.9, null, { timeout: 10000 }).then(() => true, () => false), 'moving the mouse brings it back');
  await page.locator('[data-page="controls"]').click(); await page.waitForTimeout(400);
  check(await page.locator('#m-controls').isVisible(), 'options open their pages'); await page.keyboard.press('Escape');
  // a campaign under way
  await page.evaluate(k => localStorage.setItem(k, JSON.stringify({ version: 1, ships: [{ id: 's1', ship: 'bastion', shipName: 'MNS Resolute' }], flag: 's1', completed: [1, 2, 3, 8], introSeen: true })), KEY);
  await page.reload(); await page.waitForSelector('#menu.live.main', { timeout: 240000 }); await page.waitForTimeout(1500);
  check(await txt('#mv-camp-label') === 'Continue campaign' && await txt('#mv-camp') === 'Act II · MNS Resolute', 'a campaign under way is offered as Continue: ' + await txt('#mv-camp'));
  check(await page.locator('#training-menu.fresh').count() === 0, 'and training is no longer flagged');
  await shot('03-continue');
  await page.setViewportSize({ width: 420, height: 820 }); await page.waitForTimeout(600); await shot('04-phone');
  check(await page.evaluate(() => { const r = document.querySelector('#m-main .mlist').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }), 'the menu fits a phone');
  await page.setViewportSize({ width: 1600, height: 900 });

  // the training exercise
  await page.goto(base + '/index.html?sim'); await page.waitForFunction(() => window.__sim && window.__sim.state === 'menu', null, { timeout: 240000 }); await page.waitForTimeout(1500);
  await page.click('#training-menu'); await page.waitForFunction(() => window.__sim.state === 'playing', null, { timeout: 60000 });
  const step = () => page.evaluate(() => window.__sim.tutorial && window.__sim.tutorial.step && window.__sim.tutorial.step.id);
  const until = id => page.waitForFunction(id => window.__sim.tutorial.step && window.__sim.tutorial.step.id === id, id, { timeout: 30000 }).then(() => true, () => false);
  const put = (side, ahead) => page.evaluate(([side, ahead]) => { const S = window.__sim, P = S.player, E = S.enemy, y = P.yaw; E.pos.set(P.pos.x - Math.sin(y) * ahead + Math.cos(y) * side, P.pos.y, P.pos.z - Math.cos(y) * ahead - Math.sin(y) * side); E.vel && E.vel.set(0, 0, 0); }, [side, ahead]);
  check(await page.evaluate(() => window.__sim.enemy.name === 'Target hulk' && window.__sim.tutorial.training) && await step() === 'throttle', 'Training starts the exercise against the target hulk');
  check((await txt('#coach-k')) === 'Tutorial · 1 of 11', 'eleven steps: ' + await txt('#coach-k'));
  await page.keyboard.press('KeyW'); await page.keyboard.press('KeyW'); check(await until('rudder'), 'W rings up full ahead');
  await page.keyboard.down('KeyD'); check(await until('climb'), 'D sets the rudder'); await page.keyboard.up('KeyD'); await page.keyboard.press('KeyX');
  await page.keyboard.down('KeyR'); check(await until('burn'), 'R climbs'); await page.keyboard.up('KeyR');
  await page.keyboard.down('ShiftLeft'); check(await until('shields'), 'Shift lights the afterburner'); await page.keyboard.up('ShiftLeft');
  await page.keyboard.press('ArrowLeft'); check(await until('power'), 'an arrow key reinforces a shield');
  await page.keyboard.press('Digit3'); check(await until('look'), '3 moves a pip to the guns'); await shot('05-training');
  await page.keyboard.press('Tab'); check(await until('broadside'), 'Tab opens the plot'); await page.keyboard.press('Tab');
  await put(1100, 0); await page.waitForTimeout(300); await page.keyboard.press('KeyE'); check(await until('fore'), 'E fires the starboard broadside');
  await put(0, 1500); await page.waitForTimeout(300); await page.keyboard.press('Space'); check(await until('torpedo'), 'Space fires the forward guns');
  await page.keyboard.press('KeyT'); check(await until('go'), 'T launches a torpedo');
  const quiet = await page.evaluate(() => { const S = window.__sim, t0 = S.player.stats.taken; S.step(900); return { taken: S.player.stats.taken - t0, alive: S.enemy.alive, state: S.state }; });
  check(quiet.taken === 0, 'the target never fires back: ' + JSON.stringify(quiet));
  await page.evaluate(() => { const S = window.__sim, E = S.enemy; for (let i = 0; i < 60 && E.alive; i++) S.damage(E, 800, 'shell', E.pos.clone(), S.player); });
  await page.waitForFunction(() => window.__sim.state === 'over' || (window.__sim.killCam && (window.__sim.step(60), false)), null, { timeout: 60000, polling: 500 }).catch(() => {});
  await page.waitForFunction(() => window.__sim.state === 'over', null, { timeout: 60000 }).catch(() => {});
  check(await txt('#over-word') === 'Exercise complete' && await txt('#again') === 'Run it again' && await txt('#tomenu') === 'Title screen', 'sinking it completes the exercise: ' + await txt('#over-word'));
  await shot('06-complete');
  await page.click('#tomenu'); await page.waitForTimeout(800);
  check(await page.evaluate(() => window.__sim.state === 'menu' && localStorage.getItem('broadside-trained') === '1') && await page.locator('#m-main').isVisible(), 'and returns to the title screen, remembered as done');
  await page.evaluate(() => window.__sim.start()); await page.waitForTimeout(500);
  check(await page.evaluate(() => !window.__sim.tutorial && window.__sim.enemy.name !== 'Target hulk'), 'a skirmish afterwards is an ordinary fight');
});

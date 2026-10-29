// Hit feel and the kill cam: damage numbers, hit pauses, the shield-break burst, and the camera on the battle-ending kill.
// Run: node tests/browser/impact.mjs
import { suite } from './harness.mjs';

await suite('impact', {}, async ({ page, base, check, shot }) => {
  const S = f => page.evaluate(f);
  await page.goto(base + '/index.html?sim');
  await page.waitForFunction(() => window.__sim && window.__sim.state === 'menu', null, { timeout: 240000 });
  await page.waitForTimeout(1500);
  await S(() => { window.__sim.start(); window.__sim.step(60); });
  // a heavy hit on the enemy's shields: a blue number and a hit pause
  await S(() => { const s = window.__sim; s.enemy.sh[0] = 5000; s.damage(s.enemy, 220, 'shell', s.enemy.pos.clone().set(0, 0, -40), s.player); });
  const stop = await S(() => window.__sim.timeFx.stop);
  check(stop > 0, 'a heavy hit pauses the battle for a moment: ' + stop.toFixed(3) + ' s');
  await page.waitForFunction(() => document.querySelector('#dmgnums .dn'), null, { timeout: 30000 }).catch(() => {});   // the first battle frame can be slow on software WebGL
  const n1 = await S(() => [...document.querySelectorAll('#dmgnums .dn')].filter(e => e.style.display !== 'none').map(e => ({ t: e.textContent, c: e.className })));
  check(n1.some(n => n.c.includes('shd') && n.t === '220'), 'a shield hit shows a blue damage number: ' + JSON.stringify(n1));
  // knock a facing down: the hull number, and quick hits adding into the same number
  await S(() => { const s = window.__sim; s.step(15); s.enemy.sh[0] = 10; for (let i = 0; i < 4; i++) s.damage(s.enemy, 50, 'shell', s.enemy.pos.clone().set(0, 0, -40), s.player); });
  await page.waitForFunction(() => document.querySelector('#dmgnums .dn.hull'), null, { timeout: 30000 }).catch(() => {});
  const n2 = await S(() => [...document.querySelectorAll('#dmgnums .dn.hull')].filter(e => e.style.display !== 'none').map(e => e.textContent));
  check(n2.includes('200'), 'quick hits on the hull add into one amber number: ' + JSON.stringify(n2));
  await shot('1-damage-numbers');
  check(await S(() => window.__sim.killCam === null), 'no kill cam while the fight goes on');
  // the kill that ends the battle, at a usual fighting range
  await S(() => { const s = window.__sim; s.enemy.pos.copy(s.player.pos).add(s.player.pos.clone().set(1500, 60, -900)); s.damage(s.enemy, 1e6, 'torp', s.enemy.pos.clone().set(0, 0, -40), s.player); });
  const k = await S(() => ({ kc: !!window.__sim.killCam, lb: document.getElementById('letterbox').classList.contains('on'), cine: document.getElementById('hud').classList.contains('cine'),
    word: document.getElementById('kc-word').textContent, slow: window.__sim.timeFx.slowK }));
  check(k.kc && k.lb && k.cine, 'the battle-ending kill starts the kill cam with letterbox bars and the HUD faded');
  check(/destroyed$/.test(k.word), 'the kill cam names the wreck: ' + k.word);
  check(k.slow < 0.5, 'the kill drops into slow motion: ' + k.slow);
  await page.waitForFunction(() => getComputedStyle(document.getElementById('own')).opacity === '0', null, { timeout: 30000 }).catch(() => {});
  check(await S(() => getComputedStyle(document.getElementById('own')).opacity === '0' && getComputedStyle(document.getElementById('msg')).opacity === '0'), 'the instruments fade out for the kill cam');
  await shot('2-killcam-close');
  await S(() => { window.__sim.step(50); window.__sim.killCam.t = 3; }); await page.waitForTimeout(500); await shot('3-killcam-witness');
  await S(() => { window.__sim.killCam.t = 5.2; window.__sim.enemy.dying = 0.01; }); await page.waitForTimeout(500); await shot('4-killcam-blast'); await page.waitForTimeout(1200); await shot('5-killcam-after');
  // any key skips once the cut has run a moment
  await page.waitForFunction(() => window.__sim.killCam && window.__sim.killCam.real > 1, null, { timeout: 30000 });
  await page.keyboard.press('KeyX');
  await page.waitForFunction(() => window.__sim.state === 'over', null, { timeout: 30000 }).catch(() => {});
  check(await S(() => window.__sim.state === 'over' && !document.getElementById('letterbox').classList.contains('on')), 'a key skips to the results and the letterbox lifts');
  // with the option off there is no kill cam and no pause
  await S(() => { const s = window.__sim; s.gfx.cine = false; s.start(); s.step(30); s.damage(s.enemy, 1e6, 'torp', s.enemy.pos.clone().set(0, 0, -40), s.player); });
  check(await S(() => window.__sim.killCam === null && window.__sim.timeFx.stop <= 0 && window.__sim.timeFx.slowK === 1), 'the Graphics option turns the kill cam and pauses off');
});

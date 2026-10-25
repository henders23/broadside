// The shield bubble: a downed facing shows nothing and fades into its neighbours. Screenshots in out/shields.
// Run: node tests/browser/shields.mjs
import { suite } from './harness.mjs';

await suite('shields', {}, async ({ page, base, out, check }) => {
  await page.goto(base + '/index.html?sim');
  await page.waitForFunction(() => window.__sim && window.__sim.state === 'menu', null, { timeout: 240000 });
  await page.evaluate(() => window.__sim.start());
  // Freeze the fight: enemy far away, no AI; the player's starboard and aft shields are down.
  await page.evaluate(() => { const S = window.__sim, P = S.player, E = S.enemy; E.ai = null; E.pos.set(0, 0, -20000); P.step = 0; P.speed = 0; P.C.regen = 0; });
  const down = () => page.evaluate(() => { const P = window.__sim.player; P.sh = [P.cap[0], 0, P.cap[2], 0]; for (const e of document.querySelectorAll('#tip,#msg,.tip')) e.style.display = 'none'; });
  for (const [name, yaw, pitch, dist] of [['top', 0, 1.5, 640], ['quarter', 2.3, 0.6, 620]]) {
    await page.evaluate(([y, pt, d]) => { const c = window.__sim.cam; c.yaw = y; c.pitch = pt; c.dist = d; c.curPitch = undefined; }, [yaw, pitch, dist]);
    await down(); await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${name}.png`, clip: { x: 300, y: 120, width: 1000, height: 640 } });
  }
  const u = await page.evaluate(() => [...window.__sim.player.shieldMesh.material.uniforms.uStr.value.toArray()]);
  check(u[1] === 0 && u[3] === 0 && u[0] > 0.9 && u[2] > 0.9, 'the shader gets aft and starboard at zero: ' + u.map(v => v.toFixed(2)).join(', '));
  const src = await page.evaluate(() => window.__sim.player.shieldMesh.material.fragmentShader);
  check(!/vec3\(1\.0,0\.25,0\.15\)/.test(src) && /smoothstep\(0\.3,0\.7,f\)/.test(src) && /\*vis/.test(src), 'no red tint; facings blend and a downed facing is invisible');
});

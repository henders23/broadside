// The prologue film: plays before the Act I briefing on a new campaign, can be skipped, and replays from Intel.
// Run: node tests/browser/prologue.mjs (or tests/browser/run.mjs for every suite).
import { suite } from './harness.mjs';

await suite('prologue', { random: 0.99, prologue: true }, async ({ page, base, KEY, check, shot, read }) => {
  const film = () => page.evaluate(() => window.__prologue && { t: window.__prologue.t, clock: window.__prologue.clock });
  const seek = async t => { await page.evaluate(t => window.__prologue.seek(t), t); await page.waitForTimeout(500); };
  const opacity = sel => page.evaluate(s => +getComputedStyle(document.querySelector(s)).opacity, sel);
  await page.goto(base + '/campaign.html');
  await page.evaluate(k => localStorage.removeItem(k), KEY); await page.reload();
  check(await page.locator('#prologue').isVisible() && await page.locator('#intro').isHidden(), 'a new campaign opens on the film, before the briefing');
  await page.waitForFunction(() => window.__prologue && window.__prologue.t > 1.5, null, { timeout: 20000 });
  check((await film()).clock === 'audio', 'the film runs on its soundtrack: ' + (await film()).clock);
  check(await page.locator('.proshot').count() === 6, 'five stills and one clip are loaded');
  const sizes = await page.evaluate(async list => Promise.all(list.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth); i.onerror = () => r(0); i.src = u; }))), await page.evaluate(() => PROLOGUE.shots.filter(s => s.img).map(s => s.img)));
  check(sizes.every(w => w >= 1280), 'every still loads: ' + sizes.join(', '));
  await seek(6.5); await shot('01-reach');
  check((await page.textContent('#prosub')).includes('Broken worlds') && await opacity('#prosub') > 0.9, 'the narration is subtitled');
  check(await opacity('.proshot') > 0.9, 'the first shot is up');
  await seek(15); await shot('02-settlers');
  await seek(23); await shot('03-war');
  await seek(30); await shot('04-reserve');
  await seek(35); await shot('05-corsairs');
  await seek(38.2); const lit0 = await page.evaluate(() => PRO_BEACONS);
  check(await opacity('#proplot') > 0.9, 'the Kestrel plot is drawn'); await shot('06-lane');
  await seek(44.3); await shot('07-lane-dark');
  const dark = await page.evaluate(() => { const c = document.getElementById('proplot'), d = c.getContext('2d').getImageData(1100, 300, 200, 120).data; let m = 0; for (let i = 0; i < d.length; i += 4) m = Math.max(m, d[i + 1]); return m; });
  check(lit0 === 14 && dark < 200, 'the far beacons have gone dark: ' + dark);
  await seek(52); await page.waitForTimeout(800); await shot('09-departure');
  check(await opacity('#protitle') > 0.9, 'the title comes up over the last shot');
  check(await page.evaluate(() => { const v = document.querySelector('video.proshot'); return v.readyState >= 2 && v.currentTime > 1; }), 'the departure clip is playing');
  await seek(56.2); await page.waitForFunction(() => !window.__prologue, null, { timeout: 8000 });
  // the arrival: card, flagship, incoming transmission, then the briefing over the shot
  await page.waitForFunction(() => window.__arrival && window.__arrival.phase === 'card', null, { timeout: 8000 });
  await page.waitForTimeout(1800); await shot('10-card');
  const card = await page.textContent('#procard');
  check(await opacity('#procard') > 0.9 && /Present day/.test(card) && /Meridian Fleet Yards/.test(card) && /MNS Resolute/.test(card) && /Bastion-class heavy battleship/.test(card), 'a card gives the day, the place and the ship');
  check(await page.locator('#procard li').count() === 6 && /First Officer/.test(card), 'and the captain with the five officers: ' + await page.locator('#procard li').count());
  check(await page.locator('#intro').isHidden(), 'the briefing has not started yet');
  await page.keyboard.press('Enter'); await page.waitForFunction(() => window.__arrival.phase === 'shot', null, { timeout: 8000 }); await page.waitForTimeout(2300);
  check(await opacity('#proshots .proshot') > 0.5 && await opacity('#procard') < 0.1, 'the card gives way to the flagship'); await shot('11-flagship');
  await page.waitForFunction(() => window.__arrival.phase === 'note', null, { timeout: 8000 }); await page.waitForTimeout(700);
  check(await opacity('#pronote') > 0.9 && /Incoming transmission/.test(await page.textContent('#pronote')), 'an incoming transmission from Fleet HQ is announced'); await shot('12-incoming');
  await page.waitForFunction(() => window.__arrival.phase === 'tx', null, { timeout: 12000 }); await page.waitForTimeout(4800); await shot('13-transmission');
  check(await page.locator('#intro.tx').isVisible() && (await page.textContent('#introtitle')).includes('Act I') && await page.locator('#prologue').isVisible(), 'the Act I briefing plays as a transmission over the shot');
  const box = await page.locator('#introportrait').boundingBox();
  check(box.width < 260 && box.x < 120, 'with the admiral in the corner: ' + Math.round(box.width) + 'px wide');
  check((await read()).introSeen !== true, 'the briefing is not marked seen until Take command');
  await page.click('#introgo');
  check(await page.locator('#intro').isHidden() && await page.locator('#prologue').isHidden() && (await read()).introSeen === true, 'Take command clears the shot and the briefing');
  await page.evaluate(k => localStorage.removeItem(k), KEY);
  // skipped on the way in
  await page.reload();
  check(await page.locator('#prologue').isVisible(), 'a new campaign plays the film again');
  await page.keyboard.press('Escape'); await page.waitForFunction(() => window.__arrival && window.__arrival.phase === 'tx', null, { timeout: 12000 });
  check(await page.locator('#intro.tx').isVisible() && await opacity('#procard') < 0.1, 'Escape skips the film and goes to the flagship and the transmission, without the card');
  await page.click('#introgo'); await page.reload();
  check(await page.locator('#prologue').isHidden() && await page.locator('#intro').isHidden(), 'neither repeats once command is taken');
  // replay from Intel
  await page.click('#tabIntel'); await page.locator('#modalactions button', { hasText: 'Watch the prologue' }).click();
  check(await page.locator('#prologue').isVisible(), 'Intel replays the film');
  await page.click('#proskip');
  check(await page.locator('#prologue').isHidden() && await page.locator('#intro').isHidden() && await page.locator('#mapview').isVisible(), 'Skip returns a replay to the map');
  // a new campaign from Saves, and no sound
  await page.evaluate(() => { window.__noVoice = true; });
  await page.click('#tabNew'); await page.locator('#savelist .slot-row.on [data-new]').click(); await page.locator('#modalactions .primary').click();
  await page.waitForFunction(() => window.__prologue && window.__prologue.t > 0.5, null, { timeout: 10000 });
  check((await film()).clock === 'wall', 'a new campaign from Saves opens on the film; without sound it runs on the wall clock');
  await page.keyboard.press('Escape'); await page.waitForSelector('#intro.tx', { timeout: 12000 }); await page.keyboard.press('Escape');
  check(await page.locator('#intro').isHidden() && await page.locator('#prologue').isHidden(), 'Escape closes the transmission too');
  await page.click('#tabIntel'); await page.locator('#modalactions button', { hasText: 'Replay admiral' }).click();
  check(await page.locator('#intro').isVisible() && await page.locator('#intro.tx').count() === 0, 'replayed from Intel, the briefing is the full screen');
  await page.keyboard.press('Escape');
});

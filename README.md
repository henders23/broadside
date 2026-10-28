# Broadside

A tactical capital-ship combat game with a developing persistent galactic campaign, running in the browser. Pick one of four ships under **Select ship** on the title screen. An AI captain flies one of the other three, or one of four hostile ships you can only meet in battle.

Ships you can command:

- **Bastion** – a slow, wide heavy battleship with six-turret broadsides on each beam, dorsal turrets and thick shields.
- **Halberd** – a narrow, quicker lance cruiser built around a spinal lance that only fires dead ahead.
- **Sabre** – the fastest hull: a battlecruiser with a three-turret bow battery covering the forward quarter and thin shields.
- **Warden** – the heaviest and slowest: a siege dreadnought with long-range siege cannons that fire only ahead, and six torpedo tubes.

Enemy-only ships:

- **Wraith** – an alien bioship. Slow green plasma bolts that drain shields, swarms of homing spore missiles, and a hull that grows back when it isn't under fire.
- **Scrapjaw** – a pirate ram. Heavy armour and weak shields; autocannon tracer streams, shotgun-like scatterguns at short range, and a reinforced prow it drives into you.
- **Seraph** – a beam frigate. Strong, fast-recharging shields on a fragile hull; three tracking beam emitters and a long-range railgun. It keeps its distance.
- **Revenant** – an Ash Fleet minelayer: a rust-streaked renegade warship. Missile salvos, flak broadsides, and proximity mines dropped astern for anyone chasing it.

Met only in the campaign, from Act II and Act III:

- **Sentinel** – a Directorate lance frigate: a white needle of a ship with blue running lights. It holds at four kilometres and lines up a long spinal lance that charges, with a warning, before it fires; up close its broadsides are light and it carries no torpedoes.
- **Thrall** – a young Wraith, a green, beak-prowed organic ship about half a bioship's size. Thralls hunt in packs of three or four, close fast to ram and spit plasma, and their thin hulls knit quickly.

The game is about shield facings, reactor power, firing arcs and turning circles rather than twitch flying.

The title screen is a live engagement: two AI captains fight a real battle behind the menu, filmed by a cinematic camera that cuts between close shots and moves on to a new matchup and setting when one ship is destroyed.

## Campaign: The Shattered Reach

Play the new **captain-led campaign** at [campaign.html](campaign.html) (or use **Campaign** from the title menu). The existing skirmish mode remains available.

- Code-drawn star chart with **33 clickable systems**, jump lanes and faint borders around each of the six regions. Hover a system to **set course**; the flagship jumps there and a **system arrival** screen shows its details and any operation you can take on. Only operations you can launch now are listed.
- **The story: the Kestrel warning.** Eleven years ago a machine signal warned that something was coming to the Reach, and Command buried it. Act I uncovers Commodore Halloran, who heard the warning and set out to empty the frontier by force. Act II finds the machines that sent it. Act III meets what they were warning about. Harlan sends a transmission after every story operation, Intel keeps a **Story so far**, and four decisions change later battles and the ending.
- **Frontlines.** Each contested region has a front, from Enemy-held to Secured, moved only by battle results. The current act's front slips back if you fight elsewhere for three battles without a win there. Fronts change ambush odds, enemy strength, pay and prices in their region, weaken or strengthen each act's boss, and appear on the map as region borders that turn Navy blue.
- **Three acts**: *The Long Watch* (pirates and Ash Fleet renegades), *The Machine Signal* (ORACLE-9 and the Directorate) and *The Wraith*. Each opens with a full-screen briefing from **Fleet Admiral Gideon Harlan**; replay the current one from **Intel**.
- **Ten story operations** with named enemies: Captain Kora Vex, Commander Orren Sable, Captain Garrick Thorne, ORACLE-9, the VIGIL Array, the Cantor and the Choir, and a **boss battle to close each act**:
  - *The Pyre at Grimhold* — Commodore Ingrid Halloran's Ash Fleet dreadnought. The pirate clans join her at 65% hull; below 30% she unleashes an inferno missile salvo.
  - *The Arbiter* at Halcyon — the Directorate's mind in a warship. At 60% it raises a shield lattice that soaks 80% of incoming damage until its two node ships are destroyed; below 30% it restores its shields and fires a spinal lance.
  - *Mother of the Bloom* at Verdant — the Wraith brood-mother. Her brood of Thralls wakes at 65%; below 35% she regrows nearly twice as fast and fills the sky with a spore storm.
  - Bosses are bigger, re-armed versions of the enemy hulls, with a boss health bar showing their phases. Each makes an entrance (a title card while the camera circles it; any key skips), and its special weapon (the inferno salvo, the Judgement lance, the spore storm) charges for 2.6 seconds with a warning on the boss bar before it fires, time enough to break off.
  - Bringing a boss down earns a **trophy** fitted to the flagship: *Pyre armour plate* (8% less hull damage), the Arbiter's *Lattice emitter* (stronger, faster shields) or the Bloom-Mother's *Living graft* (the hull knits when not under fire).
- **Five starbases** (Meridian, Tarn, Peregrine, Elysia, Juniper) with **mission boards**: eighteen hand-written station missions that open act by act (Acts II and III add **station defences**, where waves of attackers go for a station that fights beside you, **pursuits**, where a fleeing ship must be disabled before its jump drive spools up, and **convoy runs**, escorts across two or three systems in a row where the convoy carries its damage from one fight to the next and the reward is paid at the end), and three generated contracts per station (bounty, escort, and a patrol or, in Acts II–III, a pursuit on alternating board cycles) that change after every victory; from Act II some Directorate work is against Sentinels, and from Act III some Wraith work is against Thrall swarms. Pirate and Ash Fleet captains fly named ships (a bounty on Captain Mara Quill sends you after the Black Gull). Hold up to four orders at once; fly to the target and engage from its arrival screen.
- **A fleet of up to three ships.** Commission new hulls at any starbase (Sabre 1,100, Halberd 1,250, Bastion 1,500, Warden 1,700 requisition), name them, make any one the flagship, hold one in reserve, or sell one back for half its price. Every ship keeps its own damage, torpedoes and upgrades.
- **Fleet battles, up to 3 v 3.** You fly the flagship; your escorts fly under the AI and follow your standing order: **U** focus my target, **I** defend the flagship, **O** engage freely (also buttons on the Escorts panel). Bring escorts and the enemy may bring support ships too, but not every fight is matched: some operations stay one enemy against your fleet, and generated work varies. A disabled escort is towed home at 30% hull rather than lost. Escorts give way to the flagship and to each other rather than ploughing through them.
- Repairs, rearming, upgrades and buying or selling ships only at a starbase.
- **Reputation** with each starbase (Neutral, Friendly, Trusted, Honoured) rises with the work you do for it: up to 15% off its yard, up to 15% more pay, and a priority contract once it trusts you. Abandoning its work costs standing.
- **Claim wrecks.** After a victory, tow home a defeated Scrapjaw, Revenant or Seraph and refit it for a Navy helm (650–800 requisition, joins in reserve damaged), then fly it like any other ship. Impound Thorne's Scrapjaw, the Widow, if he surrenders.
- **Officers for hire**, one at each starbase, each with a new battle command (Rally the Crew, Overcharge, Hull Patch, Burn Hard, Jamming Field). Assign who serves at each post on the Officers screen; the rest wait in reserve.
- **Codex** of ships, factions, people, places and a captain's guide, opening as the campaign reveals them.
- Eight generated photoreal character portraits are now integrated through a compact [WebP contact-sheet atlas](img/commanders/photoreal-atlas.webp) for the five recruits and three enemy commanders. The existing SVG portraits remain in the repo as fallback/concept assets. Harlan's transmissions still need MP3 recordings.
- **Three save slots** and a **difficulty** per campaign (Ensign, Captain, Admiral): enemy skill, hull and damage, ambush rate and pay. **Saves** on the campaign bar switches, starts or deletes campaigns.
- **Battlefields and openings.** About half of all generated work is fought somewhere difficult: an **ion storm** (shields recharge at half rate and a surge strips a third of them every quarter-minute, called out beforehand), a **dense nebula** (sensors reach 2.4 km, contacts further out drop off the plot, and gunnery beyond that range is poor), an **asteroid field** that stops shells and torpedoes, an **old minefield** whose mines take no sides, or a **gravity well** that drags every ship toward a core that tears hulls apart. Each region has its own kinds of space. Fights don't all start head-on either: you can be **ambushed** from astern, drop out of the jump at **close quarters**, be **surrounded** from ahead and astern, arrive **running hot** from another fight (shields at 40%, engines and reactor damaged), or find **a Navy picket under fire** that fights beside you if you reach it in time. Interceptions always spring as an ambush, at close quarters or as a pincer. Briefings and job cards list the battlefield, and conditions and hostile openings carry hazard pay. Some station missions have their own (an ion storm at Citrine, a minefield at Scour, a gravity well at Thalos); story operations keep their designed battlefields.
- **Mid-battle twists.** About a third of generated work (and a quarter of interceptions) changes partway through, and the briefing never warns you: **reinforcements** jump in astern after the first kill or once the lead is badly hurt; a battered supporting ship **defects** and turns its guns on its own side; the lead **breaks and runs** for the jump point on failing engines and must be caught inside 45 seconds or the job is lost; a pursuit's quarry turns out to be **bait** for an ambush, and the job becomes destroying every ship; a convoy's **beacon is compromised** and it turns for an auxiliary beacon elsewhere; or its **drive fails** and it crawls at a third of its speed for thirty seconds. Station missions can name one: the Midway courier is bait, the Northpoint listening post loses its shield generator for 35 seconds when the second wave arrives or it is badly damaged, the deserter's beacon is compromised, and the Last Light freighter's drive fails. A fight won through a twist pays 20% more, and the after-action report says what happened. Story operations and bosses have none.
- Jumps are free, but routes through hostile space can be **intercepted**: fight for salvage, or try to break away (fast hulls and healthy engines get away more often).
- Persistent campaign save in browser localStorage (key `broadside-campaign-v1`): selected flagship, progress, decisions, hull condition, critical subsystem damage, surviving torpedoes and requisition.
- Battles are staged from data: escorts to a jump beacon, timed holds, forced surrenders, two-ship pincers, station defences in waves and pursuits, for story operations and generated work alike.
- **A coached first battle.** A new campaign's first fight walks through the controls one step at a time (throttle, rudder, shields, power, broadsides, officers) while the enemy holds its fire; each step finishes when you do it. Skip it from its panel, or replay it in your next battle from **Intel**.
- **Shipyard** (works while docked) with a fleet column to pick a ship, showing the selected ship's 3D model side-on, with its seven systems (engines, hull, reactor, broadsides, forward weapon, shields, torpedo bay) as slots tied to their hardpoints and battle condition. Each system has three permanent **upgrades** to buy with requisition (21 in all, 260–450 each); they apply in every campaign battle, alongside any boss trophies. Hull overhaul, emergency repairs and torpedo resupply are here too.
- **Officers** screen with each bridge officer's dossier, battle command (key, cooldown, effect), service record and field reports, plus the enemy commanders identified so far. Officers start at the bottom of their career (ensigns, and a petty officer for the engineer) and gain **experience** in every engagement, more for each command you give them; each promotion, up to Captain, makes their command stronger and its cooldown shorter, and **Intel** for campaign clues and branching narrative decisions.
- Completing a story operation unlocks the next. A loss tows the flagship to the nearest starbase, damaged but recoverable, rather than deleting the save.

The grand campaign's four milestones are in: acts and starbases, the three-ship fleet, the act finales, and the depth features (reputation, claimed hulls, officers for hire, codex, save slots and difficulty). Each region has its own generated 3D battle environment and nebula lighting. Named officer combat abilities (keys 5–9), cycling hostile targets (J), and multiple-contact tactical plots are playable. Full WebGL campaign QA and tuning are still required. See the [adversarial design review](docs/ADVERSARIAL_REVIEW.md) for the ranked problems, fixes and manual QA checklist. `campaign.html` supplies the strategic UI, and `index.html?encounter=1` stages the battle it saved (`crew/campaign-data.js` holds the campaign's data).

See [Campaign design and technical notes](docs/CAMPAIGN.md) for current architecture, known limitations and roadmap.

## Play

Open `index.html` through any static web server (modules and model loading do not work from `file://`):

```sh
npx serve .
# or
python3 -m http.server 8000
```

### Controls

| Key | Action |
| --- | --- |
| W / S | Engine telegraph up / down |
| A / D | Rudder (stays where you leave it) · X centres it |
| R / F | Climb / dive |
| Shift (hold) | Afterburner: about 7 s at 1.7× top speed, refills in about 22 s; widens the turn and halves shield regeneration while burning |
| Arrow keys | Reinforce the fore, aft, port or starboard shield (same arrow again balances) |
| 1 / 2 / 3 | Move reactor power to engines / shields / weapons · 4 splits evenly |
| Q / E | Fire port / starboard battery |
| Space | Forward weapon: dorsal turrets (Bastion), spinal lance (Halberd), bow battery (Sabre) or siege cannons (Warden) |
| T | Torpedo |
| B | Batteries free: guns fire automatically when loaded and in arc |
| J | Cycle enemy targets (campaign battles) |
| U / I / O | Escort orders: focus my target / defend the flagship / engage freely (campaign battles with escorts) |
| H | Hold / resume an escorted convoy (escort missions; also an on-screen button) |
| 5 / 6 / 7 / 8 / 9 | Bridge officer abilities (campaign battles) |
| Drag / wheel | Orbit / zoom the camera · C looks toward the enemy |
| Tab | Enlarged tactical plot |
| G | Cycle graphics quality · P pause · M sound effects on/off · N music on/off |
| M (campaign screens) | Ship ambience on/off (also the speaker button in the top bar; remembered in this browser) |

## Tests

- **Rules** (no browser needed): `node tests/<name>.test.js` for each file in `tests/`. They cover the campaign data, fleet, boss, defence and pursuit objectives, the war and story, experience, upgrades and trophies, the shared ship table, the tutorial, environments and a syntax check of both pages.
- **Browser suites**: `tests/browser/` drives the real pages in headless Chromium with software WebGL. It covers the map, officers, starbases, the fleet, bosses, campaign depth, the war, skirmish, the shield look, and the tutorial, boss entrances and trophies, defences and pursuits, about 270 checks in all, with screenshots saved to `tests/browser/out/`. Set up with `npm install --no-save playwright three@0.169.0 && npx playwright install chromium`, then run `node tests/browser/run.mjs`, or name suites to run only those (`node tests/browser/run.mjs war bosses`). The suites start their own web server and serve three.js from `node_modules`, so no network access is needed.
- Both run on every push to `main` and on pull requests (`.github/workflows/campaign-checks.yml`).
- **Balance**: `node tools/balance.mjs [--runs 4] [--only 8,9,10] [--quick]` has the AI fly the flagship through every story operation and finale, faster than real time, and writes win rates to `docs/balance-results.json`. See [docs/BALANCE.md](docs/BALANCE.md) for the targets and the last tuning pass.

## Performance

The title screen's **Graphics** page has Low / Medium / High presets, an optional frame-rate meter, and an option to lower the render resolution automatically when frames run long. The main costs are kept down by:

- baking the nebula and planet into a cube map once instead of shading them every frame;
- capping render resolution per preset and blurring the glow at screen-pixel resolution;
- drawing all shells as three instanced batches;
- updating and uploading only the live part of the particle buffers;
- redrawing the tactical plot and HUD panels about 12 times a second, writing to the page only when a value changes;
- compiling every shader before the battle starts, and avoiding per-frame allocations in the hot paths.

## Project layout

```
index.html      the battle page (three.js 0.169 from jsDelivr via an import map)
campaign.html   the campaign page; its script is split across campaign/ (core, map, board, shipyard, crew, reports, ship-view)
crew/           shared modules: ship table (ships.js), campaign data, fleet objectives, crew, upgrades, codex, tutorial
tests/          rule tests (Node) and browser suites (tests/browser, Playwright)
tools/          balance testing (balance.mjs)
docs/           design notes, balance notes, and the art and voice still to make (ART-BRIEF.md)
img/            title screen art and portraits (img/commanders/ for painted commander portraits)
music/          title and battle music (.mp3, looped)
voice/          spoken bridge alerts (.mp3)
models/         ship models (.glb, meshopt-compressed, textures as WebP)
sfx/            sound effects (.mp3)
vercel.json     cache headers for art, models, music and sounds
```

## Deploying to Vercel

Import the repository in Vercel and keep the defaults: framework preset **Other**, no build command, output directory the repository root. Every push to `main` redeploys.

## Assets

- Ship models were generated with Tripo, then simplified to about 65k triangles each and compressed for the web (meshopt geometry, 1024 px WebP textures) with glTF Transform. The Revenant, Sentinel, Pyre, Arbiter, Thrall, civilian transport and defence station were supplied by the project owner from a larger generated set; they were turned bow-forward, centred and scaled to unit length, and the station had floating debris cut away. Only the Bloom-Mother still borrows another hull (the Wraith's, scaled up).
- Spoken bridge alerts were generated with ElevenLabs (voice: The Rock, from the Broadside collection): `shields-down`, `enemy-shields-down`, `missiles-inbound`, `torpedoes-inbound`, `mines-detected`, `hull-critical`, `torpedo-away`, `afterburners`, `brace`, `battle-stations`, `enemy-destroyed` and `ship-lost`. To add a line, put its .mp3 in `voice/`, add its name to `VOICE_LINES` in `index.html` and call `Voice.say` with it.
- The title screen art and both music tracks ("Weightless Descent" on the title screen, "Untitled" in battle) were supplied by the project owner. The music was re-encoded at 128 kbps.
- The afterburner roar (`sfx/afterburner.mp3`, credited to freesound_community) and the ship ambience on the campaign screens (`music/ambience.mp3`, "Deep Space Travel Ambience 03", credited to fronbondi_skegs) were supplied by the project owner. The ambience was trimmed and crossfaded end to start so it loops without a seam, and both were level-matched and re-encoded at 128 kbps.
- Every weapon's sound comes from the supplied pack, pitched differently per weapon. Sound effects come from a sci-fi weapon sound pack supplied by the project owner. The original file names credit universfield, rescopicsound, magiazzz, soundreality and freesound_community; check those creators' licence terms before publishing the game widely.


### Artwork and audio status

**Eight photoreal character images have been generated and integrated** into the game via one optimised WebP atlas at `img/commanders/photoreal-atlas.webp` (4 columns × 2 rows, each in-game tile 96 × 120 pixels). `crew/personnel.js` and `crew/personnel.css` select each character independently. The earlier SVG illustrations remain as fallback/source art. Full-resolution masters were generated separately but are **not committed** to this repository; for future high-resolution dossier use, export individual 768 × 960 WebP files as specified in the [art brief](docs/ART-BRIEF.md).

- **Photographic portrait subjects included in the atlas** (all eight portraits are stored together in `photoreal-atlas.webp`): Adeyemi, Fenn, Osei, Marlow, Achterberg, Halloran (Act I finale), VIGIL (Operation 6), and the Choir (Operation 7). The eight individual `.svg` files are the earlier illustrated concept art, not the photoreal sources.
- **Harlan's voice is recorded**: all 13 transmissions were generated with ElevenLabs (voice: The Clay Jockey, from the Broadside collection) and live in `voice/`: `harlan-1.mp3` to `harlan-9.mp3` (after each story operation), `harlan-act1.mp3` to `harlan-act3.mp3` (act briefings) and `harlan-end.mp3` (the ending). Each clip is softened (less 2–3 kHz bite and top end, a touch more chest) and has a low engine hum, made from `sfx/engine.mp3`, laid under it so the transmission sounds like it comes from a ship. The lines are in `NARRATIVE` and `ACTS[].briefing` in `crew/campaign-data.js`; if one changes, its clip needs recording again.
- **Still missing: one ship model**, the Bloom-Mother, which is still a scaled-up Wraith. The other seven models from the brief (Revenant, Sentinel, Pyre, Arbiter, Thrall, civilian transport and defence station) are in. Prompts, sizes, file names and Harlan's script are in [docs/ART-BRIEF.md](docs/ART-BRIEF.md).


### Fleet balance test (October 2026)

A [focused AI-pilot comparison](docs/BALANCE_FOCUSED_2026-10-25.md) across four ship classes and one-, two- and three-ship fleets showed excessive automated escort firepower. NPC escort damage is now 55% of nominal class damage; your flagship remains at 100%. The revised simulation supports more demanding combat but is **not human WebGL playtesting**, and the Arbiter remains a difficult outlier. Headless comparison commands and results are documented alongside the earlier balance baseline.

### Fleet combat feedback

Escorts now explain their target choice in battle (focus, cover, intercept or nearest threat). Battle-end statistics and campaign after-action reports show each escort's damage dealt, damage absorbed and whether it was disabled. The Halberd's spinal lance now displays how many degrees its target is off the bow or whether it is out of range. `tools/balance.mjs` also records ship accuracy, lance damage and the share of charged-lance time spent aligned with a target; these diagnostics should guide human playtests before modifying ship damage.

### Bridge officer commands (campaign)

During story battles only, open the bridge deck to activate five named officer abilities with mouse or keys **5–9**: Brace (restore directional shields), Target Solution (+12% outgoing damage for 14 seconds), Damage Control (repair the worst subsystem and suppress one fire), Evasive Pattern (reduce incoming damage for 12 seconds), or Threat Scan (reveal enemy weaknesses). Cooldowns and transmissions are displayed in combat. The campaign map offers portrait dossiers and commander-to-commander mission briefings.

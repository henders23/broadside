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
- **Revenant** – a minelayer on the Warden hull in a dark red livery. Missile salvos, flak broadsides, and proximity mines dropped astern for anyone chasing it.

The game is about shield facings, reactor power, firing arcs and turning circles rather than twitch flying.

## Campaign: The Shattered Reach

Play the new **captain-led campaign** at [campaign.html](campaign.html) (or use **Campaign** from the title menu). The existing skirmish mode remains available.

- Code-drawn star chart with **33 clickable systems**, jump lanes and faint borders around each of the six regions. Hover a system to **set course**; the flagship jumps there and a **system arrival** screen shows its details and any operation you can take on. Only operations you can launch now are listed.
- **Five linked operations** with named enemies: Captain Kora Vex (Scrapjaw), Commander Orren Sable (Revenant), Captain Garrick Thorne (Scrapjaw), ORACLE-9 (Seraph) and the alien Cantor (Wraith).
- Persistent campaign save in browser localStorage (key `broadside-campaign-v1`): selected flagship, progress, decisions, hull condition, critical subsystem damage, surviving torpedoes and requisition.
- Mission three can end in a pirate surrender. The fifth operation can be won by surviving **100 seconds** or destroying the bioship.
- **Shipyard** showing your flagship's 3D model side-on, with its seven systems (engines, hull, reactor, broadsides, forward weapon, shields, torpedo bay) as slots tied to their hardpoints and battle condition. Each system has three permanent **upgrades** to buy with requisition (21 in all, 260–450 each); they apply in every campaign battle. Hull overhaul, emergency repairs and torpedo resupply are here too.
- **Officers** screen with each bridge officer's dossier, battle command (key, cooldown, effect) and field reports, plus the enemy commanders identified so far, and **Intel** for campaign clues and branching narrative decisions.
- Completing a mission unlocks the next operation. A mission loss returns you to the sector campaign with a damaged but recoverable flagship rather than deleting the save.

The first five operations remain a **campaign vertical slice**, not a finished grand-strategy game. Operation 1 offers a choice between protecting the civilian MV Peregrine until it jumps or destroying the pirate first; Operation 2 includes a two-hostile encounter with coordinated flanking attacks. Every operation has a distinct generated 3D battle environment and themed nebula lighting. Named officer combat abilities (keys 5–9), cycling hostile targets (J), and multiple-contact tactical plots are playable. Full WebGL campaign QA and tuning are still required. `campaign.html` supplies the strategic UI while `index.html?campaign=N` launches the tactical encounters.

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
| H | Hold / resume MV Peregrine (Operation 1; also available as an on-screen button) |
| 5 / 6 / 7 / 8 / 9 | Bridge officer abilities (campaign battles) |
| Drag / wheel | Orbit / zoom the camera · C looks toward the enemy |
| Tab | Enlarged tactical plot |
| G | Cycle graphics quality · P pause · M sound effects on/off · N music on/off |

## Fleet encounter regression tests

Run `node tests/fleet-controller.test.js`, `node tests/environment.test.js` and `node tests/upgrades.test.js` from the repository root. This tests escort success/failure and two-enemy target cycling and completion, without requiring WebGL. The named enemy commanders have four distinct original SVG illustrations in `img/commanders/`, while ORACLE-9 uses the original portrait atlas. The SVG art is illustrated, not photorealistic.

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
index.html      the whole game (three.js 0.169 from jsDelivr via an import map)
img/            title screen art
music/          title and battle music (.mp3, looped)
voice/          spoken bridge alerts (.mp3)
models/         ship models (.glb, meshopt-compressed, textures as WebP)
sfx/            sound effects (.mp3)
vercel.json     cache headers for art, models, music and sounds
```

## Deploying to Vercel

Import the repository in Vercel and keep the defaults: framework preset **Other**, no build command, output directory the repository root. Every push to `main` redeploys.

## Assets

- Ship models were generated with Tripo (Revenant reuses the Warden hull with a darker tint), then simplified to about 65k triangles each and compressed for the web (meshopt geometry, 1024 px WebP textures) with glTF Transform.
- Spoken alerts were generated with ElevenLabs (voice: Philippa). To add a line, put its .mp3 in `voice/` and add its name to `VOICE_LINES` in `index.html`; the game already asks for these lines at the right moments: `enemy-shields-down`, `hull-critical`, `torpedoes-inbound`, `mines-detected`, `torpedo-away`, `afterburners`, `brace`, `battle-stations`, `enemy-destroyed`, `ship-lost`.
- The title screen art and both music tracks ("Weightless Descent" on the title screen, "Untitled" in battle) were supplied by the project owner. The music was re-encoded at 128 kbps.
- Every weapon's sound comes from the supplied pack, pitched differently per weapon. Sound effects come from a sci-fi weapon sound pack supplied by the project owner. The original file names credit universfield, rescopicsound, magiazzz, soundreality and freesound_community; check those creators' licence terms before publishing the game widely.


### Bridge officer commands (campaign)

During story battles only, open the bridge deck to activate five named officer abilities with mouse or keys **5–9**: Brace (restore directional shields), Target Solution (+12% outgoing damage for 14 seconds), Damage Control (repair the worst subsystem and suppress one fire), Evasive Pattern (reduce incoming damage for 12 seconds), or Threat Scan (reveal enemy weaknesses). Cooldowns and transmissions are displayed in combat. The campaign map offers portrait dossiers and commander-to-commander mission briefings.

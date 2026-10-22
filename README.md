# Broadside

A tactical capital-ship duel that runs in the browser. Pick one of four ships under **Select ship** on the title screen. An AI captain flies one of the other three, or one of four hostile ships you can only meet in battle.

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
| Drag / wheel | Orbit / zoom the camera · C looks toward the enemy |
| Tab | Enlarged tactical plot |
| G | Cycle graphics quality · P pause · M sound effects on/off · N music on/off |

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
models/         ship models (.glb, meshopt-compressed, textures as WebP)
sfx/            sound effects (.mp3)
vercel.json     cache headers for art, models, music and sounds
```

## Deploying to Vercel

Import the repository in Vercel and keep the defaults: framework preset **Other**, no build command, output directory the repository root. Every push to `main` redeploys.

## Assets

- Ship models were generated with Tripo (Revenant reuses the Warden hull with a darker tint), then simplified to about 65k triangles each and compressed for the web (meshopt geometry, 1024 px WebP textures) with glTF Transform.
- The title screen art and both music tracks ("Weightless Descent" on the title screen, "Untitled" in battle) were supplied by the project owner. The music was re-encoded at 128 kbps.
- Every weapon's sound comes from the supplied pack, pitched differently per weapon. Sound effects come from a sci-fi weapon sound pack supplied by the project owner. The original file names credit universfield, rescopicsound, magiazzz, soundreality and freesound_community; check those creators' licence terms before publishing the game widely.

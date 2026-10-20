# Broadside

A tactical capital-ship duel that runs in the browser. You command one of two ships against an AI captain flying the other:

- **Bastion** – a slow, wide heavy battleship with six-turret broadsides on each beam, dorsal turrets and thick shields.
- **Halberd** – a narrow, quicker lance cruiser built around a spinal lance that only fires dead ahead.

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
| Arrow keys | Reinforce the fore, aft, port or starboard shield (same arrow again balances) |
| 1 / 2 / 3 | Move reactor power to engines / shields / weapons · 4 splits evenly |
| Q / E | Fire port / starboard battery |
| Space | Spinal lance (Halberd) or dorsal turrets (Bastion) |
| T | Torpedo |
| B | Batteries free: guns fire automatically when loaded and in arc |
| Drag / wheel | Orbit / zoom the camera · C looks toward the enemy |
| Tab | Enlarged tactical plot |
| G | Cycle graphics quality · P pause · M mute |

## Performance

The menu has Low / Medium / High graphics, an optional frame-rate meter, and an option to lower the render resolution automatically when frames run long. The main costs are kept down by:

- baking the nebula and planet into a cube map once instead of shading them every frame;
- capping render resolution per preset and blurring the glow at screen-pixel resolution;
- drawing all shells as three instanced batches;
- updating and uploading only the live part of the particle buffers;
- redrawing the tactical plot and HUD panels about 12 times a second, writing to the page only when a value changes;
- compiling every shader before the battle starts, and avoiding per-frame allocations in the hot paths.

## Project layout

```
index.html      the whole game (three.js 0.169 from jsDelivr via an import map)
models/         ship models (.glb, meshopt-compressed, textures as WebP)
sfx/            sound effects (.mp3)
vercel.json     cache headers for models and sounds
```

## Deploying to Vercel

Import the repository in Vercel and keep the defaults: framework preset **Other**, no build command, output directory the repository root. Every push to `main` redeploys.

## Assets

- Ship models were generated with Tripo, then simplified to about 65k triangles each and compressed for the web.
- Sound effects come from a sci-fi weapon sound pack supplied by the project owner. The original file names credit universfield, rescopicsound, magiazzz, soundreality and freesound_community; check those creators' licence terms before publishing the game widely.

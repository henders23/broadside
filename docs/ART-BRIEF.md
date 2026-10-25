# Art, voice and models still to make

Still needed: thirteen voice clips for Fleet Admiral Harlan, and one ship model (the Bloom-Mother). The portraits and the other seven models below are in the game; their prompts are kept for reference.

**25 October 2026 status:** all eight named characters now display distinct **photorealistic generated portraits**, cropped from `img/commanders/photoreal-atlas.webp` (4 × 2; 96 × 120 pixels per tile), through `crew/personnel.js` and `crew/personnel.css`. Earlier 768 × 960-viewBox SVG concept portraits remain as fallbacks in `img/commanders/<id>.svg`. High-resolution per-character WebP masters were generated but are not in GitHub; the current atlas is optimised for the small in-game UI. Harlan's 13 MP3 recordings and dedicated station/transport GLB models remain outstanding.

- **Voice** is picked up automatically once the files exist: each clip plays when its transmission opens (and stops when it closes). Until then Harlan's transmissions are text only.
- **Ship models** need a small code change each when they arrive (file, length and proportions in `crew/ships.js`; `refit()` fits the hit and shield ellipsoids and the gun and engine mounts).

## Portraits

For a future high-resolution per-character replacement pass, save each image as WebP, 768 × 960 (4:5), in `img/commanders/` with the file name given. Replace the atlas mapping in `crew/personnel.js` and `crew/personnel.css` with individual WebP sources when approved. They should match the existing painted portraits (`vex.webp`, `thorne.webp`, `img/admiral-harlan.webp`): photorealistic, cinematic, chest-up, on a dark starship set, with black Navy uniforms and gold shoulder boards for Navy officers.

| File | Character | Prompt |
| --- | --- | --- |
| `adeyemi.webp` | Lt. Yusuf Adeyemi, First Officer (recruit, Meridian) | A Black man in his late forties, a seasoned naval starship first officer: close-cropped greying hair, short beard, calm steady gaze, a faint burn scar on his jaw. Black high-collared naval uniform with gold shoulder boards. Dark starship bridge, blurred blue holographic screens, a planet through a viewport. |
| `fenn.webp` | Lt. Dario Fenn, Tactical Officer (recruit, Peregrine) | A wiry Mediterranean man in his thirties, a former merchant-marine gunner: dark curly hair, stubble, sharp confident half-smile, scar through one eyebrow. Black naval jacket open over a weathered grey flight undershirt, a battered gunnery headset round his neck. Dark bridge, blurred blue targeting displays. |
| `osei.webp` | Chief Ama Osei, Chief Engineer (recruit, Tarn) | A Ghanaian woman in her fifties, a veteran starship chief engineer: short grey-streaked natural hair, amused knowing look, a smudge of grease on one cheek. Dark engineering coveralls with a gold rating badge, a tool harness. Engine room with warm orange reactor glow. |
| `marlow.webp` | Ensign Kit Marlow, Helm Officer (recruit, Juniper) | A young pilot in their early twenties with an androgynous look: short choppy auburn hair, freckles, bright restless eyes, a cocky grin. Black naval uniform with ensign insignia over a worn flight-jacket collar, a small racing patch. Dark bridge, navigation displays, stars through a viewport. |
| `achterberg.webp` | Lt. Soren Achterberg, Intelligence Officer (recruit, Elysia) | A tall pale Dutch man in his forties, a signals scientist: thin wire-framed glasses, fair hair thinning at the temples, thoughtful intense expression. Black naval uniform with lieutenant shoulder boards, a slim earpiece. Dark bridge, green and blue signal waveforms on screens. |
| `halloran.webp` | Commodore Ingrid Halloran, Ash Fleet (Act I finale) | A Scandinavian woman in her late fifties, a renegade former navy commodore: silver hair pulled back severely, piercing pale eyes, a hard proud face lined with grief and resolve. Scorched charcoal commodore's greatcoat, old insignia scratched off, an ash-grey and crimson armband. Warship bridge under red alert, a burning debris field outside. |
| `vigil.webp` | The VIGIL Array, Directorate pickets (Operation 6) | The "face" of a machine intelligence: two identical sleek dark-metal heads side by side, faceless visors joined by one shared line of pale blue light, fine engraved circuitry. A dark data-relay chamber with blue light columns. |
| `choir.webp` | The Choir, Wraith brood (Operation 7) | An alien collective: three translucent organic forms grown together like coral and orchid, ridged membranes with bioluminescent green veins, a suggestion of eyeless faces in the folds. The living interior of a bioship, green spore haze. |

## Harlan's voice

One MP3 per transmission in `voice/`, with the file names below. The voice should be an older British or mid-Atlantic man: measured, weary and authoritative, warm underneath. Speak each line as written. In the Act I briefing, `[ship name]` is the player's ship; record it as "your ship" or leave the phrase out. The source text is `NARRATIVE` and `ACTS[].briefing` in `crew/campaign-data.js`.

| File | When it plays | Line |
| --- | --- | --- |
| `harlan-act1.mp3` | Act I briefing: The Long Watch | Captain, For fourteen years the Shattered Reach has been quiet. That quiet is over. Three merchant ships have vanished on the Kestrel lanes in six days, and the last signal out of Kestrel was not a distress call. It was a warning. Command calls it piracy. I am not convinced. Corsairs do not fly with Navy transponders, and they do not vanish without wreckage. Someone is arming them, and someone wants this frontier empty. You will take [ship name] out of Meridian and answer that warning. Find out who sent it, and who is acting on it. She is the only capital ship I can spare, so bring her home. Every plate of hull you lose comes out of the fleet’s requisition, and the frontier cannot afford to lose you. |
| `harlan-act2.mp3` | Act II briefing: The Machine Signal | Captain, Halloran is dead, and the Ash Fleet with her. Before the Pyre went down she told you why she did it: eleven years ago a machine signal out of the Halcyon Belt warned her what was coming to the Reach. Command buried the report. She took the fleet and set about emptying the frontier the only way she could. The Kestrel warning was that same signal. It repeats every eleven minutes, and every repetition answers a question we have not yet asked. The colonies at Midway have stopped talking to anyone. Find the source, captain. I want to know what it saw, and why it never said so plainly. |
| `harlan-act3.mp3` | Act III briefing: The Wraith | Captain, The machines were never the enemy. They were the alarm. Halloran heard it eleven years ago, and she and the Directorate each tried to empty the Reach before something else arrived: she by terror, they by silence. We fought them both, and we were wrong about why. That something is here. Harrow has gone silent, and our probes are coming back coated in living tissue. The Directorate called it the Wraith, and its projections for the Reach are not survivable. So we do what they tried to do, and we do it properly. Look this thing in the eye, get our people out of its way, and then find where it grows and burn it. |
| `harlan-1.mp3` | After Operation 01 (Distress at Kestrel) | Pirates who do not take cargo are not pirates. Somebody is paying them to empty the Kestrel lanes, and I want to know who. |
| `harlan-2.mp3` | After Operation 02 (The Cinder Wake) | The Ash Fleet. Halloran’s people. I signed her death certificate myself, eleven years ago. If she is alive, she has had a long time to plan. |
| `harlan-3.mp3` | After Operation 03 (The Widow’s Toll) | Halloran is at Grimhold. Whatever she thinks is coming, she is killing people to keep them out of its way. End it, captain. |
| `harlan-8.mp3` | After the Act I finale (The Pyre at Grimhold) | She was right about one thing. There is a signal in the Halcyon Belt, and it has been talking for eleven years. It was the Kestrel warning. I want to know what it is saying. |
| `harlan-4.mp3` | After Operation 04 (Ghost Frequency) | It is a casualty projection, captain. Ours. The machines have been counting our dead before we die. What you do with the archive is your call. |
| `harlan-6.mp3` | After Operation 06 (The Quiet Relay) | It is not hiding any more. It is coming out to stop us, and it thinks it is protecting someone. So do I. |
| `harlan-9.mp3` | After the Act II finale (The Arbiter) | We killed the only thing in the Reach that saw this coming. Then we had better be as good as it feared we were not. Harrow, captain. |
| `harlan-5.mp3` | After Operation 05 (The First Bloom) | Every colony from Nex to Mire evacuates. Today. Halloran tried to do this with fear and the machines with silence. We do it with ships. |
| `harlan-7.mp3` | After Operation 07 (Exodus at Nex) | The brood is coming from Verdant. Burn it out, captain, and the Reach is ours again. |
| `harlan-end.mp3` | The ending, first paragraph | Captain, eleven years ago a machine at Halcyon told Ingrid Halloran what was coming to the Reach, and nobody listened. You listened. The Bloom-Mother is dead in the sky over Verdant and the brood is dying with her. |

The ending's later paragraphs change with the player's decisions and the state of the war, so only its opening paragraph is recorded.

## Ship and station models

**Status.** In the game: the Revenant, Sentinel, Pyre, Arbiter, Thrall, civilian transport and defence station. **Still needed: the Bloom-Mother** (prompt 5), which is the Wraith scaled up for now. Spare models from the same set, not yet used, could become new hulls later: a white swept-wing cruiser, a black and chrome clawed ship, a white armoured cruiser, a long dark warship and a crescent-shaped dreadnought (the last two carry a planet that would need cutting away).

Today several ships reuse another hull's model with a tint and a scale, and two of them borrow the player's own ships:

| Ship | Uses now | Seen in |
| --- | --- | --- |
| Revenant (Ash Fleet minelayer) | the player's Warden, tinted red | every Ash Fleet fight in Acts I and II |
| Sentinel (Directorate lance frigate) | the player's Halberd, tinted silver | Act II machine work, the Arbiter fight |
| Pyre (Act I boss) | the Warden, scaled up | the Act I finale |
| Arbiter (Act II boss) | the Seraph, scaled up | the Act II finale |
| Bloom-Mother (Act III boss) | the Wraith, scaled up | the Act III finale |
| Thrall (Wraith swarmer) | the Wraith, scaled down | Act III, in packs |
| Civilian transport | a box shape built in code | every escort and convoy run |
| Defence station | a Warden that cannot move | station defences |

The list below is in priority order. The Revenant and the Sentinel matter most, because enemies that look like the player's own ships are confusing. The transport and station come next, because they appear in so many missions.

**Delivery.** GLB, one object per file, saved in `models/` as the file name given. Each one is simplified to about 65k triangles and compressed (meshopt geometry, 1024 px WebP textures) with glTF Transform, like the existing six. Keep the bow at one end of the long axis. Sizes are game units; only the proportions matter.

**Start every prompt with this**, so the models match the existing ships:

> Game-ready hard sci-fi space warship, single object, no base, no stand, no background, no people. Side-to-side symmetrical, long axis horizontal, bow clearly distinct from stern. Weathered, battle-worn plating with panel lines, PBR textures. Grounded "naval capital ship in space" style, not cartoon.

### 1. Revenant: Ash Fleet minelayer · `revenant.glb`

About 310 long × 72 wide × 64 high (a heavy cruiser). In battle: missile racks forward, flak broadsides, mines dropped astern.

> A renegade navy warship refitted for minelaying. A thick, squat, armoured hull with a high armoured citadel just aft of midships. Two banks of stubby missile racks on the dorsal spine, forward and midships. Four flak turrets along each flank. A wide, flat stern with two large open mine-laying chutes and three big engine bells. The paint is scorched charcoal grey with dull rust-red stripes, the old navy insignia scraped off, and patched armour plates. It looks like a proud navy ship that went rogue and has been repaired with salvage.

### 2. Sentinel: Directorate lance frigate · `sentinel.glb`

About 260 × 60 × 56 (slim and long). In battle: a long-range spinal lance that fires dead ahead, light beam broadsides, no torpedoes.

> An unmanned machine warship, no windows or bridge. A long, narrow, needle-like hull built around a spinal lance cannon that runs the whole length and ends in a glowing aperture at the bow. Thin, angular fins near the stern. Small beam emitters in rows along both flanks. Pale white-silver ceramic plating with fine engraved circuitry, and cold blue light seams along the spine. Clinical, alien and precise, like a sniper rifle shaped into a ship.

### 3. Pyre: Ash Fleet dreadnought flagship · `pyre.glb`

About 430 × 100 × 90 (the biggest ship in Act I). In battle: twin siege cannons in the bow, missiles, flak broadsides, mines, an inferno missile salvo.

> A massive renegade dreadnought, the flagship of a rebel fleet. A fortress-like hull with stepped armour decks and a tall command tower. Twin heavy siege cannons in a long armoured bow casemate. Missile batteries on the dorsal spine, rows of flak turrets on both flanks, and mine chutes at the stern. Charcoal and soot-black plating with ember-red glowing vents and battle damage, and an ash-grey and crimson banner painted on the hull. It should look ancient, brutal and defiant.

### 4. Arbiter: Directorate core warship · `arbiter.glb`

About 420 × 230 × 60 (wide and flat). In battle: beam arrays, a railgun, a spinal Judgement lance, a shield lattice held up by node ships.

> The flagship of a machine intelligence. A broad, flat, wing-like hull, like a manta ray made of white ceramic and dark glass, with a glowing blue core visible through a recess in the centre. A long spinal lance runs along the centreline to a bow emitter. Beam arrays line the leading edges of both wings, and a railgun sits along the dorsal ridge. Smooth, seamless, no windows. Pale silver-white with deep blue light lines. Calm, cold and vast.

### 5. Bloom-Mother: Wraith brood-mother · `mother.glb`

About 400 × 250 × 80. In battle: plasma, spore swarms, a spore storm, a hull that regrows.

> A colossal living alien bioship. An organic, ribbed body like a cross between a manta ray, a jellyfish and a coral reef, covered in swollen spore sacs and brood pods. Bioluminescent green veins run through translucent membranes, with drooping tendrils at the stern. No metal, no straight lines, and no symmetry beyond a rough left-right balance. Dark olive and bone-white with glowing green. It should feel like the mother of a swarm.

### 6. Thrall: Wraith swarmer · `thrall.glb`

About 130 × 80 × 25 (small and fast). In battle: rams, short-range plasma, hunts in packs of three or four.

> A small, fast alien bioship, a predator that hunts in packs. A sleek, arrowhead-shaped organic body with a hard, beak-like ramming prow, swept-back fins and a single glowing green plasma organ under the chin. Ridged chitin shell, mottled olive and pale yellow, with green bioluminescent spots. It should read clearly as a younger, smaller relative of a larger alien bioship.

### 7. Civilian transport · `transport.glb`

About 220 × 60 × 50. In battle: unarmed, flies straight for the jump beacon.

> An unarmed civilian cargo and passenger transport. A boxy, utilitarian hull carrying a long row of standard cargo containers along a central spine, with a small habitation and bridge module at the bow and large lit windows. Two big engines at the stern, with navigation lights and a hazard-striped docking collar. Faded white and orange merchant paint, a registry number on the side, dents and grime. Clearly not a warship.

### 8. Defence station · `station.glb`

About 300 wide × 300 deep × 120 high. In battle: stationary, with turrets that fight beside the player.

> A small military outpost in space: a listening post and picket station. A central hub with a tall antenna and sensor mast, a ring or cross of four habitation arms, docking ports, and a handful of turret emplacements on the arms. Solar panel wings, with radar dishes and lit windows. Navy dark grey with gold trim and running lights. Stationary and sturdy, with no engines.

Wing-shaped hulls (the Arbiter and the Bloom-Mother) may come out narrower than asked; the shield bubble is fitted to whatever arrives. For the station, drop the opening line's "space warship" and "bow clearly distinct from stern".

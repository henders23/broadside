# The Shattered Reach — campaign implementation and design brief

Updated: 23 October 2026.

## Identity and playable scope

**Broadside** is a game about captaining a warship. The player directly manages one vessel's heading, throttle, firing arcs, directional shields, reactor allocation, torpedoes, subsystems and tactical decisions. The campaign adds persistent consequences and a cast of officers, but does not turn the game into a direct-control fleet strategy game.

The prototype currently has five consecutive story engagements. **Status matters:** missions 1–5 launch in the browser today; mission 3's surrender trigger and mission 5's timed extraction are implemented; escort protection and the first two-enemy engagement are now implemented; surrender negotiations beyond the fixed trigger and more varied operation types are not yet implemented.

## Map and world

- Six visual regions: Meridian Core, Kestrel Verge, Red Narrows, Ash Marches, Halcyon Belt and Harrow Expanse.
- 33 selectable, individually named systems, with stored 2D canvas coordinates relative to the original 1672 × 941 pixel illustration.
- Navigation routes form a connected graph. Selecting a star shows its name, description, control and threat, and draws the shortest jump path from the flagship. Hovering (or focusing) a system shows **Set course**; choosing it moves the flagship there at once (`state.system`) and opens the **system arrival** screen with the system's details, onward lanes and any operation that can be launched there.
- Only operations that can be launched now are listed under the map and marked on it; locked and completed operations are not shown.
- Art: the map is drawn in code on a 1600 × 900 stage (canvas star field, CSS nebulae, SVG lanes) that scales to the window and scrolls at narrow widths. Faint faction borders are clipped Voronoi cells around each system, drawn only where one region meets another or open space. `img/campaign-atlas.webp` is no longer displayed; its coordinate space is still the source for system positions.
- Planned: ownership changes, event-driven invasion, animated rival ship icons, fog of war, discovered star systems and cinematic transitions.

### Shipyard

- The shipyard shows the flagship's own GLB model side-on (orthographic camera from starboard, bow to the right) using the same three.js build, scale and rotation as the battle engine.
- Seven slots (engines, hull and armour, reactor, broadsides, the class's forward weapon, shields, torpedo bay) are joined by leader lines to hardpoints projected from the model every frame. Gun, torpedo-tube and engine positions come from `CLASSES` in `index.html`; reactor, hull and shield markers are placed from the hull and shield ellipsoids. The `HULLS` table in `campaign.html` copies those stats and positions, so keep it in step with `CLASSES`.
- Slot condition comes from the saved hull fraction and per-subsystem health (`state.sub`).
- Hull overhaul, emergency repairs and torpedo resupply are live. Each slot lists three planned upgrades, shown as "in development"; there is no upgrade purchase or battle effect yet.
- If WebGL or the three.js CDN is unavailable the slots and services still work, and the ship area shows a short notice.

## Core loop

1. Inspect reachable systems and review mission intelligence.
2. Open an operation briefing and select the flagship.
3. Fight using the existing 3D capital-ship combat engine.
4. Record the result and persistent ship hull, subsystems and ordnance.
5. Choose the post-mission decision and receive requisition.
6. Repair/refit at the shipyard and deploy to the next operation.

Skirmish mode still launches from the original title screen and remains independent of campaign state.

## Opening operations

| # | System | Enemy captain | Enemy hull | Win condition | Reward |
| --- | --- | --- | --- | --- | --- |
| 1 | Kestrel | Captain Kora Vex | Scrapjaw pirate ram | Defeat pirate and preserve the unarmed MV Peregrine | 420 requisition |
| 2 | Cinder Wake | Commander Orren Sable | Revenant + Scrapjaw pursuer | Destroy both hostile warships | 540 requisition |
| 3 | Red Narrows | Captain Garrick Thorne | Scrapjaw pirate ram | Reduce enemy hull to <=28% for surrender, or destroy | 570 requisition |
| 4 | Halcyon | ORACLE-9 | Seraph beam frigate | Destroy machine frigate | 700 requisition |
| 5 | Harrow | The Cantor | Wraith bioship | Survive for 100 seconds, or defeat bioship | 900 requisition |

Post-battle choices set named flags for future narrative use; they currently do not produce subsequent enemy reactions. Story progress is sequential and is saved locally. Campaign failure returns the player to the strategic map with a recovery cost and damaged hull; it is not permanent death.

## Ship and economy

- Campaign saves use localStorage key `broadside-campaign-v1` and a `version: 1` schema.
- Save fields include: `ship`, `shipName`, `system`, `completed`, `flags`, `credits`, `hull`, `sub`, `torps`, `attempts`, and `pendingResult`.
- Torpedo capacity depends on hull class: Bastion 8, Halberd 6, Sabre 6, Warden 16.
- Full-hull overhaul costs 6 requisition per lost hull percentage point, rounded up. Emergency repairs cost 100 requisition for up to 15% hull. Torpedoes can be restocked at 25 requisition each.
- Ship damage and remaining ordnance persist after victory; success or failure results enter a pending after-action state, shown when the player returns to the map.

## Officers

Five named senior officers appear in an interactive personnel dossier:

- Commander Elise Varro — First officer and crisis coordination.
- Lt. Commander Imani Okoye — Tactical officer and target assessment.
- Chief Tomas Vale — Chief engineer and reactor/damage control.
- Lieutenant Nara Sato — Helm officer and evasive manoeuvring.
- Ensign Idris Renn — Intelligence officer and signals analysis.

These officers now have active battle commands (5–9): Varro shields, Okoye target solution, Vale damage control, Sato evasive patterns and Renn enemy scans. Each has a cooldown, bridge transmission and mission briefing introduction. **Dedicated command portrait atlas, command ability controller, and campaign battle commands are implemented. The four previously classified enemy commanders now have individually drawn SVG portraits (Vex, Sable, Thorne, Cantor); these are illustrated rather than photorealistic.** Future work should replace illustrated enemy portraits with cohesive photorealistic art, add recorded officer VO, and test combat balance across all ship classes.

## Architecture

- `index.html`: Three.js renderer and the original battle engine; a new `?campaign=1` ... `?campaign=5` query launches preselected enemies and applies ship state. It writes the pending battle result and returns to `campaign.html` after the result screen.
- `campaign.html`: Strategic map, route graph, accessible star hotspots, mission briefings, officer dossiers, shipyard, state persistence, after-action choices and return to skirmish.
- `img/campaign-atlas.webp`: The original concept image. No longer displayed; system coordinates are still stored in its 1672 × 941 space.

The original monolithic game script still contains direct player/enemy assumptions. The first fleet extension now permits multiple vessels, retargeting, fleet HUD markers, collision-pair processing and per-mission survival conditions. Remaining code still contains duel-era assumptions; **extend incrementally** and test targeting, projectile collision, AI behaviour and victory conditions before adding larger fleets.

## Technical QA and limitations

The rebuilt strategic screen was exercised in headless Chromium (SwiftShader WebGL) at 1600×900, 1280×720 and 390×844: 33 systems, faction borders and 53 lanes drawn; hover set course, the jump saved to `state.system`, the arrival screen with and without an operation, the briefing, the shipyard's 3D view for Bastion and Warden with slot selection, overhaul and torpedo resupply costs, and an after-action report unlocking the next operation, with no page errors. Earlier tests covered officer dossiers, changing the flagship, sequential mission unlocking, post-battle choices, post-battle changes in requisition and ordnance resupply. All UI tests completed without JavaScript page errors. **These were simulated mission-result tests, not full browser playthroughs of the WebGL battle engine.** The true battle-to-save-to-map integration and combat balance still need direct playtesting on the deployed game, especially the 100-second Wraith survival operation.

## Recommended next milestones

1. **Battle QA and balancing** — Play every operation on all four hulls. Confirm damage persistence, loss recovery, mission 3's surrender, mission 5's extraction, torpedo scarcity and navigation.
2. **Officer portraits and command bridge** — Initial playable stage complete: five individual portraits drawn from one compressed atlas, officer dossiers, briefing reactions, keyboard/button commands and cooldowns. Next: photorealistic portrait replacement and recorded bridge VO; dialogue is still on-screen text.
3. **Real alternate objectives** — Protect a moving transport, disable an enemy without killing, defend a relay, reach an extraction point. Introduce reusable objective/event logic rather than per-mission conditionals.
4. **Multiple ships** — Refactor target selection, AI, collision, munition pools and health state to support escorts and fleet elements without breaking the duel.
5. **Dynamic galaxy** — Add ownership changes, faction movement, reputation, intel unlocks, optional operations and consequences that affect the next mission.
6. **Art pass** — The map is now natively rendered. Next: dedicated cinematic world/commander artwork, an arrival transition, and the purchasable upgrade system the shipyard slots are laid out for.

Every milestone should preserve the intentional slow, dangerous, naval feel of Broadside.


## Officer command implementation (October 2026)

- Keys **5–9** or the on-screen bridge deck activate abilities during campaign operations only. Skirmish balance is unchanged.
- Varro — Brace: instantly restores 16% of the ship class's baseline shield value to each bank, capped by the current bank capacity; cooldown 100s.
- Okoye — Target Solution: +12% damage from the player for 14s; cooldown 110s.
- Vale — Damage Control: +24 subsystem integrity to the most damaged subsystem and extinguishes one fire; cooldown 125s; refuses to expend when nothing needs repair.
- Sato — Evasive Pattern: -22% incoming enemy damage for 12s; cooldown 105s.
- Renn — Threat Scan: reports the enemy's weakest shield facing and least intact subsystem; cooldown 80s.
- All ability cooldowns are **battle-local**, reset at mission deployment, and do not alter campaign save format.
- `crew/personnel.js` holds character descriptions, mission lines, commander identities, and portrait positions. `crew/bridge-controller.js` is decoupled from Three.js and takes battle objects via dependency injection.
- `img/command-portraits.webp` is a compressed six-frame portrait atlas containing five Meridian officer portraits plus ORACLE-9's armoured synthetic portrait. Vex, Sable, Thorne and the Wraith Cantor now use individually designed SVG illustrations in `img/commanders/`; these assets are not yet photorealistic.
- Automated testing covered the five command effects/cooldowns and the personnel and briefing UI, but **full live WebGL combat playthroughs remain unverified**.


## Fleet and mission objective expansion — 23 October 2026

- `crew/fleet-controller.js` implements mission-scoped protected and hostile ship objectives, status messages, target cycling, and victory/failure gates, while retaining skirmish mode.
- In operation 1, the MV Peregrine has a distinctive procedural civilian freighter mesh with Sabre-derived flight and collision physics, and has no functional weapons. Either keep it alive until it crosses the jump-gate plane or destroy Vex first. H (or the HUD button) holds/resumes the convoy. Losing the transport fails the operation.
- In operation 2, a weakened Scrapjaw pursuer flanks the Revenant minelayer from the opposite side, rather than merely copying its heading; both must be destroyed. The player may select a hostile contact with `J`, and the target HUD and officer scan follow the selected vessel.
- The tactical plot now renders every active ship, including secondary opponents and friendly civilian craft. Ship collisions evaluate ship pairs; shell, torpedo and mine collision systems already iterate over every ship.
- Four illustrated SVG enemy portraits are stored at `img/commanders/{vex,sable,thorne,cantor}.svg` and displayed in mission briefings and incoming hails. ORACLE-9 continues to use the sixth slot of the existing atlas.
- Automated controller scenarios checked both win and loss conditions, target cycling and single-enemy compatibility. Syntax was checked for the browser scripts, but full interactive/WebGL battles have **not** been played through in this environment.
- **Remaining limitations:** a Sabre is a visual stand-in for a civilian hull; direct collision and targeting behaviour require playtesting; balance of protecting the convoy against Kora's aggressive AI is unverified; the map artwork still includes baked labels; and alternate mission objectives are currently restricted to these bespoke scenarios.


## Distinct battlefields and expanded escort choices (23 October 2026)

- `crew/battle-environments.js` constructs deterministic mission-specific background scenery and nebula colour schemes: Kestrel jump gate and trade station, Cinder Wake wreckage field, Red Narrows fractured pylons, Halcyon relay arrays, Harrow organic spires. Decorative assets are non-colliding; Three.js geometries and materials are disposed when changing mission, returning to title, or entering skirmish.
- The escort ship now visibly resembles a modular cargo freighter, not a warship. Its movement/collision model is still inherited from the Sabre and will need an authored transport hull for final production.
- The civilian escort has **two victory paths**: (a) protect it to its extraction waypoint, or (b) destroy the pirate attacker first. The captain can order HOLD/RESUME with H or a visible HUD button. Objective progress and the extraction beacon are visible on tactical instruments.
- Vex retargets to defend herself when the player intercepts her closely, permitting a tactical diversion. Cinder Wake's minelayer/pursuer now attempt a pincer rather than stacking in a single pursuit line.
- Officer tactical bonuses now apply across all enemy contacts, not only the originally designated opponent.
- Automated fleet-state regression, procedural environment lifecycle tests, and static JavaScript syntax checks run through GitHub Actions. Full GPU/WebGL playthroughs, final art acceptance and comprehensive difficulty balancing remain unverified.

# The Shattered Reach — campaign implementation and design brief

Updated: 24 October 2026.

## Identity and playable scope

**Broadside** is a game about captaining a warship. The player directly manages one vessel's heading, throttle, firing arcs, directional shields, reactor allocation, torpedoes, subsystems and tactical decisions. The campaign adds persistent consequences and a cast of officers, but does not turn the game into a direct-control fleet strategy game.

The campaign is being built out into a three-act grand campaign in four milestones. **Milestone 1 is in:** three acts, seven story operations, five starbases with mission boards (hand-written station missions and generated contracts), repairs and refits only at starbases, interceptions in hostile space, and one data-driven encounter system behind every battle. Still to come: a fleet of up to three ships with escort orders (milestone 2), a boss battle at the end of each act (milestone 3), and reputation, captured hulls, recruitable officers, a codex, save slots and difficulty (milestone 4).

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
- Hull overhaul, emergency repairs and torpedo resupply are live.
- Each slot sells three permanent upgrades (21 in all, 260–450 requisition, with a confirmation step). Bought ids are saved in `state.upgrades`; a new campaign clears them. Slot specs show the upgraded figures.
- `crew/upgrades.js` is the single source for the catalogue, prices and effects. `apply(class, upgrades)` returns an upgraded copy of a ship class; the campaign uses it for the shipyard's figures and `index.html` uses it to build the player's flagship in campaign battles (skirmish and enemies are unaffected). Most effects are stat multipliers on the class or its weapon groups (broadsides by `sub` port/stbd, the `fore` weapon, the torpedo group). Five need battle hooks, each a no-op without the upgrade: `abBurn` (afterburner seconds), `armour` (hull damage multiplier), `repairRate` (subsystem repair speed), `power` (reactor pips) and the `reactorHardened`/`shieldHardened` flags (halve the damage penalty). `tests/upgrades.test.js` covers the rules.
- Prices and effect sizes are first-pass values, chosen so a campaign's rewards (3,130 requisition plus the starting 850) buy roughly a third of the catalogue alongside repairs. They need playtesting.
- If WebGL or the three.js CDN is unavailable the slots and services still work, and the ship area shows a short notice.

## Act briefings

- Each act opens with a full-screen briefing from Fleet Admiral Gideon Harlan, Commander of the Frontier Fleet, with his portrait (`img/admiral-harlan.webp`): **Act I · The Long Watch**, **Act II · The Machine Signal** and **Act III · The Wraith**. The text and three standing orders per act live in `ACTS` in `crew/campaign-data.js`.
- A briefing shows once, when its act begins (`state.actBriefed` records the highest act briefed; older saves that had seen the Act I briefing count as briefed). Intel replays the current act's briefing. Take command or Escape closes it.
- Finishing the last story operation of Act III shows a closing message from Harlan; the starbases keep posting work afterwards.

## Core loop

1. Jump across the Reach. Jumps are free, but hostile space can spring an interception.
2. Dock at a starbase to take station missions and contracts, repair, rearm and fit upgrades.
3. Fly to a story operation or an accepted order and launch it from the system's arrival screen.
4. Fight using the 3D capital-ship combat engine; hull, subsystems and ordnance carry over.
5. Collect requisition, officer experience and (for story operations) make the aftermath decision.
6. Finish an act's story operations to open the next act.

Skirmish mode still launches from the original title screen and remains independent of campaign state.

## Story operations

| Act | # | System | Enemy | Win condition | Reward |
| --- | --- | --- | --- | --- | --- |
| I | 1 | Kestrel | Captain Kora Vex (Scrapjaw) | Escort the MV Peregrine to the beacon, or destroy Vex | 420 |
| I | 2 | Cinder Wake | Commander Orren Sable (Revenant) + Scrapjaw pursuer | Destroy both | 540 |
| I | 3 | Red Narrows | Captain Garrick Thorne (Scrapjaw) | Force surrender below 28% hull, or destroy | 570 |
| II | 4 | Halcyon | ORACLE-9 (Seraph) | Destroy | 700 |
| II | 6 | Midway | VIGIL Array: two Seraph pickets | Destroy both | 760 |
| III | 5 | Harrow | The Cantor (Wraith) | Survive 100 seconds, or destroy | 900 |
| III | 7 | Nex | The Choir (Wraith) + brood vessel | Escort the Long Lantern to the beacon, or destroy both | 980 |

Operations unlock in story order (1, 2, 3, 4, 6, 5, 7); the numbers 1–5 are kept from the original five so older saves stay valid. Post-battle choices set named flags for future narrative use. Campaign failure tows the flagship to the nearest starbase with a recovery cost and damaged hull; it is not permanent death.

## Starbases, station missions and contracts

- Five starbases: **Meridian Fleet Yards** and **Tarn Propulsion Depot** (Navy), **Peregrine Exchange**, **Elysia Research Station** and **Juniper Ringport** (independent). They show as diamonds on the map, and a system's details name its starbase.
- Repairs, torpedo resupply and upgrade fitting work only while docked at a starbase. Elsewhere the shipyard still shows the ship and its upgrades, explains why it cannot work, and names the nearest starbase.
- Arriving at a starbase shows its card with **Mission board** and **Shipyard & repairs**. The board has three columns: the station's hand-written missions, its generated contracts, and the orders already accepted (with Abandon).
- **Station missions** (`SIDE` in `crew/campaign-data.js`): ten hand-written missions, each posted at one starbase from its act onwards, with a named giver, brief, objective and intel. Flying one marks it done (`state.sideDone`).
- **Contracts**: three per starbase (a bounty, a patrol and an escort), generated from a seed of the station and `state.boardCycle`, which goes up after every victory, so each board posts new work after each win. Targets are within three jumps; bounties and patrols go to hostile space (preferring the act's main enemy), escorts to independent or contested space. Enemy strength and pay scale with the target's threat level and the act.
- Up to four orders (station missions plus contracts) can be held at once. Accepted contracts are saved whole in `state.contracts`, accepted station missions by id in `state.orders`. Orders show on the map (blue tags), in the list under the map, and as **Engage** cards on the target system's arrival screen. A lost order stays open to retry.

## Interceptions

- Jumping is free. Every system on the route (not counting the start) that is hostile in the current act rolls for an ambush: 6–30% depending on threat. Act I's hostile factions are pirates and renegades; Act II adds the machines and Act III the Wraith.
- An ambush stops the flagship in that system and cannot be dismissed. **Battle stations** fights one or two ambushers for salvage. **Break away** succeeds with a chance set by the hull (Sabre 80%, Halberd 70%, Bastion 50%, Warden 40%) and engine condition: success costs 3% hull and carries on to the destination; failure costs 6% hull and forces the fight. A pending ambush survives a reload (`state.ambush`).

## Encounters

- Every battle is described by an **encounter spec** built by `encounter()` in `crew/campaign-data.js`: kind (story, side, contract or intercept), label and objective for the HUD, scenery preset, whether to show the jump beacon, the opening hail, the enemy list (class, name, hull and shield scale, AI difficulty) and the goal (`destroy`, `escort` with a convoy name, `survive` for N seconds, or `surrender` below a hull fraction).
- `campaign.html` saves the spec as `state.launch` and opens `index.html?encounter=1`; `index.html?campaign=N` still opens story operation N. The battle page builds the flagship and the first enemy, and `crew/fleet-controller.js` adds the rest of the hostiles (alternating flanks), any convoy, and decides the result. The surrender and survival objectives moved there from hard-coded checks in `index.html`.
- The result is saved as `pendingResult` with the encounter's `kind` and `ref`; the campaign pays out, clears the order and refreshes the boards when the player returns.

## Ship and economy

- Campaign saves use localStorage key `broadside-campaign-v1` and a `version: 1` schema.
- Save fields include: `ship`, `shipName`, `system`, `completed`, `flags`, `credits`, `hull`, `sub`, `torps`, `attempts`, `pendingResult`, `upgrades`, `officers`, `actBriefed`, `boardCycle`, `orders`, `contracts`, `sideDone`, `launch`, `interceptSeed` and `ambush`. Saves from before the grand campaign gain the new fields on load.
- Torpedo capacity depends on hull class: Bastion 8, Halberd 6, Sabre 6, Warden 16.
- Full-hull overhaul costs 6 requisition per lost hull percentage point, rounded up. Emergency repairs cost 100 requisition for up to 15% hull. Torpedoes can be restocked at 25 requisition each.
- Ship damage and remaining ordnance persist after victory; success or failure results enter a pending after-action state, shown when the player returns to the map.

## Officers

Five named senior officers appear on the **Officers** screen (the Officers tab): a list of the bridge crew, and for the selected officer a large portrait, bio, battle command with its key, cooldown and duration, voice line, and the briefing lines they have given for unlocked operations. A **Service record** card shows the officer's rank, XP toward the next rank, engagements and commands given.

**Officer experience** (`crew/experience.js`, tested by `tests/experience.test.js`): after every campaign engagement each officer earns 60 XP for a victory or 30 for a defeat, plus 15 XP for each time their command was used (up to three). The battle page saves the use counts with the result (`pendingResult.officerUses`); the campaign awards XP once when the after-action report opens (stored on the result so a reload cannot repeat it), saves it in `state.officers`, and lists the gains and promotions in the report. Promotions come at 100, 250, 450 and 700 XP (five ranks per track, defined in `TRACKS`). Each promotion makes the officer's command 8% stronger and its cooldown 5% shorter; the bridge controller applies this in battle (Brace shield restore, Target Solution damage bonus, Damage Control repair, Evasive Pattern damage reduction, and every cooldown). Renn's Threat Scan gains only the shorter cooldown. A new campaign returns the crew to their starting ranks. Values are first-pass and need playtesting: with only five operations, officers earn their first promotion after two engagements and reach rank three or four by the end of Act I.

Below, **Known adversaries** shows the enemy commanders of unlocked or completed operations; the rest stay unidentified.

- Elise Varro — First officer and crisis coordination.
- Imani Okoye — Tactical officer and target assessment.
- Tomas Vale — Chief engineer and reactor/damage control.
- Nara Sato — Helm officer and evasive manoeuvring.
- Idris Renn — Intelligence officer and signals analysis.

All five begin the campaign at the bottom of their career track and are promoted with experience (below): Varro, Okoye, Sato and Renn rise from Ensign through Lieutenant, Lt. Commander and Commander to Captain; Vale, an engineer from the enlisted rates, rises from Petty Officer through Chief Petty Officer, Senior Chief and Master Chief to Chief Warrant Officer. Their names show their current rank everywhere in the campaign and on the battle bridge buttons.

These officers now have active battle commands (5–9): Varro shields, Okoye target solution, Vale damage control, Sato evasive patterns and Renn enemy scans. Each has a cooldown, bridge transmission and mission briefing introduction. **Dedicated command portrait atlas, command ability controller, and campaign battle commands are implemented. The four previously classified enemy commanders now have individually drawn SVG portraits (Vex, Sable, Thorne, Cantor); these are illustrated rather than photorealistic.** Future work should replace illustrated enemy portraits with cohesive photorealistic art, add recorded officer VO, and test combat balance across all ship classes.

## Architecture

- `crew/campaign-data.js`: the star chart (systems, routes), acts, story operations, starbases, station missions, the contract and interception generators, and `encounter()`. Shared by both pages and the Node tests.
- `index.html`: Three.js renderer and the battle engine; `?encounter=1` stages the encounter saved in `launch` (and `?campaign=N` a story operation) and applies ship state. It writes the pending battle result and returns to `campaign.html` after the result screen.
- `campaign.html`: Strategic map, accessible star hotspots, arrival screens, starbase mission boards, interceptions, briefings, officer dossiers, shipyard, state persistence, after-action reports and return to skirmish.
- `img/campaign-atlas.webp`: The original concept image. No longer displayed; system coordinates are still stored in its 1672 × 941 space.

The original monolithic game script still contains direct player/enemy assumptions. The first fleet extension now permits multiple vessels, retargeting, fleet HUD markers, collision-pair processing and per-mission survival conditions. Remaining code still contains duel-era assumptions; **extend incrementally** and test targeting, projectile collision, AI behaviour and victory conditions before adding larger fleets.

## Technical QA and limitations

The rebuilt strategic screen was exercised in headless Chromium (SwiftShader WebGL) at 1600×900, 1280×720 and 390×844: 33 systems, faction borders and 53 lanes drawn; hover set course, the jump saved to `state.system`, the arrival screen with and without an operation, the briefing, the shipyard's 3D view for Bastion and Warden with slot selection, overhaul and torpedo resupply costs, and an after-action report unlocking the next operation, with no page errors. Earlier tests covered officer dossiers, changing the flagship, sequential mission unlocking, post-battle choices, post-battle changes in requisition and ordnance resupply. All UI tests completed without JavaScript page errors. **These were simulated mission-result tests, not full browser playthroughs of the WebGL battle engine.** The true battle-to-save-to-map integration and combat balance still need direct playtesting on the deployed game, especially the 100-second Wraith survival operation.

## Recommended next milestones

1. **Fleet (grand campaign milestone 2)** — Buy hulls at starbases, keep up to three ships, choose the flagship, per-ship damage, upgrades and names; 3 v 3 battles with the player flying the flagship and ordering two AI escorts (focus my target, defend me, engage freely).
2. **Boss battles (milestone 3)** — A unique boss at the end of each act, with escorts, phases and special weapons.
3. **Depth (milestone 4)** — Faction reputation, capturing hulls, recruitable officers, a codex, save slots and difficulty settings.
4. **Battle QA and balancing** — Play every operation, station mission and contract type on all four hulls. Contract pay, enemy strength, interception odds and breakaway chances are first-pass numbers.
5. **Art pass** — Portraits for the new commanders (VIGIL Array and the Choir use the classified medallion; generated contract captains do too), an authored civilian hull, arrival transitions.

Every milestone should preserve the intentional slow, dangerous, naval feel of Broadside.


## Officer command implementation (October 2026)

- Keys **5–9** or the on-screen bridge deck activate abilities during campaign operations only. Skirmish balance is unchanged.
- Varro — Brace: instantly restores 16% of the ship class's baseline shield value to each bank, capped by the current bank capacity; cooldown 100s.
- Okoye — Target Solution: +12% damage from the player for 14s; cooldown 110s.
- Vale — Damage Control: +24 subsystem integrity to the most damaged subsystem and extinguishes one fire; cooldown 125s; refuses to expend when nothing needs repair.
- Sato — Evasive Pattern: -22% incoming enemy damage for 12s; cooldown 105s.
- Renn — Threat Scan: reports the enemy's weakest shield facing and least intact subsystem; cooldown 80s.
- All ability cooldowns are **battle-local**, reset at mission deployment, and do not alter campaign save format.
- `crew/upgrades.js` holds the shipyard upgrade catalogue and `apply()`, shared by the campaign and battle pages.
- `crew/personnel.js` holds character descriptions, mission lines, commander identities, and portrait positions. `crew/bridge-controller.js` is decoupled from Three.js and takes battle objects via dependency injection.
- `img/command-portraits.webp` is a compressed six-frame portrait atlas containing five Meridian officer portraits plus ORACLE-9's armoured synthetic portrait. Captain Kora Vex and Captain Garrick Thorne use painted portraits (`img/commanders/vex.webp`, `thorne.webp`); Sable and the Wraith Cantor use SVG illustrations in `img/commanders/`; these assets are not yet photorealistic.
- Automated testing covered the five command effects/cooldowns and the personnel and briefing UI, but **full live WebGL combat playthroughs remain unverified**.


## Fleet and mission objective expansion — 23 October 2026

- `crew/fleet-controller.js` implements mission-scoped protected and hostile ship objectives, status messages, target cycling, and victory/failure gates, while retaining skirmish mode.
- In operation 1, the MV Peregrine has a distinctive procedural civilian freighter mesh with Sabre-derived flight and collision physics, and has no functional weapons. Either keep it alive until it crosses the jump-gate plane or destroy Vex first. H (or the HUD button) holds/resumes the convoy. Losing the transport fails the operation.
- In operation 2, a weakened Scrapjaw pursuer flanks the Revenant minelayer from the opposite side, rather than merely copying its heading; both must be destroyed. The player may select a hostile contact with `J`, and the target HUD and officer scan follow the selected vessel.
- The tactical plot now renders every active ship, including secondary opponents and friendly civilian craft. Ship collisions evaluate ship pairs; shell, torpedo and mine collision systems already iterate over every ship.
- Enemy portraits are stored in `img/commanders/` (painted `vex.webp` and `thorne.webp`, illustrated `sable.svg` and `cantor.svg`) and displayed in mission briefings, the arrival screen, the Officers screen and incoming hails. ORACLE-9 continues to use the sixth slot of the existing atlas.
- Automated controller scenarios checked both win and loss conditions, target cycling and single-enemy compatibility. Syntax was checked for the browser scripts, but full interactive/WebGL battles have **not** been played through in this environment.
- **Remaining limitations:** a Sabre is a visual stand-in for a civilian hull; direct collision and targeting behaviour require playtesting; balance of protecting the convoy against Kora's aggressive AI is unverified; the map artwork still includes baked labels; and alternate mission objectives are currently restricted to these bespoke scenarios.


## Distinct battlefields and expanded escort choices (23 October 2026)

- `crew/battle-environments.js` constructs deterministic mission-specific background scenery and nebula colour schemes: Kestrel jump gate and trade station, Cinder Wake wreckage field, Red Narrows fractured pylons, Halcyon relay arrays, Harrow organic spires. Decorative assets are non-colliding; Three.js geometries and materials are disposed when changing mission, returning to title, or entering skirmish.
- The escort ship now visibly resembles a modular cargo freighter, not a warship. Its movement/collision model is still inherited from the Sabre and will need an authored transport hull for final production.
- The civilian escort has **two victory paths**: (a) protect it to its extraction waypoint, or (b) destroy the pirate attacker first. The captain can order HOLD/RESUME with H or a visible HUD button. Objective progress and the extraction beacon are visible on tactical instruments.
- Vex retargets to defend herself when the player intercepts her closely, permitting a tactical diversion. Cinder Wake's minelayer/pursuer now attempt a pincer rather than stacking in a single pursuit line.
- Officer tactical bonuses now apply across all enemy contacts, not only the originally designated opponent.
- Automated fleet-state regression, procedural environment lifecycle tests, and static JavaScript syntax checks run through GitHub Actions. Full GPU/WebGL playthroughs, final art acceptance and comprehensive difficulty balancing remain unverified.

## Grand campaign milestone 1 — QA (24 October 2026)

- Node tests: `tests/campaign-data.test.js` covers the map graph, act and unlock order, starbases, station missions per act, contract generation (deterministic per cycle, targets within three jumps, scales in range), interception rules and breakaway odds, and encounter specs. `tests/fleet-controller.test.js` now runs story operations from their specs plus surrender, survival, a generated escort and a two-ship station mission.
- Headless Chromium (SwiftShader) runs covered: a pre-grand-campaign save migrating; starbase markers and details; the Meridian arrival card and mission board; accepting a contract; the order on the map and in the list; the undocked shipyard; flying to the target, the contract briefing and launching it into a live battle (HUD shows the contract objective); paying out the win and refreshing the board; Peregrine's station missions; an interception that cannot be dismissed, survives a reload and is escaped; a failed breakaway into a live interception battle; a lost fight towing the ship to Peregrine; operation 1 staged from its spec with the convoy control; and the Act II briefing, Act II story operation, station mission and contracts. No page errors. Full battles were not played to the end in the browser; results were injected into the save.


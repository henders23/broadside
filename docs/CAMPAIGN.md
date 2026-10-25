# The Shattered Reach — campaign implementation and design brief

Updated: 24 October 2026.

## Identity and playable scope

**Broadside** is a game about captaining a warship. The player directly manages one vessel's heading, throttle, firing arcs, directional shields, reactor allocation, torpedoes, subsystems and tactical decisions. The campaign adds persistent consequences, a cast of officers and up to two escorts, but the escorts take standing orders rather than direct control: it does not become a fleet strategy game.

The campaign is being built out into a three-act grand campaign in four milestones. **Milestone 1 is in:** three acts, seven story operations, five starbases with mission boards (hand-written station missions and generated contracts), repairs and refits only at starbases, interceptions in hostile space, and one data-driven encounter system behind every battle. **Milestone 2 is in:** a fleet of up to three ships with per-ship damage, upgrades and names, a choice of flagship, and 3 v 3 battles with escort orders. **Milestone 3 is in:** a boss battle closing each act. **Milestone 4 is in:** reputation, claimed hulls, recruitable officers, a codex, save slots and difficulty. **Milestone 5 is in:** the Kestrel warning story spine with consequences, frontlines, and larger officer and admiral cards.

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

## The story: the Kestrel warning

The opening briefing promises two things: the last signal out of Kestrel “was not a distress call, it was a warning”, and “someone wants this frontier empty”. The campaign pays both off.

- **The warning** is a Directorate prediction, broadcast from the Halcyon Belt for eleven years, that the Wraith are coming to the Reach.
- **Act I · The Long Watch.** Vex takes no cargo: she is paid to scare traffic off the lanes. Sable's codes and logs show the Ash Fleet paying the clans. Thorne says Halloran only wants ships to turn back because "something is coming". At Grimhold, Halloran's last words: a machine told her what was coming, Command buried her report, and she emptied what she could by force.
- **Act II · The Machine Signal.** ORACLE-9's archive is a casualty projection for the Reach, falling to nothing in three years; the machines had been keeping people away. The Midway relay was cutting Midway off from Harrow, not from the Navy. The Arbiter fights believing it protects the colonies and, dying, sends one coordinate: Harrow.
- **Act III · The Wraith.** Harlan's verdict: Halloran tried by terror and the machines by silence, and "we were wrong about why". The Navy does it properly: survive first contact, evacuate Nex, and kill the Bloom-Mother at Verdant.
- Each story operation has a `log` entry (Intel's **Story so far**, with the decision taken), a transmission from **Harlan** shown in the after-action report, and win and loss reactions from the operation's lead officer (`NARRATIVE` in `crew/campaign-data.js`).
- The final report from Harlan reflects the decisions taken and the state of every front.

## Decisions and consequences

Four aftermath decisions change later battles. The after-action report says which decisions have stakes; the briefing of the battle they change lists the effect under **What has changed** (`CONSEQUENCES`).

| Decision | Choice | Effect |
| --- | --- | --- |
| Op 3, Thorne | Amnesty | The Pyre's mine layer is out of the fight (Thorne's charts). |
| | Impound | Thorne's ship, the Widow, joins the fleet. |
| Op 8, Halloran | Search the wreck | ORACLE-9 and the VIGIL pickets start with half shields. |
| | Amnesty | The ASF Penitence fights at your side at Nex and Verdant. |
| Op 4, ORACLE's archive | Transmit | The Long Lantern starts a third of the way to the beacon. |
| | Seal | The Arbiter's lattice is weaker (takes 40% instead of 20%). |
| Op 9, the Arbiter | Salvage the core | The Bloom-Mother regrows at 1.2× instead of 1.8× in her last phase. |
| | Destroy it | +10 standing with both Navy yards. |

## Frontlines

- Five fronts: Kestrel Verge (starts Contested), Red Narrows, Ash Marches and Harrow Expanse (Enemy-held), Halcyon Belt (Enemy advantage). Each runs from −10 to +10 in five states: Enemy-held, Enemy advantage, Contested, Navy advantage, Secured. The Meridian Core has no front.
- A battle in a front's region moves it: story win +4, finale win +10, station mission or contract win +2, interception win +1, a loss −2 (interception −1).
- **Push back:** the current act's front (Ash Marches, Halcyon Belt, Harrow Expanse) loses 2 after three battles anywhere without a win there; a win there resets the count. The map's front strip counts down, and the after-action report says when it happens.
- Effects by state (Enemy-held → Secured): ambush chance ×1.5 / 1.2 / 1 / 0.6 / none; enemy hull ×1.1 / 1.05 / 1 / 0.95 / 0.9; pay for work there ×1.2 / 1.1 / 1 (danger money); prices at a starbase in the region ×1.1 / 1.05 / 1 / 0.97 / 0.94.
- Finales: the Red Narrows decide how many clan raiders answer Halloran (2, then 1 at Navy advantage, none when secured) and a turning Ash Marches strips the Pyre's escort; the Halcyon Belt thins the Arbiter's lattice (to 35% or 50% damage taken); the Harrow Expanse sets the Bloom-Mother's brood (3 when enemy-held, down to none when secured).
- On the map, region borders shift from their own colour toward Navy blue and brighten as a front is won; a selected system shows its front, and Intel and the final report list all five.
- `encounter(src, ctx)` builds every battle with the save's flags and fronts (`ctx`), and `applyBattle()` turns a result into front changes; both are covered by `tests/war.test.js`.

## Officers and admirals in reports

- Briefings open with a large card for the operation's lead officer; after-action reports carry the lead officer's reaction (or the first officer's, for contracts and ambushes) and Harlan's transmission, with 128 × 148 portraits. Enemy commanders' cards in briefings are the same size. Reports and briefings use a wider dialog.

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
| I finale | 8 | Grimhold | Commodore Ingrid Halloran, dreadnought Pyre + escort | Destroy the boss | 1,500 |
| II finale | 9 | Halcyon | The Arbiter + sentinel | Destroy the boss | 1,900 |
| III finale | 10 | Verdant | The Bloom-Mother + brood guardian | Destroy the boss | 2,400 |

Operations unlock in story order (1, 2, 3, 8, 4, 6, 9, 5, 7, 10); the numbers 1–5 are kept from the original five so older saves stay valid. An act ends with its finale, so a save that had finished operations 1–3 before milestone 3 is back in Act I until it beats the Pyre.

## Act finales

- Each finale is a story operation with a `boss` block (`crew/campaign-data.js`): a title for the boss bar and three phases. Phase 1 runs from the start; each later phase begins when the boss's hull falls past its `at` fraction and can:
  - `spawn` more ships beside the boss;
  - restore its `shields`;
  - `unlock` a weapon group held back until then;
  - raise a `lattice`: the boss takes only that fraction of damage while any ship spawned with `lattice: true` lives;
  - multiply a living hull's `regen`.
- Phases also send a hail from the boss, and a hit big enough to cross two thresholds runs both. The goal type `boss` is won when the boss is destroyed, whatever escorts remain.
- | Boss | Built on | Scale | Hull / shields | Phase 2 | Phase 3 |
  | --- | --- | --- | --- | --- | --- |
  | Pyre | Revenant (Warden hull), adds the Warden's siege cannons | 1.4× | 5,000 / 760 | 65%: two clan raiders, shields restored | 30%: inferno salvo (16 missiles), after a 2.6 s warning |
  | Arbiter | Seraph, adds a spinal lance | 1.6× | 3,300 / 900 | 60%: two lattice nodes, 20% damage taken until they die | 30%: shields restored, Judgement lance, after a 2.6 s warning |
  | Bloom-Mother | Wraith | 1.8× | 4,500 / 640, regrows 12 a second | 65%: two Thralls (more or fewer with the Harrow front) | 35%: regrowth ×1.8, spore storm (20 spores), after a 2.6 s warning |
- Boss classes are built by `bossClass()` in `crew/ships.js` (a `variant()`): the Pyre and the Arbiter have models of their own, refitted from their base classes' mounts; the Bloom-Mother is the Wraith's model scaled by `modelScale`. Each has new stats, boosted weapons and extra ones. They are enemy-only and never appear in skirmish.
- The battle HUD shows a boss bar (hull, phase marks, current phase, lattice state) in place of the contact line. The map, arrival card, briefing (with a list of the phases) and HUD label the operation **Act N finale**.

## Uneven fights

- Not every battle is matched to the fleet. Each encounter's `support` caps how many support ships the enemy adds against escorts: story operations and station missions set it (Thorne and the Cantor always fight alone; ORACLE-9 can bring two drones), and generated contracts and interceptions draw 0, 1 or 2 from the encounter id. Post-battle choices set named flags for future narrative use. Campaign failure tows the flagship to the nearest starbase with a recovery cost and damaged hull; it is not permanent death.

## Starbases, station missions and contracts

- Five starbases: **Meridian Fleet Yards** and **Tarn Propulsion Depot** (Navy), **Peregrine Exchange**, **Elysia Research Station** and **Juniper Ringport** (independent). They show as diamonds on the map, and a system's details name its starbase.
- Repairs, torpedo resupply and upgrade fitting work only while docked at a starbase. Elsewhere the shipyard still shows the ship and its upgrades, explains why it cannot work, and names the nearest starbase.
- Arriving at a starbase shows its card with **Mission board** and **Shipyard & repairs**. The board has three columns: the station's hand-written missions, its generated contracts, and the orders already accepted (with Abandon).
- **Station missions** (`SIDE` in `crew/campaign-data.js`): ten hand-written missions, each posted at one starbase from its act onwards, with a named giver, brief, objective and intel. Flying one marks it done (`state.sideDone`).
- **Contracts**: three per starbase (a bounty, an escort, and a patrol or an alternating Act II/III pursuit), generated from a seed of the station and `state.boardCycle`, which goes up after every victory, so each board posts new work after each win. Targets are within three jumps; bounties and patrols go to hostile space (preferring the act's main enemy), escorts to independent or contested space. Enemy strength and pay scale with the target's threat level and the act.
- Up to four orders (station missions plus contracts) can be held at once. Accepted contracts are saved whole in `state.contracts`, accepted station missions by id in `state.orders`. Orders show on the map (blue tags), in the list under the map, and as **Engage** cards on the target system's arrival screen. A lost order stays open to retry.

## The fleet

- Saves hold every ship in `state.ships` (`id`, `ship` class, `shipName`, `hull`, `sub`, `torps`, `upgrades`, `reserve`) and the flagship's id in `state.flag`. Single-ship saves are converted on load.
- Up to three ships (`MAX_FLEET` in `crew/campaign-data.js`). The shipyard's fleet column lists them with their role (flagship, escort, reserve) and has a **Commission a hull** slot while docked. The hull market sells all four player hulls (Sabre 1,100, Halberd 1,250, Bastion 1,500, Warden 1,700); a name is suggested and can be changed. The selected ship can be made flagship, renamed, moved to reserve or deployed, and (docked, not the flagship) sold for half its hull price; upgrades are not refunded.
- The rest of the shipyard (3D model, system slots, upgrades and services) works on the ship selected in the fleet column.
- `deployed(ships, flag)` decides who flies: the flagship, then up to two ships not in reserve. Breaking away from an ambush uses the slowest, most damaged deployed ship's odds, and costs every deployed ship the hull.

## Fleet battles

- The battle page builds the flagship as the player's ship and each escort as a friendly AI ship (team `p`, `captain` difficulty) with its own upgrades, hull, subsystems and torpedoes, formed up either side of the flagship.
- Standing orders, set with **U**, **I** and **O** or the Escorts panel (each escort's hull and current target): **focus my target** (the flagship's selected enemy), **defend the flagship** (the hostile attacking the flagship, nearest first) and **engage freely** (the hostile nearest each escort). `crew/fleet-controller.js` re-picks escort targets once a second.
- Hostiles re-pick targets every nine seconds among the player's ships, nearest first with a bias toward the flagship; an escort mission's lead hunter keeps chasing the convoy.
- Enemies may be topped up toward the player's fleet size, up to their `support` cap (see Uneven fights): `reinforcements()` adds light support ships of the lead enemy's kind (Corsair escort, Ash Fleet escort, Directorate drone, Wraith brood). Rewards are unchanged.
- Losing an escort does not lose the battle; losing the flagship does. Every ship that flew writes its condition back to its record; a disabled escort comes home at 30% hull and the after-action report names it (`pendingResult.lost`).
- Officer commands still act on the flagship only.

## Save slots and difficulty

- Three slots. Slot 1 keeps the original key `broadside-campaign-v1`; slots 2 and 3 use `broadside-campaign-v1-s2` and `-s3`, and the active slot's number is in `broadside-campaign-slot`. Both pages read the save through `saveKey()` in `crew/campaign-data.js`, so the battle page always writes back to the slot that launched it.
- **Saves** (top bar) lists the slots with act, flagship, progress, requisition, difficulty and date; it loads, starts or deletes a campaign (not the one being played), and changes the current campaign's difficulty. Starting a campaign in another slot writes it and reloads on that slot.
- Difficulty (`DIFFICULTY`): **Ensign** (Commander-grade enemy captains, enemy hull ×0.85, enemy damage ×0.8, ambushes ×0.6), **Captain** (as designed) and **Admiral** (Admiral-grade captains with escorts a grade sharper, hull ×1.15, damage ×1.15, ambushes ×1.3, pay ×1.25). Campaign battles use it instead of the skirmish menu's enemy captain.

## Reputation

- Standing with each starbase, 0–100 (`state.rep`), in four tiers: Neutral, Friendly (25: 5% off the yard and 5% more pay), Trusted (50: 10%, and a fourth, harder **priority bounty** at 40% more pay), Honoured (75: 15%).
- Station missions +10 and contracts +6 with the posting station; story operations +5 with both Navy yards (Meridian and Tarn); clearing an ambush +2 with the nearest starbase; losing a station's order −2; abandoning one −5. After-action reports show the change and any new tier.
- The discount applies at the docked station to upgrades, hulls, repairs, torpedoes and officers; the pay bonus to that station's own work. Escort contracts now only go to independent or contested systems (previously Act I could send an escort into machine space).

## Officers for hire

- One recruit per starbase (`recruits` in `crew/personnel.js`): Lt. Yusuf Adeyemi (First Officer, Meridian, *Rally the Crew*: 6% hull and 10 to every subsystem), Lt. Dario Fenn (Tactical, Peregrine, *Overcharge*: every weapon and tube reloads), Chief Petty Officer Ama Osei (Engineer, Tarn, *Hull Patch*: 12% hull), Ensign Kit Marlow (Helm, Juniper, *Burn Hard*: refuel the afterburner, +30 engines) and Lt. Soren Achterberg (Intelligence, Elysia, *Jamming Field*: hostile missiles and torpedoes in flight lose their lock). Most need Friendly standing; Osei is available to anyone.
- Hiring offers to put them on duty at once. `state.crew` maps each post to its holder, `activeCrew()` builds the five on duty (keys 5–9 follow the post), and the Officers screen lists who is on duty and in reserve, with Assign and Stand down. Experience goes to the officers on duty; others keep their records. Recruits arrive with some experience and share the promotion rules.

## Claimed hulls

- After a victory the after-action report offers up to two wrecks of capturable classes that were destroyed (Scrapjaw 650, Seraph 700, Revenant 800 requisition to refit). One may be claimed, if a berth is free; it joins in reserve at 35% hull with a prize name (MNS Jackal, MNS Echo, MNS Penitent…). Bosses and Wraith cannot be claimed.
- If Thorne surrenders, impounding his matériel adds his Scrapjaw, the Widow, at 50% hull for nothing.
- Claimed ships fly like the Navy hulls, with their own weapons, keys and model. The shipyard shows only the systems a hull carries (a Scrapjaw has no torpedo bay; a Revenant's mine layer takes the torpedo-bay upgrades; a Seraph's beam arrays take the broadside upgrades). They sell for half a nominal value.

## The codex

- `crew/codex.js` holds 40 entries in five categories (Ships, Factions, People, Places, Guide), each with an unlock rule: from the start, a ship class met in battle (`pendingResult.met` → `state.met`), a story operation completed or opened, or a region visited (`state.visited`). Older saves are credited with what their completed operations imply. Entries opened after the start are marked new until read.

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
- `campaign.html`: Strategic map, accessible star hotspots, arrival screens, starbase mission boards, interceptions, briefings, officer dossiers, shipyard, state persistence, after-action reports and return to skirmish. The page is markup and styles; its script lives in `campaign/`, as classic scripts that share one scope and load in order: `core.js` (save, slots, pay, reputation, the war, officer cards, Harlan's voice, orders), `map.js` (star chart, fronts, jumps, interceptions, launching battles), `board.js` (modals, briefings, mission boards, recruits), `shipyard.js`, `crew.js` (codex, officers, saves, Intel) and `reports.js` (after-action reports, act transitions, the ending, start-up), plus the `ship-view.js` module for the shipyard's 3D view.
- `crew/ships.js`: the one ship table (`CLASSES`): stats, weapons, hardpoints and ellipsoids for every hull, and the three act bosses. The battle page flies it; the shipyard reads it through `shipyardHull()` (turn in degrees a second, starboard-side points) instead of keeping its own copy.
- `crew/fleet-controller.js`: campaign objectives in battle: escorts and convoys, holds, surrenders, pincers, boss phases, station defences in waves (`goal.type: 'defend'`) and pursuits (`goal.type: 'pursuit'`); supporting ships hit at 40% unless an entry sets `dmg`.
- `crew/tutorial.js`: the coached first battle (steps, completion tests, when hostiles may open fire).
- **Campaign-only hulls** are `variant()`s in `crew/ships.js`: an existing class with new stats and weapons (`boost`, `drop`, `extra`), and usually a model of its own (`own`: length and proportions; `refit()` fits the hit and shield ellipsoids to the model and stretches the base class's gun and engine mounts to it). Every hull has its own model except the Bloom-Mother, a scaled-up Wraith. The civilian transport and the defence station are variants too. The Sentinel (Halberd hull, Act II) and the Thrall (Wraith hull at 0.55×, Act III) are met in generated work (`FOES[].alt` in `crew/campaign-data.js`), station missions and two story fights; the three bosses are variants too. A weapon marked `special` charges with a warning before it fires (`armed()` in `index.html`).
- **Convoy runs**: a station mission with `legs` (each a system, enemies and objective) is flown one battle at a time. `sideLeg(mission, progress)` resolves the current leg; the campaign keeps `state.legs[id] = { leg, hull }`, the battle page saves the convoy's hull fraction (`pendingResult.convoyHull`), and the next leg's convoy starts with it (`goal.convoyHull`). The reward is paid on the last leg; any lost leg resets the run.
- `img/campaign-atlas.webp`: The original concept image. No longer displayed; system coordinates are still stored in its 1672 × 941 space.

The original monolithic game script still contains direct player/enemy assumptions. The first fleet extension now permits multiple vessels, retargeting, fleet HUD markers, collision-pair processing and per-mission survival conditions. Remaining code still contains duel-era assumptions; **extend incrementally** and test targeting, projectile collision, AI behaviour and victory conditions before adding larger fleets.

## Technical QA and limitations

The rebuilt strategic screen was exercised in headless Chromium (SwiftShader WebGL) at 1600×900, 1280×720 and 390×844: 33 systems, faction borders and 53 lanes drawn; hover set course, the jump saved to `state.system`, the arrival screen with and without an operation, the briefing, the shipyard's 3D view for Bastion and Warden with slot selection, overhaul and torpedo resupply costs, and an after-action report unlocking the next operation, with no page errors. Earlier tests covered officer dossiers, changing the flagship, sequential mission unlocking, post-battle choices, post-battle changes in requisition and ordnance resupply. All UI tests completed without JavaScript page errors. **These were simulated mission-result tests, not full browser playthroughs of the WebGL battle engine.** The true battle-to-save-to-map integration and combat balance still need direct playtesting on the deployed game, especially the 100-second Wraith survival operation.

## Recommended next milestones

1. **Battle QA and balancing** — `tools/balance.mjs` now measures every operation and finale with the AI at the helm ([BALANCE.md](BALANCE.md)); human playtests of the bosses solo and with a fleet, recruit commands and captured hulls as flagships are still needed.
2. **Further QA** — Play every operation, station mission and contract type on all four hulls, alone and with escorts. Contract pay, enemy strength, hull prices, reinforcement strength, interception odds and breakaway chances are first-pass numbers.
3. **Art pass** — Portraits for the recruits and the new commanders and Harlan's voice (specified in [ART-BRIEF.md](ART-BRIEF.md); the game picks the files up when they are added), an authored civilian hull and station model, arrival transitions.

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

## Grand campaign milestone 2 — QA (24 October 2026)

- Node tests: `tests/fleet-controller.test.js` adds a three-ship fight (reinforcements, each escort order, losing an escort, winning) and fire spreading across the player's ships; `tests/campaign-data.test.js` adds hull prices, ship names, `deployed()`, fleet breakaway odds and reinforcements.
- Headless Chromium runs covered: commissioning a Sabre (name tidied and shown as text, not HTML), its own systems in the yard, an upgrade fitted to one ship only, per-ship overhaul, a full fleet, switching flagship, reserve and deploy, selling, no buying or selling undocked, and operation 1 flown with three ships: the Harrier as flagship, the Resolute and a Warden as escorts, Vex reinforced to three, the Escorts panel, U/I/O and the buttons, escorts holding hostile targets. Ending the battle wrote each escort's damage back, recovered the disabled one at 30%, and the after-action report named her. Skirmish was checked unchanged. No page errors. The fleet battle was ended by applying damage through the test hook, not played out.

## Grand campaign milestone 3 — QA (24 October 2026)

- Node tests: `tests/campaign-data.test.js` covers the new story order and act boundaries, the finales' phases, and support caps (fixed per story operation, 0–2 for generated fights). `tests/fleet-controller.test.js` runs each boss: the Pyre's clan raiders, restored shields, hail and inferno unlock, and winning with escorts still alive; the Arbiter's lattice holding until both nodes die, then the lance unlocking; and the Bloom-Mother crossing two phases in one hit.
- Headless Chromium runs covered: the Act I finale on the map, arrival card and briefing (with phases); the Pyre in battle with its boss bar, a lone flagship facing it plus one escort, the inferno salvo locked, phase 2's raiders and phase 3's unlock, destroying it, the end screen, the after-action report, and Act II opening; Halcyon offering the Arbiter after Ghost Frequency, the lattice with its nodes, a 1,000-point hit reduced to 200, the lattice falling with the nodes; the Bloom-Mother and her regrowth phase; three ships against Thorne alone; and a new game leaving one fresh ship with no upgrades or damage, fighting with the stock hull. No page errors. Phases were reached by setting the boss's hull through the test hook; the fights were not played out.
- Fixed in passing: scaled-down ships with a living hull (Wraith spawn) regrew to the full class hull instead of their own.

## Grand campaign milestone 4 — QA (24 October 2026)

- Node tests: `tests/depth.test.js` covers slot keys (and storage failures), difficulty, interception scaling, standing tiers and changes, priority contracts, escort targets, capture rules and prize names, recruits and duty assignment, experience for officers on and off duty, each recruit command against a stub ship (including refusals), and every codex entry's unlock.
- Headless Chromium runs covered: the Saves panel; a new Admiral campaign in slot 2 with its own briefing while slot 1 stays untouched; that campaign's battle (Admiral captain, 15% more enemy hull, enemy hits 15% harder); loading slot 1 back and deleting slot 2; Trusted standing at Peregrine (board, priority contract, 10% more pay, 10% off upgrades and the recruit); hiring Fenn and assigning posts both ways; claiming Vex's wreck after Operation 1; the codex unlocking the Scrapjaw; the Scrapjaw in the shipyard with its six systems; repairing it, making it flagship and flying it into Operation 3 with Fenn's Overcharge on key 6; and impounding the Widow after Thorne's surrender. No page errors.

## Milestone 5 — QA (24 October 2026)

- Node tests: `tests/war.test.js` covers the narrative data (every operation has a log, reactions and a transmission), each consequence and that shaping a battle never changes the story data, front states and every way they move, the push back and its reset, front effects on generated fights, ambushes and the three finales, and the convoy's head start.
- Headless Chromium runs covered: fronts in a new save and on the map; Thorne's after-action with large officer and admiral cards, the war, the stakes, and amnesty recorded; the push back on the third battle away from the act front; the Pyre briefing listing Thorne's charts, the enemy-held front and one clan; the Pyre in battle with its mine layer silenced through every phase, 10% more hull and one clan raider; Nex with the ASF Penitence alongside and the Long Lantern a third of the way in; Intel's story so far; and the final report reflecting decisions and fronts. No page errors. Battle results were injected into the save, not fought out.


# Broadside — adversarial review, November 2026

Date: 25 November 2026 · Scope: user experience, narrative and playability of the whole game.

Three independent reviewers (one per area) scored the game against twelve criteria, then re-scored after each round of fixes. The UX reviewer drove the real pages in headless Chromium at 1600×900 and 1366×768; the narrative reviewer read every line of story text; the playability reviewer worked from the rules, the economy data and the AI-pilot win rates. None of them could hear the game or hold the controls, and none of this is human playtesting.

## Criteria and scores (out of 10; 9 = a paying player would have no real complaint)

| # | Criterion | Start | Final | What a 9 still needs |
| --- | --- | --- | --- | --- |
| 1 | First five minutes | 5 | 8 | A new player finishing the coached battle unaided, at real controls. |
| 2 | Battle HUD readability | 4 | 8 | Readability in motion at a real frame rate. |
| 3 | Campaign screens | 6 | 8 | A full human playthrough of an act, looking for dead ends. |
| 4 | Feedback | 6 | 8 | Someone listening: are hits, shield breaks, refusals and officer calls distinct? |
| 5 | Robustness and accessibility | 4 | 7 | Screen reader and non-QWERTY testing; key rebinding does not exist. |
| 6 | Story coherence | 5 | 8.5 | Harlan's recorded lines acknowledging the player's choices (re-recording); four name collisions (Widow's Toll, Sable, Bastion, Peregrine). |
| 7 | Character and voice | 5 | 7.5 | Voiced officers and enemies to match Harlan. |
| 8 | Story through play | 5 | 7.5 | Objectives that use the place (defend the relay, reach the wreck): new mission work. |
| 9 | Core loop | 5 | 7 | Power settings at real parity and a verdict on the lance: human playtests. |
| 10 | Difficulty and fairness | 4 | 7 | Human win rates for solo finales, especially Warden and Halberd. |
| 11 | Variety and pacing | 5 | 6 | More contract templates: new content. |
| 12 | Progression and economy | 4 | 7 | Confirmation that upgrades are felt: human playtests. |

Mean 7.5 (from 4.8). **The 9 target was not reached**, and every reviewer's remaining requirement is outside what source changes can deliver: human playtests, new audio or new content.

## What changed

**User experience.** The top-centre lines (objective, boss bar, fleet line, twist, hold button, messages, warnings) sit in one column and can no longer print over each other; bridge commands are a strip above the helm and officer transmissions sit clear of the systems list; guns say *Out of range* rather than *No arc* and a refused shot says why; the systems list shows only damage; a gun camera films the target; panel titles do not wrap; V sets repair priority from the keyboard. The coached battle has one teacher at a time, gives the broadside range and matches its briefing. The pause screen lists the controls, takes focus and hides the HUD; leaving a campaign battle asks once. On the campaign side: larger small print, sticky modal actions with focus, the top bar first in tab order, one *Held by* status with an explanation, a simpler map before the first victory, a loss report that offers the yard, saves that survive blocked or full storage (with a visible *Not saving* mark) and half-valid data. Slow motion and the kill cam start off under `prefers-reduced-motion`.

**Narrative.** Every decision but the last now changes a later battle and says what it is worth; the ending answers the Nex and Verdant choices and Harlan's own part in burying the report. Contradictions removed (the Op 1, 2 and 5 choices, Thorne, the Arbiter's motive, "finished" factions, contract and hail text, codex spoilers). Officers speak in their own registers; all 18 station missions end with a line from their giver; enemy leads carry each operation's reveal into the fight as a hail at half hull (or 45 seconds into escorts and holds). Systems are described differently once the story has passed through; each has its own arrival view; battles open on a place card and six operations mark their landmark on the plot. Harlan's recorded lines were not touched.

**Playability.** A lost finale no longer costs ground and story operations, interceptions and blockades no longer run the counter-attack clock, so following the story or retrying a boss does not make things worse. Repairs 4 per point, emergency repair 60, torpedoes 15; interception pay up and odds down by a sixth; pursuits on Act I boards, priced and paced so they are neither a farm nor uncatchable. Weapons power is 0.6 + 0.1 per pip (was 0.35 + 0.1625) and a facing under fire recharges at 75% (was 35%), so shield power is worth having. The Halberd's lance trains three degrees toward its target. Officer cooldowns are about 30% shorter and Target Solution is +20%. Three damage upgrades are 20% steps. Ensign is easier; the Arbiter and the Pyre's supporting ships hit a little softer; head-on meetings start closer.

## Measured after the balance changes (AI pilot, Captain, solo, 3 runs per hull: noisy)

| Operation | Bastion · Halberd · Sabre · Warden | Length |
| --- | --- | --- |
| 2 The Cinder Wake | 100 · 67 · 100 · 67 | 141–360 s |
| 3 The Widow's Toll | 100 · 100 · 100 · 100 | 77–123 s |
| 4 Ghost Frequency | 100 · 67 · 100 · 100 | 69–112 s |
| 8 The Pyre | 33 · 0 · 0 · 33 | 148–330 s |
| 9 The Arbiter (at damage 0.28; since set to 0.30) | 100 · 33 · 67 · 0 | 234–355 s |

These predate the last power, upgrade, interception and decision changes. **`docs/BALANCE.md` and `docs/balance-results.json` have not been re-run** and describe the game before this review; run `node tools/balance.mjs --runs 4` before relying on them.

## Left undone, deliberately

- Renaming Operation 3 or the Widow's Toll system: it ripples through recorded balance data, tests and docs.
- Finale tuning beyond the above: `docs/BALANCE.md` sets 15–40% solo as the target, and the briefing already advises a fleet.
- Interception odds and the six-jump clock are otherwise as designed.
- The region sound beds are synthesised and have not been heard by anyone.

---

# Earlier review: campaign design, October 2026

Date: 25 October 2026 · Scope: campaign source, tests and published balance results.
This was a **source-level review**, not a completed human-played WebGL QA campaign. The AI pilot win rates cited below come from the repository's existing four-run measurements and are not estimates of human win probability.

## Priority, player value and implementation risk

| Priority | Player-facing problem | Evidence and concrete fix | Change status | Implementation risk |
| --- | --- | --- | --- | --- |
| P0 | **Story progress can stall:** the victory report had a Review map button and Escape could dismiss it before a narrative choice committed the win, reward, trophy and next act. | `campaign/reports.js`: make the story-win report locked, remove bypass, and close explicitly after a choice. | **Implemented** | Low |
| P0 | **Double front penalty:** losing in the active front also advanced the “fought elsewhere” neglect clock; a third loss could include an extra −2 pushback. | `crew/campaign-data.js:applyBattle`: increment the neglect clock only when battle region differs from the act front. New regression. | **Implemented** | Low |
| P1 | **Finale difficulty cliff:** the published Captain AI pilot wins Act I/II/III finales 25%/17%/19% solo, versus 100%/83%/100% with three hulls. Players need honest preparation cues. | `campaign/board.js`: advisory with initial hostiles, later waves, recommended fleet count, under-repaired ships, escort reinforcement consequences and boss adds. Does not block a launch. | **Implemented; tuning outstanding** | Low advisory / high tuning |
| P1 | **Halberd class disadvantage in simulation:** 46% average Captain AI regular-story wins versus 93% for Bastion and Sabre; the spinal lance requires more precise aim than an AI captain currently provides. | Instrument human aim/arc use and charge cancellation before increasing damage. Test Op 7 and both pursuit variants. | **Recommended, not changed** | Medium |
| P1 | **Story reward changes after battle:** a victory shifts frontier control before story pay was credited, potentially reducing the danger pay below what the report quoted. | `campaign/reports.js:afterAction`: freeze mission payout before applying war state and award exactly that amount. | **Implemented** | Low |
| P1 | **Convoy reputation farming:** every successful intermediate leg raised station standing by the full mission amount; the payout correctly waited for the final leg. | `campaign/reports.js:afterOrder`: award mission reputation on final leg only; keep frontline battle effects on each leg. | **Implemented** | Low |
| P1 | **Generated missions repeat the same objectives:** station boards supplied only bounty, patrol and escort contracts; handwritten defences/pursuits provided the later variety. | `crew/campaign-data.js`: in Acts II and III alternate generated patrols with a single-quarry pursuit (115 s, disable below 30% hull, no extra enemy reinforcement). | **Implemented** | Medium |
| P2 | **Mis-claimed wreck:** salvage buttons numbered only claimable wrecks, while the click handler indexed the entire wreck list. | `claimHtml/claim`: use the original wreck index and reject uncapturable hull types. | **Implemented** | Low |
| P2 | **Officer lookup recursion:** a missing officer post in the story briefing would recurse forever rather than falling back to the first officer. | `campaign/core.js:leadFor`: resolve duty once and fallback to the active first officer. | **Implemented** | Low |
| P2 | **Escort orders offer little proof of impact:** focus, defend and free commands previously showed targets without reasons; reports lacked escort contributions. | In-combat intent labels now explain target selection; battle-end and campaign reports save/show per-escort damage, damage absorbed and losses. Assists and protected targets are still untracked. | **Partially implemented** | Low–medium |
| P2 | **Unreadable mission silhouettes:** station defences use a Warden hull and civilian convoy uses a disarmed Sabre. | Replace with dedicated station and transport GLBs with distinctive non-combat silhouettes and clear objective lighting. | **Outstanding** | High |
| P3 | **Missing media:** eight commander portraits and 13 Harlan narration files were listed as absent. | Eight generated photoreal pictures have replaced the vector images in dossiers using an optimised WebP atlas; high-resolution per-character masters and Harlan MP3s are still not in the repo. | **Photoreal thumbnail atlas integrated; full-resolution individual assets/audio outstanding** | Medium |

## Manual WebGL QA checklist

1. **Progression and pay:** win Ops 3, 8, 9 and 10; try Escape, outside clicks, panel navigation and reload while the aftermath decision is pending. Verify no double payouts, a single completed operation, correct branching flag and trophy, and transition to the right act. A lost mission must remain retryable.
2. **Difficulty and class:** run first battle, Op 2, Op 7, each finale and one defence/pursuit/convoy as all four player classes at Ensign/Captain/Admiral, solo, two hulls and three hulls. Record wins, time, remaining hull, total repair cost, torpedoes and enemy supports. Avoid tuning from single runs.
3. **Economy:** prove each convoy run grants standing/pay only at completion; losses, abandoned orders and fleet repair do not duplicate rewards. Check whether Act I's earnings can support a meaningful fleet without repetitive grinding.
4. **Frontlines:** battle twice away from the act front, lose at the act front (no extra pushback), then fight away and win at the act front (reset). Validate −10/+10 caps and finale phase consequences.
5. **Fleet AI:** test focus/defend/free against moving and destroyed contacts, enemy boss adds and lattice nodes. Confirm convoy primary hunters still attack civilian ships and escorts return at 30% hull after disabling.
6. **Mission variety:** cycle every board in each act, ensuring Act II/III pursuit appears on odd board cycles and patrols return on even ones. Verify no Thrall swarm is added to a single-quarry pursuit.
7. **Feedback and accessibility:** at 1366×768, 1920×1080 and narrow mobile widths, check that readiness advice, mission objectives, modal actions, warnings and dossier art remain visible; check keyboard and controller interactions where supported.
8. **Media assets:** inspect portraits at small card size and full dossier size; check that missing voice clips fail silently, and record/produce the 13 MP3 transmissions separately.

## Next fixes by expected player value

**Highest:** telemetry for class/encounter/difficulty/fleet size and defeated reason, followed by 10+ repeated AI runs for disputed matchups and human tests of the Halberd; separate class-control issues from raw damage balance.

**Next:** tactical intent labels on escort status and measurable escort damage are now implemented; continue with pursuit interception warnings, human Halberd aim testing and tuning based on simulator accuracy/lance telemetry.

**Then:** real station and transport hulls, full-resolution individual commander WebP assets, Harlan voice recordings and complete audio/graphics stress testing.

The existing `tests/browser/` and `tools/balance.mjs` suites remain necessary; the README's note that full WebGL QA and tuning remain outstanding is still accurate.

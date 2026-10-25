# Broadside — adversarial campaign design review

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
| P2 | **Escort orders offer little proof of impact:** focus, defend and free have visible commands but the post-battle report lacks escort assists, targets protected and damage absorbed. | Add an in-combat intent/target line for each escort, brief switch reason, and a battle contribution summary. | **Recommended** | Medium |
| P2 | **Unreadable mission silhouettes:** station defences use a Warden hull and civilian convoy uses a disarmed Sabre. | Replace with dedicated station and transport GLBs with distinctive non-combat silhouettes and clear objective lighting. | **Outstanding** | High |
| P3 | **Missing media:** eight commander portraits and 13 Harlan narration files were listed as absent. | Eight distinct scalable SVG concept portraits now appear in character dossiers; matching photoreal WebP paintings and Harlan MP3s remain production goals. | **Portrait interim art implemented; audio outstanding** | Medium |

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

**Next:** tactical intent labels on escort status, early warning and intercept prediction for pursuits, and an explicit target-shield/facing cue for the spinal lance.

**Then:** real station and transport hulls, photoreal commander WebP artwork, Harlan voice recordings and complete audio/graphics stress testing.

The existing `tests/browser/` and `tools/balance.mjs` suites remain necessary; the README's note that full WebGL QA and tuning remain outstanding is still accurate.

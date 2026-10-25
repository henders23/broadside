# Focused campaign fleet balance comparison — 25 October 2026

## Outcome

**Decision:** keep NPC-controlled escort weapon output at **55%** of nominal weapon damage for now (`ESCORT_DMG=.55` in `crew/fleet-controller.js`). The human flagship keeps 100% output; hostile wingmen retain their separately configured support damage (40% by default). This avoids globally nerfing bosses. Manual WebGL QA, fleet upkeep and human-controlled Halberd validation remain required.

## Method

Reproducible headless Chromium simulations via `tools/balance.mjs --focused`, Captain difficulty, three battles per flagship/fleet configuration per operation. All simulated flagship saves have no upgrades, hired officers or persistent damage, and each engagement is capped at 420 seconds. The test pilot selects targets and uses officer commands; **it is not a human player**.

Four story operations are common to all three comparisons: **7** (Exodus at Nex), **8** (the Pyre, Act I finale), **9** (the Arbiter, Act II finale), and **10** (Bloom-Mother, Act III finale). Each common subset includes four solo hulls, two two-ship fleets and two three-ship fleets per operation, each repeated three times. Total: **48 solo** fights, **24 two-ship** fights, and **24 three-ship** fights per comparison, or **96 fights per comparable stage**. First two full runs additionally included Operation 2.

The configurations were:
- Solo: **Bastion, Halberd, Sabre, Warden**
- Two ships: **Halberd + Sabre**; **Bastion + Sabre**
- Three ships: **Halberd + Sabre + Warden**; **Bastion + Sabre + Warden**

### Results on the same four missions

| NPC escort damage | Solo wins (48) | Two-ship wins (24) | Three-ship wins (24) | Mean two-ship duration | Mean three-ship duration |
| --- | ---: | ---: | ---: | ---: | ---: |
| **100% (original)** | 13 (27%) | 24 (100%) | 22 (92%) | 155 s | 120 s |
| **70% (intermediate)** | 14 (29%) | 24 (100%) | 22 (92%) | 207 s | 140 s |
| **55% (chosen)** | 17 (35%) | 20 (83%) | 19 (79%) | 218 s | 193 s |

The solo changes reflect normal variation between independent random samples, **not an escort effect**. Three ships remain faster than two on average but did not show a reliably higher win rate in this tiny sample. More ships can trigger additional enemy reinforcements. The 55% setting improves survival tension, although it is not a statistically established optimum.

### 55% outcome by operation

| Operation | Solo (12) | Two ships (6) | Three ships (6) |
| --- | ---: | ---: | ---: |
| 7 · Exodus at Nex | 9 | 5 | 6 |
| 8 · Pyre at Grimhold | 2 | 5 | 4 |
| 9 · The Arbiter | 3 | 4 | 3 |
| 10 · Mother of the Bloom | 3 | 6 | 6 |

The Arbiter remains a special concern. At 55% escort damage the two tested three-ship configurations won three of six attempts combined, and solo fleets won only three of twelve across four classes. The first two acts’ finales and Exodus behave differently; adjusting the entire difficulty level to solve one outlier would be premature.

## Halberd diagnosis

Across the original focused run, the AI-driven Halberd's **charged lance was aligned with a target for only 0–8% of charged time**. Its win rate on the five tested operations was one win from 15 trials in that run. At the 55% setting, it won zero of 12 solo attempts in the four common operations. The pilot's occasional 100% conventional-gun accuracy does **not** measure lance effectiveness.

This is primarily evidence that the **automated pilot fails to hold the very narrow forward beam on moving targets**, not evidence that the lance's numerical damage is too low. The game HUD now differentiates a target merely inside the lance firing arc from an actual ray/ship intersection, and displays **BEAM WILL MISS** instead of promising a hit. We should test this with human players before changing lance DPS, charge time, turn rate or aim tolerance.

## Verification and evidence

- Initial 100% baseline: [GitHub Actions run 40217777670](https://github.com/henders23/broadside/actions/runs/40217777670)
- Intermediate 70% test: [GitHub Actions run 40218393002](https://github.com/henders23/broadside/actions/runs/40218393002)
- Final 55% test: [GitHub Actions run 40218934472](https://github.com/henders23/broadside/actions/runs/40218934472)
- Re-run: `node tools/balance.mjs --only 7,8,9,10 --runs 3 --focused --taken --output docs/balance-focused.json` (after installing the stated Playwright and Three.js dependencies).
- Each workflow uploads the raw focused result JSON as `focused-balance-matrix`. It is intentionally **not** merged into historical `docs/balance-results.json`.

The samples use three trials per ship/operation and do not model persistent hull damage, replenishment costs or bought upgrades. Avoid interpreting percentage differences of one or two results as conclusive, and check full browser/WebGL QA separately.

## Next highest-value tests

1. Human pilots: Halberd aim, shot opportunities, facing and charge clarity in Operations 2, 7, 8 and 9, solo and with escorts. Record hit opportunities versus misses, not just gun accuracy.
2. Economic difficulty: run an entire Act II–III chain with repairs, torpedo spending, one/two/three ship deployments and the cost of disabled escorts. A win can still be too costly to progress.
3. The Arbiter: inspect player-visible lattice-node targeting and boss beam warnings, particularly when allies focus the wrong target.
4. Compare many more seeded AI samples (at least 10 per condition) before another numeric rebalance. Confirm the added value of a third ship, which can also summon additional hostiles.

**No claim is made that the full WebGL campaign has received manual QA approval.**

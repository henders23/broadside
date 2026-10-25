# Balance

`tools/balance.mjs` flies every story operation and act finale in headless Chromium with the AI at the flagship's helm, many times over, faster than real time, and records the results in [balance-results.json](balance-results.json). The numbers below are from the last tuning pass (October 2026, 4 runs of each fight).

```sh
npm install --no-save playwright three@0.169.0 && npx playwright install chromium
node tools/balance.mjs --runs 4             # everything: about 25 minutes
node tools/balance.mjs --runs 4 --only 9    # one operation, all difficulties and the fleet
node tools/balance.mjs --quick --taken      # Captain only, with where the damage came from
```

## The test pilot

The flagship is flown by the same AI as enemy captains, at Captain grade, with three additions so it plays more like a person (`__sim.fight` in `index.html`):

- it picks targets: lattice nodes first, then whoever is attacking a convoy or a station, then the nearest hostile (the enemy lead counts as further off, so escorts get cleared);
- it uses officer commands (keys 5–9) when they are ready, once the hull is under 85% or a shield facing is under half;
- the save it flies from has no upgrades, trophies or hired officers, and a fresh crew.

It does not dodge warnings, juggle power by hand, ram, or retreat to repair, so a human captain with an upgraded ship should do better. The halberd suffers most: the AI rarely lines up its spinal lance, so treat its numbers as a floor.

## Targets

| Fight | AI pilot, solo, Captain | With a fleet of three |
| --- | --- | --- |
| Regular story operations | 55–85% | — |
| Act finales (bosses) | 15–40% | 70–100% |

Ensign should be clearly easier and Admiral clearly harder; Admiral finales are meant for an upgraded fleet.

## Results

Win rates for the AI pilot. *Captain* is the average over the four Navy hulls, flying alone.

| Op | Operation | Captain | Bastion · Halberd · Sabre · Warden | Ensign | Admiral | Fleet of three | Typical length |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Distress at Kestrel | 100% | 100 · 100 · 100 · 100 | | | | 1:40 |
| 2 | The Cinder Wake | 81% | 100 · 50 · 100 · 75 | | | | 4:10 |
| 3 | The Widow's Toll | 88% | 100 · 50 · 100 · 100 | | | | 1:20 |
| 8 | The Pyre at Grimhold (Act I finale) | 25% | 50 · 50 · 0 · 0 | 56% | 19% | 100% | 3:50 |
| 4 | Ghost Frequency | 81% | 75 · 50 · 100 · 100 | | | | 1:30 |
| 6 | The Quiet Relay | 50% | 75 · 25 · 50 · 50 | | | | 2:20 |
| 9 | The Arbiter (Act II finale) | 13% | 25 · 0 · 25 · 0 | 50% | 0% | 75% | 3:20 |
| 5 | The First Bloom | 81% | 100 · 50 · 100 · 75 | | | | 1:20 |
| 7 | Exodus at Nex | 75% | 100 · 0 · 100 · 100 | | | | 1:40 |
| 10 | Mother of the Bloom (Act III finale) | 25% | 50 · 25 · 25 · 0 | 50% | 0% | 100% | 3:55 |

By hull, over the seven regular operations: Bastion 93%, Sabre 93%, Warden 86%, Halberd 46%.

## What changed in this pass

Before it, the AI pilot won no boss fight on any difficulty, even with a fleet, and lost every multi-ship operation (2, 6 and 7) in most hulls. Most of the damage came from supporting ships, which hit as hard as the ships they escorted.

- **Supporting ships hit at 40%.** Wingmen, reinforcements and boss adds now deal 40% of their class's damage unless the encounter sets `dmg` (`crew/fleet-controller.js`). Leads deal full damage unless the encounter says otherwise.
- **Story leads:** Sable 85% hull, 75% damage; VIGIL-4 55% damage and VIGIL-7 a Commander-grade AI; the Choir 85% hull, 75% damage.
- **Bosses** (`crew/ships.js`, `crew/campaign-data.js`):

  | Boss | Hull | Shields | Other | Damage | Adds |
  | --- | --- | --- | --- | --- | --- |
  | Pyre | 9,500 → 5,000 | 950 → 760 | | 38% | 25% |
  | Arbiter | 7,000 → 3,300 | 1,300 → 900 | shield regen 60 → 40, beams 120 → 95 dps, Judgement lance 800 → 600 dps | 38% | 25% |
  | Bloom-Mother | 8,500 → 4,500 | 760 → 640 | regrowth 26 → 12 a second, ×2.5 → ×1.8 in her last phase (×1.2 if the Arbiter's core was salvaged) | 34% | 25% |

- **Warnings:** the inferno salvo, Judgement lance and spore storm charge for 2.6 seconds, with a warning, before they fire.

Story effects and front effects on the bosses (clans answering Halloran, lattice strength, brood size, Ash Fleet escort) are unchanged.

## Still to check by hand

- Bosses solo on Captain with a typical Act I, II and III ship: a few upgrades, a hired officer or two.
- The Halberd's numbers, flown by a person.
- Station missions, contracts and the new defence and pursuit missions are not in the automated run yet: they are first-pass numbers.

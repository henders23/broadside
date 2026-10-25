# Art and voice still to make

The game picks these files up automatically once they exist: each portrait is drawn over the character's badge, and each voice clip plays when its transmission opens (and stops when it closes). Until then the characters show an initials or faction badge and Harlan's transmissions are text only. They could not be generated in this pass: the ElevenLabs account had run out of credits.

## Portraits

Save as WebP, 768 × 960 (4:5), in `img/commanders/` with the file name given. They should match the existing painted portraits (`vex.webp`, `thorne.webp`, `img/admiral-harlan.webp`): photorealistic, cinematic, chest-up, on a dark starship set, with black Navy uniforms and gold shoulder boards for Navy officers.

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

One MP3 per transmission in `voice/`, named `harlan-<operation>.mp3` (operations 1–9; the act briefings are `harlan-act1.mp3` to `harlan-act3.mp3`, and the ending is `harlan-end.mp3`). The text is in `NARRATIVE` (and `ACTS[].briefing`) in `crew/campaign-data.js`. The voice should be an older British or mid-Atlantic man: measured, weary, authoritative, warm underneath.

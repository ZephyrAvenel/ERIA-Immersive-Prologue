# Rapport INE-024 — Ajout du PACK-006 “La Métamorphose”

## Résumé

La mission ajoute **PACK-006 — La Métamorphose** comme nouvelle œuvre immersive autonome de l’INE.

Le pack est intégré avec :

- un dossier autonome `packs/pack-006-la-metamorphose/` ;
- un manifeste `pack.json` au format `ine-narrative-pack` ;
- une entrée de registre après PACK-005 ;
- la route canonique `/oeuvres/la-metamorphose/` via le routage générique existant ;
- les PNG originaux conservés ;
- les WebP optimisés utilisés par le moteur ;
- une documentation dédiée ;
- des tests d’intégration et e2e adaptés.

## Source visuelle

Source fournie :

`https://drive.google.com/drive/folders/1XnpYIlat7pLJqozGDA9s3P-H8pjaViZ1`

Le dossier public Google Drive a été inspecté via la vue embarquée Drive. Il exposait initialement **12 fichiers PNG**, alors que la mission annonçait **13 images**.

Une image complémentaire a ensuite été fournie pour `scene-06` — **Tu as changé.** — et intégrée dans le même pack.

Une planche de contrôle visuelle a été produite :

`reports/INE-024_drive_contact_sheet.png`

## Mapping des images

| Fichier Drive original | Nom officiel | Dimensions | Poids PNG | Poids WebP |
| --- | --- | ---: | ---: | ---: |
| `file_00000000fa7481f49cfa58b81f61e5df.png` | `00-couverture-la-metamorphose.png` | 1536×1024 | 2 376 048 | 223 466 |
| `file_00000000546c81f4b806977eede43915.png` | `01-le-monde-des-chenilles.png` | 1672×941 | 2 211 170 | 201 974 |
| `file_00000000800c820cb1399934c7921f80.png` | `02-les-regards-qui-nous-definissent.png` | 1536×1024 | 2 736 382 | 320 118 |
| `file_00000000613481f4a21c55fcc42f73f6.png` | `03-l-appel-interieur.png` | 1536×1024 | 2 623 084 | 271 254 |
| `file_00000000eee8824393ee35c75e6c82df.png` | `04-entrer-dans-le-cocon.png` | 1536×1024 | 2 658 270 | 288 516 |
| `file_000000005c008243bd0c9dbd850a064c.png` | `05-resister-a-l-ancien-recit.png` | 1448×1086 | 2 646 835 | 305 506 |
| Image jointe INE-024 complémentaire | `06-tu-as-change.png` | 1280×853 | 1 715 020 | 198 558 |
| `file_000000006cf881f4a149909ad1806205.png` | `07-les-ailes-invisibles.png` | 1672×941 | 2 632 670 | 317 058 |
| `file_00000000e0e08246957b08fb368d8079.png` | `08-les-relations-qui-evoluent.png` | 1536×1024 | 2 698 756 | 289 252 |
| `file_00000000741c8243b3e9feb24ec75600.png` | `09-devenir-pleinement-soi.png` | 1536×1024 | 2 546 019 | 277 946 |
| `file_000000002d6481f49c9a98d0a309e9de.png` | `10-veiller-ensemble-sur-les-recits-vivants.png` | 1536×1024 | 2 616 891 | 295 586 |
| `file_00000000f2a881f486eab1609d3a28fe.png` | `11-epilogue-le-voyage-continue.png` | 1536×1024 | 2 722 853 | 317 848 |
| `file_000000000e9481f9bbe8ac420cb23ce5.png` | `12-cloture-un-cycle-des-infinis-possibles.png` | 1536×1024 | 2 666 179 | 321 020 |

Poids total PNG : **32 850 177 octets**  
Poids total WebP : **3 628 102 octets**

## Écart constaté

Lors de l’intégration initiale, l’image attendue pour :

`06 — Scène 6 — “Tu as changé.”`

n’était pas présente dans le dossier Drive public.

Décision initiale :

- conserver la scène 06 dans le parcours ;
- ne pas inventer ni réutiliser une image non officielle ;
- laisser `scene-06` sans champ `image` dans `pack.json`, ce que le renderer narratif supporte déjà ;
- documenter explicitement l’écart dans ce rapport et dans le README du pack.

Correction complémentaire :

- l’image officielle jointe à la mission a été vérifiée visuellement ;
- le PNG original a été conservé sous `assets/images/originals/06-tu-as-change.png` ;
- le WebP optimisé a été généré sous `assets/images/06-tu-as-change.webp` ;
- `scene-06` pointe maintenant vers cette image.

## Fichiers créés

- `packs/pack-006-la-metamorphose/pack.json`
- `packs/pack-006-la-metamorphose/README.md`
- `packs/pack-006-la-metamorphose/assets/images/originals/*.png`
- `packs/pack-006-la-metamorphose/assets/images/*.webp`
- `tests/integration/narrative-pack/pack-006.test.mjs`
- `reports/INE-024_drive_contact_sheet.png`
- `reports/INE-024_PACK_006_LA_METAMORPHOSE_REPORT.md`

## Fichiers modifiés

- `packs/index.json`
- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `tests/integration/editorial-model/editorial-model.test.mjs`
- `tests/integration/polarity-pack/pack-002.test.mjs`
- `tests/integration/narrative-pack/pack-004.test.mjs`
- `tests/integration/narrative-pack/pack-005.test.mjs`

## Choix techniques

- Réutilisation du renderer narratif existant (`ine-narrative-pack`).
- Aucun nouveau composant.
- Aucun changement de route existante.
- Ajout du pack via le registre `packs/index.json`.
- CSS responsive ciblé exclusivement via `.player[data-pack-id="pack-006"]`.
- Affichage mobile/tablette en `object-fit: contain`, cohérent avec les images contenant du texte intégré.

## Validation responsive

Le CSS PACK-006 cible mobile/tablette afin de préserver :

- la lisibilité des images complètes ;
- l’absence de superposition entre image, titre et texte ;
- l’empilement propre des boutons ;
- le comportement autonome du pack.

Vérifications demandées : 360 px, 390 px, 430 px, tablette, desktop.

Statut : validé par le scénario navigateur réel e2e. Le test couvre la bibliothèque, la route directe PACK-006, les checkpoints mobiles du parcours, la scène sans image dédiée et les boutons de fin.

## Tests

Résultats :

- `npm.cmd run typecheck` : OK ;
- `npm.cmd run test:unit` : OK — 64 tests ;
- `npm.cmd run test:integration` : OK — 27 tests ;
- `npm.cmd run test:coverage` : OK — 91 tests, couverture globale 90,70 % lignes / 83,66 % branches / 92,22 % fonctions ;
- `npm.cmd run build` : OK hors sandbox Windows ;
- `npm.cmd run test:ci` : OK hors sandbox Windows, avec e2e sauté proprement par défaut faute de `CHROME_PATH` ;
- `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm.cmd run test:e2e` : OK — scénario navigateur réel exécuté, 1 test passé.

Note : le build et `test:ci` doivent être lancés hors sandbox dans cet environnement local, car Vite/esbuild rencontre sinon un blocage Windows “Access is denied” en lisant la configuration.

## Indépendance des packs

PACK-001, PACK-002, PACK-003, PACK-004 et PACK-005 ne sont pas modifiés dans leurs contenus. Les ajustements de tests et de registre reflètent uniquement l’ajout de PACK-006 comme sixième œuvre.

## Recommandation

Le cycle visuel est désormais complet : les 13 étapes disposent d’une image officielle ou d’une couverture/clôture officielle. Toute évolution future devra préserver cette nomenclature canonique.

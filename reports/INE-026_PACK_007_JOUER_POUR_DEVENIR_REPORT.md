# Rapport INE-026 — PACK-007 “Jouer pour devenir”

## Résumé

La mission INE-026 ajoute `PACK-007 — Jouer pour devenir` comme septième œuvre immersive autonome de l’INE.

Le pack est intégré comme un parcours narratif contemplatif, proche des packs PACK-004, PACK-005 et PACK-006. La couverture est utilisée comme première étape immersive, ce qui produit un parcours de 14 étapes : couverture + 13 scènes.

Route canonique :

`/oeuvres/jouer-pour-devenir/`

## ZIP et images

ZIP source :

`C:/Users/LeoBe/Downloads/Pack narratif - 007 - jouer pour devenir.zip`

Contrôles effectués :

- 14 fichiers PNG détectés ;
- aucun chemin dangereux détecté dans l’archive ;
- extraction effectuée dans un dossier temporaire contrôlé ;
- PNG originaux conservés dans `packs/pack-007-jouer-pour-devenir/assets/images/originals/` ;
- WebP optimisés générés dans `packs/pack-007-jouer-pour-devenir/assets/images/` ;
- aucune image source n’a été recadrée ou modifiée destructivement.

Planche de contrôle :

`reports/INE-026_PACK_007_CONTACT_SHEET.jpg`

Métadonnées de conversion :

`reports/INE-026_PACK_007_IMAGE_MAPPING.json`

Poids total PNG : 35 196 522 octets.

Poids total WebP : 4 138 366 octets.

## Mapping image par image

| Source ZIP | Nom PNG conservé | Nom WebP utilisé | Dimensions |
| --- | --- | --- | --- |
| `00 — Couverture.png` | `00-couverture-jouer-pour-devenir.png` | `00-couverture-jouer-pour-devenir.webp` | 1536×1024 |
| `01 — Le premier terrain d’exploration.png` | `01-premier-terrain-exploration.png` | `01-premier-terrain-exploration.webp` | 1536×1024 |
| `02 — Quand l’imagination transforme la réalité.png` | `02-imagination-transforme-realite.png` | `02-imagination-transforme-realite.webp` | 1536×1024 |
| `03 — Le droit d’essayer.png` | `03-droit-dessayer.png` | `03-droit-dessayer.webp` | 1536×1024 |
| `04 — Jouer avec les autres.png` | `04-jouer-avec-les-autres.png` | `04-jouer-avec-les-autres.webp` | 1536×1024 |
| `05 — Les récits que nous construisons.png` | `05-recits-que-nous-construisons.png` | `05-recits-que-nous-construisons.webp` | 1536×1024 |
| `06 — Les récits empêchés.png` | `06-recits-empeches.png` | `06-recits-empeches.webp` | 1536×1024 |
| `07 — Retrouver le jeu à l’âge adulte.png` | `07-retrouver-le-jeu-age-adulte.png` | `07-retrouver-le-jeu-age-adulte.webp` | 1536×1024 |
| `08.png` | `08-jeu-comme-ecologie-du-vivant.png` | `08-jeu-comme-ecologie-du-vivant.webp` | 1536×1024 |
| `09.png` | `09-apprendre-explorer-creer-devenir.png` | `09-apprendre-explorer-creer-devenir.webp` | 1536×1024 |
| `10.png` | `10-jeu-tisse-liens-entre-temps.png` | `10-jeu-tisse-liens-entre-temps.webp` | 1536×1024 |
| `11.png` | `11-continuer-a-jouer.png` | `11-continuer-a-jouer.webp` | 1536×1024 |
| `12.png` | `12-et-apres.png` | `12-et-apres.webp` | 1536×1024 |
| `13.png` | `13-le-jeu-continue-avec-vous.png` | `13-le-jeu-continue-avec-vous.webp` | 1536×1024 |

Les images 12 et 13 ont bien été conservées comme deux scènes distinctes :

- `12-et-apres.webp` : transition / bilan ;
- `13-le-jeu-continue-avec-vous.webp` : clôture finale.

## Fichiers créés

- `packs/pack-007-jouer-pour-devenir/pack.json`
- `packs/pack-007-jouer-pour-devenir/README.md`
- `packs/pack-007-jouer-pour-devenir/assets/images/*.webp`
- `packs/pack-007-jouer-pour-devenir/assets/images/originals/*.png`
- `tests/integration/narrative-pack/pack-007.test.mjs`
- `reports/INE-026_PACK_007_CONTACT_SHEET.jpg`
- `reports/INE-026_PACK_007_IMAGE_MAPPING.json`
- `reports/INE-026_PACK_007_JOUER_POUR_DEVENIR_REPORT.md`

## Fichiers modifiés

- `packs/index.json`
- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `tests/integration/editorial-model/editorial-model.test.mjs`
- `tests/integration/polarity-pack/pack-002.test.mjs`
- `tests/integration/narrative-pack/pack-004.test.mjs`
- `tests/integration/narrative-pack/pack-005.test.mjs`
- `tests/integration/narrative-pack/pack-006.test.mjs`

## Choix techniques

### Parcours

Le pack utilise le format existant `ine-narrative-pack`.

La couverture est déclarée comme `scene-00`, conformément au comportement des packs narratifs récents. Le parcours affiche donc `Scène 1 / 14` à `Scène 14 / 14`.

### Registre

`PACK-007` est ajouté après `PACK-006` dans `packs/index.json`.

La bibliothèque découvre le pack via le registre, sans route codée en dur dans le moteur.

### Responsive

Un ajustement CSS mobile/tablette est ajouté uniquement pour :

`.player[data-pack-id="pack-007"]`

Objectifs du réglage :

- afficher les images en `object-fit: contain` ;
- éviter le rognage gênant des textes intégrés aux images ;
- maintenir une image lisible sur mobile ;
- conserver les textes narratifs complets ;
- empiler les boutons sur mobile ;
- éviter les chevauchements avec la navigation bibliothèque.

## Tests et validations

Tests exécutés :

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK, 64 tests passés
- `npm.cmd run test:integration` : OK, 31 tests passés
- `npm.cmd run test:coverage` : OK, 95 tests passés, seuils respectés
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK
- `npm.cmd run test:e2e` sans `CHROME_PATH` : sauté proprement car Chrome n’est pas auto-détecté localement
- `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm.cmd run test:e2e` : OK, 1 test navigateur réel passé

Le test navigateur couvre :

- bibliothèque à 7 œuvres ;
- présence de `Jouer pour devenir` ;
- route `/oeuvres/jouer-pour-devenir/` ;
- parcours PACK-007 de 14 étapes ;
- images WebP chargées ;
- rendu mobile sans débordement horizontal ;
- image finale `13-le-jeu-continue-avec-vous.webp` ;
- boutons finaux empilés et accessibles.

## Préservation des packs existants

Aucun fichier de contenu ou asset des packs PACK-001 à PACK-006 n’a été modifié directement.

Les changements dans les tests existants se limitent à l’attente globale du registre, qui contient désormais un septième pack.

## Limites

Les visuels PACK-007 sont au format horizontal 1536×1024 et contiennent du texte intégré. Sur mobile, le rendu privilégie donc la lisibilité complète des images plutôt qu’un recadrage immersif plein cadre.

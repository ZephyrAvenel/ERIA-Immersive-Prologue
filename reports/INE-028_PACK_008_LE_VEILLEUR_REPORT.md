# Rapport INE-028 — PACK-008 “Le Veilleur”

## Résumé

La mission INE-028 ajoute `PACK-008 — Le Veilleur` comme huitième œuvre immersive autonome de l’INE.

Le pack propose un parcours contemplatif intitulé `Du prophète au veilleur`, consacré au passage de la voix qui annonce vers la présence qui veille.

Route canonique :

`/oeuvres/le-veilleur/`

## ZIP et images

ZIP source :

`C:/Users/LeoBe/Downloads/Pack narratif 008 - Du prophète au veilleur.zip`

Contrôles effectués :

- 12 fichiers PNG détectés ;
- aucun chemin dangereux détecté ;
- extraction effectuée dans un dossier temporaire contrôlé ;
- PNG originaux conservés dans `packs/pack-008-le-veilleur/assets/images/originals/` ;
- WebP optimisés générés dans `packs/pack-008-le-veilleur/assets/images/` ;
- aucune image source n’a été recadrée ou modifiée destructivement.

Planche de contrôle :

`reports/INE-028_PACK_008_CONTACT_SHEET.jpg`

Métadonnées de conversion :

`reports/INE-028_PACK_008_IMAGE_MAPPING.json`

Poids total PNG : 29 702 388 octets.

Poids total WebP : 2 678 352 octets.

## Point d’attention sur `010.png` et `011.png`

Le ZIP contient les fichiers `010.png` et `011.png`.

Un tri alphabétique simple placerait ces fichiers avant `02.png`, ce qui casserait l’ordre narratif.

L’intégration utilise donc un mapping explicite :

- `010.png` → `10-transmettre.png`
- `011.png` → `11-cloture-devenir-veilleur.png`

## Mapping image par image

| Source ZIP | Nom PNG conservé | Nom WebP utilisé | Dimensions |
| --- | --- | --- | --- |
| `00.png` | `00-couverture-le-veilleur.png` | `00-couverture-le-veilleur.webp` | 1536×1024 |
| `01.png` | `01-la-voix.png` | `01-la-voix.webp` | 1448×1086 |
| `02.png` | `02-le-prophete.png` | `02-le-prophete.webp` | 1536×1024 |
| `03.png` | `03-le-poete.png` | `03-le-poete.webp` | 1448×1086 |
| `04.png` | `04-le-bruit-du-monde.png` | `04-le-bruit-du-monde.webp` | 1448×1086 |
| `05.png` | `05-le-silence.png` | `05-le-silence.webp` | 1448×1086 |
| `06.png` | `06-le-veilleur.png` | `06-le-veilleur.webp` | 1448×1086 |
| `07.png` | `07-les-recits-vivants.png` | `07-les-recits-vivants.webp` | 1448×1086 |
| `08.png` | `08-le-monde-commun.png` | `08-le-monde-commun.webp` | 1536×1024 |
| `09.png` | `09-la-plume-et-l-ia.png` | `09-la-plume-et-l-ia.webp` | 1536×1024 |
| `010.png` | `10-transmettre.png` | `10-transmettre.webp` | 1672×941 |
| `011.png` | `11-cloture-devenir-veilleur.png` | `11-cloture-devenir-veilleur.webp` | 1448×1086 |

## Fichiers créés

- `packs/pack-008-le-veilleur/pack.json`
- `packs/pack-008-le-veilleur/README.md`
- `packs/pack-008-le-veilleur/assets/images/*.webp`
- `packs/pack-008-le-veilleur/assets/images/originals/*.png`
- `tests/integration/narrative-pack/pack-008.test.mjs`
- `reports/INE-028_PACK_008_CONTACT_SHEET.jpg`
- `reports/INE-028_PACK_008_IMAGE_MAPPING.json`
- `reports/INE-028_PACK_008_LE_VEILLEUR_REPORT.md`

## Fichiers modifiés

- `packs/index.json`
- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `tests/integration/editorial-model/editorial-model.test.mjs`
- `tests/integration/polarity-pack/pack-002.test.mjs`
- `tests/integration/narrative-pack/pack-004.test.mjs`
- `tests/integration/narrative-pack/pack-005.test.mjs`
- `tests/integration/narrative-pack/pack-006.test.mjs`
- `tests/integration/narrative-pack/pack-007.test.mjs`

## Choix techniques

Le pack utilise le format existant `ine-narrative-pack`.

La couverture est la première étape immersive du parcours, ce qui produit 12 étapes affichées : `Scène 1 / 12` à `Scène 12 / 12`.

Le pack est ajouté au registre après `PACK-007`, avec le slug `le-veilleur`.

## Responsive

Un réglage CSS mobile/tablette est ajouté uniquement pour :

`.player[data-pack-id="pack-008"]`

Objectifs :

- préserver les textes intégrés dans les images ;
- afficher les visuels en `object-fit: contain` ;
- éviter les rognages gênants ;
- conserver les textes narratifs complets ;
- empiler les boutons sur mobile ;
- éviter l’overflow horizontal.

## Préservation des packs existants

Aucun contenu, manifeste ou asset des packs PACK-001 à PACK-007 n’a été modifié directement.

Les modifications de tests existants concernent uniquement l’attente globale du registre, désormais composé de 8 œuvres.

## Validations

Commandes exécutées :

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK, 64 tests passés
- `npm.cmd run test:integration` : OK, 35 tests passés
- `npm.cmd run test:coverage` : OK, 99 tests passés et seuils respectés
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK
- `npm.cmd run test:e2e` sans `CHROME_PATH` : sauté proprement car Chrome n’est pas auto-détecté localement
- `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm.cmd run test:e2e` : OK, 1 test navigateur réel passé

Le scénario navigateur vérifie :

- bibliothèque à 8 œuvres ;
- présence de `Le Veilleur` ;
- route `/oeuvres/le-veilleur/` ;
- parcours PACK-008 de 12 étapes ;
- images WebP chargées ;
- mapping final `10-transmettre.webp` et `11-cloture-devenir-veilleur.webp` ;
- rendu mobile sans débordement horizontal ;
- boutons finaux empilés et accessibles.

## Limites

Les visuels contiennent du texte intégré et présentent plusieurs ratios. Le rendu mobile privilégie donc la lisibilité complète des images plutôt qu’un recadrage plein écran.

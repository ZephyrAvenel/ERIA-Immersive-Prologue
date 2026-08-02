# INE-020 — Correction mobile PACK-004 scènes 9 et 11

## Résumé

La mission corrige le rendu mobile/tablette du PACK-004 — La Voie du Milieu, avec une attention particulière aux scènes longues :

- Scène 9 / 11 — « Au seuil d’un monde vivant »
- Scène 11 / 11 — « Les récits vivants continuent… »

Le correctif reste limité au PACK-004 et ne modifie ni les textes, ni les images, ni les routes, ni le registre.

## Cause précise

Le correctif INE-019 avait bien remplacé le comportement de rognage par un affichage `object-fit: contain`, mais le style mobile utilisait aussi `height: auto` sur les images du PACK-004.

Comme les visuels du PACK-004 sont horizontaux au format 3:2, l’image complète retombait mécaniquement à une hauteur proche de la hauteur naturelle calculée par la largeur mobile. Sur les scènes très longues, cette image devenait visuellement trop proche d’un bandeau et la zone finale d’actions manquait de respiration.

## Solution retenue

Pour PACK-004 uniquement, en mobile/tablette :

- le player peut s’étendre verticalement (`height: auto`) au lieu de contraindre tout le contenu dans `100dvh` ;
- la scène commence en haut du flux plutôt que de chercher à remplir la grille ;
- la zone média retrouve une hauteur stable avec `clamp(14rem, 42dvh, 24rem)` ;
- l’image conserve `object-fit: contain` pour éviter le rognage ;
- le footer revient sur une colonne en mobile/tablette ;
- les boutons restent empilés et étirés en largeur sur mobile/tablette.

Cette approche conserve les textes complets et évite de rogner les images, tout en redonnant une présence visuelle plus lisible aux scènes longues.

## Fichiers modifiés

- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `reports/INE-020_PACK_004_MOBILE_SCENES_9_11_REPORT.md`

## Fichiers non modifiés

- PACK-001
- PACK-002
- PACK-003
- Images
- Routes
- Registre des packs
- Manifestes

## Vérifications ciblées

Le test navigateur existant du PACK-004 a été renforcé :

- conservation de `object-fit: contain` ;
- absence d’overflow horizontal ;
- boutons de navigation dans la largeur du viewport ;
- contenu dans la largeur du viewport ;
- scènes 9 et 11 avec hauteur média/image minimale de 320 px en viewport mobile 360 × 800 ;
- boutons finaux tactiles et empilés.

## Validations

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK — 64 tests
- `npm.cmd run test:integration` : OK — 19 tests
- `npm.cmd run test:coverage` : OK — 83 tests, seuils respectés
- `npm.cmd run build` : OK
- `npm.cmd run test:e2e` : sauté proprement, Chrome local absent
- Vérification navigateur intégrée : OK

## Vérifications responsive intégrées

Route testée :

- `/ERIA-Immersive-Prologue/oeuvres/voie-du-milieu/`

Résultats mesurés sur les scènes 9 et 11 :

| Viewport | Scène 9 — média/image | Scène 11 — média/image | Boutons | Overflow |
| --- | ---: | ---: | --- | --- |
| 360 × 800 | 336 px | 336 px | empilés, tactiles | OK |
| 390 × 844 | 354 px | 354 px | empilés, tactiles | OK |
| 430 × 932 | 384 px | 384 px | empilés, tactiles | OK |
| 768 × 1024 | 384 px | 384 px | empilés, tactiles | OK |
| 1280 × 800 | rendu desktop conservé | rendu desktop conservé | horizontal desktop | OK |

Le pictogramme Bibliothèque ne chevauche pas les contrôles sur les scènes vérifiées.

## Branche

`agent/ine-020-pack-004-mobile-scenes-9-11`

## Note de base Git

Au moment de la mission, INE-019 n’était pas encore fusionnée dans `main`. La branche INE-020 a donc été créée à partir de `agent/ine-019-pack-004-image-contain-mobile` afin de conserver le correctif `object-fit: contain` déjà nécessaire au PACK-004.

Si INE-019 est fusionnée séparément avant INE-020, la PR INE-020 pourra être rebasée ou ciblée vers `main`.

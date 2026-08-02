# INE-021 — Rééquilibrage mobile texte/images PACK-004

## Résumé

Cette mission affine le rendu mobile/tablette du PACK-004 — La Voie du Milieu après les corrections INE-019 et INE-020.

Le correctif conserve les textes narratifs complets et les images d’origine, tout en rééquilibrant l’espace entre :

- image ;
- titre ;
- texte narratif ;
- progression ;
- boutons.

Le ciblage reste strictement limité à :

```css
.player[data-pack-id="pack-004"]
```

## Problème constaté

Après INE-020, les scènes longues affichaient des images plus lisibles, mais la hauteur `42dvh` associée aux grands titres/textes mobiles rendait plusieurs écrans trop chargés verticalement.

Sur smartphone, cela pouvait donner l’impression que l’image dominait l’écran ou venait empiéter visuellement sur le titre et le début du texte.

## Cause CSS exacte

Le bloc mobile PACK-004 conservait :

- une image à `clamp(14rem, 42dvh, 24rem)` ;
- les tailles globales de titre/texte, pensées pour l’ensemble du player ;
- un interligne narratif assez ample.

Ces valeurs étaient correctes pour éviter l’effet bandeau, mais trop généreuses une fois combinées aux scènes longues du PACK-004.

## Solution retenue

En mobile/tablette, pour PACK-004 uniquement :

- image rééquilibrée à `clamp(12rem, 34dvh, 19rem)` ;
- maintien de `object-fit: contain` ;
- titre réduit à `clamp(1.75rem, 7vw, 2.55rem)` ;
- texte réduit à `clamp(0.98rem, 3.75vw, 1.12rem)` ;
- interligne texte fixé à `1.42` ;
- espacement scène ajusté via `clamp(0.55rem, 1.4dvh, 0.85rem)` ;
- footer et boutons mobiles PACK-004 conservés en colonne.

L’image reste dans le flux normal du document. Aucun `overflow: hidden` n’est ajouté pour masquer du contenu narratif.

## Fichiers modifiés

- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `reports/INE-021_PACK_004_MOBILE_TEXT_IMAGE_BALANCE_REPORT.md`

## Fichiers non modifiés

- PACK-001
- PACK-002
- PACK-003
- Images
- Routes
- Registre des packs
- Manifestes
- Architecture globale du player

## Tests e2e renforcés

Le test navigateur du PACK-004 vérifie désormais :

- `object-fit: contain` ;
- absence d’overflow horizontal ;
- largeur correcte des contrôles ;
- image visible ;
- hauteur image mobile équilibrée ;
- absence de chevauchement entre média, titre et texte ;
- boutons finaux empilés.

## Scènes à vérifier

Prioritaires :

- Scène 1 / 11 — La Voie du Milieu
- Scène 3 / 11 — Le monde des oppositions
- Scène 4 / 11 — Les récits qui enferment
- Scène 5 / 11 — Entre deux récits, un choix ?
- Scène 6 / 11 — La voie du milieu
- Scène 7 / 11 — La présence au-delà des récits
- Scène 8 / 11 — Le choix qui façonne le monde
- Scène 9 / 11 — Au seuil d’un monde vivant
- Scène 11 / 11 — Les récits vivants continuent…

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

Scènes vérifiées :

- 1, 3, 4, 5, 6, 7, 8, 9 et 11

Résultats :

| Viewport | Hauteur image | Titre | Texte | Chevauchement média/titre/texte | Boutons | Pictogramme Bibliothèque |
| --- | ---: | --- | --- | --- | --- | --- |
| 360 × 800 | 272 px | 28 px | 15.68 px / 22.27 px | aucun | empilés, tactiles | aucun chevauchement |
| 390 × 844 | 287 px | 28 px | 15.68 px / 22.27 px | aucun | empilés, tactiles | aucun chevauchement |
| 430 × 932 | 304 px | 30.1 px | 16.13 px / 22.90 px | aucun | empilés, tactiles | aucun chevauchement |
| 768 × 1024 | 304 px | 40.8 px | 17.92 px / 25.45 px | aucun | empilés, tactiles | aucun chevauchement |
| 1280 × 800 | rendu desktop conservé | rendu desktop | rendu desktop | aucun | horizontal desktop | aucun chevauchement |

Les scènes longues 9 et 11 restent scrollables lorsque nécessaire, sans masquer le contenu ni couper le texte.

## Branche

`agent/ine-021-pack-004-mobile-text-image-balance`

## Limites

Le PACK-004 contient des images horizontales 3:2 avec du texte typographique intégré. Sur smartphone, il existe donc un compromis naturel entre hauteur d’image, lisibilité de la typographie intégrée et place disponible pour le texte DOM. Le correctif privilégie un équilibre stable plutôt qu’un affichage maximal de l’image.

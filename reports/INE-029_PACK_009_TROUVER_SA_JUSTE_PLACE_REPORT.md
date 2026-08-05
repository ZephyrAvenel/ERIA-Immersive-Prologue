# INE-029 — PACK-009 “Trouver sa juste place”

## Résumé

PACK-009 — **Trouver sa juste place** a été intégré comme œuvre immersive autonome de l’INE.

Le pack est enregistré en 9e position dans la bibliothèque, avec la route publique :

`/oeuvres/trouver-sa-juste-place/`

Le pack active le layout optionnel :

`image-then-text`

Ce mode permet de contempler chaque image entière avant de lire le texte narratif complet.

## Images intégrées

ZIP source :

`C:\Users\LeoBe\Downloads\Pack narratif _  juste place.zip`

Le ZIP contenait bien 11 PNG. Aucun chemin dangereux n’a été détecté.

Planche de contrôle :

`reports/INE-029_PACK_009_CONTACT_SHEET.jpg`

Mapping technique :

`reports/INE-029_PACK_009_IMAGE_MAPPING.json`

Poids total PNG : 26 740 565 octets.

Poids total WebP : 2 654 364 octets.

Les dimensions WebP correspondent aux dimensions des PNG originaux. Aucun recadrage destructif n’a été effectué.

## Mapping appliqué

| Source ZIP | PNG conservé | WebP utilisé | Rôle |
| --- | --- | --- | --- |
| `file_00000000076c81f48773b4ba3a62bfbb.png` | `00-couverture-trouver-sa-juste-place.png` | `00-couverture-trouver-sa-juste-place.webp` | Couverture |
| `file_0000000005e881f49957a70fa0337fa0.png` | `01-les-roles-que-nous-recevons.png` | `01-les-roles-que-nous-recevons.webp` | Les rôles que nous recevons |
| `file_00000000e3c081f4a459ecae231193f9.png` | `02-le-besoin-d-etre-valide.png` | `02-le-besoin-d-etre-valide.webp` | Le besoin d’être validé |
| `file_00000000e38081f4914674c0129ec7a8.png` | `03-deposer-les-personnages.png` | `03-deposer-les-personnages.webp` | Déposer les personnages |
| `file_0000000044f481f4bbf630f1151d091e.png` | `04-la-juste-distance.png` | `04-la-juste-distance.webp` | La juste distance |
| `file_00000000a3b881f48609ab25a6e14322.png` | `05-la-place-se-construit.png` | `05-la-place-se-construit.webp` | La place se construit |
| `file_000000004fbc8246b7956ef7dec0e5df.png` | `06-les-gestes-qui-transforment.png` | `06-les-gestes-qui-transforment.webp` | Les gestes qui transforment |
| `file_00000000da508246bf088631145344d2.png` | `07-habiter-un-monde-commun.png` | `07-habiter-un-monde-commun.webp` | Habiter un monde commun |
| `file_00000000a68081f49f4d88b50ae03477.png` | `08-reecrire-son-recit.png` | `08-reecrire-son-recit.webp` | Réécrire son récit |
| `file_00000000506481f4b7d6a4fedf60ccd9.png` | `09-les-recits-vivants.png` | `09-les-recits-vivants.webp` | Les récits vivants |
| `file_000000008cf881f4a13ff451e4651299.png` | `10-devenir-presence.png` | `10-devenir-presence.webp` | Devenir présence / clôture |

## Structure créée

- `packs/pack-009-trouver-sa-juste-place/pack.json`
- `packs/pack-009-trouver-sa-juste-place/README.md`
- `packs/pack-009-trouver-sa-juste-place/assets/images/*.webp`
- `packs/pack-009-trouver-sa-juste-place/assets/images/originals/*.png`

## Registre

`packs/index.json` contient désormais 9 œuvres.

PACK-009 est ajouté après PACK-008 :

- id : `pack-009-trouver-sa-juste-place`
- slug : `trouver-sa-juste-place`
- manifest : `pack-009-trouver-sa-juste-place/pack.json`

## Fusion éditoriale finale

Le texte initial évoquait une conclusion plus développée. Pour rester cohérent avec les 11 visuels fournis, la conclusion, “Le chemin continue” et “Devenir présence” ont été fusionnés dans la scène finale :

`scene-10 — Devenir présence`

Aucun texte éditorial fourni n’a été supprimé arbitrairement ; la scène finale rassemble la clôture en une seule étape.

## Mode image-then-text

PACK-009 active :

```json
"layout": "image-then-text"
```

Chaque entrée narrative se joue en deux temps :

1. `Contempler` — image entière en `object-fit: contain` ;
2. `Lire` — texte narratif complet, sans image visible.

Le compteur reste lisible :

- `Scène 3 / 11 — Contempler`
- `Scène 3 / 11 — Lire`

Les anciens packs conservent leur rendu habituel.

## Vérifications responsive

Validé par le scénario navigateur réel :

- bibliothèque à 9 œuvres ;
- route directe PACK-009 ;
- alternance image puis texte ;
- image visible entièrement en phase contemplation ;
- texte complet en phase lecture ;
- boutons accessibles ;
- absence d’overflow horizontal ;
- non-régression des routes existantes.

Largeurs couvertes par les tests e2e existants et le scénario mobile PACK-009 : mobile 390 px, avec conservation des vérifications globales mobile/tablette/desktop du player.

## Validations

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK — 66 tests
- `npm.cmd run test:integration` : OK — 39 tests
- `npm.cmd run test:coverage` : OK — 105 tests, seuils respectés
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK, e2e sauté par défaut faute de Chrome détecté
- `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm.cmd run test:e2e` : OK — 1 test navigateur réel

## Confirmation de non-régression

Les packs PACK-001 à PACK-008 n’ont pas été modifiés directement.

Leur accès reste couvert par les tests d’intégration et le scénario navigateur principal.

## Limites

Le mode `image-then-text` est volontairement minimal : il ajoute une alternance image/texte sans transformer l’architecture du player. Il pourra être réutilisé par de futurs packs si leurs visuels contiennent beaucoup de texte intégré.

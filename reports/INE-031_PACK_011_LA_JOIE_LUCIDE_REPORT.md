# INE-031 — PACK-011 La Joie lucide

## Résumé

Intégration du `PACK-011 — La Joie lucide` comme nouveau pack narratif autonome de l’Immersive Narrative Engine.

Le pack utilise le mode existant `image-then-text` afin de respecter l’expérience :

- **Contempler** : image entière, non rognée ;
- **Lire** : texte complémentaire ;
- **Le Seuil** : question réflexive intégrée au texte Lire ;
- **Continuer** : navigation gérée par le player existant.

## Architecture découverte

Le dépôt utilise les conventions suivantes :

- registre : `packs/index.json` ;
- manifeste de pack narratif : `packs/<pack-id>/pack.json` ;
- format : `ine-narrative-pack` ;
- route publique : dérivée du `slug` du registre, sous `/oeuvres/<slug>/` ;
- images optimisées : `assets/images/*.webp` ;
- originaux conservés : `assets/images/originals/*.png` ;
- validation : `schemas/narrative-pack.schema.json` et `validateNarrativePack` ;
- rendu : `apps/player/src/main.ts` et `packages/renderer/src/index.ts` ;
- layout Contempler/Lire : `layout: "image-then-text"`.

## Pack de référence utilisé

Le pack de référence principal est :

- `packs/pack-010-le-monde-commun/pack.json`

Il expose déjà :

- `layout: "image-then-text"` ;
- une couverture intégrée comme `scene-00` ;
- une alternance `Contempler` / `Lire` ;
- des images en `object-fit: contain` ;
- le retour final vers la bibliothèque.

## Écart assumé avec le prompt

Le prompt indique que la couverture n’est pas une étape narrative.

Dans l’architecture actuelle, les packs `image-then-text` récents exposent toutefois la couverture comme première entrée technique du player (`scene-00`) afin de permettre une entrée contemplative cohérente.

PACK-011 suit donc cette convention :

- `scene-00` : couverture / entrée du pack ;
- `scene-01` à `scene-10` : traversée ;
- `scene-11` : ouverture / clôture.

Le compteur public affiche donc 12 entrées, comme PACK-010, tout en conservant la distinction éditoriale dans le README et ce rapport.

## Fichiers créés

- `packs/pack-011-la-joie-lucide/pack.json`
- `packs/pack-011-la-joie-lucide/README.md`
- `packs/pack-011-la-joie-lucide/assets/images/*.webp`
- `packs/pack-011-la-joie-lucide/assets/images/originals/*.png`
- `tests/integration/narrative-pack/pack-011.test.mjs`
- `reports/INE-031_PACK_011_CONTACT_SHEET.jpg`
- `reports/INE-031_PACK_011_IMAGE_MAPPING.json`
- `reports/INE-031_PACK_011_LA_JOIE_LUCIDE_REPORT.md`

## Fichiers modifiés

- `packs/index.json`
- `tests/e2e/player.test.mjs`
- `tests/integration/editorial-model/editorial-model.test.mjs`
- tests d’intégration existants qui vérifient explicitement l’ordre du registre.

## Assets ajoutés et renommés

Le ZIP `Pack-narratif-joie-lucide.zip` contient 12 PNG :

| Source ZIP | Original conservé | WebP utilisé |
| --- | --- | --- |
| `Couverture.png` | `00-couverture-la-joie-lucide.png` | `00-couverture-la-joie-lucide.webp` |
| `joie-01.png` | `01-la-houle.png` | `01-la-houle.webp` |
| `joie-2.png` | `02-le-droit-a-la-joie.png` | `02-le-droit-a-la-joie.webp` |
| `joie-3.png` | `03-la-fausse-lumiere.png` | `03-la-fausse-lumiere.webp` |
| `joie-4.png` | `04-le-regard-capture.png` | `04-le-regard-capture.webp` |
| `joie-5.png` | `05-les-deux-verites.png` | `05-les-deux-verites.webp` |
| `joie-6.png` | `06-les-dauphins-dans-la-houle.png` | `06-les-dauphins-dans-la-houle.webp` |
| `joie-7.png` | `07-la-frontiere-sensible.png` | `07-la-frontiere-sensible.webp` |
| `joie-8.png` | `08-la-joie-indocile.png` | `08-la-joie-indocile.webp` |
| `joie-9.png` | `09-la-joie-qui-circule.png` | `09-la-joie-qui-circule.webp` |
| `joie-10.png` | `10-la-joie-lucide.png` | `10-la-joie-lucide.webp` |
| `joie-11.png` | `11-le-nouveau-recit.png` | `11-le-nouveau-recit.webp` |

Dimensions préservées : `1024 × 1536`.

Poids total :

- PNG originaux : `27 938 758` octets ;
- WebP optimisés : `2 196 514` octets ;
- WebP le plus lourd : `248 580` octets.

## Conventions suivies

Les noms proposés dans le prompt utilisaient un préfixe `pack-011-*`.

Le dépôt utilise plutôt des noms canoniques courts et descriptifs (`00-couverture-...`, `01-...`). PACK-011 suit donc la convention réelle du dépôt.

## Fonctionnement Contempler / Lire / Le Seuil

PACK-011 active :

```json
"layout": "image-then-text"
```

Chaque scène possède :

- `image` vers un WebP ;
- `imageAlt` accessible ;
- `imageDisplayMode: "contain"` ;
- `text` contenant la couche Lire ;
- une question `LE SEUIL` pour les scènes 01 à 10 ;
- `LE SEUIL FINAL` pour la scène 11.

## Tests ajoutés ou adaptés

Ajout :

- validation du manifeste PACK-011 ;
- validation du layout `image-then-text` ;
- validation des 12 entrées ;
- validation des WebP ;
- validation des PNG originaux ;
- validation de la position 11 dans le registre.

Adaptation :

- bibliothèque e2e à 11 œuvres ;
- vérification de la route `/oeuvres/la-joie-lucide/` ;
- vérification Contempler/Lire ;
- vérification des Seuils ;
- vérification du retour bibliothèque.

## Validations

Validations exécutées après intégration :

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK, 66 tests passés
- `npm.cmd run test:integration` : OK, 47 tests passés
- `npm.cmd run test:coverage` : OK, 113 tests passés, seuils de couverture respectés
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK ; l’e2e intégré au script a été sauté proprement car Chrome n’est pas auto-détecté dans cet environnement
- `$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'; npm.cmd run test:e2e` : OK, test navigateur réel passé

## État Git final

- Branche : `agent/ine-031-pack-011-la-joie-lucide`
- Commit : indiqué dans le message de livraison final
- Push : indiqué dans le message de livraison final

## Limites et points d’attention

- La branche a été créée depuis l’état courant qui contient PACK-010, car PACK-011 doit être ajouté après PACK-010 dans l’ordre de la bibliothèque.
- Aucun CSS spécifique PACK-011 n’a été ajouté : le mode `image-then-text` existant couvre le besoin sans architecture supplémentaire.
- Aucun pack existant n’a été modifié dans son contenu éditorial ou ses assets ; seules les attentes de tests et le registre global sont adaptés à l’ajout d’une 11e œuvre.

# INE-016 - Intégration des visuels définitifs du PACK-003

## Résumé

Les 9 visuels définitifs du PACK-003 - Atlas des Récits Vivants ont été
intégrés dans l'architecture existante sans modifier le moteur, les routes, le
registre, PACK-001 ni PACK-002.

Les PNG fournis sont conservés comme originaux renommés dans
`packs/pack-003-atlas-recits-vivants/assets/images/originals/`.

Les WebP optimisés, utilisés par le moteur, sont placés dans
`packs/pack-003-atlas-recits-vivants/assets/images/`.

Planche de contrôle visuelle :
`reports/INE-016_PACK-003_IMAGES_CONTACT_SHEET.jpg`.

## Contrôle du ZIP

- Source officielle : `Pack narratif _ Atlas des récits vivants.zip`.
- Nombre de PNG trouvés : 9.
- Chemins contrôlés : aucun chemin absolu, aucun `..`, aucun chemin dangereux.
- Le ZIP source n'a pas été modifié.

## Correspondance appliquée

| Fichier original | Nom officiel PNG | Nom WebP moteur | Dimensions |
| --- | --- | --- | --- |
| `file_00000000fa88820a977b19b4f5da6efb.png` | `00-couverture-atlas-recits-vivants.png` | `00-couverture-atlas-recits-vivants.webp` | 1086x1448 |
| `file_00000000456481f49fcfe6b2d78a9cef.png` | `01-premier-pas.png` | `01-premier-pas.webp` | 1086x1448 |
| `file_00000000b53c81f4839b2d86a8b9b066.png` | `02-equilibre-vivant.png` | `02-equilibre-vivant.webp` | 1086x1448 |
| `file_000000004cd081f4aa187251162c9794.png` | `03-passage.png` | `03-passage.webp` | 1086x1448 |
| `file_00000000967c8243b80ab3417b3718db.png` | `04-miroir.png` | `04-miroir.webp` | 1086x1448 |
| `file_000000008bb881f4b59e964f0e7b59c4.png` | `05-conflit-createur.png` | `05-conflit-createur.webp` | 1086x1448 |
| `file_00000000e56481f48583776c4d2d5b0f.png` | `06-traversee.png` | `06-traversee.webp` | 1024x1536 |
| `file_00000000285081f4951c2753d37e815a.png` | `07-racines.png` | `07-racines.webp` | 1024x1536 |
| `file_000000000e3c81f4ad4ca52f6445ac18.png` | `08-monde-commun.png` | `08-monde-commun.webp` | 1448x1086 |

## Poids des images

| Format | Poids total |
| --- | ---: |
| PNG originaux conservés | 22 550 209 octets |
| WebP optimisés | 2 784 802 octets |

Les WebP conservent les dimensions des PNG sources. Aucun recadrage destructif
n'a été appliqué.

## Raccordement du PACK-003

- `pack.json` utilise maintenant
  `assets/images/00-couverture-atlas-recits-vivants.webp` comme couverture et
  fallback.
- Les 8 Living Cards pointent vers leurs WebP définitifs.
- Les titres, sous-titres, citations, devises, métadonnées et traductions ont
  été conservés.
- Les textes alternatifs d'image ont été ajustés pour décrire les visuels
  définitifs et préserver l'accessibilité.

## Placeholders

Les 9 placeholders SVG du PACK-003 ont été supprimés après génération et
raccordement des WebP définitifs.

Aucune référence active aux anciens SVG PACK-003 ne reste dans :

- `apps/`
- `packages/`
- `packs/`
- `tests/`

Les mentions historiques présentes dans d'anciens rapports restent des traces
documentaires du cycle précédent.

## Indépendance des packs

Vérification Git effectuée :

- aucun fichier de PACK-001 / `examples/demo-pack` modifié ;
- aucun fichier de PACK-002 modifié ;
- aucune route modifiée ;
- aucun changement du registre ;
- aucun changement du format `ine-living-card-pack` ;
- aucune dépendance ajoutée.

## Vérifications visuelles

Contrôles réalisés sur aperçu local GitHub Pages (`/ERIA-Immersive-Prologue/`) :

- bibliothèque : 3 oeuvres affichées, couverture Atlas définitive chargée ;
- `/oeuvres/atlas-recits-vivants/` : couverture définitive chargée ;
- Carte du Premier Pas : `01-premier-pas.webp` ;
- Carte de l'Équilibre Vivant : `02-equilibre-vivant.webp` ;
- Carte du Passage : `03-passage.webp` ;
- Carte du Miroir : `04-miroir.webp` ;
- Carte du Conflit Créateur : `05-conflit-createur.webp` ;
- Carte de la Traversée : `06-traversee.webp` ;
- Carte des Racines : `07-racines.webp` ;
- Carte du Monde Commun : `08-monde-commun.webp`.

Responsive vérifié :

- mobile 360 px ;
- mobile 390 px ;
- mobile 430 px ;
- tablette 768 px ;
- desktop 1280 px.

Résultat : pas de débordement horizontal détecté, boutons tactiles lisibles,
navigation des cartes fonctionnelle.

Limite notée : `08-monde-commun` est horizontal (1448x1086), conformément au
ZIP fourni. Il est conservé sans recadrage source ; son affichage reste lisible
dans le cadre existant.

## Résultats des validations

- `npm.cmd run test:ci` :
  - typecheck : OK ;
  - tests unitaires : 64/64 OK ;
  - tests d'intégration : 15/15 OK ;
  - couverture : 79/79 OK, seuils respectés ;
  - build : bloqué dans le sandbox Windows par l'accès Vite/esbuild au chemin
    parent.
- `npm.cmd run build` hors sandbox restreint : OK.
- `npm.cmd run test:e2e` : scénario navigateur projet ignoré car Chrome système
  non détecté localement.
- Vérification navigateur intégrée Codex : OK pour bibliothèque, couverture,
  8 cartes, navigation et responsive.

## Cible Git

La branche `main` contient déjà INE-015. La branche INE-016 est donc créée
depuis `main` et la Pull Request doit cibler `main`.

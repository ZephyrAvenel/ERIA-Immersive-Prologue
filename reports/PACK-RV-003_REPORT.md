# PACK-RV-003 — Restaurer le récit original des Gardiens des Récits Vivants

Date : 2026-07-29

## Résumé

PACK-RV-003 restaure le récit officiel validé par l’auteur dans le Narrative Pack `Les Gardiens des Récits Vivants`.

La mission est strictement éditoriale : aucun fichier moteur, Player, CSS, transition, persistance ou image n’a été modifié.

## Fichiers modifiés

- `examples/demo-pack/pack.json` ;
- `tests/integration/narrative-pack/demo-pack.test.mjs` ;
- `tests/e2e/player.test.mjs` ;
- `reports/PACK-RV-003_REPORT.md`.

## Nouvel ordre des scènes

| Étape | Titre | Image |
|---:|---|---|
| Prologue | Le Seuil | Aucune image |
| 1 | La Gardienne des profondeurs | `scene-02-cosmic-whale.png` |
| 2 | Le Gardien du silence | `scene-01-mount-fuji.png` |
| 3 | Les Veilleurs | `scene-03-snow-leopards.png` |
| 4 | Le Voyageur des seuils | `scene-06-traveler-cat.png` |
| 5 | Le Messager des hauteurs | `scene-05-golden-eagle.png` |
| 6 | Le Gardien des passages | `scene-07-guardian.png` |
| 7 | La Lumière du vivant | `scene-08-white-cat.png` |
| 8 | Le Mandala des Récits Vivants | `scene-04-cosmic-mandala.png` |
| 9 | Épilogue | Aucune image |

Le mandala est bien placé en dernière rencontre illustrée, avant l’épilogue.

## Correspondance image / texte

- La baleine porte `La Gardienne des profondeurs`.
- La montagne porte `Le Gardien du silence`.
- Les trois léopards des neiges portent `Les Veilleurs`.
- Le voyageur porte `Le Voyageur des seuils`.
- L’aigle porte `Le Messager des hauteurs`.
- Le gardien à la lanterne porte `Le Gardien des passages`.
- La lumière est portée par `scene-08-white-cat.png`.
- Le mandala porte `Le Mandala des Récits Vivants`.
- L’épilogue clôture le parcours sans image.

## Adaptations des tests

Les tests ont été adaptés uniquement pour refléter le nouveau contenu éditorial :

- le pack contient désormais 9 scènes ;
- les 8 images existantes restent présentes, uniques et non modifiées ;
- l’épilogue est accepté comme scène sans image ;
- le parcours E2E attend désormais une progression `Scène 1 / 9` à `Scène 9 / 9` ;
- la progression de reprise indique désormais `scène 4 sur 9` ;
- la lecture complète est marquée `completed: true` sur `scene-09`.

## Validations effectuées

Environnement :

- Node.js `v24.18.0` ;
- npm `11.16.0` via `npm.cmd` ;
- Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe`.

Commandes exécutées :

| Commande | Résultat |
|---|---|
| `npm.cmd run typecheck` | Réussi |
| `npm.cmd run test:unit` | 48 tests passés |
| `npm.cmd run test:integration` | 5 tests passés |
| `npm.cmd run test:coverage` | 53 tests passés, seuils conservés |
| `npm.cmd run test:e2e` | 1 scénario navigateur passé |
| `npm.cmd run build` | Réussi hors sandbox après le blocage esbuild local connu |

Couverture :

| Zone | Lignes | Branches | Fonctions |
|---|---:|---:|---:|
| Core | 96.13 % | 93.65 % | 97.06 % |
| Renderer | 85.53 % | 85.25 % | 77.78 % |
| Validators | 89.26 % | 88.71 % | 100.00 % |
| Total | 89.66 % | 89.25 % | 89.86 % |

Les seuils de couverture n’ont pas été diminués.

## État final

État local validé pour publication :

- récit officiel intégré ;
- ordre officiel respecté ;
- 8 images conservées et réassociées aux gardiens ;
- épilogue ajouté sans image ;
- progression attendue : `Scène 1 / 9` à `Scène 9 / 9` ;
- aucun fichier moteur, Player, CSS, persistance ou image modifié.

La publication doit être effectuée en fast-forward uniquement.

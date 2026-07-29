# PACK-RV-002 — Affiner le Narrative Pack « Les Gardiens des Récits Vivants »

Date : 2026-07-29

## Résumé

PACK-RV-002 affine uniquement le Narrative Pack artistique et sa présentation responsive. Le moteur, la navigation, le prologue, les transitions et la persistance n’ont pas été modifiés.

## Scènes corrigées

Les huit textes narratifs ont été relus et rééquilibrés afin d’accompagner les images sans les décrire mécaniquement.

| Scène | Ajustement |
|---|---|
| 1 — La gardienne des profondeurs | Texte recentré sur la baleine comme porteuse de mémoire et seuil narratif. |
| 2 — La montagne du silence | Texte plus contemplatif, lié à l’attente et au paysage. |
| 3 — Les veilleurs de neige | Correction de l’incohérence : le texte parle désormais de trois veilleurs, conformément à l’image. |
| 4 — Le centre vivant | Texte plus organique autour du mandala comme boussole narrative. |
| 5 — L’aigle des hauteurs | Texte moins générique, axé sur l’écoute et l’altitude du récit. |
| 6 — Le voyageur des seuils | Texte enrichi autour des passages et détours. |
| 7 — Le gardien sans nom | Texte clarifié : le gardien maintient le merveilleux praticable. |
| 8 — La lumière du retour | Texte de clôture plus ouvert, sans effet de conclusion définitive. |

Les images, titres de scènes, identifiants et assets n’ont pas été modifiés.

## Ajustements CSS

Les ajustements sont limités à `apps/player/src/styles.css` :

- image plus présente sur les écrans larges à partir de `64rem` ;
- conservation stricte de `object-fit: contain` ;
- fond de la zone image légèrement allégé pour réduire la sensation de panneau vide ;
- réduction douce des espaces verticaux autour de l’image ;
- amélioration de la lisibilité mobile sous `480px` : texte narratif, compteur, points de progression et boutons légèrement agrandis ;
- boutons conservés dans une hauteur tactile confortable.

La structure générale du Player n’a pas été changée.

## Validations responsive attendues

Les tailles à vérifier sont :

- `360 × 800` ;
- `390 × 844` ;
- `430 × 932` ;
- `1366 × 768`.

Critères :

- aucune scène courte ne nécessite de scroll pour atteindre la navigation ;
- image entièrement visible ;
- texte lisible ;
- boutons lisibles ;
- progression lisible ;
- aucun débordement horizontal.

## Tests exécutés

Environnement :

- Node.js `v24.18.0` ;
- npm `11.16.0` via `npm.cmd` ;
- Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe`.

Commandes locales :

| Commande | Résultat |
|---|---|
| `npm.cmd run typecheck` | Réussi |
| `npm.cmd run test:unit` | 48 tests passés |
| `npm.cmd run test:integration` | 5 tests passés |
| `npm.cmd run test:coverage` | 53 tests passés, seuils conservés |
| `npm.cmd run build` | Réussi hors sandbox après le blocage esbuild local connu |
| `npm.cmd run test:e2e` | 1 scénario navigateur passé |

Couverture obtenue :

| Zone | Lignes | Branches | Fonctions |
|---|---:|---:|---:|
| Core | 96.13 % | 90.16 % | 97.06 % |
| Renderer | 85.53 % | 85.25 % | 77.78 % |
| Validators | 89.26 % | 88.71 % | 100.00 % |
| Total | 89.66 % | 88.04 % | 89.86 % |

La première tentative d’intégration a signalé une virgule manquante dans `pack.json` après la retouche du texte de la scène 8. Le fichier a été corrigé immédiatement, puis l’intégration et la couverture sont repassées au vert.

## Validations responsive

Les vérifications E2E existantes couvrent notamment :

- `360 × 800` ;
- `390 × 844` ;
- `430 × 932` ;
- `1366 × 768`.

Résultat :

- aucune scène courte testée ne nécessite de scroll pour atteindre la navigation ;
- image prête, visible et en `contain` ;
- progression lisible ;
- boutons visibles et utilisables ;
- aucun débordement horizontal.

## État final

L’état local est validé pour publication :

- seules les données du Narrative Pack, la CSS de présentation et le rapport de mission ont été modifiés ;
- aucune image, aucun identifiant de scène et aucun mécanisme moteur n’ont été modifiés ;
- les tests locaux disponibles sont verts ;
- le commit devra être publié en fast-forward uniquement.

# INE-018 — Fix mobile final screen PACK-002

## Problème constaté

Sur l’écran de clôture du PACK-002 — Polarités Vivantes, les boutons d’action pouvaient masquer le bas de l’illustration `11-cloture.webp` sur mobile. Le texte intégré en bas de l’image pouvait donc être partiellement coupé ou recouvert.

## Solution appliquée

Correction CSS ciblée sur l’écran `.polarity-closing` :

- sur mobile et tablette portrait, l’image finale et les boutons passent dans un flux vertical ;
- les boutons ne sont plus positionnés en superposition ;
- l’image conserve son ratio et reste entièrement visible ;
- une hauteur maximale laisse l’espace nécessaire aux deux actions ;
- le rendu desktop reste inchangé.

## Fichiers modifiés

- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`

## Confirmations de périmètre

- Aucun contenu éditorial modifié.
- Aucune image remplacée, recadrée ou régénérée.
- Aucune route modifiée.
- Aucun changement dans PACK-001.
- Aucun changement dans PACK-003.
- Correction limitée au layout responsive de l’écran final du PACK-002.

## Vérifications visuelles

Vérification effectuée sur le build de production local, via navigateur intégré :

| Largeur | Résultat |
| --- | --- |
| 360 px | image complète visible, boutons accessibles, aucun chevauchement |
| 390 px | image complète visible, boutons accessibles, aucun chevauchement |
| 430 px | image complète visible, boutons accessibles, aucun chevauchement |
| 768 px | image complète visible, boutons accessibles, aucun chevauchement |
| 1280 px | rendu desktop conservé |

Les mesures DOM confirment que, jusqu’à la tablette portrait, le bas de l’image se termine au-dessus du premier bouton d’action.

## Tests et validations

- `npm run typecheck` : OK
- `npm run test:unit` : OK — 64 tests
- `npm run test:integration` : OK — 15 tests
- `npm run test:coverage` : OK — 79 tests, seuils respectés
- `npm run build` : OK
- `npm run test:e2e` : scénario sauté localement, Chrome non disponible dans l’environnement
- Vérification navigateur réel intégré Codex : OK

## Limites

Le test e2e automatisé complet n’a pas pu être exécuté localement faute de binaire Chrome détecté. Le contrôle responsive a été réalisé dans le navigateur intégré sur le build de production local.

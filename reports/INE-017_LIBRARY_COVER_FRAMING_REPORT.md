# INE-017 - Ajustement du cadrage de la couverture PACK-003 dans la bibliothèque

## Problème constaté

Dans la bibliothèque des oeuvres immersives, la couverture définitive du
PACK-003 - Atlas des Récits Vivants était affichée avec le cadrage générique des
cartes (`object-fit: cover` centré). Comme la couverture Atlas est verticale et
contient un titre intégré dans sa partie haute, ce cadrage coupait légèrement le
haut de l'image.

Le parcours interne du PACK-003 n'était pas concerné.

## Solution appliquée

La carte de bibliothèque reçoit désormais un attribut stable dérivé du slug du
pack :

```html
<article class="work-card" data-work-slug="atlas-recits-vivants">
```

Une règle CSS ciblée ajuste uniquement l'image de couverture Atlas :

```css
.work-card[data-work-slug="atlas-recits-vivants"] .work-card__image {
  object-position: center top;
}
```

Le cadrage général des autres cartes reste inchangé.

## Fichiers modifiés

- `apps/player/src/main.ts`
  - ajout de `data-work-slug` sur les cartes de bibliothèque.
- `apps/player/src/styles.css`
  - ajout d'une règle ciblée pour `atlas-recits-vivants`.
- `tests/e2e/player.test.mjs`
  - vérification que PACK-001 et PACK-002 restent en `50% 50%` ;
  - vérification que PACK-003 passe en `50% 0%`.

## Images et contenus

Confirmation :

- aucune image PNG source modifiée ;
- aucun WebP régénéré ;
- aucun JSON de contenu de carte modifié ;
- aucun manifeste modifié ;
- aucune route modifiée ;
- aucun registre modifié ;
- aucune dépendance ajoutée.

## Impact sur PACK-001 et PACK-002

PACK-001 et PACK-002 ne sont pas ciblés par la règle CSS.

Vérification navigateur :

- `les-gardiens-des-recits-vivants` : `object-position: 50% 50%` ;
- `polarites-vivantes` : `object-position: 50% 50%` ;
- `atlas-recits-vivants` : `object-position: 50% 0%`.

## Vérifications visuelles

Vérifications réalisées sur la bibliothèque locale GitHub Pages
(`/ERIA-Immersive-Prologue/bibliotheque/`) :

- bibliothèque avec les 3 oeuvres : OK ;
- carte PACK-003 : le haut de la couverture est privilégié et le titre intégré
  est mieux préservé ;
- PACK-001 : cadrage inchangé ;
- PACK-002 : cadrage inchangé ;
- aucun débordement horizontal.

Responsive vérifié :

| Taille | Résultat |
| --- | --- |
| mobile 360 px | OK, Atlas `50% 0%`, autres cartes `50% 50%` |
| mobile 390 px | OK, Atlas `50% 0%`, autres cartes `50% 50%` |
| mobile 430 px | OK, Atlas `50% 0%`, autres cartes `50% 50%` |
| tablette 768 px | OK, Atlas `50% 0%`, autres cartes `50% 50%` |
| desktop 1280 px | OK, Atlas `50% 0%`, autres cartes `50% 50%` |

## Résultats des tests

- `npm.cmd run test:ci` :
  - typecheck : OK ;
  - tests unitaires : 64/64 OK ;
  - tests d'intégration : 15/15 OK ;
  - couverture : 79/79 OK, seuils respectés ;
  - build : bloqué dans le sandbox Windows par l'accès Vite/esbuild au chemin
    parent.
- `npm.cmd run build` hors sandbox restreint : OK.
- `npm.cmd run test:e2e` : scénario navigateur projet ignoré car Chrome système
  n'est pas détecté localement.
- Vérification navigateur intégrée Codex : OK pour bibliothèque, PACK-001,
  PACK-002, PACK-003, mobile, tablette et desktop.

## Correction du check push

Le workflow `Build / build (push)` a signalÃ© une divergence sur le scÃ©nario
navigateur :

- test : `Player loads, localizes, navigates, keeps focus, and remains responsive
  in a real browser` ;
- assertion : `livingCardState.imageReady === true` ;
- ligne : `tests/e2e/player.test.mjs:924`.

Cause racine : le test attendait uniquement l'apparition du titre de la premiÃ¨re
Living Card avant de lire `img.complete`. Sur un run `push`, le chargement de
`01-premier-pas.webp` pouvait encore Ãªtre en cours au moment de l'assertion,
alors que l'interface Ã©tait correcte. Le workflow `pull_request` passait car le
timing de chargement y Ã©tait favorable.

Correction appliquÃ©e : le test attend maintenant explicitement que l'image de la
premiÃ¨re Living Card soit `complete` et que sa source pointe vers
`/01-premier-pas.webp` avant de lire l'Ã©tat `livingCardState`.

Cette correction ne modifie pas le comportement utilisateur. Le cadrage Atlas
dans la bibliothÃ¨que reste inchangÃ© (`object-position: center top`) et PACK-001 /
PACK-002 restent au cadrage central.

## Limites

Le correctif ne change pas la forme 16/10 des couvertures de bibliothèque. Il
ajuste seulement l'ancrage vertical de la couverture Atlas. C'est volontaire :
la mission demandait une correction locale et minimale, sans modification
d'architecture ni retraitement des images.

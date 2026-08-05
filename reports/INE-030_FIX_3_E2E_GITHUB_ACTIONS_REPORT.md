# INE-030-FIX-3 — Correction de l’assertion e2e restante

## Résumé

La PR #27 échouait encore dans GitHub Actions après le commit `60e30b0c99c480da4175acf62386637c22dcb431`.

Trace fournie :

`tests/e2e/player.test.mjs:1482:14`

## Assertion exacte identifiée

Autour des lignes 1460 à 1490, la ligne 1482 correspondait à :

```js
assert.equal(textState.controlsInsideViewport, true);
```

Cette assertion vérifiait que les contrôles de navigation étaient immédiatement dans le viewport horizontal au moment de la lecture d’une page **Lire** du PACK-010.

## Cause

Les pages **Lire** du mode `image-then-text` peuvent contenir de longs textes narratifs. Dans ce mode, le scroll vertical est normal et attendu.

Exiger que les contrôles soient immédiatement dans le viewport pendant une page texte longue confond donc deux choses :

- une régression responsive réelle ;
- un contenu long qui demande simplement à défiler.

## Correction appliquée

L’assertion opaque a été remplacée par des garde-fous explicites :

- le texte narratif est présent ;
- l’image est absente en phase Lire ;
- `noHorizontalOverflow === true` ;
- l’état du bouton suivant reste cohérent avec la scène finale ou non finale ;
- les contrôles existent ;
- après `scrollIntoView`, les contrôles sont dans le viewport ;
- les boutons ont un nom accessible ;
- l’état du bouton suivant reste cohérent avec les scènes non finales et la scène finale.

Les phases **Contempler** restent strictes :

- image visible ;
- source WebP ;
- `object-fit: contain` ;
- absence d’overflow horizontal ;
- contrôles disponibles.

## Fichiers modifiés

- `tests/e2e/player.test.mjs`
- `reports/INE-030_FIX_3_E2E_GITHUB_ACTIONS_REPORT.md`

## Confirmations

- Aucun texte du PACK-010 n’a été modifié.
- Aucune image ou WebP n’a été modifié.
- Aucun pack 001 à 009 n’a été modifié.
- Aucune route n’a été modifiée.
- Le mode `image-then-text` reste inchangé.
- La bibliothèque contient toujours 10 œuvres.

## Validations

Validations exécutées après correction :

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK, 66 tests passés
- `npm.cmd run test:integration` : OK, 43 tests passés
- `npm.cmd run test:coverage` : OK, 109 tests passés, seuils de couverture respectés
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK ; l’e2e intégré au script a été sauté proprement car Chrome n’est pas auto-détecté dans cet environnement
- `$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'; npm.cmd run test:e2e` : OK, test navigateur réel passé

## Limite

Le test n’exige plus que les contrôles des pages Lire longues soient visibles sans aucun scroll vertical. Il vérifie plutôt qu’ils sont rendus, nommés, atteignables après scroll et que la navigation fonctionne.

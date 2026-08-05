# INE-030-FIX-2 — Correction définitive de l’e2e GitHub Actions

## Résumé

La PR #27 échouait encore dans GitHub Actions après le premier correctif, toujours sur le scénario e2e principal :

`Player loads, localizes, navigates, keeps focus, and remains responsive in a real browser`

L’échec restait situé à :

`tests/e2e/player.test.mjs:1481:14`

## Cause précise

La ligne 1481 vérifiait encore :

```js
assert.equal(textState.contentInsideViewport, true);
```

Cette assertion n’est pas adaptée aux pages **Lire** du mode `image-then-text` lorsque le texte narratif est long.

Pour PACK-010, les pages Lire doivent pouvoir scroller verticalement. Le comportement attendu n’est donc pas que tout le contenu textuel tienne dans le viewport visible sans scroll.

## Correction appliquée

Pour les pages Lire du PACK-010, l’exigence `contentInsideViewport === true` a été retirée et remplacée par les garde-fous réellement pertinents :

- `noHorizontalOverflow === true` ;
- texte narratif présent ;
- image absente en phase Lire ;
- contrôles accessibles horizontalement ;
- navigation complète jusqu’à la scène finale.

Les assertions strictes des phases **Contempler** restent inchangées :

- image visible ;
- `object-fit: contain` ;
- source WebP ;
- pas d’overflow horizontal ;
- contrôles accessibles.

## Fichiers modifiés

- `tests/e2e/player.test.mjs`
- `reports/INE-030_FIX_2_E2E_GITHUB_ACTIONS_REPORT.md`

## Confirmations

- Aucun texte du PACK-010 n’a été modifié.
- Aucune image ou WebP n’a été modifié.
- Aucun pack 001 à 009 n’a été modifié.
- Le mode `image-then-text` reste actif.
- La bibliothèque contient toujours 10 œuvres.
- La route `/oeuvres/le-monde-commun/` reste fonctionnelle.

## Validations

Exécutées après correction :

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK
- `npm.cmd run test:integration` : OK
- `npm.cmd run test:coverage` : OK
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK, avec e2e sauté car Chrome n’est pas détecté automatiquement sans `CHROME_PATH`.
- `$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'; npm.cmd run test:e2e` : OK

## Limite

Le test continue de vérifier l’absence d’overflow horizontal. Il n’exige plus que les textes longs en phase Lire soient entièrement visibles sans scroll vertical, car ce serait contraire au comportement attendu du mode `image-then-text`.

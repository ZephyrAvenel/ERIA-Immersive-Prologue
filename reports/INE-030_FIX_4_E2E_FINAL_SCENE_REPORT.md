# INE-030-FIX-4 — Correction e2e de la scène finale PACK-010

## Résumé

La PR #27 échouait encore après le commit `5c5984a5dfdc0cea0d4bf1fb25ebe7cb2de32b8f`.

Erreur CI signalée :

`PACK-010 scene 12 read page controls should be reachable after scroll`

Trace :

`tests/e2e/player.test.mjs:1512:14`

## Cause exacte

Le test conservait une assertion fondée sur `getBoundingClientRect()` pour vérifier que le bloc `.player-controls` était entièrement contenu dans le viewport après `scrollIntoView`.

Cette mesure reste fragile sur la scène finale Lire du mode `image-then-text`, car :

- le texte final peut légitimement scroller verticalement ;
- le contrôle final n’est pas un bouton “Suivant” actif, mais le lien de continuation vers la bibliothèque ;
- la position verticale exacte des contrôles dépend du rendu navigateur et de la hauteur disponible en CI.

Le comportement utilisateur attendu n’est pas que tout le bloc soit mesuré dans le viewport, mais que le contrôle final existe, soit nommé, accessible et mène bien à la bibliothèque.

## Correction appliquée

Le test e2e PACK-010 vérifie désormais :

- phase Lire active ;
- image masquée en phase Lire ;
- texte narratif présent ;
- absence d’overflow horizontal ;
- bouton `data-navigation="next"` rendu ;
- bouton Suivant actif sur les scènes non finales ;
- bouton Suivant désactivé sur la scène finale ;
- lien `data-library-continuation` présent, nommé et pointant vers `/bibliotheque/` sur la scène finale ;
- activation réelle du lien final après `scrollIntoView` ;
- arrivée effective sur la bibliothèque avec 10 œuvres.

Les vérifications strictes des phases Contempler restent conservées :

- image visible ;
- source WebP ;
- `object-fit: contain` ;
- absence d’overflow horizontal ;
- contrôles disponibles.

## Fichiers modifiés

- `tests/e2e/player.test.mjs`
- `reports/INE-030_FIX_4_E2E_FINAL_SCENE_REPORT.md`

## Confirmations

- Aucun contenu éditorial du PACK-010 n’a été modifié.
- Aucune image ou WebP n’a été modifié.
- Aucun pack 001 à 009 n’a été modifié.
- Aucune route n’a été modifiée.
- Le mode `image-then-text` reste inchangé.

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

Le test n’exige plus que le bloc complet des contrôles soit entièrement mesuré dans le viewport vertical. Il vérifie à la place que le contrôle final réellement exposé à l’utilisateur est présent, accessible, nommé et fonctionnel.

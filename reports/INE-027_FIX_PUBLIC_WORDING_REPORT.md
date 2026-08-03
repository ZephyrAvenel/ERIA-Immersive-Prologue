# Rapport INE-027-FIX — Retrait du terme technique INE

## Résumé

Ce correctif retire la mention technique “INE” du texte principal visible dans l’aperçu public de la bibliothèque.

L’objectif est de préserver l’impression d’entrée dans un monde narratif habitable, sans rappeler l’outil technique au visiteur.

## Texte remplacé

Ancienne formulation :

> Chaque œuvre est une porte d’entrée. Chaque pack est un chemin. Chaque carte devient un repère. L’INE rassemble ces parcours en un territoire narratif vivant, que chacun peut traverser à son rythme.

Nouvelle formulation :

> Chaque œuvre est une porte d’entrée. Chaque pack est un chemin. Chaque carte devient un repère. Ensemble, ces parcours composent un territoire narratif vivant, que chacun peut traverser à son rythme.

La version anglaise a été alignée :

> Each work is an entryway. Each pack is a path. Each card becomes a landmark. Together, these journeys compose a living narrative territory that everyone can cross at their own pace.

## Fichiers modifiés

- `apps/player/src/locales/fr.json`
- `apps/player/src/locales/en.json`
- `reports/INE-027_FIX_PUBLIC_WORDING_REPORT.md`

## Préservation du périmètre

Aucun pack narratif n’a été modifié.

Aucune image, route, architecture ou entrée de registre n’a été modifiée.

## Validations

Commandes exécutées :

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK, 64 tests passés
- `npm.cmd run test:integration` : OK, 31 tests passés
- `npm.cmd run test:coverage` : OK, 95 tests passés et seuils respectés
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK
- `npm.cmd run test:e2e` sans `CHROME_PATH` : sauté proprement car Chrome n’est pas auto-détecté localement
- `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm.cmd run test:e2e` : OK, 1 test navigateur réel passé

# INE-004 — Mise en place du socle de tests automatisés

## Résumé

La mission INE-004 met en place un socle de tests automatisés pour protéger les
fondations de l'Immersive Narrative Engine avant l'ajout de fonctionnalités plus
complexes. Les tests couvrent les contrats publics du Core, du validateur, de
l'AssetManager, du Renderer, de la localisation, du Narrative Pack de
démonstration et du Player exécuté dans un navigateur.

Aucune fonctionnalité narrative ou immersive n'a été ajoutée.

## État initial

Audit Git réalisé avant modification :

- branche courante : `main` ;
- état initial : dépôt propre ;
- divergence après `git fetch origin --prune` :
  `origin/main...main = 0 0` ;
- dernier commit observé : `ef13bea INE-003A Consolidate local and remote history` ;
- aucun commit distant absent localement ;
- push final possible en fast-forward sous réserve d'absence de nouveau commit
  distant avant publication.

## Choix de l'outillage

L'outillage retenu est volontairement léger :

- Node.js test runner natif pour les tests unitaires et d'intégration ;
- couverture native Node.js avec seuils ;
- scénario navigateur réel piloté par Chrome DevTools Protocol ;
- aucun framework supplémentaire ajouté dans `package-lock.json`.

Vitest et Playwright restent de bons candidats pour une évolution dédiée, mais
ils n'ont pas été ajoutés pendant cette mission car l'environnement local Codex
ne fournit pas `npm`. Ajouter de nouvelles dépendances sans pouvoir régénérer et
vérifier correctement le lockfile aurait réduit la reproductibilité de la
mission.

## Architecture des tests

Arborescence ajoutée :

```text
tests/
├── e2e/
│   └── player.test.mjs
├── fixtures/
│   ├── invalid/
│   └── valid/
├── helpers/
│   ├── fake-dom.mjs
│   └── fixtures.mjs
├── integration/
│   └── narrative-pack/
│       └── demo-pack.test.mjs
├── unit/
│   ├── asset-manager/
│   ├── core/
│   ├── localization/
│   ├── renderer/
│   └── validators/
├── run-integration.mjs
├── run-tests.mjs
├── run-unit-integration.mjs
└── run-unit.mjs
```

Les tests unitaires utilisent des fixtures minimales indépendantes du pack de
démonstration lorsque le contrat testé ne nécessite pas le vrai pack.

## Comportements couverts

### Core

- chargement d'un manifeste valide ;
- conservation des métadonnées et de la langue ;
- sélection de la scène initiale ;
- navigation suivante et précédente ;
- limites de navigation ;
- progression et index courant ;
- erreurs stables pour chargement impossible, manifeste invalide, scène initiale
  inexistante et état incohérent.

### AssetManager

- résolution d'images relatives au manifeste ;
- conservation des URI absolues ;
- résolution préparée pour `images`, `audio`, `video` et `icons` ;
- normalisation des chemins ;
- indépendance vis-à-vis de l'emplacement du Player ;
- déplacement simulé d'un pack sans rupture des chemins ;
- rejet clair des ressources invalides.

### Validators et JSON Schema

- validation de packs minimaux, multi-scènes, français et avec
  `ImageDisplayMode` ;
- rejet des propriétés inconnues, identifiants invalides, scènes dupliquées,
  `startScene` inexistant, titre manquant, ressource invalide, langue invalide,
  mode image inconnu, type incorrect et tableau de scènes vide ;
- cohérence vérifiée entre le validateur runtime et le JSON Schema pour les
  règles structurelles essentielles.

### Renderer

- création du titre de scène ;
- rendu du texte par `textContent` ;
- absence d'injection HTML depuis un Narrative Pack ;
- affichage image + texte alternatif ;
- application de `contain`, `cover`, `fill` et `immersive` ;
- progression accessible ;
- activation/désactivation des boutons ;
- libellés fournis par la locale, sans chaîne d'interface codée en dur dans le
  Renderer.

### Localisation

- sélection française pour un pack `fr` ;
- sélection anglaise pour un pack `en` ;
- fallback anglais documenté ;
- cohérence des clés entre `fr.json` et `en.json` ;
- vérification des libellés français critiques.

### Player navigateur

Le test navigateur couvre :

- ouverture du Player ;
- absence d'erreur console ;
- absence de requête critique en échec ;
- chargement d'une image avec dimensions naturelles ;
- parcours des huit scènes ;
- état des boutons en première et dernière scène ;
- progression localisée ;
- interface française ;
- séparation du titre moteur et du titre du Narrative Pack ;
- mode `contain` par défaut ;
- absence de débordement horizontal en desktop, tablette et mobile ;
- navigation clavier/focus sur les contrôles ;
- signaux d'accessibilité élémentaire : titre, article, texte alternatif,
  boutons nommés et progression nommée.

## Fixtures ajoutées

Fixtures valides :

- `minimal.json` ;
- `multi-scene.json` ;
- `french.json` ;
- `image-display-mode.json`.

Fixtures invalides :

- `unknown-property.json` ;
- `invalid-id.json` ;
- `duplicate-scene-id.json` ;
- `missing-start-scene.json` ;
- `scene-missing-title.json` ;
- `empty-image.json` ;
- `invalid-language.json` ;
- `invalid-image-display-mode.json` ;
- `wrong-property-type.json` ;
- `empty-scenes.json`.

## Refactorings de testabilité

Un refactoring limité a été réalisé dans le Player :

- extraction de la localisation dans `apps/player/src/localization.ts`.

Ce changement ne modifie pas l'expérience utilisateur. Il rend la sélection de
locale, l'interpolation et la cohérence des clés testables comme contrats
publics simples.

## Scripts npm ajoutés

Scripts ajoutés ou documentés :

- `npm run test` ;
- `npm run test:prepare` ;
- `npm run test:unit` ;
- `npm run test:integration` ;
- `npm run test:e2e` ;
- `npm run test:coverage` ;
- `npm run test:ci`.

`test:ci` exécute la chaîne complète sans mode surveillance.

## GitHub Actions

Les workflows ont été modifiés pour bloquer la publication en cas d'échec :

```text
Install
Typecheck
Unit tests
Integration tests
Coverage
Build
Browser tests
Upload Pages artifact
Deploy Pages
```

Actions mises à jour :

- `actions/checkout@v6` ;
- `actions/setup-node@v6` avec Node.js 24 ;
- `actions/configure-pages@v6` ;
- `actions/upload-pages-artifact@v4` ;
- `actions/deploy-pages@v5` ;
- `actions/upload-artifact@v7` pour les artefacts de diagnostic navigateur en
  cas d'échec uniquement.

Les permissions de déploiement Pages sont limitées au job `deploy`.

## Résultats locaux

Limite locale :

- `npm ci` n'a pas pu être exécuté localement car `npm` n'est pas disponible
  dans l'environnement Codex ;
- conformément à la consigne, aucune commande de substitution npm/pnpm n'a été
  utilisée comme validation équivalente.

Contrôles préliminaires exécutés avec le runtime Node.js fourni par Codex :

- TypeScript strict : succès ;
- compilation de test `tsconfig.test.json` : succès ;
- tests unitaires : 25 succès ;
- tests d'intégration : 4 succès ;
- couverture unitaires + intégration : succès ;
- build Vite : succès hors sandbox local après échec causé par une lecture
  refusée par esbuild dans le sandbox.

Résultat navigateur local :

- le scénario navigateur est déterministe ;
- sans `CHROME_PATH`, Chrome n'est pas exposé explicitement à la commande de
  test dans l'environnement Codex local, donc le test est ignoré proprement hors
  CI ;
- avec `CHROME_PATH` explicite vers Chrome, le test navigateur réel passe ;
- en CI, l'absence de Chrome est traitée comme une erreur bloquante.

Après première publication, GitHub Actions a révélé deux points spécifiques au
test navigateur réel :

1. le nettoyage du profil temporaire Chrome pouvait échouer sous Windows à cause
   d'un fichier dictionnaire encore verrouillé ;
2. le focus après changement de scène n'était pas restauré de manière
   immédiatement observable.

Corrections réalisées :

- nettoyage du profil temporaire rendu tolérant aux verrous transitoires ;
- restauration immédiate du focus sur un contrôle actif après rendu.

Ces corrections restent dans le périmètre INE-004 : elles stabilisent le test
navigateur et l'accessibilité clavier sans ajouter de fonctionnalité narrative.

## Couverture obtenue

Couverture globale mesurée :

- lignes : 94,90 % ;
- fonctions : 96,97 % ;
- branches : 89,02 %.

Détail :

```text
core/index.js       lignes 96,00 % | branches 90,00 % | fonctions 96,15 %
renderer/index.js   lignes 100 %   | branches 87,50 % | fonctions 100 %
validators/index.js lignes 89,53 % | branches 88,24 % | fonctions 100 %
```

Seuils appliqués :

- lignes : 80 % ;
- fonctions : 80 % ;
- branches : 70 %.

## Documentation mise à jour

- `README.md` : commandes de test, Node.js 24, chaîne de déploiement ;
- `docs/ARCHITECTURE.md` : CI désormais gated par tests et couverture ;
- `docs/TESTING.md` : guide contributeur pour lancer les tests, ajouter des
  fixtures, écrire des tests et diagnostiquer les échecs CI ;
- `tests/README.md` : organisation de la suite de tests.

## Limites résiduelles

- La validation npm définitive doit être réalisée par GitHub Actions après le
  push, car `npm` est absent localement.
- Le scénario navigateur local nécessite `CHROME_PATH` dans les environnements
  restreints ; GitHub Actions reste l'autorité de validation réelle du Player
  navigateur.
- Vitest et Playwright pourront être évalués dans une mission dédiée lorsque la
  gestion des dépendances pourra être vérifiée intégralement.

## Recommandations pour INE-005

1. Maintenir la discipline contractuelle : toute nouvelle capacité doit arriver
   avec fixture valide, fixture invalide et test navigateur si elle touche le
   Player.
2. Envisager une mission dédiée à Playwright si le projet souhaite des traces,
   vidéos et rapports navigateur plus riches.
3. Augmenter progressivement les seuils de couverture lorsque les futures
   interfaces se stabilisent.
4. Tester les futures transitions/audio/vidéo avant leur branchement visuel
   complet afin d'éviter les régressions d'accessibilité et de navigation.

## État Git final prévu

Le commit de mission doit être unique :

```text
INE-004 Add automated test foundation
```

Note post-publication : le premier run GitHub Actions du commit INE-004 a
échoué uniquement sur le scénario navigateur. Comme le push forcé et la
réécriture de l'historique distant sont interdits, la correction minimale doit
être publiée par un commit additionnel de stabilisation plutôt que par amend
forcé.

Avant publication, les contrôles Git requis seront relancés :

- `git diff --check` ;
- `git status --short` ;
- `git fetch origin --prune` ;
- `git rev-list --left-right --count origin/main...main`.

La vérification GitHub Actions et GitHub Pages ne peut être observée qu'après la
publication de ce commit unique. Son résultat terminal est donc consigné dans la
clôture de mission, sans créer de second commit documentaire.

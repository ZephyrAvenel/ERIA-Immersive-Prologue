# INE-006 — Persistance de progression et reprise de lecture

Date : 2026-07-29

## 1. Résumé

La mission INE-006 ajoute une persistance locale générique de progression de lecture pour le Player INE.

Le lecteur peut désormais :

- reprendre une lecture à la dernière scène stable enregistrée ;
- recommencer depuis le début ;
- conserver une progression distincte par Narrative Pack ;
- continuer à lire si `localStorage` est absent, inaccessible ou corrompu.

Aucune donnée personnelle, aucun compte utilisateur, aucune synchronisation serveur, aucune image et aucun texte narratif n’ont été ajoutés ou modifiés.

## 2. Architecture choisie

La persistance est portée par le Player, car il s’agit d’un souci de cycle de vie navigateur.

Le service ajouté est :

```text
apps/player/src/progress.ts
```

Il expose :

- `ReadingProgressStore` ;
- `load(packId)` ;
- `save(progress)` ;
- `clear(packId)` ;
- une abstraction `ProgressStorage` injectable ;
- `createBrowserReadingProgressStore()` pour brancher `localStorage` côté navigateur ;
- `resolveProgressSceneIndex()` pour résoudre une reprise par `sceneId`.

Le Core ne lit jamais `window.localStorage`. Il expose seulement deux aides de navigation génériques :

- `findSceneIndex(sceneId)` ;
- `goToScene(sceneId)`.

Cela permet de reprendre par identifiant stable même si l’index enregistré est devenu obsolète.

## 3. Format de progression

Clé utilisée :

```text
ine:progress:v1:<pack-id>
```

Exemple pour le pack démo :

```text
ine:progress:v1:le-seuil-des-etoiles
```

Structure stockée :

```json
{
  "schemaVersion": 1,
  "packId": "le-seuil-des-etoiles",
  "packVersion": "1.0",
  "sceneId": "scene-04",
  "sceneIndex": 3,
  "updatedAt": "2026-07-29T00:00:00.000Z",
  "completed": false
}
```

Le titre du pack n’est pas utilisé comme identifiant. Le contenu narratif et les assets ne sont jamais stockés.

## 4. Reprise et recommencement

Au chargement du Player :

- sans progression valide, le pack démarre normalement ;
- avec progression valide, une interface accessible propose `Reprendre` ou `Recommencer` ;
- avec scène supprimée, progression corrompue, version incompatible ou stockage indisponible, le Player revient à la scène initiale sans bloquer la lecture.

Le prompt est localisé en français et en anglais via :

```text
apps/player/src/locales/fr.json
apps/player/src/locales/en.json
```

## 5. Moment d’enregistrement

La progression est enregistrée uniquement après une navigation réussie et stabilisée :

- transition terminée ;
- `aria-busy` retiré ;
- scène active confirmée ;
- contrôles recalculés ;
- focus restauré.

Le test navigateur observe les écritures `localStorage` et vérifie qu’elles ne se produisent pas pendant `aria-busy` ni pendant `data-transition`.

La dernière scène enregistre :

```json
{
  "completed": true
}
```

## 6. Gestion des erreurs

Le store ignore sans exception visible :

- absence de progression ;
- JSON corrompu ;
- forme de donnée invalide ;
- `localStorage` inaccessible ;
- `getItem`, `setItem` ou `removeItem` qui lèvent une exception ;
- scène enregistrée supprimée du pack.

Le Player reste lisible et démarre sur la scène initiale dans ces cas.

## 7. Tests ajoutés

Tests unitaires ajoutés :

- aucune progression ;
- sauvegarde et lecture d’une progression valide ;
- JSON corrompu ;
- structure invalide ;
- stockage indisponible ;
- isolation de plusieurs packs ;
- suppression d’une scène ;
- index enregistré obsolète mais `sceneId` encore valide ;
- état `completed: true` ;
- reprise Core par `sceneId`.

Tests navigateur étendus :

- navigation jusqu’à la scène 4 ;
- rechargement ;
- affichage du prompt de reprise ;
- reprise à la scène 4 ;
- recommencement à la scène 1 ;
- parcours jusqu’à la scène 8 ;
- stockage `completed: true` ;
- absence d’écriture avant stabilisation ;
- stockage indisponible ;
- focus restauré ;
- responsive desktop, tablette et mobile ;
- réduction des animations.

## 8. Couverture

Commande exécutée :

```text
npm.cmd run test:coverage
```

Résultat :

| Zone | Lignes | Branches | Fonctions |
|---|---:|---:|---:|
| Core | 96.13 % | 90.16 % | 97.06 % |
| Renderer | 85.90 % | 85.25 % | 77.78 % |
| Validators | 91.34 % | 90.38 % | 100.00 % |
| Total | 90.31 % | 88.51 % | 89.55 % |

Les seuils existants n’ont pas été diminués.

## 9. Validation locale

Environnement :

- Node.js `v24.18.0` ;
- npm `11.16.0` via `npm.cmd` ;
- Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe`.

Commandes exécutées :

| Commande | Résultat |
|---|---|
| `npm.cmd ci` | Réussi |
| `npm.cmd run typecheck` | Réussi |
| `npm.cmd run test:unit` | 47 tests passés |
| `npm.cmd run test:integration` | 5 tests passés |
| `npm.cmd run test:coverage` | 52 tests passés, seuils respectés |
| `npm.cmd run build` | Réussi hors sandbox après échec esbuild sandbox |
| `npm.cmd run test:e2e` | 1 scénario navigateur passé |

Le build échoue dans le sandbox Codex avec une restriction connue d’accès esbuild à un dossier parent. La relance hors sandbox a réussi avec le même état de source.

## 10. Fichiers modifiés

- `README.md`
- `apps/player/src/progress.ts`
- `apps/player/src/main.ts`
- `apps/player/src/styles.css`
- `apps/player/src/localization.ts`
- `apps/player/src/locales/fr.json`
- `apps/player/src/locales/en.json`
- `packages/core/src/index.ts`
- `tests/unit/player/progress.test.mjs`
- `tests/unit/core/core.test.mjs`
- `tests/e2e/player.test.mjs`
- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`

## 11. GitHub Actions

À compléter après publication du commit INE-006.

## 12. GitHub Pages

À compléter après publication et déploiement GitHub Pages.

## 13. État Git final

À compléter après publication et synchronisation finale.

## 14. Recommandations pour INE-007

- conserver la persistance locale comme mécanisme strictement privé et local ;
- éviter d’ajouter une synchronisation serveur avant d’avoir une politique claire de données utilisateur ;
- tester toute future fonctionnalité de reprise avec les transitions et `prefers-reduced-motion` ;
- continuer à protéger les changements navigateur par le scénario E2E principal.

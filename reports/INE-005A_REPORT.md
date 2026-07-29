# INE-005A — Diagnostic et stabilisation du chargement des images pendant les transitions

Date : 2026-07-28

## 1. Résumé

La mission INE-005A a ciblé la régression observée après INE-005 : pendant certaines transitions, l’élément `<img>` existait mais l’illustration n’était pas visible, laissant apparaître le texte alternatif ou une zone visuelle vide.

Le diagnostic a isolé deux risques complémentaires :

1. le Renderer lançait la transition vers une nouvelle scène sans attendre que l’image cible soit chargée ou décodable ;
2. le service worker pouvait mettre en cache une réponse non exploitable, y compris une erreur ou une réponse HTML, sous une URL d’image.

La correction stabilise le cycle suivant :

```text
navigation demandée
→ scène cible calculée
→ élément image cible créé
→ attente bornée du chargement/décodage de l’image cible
→ transition visuelle
→ état final stable
```

## 2. État Git initial

État observé avant modification :

- branche locale : `main`
- dernier commit local : `85f43ef — INE-005 Add configurable scene transitions`
- état local : propre avant le correctif INE-005A
- synchronisation locale connue : `origin/main` pointait aussi sur `85f43ef`
- limite : `git fetch origin --prune` n’a pas pu être confirmé dans cette session à cause de l’accès réseau GitHub indisponible dans l’environnement Codex.

## 3. Reproduction et diagnostic initial

La régression humaine rapportée concernait notamment :

- scène 1 → scène 2 ;
- scène 2 → scène 3 ;
- scène 3 → scène 4 ;
- scène 4 → scène 3.

Le symptôme correspond à un `<img>` présent dans le DOM mais sans ressource visuelle prête au moment de l’affichage.

Une validation HTTP directe des images problématiques servies depuis `dist/` a confirmé que les assets copiés ne sont pas corrompus.

| Image | URL locale diagnostiquée | Statut | Content-Type | Taille | Signature |
|---|---|---:|---|---:|---|
| `scene-02-cosmic-whale.png` | `/ERIA-Immersive-Prologue/examples/demo-pack/assets/images/scene-02-cosmic-whale.png` | 200 | `image/png` | 2 930 566 octets | PNG valide |
| `scene-03-snow-leopards.png` | `/ERIA-Immersive-Prologue/examples/demo-pack/assets/images/scene-03-snow-leopards.png` | 200 | `image/png` | 3 254 264 octets | PNG valide |
| `scene-04-cosmic-mandala.png` | `/ERIA-Immersive-Prologue/examples/demo-pack/assets/images/scene-04-cosmic-mandala.png` | 200 | `image/png` | 3 214 788 octets | PNG valide |

La copie des assets dans `dist/examples/demo-pack/assets/images/` contient les huit PNG, avec noms exacts, tailles non nulles et signature PNG valide.

## 4. Cause racine démontrée

La cause principale est la synchronisation insuffisante entre l’image cible et la transition :

- `renderPlayerWithTransition` créait la scène cible ;
- la transition pouvait démarrer avant que l’image cible soit effectivement prête ;
- dans un navigateur réel, cela pouvait exposer temporairement une scène avec `<img>` présent mais `naturalWidth === 0`, donc texte alternatif ou zone vide.

Le service worker n’est pas prouvé comme cause unique de l’incident, mais son comportement était dangereux :

- il mettait en cache toute réponse `GET` sans vérifier `response.ok` ;
- il ne vérifiait pas le `Content-Type` des images ;
- il pouvait donc conserver une réponse HTML ou une erreur sous une URL `.png`.

## 5. Corrections réalisées

### Renderer

Ajout d’un mécanisme générique d’attente image :

- vérification de `image.complete` ;
- vérification stricte de `naturalWidth > 0` et `naturalHeight > 0` ;
- utilisation de `image.decode()` lorsque disponible ;
- attente des événements `load` ou `error` si nécessaire ;
- délai maximal borné à 2 500 ms ;
- résolution contrôlée même en cas d’échec ;
- aucun blocage indéfini.

La transition ne démarre plus avant que l’image cible soit prête ou que le fallback d’erreur contrôlé soit activé.

### États image

Ajout des états DOM :

- `data-image-state="loading"` ;
- `data-image-state="ready"` ;
- `data-image-state="error"`.

Ces états sont exposés sur l’image et son conteneur `.scene__media`.

### UX de fallback

Ajout d’un fallback visuel sobre :

- espace image conservé ;
- fond discret ;
- absence de grande zone vide incompréhensible ;
- pas de spinner animé ;
- pas de chaîne utilisateur codée en dur ;
- texte alternatif conservé dans le DOM, mais non utilisé comme unique fallback visuel.

### Player

Ajout d’un garde-fou : tout rendu non transitionnel retire explicitement `aria-busy`, afin qu’un état occupé ne survive pas à un rendu initial ou de récupération.

### Service worker

Mise à jour du cache :

- `ine-player-v1` → `ine-player-v2` ;
- suppression des anciens caches lors de l’activation ;
- cache uniquement si `response.ok` ;
- pour les images, cache uniquement si `Content-Type` commence par `image/` ;
- une réponse HTML ou une erreur ne peut plus être stockée sous une URL `.png`.

## 6. Tests ajoutés ou renforcés

### Tests unitaires Renderer

Ajout d’un test contrôlé d’échec image :

- image marquée `error` si décodage impossible ;
- titre et texte narratif restent disponibles ;
- conteneur média marqué `error` ;
- état transitoire nettoyé.

Les tests de transitions `fade`, `crossfade` et `slide` attendent maintenant explicitement que les animations existent après l’attente image.

### Tests d’intégration Narrative Pack

Ajout d’un contrôle réel des PNG du pack :

- chaque scène référence un fichier existant ;
- chaque image est non vide ;
- chaque fichier commence par la signature PNG attendue.

### Tests navigateur

Le scénario E2E a été renforcé pour vérifier :

- chaque scène parcourue ;
- `image.complete === true` ;
- `naturalWidth > 0` ;
- `naturalHeight > 0` ;
- `currentSrc` non vide et terminé par `.png` ;
- état `data-image-state="ready"` ;
- état média `data-image-state="ready"` ;
- réponses réseau PNG avec statut `< 400` ;
- `Content-Type` image ;
- absence de réponse HTML pour une URL `.png` ;
- scénario `prefers-reduced-motion`.

Le diagnostic d’échec E2E a aussi été enrichi pour produire l’état DOM et réseau en cas de régression.

## 7. Résultats des validations locales

### Validations réussies

Exécutées avec Node.js 24.14.0 fourni par le runtime Codex :

| Contrôle | Résultat |
|---|---|
| TypeScript strict (`tsc --noEmit`) | Réussi |
| Compilation tests (`tsc -p tsconfig.test.json`) | Réussi |
| Tests unitaires | 38 passés, 0 échec |
| Tests d’intégration | 5 passés, 0 échec |
| Couverture unitaires + intégration | 43 passés, 0 échec |

Couverture obtenue :

| Zone | Lignes | Branches | Fonctions |
|---|---:|---:|---:|
| Core | 95,86 % | 89,47 % | 96,77 % |
| Renderer | 85,90 % | 85,25 % | 77,78 % |
| Validators | 91,34 % | 90,38 % | 100,00 % |
| Total | 90,12 % | 88,24 % | 89,06 % |

Les seuils existants n’ont pas été diminués.

### Validations limitées par l’environnement local

`npm ci` n’a pas pu être exécuté localement :

- `npm` n’est pas disponible dans le PATH de cette session.

`npm run build` / Vite build n’a pas pu être validé localement :

- Vite/esbuild échoue dans le sandbox avec `Cannot read directory "../../../../../..": Access is denied`.
- Cette erreur est liée à l’environnement d’exécution local, pas à une erreur TypeScript.

Le test navigateur réel a été tenté avec Chrome local explicite :

- Chrome se lance ;
- le scénario atteint le Player ;
- l’exécution locale est instable et finit par timeout dans cette session ;
- les tests unitaires/intégration et le scénario E2E renforcé doivent donc être confirmés par GitHub Actions dans un environnement propre.

## 8. Résultats cache vide / cache rempli

Validé localement de manière partielle :

- requêtes directes vers les PNG problématiques : `200 image/png` ;
- signature PNG valide ;
- absence de réponse HTML pour les trois images diagnostiquées.

La validation complète avec service worker actif, cache vide, cache rempli, rechargement normal et rechargement forcé doit être confirmée par le scénario navigateur distant après publication.

## 9. Résultats responsive

Le scénario navigateur a été renforcé pour vérifier :

- desktop `1280 × 800` ;
- tablette `768 × 1024` ;
- mobile `390 × 844` ;
- absence de débordement horizontal ;
- image visible ;
- `object-fit: contain` ;
- navigation accessible.

La confirmation locale visuelle complète reste limitée par l’instabilité du lancement navigateur dans cette session.

## 10. GitHub Actions et GitHub Pages

À confirmer après publication :

- `npm ci` ;
- `npm run typecheck` ;
- `npm run test:unit` ;
- `npm run test:integration` ;
- `npm run test:coverage` ;
- `npm run build` ;
- `npm run test:e2e` ;
- Upload Pages artifact ;
- Deploy Pages ;
- vérification HTTP 200 de l’URL GitHub Pages.

L’accès réseau GitHub n’étant pas disponible dans cette session, la validation distante n’a pas encore pu être réalisée.

## 11. Fichiers modifiés

- `packages/renderer/src/index.ts`
- `apps/player/src/main.ts`
- `apps/player/src/styles.css`
- `apps/player/public/sw.js`
- `tests/helpers/fake-dom.mjs`
- `tests/unit/renderer/renderer.test.mjs`
- `tests/integration/narrative-pack/demo-pack.test.mjs`
- `tests/e2e/player.test.mjs`
- `reports/INE-005A_REPORT.md`

## 12. Limites résiduelles

- La validation navigateur locale complète reste non concluante dans cette session à cause du timeout Chrome/CDP.
- Le build Vite local reste bloqué par une restriction sandbox esbuild.
- La validation GitHub Actions et GitHub Pages doit être réalisée après push dans un environnement réseau disponible.

## 13. Recommandations pour INE-006

Avant de démarrer INE-006 :

1. confirmer que GitHub Actions exécute bien le scénario E2E renforcé ;
2. vérifier l’URL GitHub Pages publiée avec les huit images ;
3. conserver l’exigence `naturalWidth > 0` dans tout futur test de navigation ;
4. éviter d’introduire la persistance tant que le cycle image/transition/cache n’est pas vert en CI.

## 14. État final attendu

La correction locale est prête pour revue et validation distante.

La mission ne doit être considérée comme définitivement clôturée qu’après :

- commit du correctif ;
- push sans force ;
- GitHub Actions vert ;
- GitHub Pages accessible ;
- navigation visuelle confirmée sur le site publié.

## 15. Validation finale et publication

Date de validation finale : 2026-07-29.

### Commit publié

Le commit exact a été publié sans recréation et sans réécriture d’historique :

- `0be17f9cfccc1b7fcf274834f7ddb36ddac76957 — INE-005A Stabilize image loading across scene transitions`

La publication a été réalisée par `git push origin main` en fast-forward :

```text
85f43ef..0be17f9  main -> main
```

Le plugin GitHub a confirmé que `main` distante pointe désormais sur `0be17f9`.

### Validation locale

La validation locale a été exécutée avec :

- Node.js `v24.18.0` ;
- npm `11.16.0` via `npm.cmd` ;
- Chrome headless depuis `C:\Program Files\Google\Chrome\Application\chrome.exe`.

Résultats :

| Contrôle | Résultat |
|---|---|
| `npm.cmd ci` | Réussi |
| `npm.cmd run typecheck` | Réussi |
| `npm.cmd run test:unit` | 38 tests passés |
| `npm.cmd run test:integration` | 5 tests passés |
| `npm.cmd run test:coverage` | 43 tests passés |
| `npm.cmd run build` | Réussi hors sandbox |
| `npm.cmd run test:e2e` | 1 scénario navigateur passé |

Couverture finale :

| Zone | Lignes | Branches | Fonctions |
|---|---:|---:|---:|
| Core | 95,86 % | 89,47 % | 96,77 % |
| Renderer | 85,90 % | 85,25 % | 77,78 % |
| Validators | 91,34 % | 90,38 % | 100,00 % |
| Total | 90,12 % | 88,24 % | 89,06 % |

Le build Vite échoue encore dans le sandbox Codex avec une restriction `esbuild` d’accès à un dossier parent, mais il réussit hors sandbox avec le même état de source.

### GitHub Actions

Workflow vérifié :

- run ID : `30425710927`
- URL : `https://github.com/ZephyrAvenel/ERIA-Immersive-Prologue/actions/runs/30425710927`
- statut : `completed`
- conclusion : `success`

Étapes du job `build` :

| Étape | Résultat |
|---|---|
| Check out repository | Succès |
| Set up Node.js | Succès |
| Configure Pages | Succès |
| Install dependencies | Succès |
| Typecheck | Succès |
| Unit tests | Succès |
| Integration tests | Succès |
| Coverage | Succès |
| Build | Succès |
| Browser tests | Succès |
| Upload Pages artifact | Succès |

Étapes du job `deploy` :

| Étape | Résultat |
|---|---|
| Deploy to GitHub Pages | Succès |

### GitHub Pages

URL vérifiée :

```text
https://zephyravenel.github.io/ERIA-Immersive-Prologue/
```

Résultat HTTP :

- statut `200` ;
- `Content-Type` HTML attendu.

La vérification navigateur publiée a parcouru les huit scènes et validé :

- images réellement visibles ;
- `image.complete === true` ;
- `naturalWidth > 0` ;
- `naturalHeight > 0` ;
- `data-image-state="ready"` ;
- `data-image-state="ready"` sur le conteneur média ;
- `object-fit: contain` ;
- opacité de l’image à `1` ;
- absence de grande zone vide ;
- absence de texte alternatif affiché comme fallback accidentel ;
- aucune réponse HTML servie sous une URL `.png` ;
- aucune erreur console ;
- aucun échec réseau ;
- `aria-busy` absent après chaque navigation validée ;
- `data-transition` absent après chaque navigation validée ;
- un seul `.player` présent après chaque transition ;
- focus restauré sur un bouton actif après les navigations ;
- absence de débordement horizontal.

Configurations vérifiées :

| Configuration | Résultat |
|---|---|
| Cache vide | Succès |
| Cache rempli | Succès |
| `prefers-reduced-motion: reduce` | Succès |
| Desktop `1280 × 800` | Succès |
| Tablette `768 × 1024` | Succès |
| Mobile `390 × 844` | Succès |

Chaque passe navigateur a observé au moins huit réponses PNG valides. Les passes complètes ont observé `32` réponses PNG en raison des rechargements et parcours responsive.

### État final

INE-005A est validée :

- le correctif image est publié ;
- les transitions n’exposent plus une scène dont l’image cible n’est pas prête ;
- le service worker ne met plus en cache de réponse invalide comme image ;
- la CI est verte ;
- GitHub Pages est accessible ;
- les huit images du Narrative Pack sont visibles sur le site publié.

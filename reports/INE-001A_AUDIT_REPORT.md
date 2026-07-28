# INE-001A — Audit de la fondation du dépôt officiel

Date de l’audit : 28 juillet 2026

Dépôt : `ZephyrAvenel/ERIA-Immersive-Prologue`

Révision auditée : fondation INE-001 (`9107bc2`)

## Résumé exécutif

La fondation est **validée après stabilisation**. Le découpage général est sain,
le Core ne contient aucune œuvre, le graphe de dépendances est acyclique,
TypeScript est strict et le Player reste une couche de composition remplaçable.
Le dépôt peut servir de base aux missions suivantes sans refonte majeure.

L’audit initial a néanmoins identifié quatre anomalies bloquantes :

1. le pack de démonstration était sélectionné directement dans le code du
   Player et dans le service worker ;
2. les assets d’un pack étaient résolus depuis le Player, ce qui empêchait la
   portabilité réelle du pack ;
3. l’installation npm n’était pas verrouillée et les workflows utilisaient
   `npm install` ;
4. l’option `enablement: true` de `configure-pages` ne peut pas fonctionner avec
   le `GITHUB_TOKEN` standard, et l’action d’upload Pages avait une version de
   retard sur la documentation actuelle.

Ces défauts ont été corrigés dans le périmètre autorisé. Aucun moteur, effet ou
comportement narratif supplémentaire n’a été ajouté.

## État général du dépôt

| Domaine | État | Conclusion |
| --- | --- | --- |
| Architecture | Conforme | Responsabilités lisibles et graphe acyclique |
| Core | Conforme avec recommandation | Générique et sans contenu ; I/O navigateur à isoler ultérieurement |
| Player | Conforme après correction | Composition, rendu délégué, pack sélectionné par configuration |
| Narrative Pack | Conforme après correction | Manifeste et assets portables ensemble |
| JSON Schema | Conforme après correction | Contrat 1.0 cohérent avec le validateur runtime |
| TypeScript | Conforme | Strict, aucun `any`, aucune directive d’échappement |
| npm workspaces | Conforme après correction | Graphe résolu, lockfile v3 et installation déterministe |
| Build | Conforme | Installation propre, typecheck, dev et build réussis |
| GitHub Actions | Conforme après correction | CI déterministe et workflow Pages aligné sur GitHub |
| PWA | Conforme avec réserves | Shell valide ; test hors ligne complet à automatiser |
| Accessibilité | Conforme après correction | Sémantique, clavier, focus et mobile vérifiés |
| Documentation | Conforme après correction | README et architecture réalignés sur le code |

## Architecture

### Graphe observé

```text
player ──> core <── renderer
   ├─────> validators ──> core
   ├─────> renderer
   └─────> ui

sdk ─────> core
 └───────> validators

player.config.json ──> player ──> Narrative Pack + assets colocalisés
```

Le graphe des manifestes npm et celui des imports TypeScript sont cohérents. Il
n’existe aucune dépendance circulaire. `renderer` et `validators` ne remontent
que vers `core`; `ui` reste autonome; `player` compose les briques sans être une
dépendance d’un package.

### Responsabilités

- `@ine/core` : types du domaine, chargement validé, résolution des ressources
  et état minimal de navigation.
- `@ine/validators` : protection de la frontière des données externes.
- `@ine/renderer` : projection du domaine vers un DOM accessible.
- `@ine/ui` : primitive UI générique sans état narratif.
- `@ine/sdk` : façade publique initiale, volontairement limitée.
- `@ine/player` : composition, configuration du déploiement et cycle de vie
  navigateur/PWA.

Le nombre de packages est supérieur au besoin fonctionnel immédiat mais reste
acceptable : leurs frontières correspondent à des axes d’évolution distincts
et ne créent aujourd’hui ni cycle ni duplication.

## Points conformes

### Core

- aucune référence à une œuvre, un identifiant de pack ou un asset d’exemple ;
- aucune importation depuis `apps/` ou `examples/` ;
- types publics en lecture seule ;
- état privé par champs `#private` ;
- erreurs explicites pour requête, validation, scène initiale et état invalide ;
- navigation déterministe et indépendante du rendu.

### Player et renderer

- le Player utilise les exports publics des workspaces ;
- aucune logique de validation narrative n’est dupliquée dans le Player ;
- le renderer reçoit un état déjà validé ;
- le DOM est créé avec `textContent`, sans injection HTML issue d’un pack ;
- le Player peut être remplacé sans modifier le Core.

### TypeScript

- `strict: true` ;
- `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`, `noUnusedLocals` et `noUnusedParameters` ;
- aucune occurrence de `any`, `@ts-ignore` ou `@ts-expect-error` dans le code
  TypeScript ;
- imports de types utilisés lorsque nécessaire ;
- contrôle `tsc --noEmit` réussi.

### Responsive et accessibilité

- lien d’évitement, `main`, `article`, navigation nommée et titres structurés ;
- textes alternatifs fournis par le pack ;
- barre de progression correctement exposée par ARIA ;
- boutons natifs avec états `disabled` ;
- focus restauré vers un contrôle actif après changement de scène ;
- réduction des animations respectée ;
- viewport de 390 × 844 testé sans débordement horizontal ;
- hauteur mesurée des boutons : environ 48 px.

## Anomalies détectées et corrections réalisées

### A1 — Couplage du Player au pack de démonstration — bloquant

**Avant :** `main.ts` construisait directement l’URL
`demo-pack/pack.json`; le service worker répétait cette référence.

**Risque :** changer d’œuvre imposait une modification du Player et un rebuild,
en contradiction avec la philosophie INE.

**Correction :** ajout de `player.config.json`. Le Player lit une URL de pack
depuis cette configuration de déploiement. Le service worker met en cache la
configuration, sans connaître un pack particulier. La référence au pack
d’exemple ne subsiste que dans la configuration et la documentation d’exemple,
jamais dans le moteur.

### A2 — Assets non portables — bloquant

**Avant :** le renderer résolvait `scene.image` depuis `document.baseURI`; le
pack devait donc connaître son emplacement dans le Player.

**Risque :** un pack déplacé, hébergé séparément ou chargé depuis une autre base
perdait ses ressources.

**Correction :** le chargeur normalise les URI d’assets relativement à l’URL du
manifeste. Le pack d’exemple utilise désormais `assets/*.svg`. Manifeste et
assets forment une unité déplaçable.

### A3 — Installation non reproductible — bloquant

**Avant :** absence de `package-lock.json`, plages de versions résolues à chaque
installation et `npm install` en CI.

**Risque :** builds locaux et distants différents, régressions non liées au
code, audit de dépendances insuffisant.

**Correction :** lockfile npm v3 ajouté; installation propre testée avec
`npm ci`; workflows Build et Pages migrés vers `npm ci`. L’audit npm ne signale
aucune vulnérabilité connue.

### A4 — Workflow Pages fragile — bloquant

**Avant :** `configure-pages@v5` recevait `enablement: true`. L’action officielle
indique que cette option exige un jeton autre que `GITHUB_TOKEN`. L’upload
utilisait encore `upload-pages-artifact@v3`.

**Risque :** échec du premier déploiement Pages ou divergence par rapport au
workflow officiellement documenté.

**Correction :** retrait de l’option incompatible et passage à
`upload-pages-artifact@v4`. Le README précise l’unique prérequis administratif :
sélectionner une fois **GitHub Actions** comme source Pages.

### A5 — Divergence Schema/validation runtime — bloquant

**Avant :** le JSON Schema interdisait les propriétés inconnues et imposait un
identifiant kebab-case, mais le validateur runtime les acceptait.

**Risque :** un pack accepté en production pouvait être refusé par les outils
d’authoring fondés sur le schéma.

**Correction :** contrôle runtime des propriétés autorisées, du format de l’ID,
de la longueur de langue et des chaînes optionnelles. Les contrôles sémantiques
supplémentaires — unicité des scènes et existence de `startScene` — sont
conservés.

### A6 — Perte de focus à la navigation — important

**Avant :** le renderer remplaçait tout le DOM, supprimant le bouton actif.

**Risque :** rupture de navigation pour les personnes utilisant le clavier.

**Correction :** après rendu, le focus revient sur le contrôle demandé ou sur
le contrôle encore actif si le premier est désactivé. Le test navigateur
confirme qu’à la dernière scène le focus est placé sur `Previous`.

## Narrative Pack et JSON Schema

Le pack d’exemple est indépendant du code. Sa structure minimale est cohérente :

```text
examples/demo-pack/
├── pack.json
└── assets/
    ├── foundation.svg
    └── welcome.svg
```

Le schéma Draft 2020-12 est syntaxiquement valide, fermé par
`additionalProperties: false`, et le build publie aussi `schemas/` afin que son
`$id` soit résolvable sur Pages. La version `1.0` est explicitement discriminée.

Le validateur a été testé avec :

- le pack d’exemple : accepté sans erreur ;
- une propriété moteur inconnue : rejetée ;
- un identifiant de scène dupliqué : rejeté.

## npm workspaces et dépendances

`npm ls --all` résout les six workspaces locaux aux versions `0.1.0`. Les
dépendances internes forment un DAG. Les dépendances optionnelles non adaptées
à Windows affichées par Vite/Rollup/esbuild sont normales et ne constituent pas
des erreurs d’installation.

Versions verrouillées lors de l’audit :

- TypeScript `5.9.3` ;
- Vite `6.4.3` ;
- types Node `22.20.1`.

## Build et exécution

| Vérification | Résultat |
| --- | --- |
| `npm install` | Réussi, 23 packages, 0 vulnérabilité |
| `npm ci` depuis un dossier propre | Réussi, 23 packages, 0 vulnérabilité |
| `npm run typecheck` | Réussi, aucune erreur TypeScript |
| `npm run dev` | Réussi, Vite disponible sur le sous-chemin Pages |
| `npm run build` | Réussi, 8 modules transformés |
| Player | Rendu des deux scènes et navigation réussis |
| Routes config/pack/asset/schema | HTTP 200 |
| Service worker | Syntaxe valide, fichiers du shell présents |
| Mobile 390 × 844 | Aucun débordement horizontal |

La machine d’audit ne fournit pas npm globalement et son certificat local ne
reconnaît pas la chaîne TLS du registre. npm 10.9.4 a donc été exécuté depuis
son archive officielle temporaire, avec désactivation TLS locale après création
du lockfile et contrôle d’intégrité. Cette particularité appartient à
l’environnement d’audit, pas au dépôt.

## GitHub Actions et Pages

Les deux workflows ont été inspectés :

- Build : push hors `main`, pull request et déclenchement manuel ;
- Pages : push sur `main` et déclenchement manuel ;
- permissions Pages minimales (`contents: read`, `pages: write`,
  `id-token: write`) ;
- jobs build/deploy séquencés par `needs` ;
- environnement `github-pages` et URL de sortie ;
- concurrence unique avec annulation d’un déploiement obsolète ;
- absence de déploiement sur pull request ;
- échec immédiat si installation, typecheck, build, upload ou déploiement
  échoue.

La configuration correspond au flux documenté par GitHub. L’état d’exécution
distant n’a pas pu être consulté : GitHub CLI est absent et l’API publique
retourne 404 pour ce dépôt. Ce point ne remet pas en cause la validation statique
du workflow mais doit être confirmé dans l’onglet Actions après publication.

## PWA

Le manifest est valide et relié par le HTML. Le scope et `start_url` sont
relatifs au sous-chemin Pages. Le service worker :

- précharge le shell et la configuration du Player ;
- nettoie les anciennes versions de cache ;
- utilise une stratégie réseau puis cache pour les ressources visitées ;
- est livré dans `dist/` avec le manifest et l’icône.

L’environnement de navigateur automatisé n’a pas exposé d’enregistrement de
service worker, bien que le script soit servi et syntaxiquement valide. Le mode
hors ligne complet reste donc une vérification résiduelle à automatiser dans un
véritable test navigateur installé.

## Risques résiduels

### R1 — Absence de tests automatisés — priorité haute

La CI ne possède encore ni tests unitaires ni tests navigateur. Le build détecte
les erreurs de type et d’intégration de bundle, mais pas les régressions de
navigation, de validation ou d’accessibilité.

### R2 — Contrats publics hébergés dans Core — priorité moyenne

`NarrativePack`, `NarrativeScene` et `ValidationResult` vivent dans `core`.
Cela est suffisant aujourd’hui mais oblige `validators`, `renderer` et `sdk` à
dépendre du package d’exécution pour de simples contrats.

### R3 — I/O navigateur dans Core — priorité moyenne

`loadNarrativePack` utilise `fetch` et `URL`. Le domaine reste indépendant des
œuvres, mais un futur usage serveur, natif ou test isolé bénéficiera d’un port
de chargement injecté.

### R4 — Stratégie de version de schéma — priorité moyenne

Le schéma 1.0 est discriminé mais son chemin n’est pas versionné. Modifier le
fichier en place casserait la reproductibilité historique des packs.

### R5 — PWA multi-navigateurs — priorité moyenne

L’icône SVG unique et la stratégie de cache réseau-first doivent être validées
sur les navigateurs ciblés. Le cache ne garantit le hors-ligne complet qu’après
que toutes les ressources du pack ont été visitées.

### R6 — Packages non publiables isolément — priorité basse

Les exports pointent vers les sources `.ts` et les packages sont privés. C’est
adapté au monorepo actuel, mais un futur SDK distribué nécessitera des sorties
compilées et des contrats d’exports distincts.

## Recommandations pour INE-002 et les missions suivantes

Ces recommandations sont volontairement **non implémentées** pendant INE-001A.

1. **Créer une suite de tests dédiée.** Commencer par Core et Validators, puis
   ajouter un test navigateur du Player, du focus et du mode hors ligne. C’est
   la priorité immédiate avant toute extension fonctionnelle.
2. **Versionner physiquement les schémas.** Publier par exemple
   `schemas/1.0/narrative-pack.schema.json`, conserver chaque version et tester
   les fixtures conformes/non conformes.
3. **Étudier un package `contracts`.** Y déplacer seulement les types stables
   partagés lorsqu’un deuxième consommateur externe réel apparaît. Ne pas le
   créer par anticipation sans mission dédiée.
4. **Introduire un port de chargement.** Séparer à terme lecture réseau,
   validation et normalisation pour tester le Core sans navigateur et permettre
   d’autres environnements.
5. **Définir le contrat de ressources.** Documenter URI relatives, URI absolues,
   origine croisée, CORS, intégrité et politique de sécurité avant d’ajouter
   audio ou vidéo.
6. **Durcir la chaîne CI.** Ajouter audit de lockfile, tests, validation du
   schéma et éventuellement épinglage des actions GitHub par SHA dans une
   mission de sécurité dédiée.
7. **Qualifier la PWA.** Ajouter icônes raster standards, politique de mise à
   jour, versionnement de cache et scénario automatisé offline dans une mission
   PWA dédiée.

## Validation finale

**Décision : fondation validée.**

Aucune faiblesse structurelle majeure non documentée ne bloque INE-002. Le Core
reste indépendant des contenus, le Player n’encode plus le pack d’exemple,
l’installation et la CI sont reproductibles, et le projet compile et s’exécute.
Les risques résiduels concernent principalement le niveau de tests, la future
stabilisation des contrats et le durcissement PWA ; ils peuvent être traités par
des missions dédiées sans refonte de la fondation actuelle.

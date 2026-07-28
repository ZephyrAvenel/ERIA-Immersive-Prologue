# INE-005 — Moteur de transitions entre scènes

## 1. État Git initial

Audit réalisé avant modification :

```text
branche : main
origin/main...main : 0 0
dernier commit : 07851ac INE-004 Stabilize browser test focus handling
état initial : dépôt propre
```

GitHub Actions initial :

- dernier run observé : `30385304408` ;
- workflow : `Deploy GitHub Pages` ;
- conclusion : succès ;
- commit : `07851ac62b6d85c8947af79065328610110a6295`.

GitHub Pages initial :

- URL : `https://zephyravenel.github.io/ERIA-Immersive-Prologue/` ;
- réponse : `HTTP 200 OK`.

## 2. Architecture retenue

Les transitions restent dans les couches existantes :

- **Core** : types, valeurs par défaut, normalisation et résolution de la
  transition applicable à une scène.
- **Validators** : validation runtime des objets de transition.
- **JSON Schema** : contrat machine lisible pour les outils d'auteur.
- **Player** : orchestration de navigation, verrouillage, `aria-busy`,
  préférence utilisateur `prefers-reduced-motion`, et restauration du focus.
- **Renderer** : exécution visuelle, nettoyage DOM et fallback immédiat.

Aucun nouveau package n'a été créé, car la responsabilité est encore compacte et
s'insère naturellement dans Renderer/Player.

## 3. Contrat des transitions

Types pris en charge :

```text
none
fade
crossfade
slide
```

Easings autorisés :

```text
linear
ease
ease-in
ease-out
ease-in-out
```

Contrat public :

```ts
interface SceneTransition {
  readonly type: TransitionType;
  readonly durationMs?: number;
  readonly easing?: TransitionEasing;
}
```

La transition attachée à une scène est interprétée comme la transition utilisée
lors de son entrée.

## 4. Valeurs par défaut

Valeur par défaut lorsqu'aucune transition n'est déclarée :

```text
type: none
durationMs: 0
easing: ease-in-out
```

Pour les transitions animées sans durée explicite, la normalisation Core utilise
`450 ms`. La durée validée doit rester entre `0` et `3000 ms`.

`none` normalise toujours sa durée à `0`, même si une durée est fournie.

## 5. Modifications du JSON Schema

`schemas/narrative-pack.schema.json` accepte désormais :

- `presentation.defaultTransition` au niveau pack ;
- `transition` au niveau scène ;
- un `$defs.transition` strict, sans propriété inconnue ;
- `type` requis ;
- `durationMs` borné entre `0` et `3000` ;
- `easing` limité aux valeurs autorisées.

## 6. Modifications du validateur

Le validateur runtime rejette :

- type de transition inconnu ;
- durée négative ;
- durée supérieure à `3000` ;
- durée non numérique ;
- easing inconnu ;
- propriété supplémentaire ;
- transition non objet ;
- objet `presentation` mal formé.

Les codes d'erreur restent stables et testés.

## 7. Modifications du Core

Ajouts principaux :

- `TransitionType` ;
- `TransitionEasing` ;
- `TransitionDirection` ;
- `SceneTransition` ;
- `NormalizedSceneTransition` ;
- `NarrativePresentation` ;
- `DEFAULT_SCENE_TRANSITION` ;
- `normalizeSceneTransition` ;
- `getSceneTransition` ;
- `getTransitionDirection` ;
- `NarrativeEngine.transitionForScene` ;
- `NarrativeEngine.transitionForSceneIndex`.

Le Core ne manipule ni DOM, ni CSS, ni animation.

## 8. Modifications du Player et du Renderer

Player :

- calcule la transition d'entrée avant navigation ;
- ignore les navigations concurrentes pendant une transition ;
- désactive temporairement les boutons ;
- expose `aria-busy="true"` pendant l'état transitoire ;
- restaure le focus sur un contrôle actif ;
- respecte `prefers-reduced-motion`.

Renderer :

- rend immédiatement `none` ;
- exécute `fade`, `crossfade` et `slide` ;
- nettoie les classes et attributs transitoires ;
- supprime l'ancien contenu après `crossfade` ;
- conserve `object-fit: contain` par défaut ;
- retombe sur un rendu immédiat si l'animation échoue.

## 9. Comportement `prefers-reduced-motion`

Si `prefers-reduced-motion: reduce` est actif, le Player demande un rendu
immédiat. Le Narrative Pack ne peut pas forcer une animation contre cette
préférence utilisateur.

## 10. Gestion du focus

Après navigation :

- le focus revient sur le bouton demandé si celui-ci reste actif ;
- sinon, il revient sur l'autre contrôle actif ;
- le focus n'est pas envoyé vers un bouton désactivé ;
- le document ne reste pas l'élément actif après transition.

## 11. Stratégie de verrouillage de navigation

Pendant une transition :

- `transitionInProgress` empêche toute navigation concurrente ;
- les boutons courants sont désactivés ;
- `aria-busy` indique l'état temporaire ;
- les doubles activations rapides sont ignorées de manière déterministe.

Aucune file de navigation n'a été ajoutée.

## 12. Tests ajoutés

Unitaires Core :

- transition absente ;
- transition par défaut du pack ;
- surcharge par scène ;
- types `none`, `fade`, `crossfade`, `slide` ;
- durées `0` et `3000` ;
- easing valide ;
- direction `slide` suivante/précédente.

Unitaires Validators :

- contrat JSON Schema/runtime ;
- cas invalides de transition ;
- bornes et enums.

Unitaires Renderer :

- rendu immédiat `none` ;
- reduced motion ;
- application `fade` ;
- nettoyage des états transitoires ;
- retrait de l'ancien contenu après `crossfade` ;
- direction `slide` ;
- fallback immédiat en cas d'échec.

Navigateur :

- navigation animée suivante/précédente ;
- progression mise à jour ;
- double activation rapide ;
- `aria-busy` pendant transition ;
- focus restauré ;
- responsive desktop/tablette/mobile ;
- absence de débordement horizontal ;
- `prefers-reduced-motion: reduce` sans animation.

## 13. Fixtures ajoutées

Valides :

- `default-transition.json` ;
- `scene-transition-override.json` ;
- `reduced-transition-none.json`.

Invalides :

- `unknown-transition-type.json` ;
- `negative-transition-duration.json` ;
- `too-long-transition-duration.json` ;
- `nonnumeric-transition-duration.json` ;
- `unknown-transition-easing.json` ;
- `transition-extra-property.json` ;
- `malformed-transition.json`.

## 14. Couverture obtenue

Résultat local via Node.js :

```text
all files       | lines 94.04 % | branches 89.33 % | functions 98.00 %
core/index.js   | lines 95.86 % | branches 89.47 % | functions 96.77 %
renderer/index.js | lines 94.51 % | branches 87.80 % | functions 100 %
validators/index.js | lines 91.34 % | branches 90.38 % | functions 100 %
```

Les seuils existants ne sont pas diminués.

## 15. Résultats navigateur

Test navigateur réel local avec Chrome explicite :

```text
1 test navigateur
1 succès
0 échec
```

Scénarios couverts :

- transitions animées ;
- double clic sans saut de scène ;
- focus ;
- responsive ;
- reduced motion.

## 16. Vérifications responsive

Le scénario navigateur vérifie :

- `1280 × 800` ;
- `768 × 1024` ;
- `390 × 844`.

Pour chaque taille :

- aucun débordement horizontal ;
- image visible ;
- contenu dans la fenêtre ;
- navigation accessible.

## 17. Résultats CI

La validation distante ne peut être observée qu'après publication du commit
INE-005. Pour préserver la règle d'un commit sans réécriture distante, le
résultat terminal GitHub Actions est consigné dans la clôture de mission.

## 18. URL GitHub Pages vérifiée

Avant modification :

```text
https://zephyravenel.github.io/ERIA-Immersive-Prologue/
HTTP 200 OK
```

Après publication, l'URL devra être revérifiée et consignée dans la clôture.

## 19. Limites résiduelles

- `npm` n'est pas disponible dans l'environnement Codex local ; aucune
  substitution par un autre gestionnaire n'a été utilisée.
- La validation npm complète est donc réalisée par GitHub Actions.
- Le Renderer utilise une promesse Web Animations comme mécanisme principal et
  un filet de sécurité borné par la durée validée pour éviter qu'un navigateur
  headless ne bloque indéfiniment la navigation.

## 20. Recommandations pour INE-006

INE-006 devrait introduire la persistance de progression sans modifier le
contrat de transition. Les points à tester dès le début :

- reprise sur une scène autre que la première ;
- restauration de focus après reprise ;
- compatibilité avec `prefers-reduced-motion` ;
- absence d'écriture si le stockage est indisponible ;
- migration sûre en cas de future version de Narrative Pack.

## 21. État Git final attendu

Commit recommandé :

```text
INE-005 Add configurable scene transitions
```

Avant commit et push :

- `git diff --check` ;
- `git status --short` ;
- `git fetch origin --prune` ;
- `git rev-list --left-right --count origin/main...main`.

Si une anomalie CI non détectable localement apparaît après publication, elle
devra être corrigée par un second commit minimal, sans amend ni force-push.

# INE-007 — Première expérience immersive « Récits Vivants »

Date : 2026-07-29

## 1. Résumé

INE-007 transforme le Player en une première expérience immersive contemplative, tout en conservant l’indépendance entre le moteur et l’œuvre.

La mission livre :

- une mise en page `100dvh` qui garde les scènes standards dans la fenêtre visible ;
- une hiérarchie verticale plus dense et plus lisible ;
- des commandes tactiles plus confortables ;
- une interface publique débarrassée des libellés techniques visibles ;
- un prologue générique piloté par le Narrative Pack ;
- le premier Narrative Pack artistique : `Les Gardiens des Récits Vivants`.

## 2. Corrections UX réalisées

La structure visuelle du Player a été resserrée :

- hauteur du Player basée sur `100dvh` ;
- grille verticale `header / scene / footer` avec zone centrale flexible ;
- réduction des marges verticales ;
- image maintenue en élément dominant ;
- progression et navigation conservées dans la zone visible ;
- titres plus grands et plus organiques ;
- texte narratif légèrement agrandi avec interlignage renforcé ;
- boutons élargis, hauteur tactile confortable et contraste plus fort.

Les libellés publics `Immersive Narrative Engine` et `Pack narratif` ne dominent plus l’écran. L’identité visible est désormais celle de l’œuvre.

## 3. Améliorations responsive

Le scénario navigateur couvre explicitement :

- `1366 × 768` ;
- `1280 × 800` ;
- `1024 × 768` ;
- `768 × 1024` ;
- `430 × 932` ;
- `390 × 844` ;
- `360 × 800`.

Pour chaque taille, le test vérifie :

- absence de défilement horizontal ;
- absence de défilement vertical pour la scène standard courte ;
- navigation visible ;
- commandes dans la fenêtre ;
- image chargée, visible et en `contain`.

## 4. Suppression du défilement standard

Le problème de scène plus haute que la fenêtre a été traité par :

- `height: 100dvh` sur le Player ;
- lignes de grille flexibles ;
- hauteur d’image en `clamp()` et `dvh` ;
- footer compact ;
- en-tête discret ;
- réduction des espaces morts.

Le défilement vertical reste possible par le navigateur si un futur pack fournit exceptionnellement un texte long.

## 5. Narrative Pack créé

Le pack intégré devient :

```text
Les Gardiens des Récits Vivants
```

Identifiant stable :

```text
les-gardiens-des-recits-vivants
```

La première salle utilise la baleine cosmique :

```text
assets/images/scene-02-cosmic-whale.png
```

Les huit images existantes sont conservées. Les textes et titres du pack ont été remplacés par une séquence artistique cohérente avec la nouvelle œuvre.

## 6. Prologue

Le prologue est déclaré dans le Narrative Pack via :

```text
presentation.intro
```

Contrat ajouté :

- `lines` ;
- `title` optionnel ;
- `actionLabel`.

Le Player rend ce prologue comme un seuil générique :

- écran sombre ;
- étoiles discrètes ;
- spirale dorée ;
- phrases progressives ;
- bouton d’entrée ;
- transition douce vers la première salle sans rechargement de page.

Le respect de `prefers-reduced-motion` est conservé : les animations deviennent quasi instantanées lorsque l’utilisateur demande une réduction des mouvements.

## 7. Architecture

Le moteur reste générique :

- le Core expose seulement le type `NarrativeIntro` ;
- le JSON Schema valide la structure `presentation.intro` ;
- le validateur runtime rejette les intros mal formées ;
- le Player orchestre l’écran d’intro sans connaître l’œuvre ;
- le Narrative Pack fournit les phrases, le titre et le libellé d’entrée.

Aucune logique spécifique à ERIA ou aux `Gardiens des Récits Vivants` n’a été placée dans le moteur.

## 8. Tests ajoutés ou adaptés

Tests unitaires :

- contrat runtime de `presentation.intro` ;
- cohérence JSON Schema / validateur ;
- rejet d’intro sans `actionLabel` ;
- rejet d’intro avec propriété inconnue ;
- rejet d’intro sans lignes valides ;
- Renderer sans libellés techniques visibles.

Tests d’intégration :

- pack `Les Gardiens des Récits Vivants` valide ;
- intro présente et localisée dans le pack ;
- première scène baleine ;
- huit PNG toujours présents et non vides ;
- pack toujours portable après déplacement simulé.

Tests navigateur :

- affichage du prologue ;
- bouton `Franchir le seuil` ;
- entrée sans rechargement de page ;
- première scène baleine ;
- reprise de lecture ;
- recommencement et relecture du prologue ;
- dernière scène `completed: true` ;
- stockage indisponible ;
- `prefers-reduced-motion` ;
- sept tailles d’écran ;
- absence de scroll standard ;
- focus et navigation clavier ;
- absence d’erreur console.

## 9. Résultats locaux

Environnement :

- Node.js `v24.18.0` ;
- npm `11.16.0` via `npm.cmd` ;
- Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe`.

Commandes exécutées :

| Commande | Résultat |
|---|---|
| `npm.cmd ci` | Réussi |
| `npm.cmd run typecheck` | Réussi |
| `npm.cmd run test:unit` | 48 tests passés |
| `npm.cmd run test:integration` | 5 tests passés |
| `npm.cmd run test:coverage` | 53 tests passés, seuils respectés |
| `npm.cmd run build` | Réussi hors sandbox après échec esbuild sandbox connu |
| `npm.cmd run test:e2e` | 1 scénario navigateur passé |

Couverture :

| Zone | Lignes | Branches | Fonctions |
|---|---:|---:|---:|
| Core | 96.13 % | 90.16 % | 97.06 % |
| Renderer | 85.53 % | 85.25 % | 77.78 % |
| Validators | 89.26 % | 88.71 % | 100.00 % |
| Total | 89.66 % | 88.04 % | 89.86 % |

Les seuils de couverture n’ont pas été diminués.

## 10. Validation distante

Commit publié :

```text
ae3a3e9 — INE-007 First immersive Recits Vivants experience
```

Exécution GitHub Actions :

- workflow : `Deploy GitHub Pages` ;
- run : `30470826289` ;
- URL : <https://github.com/ZephyrAvenel/ERIA-Immersive-Prologue/actions/runs/30470826289> ;
- conclusion : succès.

Étapes vérifiées :

- `Install dependencies` : succès ;
- `Typecheck` : succès ;
- `Unit tests` : succès ;
- `Integration tests` : succès ;
- `Coverage` : succès ;
- `Build` : succès ;
- `Browser tests` : succès ;
- `Upload Pages artifact` : succès ;
- `Deploy to GitHub Pages` : succès.

GitHub Pages :

- URL : <https://zephyravenel.github.io/ERIA-Immersive-Prologue/> ;
- statut HTTP : `200` ;
- type : `text/html; charset=utf-8`.

Vérification navigateur publiée :

- prologue affiché ;
- bouton `Franchir le seuil` fonctionnel sans rechargement de page ;
- huit scènes parcourues ;
- huit images visibles ;
- `naturalWidth > 0` et `naturalHeight > 0` pour chaque image ;
- `data-image-state="ready"` pour chaque scène ;
- `object-fit: contain` conservé ;
- `aria-busy` absent après chaque transition ;
- focus restauré sur un bouton actif ;
- aucune réponse PNG invalide ;
- aucune erreur console détectée.

Tailles vérifiées sur la version publiée :

- `1366 × 768` ;
- `1280 × 800` ;
- `1024 × 768` ;
- `768 × 1024` ;
- `430 × 932` ;
- `390 × 844` ;
- `360 × 800`.

Pour chaque taille, la scène standard tient dans la hauteur visible, les commandes restent visibles et aucun débordement horizontal n’a été détecté.

## 11. Limites restantes

- Les polices souhaitées sont déclarées par familles CSS, sans import externe bloquant.
- Aucun son artificiel n’a été ajouté ; l’architecture laisse la place à une future mission audio.
- Le prologue reste volontairement sobre et générique.

## 12. État final

INE-007 est validée :

- l’interface technique s’efface au profit de l’œuvre ;
- le Narrative Pack `Les Gardiens des Récits Vivants` est opérationnel ;
- le prologue cinématographique fonctionne ;
- les scènes standards ne nécessitent pas de défilement pour atteindre la navigation ;
- les tests locaux et distants sont verts ;
- GitHub Pages est publié et accessible.

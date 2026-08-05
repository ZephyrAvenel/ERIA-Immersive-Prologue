# INE-029 — Mode optionnel `image-then-text`

## Objectif

Le mode `image-then-text` a été ajouté pour répondre au besoin spécifique de PACK-009 : préserver à la fois la lisibilité des images éditorialisées et la richesse des textes narratifs.

## Principe

Un pack narratif peut déclarer :

```json
"layout": "image-then-text"
```

Lorsque ce champ est présent, chaque scène est présentée en deux phases :

1. phase image : contemplation du visuel complet ;
2. phase texte : lecture du titre et du texte narratif complet.

Sans ce champ, les packs narratifs existants continuent d’utiliser le rendu classique.

## Contrat technique

Le champ `layout` est :

- optionnel ;
- autorisé uniquement sur les packs `ine-narrative-pack` ;
- validé par `schemas/narrative-pack.schema.json` ;
- validé par le runtime validator ;
- typé dans `@ine/core`.

Valeur actuellement autorisée :

- `image-then-text`

## Comportement de navigation

Pour un pack en `image-then-text` :

- `Suivant` depuis une phase image mène à la phase texte de la même scène ;
- `Suivant` depuis une phase texte mène à l’image de la scène suivante ;
- `Précédent` depuis une phase texte revient à l’image de la même scène ;
- `Précédent` depuis une phase image revient au texte de la scène précédente ;
- le dernier texte affiche le lien de poursuite vers la bibliothèque.

Le compteur public reste basé sur le nombre réel de scènes, sans doubler artificiellement le parcours :

- `Scène 1 / 11 — Contempler`
- `Scène 1 / 11 — Lire`

## Fichiers modifiés

- `packages/core/src/index.ts`
- `packages/validators/src/index.ts`
- `packages/renderer/src/index.ts`
- `schemas/narrative-pack.schema.json`
- `apps/player/src/main.ts`
- `apps/player/src/styles.css`
- `apps/player/src/localization.ts`
- `apps/player/src/locales/fr.json`
- `apps/player/src/locales/en.json`
- tests unitaires, intégration et e2e associés

## Choix UX

Le mode cache le texte pendant la contemplation et cache l’image pendant la lecture. Ce choix évite les compromis visuels qui avaient motivé la mission :

- pas de rognage des visuels ;
- pas de texte narratif compressé sous l’image ;
- pas de boutons superposés au contenu intégré dans les images ;
- navigation claire entre contemplation et lecture.

## Portée

Le CSS spécifique PACK-009 est ciblé par :

```css
.player[data-pack-id="pack-009-trouver-sa-juste-place"]
```

Le comportement générique du mode utilise :

```css
.player[data-layout="image-then-text"]
```

Les anciens packs ne déclarent pas ce layout et ne basculent donc pas dans ce mode.

## Validations

- Contrat JSON Schema : OK
- Validation runtime : OK
- Renderer : data attributes `data-layout` et `data-layout-phase` testés
- Navigation e2e : image → texte → scène suivante testée jusqu’à la fin du pack
- Non-régression anciens packs : OK

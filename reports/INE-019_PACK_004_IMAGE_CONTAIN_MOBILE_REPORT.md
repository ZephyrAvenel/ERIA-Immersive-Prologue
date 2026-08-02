# INE-019 — Affichage complet des images du PACK-004 sur mobile

## Problème constaté

Sur mobile, les scènes longues du `PACK-004 — La Voie du Milieu` laissent moins d’espace vertical à l’image.

Même si le renderer narratif utilise déjà `object-fit: contain` par défaut, la hauteur mobile contrainte des images pouvait donner un rendu trop comprimé ou donner l’impression que les visuels étaient rognés, notamment sur les images contenant des titres, symboles ou textes intégrés.

Les scènes prioritaires étaient :

- scène 4 / 11 — `Les récits qui enferment` ;
- scène 5 / 11 — `Entre deux récits, un choix ?` ;
- scène 7 / 11 — `La présence au-delà des récits` ;
- scène 9 / 11 — `Au seuil d’un monde vivant` ;
- scène 11 / 11 — `Les récits vivants continuent…`.

## Cause technique

Le layout mobile générique du player applique une hauteur fixe responsive aux images narratives :

```css
.scene__image {
  height: clamp(11rem, 38dvh, 24rem);
}
```

Ce comportement est adapté aux packs narratifs existants, mais moins confortable pour `PACK-004`, dont les images horizontales contiennent de nombreux éléments typographiques intégrés.

## Solution appliquée

Correction CSS ciblée sur le pack :

```css
.player[data-pack-id="pack-004"] .scene__image {
  height: auto;
  max-height: min(42dvh, 24rem);
  object-fit: contain;
}
```

Le ciblage utilise l’attribut déjà exposé par le renderer :

```html
<div class="player" data-pack-id="pack-004">
```

Ainsi, `PACK-001`, `PACK-002` et `PACK-003` ne sont pas affectés.

## Zone finale d’actions

Sur mobile, la zone de navigation du `PACK-004` est désormais empilée verticalement :

- les boutons restent lisibles ;
- les zones tactiles restent confortables ;
- le lien `Poursuivre votre exploration` ne se comprime plus entre les boutons ;
- le pictogramme bibliothèque conserve son comportement existant.

## Fichiers modifiés

- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `reports/INE-019_PACK_004_IMAGE_CONTAIN_MOBILE_REPORT.md`

## Fichiers non modifiés

- Aucun fichier de `PACK-001`.
- Aucun fichier de `PACK-002`.
- Aucun fichier de `PACK-003`.
- Aucune image.
- Aucun manifeste.
- Aucune route.
- Aucun registre.

## Choix retenu

Le correctif reste volontairement local :

- pas de changement d’architecture ;
- pas de modification du renderer ;
- pas de duplication de contenu ;
- pas de modification éditoriale ;
- pas de dépendance ajoutée.

## Vérifications responsive

Vérifications effectuées dans le navigateur intégré sur build local :

- mobile 360 px : OK ;
- mobile 390 px : OK ;
- mobile 430 px : OK ;
- tablette 768 px : OK ;
- desktop 1280 px : OK.

Pour les scènes 4, 5, 7, 9 et 11 :

- `object-fit: contain` confirmé ;
- images WebP chargées ;
- pas de débordement horizontal ;
- contrôles dans le viewport ;
- pictogramme bibliothèque sans chevauchement avec les contrôles ;
- boutons finaux empilés sur mobile et tablette ;
- boutons conservés en ligne sur desktop.

## Vérifications automatisées ajoutées

Le scénario navigateur vérifie désormais sur `PACK-004` :

- route directe `/oeuvres/voie-du-milieu/` ;
- chargement du pack ;
- navigation jusqu’à la scène 11 / 11 ;
- rendu `object-fit: contain` ;
- images WebP chargées ;
- absence de débordement horizontal ;
- contenu principal dans le viewport ;
- contrôles finaux empilés et tactiles sur mobile.

## Statut des tests

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK — 64 tests
- `npm.cmd run test:integration` : OK — 19 tests
- `npm.cmd run test:coverage` : OK — 83 tests, seuils respectés
- `npm.cmd run build` : OK après relance hors sandbox Windows
- `npm.cmd run test:e2e` : scénario sauté localement, Chrome non disponible
- Vérification navigateur intégré : OK

## Limites éventuelles

Le rendu exact dépend de la hauteur disponible du viewport mobile. Le choix `height: auto` avec `max-height` privilégie l’intégrité visuelle des images et accepte un effet de respiration / letterbox plutôt qu’un rognage.

Le test e2e local n’a pas pu lancer Chrome, car aucun binaire Chrome n’est disponible dans l’environnement local Codex. Le scénario n’a pas été désactivé ; il reste actif pour GitHub Actions.

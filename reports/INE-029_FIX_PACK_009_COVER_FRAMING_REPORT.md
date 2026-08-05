# INE-029-FIX — Cadrage couverture PACK-009 dans la bibliothèque

## Problème constaté

Dans la bibliothèque des œuvres immersives, la couverture du PACK-009 — **Trouver sa juste place** était affichée avec le cadrage standard des cartes.

Comme l’image de couverture contient du texte important dans sa partie haute, la ligne :

> HABITER SA PLACE SANS DOMINER, SANS S’EFFACER.

pouvait être rognée verticalement.

## Solution appliquée

Une règle CSS ciblée sur la carte bibliothèque du PACK-009 a été ajoutée :

```css
.work-card[data-work-slug="trouver-sa-juste-place"] .work-card__image {
  object-position: center top;
}
```

Cette correction conserve :

- `object-fit: cover` ;
- le format homogène des cartes ;
- le comportement de la bibliothèque ;
- les images originales et WebP inchangées.

## Fichiers modifiés

- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `reports/INE-029_FIX_PACK_009_COVER_FRAMING_REPORT.md`

## Portée

La correction est strictement limitée à :

`data-work-slug="trouver-sa-juste-place"`

Aucun pack existant n’a été modifié directement.

## Confirmations

- Aucune image modifiée.
- Aucun WebP régénéré.
- Aucun texte éditorial modifié.
- Aucun changement sur le mode `image-then-text`.
- Aucun changement de route.
- Aucun changement de registre.
- Les autres cartes de bibliothèque gardent leur cadrage actuel.

## Tests

Le test e2e a été ajusté pour vérifier que la carte PACK-009 utilise désormais :

`object-position: 50% 0%`

Les validations complètes ont été relancées après correction.

# PACK-003 - Atlas des Récits Vivants

Pack autonome pour l'Immersive Narrative Engine.

- `pack.json` décrit l'oeuvre et référence les huit Living Cards.
- `cards/` contient les cartes JSON, sans dépendance avec les autres packs.
- `assets/images/` contient les WebP définitifs utilisés par le moteur.
- `assets/images/originals/` conserve les PNG définitifs renommés.

Le format `ine-living-card-pack` est interprété par le Player via le
`LivingCardRenderer`. Tous les textes visibles viennent du manifeste ou des
cartes JSON.

Route canonique : `/oeuvres/atlas-recits-vivants/`.

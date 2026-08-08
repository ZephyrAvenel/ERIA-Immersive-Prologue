# PACK-012 — Celle que je n’avais pas encore rencontrée

## Intention

**Celle que je n’avais pas encore rencontrée** est une novella photographique immersive des Récits Vivants.

Le parcours suit une femme dont la vie semble déjà écrite. La rencontre indirecte avec une autre femme lui révèle une manière d’exister qui la fascine. Elle croit d’abord vouloir devenir cette autre personne, puis comprend progressivement que ce qu’elle admirait chez l’autre révélait en réalité une possibilité encore inexplorée d’elle-même.

L’autre devient un passeur plutôt qu’un modèle.

## Structure technique

- format : `ine-narrative-pack`
- layout : `image-then-text`
- route : `/oeuvres/celle-que-je-navais-pas-encore-rencontree/`
- images WebP utilisées par le player : `assets/images/*.webp`
- originaux PNG conservés : `assets/images/originals/*.png`

## Ordre du parcours

| Entrée | Titre | Image WebP |
| --- | --- | --- |
| 00 | Couverture — Celle que je n’avais pas encore rencontrée | `pack-012-cover.webp` |
| 01 | La vie déjà écrite | `pack-012-01-vie-deja-ecrite.webp` |
| 02 | La fenêtre sur une autre vie | `pack-012-02-fenetre-autre-vie.webp` |
| 03 | La fascination | `pack-012-03-fascination.webp` |
| 04 | Le déplacement | `pack-012-04-deplacement.webp` |
| 05 | Perdre son ancien nom | `pack-012-05-perdre-ancien-nom.webp` |
| 06 | Essayer une autre peau | `pack-012-06-autre-peau.webp` |
| 07 | Traverser l’inconnu | `pack-012-07-traverser-inconnu.webp` |
| 08 | Découvrir que l’autre était un miroir | `pack-012-08-autre-miroir.webp` |
| 09 | Ne pas devenir l’autre | `pack-012-09-ne-pas-devenir-autre.webp` |
| 10 | Revenir autrement | `pack-012-10-revenir-autrement.webp` |
| 11 | Habiter son propre récit | `pack-012-11-habiter-propre-recit.webp` |
| 12 | Clôture — Épilogue | `pack-012-closing.webp` |

## Note sur la couverture

La consigne éditoriale indique que la couverture ne nécessite pas de texte « Lire » supplémentaire. Le schéma actuel des packs `image-then-text` impose toutefois un champ `text` non vide pour chaque entrée. La couverture porte donc un texte minimal — « Un récit vivant. » — afin de respecter le validateur sans créer une architecture parallèle.

## Remplacement des images

1. Conserver le PNG maître dans `assets/images/originals/`.
2. Générer le WebP correspondant dans `assets/images/` sans recadrage destructif.
3. Vérifier que `pack.json` pointe vers le WebP.
4. Conserver les dimensions originales autant que possible.

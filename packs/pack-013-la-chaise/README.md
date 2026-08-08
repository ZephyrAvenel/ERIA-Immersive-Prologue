# PACK-013 — La Chaise

## Intention

`La Chaise` est un parcours narratif immersif consacre a la place dans les relations : appartenance, reconnaissance, reciprocite, roles assignes, discernement, liberte relationnelle et co-construction d’espaces habitables.

Le pack invite a observer ce qu’une relation produit reellement : les places offertes, demandees, assignees, quittees, puis celles que nous pouvons construire ensemble.

## Architecture

Le pack suit l’architecture existante des packs narratifs recents :

- `format: ine-narrative-pack`
- `layout: image-then-text`
- `startScene: scene-00`
- images affichees avec `imageDisplayMode: contain`
- parcours `Contempler → Lire → Continuer`

La couverture est integree comme premiere entree du parcours, conformement au comportement des packs image-then-text deja presents.

## Route

Route canonique : `/oeuvres/la-chaise/`

## Structure narrative

| Ordre | Scene | Image |
| --- | --- | --- |
| 00 | La Chaise | `00-couverture-la-chaise.webp` |
| 01 | La Table — Entrer | `01-la-table.webp` |
| 02 | Une place parmi les autres — Appartenir | `02-une-place-parmi-les-autres.webp` |
| 03 | La chaise que l’on nous donne — Recevoir | `03-la-chaise-que-l-on-nous-donne.webp` |
| 04 | Rester debout — Ressentir | `04-rester-debout.webp` |
| 05 | Demander une chaise — Exprimer | `05-demander-une-chaise.webp` |
| 06 | La chaise assignée — Voir | `06-la-chaise-assignee.webp` |
| 07 | Se rétrécir — Discerner | `07-se-retrecir.webp` |
| 08 | Voir le dessous — Observer | `08-voir-le-dessous.webp` |
| 09 | La chaise vide — Traverser | `09-la-chaise-vide.webp` |
| 10 | Se lever — Choisir | `10-se-lever.webp` |
| 11 | Entre les tables — Traverser le vide | `11-entre-les-tables.webp` |
| 12 | La table réciproque — Rencontrer | `12-la-table-reciproque.webp` |
| 13 | Construire la table — Co-créer | `13-construire-la-table.webp` |
| 14 | La chaise libre — Habiter | `14-la-chaise-libre.webp` |

## Assets

Les PNG originaux sont conserves dans `assets/images/originals/`. Les WebP optimises utilises par le player sont generes dans `assets/images/`.

Les images n’ont pas ete recadrees. Les WebP conservent les dimensions et ratios des PNG sources.

## Lien complementaire

La scene 08 — `Voir le dessous — Observer` contient le lien externe `Explorer « Le Dessous »` vers `https://zephyr-avenel.blogspot.com/2026/08/le-dessous.html`.

Le lien s’ouvre dans un nouvel onglet et reste independant de la navigation interne du pack.

## Images 12, 13 et 14

Les trois dernieres images utilisent explicitement les nouveaux visuels fournis :

- image 12 : table reciproque exterieure sous un grand arbre, avec des personnes qui ouvrent leur posture et deplacent des chaises ;
- image 13 : construction collective d’une grande table en bois avec planches et outils ;
- image 14 : table achevee sous l’arbre, groupe en arriere-plan, grande chaise vide au premier plan.

## Remplacement d’une image

Remplacer le PNG original, regenerer le WebP homonyme, conserver le nom canonique attendu par `pack.json`, et verifier que `imageDisplayMode` reste `contain`.

# PACK-005 — Les récits qui révèlent… ou qui enferment

Sous-titre : **Le pouvoir des attentes sur nos vies**

Ce pack est un parcours immersif autonome de l’Immersive Narrative Engine. Il explore le pouvoir discret des attentes, des regards et des récits portés sur les autres comme sur soi-même.

Le parcours est inspiré des travaux de Robert Rosenthal sur l’effet Pygmalion, mais il reste volontairement narratif, psychologique et éthique plutôt qu’un exposé scientifique.

## Structure

```text
packs/pack-005-recits-qui-revelent-ou-enferment/
├── pack.json
├── assets/
│   └── images/
│       ├── *.webp
│       └── originals/
│           └── *.png
└── README.md
```

Le pack utilise le format générique `ine-narrative-pack`, déjà utilisé par les parcours narratifs contemplatifs d’INE.

## Scènes

Le parcours contient 12 étapes :

1. Les récits qui révèlent… ou qui enferment
2. Le premier regard
3. Les attentes invisibles
4. Une expérience célèbre
5. Les chemins qui s’ouvrent
6. Lorsque le récit devient une cage
7. Les récits empêchés
8. Les récits vivants
9. Le récit que je porte sur moi-même
10. Les passeurs de récits
11. Une responsabilité partagée
12. Quel récit faisons-nous grandir ?

## Images

Les images définitives sont conservées en PNG dans `assets/images/originals/`.

Les versions utilisées par le moteur sont des WebP optimisés dans `assets/images/`.

Mapping retenu :

| Rôle | Fichier WebP |
| --- | --- |
| Couverture principale | `00-couverture-recits-qui-revelent-ou-enferment.webp` |
| Couverture alternative conservée | `00-couverture-alt-pack-005.webp` |
| Le premier regard | `01-le-premier-regard.webp` |
| Une expérience célèbre | `03-une-experience-celebre.webp` |
| Les chemins qui s’ouvrent | `04-les-chemins-qui-souvrent.webp` |
| Lorsque le récit devient une cage | `05-lorsque-le-recit-devient-une-cage.webp` |
| Les récits empêchés | `06-les-recits-empeches.webp` |
| Les récits vivants | `07-les-recits-vivants.webp` |
| Le récit que je porte sur moi-même | `08-le-recit-que-je-porte-sur-moi-meme.webp` |
| Les passeurs de récits | `09-les-passeurs-de-recits.webp` |
| Une responsabilité partagée | `10-une-responsabilite-partagee.webp` |
| Clôture | `11-quel-recit-faisons-nous-grandir.webp` |

## Note sur “Les attentes invisibles”

Le dossier fourni contient deux couvertures et aucune image explicitement dédiée à la scène “Les attentes invisibles”.

La scène est conservée dans le parcours, sans image, afin de ne pas inventer de visuel ni réutiliser artificiellement une autre illustration. Le renderer générique sait afficher une scène narrative sans bloc média.

## Remplacer une image

1. Ajouter le nouveau PNG original dans `assets/images/originals/`.
2. Générer une version WebP optimisée portant le même nom de base dans `assets/images/`.
3. Mettre à jour `pack.json` si le nom du fichier change.
4. Vérifier que l’image n’est pas recadrée destructivement.
5. Relancer les tests d’intégration et le build.

## Bibliothèque INE

Le pack est déclaré dans `packs/index.json` avec le slug :

```text
recits-qui-revelent-ou-enferment
```

Sa route canonique est :

```text
/oeuvres/recits-qui-revelent-ou-enferment/
```

La bibliothèque utilise la couverture principale, sans dupliquer les contenus éditoriaux du manifeste.

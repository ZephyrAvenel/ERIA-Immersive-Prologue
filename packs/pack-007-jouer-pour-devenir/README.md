# PACK-007 — Jouer pour devenir

`Jouer pour devenir` est un pack narratif autonome de l’Immersive Narrative Engine.

Il explore le jeu comme espace vivant d’apprentissage, d’imagination, d’essai, de coopération et de transformation. Le pack rappelle que le jeu n’est pas une simple distraction : il est une manière d’habiter le monde, de développer des compétences et de rester vivant à tout âge.

## Structure

```text
packs/pack-007-jouer-pour-devenir/
├── pack.json
├── README.md
└── assets/
    └── images/
        ├── 00-couverture-jouer-pour-devenir.webp
        ├── 01-premier-terrain-exploration.webp
        ├── ...
        ├── 13-le-jeu-continue-avec-vous.webp
        └── originals/
            ├── 00-couverture-jouer-pour-devenir.png
            ├── 01-premier-terrain-exploration.png
            ├── ...
            └── 13-le-jeu-continue-avec-vous.png
```

## Parcours

Le pack suit le modèle narratif déjà utilisé par les packs contemplatifs récents : la couverture est la première étape immersive du parcours.

1. Jouer pour devenir
2. Le premier terrain d’exploration
3. Quand l’imagination transforme la réalité
4. Le droit d’essayer
5. Jouer avec les autres
6. Les récits que nous construisons
7. Les récits empêchés
8. Retrouver le jeu à l’âge adulte
9. Le jeu comme écologie du vivant
10. Apprendre, explorer, créer, recommencer et devenir
11. Le jeu tisse des liens entre les temps
12. Continuer à jouer
13. Et après ?
14. Le jeu continue avec vous

## Images

Les PNG originaux sont conservés dans `assets/images/originals/`.

Les images utilisées par le moteur sont des dérivés WebP optimisés placés dans `assets/images/`. Elles ne doivent pas être recadrées destructivement, car elles contiennent des éléments typographiques intégrés.

## Bibliothèque et route

Le pack est déclaré dans `packs/index.json` avec :

- id : `pack-007`
- slug : `jouer-pour-devenir`
- route publique : `/oeuvres/jouer-pour-devenir/`

L’ajout du pack ne nécessite pas de route codée en dur : le moteur lit le registre, charge le manifeste, puis interprète les scènes.

## Remplacement futur des images

Pour remplacer une image :

1. conserver le PNG original renommé dans `assets/images/originals/` ;
2. générer un WebP optimisé de même nom dans `assets/images/` ;
3. vérifier que `pack.json` pointe vers le WebP ;
4. relancer les tests et le build.

Toute adaptation CSS doit rester ciblée sur `pack-007` afin de préserver les autres œuvres.

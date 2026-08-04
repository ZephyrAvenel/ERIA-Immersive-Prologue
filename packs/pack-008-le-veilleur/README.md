# PACK-008 — Le Veilleur

`Le Veilleur` est un pack narratif autonome de l’Immersive Narrative Engine.

Il propose un parcours contemplatif autour d’une transformation intérieure : passer de la voix qui annonce à la présence qui veille.

## Structure

```text
packs/pack-008-le-veilleur/
├── pack.json
├── README.md
└── assets/
    └── images/
        ├── 00-couverture-le-veilleur.webp
        ├── 01-la-voix.webp
        ├── ...
        ├── 11-cloture-devenir-veilleur.webp
        └── originals/
            ├── 00-couverture-le-veilleur.png
            ├── 01-la-voix.png
            ├── ...
            └── 11-cloture-devenir-veilleur.png
```

## Parcours

La couverture est la première étape immersive du parcours, selon le modèle des packs narratifs récents.

1. Le Veilleur
2. La Voix
3. Le Prophète
4. Le Poète
5. Le Bruit du monde
6. Le Silence
7. Le Veilleur
8. Les Récits Vivants
9. Le Monde commun
10. La Plume et l’IA
11. Transmettre
12. Devenir veilleur

## Images

Les PNG originaux sont conservés dans `assets/images/originals/`.

Les images utilisées par le moteur sont des WebP optimisés dans `assets/images/`.

Point important : le ZIP source contient `010.png` et `011.png`. Le pack utilise un mapping explicite :

- `010.png` → `10-transmettre.png`
- `011.png` → `11-cloture-devenir-veilleur.png`

Il ne faut donc jamais se fier à un tri alphabétique simple pour reconstruire l’ordre du parcours.

## Bibliothèque et route

Le pack est déclaré dans `packs/index.json` avec :

- id : `pack-008`
- slug : `le-veilleur`
- route publique : `/oeuvres/le-veilleur/`

Le moteur charge le pack depuis le registre sans route codée en dur.

## Remplacement futur des images

Pour remplacer une image :

1. conserver le PNG original renommé dans `assets/images/originals/` ;
2. générer le WebP correspondant dans `assets/images/` ;
3. vérifier que `pack.json` pointe vers le WebP ;
4. relancer les tests et le build.

Toute adaptation CSS doit rester ciblée sur `pack-008`.

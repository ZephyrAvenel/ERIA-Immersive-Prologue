# PACK-004 — La Voie du Milieu

## Intention

`PACK-004 — La Voie du Milieu` est un parcours narratif et contemplatif de l’Immersive Narrative Engine.

Il invite à habiter les tensions plutôt qu’à choisir un camp. Le parcours explore les oppositions, les récits qui enferment, les passages qui relient et la possibilité d’un monde commun.

## Format

Le pack utilise le format générique existant :

```json
{
  "format": "ine-narrative-pack",
  "id": "pack-004"
}
```

Aucun composant spécifique n’est nécessaire : le moteur INE charge le manifeste, interprète les scènes et affiche le parcours avec le renderer narratif standard.

## Structure

```text
packs/pack-004-voie-du-milieu/
├── pack.json
├── assets/
│   └── images/
│       ├── *.webp
│       └── originals/
│           └── *.png
└── README.md
```

Les PNG originaux sont conservés dans `assets/images/originals/`.

Les WebP optimisés utilisés par le moteur sont placés dans `assets/images/`.

## Scènes

Le parcours contient 11 scènes :

1. Couverture — La Voie du Milieu
2. Le seuil
3. Le monde des oppositions
4. Les récits qui enferment
5. Entre deux récits, un choix ?
6. La voie du milieu
7. La présence au-delà des récits
8. Le choix qui façonne le monde
9. Au seuil d’un monde vivant
10. Et demain ?
11. Les récits vivants continuent…

La couverture est déclarée comme `startScene` afin d’ouvrir directement le parcours par l’image officielle du pack sans modifier le fonctionnement du prologue des autres œuvres.

## Images

Convention de nommage :

```text
00-couverture-voie-du-milieu
01-le-seuil
02-monde-des-oppositions
03-recits-qui-enferment
04-entre-deux-recits-un-choix
05-la-voie-du-milieu
06-presence-au-dela-des-recits
07-le-choix-qui-faconne-le-monde
08-au-seuil-dun-monde-vivant
09-et-demain
10-les-recits-vivants-continuent
```

Chaque image existe en deux versions :

- `.png` dans `assets/images/originals/` ;
- `.webp` dans `assets/images/`.

## Remplacer les images

Pour remplacer une image :

1. conserver le PNG source dans `assets/images/originals/` ;
2. générer une version WebP optimisée sans recadrage destructif ;
3. conserver exactement le même nom de fichier ;
4. vérifier que le chemin correspondant dans `pack.json` reste valide ;
5. lancer les tests et le build.

## Bibliothèque INE

Le pack est exposé dans `packs/index.json` avec le slug :

```text
voie-du-milieu
```

Route publique :

```text
/oeuvres/voie-du-milieu/
```

La bibliothèque lit automatiquement le titre, le sous-titre, la description et la couverture depuis `pack.json`.

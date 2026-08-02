# PACK-006 — La Métamorphose

PACK-006 est une œuvre immersive autonome de l’univers des Récits Vivants.

Titre public : **La Métamorphose**  
Sous-titre : **Quand devenir soi ressemble, aux yeux des autres, à devenir quelqu’un d’autre.**

Ce parcours explore la métamorphose comme fidélité au vivant : les rôles attribués, les regards des autres, l’appel intérieur, le passage par le cocon, la résistance de l’ancien récit, puis l’ouverture vers des relations plus justes.

## Structure

```text
packs/pack-006-la-metamorphose/
├── pack.json
├── assets/
│   └── images/
│       ├── originals/
│       └── *.webp
└── README.md
```

Le pack utilise le format existant `ine-narrative-pack`. Le moteur INE lit uniquement `pack.json`, résout les chemins d’images relativement au manifeste et affiche les scènes avec le renderer narratif générique.

## Route et registre

Le pack est enregistré dans `packs/index.json` :

```json
{
  "id": "pack-006",
  "slug": "la-metamorphose",
  "manifest": "pack-006-la-metamorphose/pack.json"
}
```

Route publique attendue :

```text
/oeuvres/la-metamorphose/
```

## Scènes

| Étape | Titre | Image |
| --- | --- | --- |
| 00 | La Métamorphose | `00-couverture-la-metamorphose.webp` |
| 01 | Le monde des chenilles | `01-le-monde-des-chenilles.webp` |
| 02 | Les regards qui nous définissent | `02-les-regards-qui-nous-definissent.webp` |
| 03 | L’appel intérieur | `03-l-appel-interieur.webp` |
| 04 | Entrer dans le cocon | `04-entrer-dans-le-cocon.webp` |
| 05 | Résister à l’ancien récit | `05-resister-a-l-ancien-recit.webp` |
| 06 | Tu as changé. | Image dédiée absente du dossier Drive fourni |
| 07 | Les ailes invisibles | `07-les-ailes-invisibles.webp` |
| 08 | Les relations qui évoluent | `08-les-relations-qui-evoluent.webp` |
| 09 | Devenir pleinement soi | `09-devenir-pleinement-soi.webp` |
| 10 | Veiller ensemble sur les récits vivants | `10-veiller-ensemble-sur-les-recits-vivants.webp` |
| 11 | Épilogue — Le voyage continue | `11-epilogue-le-voyage-continue.webp` |
| 12 | Un cycle, des infinis possibles | `12-cloture-un-cycle-des-infinis-possibles.webp` |

## Images

Les fichiers sources Drive étaient des PNG aux noms opaques. Ils ont été identifiés visuellement, renommés selon la convention canonique, puis conservés dans :

```text
packs/pack-006-la-metamorphose/assets/images/originals/
```

Les WebP optimisés utilisés par le moteur sont placés dans :

```text
packs/pack-006-la-metamorphose/assets/images/
```

Les images n’ont pas été recadrées ni modifiées éditorialement. La conversion WebP conserve les dimensions originales.

## Remplacement futur d’une image

Pour remplacer une illustration :

1. déposer le PNG original renommé dans `assets/images/originals/` ;
2. générer le WebP correspondant dans `assets/images/` ;
3. mettre à jour le champ `image` et le champ `imageAlt` de la scène concernée dans `pack.json` ;
4. relancer les tests d’intégration du pack et le build.

Si une image officielle pour `scene-06` — **Tu as changé.** — est fournie ultérieurement, elle devra suivre le nom :

```text
06-tu-as-change.png
06-tu-as-change.webp
```

## Compatibilité INE

PACK-006 reste indépendant des autres œuvres. Il ne dépend ni de PACK-001, ni de PACK-002, ni de PACK-003, ni de PACK-004, ni de PACK-005. Le seul élément partagé est le moteur INE.

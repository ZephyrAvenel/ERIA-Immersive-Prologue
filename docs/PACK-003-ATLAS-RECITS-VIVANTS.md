# PACK-003 - Atlas des Récits Vivants

## Rôle

PACK-003 est une oeuvre immersive autonome publiée dans la bibliothèque INE.
Elle introduit le format `ine-living-card-pack` et le composant générique
`LivingCardRenderer`.

Le pack ne dépend ni des Gardiens des Récits Vivants ni de Polarités Vivantes.
Le seul élément partagé est le moteur INE.

## Architecture

```text
packs/
└── pack-003-atlas-recits-vivants/
    ├── pack.json
    ├── cards/
    │   ├── premier-pas.json
    │   ├── equilibre-vivant.json
    │   ├── passage.json
    │   ├── miroir.json
    │   ├── conflit-createur.json
    │   ├── traversee.json
    │   ├── racines.json
    │   └── monde-commun.json
    ├── assets/
    │   └── images/
    │       ├── 00-couverture-atlas-recits-vivants.webp
    │       ├── 01-premier-pas.webp
    │       ├── ...
    │       └── originals/
    └── README.md
```

La route publique est déclarée dans le registre :

```json
{
  "id": "pack-003",
  "slug": "atlas-recits-vivants",
  "manifest": "pack-003-atlas-recits-vivants/pack.json"
}
```

La bibliothèque lit le titre, le sous-titre, la description et la couverture
depuis `pack.json`. Elle ne duplique aucun contenu.

## Manifeste

`pack.json` décrit l'oeuvre et le parcours :

- `format`: `ine-living-card-pack`;
- `id`, `title`, `subtitle`, `description`, `author`, `language`, `version`;
- `entry` et `entryAction`;
- `coverImage`, `coverImageAlt`, `fallbackImage`, `fallbackImageAlt`;
- `actions.continue`, `actions.previous`, `actions.back`, `actions.finish`;
- `cards`, liste ordonnée des cartes JSON.

Les chemins d'assets sont résolus relativement au manifeste.

## Format d'une Living Card

Chaque carte contient uniquement du contenu éditorial :

- `id`, `type`, `title`, `subtitle`;
- `image` et `imageAlt`;
- `symbol`;
- `quote`;
- `motto`;
- `metadata`, liste de paires `label` / `value`;
- `previous` et `next`;
- `locale.fr` et `locale.en`.

Le composant n'invente aucun libellé. Les textes visibles viennent des JSON ou
du manifeste.

## Composant

`LivingCardRenderer` reçoit une carte validée et les libellés d'action fournis
par le Player. Il affiche :

- l'illustration ;
- le symbole ;
- le titre et le sous-titre ;
- la citation ;
- la devise ;
- les métadonnées ;
- les boutons de navigation.

Si l'image de carte échoue, le renderer remplace l'image par `fallbackImage` et
utilise `fallbackImageAlt`.

## Ajouter une carte

1. Ajouter un fichier JSON dans `cards/`.
2. Déclarer son `id`, son image, ses textes, ses métadonnées et ses traductions.
3. Renseigner `previous` et `next`.
4. Ajouter l'entrée dans `pack.json.cards`.
5. Ajouter le PNG source renommé dans `assets/images/originals/`.
6. Générer le WebP correspondant dans `assets/images/`.
7. Lancer `npm run test:integration` et `npm run test:e2e`.

## Illustrations définitives

Les images définitives du PACK-003 sont conservées en deux niveaux :

- `assets/images/originals/` contient les PNG source renommés selon la
  nomenclature officielle ;
- `assets/images/` contient les WebP optimisés chargés par le moteur.

La couverture officielle est
`00-couverture-atlas-recits-vivants.webp`. Les huit cartes utilisent les noms
`01-premier-pas.webp` à `08-monde-commun.webp`.

Les PNG originaux ne doivent pas être écrasés. Pour remplacer une illustration,
ajouter d'abord le PNG renommé dans `originals/`, puis générer le WebP
correspondant dans `assets/images/` sans recadrage destructif.

La carte `08-monde-commun` est horizontale dans le pack fourni. Elle doit être
conservée dans son cadrage d'origine ; le renderer l'affiche dans le cadre
visuel existant et le fallback reste la couverture du pack.

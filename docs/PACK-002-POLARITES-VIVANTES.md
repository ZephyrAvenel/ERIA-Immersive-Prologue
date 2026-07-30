# PACK-002 — Polarités Vivantes

## Architecture

PACK-002 est un pack contemplatif autonome. Il partage uniquement le moteur INE
avec PACK-001.

```text
packs/
  index.json
  pack-002-polarites-vivantes/
    pack.json
    polarities/
      01-affirmation-don.json
      ...
      10-fidelite-changement.json
    assets/
      images/
        00-couverture.webp
        01-affirmation-don.webp
        ...
        10-fidelite-changement.webp
        11-cloture.webp
        originals/
      audio/
    README.md
```

Le Player reçoit un seul `packUrl`. Il lit le champ `format` du manifeste :

- `ine-narrative-pack` lance le parcours narratif historique ;
- `ine-polarity-pack` lance le parcours contemplatif.

Changer de pack ne demande aucune modification du code :

```json
{ "packUrl": "packs/pack-002-polarites-vivantes/pack.json" }
```

Un lanceur peut également passer temporairement `?pack=<url-du-manifeste>`.

## Manifeste

`pack.json` porte les métadonnées du pack, l'étape d'entrée, le libellé d'entrée,
la liste ordonnée des fichiers, la couverture, la clôture, le fallback visuel
et le nom accessible du pont. Les chemins sont résolus relativement au
manifeste.

Chaque entrée de `polarities` associe un identifiant stable à un fichier JSON.
L'identifiant `entry` doit exister dans cette liste.

## Format d'une polarité

Une polarité contient :

- `id`, `title`, `subtitle` ;
- `image` et `imageAlt` ;
- `left` et `right`, chacun avec `title`, `icon` et `text` ;
- `quote` et `question` ;
- `article` ;
- `previous` et `next`, chaîne ou `null` aux extrémités ;
- `actions.article`, `actions.previous`, `actions.next` et `actions.back`.

Tous les textes visibles viennent du JSON. `PolarityRenderer` ne connaît que ce
contrat. Il masque automatiquement le bouton précédent ou suivant lorsque le
callback correspondant n'existe pas.

## Parcours et composant

Le Player affiche d'abord le seuil du pack sur l'illustration
`00-couverture.webp`, puis charge la polarité `entry`.
`PolarityRenderer` construit un article accessible : illustration plein écran,
titre, deux pôles, pont lumineux, citation, question et navigation.

Après la dixième polarité, l'action de clôture affiche
`11-cloture.webp`. Cette image officielle contient le message final « Le récit
continue avec toi » ; son texte intégré est intentionnel et fait partie de
l'œuvre validée.

« Retour au parcours » restaure le seuil du PACK-002. Les liens précédent et
suivant restent internes au pack. Aucune référence à PACK-001 n'est autorisée
dans son manifeste ou ses contenus.

Les animations sont exclusivement CSS et sont neutralisées par
`prefers-reduced-motion: reduce`.

## Ajouter une polarité

1. Créer un fichier JSON dans `polarities/` avec un identifiant kebab-case.
2. Renseigner tous les champs du contrat et une alternative d'image utile.
3. Déposer l'original dans `assets/images/originals/`, puis produire le WebP
   homonyme destiné au moteur dans `assets/images/`.
4. Ajouter l'entrée `{ "id": "...", "source": "polarities/...json" }` au
   manifeste.
5. Mettre à jour les liens `previous` et `next` voisins.
6. Exécuter `npm run test:ci`.

## Illustrations et fallback

Les douze illustrations définitives sont organisées selon une convention
numérique stable :

- `00-couverture.webp` : identité officielle et seuil du pack ;
- `01` à `10` : une illustration par polarité ;
- `11-cloture.webp` : dernière étape du parcours.

Les versions PNG fournies sont conservées sans écrasement dans
`assets/images/originals/`. Les WebP de production gardent leurs dimensions
originales et utilisent une compression de haute qualité. La couverture et la
clôture peuvent contenir du texte intégré, puisqu'elles constituent des
compositions graphiques officielles. Les dix polarités continuent d'afficher
leurs textes métier depuis les JSON.

Lorsqu'une image échoue, le Renderer charge `fallbackImage` et remplace son
alternative par `fallbackImageAlt`. La couverture officielle sert de fallback ;
le texte contemplatif reste toujours présent dans le DOM.

## Registre des packs

`packs/index.json` est un catalogue déclaratif. Chaque entrée fournit `id`,
`title`, `type`, `format` et `manifest`. Il prépare un futur sélecteur sans
imposer cette interface aujourd'hui.

Le moteur ne contient aucun identifiant de pack. Ajouter ou retirer une entrée
du registre ne demande donc aucune modification du Core, du Renderer ou du
Player. Le déploiement courant reste choisi par `player.config.json`.

## Indépendance

- supprimer `packs/pack-002-polarites-vivantes/` laisse PACK-001 exécutable en
  conservant sa configuration actuelle ;
- supprimer `examples/demo-pack/` laisse PACK-002 exécutable en configurant son
  propre manifeste ;
- retirer l'un des deux du registre n'affecte pas le format ni les assets de
  l'autre ;
- le seul code partagé réside dans `apps/` et `packages/`.

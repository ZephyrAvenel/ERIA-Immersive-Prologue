# PACK-011 — La Joie lucide

## Intention

`PACK-011 — La Joie lucide` est un parcours narratif autonome des Récits Vivants.

Il explore une joie capable de regarder la houle sans s’y dissoudre, de reconnaître ce qui souffre sans manquer ce qui demeure vivant, et de contribuer à un récit plus habitable.

Sous-titre public :

> Voir la houle. Ne pas manquer les dauphins.

## Architecture

Le pack suit les conventions existantes de l’Immersive Narrative Engine :

- manifeste : `pack.json` ;
- format : `ine-narrative-pack` ;
- layout : `image-then-text` ;
- route publique dérivée du slug : `/oeuvres/la-joie-lucide/` ;
- PNG originaux conservés dans `assets/images/originals/` ;
- WebP optimisés utilisés par le player dans `assets/images/`.

## Expérience Contempler / Lire

Le pack réutilise le mode mutualisé `image-then-text`.

Chaque entrée se déploie en deux temps :

1. **Contempler** : l’image est affichée entière en `object-fit: contain`.
2. **Lire** : le texte complémentaire apparaît, avec une question de seuil lorsque la scène en comporte une.

Le moteur gère automatiquement :

- la progression ;
- les boutons Précédent / Lire / Suivant ;
- le retour final vers la bibliothèque ;
- les transitions ;
- l’accessibilité de base.

## Liste des entrées

Le prompt éditorial distingue la couverture de la traversée narrative. Dans l’architecture actuelle du dépôt, les packs `image-then-text` récents exposent toutefois la couverture comme `scene-00` afin de proposer une entrée contemplative cohérente dans le player.

| ID | Titre | Image |
| --- | --- | --- |
| `scene-00` | Couverture — La Joie lucide | `00-couverture-la-joie-lucide.webp` |
| `scene-01` | La Houle | `01-la-houle.webp` |
| `scene-02` | Le Droit à la joie | `02-le-droit-a-la-joie.webp` |
| `scene-03` | La Fausse lumière | `03-la-fausse-lumiere.webp` |
| `scene-04` | Le Regard capturé | `04-le-regard-capture.webp` |
| `scene-05` | Les Deux Vérités | `05-les-deux-verites.webp` |
| `scene-06` | Les Dauphins dans la houle | `06-les-dauphins-dans-la-houle.webp` |
| `scene-07` | La Frontière sensible | `07-la-frontiere-sensible.webp` |
| `scene-08` | La Joie indocile | `08-la-joie-indocile.webp` |
| `scene-09` | La Joie qui circule | `09-la-joie-qui-circule.webp` |
| `scene-10` | La Joie lucide | `10-la-joie-lucide.webp` |
| `scene-11` | Le Nouveau Récit | `11-le-nouveau-recit.webp` |

## Mapping des images sources

| Source ZIP | Nom canonique |
| --- | --- |
| `Couverture.png` | `00-couverture-la-joie-lucide.png` |
| `joie-01.png` | `01-la-houle.png` |
| `joie-2.png` | `02-le-droit-a-la-joie.png` |
| `joie-3.png` | `03-la-fausse-lumiere.png` |
| `joie-4.png` | `04-le-regard-capture.png` |
| `joie-5.png` | `05-les-deux-verites.png` |
| `joie-6.png` | `06-les-dauphins-dans-la-houle.png` |
| `joie-7.png` | `07-la-frontiere-sensible.png` |
| `joie-8.png` | `08-la-joie-indocile.png` |
| `joie-9.png` | `09-la-joie-qui-circule.png` |
| `joie-10.png` | `10-la-joie-lucide.png` |
| `joie-11.png` | `11-le-nouveau-recit.png` |

## Remplacer une image

Pour remplacer une image :

1. placer le PNG source dans `assets/images/originals/` avec le nom canonique ;
2. générer le WebP correspondant dans `assets/images/` ;
3. conserver les dimensions si possible ;
4. vérifier que `pack.json` pointe vers le WebP ;
5. relancer les tests d’intégration du pack.

Les images contiennent du texte intégré : il faut éviter tout recadrage destructif.

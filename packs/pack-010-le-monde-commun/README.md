# PACK-010 — Le Monde commun

Sous-titre : **Habiter nos différences sans rompre le lien.**

PACK-010 est un parcours narratif autonome de l’Immersive Narrative Engine. Il prolonge l’univers des Récits Vivants en explorant la possibilité de construire un monde habitable entre des chemins différents, sans nier les tensions, sans effacer les singularités et sans rompre le lien.

## Structure

- `pack.json` : manifeste narratif du pack.
- `assets/images/originals/` : PNG originaux fournis, conservés sans recadrage.
- `assets/images/` : dérivés WebP optimisés utilisés par le player.

Le pack utilise le mode :

```json
"layout": "image-then-text"
```

Chaque scène se déploie donc en deux temps :

1. **Contempler** : affichage de l’image entière en `contain`.
2. **Lire** : affichage du texte narratif complet.

## Scènes

1. Couverture — Le Monde commun
2. Des chemins différents
3. La tentation du camp
4. Ce qui nous sépare
5. Ce qui nous relie encore
6. Le désaccord vivant
7. L’écoute comme seuil
8. Construire sans uniformiser
9. Les lieux qui tiennent le lien
10. Les récits qui réparent
11. Veiller ensemble
12. Clôture — Faire monde

## Mapping des images

| Source ZIP | PNG original conservé | WebP utilisé |
| --- | --- | --- |
| `Pack-narratif-monde-commun/00-monde-commun.png` | `00-couverture-le-monde-commun.png` | `00-couverture-le-monde-commun.webp` |
| `Pack-narratif-monde-commun/01-monde-commun.png` | `01-des-chemins-differents.png` | `01-des-chemins-differents.webp` |
| `Pack-narratif-monde-commun/02-monde-commun.png` | `02-la-tentation-du-camp.png` | `02-la-tentation-du-camp.webp` |
| `Pack-narratif-monde-commun/03-monde-commun.png` | `03-ce-qui-nous-separe.png` | `03-ce-qui-nous-separe.webp` |
| `Pack-narratif-monde-commun/04-monde-commun.png` | `04-ce-qui-nous-relie-encore.png` | `04-ce-qui-nous-relie-encore.webp` |
| `Pack-narratif-monde-commun/05-monde-commun.png` | `05-le-desaccord-vivant.png` | `05-le-desaccord-vivant.webp` |
| `Pack-narratif-monde-commun/06-monde-commun.png` | `06-l-ecoute-comme-seuil.png` | `06-l-ecoute-comme-seuil.webp` |
| `Pack-narratif-monde-commun/07-monde-commun.png` | `07-construire-sans-uniformiser.png` | `07-construire-sans-uniformiser.webp` |
| `Pack-narratif-monde-commun/08-monde-commun.png` | `08-les-lieux-qui-tiennent-le-lien.png` | `08-les-lieux-qui-tiennent-le-lien.webp` |
| `Pack-narratif-monde-commun/09-monde-commun.png` | `09-les-recits-qui-reparent.png` | `09-les-recits-qui-reparent.webp` |
| `Pack-narratif-monde-commun/10-monde-commun.png` | `10-veiller-ensemble.png` | `10-veiller-ensemble.webp` |
| `Pack-narratif-monde-commun/11-monde-commun.png` | `11-faire-monde.png` | `11-faire-monde.webp` |

## Remplacer les images

Pour remplacer un visuel, conserver le nom canonique, placer le PNG source dans `assets/images/originals/`, puis régénérer le WebP correspondant dans `assets/images/` sans recadrage destructif. Le manifeste doit continuer à référencer les WebP.

## Compatibilité INE

Le pack est inscrit dans `packs/index.json` avec le slug `le-monde-commun` et la route publique `/oeuvres/le-monde-commun/`. Il n’ajoute pas de comportement spécifique au moteur : il réutilise le mode `image-then-text` déjà introduit par PACK-009.

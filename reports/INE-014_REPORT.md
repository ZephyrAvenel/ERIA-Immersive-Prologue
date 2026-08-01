# Rapport de mission INE-014 — Finalisation UX

## Résultat

La finalisation reste strictement limitée à la navigation permanente vers la
bibliothèque et à la destination de l’action « Explorer l’article ». Aucune
route, entrée de registre ou architecture de pack n’est modifiée.

## Bibliothèque

La commande flottante textuelle est remplacée par une icône de livre ouverte,
discrète et permanente :

- cible tactile de 44 × 44 px ;
- opacité réduite au repos ;
- libellé accessible et infobulle « Explorer les œuvres » ;
- contraste renforcé au survol et au focus ;
- espace réservé dans l’en-tête mobile pour ne pas recouvrir le titre.

Les contrôles automatisés couvrent 360, 390, 430, 768, 1024, 1280 et 1366 px.
Ils vérifient la taille de la commande, son absence de chevauchement avec le
titre et l’absence de débordement horizontal.

## Article d’approfondissement

`manifest.articleUrl` est désormais la source obligatoire et exclusive du lien
affiché par toutes les polarités. Le Player :

1. charge le manifeste ;
2. refuse un manifeste contemplatif sans `articleUrl` ;
3. transmet directement cette valeur au `PolarityRenderer` ;
4. ne reconstruit aucune URL et n’utilise aucun repli issu d’une étape.

Pour PACK-002, la destination commune est :

`https://zephyr-avenel.blogspot.com/2026/07/les-tensions-fecondes-des-polarites.html?m=1`

Le champ historique `article` des JSON de polarité reste accepté par leur
format, afin de ne pas modifier la structure du pack, mais il est ignoré par le
Player pour cette action.

## Validation

- première polarité : URL canonique du manifeste ;
- dixième polarité : même URL canonique ;
- manifeste sans `articleUrl` : rejet explicite ;
- desktop, tablette, 430, 390 et 360 px : commande Bibliothèque accessible et
  sans chevauchement ;
- routes et registre : inchangés ;
- dépendances : inchangées.

Les résultats définitifs du pipeline local et de GitHub Actions sont consignés
dans la Pull Request de la mission.


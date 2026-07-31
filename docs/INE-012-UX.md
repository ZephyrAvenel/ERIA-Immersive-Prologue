# Raffinement UX du Cycle I

Statut : décision UX INE-012

## Principes

Les ajustements de fin du Cycle I doivent conserver l’accès aux prolongements
de l’œuvre sans concurrencer le récit. Ils ne modifient ni les routes, ni le
registre, ni la navigation interne.

## Article d’approfondissement

Un pack contemplatif peut déclarer `articleUrl` dans son manifeste :

```json
{
  "articleUrl": "https://exemple.test/article"
}
```

Le Player transmet cette destination au `PolarityRenderer`. Le champ `article`
d’une polarité reste le repli compatible avec les packs existants et permet
toujours un lien différent par étape. Le moteur ne contient aucune URL
éditoriale.

## Accès permanent à la bibliothèque

L’ancien bouton textuel flottant est remplacé par une commande circulaire :

- pictogramme de livre ouvert ;
- diamètre et cible tactile de 44 px ;
- opacité réduite au repos ;
- contraste renforcé au survol et au focus ;
- libellé « Explorer les œuvres » conservé pour les technologies d’assistance
  et l’infobulle ;
- position fixe respectant les zones sûres de l’écran.

La fin de parcours conserve son invitation textuelle, car elle appartient à la
progression narrative et non à la navigation permanente.

## Polarités Vivantes

Les cartes ont été contrôlées sans modification graphique. Le voile sombre
maintient la lisibilité sur les illustrations, les textes restent dans le DOM,
les alternatives d’image sont présentes et les actions conservent leurs zones
tactiles. Une retouche supplémentaire aurait altéré l’équilibre contemplatif
sans corriger de défaut observable.

## Validation

Les contrôles couvrent les largeurs 1366, 1024, 768, 390 et 360 px. Ils
vérifient notamment :

- la cible de 44 px et la discrétion visuelle de la commande Bibliothèque ;
- l’absence de recouvrement du titre ;
- l’absence de débordement horizontal ;
- l’URL canonique de l’article de PACK-002 ;
- Le Seuil, Les Gardiens et Polarités Vivantes ;
- les URL directes et la préférence de réduction des animations.


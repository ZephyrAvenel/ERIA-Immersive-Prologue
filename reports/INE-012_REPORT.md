# Rapport de mission INE-012

## Résultat

Les trois raffinements UX demandés ont été traités sans modifier le registre,
les routes, les URL publiques ni la navigation des œuvres.

## 1 — Article d’approfondissement

PACK-002 déclare désormais dans son manifeste :

```json
{
  "articleUrl": "https://zephyr-avenel.blogspot.com/2026/07/les-tensions-fecondes-des-polarites.html?m=1"
}
```

Le Player utilise cette destination commune lorsqu’elle est présente. Le champ
`article` des polarités reste un repli rétrocompatible et permet toujours de
définir une URL particulière par étape.

Cette organisation garantit que :

- le moteur ne contient aucune URL éditoriale ;
- chaque pack contemplatif peut posséder son propre prolongement ;
- les packs existants restent compatibles ;
- le `PolarityRenderer` conserve son contrat générique.

L’URL canonique a été contrôlée directement : réponse HTTP 200 et titre
« Les tensions fécondes… ».

## 2 — Accès discret à la bibliothèque

Le bouton flottant textuel « Explorer les œuvres » est remplacé par une commande
circulaire représentant un livre ouvert.

Caractéristiques :

- diamètre de 44 px ;
- opacité de 68 % au repos ;
- contraste complet au survol et au focus ;
- fond translucide et flou conservant la cohérence de la charte ;
- libellé accessible et infobulle « Explorer les œuvres » ;
- pictogramme ignoré par les technologies d’assistance ;
- respect des zones sûres de l’écran ;
- espace réservé dans l’en-tête mobile afin de ne pas recouvrir le titre.

Le premier contrôle Chrome a révélé un chevauchement à 430 px. Une réserve de
52 px a alors été ajoutée dans l’en-tête mobile. La relance confirme l’absence
de chevauchement à toutes les largeurs testées.

L’invitation textuelle de fin de parcours reste inchangée : elle constitue une
étape narrative, contrairement à la commande permanente.

## 3 — Audit de PACK-002

Les cartes de **Polarités Vivantes** ont été contrôlées sans modification
graphique supplémentaire.

Aucun défaut nécessitant une retouche n’a été constaté :

- voile de contraste lisible sur les illustrations ;
- textes rendus dans le DOM et non dans les images ;
- alternatives d’image présentes ;
- focus visibles ;
- actions empilées et tactiles sur smartphone ;
- aucun débordement horizontal ;
- réduction des animations respectée.

Une retouche des décors aurait dépassé le périmètre de cette mission sans
résoudre de problème observable.

## Documentation

- `docs/INE-012-UX.md` formalise les choix UX ;
- `docs/PACK-002-POLARITES-VIVANTES.md` documente `articleUrl` et son repli ;
- le README propre à PACK-002 référence maintenant l’article canonique.

## Validation

| Contrôle | Résultat |
|---|---|
| Typecheck | réussi |
| Tests unitaires | 58/58 réussis |
| Tests d’intégration | 12/12 réussis |
| Couverture | 90,27 % lignes, 83,19 % branches, 91,25 % fonctions |
| Build de production | réussi |
| Scénario Chrome | 1/1 réussi |
| Article canonique | HTTP 200 |
| `git diff --check` | réussi |

Le scénario Chrome vérifie :

- Le Seuil ;
- Les Gardiens des Récits Vivants ;
- Polarités Vivantes ;
- le lien exact de l’article ;
- l’accès permanent à la bibliothèque ;
- la cible de 44 px et l’absence de chevauchement ;
- desktop 1366 px et 1280 px ;
- tablette 1024 px et 768 px ;
- mobile 430 px, 390 px et 360 px ;
- les URL directes, le responsive, le focus et la réduction des animations.

## Git

La mission est livrée dans un commit unique sur la branche
`agent/ine-012-cycle-i-ux`. La Pull Request est créée prête à être fusionnée
après réussite de son contrôle GitHub.


# Rapport de mission INE-011

## Résultat

Le prologue **Les Gardiens des Récits Vivants** est restauré comme porte
d’entrée principale d’INE. La racine publique ouvre désormais directement son
seuil immersif. La bibliothèque reste intacte à `/bibliotheque/`, et les URLs
publiques existantes des deux œuvres demeurent inchangées.

## Solution retenue

Le registre `packs/index.json` porte désormais une propriété `home` qui désigne
l’œuvre d’accueil par son identifiant. Le Player résout la racine à partir de
cette donnée, sans connaître le titre, le format ni le chemin du prologue.

Le parcours devient :

```text
Site auteur
    ↓
/ — Les Gardiens des Récits Vivants
    ↓
Dernière scène — Poursuivre votre exploration
    ↓
/bibliotheque/ — Bibliothèque des œuvres immersives
    ↓
/oeuvres/<slug>/ — Œuvre choisie
```

Cette solution préserve les frontières de l’architecture du Cycle I :

- le moteur ne contient aucun identifiant ni contenu propre à une œuvre ;
- les manifestes et les parcours ne connaissent pas la bibliothèque ;
- les pages directes `/oeuvres/les-gardiens-des-recits-vivants/` et
  `/oeuvres/polarites-vivantes/` sont conservées ;
- le build produit une vraie page statique pour la racine, la bibliothèque et
  chaque œuvre, compatible avec GitHub Pages ;
- la racine reprend les métadonnées statiques et sociales du prologue avec une
  URL canonique propre.

## Continuité de navigation

Un lien discret « Explorer les œuvres » rend la bibliothèque accessible pendant
une immersion. À la dernière scène d’un parcours narratif, une invitation
« Poursuivre votre exploration » apparaît et reçoit naturellement le focus
après la dernière navigation. La clôture de **Polarités Vivantes** propose la
même invitation, à côté du retour au parcours.

Le retour vers le site auteur n’a pas été ajouté : aucune URL canonique de ce
site n’est déclarée dans le modèle éditorial actuel. En inventer une aurait créé
une dépendance fragile. Cette passerelle pourra être ajoutée comme métadonnée
éditoriale ou configuration de diffusion lorsqu’elle sera officiellement
définie.

## Correctif responsive de Polarités Vivantes

Sous 44 rem, les actions de polarité sont maintenant disposées en une seule
colonne :

- largeur disponible complète ;
- aucune largeur minimale susceptible de provoquer un chevauchement ;
- libellés autorisés à revenir à la ligne ;
- zones tactiles d’au moins 44 px ;
- disposition identique et lisible pour les actions de clôture.

Le scénario navigateur contrôle explicitement l’absence de chevauchement et de
débordement horizontal sur un écran de 360 px.

## Documentation

Les documents suivants reflètent le nouveau parcours :

- `README.md` ;
- `docs/ARCHITECTURE.md` ;
- `docs/INE-DISTRIBUTION-ARCHITECTURE.md`.

## Validation

| Contrôle | Résultat |
|---|---|
| Typecheck | réussi |
| Tests unitaires | 58/58 réussis |
| Tests d’intégration | 12/12 réussis |
| Build de production | réussi |
| Couverture | seuils réussis : lignes 90,26 %, branches 83,19 %, fonctions 91,25 % |
| Scénario Chrome | 1/1 réussi |
| Vérification des espaces et conflits Git | réussie |

Le scénario Chrome couvre l’accueil direct par le prologue, la bibliothèque,
les deux URLs d’œuvres, la continuation de fin de parcours, la clôture de
PACK-002, le responsive mobile, l’accessibilité observable, la progression et
la préférence de réduction des animations.

## Git

- branche : `agent/ine-011-prologue-entry`
- commit d’implémentation :
  `4ae36fc201f6942e20fef14a616826db0b9b01e9`
- push : confirmé sur `origin/agent/ine-011-prologue-entry`
- Pull Request : [#2 — INE-011 — Restaurer le prologue comme porte
  d’entrée](https://github.com/ZephyrAvenel/ERIA-Immersive-Prologue/pull/2)

Le rapport est livré dans un second commit afin de pouvoir référencer le hash
immuable du commit d’implémentation.

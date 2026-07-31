# Rapport de mission INE-013

## Conclusion

Le saut du Seuil était causé par la combinaison de deux comportements du
Player :

1. le franchissement du Seuil enregistrait immédiatement la scène initiale dans
   `localStorage` ;
2. au chargement suivant, la présence de cette progression empêchait l’appel au
   prologue, même lorsque la scène enregistrée était déjà la scène initiale et
   qu’aucune reprise n’était proposée.

Le défaut a été reproduit en production avant toute modification :

```text
profil sans progression
    → Le Seuil
    → Franchir le seuil
    → La Gardienne des profondeurs / scène 1
    → rechargement
    → La Gardienne des profondeurs / scène 1
      sans Le Seuil
```

La correction minimale réordonne l’initialisation : le seuil éditorial est
toujours rendu avant l’examen d’une reprise de lecture.

## Diagnostic des mécanismes possibles

| Mécanisme | Constat | Responsable |
|---|---|---|
| `localStorage` | contient la progression narrative persistante | **oui** |
| `sessionStorage` | aucune utilisation par INE | non |
| IndexedDB | aucune utilisation par INE | non |
| cookies | aucune lecture ou écriture par INE | non |
| cache navigateur | peut accélérer les ressources, sans sélectionner de scène | non |
| Service Worker | stratégie réseau d’abord et cache de secours | non |
| état React | INE n’utilise pas React | non |
| route | sélectionne l’œuvre, pas son écran interne | non |
| registre | désigne l’œuvre d’accueil, pas la progression | non |
| Player | orchestrait le prologue après une condition erronée | **oui** |

## Fonctionnement de la progression

`ReadingProgressStore` utilise exclusivement :

```text
localStorage
└── ine:progress:v1:<pack-id>
```

Pour Les Gardiens, la clé est :

```text
ine:progress:v1:les-gardiens-des-recits-vivants
```

La valeur contient :

- version du schéma ;
- identifiant et version du pack ;
- identifiant et index de scène ;
- date de mise à jour ;
- indicateur `completed`.

Après le premier franchissement, la valeur enregistrée référence
`scene-01`. Au rechargement :

- la progression est valide ;
- son index est identique à l’index initial du moteur ;
- aucune boîte de reprise n’est nécessaire ;
- mais l’ancienne condition `!savedProgress && intro` devient fausse ;
- le Player rend donc directement la scène initiale.

Le comportement observé sur plusieurs appareils s’explique par une progression
locale créée indépendamment sur chacun d’eux après un premier franchissement.
La donnée n’est ni synchronisée par un compte ni transmise par le serveur.

## Correction

L’ordre d’initialisation est désormais :

```text
charger et valider une éventuelle progression
    ↓
afficher obligatoirement le Seuil
    ↓
le visiteur franchit le Seuil
    ↓
progression sur scène ultérieure ?
    ├── oui → choix volontaire Reprendre / Recommencer
    └── non → scène initiale
```

La reprise reste disponible mais ne remplace plus l’entrée symbolique.

Cas particuliers :

- progression sur scène 1 : Seuil, puis scène 1 sans dialogue redondant ;
- progression sur scène intermédiaire : Seuil, puis choix explicite ;
- parcours terminé : Seuil, puis choix explicite ;
- progression invalide, obsolète ou indisponible : Seuil, puis scène 1 ;
- pack sans introduction : comportement antérieur conservé.

## Comparaison des environnements

| État du navigateur | Avant correction | Après correction |
|---|---|---|
| profil neuf | Le Seuil | Le Seuil |
| navigation privée / profil temporaire | Le Seuil | Le Seuil |
| cache vide | Le Seuil | Le Seuil |
| `localStorage` vide | Le Seuil | Le Seuil |
| progression `scene-01` | scène 1 directe | Le Seuil, puis scène 1 |
| progression scène 4 | reprise avant le Seuil | Le Seuil, puis reprise volontaire |
| progression terminée | reprise avant le Seuil | Le Seuil, puis reprise volontaire |
| mobile | dépendait de la progression locale | Le Seuil obligatoire |
| desktop | dépendait de la progression locale | Le Seuil obligatoire |

Le scénario Chrome utilise un profil temporaire neuf, manipule explicitement la
progression locale et couvre les vues desktop, tablette, 430, 390 et 360 px.

## Périmètre architectural

Aucun changement n’a été apporté :

- aux routes ;
- au registre ;
- aux manifestes ;
- au moteur de navigation ;
- au Service Worker ;
- au format de persistance ;
- aux contenus des œuvres.

La correction porte uniquement sur l’ordre d’orchestration du Player.

## Validation

| Contrôle | Résultat |
|---|---|
| Typecheck | réussi |
| Tests unitaires | 58/58 réussis |
| Tests d’intégration | 12/12 réussis |
| Couverture | 90,27 % lignes, 83,19 % branches, 91,25 % fonctions |
| Build de production | réussi |
| Scénario Chrome | 1/1 réussi |

Le scénario Chrome vérifie explicitement :

- profil temporaire neuf : Seuil ;
- progression sur `scene-01` puis rechargement : Seuil, puis scène 1 ;
- progression sur scène 4 : Seuil, puis choix de reprise ;
- progression terminée sur scène 9 : Seuil, puis choix de reprise ;
- stockage indisponible : Seuil, puis scène 1 ;
- desktop, tablette, 430, 390 et 360 px ;
- routes directes, bibliothèque et préférence de réduction des animations.

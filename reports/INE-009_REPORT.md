# Rapport de mission INE-009

## Synthèse

INE reste le moteur de publication exclusif de l’univers numérique de Zéphyr Avenel. Le modèle retenu ne cherche pas à couvrir les besoins d’une plateforme multi-auteur : il organise une collection cohérente d’œuvres autonomes reliées par des passerelles éditoriales.

La décision centrale est de conserver les manifestes actuels et de prévoir une extension additive `editorial`. Aucun format `2.0` ni aucune migration obligatoire de PACK-001 ou PACK-002 n’est nécessaire.

## Modèle retenu

Une œuvre immersive est composée de trois niveaux :

1. le manifeste décrit son identité, sa publication, sa présentation et ses relations ;
2. le parcours contient exclusivement la narration et sa navigation ;
3. INE charge, interprète et affiche sans connaître les contenus.

Le noyau déjà utilisé par la bibliothèque est conservé à la racine :

- identifiant ;
- titre et sous-titre ;
- résumé court ;
- auteur, version et langue ;
- couverture et alternative textuelle.

L’extension `editorial` peut ajouter :

- présentation longue, image de partage et durée ;
- dates, copyright et licence ;
- mots-clés et description SEO ;
- passerelles vers livres, articles, œuvres INE, ERIA et site auteur ;
- ressources complémentaires destinées au lecteur.

## Alternatives étudiées

### Tous les champs à la racine

Solution simple au début, mais les champs techniques, narratifs et éditoriaux deviennent difficiles à distinguer. Elle multiplie aussi les propriétés optionnelles propres à la publication.

### Fichier `editorial.json` séparé

La séparation est nette, mais elle ajoute une requête, un chemin à maintenir et un risque de désynchronisation pour une quantité limitée de données. Elle ne devient utile que si une équipe éditoriale ou un outil externe gère ces données indépendamment.

### Objet optionnel `editorial` dans `pack.json`

Solution retenue. Elle conserve un point d’entrée unique, rend les frontières visibles et permet une adoption progressive. Le moteur peut ignorer cet objet tant qu’aucune interface ne l’utilise.

### Tableaux spécialisés de relations

`relatedBooks`, `relatedArticles`, `relatedWorks` et `relatedERIA` ont été écartés. Une liste `connections` avec un champ `kind` est plus simple à ordonner, documenter et étendre.

## Répartition des responsabilités

### INE

- chargement du registre et des manifestes ;
- choix du renderer ;
- navigation et progression ;
- bibliothèque et diffusion statique ;
- génération des métadonnées de publication.

### Œuvre

- identité et attribution ;
- présentation et publication ;
- ressources visuelles et médias ;
- liens avec l’univers d’auteur ;
- choix du format de parcours.

### Parcours

- scènes, polarités, dialogues, chapitres ou cartes ;
- textes, médias et transitions internes ;
- point d’entrée, ordre et clôture.

## Choix de diffusion

Le slug et l’URL canonique restent hors du manifeste :

- le slug appartient à `packs/index.json` ;
- l’URL canonique est calculée au build ;
- les œuvres internes sont référencées par leur identifiant stable, jamais par leur slug.

Ce choix évite de coupler le contenu à GitHub Pages ou à un futur domaine.

## Bibliothèque

L’évolution recommandée est progressive :

1. conserver des cartes sobres avec couverture, titre, sous-titre et résumé ;
2. ajouter la durée lorsqu’elle est disponible ;
3. créer une fiche d’œuvre seulement si la présentation longue et les ressources le justifient ;
4. afficher les passerelles après la clôture ou sur la fiche, sans interrompre l’immersion.

La bibliothèque devient ainsi une porte d’entrée vers l’univers d’auteur, sans se transformer en portail complexe.

## Impacts sur le moteur

Impact immédiat : aucun changement d’exécution.

Les nouveaux artefacts, volontairement non branchés au runtime à ce stade, sont :

- le modèle détaillé ;
- un schéma JSON de référence pour l’extension éditoriale ;
- un exemple ;
- un guide de création.

Impact futur, uniquement quand l’interface utilisera ces données :

- accepter `editorial` dans les schémas de format ;
- normaliser ses champs dans le catalogue ;
- utiliser `shareImage` et `seoDescription` comme variantes optionnelles ;
- résoudre `targetWorkId` via le registre.

Ces évolutions restent génériques et n’introduisent aucun contenu de Zéphyr Avenel dans le code du moteur.

## Compatibilité et migration

- PACK-001 reste valide tel quel.
- PACK-002 reste valide tel quel.
- la bibliothèque continue d’utiliser les champs communs introduits par INE-008 ;
- GitHub Pages reste entièrement statique ;
- aucune dépendance n’est ajoutée ;
- les prochaines œuvres peuvent adopter le modèle complet ;
- les œuvres existantes pourront être enrichies au fil des rééditions.

La migration minimale recommandée consiste à ajouter `author` et, si disponible, la durée à PACK-001 lors d’une prochaine révision éditoriale. Elle n’est pas nécessaire pour publier INE-009.

## Recommandations pour PACK-003 et suivants

- utiliser un format de parcours existant dès qu’il convient ;
- fournir le noyau de bibliothèque complet dès la première version ;
- renseigner les droits et dates avant publication ;
- créer une image de partage uniquement si la couverture se recadre mal ;
- limiter les passerelles aux relations éditorialement significatives ;
- référencer les autres œuvres par identifiant ;
- conserver le manifeste comme source unique ;
- ne faire évoluer le moteur que pour un nouveau comportement, jamais pour ajouter une œuvre.

## Livrables

- `docs/MODELE-EDITORIAL-OEUVRES-IMMERSIVES.md`
- `docs/CREER-UNE-OEUVRE-IMMERSIVE.md`
- `schemas/editorial-metadata.schema.json`
- `examples/editorial-metadata.example.json`
- `reports/INE-009_REPORT.md`

## Validation

Résultats :

- typecheck : réussi ;
- tests unitaires : 57/57 réussis ;
- tests d’intégration : 12/12 réussis, dont trois contrôles du modèle éditorial ;
- couverture : 69/69 tests réussis, 90,17 % lignes, 83,19 % branches, 91,25 % fonctions ;
- build de production : réussi ;
- scénario Chrome réel : 1/1 réussi ;
- PACK-001, PACK-002, bibliothèque, URLs directes et responsive : conservés ;
- dépendances supplémentaires : aucune.

# Créer une nouvelle œuvre immersive

Ce guide décrit le workflow éditorial recommandé pour l’univers numérique de Zéphyr Avenel.

## 1. Définir l’œuvre

Avant de créer des fichiers, préciser :

- son titre et sa promesse ;
- le type de parcours : scènes, polarités, chapitres ou autre format déjà interprété par INE ;
- sa durée approximative ;
- sa relation avec les livres, le blog, ERIA ou une autre œuvre ;
- son point d’entrée et sa clôture.

Un nouveau type de parcours peut nécessiter un renderer. Une nouvelle œuvre utilisant un format existant ne doit nécessiter aucune modification du moteur.

## 2. Créer le dossier

Structure recommandée :

```text
packs/
└── pack-003-nom-de-loeuvre/
    ├── pack.json
    ├── content/
    ├── assets/
    │   ├── images/
    │   ├── audio/
    │   └── documents/
    └── README.md
```

Le nom du dossier facilite le classement mais n’est pas l’URL publique.

## 3. Créer le manifeste

Commencer par le noyau commun :

```json
{
  "format": "format-ine-existant",
  "version": "1.0.0",
  "id": "pack-003",
  "title": "Titre de l’œuvre",
  "subtitle": "Une promesse courte",
  "description": "Un résumé destiné à la bibliothèque.",
  "author": "Zéphyr Avenel",
  "language": "fr",
  "coverImage": "assets/images/cover.webp",
  "coverImageAlt": "Description de la couverture"
}
```

Ajouter ensuite les champs requis par le format du parcours : point d’entrée, liste des scènes ou contenus, fallback, clôture et libellés.

## 4. Préparer les métadonnées éditoriales

Vérifier d’abord que le schéma du format choisi référence l’extension `editorial`. Les formats actuels de PACK-001 et PACK-002 ne l’intègrent pas encore : pour eux, ce modèle sert de fiche de préparation et ne doit pas être ajouté au manifeste avant l’évolution additive du validateur.

Lorsque le format l’accepte, ajouter `editorial` seulement si les informations existent réellement :

- présentation longue ;
- durée ;
- dates et droits ;
- description SEO et mots-clés ;
- passerelles éditoriales ;
- documents proposés au lecteur.

Utiliser `schemas/editorial-metadata.schema.json` comme contrat de référence et `examples/editorial-metadata.example.json` comme exemple autonome.

Ne pas écrire le slug ni l’URL canonique dans le manifeste.

## 5. Ajouter le parcours

Le parcours contient uniquement le contenu nécessaire à l’expérience :

- scènes, polarités, dialogues ou chapitres ;
- textes et alternatives ;
- ordre et navigation ;
- références vers ses médias.

Il ne doit pas connaître la bibliothèque ni les autres packs. Une passerelle vers l’univers d’auteur appartient à `editorial.connections`, sauf si elle fait explicitement partie de la narration.

## 6. Préparer les ressources

- utiliser des noms stables et descriptifs ;
- conserver les originaux lorsque la politique du pack le prévoit ;
- optimiser les images de diffusion ;
- ne pas intégrer les textes narratifs dans les images ;
- fournir `coverImageAlt`, `shareImageAlt` et les alternatives du parcours ;
- vérifier que tous les chemins sont relatifs au manifeste ou au fichier de contenu concerné.

## 7. Déclarer les passerelles

Pour chaque lien, répondre à deux questions :

1. vers quelle création conduit-il ?
2. pourquoi est-il pertinent pour cette œuvre ?

Préférer :

```json
{
  "kind": "article",
  "title": "Titre de l’article",
  "url": "https://...",
  "relationship": "origine",
  "description": "L’article dont cette expérience est issue."
}
```

Pour une autre œuvre INE, utiliser son identifiant stable :

```json
{
  "kind": "immersive-work",
  "title": "Titre de l’œuvre",
  "targetWorkId": "pack-002",
  "relationship": "écho"
}
```

## 8. Enregistrer l’œuvre

Ajouter une entrée minimale dans `packs/index.json` :

```json
{
  "id": "pack-003",
  "slug": "titre-public-lisible",
  "manifest": "pack-003-nom-de-loeuvre/pack.json"
}
```

Le registre contient uniquement les informations de diffusion. Le titre, la couverture et le résumé restent dans le manifeste.

## 9. Vérifier

Avant publication :

- valider le manifeste et tous les contenus ;
- vérifier l’unicité de l’identifiant et du slug ;
- vérifier les images, alternatives et fallbacks ;
- parcourir l’œuvre au clavier et avec réduction des animations ;
- tester les formats mobile, tablette et bureau ;
- vérifier les liens vers le blog, les livres, ERIA et le site auteur ;
- exécuter les tests, la couverture et le build ;
- contrôler la page générée sous `/oeuvres/<slug>/`.

## 10. Publier

Le build :

1. lit le registre ;
2. charge le manifeste ;
3. génère la route statique ;
4. produit les métadonnées SEO et sociales ;
5. publie le même moteur pour toutes les œuvres.

Après publication, vérifier l’URL canonique et l’aperçu de partage. Un changement de slug doit rester exceptionnel, car GitHub Pages ne fournit pas de redirection dynamique.

## Checklist courte

- [ ] dossier autonome ;
- [ ] manifeste et contenus valides ;
- [ ] noyau éditorial complet ;
- [ ] couverture et alternatives ;
- [ ] parcours et clôture ;
- [ ] passerelles pertinentes ;
- [ ] entrée de registre ;
- [ ] tests et build verts ;
- [ ] accès direct et responsive ;
- [ ] documentation du pack.

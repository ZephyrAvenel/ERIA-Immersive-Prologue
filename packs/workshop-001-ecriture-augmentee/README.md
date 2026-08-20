# Écriture augmentée

Status: planned

Sous-titre : **Écrire avec l'IA sans lui abandonner sa voix**

Description courte : **Un atelier d’écriture en 7 mouvements pour apprendre à dialoguer avec l’IA sans lui abandonner le geste d’auteur.**

Ce dossier contient le squelette éditorial du premier Atelier augmenté de l'INE. Il utilise le format déclaratif `ine-workshop-pack` V1 et reste volontairement non publié dans l'interface publique à ce stade.

## Finalité

L'atelier prépare une traversée pédagogique autonome où le participant apprend à utiliser l'IA comme espace de divergence, de déplacement, de confrontation et d'exploration, sans lui déléguer l'intention, le discernement, la voix ni la responsabilité d'auteur.

Il ne s'agit pas d'un chatbot, d'une interface de génération, ni d'une connexion à un service d'IA.

## Structure

Le squelette contient :

- 7 mouvements ;
- 26 pages ;
- les six primitives Workshop V1 : `text`, `textarea`, `choice`, `reveal`, `promptCopy`, `recall` ;
- des identifiants stables pour les traces pédagogiques structurantes ;
- des relations `recall` destinées à faire réapparaître les traces importantes plus tard dans la traversée.

## Mouvements

1. INTENTION
2. DIVERGENCE
3. EXPLORATION
4. DISCERNEMENT
5. ÉCRITURE
6. TRANSFORMATION
7. CRÉATION

## IA extérieure

Les blocs `promptCopy` contiennent uniquement du texte à copier. Le participant peut utiliser ces prompts dans l'assistant IA extérieur de son choix.

Le pack ne contient :

- aucune clé ;
- aucun endpoint ;
- aucune API IA ;
- aucun chatbot ;
- aucune génération dynamique ;
- aucun appel réseau vers un service d'IA.

## Persistance locale

Le runtime Workshop existant peut conserver localement la progression et certaines réponses pédagogiques nécessaires à la continuité du parcours. Cette mémoire reste locale au navigateur et ne transforme pas l'INE en traitement de texte.

## Description longue préparée

Écriture augmentée est un atelier en sept mouvements consacré à une question simple : comment utiliser l’intelligence artificielle dans un processus d’écriture sans lui abandonner sa voix ?

Le parcours ne propose pas de faire écrire un texte par une IA. Il invite d’abord à faire apparaître une intention, ouvrir plusieurs directions, construire une boussole, explorer des possibilités et discerner ce qui mérite réellement d’être poursuivi.

L’IA intervient ponctuellement comme outil de divergence, de déplacement du regard, de lecture ou de mise à l’épreuve. Elle ne choisit pas à la place de l’auteur et ne reçoit automatiquement aucune réponse écrite dans l’atelier.

Puis vient le moment essentiel : reprendre la main, écrire avec ses propres mots, faire lire sans faire écrire, revenir au texte, reconnaître ce qui s’est transformé et savoir quand s’arrêter.

Au terme des 26 pages, l’objectif n’est pas d’avoir appris à dépendre d’un outil, mais d’avoir développé quelques gestes que l’on peut emporter avec soi — avec ou sans IA.

Cette description longue n’est pas intégrée au manifeste `pack.json` : le format `ine-workshop-pack` V1 ne possède pas de champ prévu pour une description longue.

## Couverture

La couverture artistique validée est présente dans le dossier du Workshop, mais elle n'est pas encore exposée par le manifeste `pack.json` : le format `ine-workshop-pack` V1 ne possède pas de champ `coverImage` ou `coverImageAlt`.

- Couverture Web : `assets/images/00-couverture-ecriture-augmentee.webp`
- Source originale : `assets/images/originals/couverture-ecriture-augmentee-original.jpg`
- Dimensions originales : 853 × 1280 px
- Dimensions Web : 853 × 1280 px
- Format source : JPEG
- Format Web : WebP
- Poids source : 126 255 octets
- Poids Web : 122 714 octets

## Publication

Ce Workshop n'est pas encore rendu public :

- l'entrée `ecriture-augmentee` reste en statut `planned` dans le registre éditorial ;
- aucune route `/ateliers/ecriture-augmentee/` n'est créée ;
- aucune carte cliquable n'est ajoutée ;
- `/ateliers/` reste inchangé.

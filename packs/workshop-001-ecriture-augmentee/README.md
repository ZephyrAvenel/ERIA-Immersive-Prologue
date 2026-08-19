# Écriture augmentée

Status: structural draft

Sous-titre : **Écrire avec l'IA sans lui abandonner sa voix**

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

## Couverture

La couverture artistique n'est pas intégrée dans cette mission. Le format `ine-workshop-pack` V1 ne possède pas encore de champ `coverImage` ou `coverImageAlt`. L'identité visuelle sera traitée lors d'une mission publique ultérieure.

## Publication

Ce Workshop n'est pas encore rendu public :

- l'entrée `ecriture-augmentee` reste en statut `planned` dans le registre éditorial ;
- aucune route `/ateliers/ecriture-augmentee/` n'est créée ;
- aucune carte cliquable n'est ajoutée ;
- `/ateliers/` reste inchangé.

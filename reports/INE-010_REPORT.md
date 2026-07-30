# Rapport de consolidation INE-010

## Synthèse

Le Cycle I d’INE est consolidé sous la version proposée `1.0.0`. Cette version
marque la première fondation stable : moteur générique, deux œuvres
indépendantes, bibliothèque, routes publiques statiques et modèle éditorial.

La mission n’ajoute aucune fonctionnalité importante. Elle corrige les écarts
documentaires, formalise la version et prépare une publication Git propre.

## Audit réalisé

L’audit a couvert :

- arborescence applicative et packages ;
- registre, manifestes et parcours des deux packs ;
- images de diffusion, originaux et fallbacks ;
- routes générées et métadonnées sociales ;
- schémas narratif et éditorial ;
- exemples et fixtures ;
- README, documentation technique, guides éditoriaux et rapports ;
- scripts npm, workflows GitHub Actions et déploiement Pages ;
- état de la branche, de la PR et de `main`.

## Résultats de l’audit

### Arborescence et ressources

- aucun fichier suivi réellement obsolète n’a été identifié ;
- les dossiers de build et de test restent ignorés ;
- le dossier `polarities/` local est vide et non suivi : aucune suppression Git
  n’est nécessaire ;
- les huit illustrations PNG de PACK-001 sont toutes référencées ;
- les douze WebP de PACK-002 sont toutes référencées ;
- les douze PNG sous `assets/images/originals/` sont des sources officielles
  conservées intentionnellement ;
- le placeholder audio est un document de structure, pas une ressource chargée.

### Documentation

Trois écarts ont été corrigés :

- le README décrivait encore un seul pack sélectionné par
  `player.config.json` ;
- `docs/ARCHITECTURE.md` ne représentait pas le registre, la bibliothèque et
  les routes statiques ;
- `docs/TESTING.md` parlait encore d’un parcours de huit scènes.

La documentation PACK-002 a également été alignée sur le registre minimal
`id`/`slug`/`manifest`.

### Architecture

Les frontières sont respectées :

- `packages/` ne contient aucun récit ou identifiant d’œuvre ;
- la bibliothèque lit les métadonnées depuis les manifestes ;
- le registre ne duplique aucun contenu éditorial ;
- les packs ne se référencent pas ;
- les parcours conservent leurs données métier ;
- Vite génère les routes de diffusion sans dupliquer le moteur.

`player.config.json` est conservé comme fallback historique de déploiement. Il
n’est pas utilisé par les URLs canoniques et ne constitue pas une dépendance
entre packs.

## Corrections et consolidation

- nettoyage du test Chrome : suppression d’une ancienne assertion Unicode
  commentée ;
- mise à jour du README et des guides techniques ;
- ajout de `CHANGELOG.md` ;
- passage cohérent du workspace et des packages internes de `0.1.0` à `1.0.0`;
- conservation intégrale des livrables INE-008 et INE-009 ;
- aucun asset officiel supprimé ;
- aucune dépendance ajoutée.

## Version

Version retenue : **INE v1.0.0**.

SemVer est adapté au moteur :

- `PATCH` pour une correction compatible ;
- `MINOR` pour une capacité compatible ou un champ optionnel ;
- `MAJOR` pour une rupture de contrat du moteur ou des formats.

Les versions des œuvres restent indépendantes dans leurs manifestes. Une
réédition de PACK-002 n’impose donc pas une nouvelle version majeure d’INE.

## Validation

Le gate local `npm run test:ci` a été exécuté intégralement avec Chrome forcé :

- typecheck : réussi ;
- lint : non applicable, aucun script ni outil de lint n’est configuré ;
- tests unitaires : 57/57 réussis ;
- tests d’intégration : 12/12 réussis ;
- couverture : 69/69 tests réussis, 90,17 % lignes, 83,19 % branches,
  91,25 % fonctions ;
- build de production : réussi ;
- scénario Chrome réel : 1/1 réussi ;
- PACK-001, PACK-002, bibliothèque, routes directes, responsive, focus,
  alternatives textuelles et réduction des animations : vérifiés.

Les statuts GitHub Actions et le déploiement Pages sont contrôlés après le push
et la fusion.

## Stratégie Git

Les changements INE-008, INE-009 et la stabilisation INE-010 forment une même
décision de fin de cycle. Un commit local unique de consolidation est préférable
à plusieurs commits artificiels, car INE-008 et INE-009 ont été validées mais
jamais publiées séparément.

La branche existante et sa PR sont conservées afin de respecter le workflow du
dépôt. La PR sera mise à jour, sortie du mode brouillon, puis fusionnée par
squash dans `main` après validation des contrôles. Le commit de fusion recevra
le tag `v1.0.0`.

## Feuille de route possible pour le Cycle II

- enrichir progressivement les œuvres existantes avec les métadonnées
  éditoriales utiles ;
- publier de nouvelles œuvres utilisant d’abord les formats déjà disponibles ;
- faire évoluer la bibliothèque vers des fiches d’œuvre et des passerelles
  éditoriales sobres ;
- améliorer les performances d’images de PACK-001 et le cache hors ligne ;
- n’ajouter un nouveau renderer que lorsqu’une nouvelle forme narrative le
  justifie ;
- consolider l’observabilité de publication : liens externes, métadonnées
  sociales et contrôles de déploiement.

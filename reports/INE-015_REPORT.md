# Rapport INE-015 - Ajout du PACK-003

## Résultat

PACK-003 - Atlas des Récits Vivants est intégré comme troisième oeuvre
autonome de la bibliothèque immersive.

## Livrables

- nouveau format `ine-living-card-pack`;
- chargeurs `loadLivingCardPack` et `loadLivingCard`;
- composant générique `LivingCardRenderer`;
- dossier `packs/pack-003-atlas-recits-vivants/`;
- manifeste `pack.json`;
- huit fichiers JSON de Living Cards;
- neuf illustrations SVG verticales d'attente, sans texte intégré;
- entrée de registre pour `/oeuvres/atlas-recits-vivants/`;
- documentation `docs/PACK-003-ATLAS-RECITS-VIVANTS.md`;
- tests unitaires, intégration et navigateur.

## Préservation des packs existants

PACK-001 et PACK-002 ne sont pas modifiés dans leurs contenus. Le registre
ajoute uniquement PACK-003. Le Player conserve les routes existantes et choisit
le rendu selon le champ `format` du manifeste.

## Images

La mission ne fournissait pas d'illustrations définitives. Des placeholders SVG
verticaux ont donc été intégrés dans `assets/images/` afin que l'expérience soit
testable immédiatement. Ils ne contiennent aucun texte et peuvent être remplacés
par les futures images officielles sans changement moteur.

## Validation locale

- typecheck : succès;
- tests unitaires : 64/64;
- tests d'intégration : 15/15;
- couverture : 90,70 % lignes, 83,66 % branches, 92,22 % fonctions;
- build de production : succès;
- test navigateur local Chrome : succès;
- scénario navigateur enrichi pour la bibliothèque à trois oeuvres, l'accès
  direct à `/oeuvres/atlas-recits-vivants/`, la navigation complète des huit
  cartes et les contrôles mobiles.

La PR devra confirmer les mêmes contrôles dans GitHub Actions après push.

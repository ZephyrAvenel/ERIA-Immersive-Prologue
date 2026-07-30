# PACK-002 / INE-006 — Polarités Vivantes

## Résultat

La mission crée le second pack indépendant de l'INE et étend le moteur avec un
format contemplatif générique. PACK-001 reste le pack configuré par défaut et
son manifeste, ses scènes, ses images et son scénario sont inchangés.

## Livrables

- manifeste `packs/pack-002-polarites-vivantes/pack.json` ;
- dix polarités JSON reliées de façon bornée ;
- douze illustrations définitives PNG/WebP, dont une couverture et une
  clôture, avec conservation des originaux ;
- dossier audio réservé ;
- composant public `PolarityRenderer` sans texte métier ;
- détection du format de pack et chargement d'un seul pack au lancement ;
- navigation retour, article, précédente et suivante ;
- disparition automatique des contrôles aux extrémités ;
- registre déclaratif `packs/index.json` ;
- documentation et tests d'intégration.

## Décision sur le registre

Le registre a été retenu parce qu'il reste passif et compact. Il ne modifie ni
le contrat des packs ni le démarrage actuel. Un futur sélecteur pourra le lire,
mais le déploiement choisit aujourd'hui son unique pack via `packUrl`.

Cette solution évite d'inscrire des identifiants de packs dans le moteur. Une
entrée peut être ajoutée ou retirée sans modifier le code.

## Validation d'architecture

PACK-001 et PACK-002 ne se référencent jamais :

- PACK-001 demeure sous `examples/demo-pack/` et fonctionne avec
  `ine-narrative-pack` ;
- PACK-002 demeure sous `packs/pack-002-polarites-vivantes/` et fonctionne avec
  `ine-polarity-pack` ;
- les contenus PACK-002 ne contiennent aucune référence à `demo-pack`, aux
  scènes de PACK-001 ou à ses assets ;
- le moteur ne contient aucun titre ni texte métier des deux œuvres ;
- tous les chemins d'assets sont relatifs au manifeste ou au JSON propriétaire.

La suppression d'un dossier de pack peut rendre son entrée de registre
indisponible, mais ne casse ni le moteur ni l'autre pack. Supprimer l'entrée
correspondante suffit à garder le registre cohérent.

## Contenu éditorial

Les dix couples imposés structurent le parcours. Les textes contemplatifs sont
externalisés dans leurs fichiers JSON. L'URL canonique précise de l'article
n'étant pas exposée dans le dépôt ni indexée publiquement au moment de la
mission, les fichiers pointent vers la racine officielle
`https://zephyr-avenel.blogspot.com/`. Cette valeur est remplaçable dans les JSON
sans changement du moteur.

## Expérience

Le rythme demandé est porté par les styles existants : fondu, illustration,
titre, pôles, lumière du pont, citation, question puis actions. L'expérience
reste responsive, accessible au clavier et respecte la réduction des mouvements.

## Vérifications

Les tests couvrent :

- manifeste et dix fichiers JSON ;
- chaîne précédente/suivante et extrémités ;
- existence des illustrations et fallback ;
- présence des douze WebP optimisés et des douze PNG originaux ;
- budget de poids individuel des ressources de production ;
- registre et indépendance des références ;
- rendu du composant et contenu accessible ;
- PACK-001 historique ;
- typecheck, couverture, build et navigateur réel.

Résultats locaux finaux :

```text
typecheck : succès
tests unitaires : 53/53
tests d'intégration : 9/9
tests avec couverture : 62/62
couverture : lignes 90,75 %, branches 84,35 %, fonctions 91,14 %
build de production : succès
scénario Chrome réel PACK-001 + PACK-002 : 1/1
```

## Mise à jour INE-007

La mention initiale « illustrations SVG sans texte » est obsolète. Les
placeholders ont été retirés et remplacés par les illustrations officielles
fournies pour INE-007. La couverture `00-couverture.webp` et la clôture
`11-cloture.webp` comportent du texte intégré validé comme partie de leur
composition. Les fichiers PNG sources sont conservés dans
`assets/images/originals/`.

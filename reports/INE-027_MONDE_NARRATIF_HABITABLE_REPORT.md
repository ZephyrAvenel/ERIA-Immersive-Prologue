# Rapport INE-027 — Monde narratif habitable

## Résumé

La mission INE-027 fait évoluer l’aperçu de l’INE afin que la bibliothèque ne soit plus perçue comme un simple catalogue d’œuvres, mais comme l’entrée dans un territoire narratif habitable.

Le fonctionnement des packs, des routes et du registre est conservé. La mission intervient uniquement sur la présentation éditoriale et l’en-tête de la bibliothèque.

## Ancien positionnement

L’écran `/bibliotheque/` présentait l’INE principalement comme :

> Bibliothèque des œuvres immersives

avec une phrase courte :

> Des récits indépendants, un même espace d’immersion.

Cette formulation restait correcte fonctionnellement, mais elle ne traduisait plus suffisamment la maturité actuelle de l’univers immersif.

## Nouveau positionnement

Le nouvel aperçu introduit l’INE comme :

> Un monde narratif habitable

Signature principale :

> Les Récits Vivants ne sont pas seulement des histoires à lire. Ce sont des mondes à explorer, des passages à traverser et des expériences qui invitent chacun à habiter autrement le réel.

Texte d’orientation :

> Chaque œuvre est une porte d’entrée. Chaque pack est un chemin. Chaque carte devient un repère. L’INE rassemble ces parcours en un territoire narratif vivant, que chacun peut traverser à son rythme.

Texte d’introduction aux cartes :

> Choisissez une porte d’entrée. Chaque parcours ouvre une manière différente d’explorer les Récits Vivants.

La mention “Bibliothèque des œuvres immersives” reste présente comme repère d’orientation, mais elle devient un surtitre plutôt que la définition principale de l’expérience.

## Choix UX

- Conservation de la bibliothèque comme espace d’exploration clair.
- Présentation des packs comme portes d’entrée et chemins.
- Ajout d’une hiérarchie visuelle progressive : repère, titre, signature, orientation, invitation.
- Mise en page contenue pour éviter que l’introduction prenne toute la place sur mobile.
- Maintien des cartes existantes, de leurs images, de leurs titres et de leurs boutons.

## Fichiers modifiés

- `apps/player/index.html`
- `apps/player/src/localization.ts`
- `apps/player/src/locales/fr.json`
- `apps/player/src/locales/en.json`
- `apps/player/src/main.ts`
- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `reports/INE-027_MONDE_NARRATIF_HABITABLE_REPORT.md`

## Responsive

Points vérifiés ou couverts par le scénario navigateur :

- route `/bibliotheque/` conservée ;
- bibliothèque toujours accessible depuis l’icône de navigation ;
- 7 œuvres présentes ;
- absence d’overflow horizontal ;
- introduction lisible sans masquer les cartes ;
- routes directes des packs conservées.

Largeurs ciblées par la validation e2e existante et les vérifications responsive :

- mobile 360 px ;
- mobile 390 px ;
- mobile 430 px ;
- tablette ;
- desktop.

## Préservation des packs

Aucun contenu, manifeste, asset ou route des packs PACK-001 à PACK-007 n’a été modifié.

La mission ne modifie pas l’architecture du moteur ni le registre.

## Validations

Commandes exécutées :

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK, 64 tests passés
- `npm.cmd run test:integration` : OK, 31 tests passés
- `npm.cmd run test:coverage` : OK, 95 tests passés et seuils respectés
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK
- `npm.cmd run test:e2e` sans `CHROME_PATH` : sauté proprement car Chrome n’est pas auto-détecté localement
- `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm.cmd run test:e2e` : OK, 1 test navigateur réel passé

Le test navigateur vérifie désormais aussi :

- le titre “Un monde narratif habitable” ;
- la présence de la signature officielle ;
- la présence du texte d’orientation ;
- la bibliothèque à 7 œuvres ;
- les routes directes des packs.

## Limites

La mission reste volontairement limitée à l’accueil bibliothèque. Elle ne transforme pas les parcours internes des packs et ne crée pas de nouvel écran d’introduction global.

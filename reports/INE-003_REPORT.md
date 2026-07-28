# INE-003 Report - Raffinement UX et identité du moteur

## Résumé

La mission INE-003 transforme le Player d’un prototype en une première
expérience de moteur narratif générique. Le rendu ne présente plus le contenu
comme une carte : l’image devient le point d’attention principal, le texte
respire davantage, la progression devient narrative, et les chaînes
d’interface sont localisées.

Le moteur reste indépendant du contenu : l’identité affichée du moteur est
`Immersive Narrative Engine`, tandis que le titre du Narrative Pack provient
exclusivement du manifeste.

## Changements réalisés

- Suppression de l’effet visuel de carte : plus de bordure ni de fond de bloc
  autour de la scène.
- Images affichées en entier par défaut avec `object-fit: contain`.
- Ajout du type `ImageDisplayMode` : `contain`, `cover`, `fill`,
  `immersive`.
- Ajout de `imageDisplayMode` comme propriété optionnelle de scène dans le
  Core, le validateur et le JSON Schema.
- Ajout de `currentSceneIndex` et `sceneCount` dans le Core pour permettre une
  progression narrative.
- Remplacement de la barre de progression par `Scène X / Y` et des jalons
  visuels.
- Séparation de l’identité moteur et de l’identité du pack dans le Renderer.
- Ajout de `apps/player/src/locales/en.json` et
  `apps/player/src/locales/fr.json`.
- Sélection automatique de la locale depuis `pack.language`.
- Localisation des boutons, du lien d’évitement, des libellés ARIA, de la
  progression et des messages d’erreur visibles.
- Remplacement des messages techniques internes par des codes d’erreur.
- Mise à jour du pack de démonstration en français pour valider le flux localisé.
- Documentation mise à jour dans `README.md`, `docs/ARCHITECTURE.md` et
  `docs/NARRATIVE_PACKS.md`.

## Fichiers modifiés

- `apps/player/index.html`
- `apps/player/src/main.ts`
- `apps/player/src/styles.css`
- `apps/player/src/locales/en.json`
- `apps/player/src/locales/fr.json`
- `packages/core/src/index.ts`
- `packages/renderer/src/index.ts`
- `packages/sdk/src/index.ts`
- `packages/validators/src/index.ts`
- `schemas/narrative-pack.schema.json`
- `examples/demo-pack/pack.json`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/NARRATIVE_PACKS.md`

## Décisions techniques

- `contain` est le mode par défaut afin de respecter les œuvres des auteurs et
  d’éviter toute coupe involontaire.
- Les modes `cover`, `fill` et `immersive` sont disponibles comme contrat
  d’affichage, mais aucune logique avancée de transition ou d’animation n’est
  ajoutée dans cette mission.
- Le Renderer ne possède plus de texte d’interface codé en dur ; il reçoit les
  libellés depuis le Player.
- Le Player garde la responsabilité de la localisation et des futures entrées
  utilisateur, ce qui prépare clavier, swipe mobile et gamepad sans les
  implémenter.
- Le Core reste propriétaire de l’état narratif, de la résolution d’assets et
  des types partagés.

## Validations effectuées

| Contrôle | Résultat |
| --- | --- |
| TypeScript strict | OK via `node.exe node_modules/typescript/bin/tsc --noEmit` |
| Build Vite | OK via `node.exe node_modules/vite/bin/vite.js build` |
| Rendu desktop `1280x800` | OK |
| Rendu tablette `768x1024` | OK |
| Rendu mobile `390x844` | OK |
| Image par défaut non tronquée | OK, `object-fit: contain` |
| Aucune bordure de scène | OK, `border-width: 0px` |
| Interface française avec pack français | OK |
| Parcours des huit scènes | OK |
| Images chargées dans les huit scènes | OK |
| Console navigateur | OK, aucune erreur |
| Débordement horizontal | OK, aucun overflow détecté |

Comme lors d’INE-002, l’exécutable `npm` n’est pas disponible dans le PATH de
cette session Codex. Les validations ont donc été exécutées avec Node 24.14.0
et les dépendances déjà installées.

## État final

La fondation UX est validée pour INE-003. Le Player présente une identité
générique, respecte le cadrage intégral des images par défaut, affiche une
interface localisée et conserve une séparation nette entre moteur et Narrative
Pack.

Aucun push GitHub n’a été effectué.

## Recommandations pour INE-004

- Définir le contrat d’entrée utilisateur pour clavier, swipe et gamepad.
- Formaliser les options de progression dans le schéma si plusieurs styles
  doivent être proposés aux auteurs.
- Ajouter des tests automatisés dédiés au rendu et aux locales.
- Préparer les premiers contrats d’ambiance pour audio, vidéo, animation et
  narration vocale, sans coupler ces médias à un pack précis.

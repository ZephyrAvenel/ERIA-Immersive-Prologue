# INE-032 — Intégration du PACK-012 « Celle que je n’avais pas encore rencontrée »

## Résumé

Ajout local du PACK-012 comme novella photographique immersive autonome dans l’architecture INE existante.

Le pack réutilise le mécanisme mutualisé `image-then-text` :

- phase Contempler : image WebP complète en `object-fit: contain` ;
- phase Lire : texte narratif complet ;
- navigation précédente/suivante et retour bibliothèque conservés.

Aucun commit ni push n’a été effectué, conformément à la consigne.

## Architecture découverte et réutilisée

- Registre : `packs/index.json`.
- Manifeste narratif : `packs/<pack>/pack.json` au format `ine-narrative-pack`.
- Schéma : `schemas/narrative-pack.schema.json`.
- Assets player : `assets/images/*.webp`.
- Originaux conservés : `assets/images/originals/*.png`.
- Route publique : dérivée du slug du registre, ici `/oeuvres/celle-que-je-navais-pas-encore-rencontree/`.
- Rendu : `apps/player/src/main.ts` et `packages/renderer/src/index.ts`.
- Pack de référence principal : PACK-011, avec confirmation sur PACK-010 pour le mode Contempler/Lire.

## Fichiers créés

- `packs/pack-012-celle-que-je-navais-pas-encore-rencontree/pack.json`
- `packs/pack-012-celle-que-je-navais-pas-encore-rencontree/README.md`
- `packs/pack-012-celle-que-je-navais-pas-encore-rencontree/assets/images/*.webp`
- `packs/pack-012-celle-que-je-navais-pas-encore-rencontree/assets/images/originals/*.png`
- `tests/integration/narrative-pack/pack-012.test.mjs`
- `reports/INE-032_PACK_012_CONTACT_SHEET.jpg`
- `reports/INE-032_PACK_012_IMAGE_MAPPING.json`
- `reports/INE-032_PACK_012_CELLE_QUE_JE_NAVAIS_PAS_ENCORE_RENCONTREE_REPORT.md`

## Fichiers modifiés

- `packs/index.json`
- `tests/e2e/player.test.mjs`
- tests d’intégration existants contenant la liste explicite des packs publiés
- `tests/integration/editorial-model/editorial-model.test.mjs`

## Assets intégrés

Le ZIP inspecté contient 13 PNG, sans chemin dangereux.

Poids total PNG : **28599055 octets**
Poids total WebP : **1742436 octets**

| Ordre | Source | PNG conservé | WebP utilisé | Dimensions | Poids PNG | Poids WebP |
| --- | --- | --- | --- | --- | ---: | ---: |
| 00 | `file_00000000baa481f4a15106b6cc4a3ef8.png` | `pack-012-cover.png` | `pack-012-cover.webp` | 1023x1537 | 2271553 | 185260 |
| 01 | `file_000000002f5881f4817d3cfe77c51ae6.png` | `pack-012-01-vie-deja-ecrite.png` | `pack-012-01-vie-deja-ecrite.webp` | 1536x1024 | 2137598 | 98002 |
| 02 | `file_00000000f01081f4949321059be2ea13.png` | `pack-012-02-fenetre-autre-vie.png` | `pack-012-02-fenetre-autre-vie.webp` | 1536x1024 | 2148996 | 105532 |
| 03 | `file_00000000e04081f49e0ac2640352d69e.png` | `pack-012-03-fascination.png` | `pack-012-03-fascination.webp` | 1536x1024 | 2315729 | 138446 |
| 04 | `file_00000000967481f4b84d38a9aa76915c.png` | `pack-012-04-deplacement.png` | `pack-012-04-deplacement.webp` | 1536x1024 | 2328051 | 136052 |
| 05 | `file_00000000206081f4a68bc97b3071ab02.png` | `pack-012-05-perdre-ancien-nom.png` | `pack-012-05-perdre-ancien-nom.webp` | 1536x1024 | 2224704 | 130450 |
| 06 | `file_00000000bf2c81f4811f62d147d82a33.png` | `pack-012-06-autre-peau.png` | `pack-012-06-autre-peau.webp` | 1536x1024 | 2159922 | 129478 |
| 07 | `file_000000005f74820aafa455155b8165b5.png` | `pack-012-07-traverser-inconnu.png` | `pack-012-07-traverser-inconnu.webp` | 1536x1024 | 1970938 | 91522 |
| 08 | `file_00000000589081f4a83ed4861b3519f8.png` | `pack-012-08-autre-miroir.png` | `pack-012-08-autre-miroir.webp` | 1536x1024 | 2211214 | 148008 |
| 09 | `image9.png` | `pack-012-09-ne-pas-devenir-autre.png` | `pack-012-09-ne-pas-devenir-autre.webp` | 1536x1024 | 2304571 | 130886 |
| 10 | `file_00000000748c81f493f1758209899f72.png` | `pack-012-10-revenir-autrement.png` | `pack-012-10-revenir-autrement.webp` | 1672x941 | 1870608 | 95492 |
| 11 | `file_00000000ef2c81f4ae8242451195866d.png` | `pack-012-11-habiter-propre-recit.png` | `pack-012-11-habiter-propre-recit.webp` | 1536x1024 | 2357743 | 166354 |
| 12 | `file_00000000b8bc81f482526d80b280c087.png` | `pack-012-closing.png` | `pack-012-closing.webp` | 1536x1024 | 2297428 | 186954 |

Les PNG source sont RGB, sans profil ICC détecté. Les WebP ont été générés sans recadrage destructif, avec dimensions conservées.

## Ordre narratif final

1. Couverture — Celle que je n’avais pas encore rencontrée
2. La vie déjà écrite
3. La fenêtre sur une autre vie
4. La fascination
5. Le déplacement
6. Perdre son ancien nom
7. Essayer une autre peau
8. Traverser l’inconnu
9. Découvrir que l’autre était un miroir
10. Ne pas devenir l’autre
11. Revenir autrement
12. Habiter son propre récit
13. Clôture — Épilogue

## Écart documenté

La mission précise que la couverture ne nécessite pas de texte « Lire » supplémentaire. Le schéma actuel impose toutefois un champ `text` non vide pour chaque entrée narrative. Pour éviter de créer un système parallèle, la couverture utilise un texte minimal : « Un récit vivant. »

## Contrôles effectués pendant l’intégration

- ZIP : 13 PNG trouvés.
- Sécurité ZIP : aucun chemin absolu, parent `..`, ni chemin dangereux.
- Mapping : mapping explicite appliqué, sans tri alphabétique.
- Planche de contrôle : `reports/INE-032_PACK_012_CONTACT_SHEET.jpg`.
- Assets : 13 PNG originaux conservés et 13 WebP générés.
- Manifeste : 13 entrées, `layout: "image-then-text"`, `imageDisplayMode: "contain"`.
- Registre : PACK-012 ajouté en douzième position.
- Tests : tests d’intégration et e2e adaptés pour 12 œuvres.

## Responsive

Le pack utilise le CSS existant du mode `image-then-text`, qui sépare la contemplation de l’image et la lecture du texte. Les images contiennent du texte intégré et sont donc référencées en `contain`.

Le test navigateur réel avec Chrome explicite a été exécuté avec succès. Le scénario e2e couvre l’accès direct à `/oeuvres/celle-que-je-navais-pas-encore-rencontree/`, la phase Contempler, la phase Lire, la navigation jusqu’à la clôture et le retour à la bibliothèque.

Points confirmés :

- route PACK-012 accessible ;
- bibliothèque à 12 œuvres ;
- images en `object-fit: contain` ;
- pas d’overflow horizontal détecté ;
- textes Lire accessibles ;
- navigation Contempler → Lire → scène suivante fonctionnelle ;
- clôture / épilogue accessibles.

## Validations exécutées

- `npm.cmd run typecheck` : OK.
- `npm.cmd run test:unit` : OK, 66 tests passés.
- `npm.cmd run test:integration` : OK, 51 tests passés.
- `npm.cmd run test:coverage` : OK, 117 tests passés, couverture globale 90.80 % lignes / 83.92 % branches / 92.22 % fonctions.
- `npm.cmd run build` : OK.
- `npm.cmd run test:ci` : OK après relance hors sandbox. Le premier run sandbox a échoué uniquement sur un refus d’accès esbuild (`Cannot read directory "../../../../../.."`), puis la relance hors sandbox a validé tests, coverage, build et e2e sauté proprement faute de Chrome auto-détecté.
- `$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'; npm.cmd run test:e2e` : OK, 1 test navigateur réel passé, 0 skipped.

## Limites éventuelles

- La couverture verticale mesure 1023 × 1537, contrairement aux scènes majoritairement 1536 × 1024. Le mode `contain` évite le recadrage.
- La scène 10 mesure 1672 × 941. Le mode `contain` conserve son ratio panoramique.
- Aucun style PACK-012 spécifique n’a été ajouté à ce stade.

## État Git

Branche locale : `agent/ine-032-pack-012-celle-que-je-navais-pas-encore-rencontree`.

Aucun commit et aucun push réalisés.

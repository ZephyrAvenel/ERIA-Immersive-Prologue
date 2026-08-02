# INE-022 — Ajout du PACK-005 “Les récits qui révèlent… ou qui enferment”

## Résumé

PACK-005 a été intégré comme cinquième œuvre immersive autonome d’INE.

Le pack utilise le format existant `ine-narrative-pack`, comme PACK-004, afin de conserver une architecture simple et générique. Aucun nouveau renderer n’a été créé.

Route canonique ajoutée :

```text
/oeuvres/recits-qui-revelent-ou-enferment/
```

## Source des images

Le lien Google Drive fourni contenait 12 PNG directement accessibles, et non un ZIP unique. Les fichiers ont donc été traités comme la source officielle de la mission.

Une planche de contrôle visuelle a été créée :

```text
reports/INE-022_PACK_005_CONTROL_SHEET.png
```

## Images détectées

12 fichiers PNG opaques ont été téléchargés depuis le dossier Drive public.

Poids total PNG : **32 012 501 octets**.

Poids total WebP : **2 933 952 octets**.

Les dimensions originales ont été conservées. Aucun recadrage destructif n’a été appliqué.

## Mapping final des images

| Source Drive | Rôle identifié | PNG conservé | WebP utilisé | Dimensions |
| --- | --- | --- | --- | --- |
| `file_00000000135c81f493058937c7831082.png` | Couverture principale | `00-couverture-recits-qui-revelent-ou-enferment.png` | `00-couverture-recits-qui-revelent-ou-enferment.webp` | 1086 × 1448 |
| `file_0000000003b4820cbdbf18cbb6dd22d6.png` | Couverture alternative avec mention PACK NARRATIF 005 | `00-couverture-alt-pack-005.png` | `00-couverture-alt-pack-005.webp` | 1024 × 1536 |
| `file_000000004a9081f4ae82613c516a1a4b.png` | Le premier regard | `01-le-premier-regard.png` | `01-le-premier-regard.webp` | 1024 × 1536 |
| `file_00000000106081f490b3e5b5acacef61.png` | Une expérience célèbre | `03-une-experience-celebre.png` | `03-une-experience-celebre.webp` | 1024 × 1536 |
| `file_000000005eb081f49bb885b4aad39274.png` | Les chemins qui s’ouvrent | `04-les-chemins-qui-souvrent.png` | `04-les-chemins-qui-souvrent.webp` | 1024 × 1536 |
| `file_000000001dc881f4b2cb5c6f718a708d.png` | Lorsque le récit devient une cage | `05-lorsque-le-recit-devient-une-cage.png` | `05-lorsque-le-recit-devient-une-cage.webp` | 1024 × 1536 |
| `file_0000000062848243922ab8c09c50d9e8.png` | Les récits empêchés | `06-les-recits-empeches.png` | `06-les-recits-empeches.webp` | 1024 × 1536 |
| `file_00000000a1e881f6aca1aca189fb4d0b.png` | Les récits vivants | `07-les-recits-vivants.png` | `07-les-recits-vivants.webp` | 1024 × 1536 |
| `file_00000000dc6481f4aaa94e2e08bb9ac8.png` | Le récit que je porte sur moi-même | `08-le-recit-que-je-porte-sur-moi-meme.png` | `08-le-recit-que-je-porte-sur-moi-meme.webp` | 1086 × 1448 |
| `file_00000000150481f48728d328767645c7.png` | Les passeurs de récits | `09-les-passeurs-de-recits.png` | `09-les-passeurs-de-recits.webp` | 1024 × 1536 |
| `file_000000001748820c9eaa7a8d9f91c060.png` | Une responsabilité partagée | `10-une-responsabilite-partagee.png` | `10-une-responsabilite-partagee.webp` | 1024 × 1536 |
| `file_00000000604c8246b07187832125d69e.png` | Quel récit faisons-nous grandir ? | `11-quel-recit-faisons-nous-grandir.png` | `11-quel-recit-faisons-nous-grandir.webp` | 1024 × 1536 |

## Point d’attention éditorial

Le dossier contient deux couvertures :

- une couverture principale sans mention technique de pack ;
- une couverture alternative avec la mention “PACK NARRATIF 005”.

La couverture principale est utilisée dans le manifeste et dans la bibliothèque. La couverture alternative est conservée dans les assets comme ressource documentaire.

Aucune image dédiée à la scène “Les attentes invisibles” n’a été trouvée. La scène 2 est donc conservée sans image afin de ne pas inventer un visuel ni réutiliser artificiellement une autre illustration.

## Fichiers créés

- `packs/pack-005-recits-qui-revelent-ou-enferment/pack.json`
- `packs/pack-005-recits-qui-revelent-ou-enferment/README.md`
- `packs/pack-005-recits-qui-revelent-ou-enferment/assets/images/*.webp`
- `packs/pack-005-recits-qui-revelent-ou-enferment/assets/images/originals/*.png`
- `reports/INE-022_PACK_005_CONTROL_SHEET.png`
- `reports/INE-022_PACK_005_RECITS_REVELENT_ENFERMENT_REPORT.md`
- `tests/integration/narrative-pack/pack-005.test.mjs`

## Fichiers modifiés

- `packs/index.json`
- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `tests/integration/editorial-model/editorial-model.test.mjs`
- `tests/integration/narrative-pack/pack-004.test.mjs`
- `tests/integration/polarity-pack/pack-002.test.mjs`

## Choix techniques

- Réutilisation du renderer narratif existant.
- Aucun nouveau composant.
- Aucun changement de route existante.
- Aucun changement sur PACK-001, PACK-002, PACK-003 ou PACK-004.
- CSS responsive ciblé uniquement via `.player[data-pack-id="pack-005"]`.
- Affichage mobile/tablette en `object-fit: contain` pour préserver les textes intégrés aux images.
- Boutons empilés sur mobile pour éviter les chevauchements.

## Validations exécutées

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK, 64 tests
- `npm.cmd run test:integration` : OK, 23 tests
- `npm.cmd run test:coverage` : OK, 87 tests, couverture globale 90,70 % lignes / 83,66 % branches / 92,22 % fonctions
- `npm.cmd run build` : OK après relance hors sandbox ; la première tentative a été bloquée par l’environnement Vite/esbuild avec un accès répertoire refusé
- `npm.cmd run test:e2e` : OK côté commande locale, test sauté car aucun `CHROME_PATH` n’était défini dans l’environnement local
- `npm.cmd run test:ci` : OK, avec le même saut local du test e2e faute de `CHROME_PATH`

Une tentative complémentaire avec `CHROME_PATH` pointant vers Chrome local a été réalisée. Elle a échoué avant le bloc PACK-005 sur un état de reprise/prologue du pack home existant. Cette divergence n’est pas liée à l’ajout de PACK-005 et n’a pas modifié le périmètre de la mission.

## Responsive

Points vérifiés par tests d’intégration et scénario navigateur automatisé :

- bibliothèque avec 5 œuvres ;
- route directe PACK-005 ;
- navigation complète de la scène 1 / 12 à la scène 12 / 12 ;
- scène 2 sans image ;
- images complètes en mobile ;
- boutons finaux empilés ;
- absence de régression sur les quatre packs existants.

La vérification via navigateur intégré a confirmé le chargement de la bibliothèque et de la route PACK-005. L’override de viewport du navigateur intégré est resté à 1280 × 720 dans cette session ; les breakpoints mobiles sont donc couverts par le CSS ciblé et les assertions e2e ajoutées, mais la capture visuelle mobile intégrée n’a pas pu être produite localement.

## Limites

La seule limite identifiée est l’absence d’image dédiée à “Les attentes invisibles”. Le parcours reste complet côté texte et navigation.

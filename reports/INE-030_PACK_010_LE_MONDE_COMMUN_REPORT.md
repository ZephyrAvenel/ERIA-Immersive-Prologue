# INE-030 — Ajout du PACK-010 Le Monde commun

## Résumé

La mission ajoute le PACK-010 — **Le Monde commun** comme dixième œuvre autonome de la bibliothèque immersive.

Le pack utilise le mode `image-then-text` déjà introduit par PACK-009 :

- phase **Contempler** : image entière en `contain` ;
- phase **Lire** : texte narratif complet ;
- compteur public de type `Scène 1 / 12 — Contempler`, puis `Scène 1 / 12 — Lire`.

Route ajoutée :

`/oeuvres/le-monde-commun/`

## Images intégrées

ZIP source :

`C:/Users/LeoBe/Downloads/Pack-narratif-monde-commun.zip`

Le ZIP contient bien 12 PNG dans le dossier `Pack-narratif-monde-commun/`.

Aucun chemin dangereux n’a été détecté dans l’archive.

Planche de contrôle créée :

`reports/INE-030_PACK_010_CONTACT_SHEET.jpg`

Mapping technique créé :

`reports/INE-030_PACK_010_IMAGE_MAPPING.json`

## Mapping source → nom canonique

| Source ZIP | PNG original conservé | WebP généré | Scène |
| --- | --- | --- | --- |
| `Pack-narratif-monde-commun/00-monde-commun.png` | `00-couverture-le-monde-commun.png` | `00-couverture-le-monde-commun.webp` | Couverture — Le Monde commun |
| `Pack-narratif-monde-commun/01-monde-commun.png` | `01-des-chemins-differents.png` | `01-des-chemins-differents.webp` | Des chemins différents |
| `Pack-narratif-monde-commun/02-monde-commun.png` | `02-la-tentation-du-camp.png` | `02-la-tentation-du-camp.webp` | La tentation du camp |
| `Pack-narratif-monde-commun/03-monde-commun.png` | `03-ce-qui-nous-separe.png` | `03-ce-qui-nous-separe.webp` | Ce qui nous sépare |
| `Pack-narratif-monde-commun/04-monde-commun.png` | `04-ce-qui-nous-relie-encore.png` | `04-ce-qui-nous-relie-encore.webp` | Ce qui nous relie encore |
| `Pack-narratif-monde-commun/05-monde-commun.png` | `05-le-desaccord-vivant.png` | `05-le-desaccord-vivant.webp` | Le désaccord vivant |
| `Pack-narratif-monde-commun/06-monde-commun.png` | `06-l-ecoute-comme-seuil.png` | `06-l-ecoute-comme-seuil.webp` | L’écoute comme seuil |
| `Pack-narratif-monde-commun/07-monde-commun.png` | `07-construire-sans-uniformiser.png` | `07-construire-sans-uniformiser.webp` | Construire sans uniformiser |
| `Pack-narratif-monde-commun/08-monde-commun.png` | `08-les-lieux-qui-tiennent-le-lien.png` | `08-les-lieux-qui-tiennent-le-lien.webp` | Les lieux qui tiennent le lien |
| `Pack-narratif-monde-commun/09-monde-commun.png` | `09-les-recits-qui-reparent.png` | `09-les-recits-qui-reparent.webp` | Les récits qui réparent |
| `Pack-narratif-monde-commun/10-monde-commun.png` | `10-veiller-ensemble.png` | `10-veiller-ensemble.webp` | Veiller ensemble |
| `Pack-narratif-monde-commun/11-monde-commun.png` | `11-faire-monde.png` | `11-faire-monde.webp` | Clôture — Faire monde |

## Poids des images

- Total PNG originaux : 32 124 495 octets.
- Total WebP générés : 3 854 182 octets.
- Les PNG originaux sont conservés dans `packs/pack-010-le-monde-commun/assets/images/originals/`.
- Les WebP optimisés sont utilisés par le manifeste depuis `packs/pack-010-le-monde-commun/assets/images/`.

## Fichiers créés

- `packs/pack-010-le-monde-commun/pack.json`
- `packs/pack-010-le-monde-commun/README.md`
- `packs/pack-010-le-monde-commun/assets/images/originals/*.png`
- `packs/pack-010-le-monde-commun/assets/images/*.webp`
- `tests/integration/narrative-pack/pack-010.test.mjs`
- `reports/INE-030_PACK_010_CONTACT_SHEET.jpg`
- `reports/INE-030_PACK_010_IMAGE_MAPPING.json`
- `reports/INE-030_PACK_010_LE_MONDE_COMMUN_REPORT.md`

## Fichiers modifiés

- `packs/index.json`
- `tests/e2e/player.test.mjs`
- `tests/integration/editorial-model/editorial-model.test.mjs`
- `tests/integration/narrative-pack/pack-004.test.mjs`
- `tests/integration/narrative-pack/pack-005.test.mjs`
- `tests/integration/narrative-pack/pack-006.test.mjs`
- `tests/integration/narrative-pack/pack-007.test.mjs`
- `tests/integration/narrative-pack/pack-008.test.mjs`
- `tests/integration/narrative-pack/pack-009.test.mjs`
- `tests/integration/polarity-pack/pack-002.test.mjs`

## Choix techniques

- Le PACK-010 est inscrit dans `packs/index.json` après PACK-009.
- Le manifeste déclare `layout: "image-then-text"` pour réutiliser le mode existant.
- Chaque scène référence un WebP et déclare `imageDisplayMode: "contain"` afin de préserver les visuels éditorialisés.
- Aucun CSS spécifique n’a été ajouté : le comportement générique du mode `image-then-text` suffit pour afficher l’image entière en phase Contempler et le texte complet en phase Lire.
- Aucun changement direct n’a été apporté aux PACK-001 à PACK-009.

## Validations responsive

Le scénario e2e réel avec Chrome vérifie notamment :

- bibliothèque avec 10 œuvres ;
- accès direct à `/oeuvres/le-monde-commun/` ;
- phase `Contempler` de la première scène ;
- bouton `Lire` ;
- passage à la phase `Lire` ;
- navigation complète jusqu’à `Scène 12 / 12 — Lire` ;
- retour bibliothèque ;
- absence d’overflow horizontal ;
- contrôles dans le viewport mobile.

Les vérifications couvrent le comportement mobile via émulation 390 px dans le scénario navigateur. Le mode `image-then-text` préserve également la lisibilité tablette/desktop en séparant contemplation et lecture.

## Statut des tests

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK
- `npm.cmd run test:integration` : OK
- `npm.cmd run test:coverage` : OK
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK, avec e2e sauté car Chrome n’est pas détecté automatiquement sans `CHROME_PATH`.
- `$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'; npm.cmd run test:e2e` : OK

## Non-régression

- Les routes existantes ne sont pas modifiées.
- Les contenus des PACK-001 à PACK-009 ne sont pas modifiés.
- Le mode `image-then-text` n’a pas été changé ; il est uniquement réutilisé pour PACK-010.
- La bibliothèque passe de 9 à 10 œuvres, avec Le Monde commun en dixième position.

## Limites éventuelles

Aucune limite bloquante identifiée. Le test `test:ci` conserve son comportement actuel : il saute l’e2e si Chrome n’est pas auto-détecté. L’e2e réel a été lancé séparément avec `CHROME_PATH` explicite et passe.

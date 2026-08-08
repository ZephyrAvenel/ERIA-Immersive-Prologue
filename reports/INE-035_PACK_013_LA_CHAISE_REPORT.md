# INE-035 - PACK-013 La Chaise

## 1. Resume

PACK-013 `La Chaise` a ete integre comme pack narratif autonome, accessible via `/oeuvres/la-chaise/`, avec 15 entrees en mode `image-then-text`.

## 2. Architecture identifiee

- Registre : `packs/index.json`.
- Packs narratifs : dossiers `packs/pack-XXX-*` avec `pack.json`, `README.md`, `assets/images/` et `assets/images/originals/`.
- Player : route canonique derivee du slug du registre, rendu via `layout: image-then-text`.
- Reference utilisee : PACK-012 pour le parcours Contempler/Lire et PACK-009/010/011 pour les tests image-then-text.

## 3. Images

- ZIP source : `C:/Users/LeoBe/OneDrive/Bureau/Pack narratif 013 _ La chaise.zip`.
- Nombre de PNG detectes : 15.
- Chemins dangereux detectes : aucun.
- PNG originaux conserves : 15 fichiers, total approximatif 36,319,979 octets.
- WebP generes : 15 fichiers, total approximatif 3,680,592 octets.
- Planche source : `reports/INE-035_PACK_013_SOURCE_CONTACT_SHEET.jpg`.
- Planche canonique : `reports/INE-035_PACK_013_CANONICAL_CONTACT_SHEET.jpg`.

## 4. Mapping final

| Etape | Titre | Source ZIP | PNG original | WebP utilise |
| --- | --- | --- | --- | --- |
| 00 | La Chaise | `file_000000001d2081f489da075c82c0e805.png` | `00-couverture-la-chaise.png` | `00-couverture-la-chaise.webp` |
| 01 | La Table — Entrer | `file_00000000181c81f483e8aea3d26750a7.png` | `01-la-table.png` | `01-la-table.webp` |
| 02 | Une place parmi les autres — Appartenir | `file_00000000c41881f4adbc4aef7901a448.png` | `02-une-place-parmi-les-autres.png` | `02-une-place-parmi-les-autres.webp` |
| 03 | La chaise que l’on nous donne — Recevoir | `file_0000000023b881f499cfac90a96c0db7.png` | `03-la-chaise-que-l-on-nous-donne.png` | `03-la-chaise-que-l-on-nous-donne.webp` |
| 04 | Rester debout — Ressentir | `file_0000000013ec81f4af0b4ac9f5d2fa67.png` | `04-rester-debout.png` | `04-rester-debout.webp` |
| 05 | Demander une chaise — Exprimer | `file_0000000060bc81f4ba02a311b278dd9a.png` | `05-demander-une-chaise.png` | `05-demander-une-chaise.webp` |
| 06 | La chaise assignée — Voir | `file_0000000033d081f4a83fd1859fea02b5.png` | `06-la-chaise-assignee.png` | `06-la-chaise-assignee.webp` |
| 07 | Se rétrécir — Discerner | `file_0000000016dc81f49062ddd30179a839.png` | `07-se-retrecir.png` | `07-se-retrecir.webp` |
| 08 | Voir le dessous — Observer | `file_00000000ae9c81f497b7f44e7503e3b6.png` | `08-voir-le-dessous.png` | `08-voir-le-dessous.webp` |
| 09 | La chaise vide — Traverser | `file_000000007bc481f4924791a0e562079d.png` | `09-la-chaise-vide.png` | `09-la-chaise-vide.webp` |
| 10 | Se lever — Choisir | `file_00000000e7d481f480a08b7740c0c0e0.png` | `10-se-lever.png` | `10-se-lever.webp` |
| 11 | Entre les tables — Traverser le vide | `file_000000000c5881f48313c508f6e837a9.png` | `11-entre-les-tables.png` | `11-entre-les-tables.webp` |
| 12 | La table réciproque — Rencontrer | `chaise12.png` | `12-la-table-reciproque.png` | `12-la-table-reciproque.webp` |
| 13 | Construire la table — Co-créer | `chaise13.png` | `13-construire-la-table.png` | `13-construire-la-table.webp` |
| 14 | La chaise libre — Habiter | `chaise14.png` | `14-la-chaise-libre.png` | `14-la-chaise-libre.webp` |

## 5. Confirmation des images 12, 13 et 14

- Image 12 validee : exterieur lumineux sous un grand arbre, table reciproque, personnes ouvrant leur posture et deplacant des chaises.
- Image 13 validee : construction collective d une grande table en bois avec planches et outils.
- Image 14 validee : table achevee sous l arbre, groupe assis en arriere-plan, grande chaise vide au premier plan.

## 6. Contempler / Lire

- `layout: image-then-text` active pour PACK-013.
- `imageDisplayMode: contain` conserve sur les 15 entrees.
- La couverture est la scene 1 / 15 du parcours, coherente avec les packs image-then-text existants.
- Les textes Lire proviennent du fichier de mission UTF-8 ; une erreur initiale d extraction a ete corrigee avant validation.

## 7. Lien Le Dessous

- Scene concernee : 08 - Voir le dessous - Observer.
- URL : `https://zephyr-avenel.blogspot.com/2026/08/le-dessous.html`.
- Integration : champ optionnel `links` ajoute au contrat narratif, valide par schema/runtime, rendu comme lien externe securise.
- Le lien s ouvre en nouvel onglet et ne remplace pas la navigation interne `Suivant`.

## 8. Bibliotheque et FR/EN

- PACK-013 ajoute apres PACK-012 dans `packs/index.json`.
- La bibliotheque affiche maintenant 13 oeuvres.
- Aucun contenu anglais invente ; le contenu source canonique reste francais, comme les packs narratifs recents.

## 9. Tests et validations

- `npm.cmd run typecheck` : OK.
- `npm.cmd run test:unit` : OK, 68/68.
- `npm.cmd run test:integration` : OK, 56/56.
- `npm.cmd run test:coverage` : OK, 124/124, couverture globale 90.19% lignes / 82.97% branches / 92.39% fonctions.
- `npm.cmd run build` : OK.
- `npm.cmd run test:ci` : OK ; e2e saute dans ce script car Chrome n est pas detecte sans `CHROME_PATH`.
- `$env:CHROME_PATH=...; npm.cmd run test:e2e` : OK, 1/1, parcours reel Chrome valide.

## 10. Perimetre

- Aucun asset des packs precedents n a ete remplace.
- Aucun contenu editorial des PACK-001 a PACK-012 n a ete modifie.
- Les ajustements mutualises sont limites au support optionnel des liens de scene, necessaire au bouton Le Dessous.

## 11. Limites / points de vigilance

- La branche PACK-013 a ete creee au-dessus de la branche PACK-012 locale afin de preserver l ordre narratif deja present dans le workspace. Si PACK-012 n est pas encore fusionne dans `main`, la PR PACK-013 doit etre ouverte ou fusionnee apres PACK-012.
- Le connecteur PR GitHub n etait pas encore verifie au moment de ce rapport ; la creation PR sera tentee apres commit/push si l outil est disponible.

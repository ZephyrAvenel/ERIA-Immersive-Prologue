# Rapport INE-025 — Réagencement mobile du PACK-006

## Résumé

La mission améliore le rendu mobile/tablette de **PACK-006 — La Métamorphose** sans modifier les images, les textes narratifs, les routes, le registre ni les autres packs.

## Diagnostic

Le rendu mobile initial du PACK-006 présentait :

- trop d’espace vertical entre l’en-tête du player et l’image ;
- des images trop petites pour des visuels panoramiques contenant du texte intégré ;
- des titres et paragraphes plus petits que les règles mobiles globales ;
- une scène trop “aérée”, donnant l’impression que l’image et le texte n’appartenaient pas au même bloc narratif.

## Cause CSS identifiée

Le bloc responsive dédié à :

```css
.player[data-pack-id="pack-006"]
```

reprenait presque exactement les valeurs de PACK-005 :

- image limitée à `clamp(11rem, 32dvh, 18rem)` ;
- titre limité à `clamp(1.65rem, 6.6vw, 2.45rem)` ;
- texte limité à `clamp(0.96rem, 3.65vw, 1.1rem)` ;
- gaps et padding encore trop généreux au regard du format panoramique des images PACK-006.

Ces valeurs étaient adaptées à PACK-005, mais trop prudentes pour PACK-006, dont les images sont larges et typographiques.

## Correction appliquée

Correction strictement ciblée sur PACK-006 :

- réduction du padding vertical du player mobile ;
- réduction des gaps entre en-tête, image, titre et texte ;
- agrandissement de la zone image ;
- maintien de `object-fit: contain` pour éviter tout rognage ;
- augmentation légère du titre de scène ;
- augmentation légère du texte narratif ;
- largeur utile du texte portée à `72ch` ;
- boutons mobiles conservés en colonne.

Valeurs principales retenues :

```css
.player[data-pack-id="pack-006"] {
  padding-block: clamp(0.55rem, 1.6dvh, 1rem);
  gap: clamp(0.35rem, 1dvh, 0.65rem);
}

.player[data-pack-id="pack-006"] .scene__image {
  height: clamp(13.5rem, 39dvh, 22rem);
  object-fit: contain;
}

.player[data-pack-id="pack-006"] .scene__title {
  font-size: clamp(2.05rem, 8.4vw, 3rem);
  line-height: 0.98;
}

.player[data-pack-id="pack-006"] .scene__text {
  font-size: clamp(1.06rem, 4.05vw, 1.22rem);
  line-height: 1.46;
}
```

## Fichiers modifiés

- `apps/player/src/styles.css`
- `tests/e2e/player.test.mjs`
- `reports/INE-025_PACK_006_MOBILE_LAYOUT_READABILITY_REPORT.md`

## Limitation du périmètre

La correction est limitée à `.player[data-pack-id="pack-006"]`.

Aucun changement sur :

- PACK-001 ;
- PACK-002 ;
- PACK-003 ;
- PACK-004 ;
- PACK-005 ;
- les images ;
- les textes narratifs ;
- les routes ;
- le registre ;
- l’architecture globale.

## Vérifications responsive

Le scénario e2e vérifie que PACK-006 :

- reste accessible via `/oeuvres/la-metamorphose/` ;
- conserve 13 scènes ;
- affiche “Les regards qui nous définissent” ;
- n’a pas d’overflow horizontal ;
- garde des contrôles dans le viewport ;
- utilise `object-fit: contain` ;
- affiche des images plus grandes sur mobile ;
- garde les boutons finaux empilés et accessibles.

Largeurs demandées à vérifier visuellement : 360 px, 390 px, 430 px, tablette 768 px et desktop.

## Tests

Résultats :

- `npm.cmd run typecheck` : OK ;
- `npm.cmd run test:unit` : OK — 64 tests ;
- `npm.cmd run test:integration` : OK — 27 tests ;
- `npm.cmd run test:coverage` : OK — 91 tests, couverture globale 90,70 % lignes / 83,66 % branches / 92,22 % fonctions ;
- `npm.cmd run build` : OK hors sandbox Windows ;
- `npm.cmd run test:ci` : OK hors sandbox Windows, avec e2e sauté proprement par défaut faute de `CHROME_PATH` ;
- `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm.cmd run test:e2e` : OK — scénario navigateur réel exécuté, 1 test passé.

Note : le build et `test:ci` sont lancés hors sandbox dans cet environnement local, car Vite/esbuild rencontre sinon un blocage Windows “Access is denied” en lisant la configuration.

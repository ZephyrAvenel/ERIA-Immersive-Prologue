# INE-023 — Ajout de l’image “Les attentes invisibles” au PACK-005

## Résumé

La mission INE-023 ajoute l’image dédiée à la scène 2 du PACK-005 — “Les récits qui révèlent… ou qui enferment”.

La scène “Les attentes invisibles”, conservée sans image lors de INE-022 faute de visuel dédié, dispose désormais de son illustration officielle.

## Image ajoutée

Image source fournie avec la mission :

- titre intégré : “LES ATTENTES INVISIBLES” ;
- texte intégré : “Un sourire. Un silence. Une seconde chance. Parfois, tout commence là.” ;
- composition : un jeune personnage au centre, entre un climat relationnel d’écoute/confiance et un climat d’impatience/jugement.

La source jointe était au format JPEG. Elle a été convertie en PNG dans les originaux du pack afin de respecter la convention existante du PACK-005.

## Fichiers ajoutés

- `packs/pack-005-recits-qui-revelent-ou-enferment/assets/images/originals/02-les-attentes-invisibles.png`
- `packs/pack-005-recits-qui-revelent-ou-enferment/assets/images/02-les-attentes-invisibles.webp`

Dimensions :

- PNG : 1280 × 960, 1 524 714 octets
- WebP : 1280 × 960, 134 330 octets

Aucun recadrage destructif n’a été appliqué.

## Scène mise à jour

Dans `pack.json`, la scène suivante a été mise à jour :

```json
{
  "id": "scene-02",
  "title": "Les attentes invisibles",
  "image": "assets/images/02-les-attentes-invisibles.webp"
}
```

Un texte alternatif dédié a également été ajouté.

## Fichiers modifiés

- `packs/pack-005-recits-qui-revelent-ou-enferment/pack.json`
- `packs/pack-005-recits-qui-revelent-ou-enferment/README.md`
- `tests/integration/narrative-pack/pack-005.test.mjs`
- `tests/e2e/player.test.mjs`

## Fichiers ajoutés

- `packs/pack-005-recits-qui-revelent-ou-enferment/assets/images/originals/02-les-attentes-invisibles.png`
- `packs/pack-005-recits-qui-revelent-ou-enferment/assets/images/02-les-attentes-invisibles.webp`
- `reports/INE-023_PACK_005_ATTENTES_INVISIBLES_IMAGE_REPORT.md`

## Validation attendue

- PACK-005 conserve 12 étapes.
- La scène “Les attentes invisibles” possède maintenant une image.
- Le chemin image pointe vers `02-les-attentes-invisibles.webp`.
- La bibliothèque conserve 5 œuvres.
- Les packs 001 à 004 restent inchangés.

## Validations effectuées

- `npm.cmd run typecheck` : OK
- `npm.cmd run test:unit` : OK, 64 tests
- `npm.cmd run test:integration` : OK, 23 tests
- `npm.cmd run test:coverage` : OK, 87 tests, couverture globale 90,70 % lignes / 83,66 % branches / 92,22 % fonctions
- `npm.cmd run build` : OK
- `npm.cmd run test:ci` : OK

Le test e2e local inclus dans `test:ci` a été sauté proprement car Chrome n’est pas détecté par défaut sans `CHROME_PATH` dans cet environnement.

## Vérification responsive

Le rendu s’appuie sur les règles CSS ciblées du PACK-005 :

- `object-fit: contain` sur mobile/tablette ;
- absence de rognage destructif ;
- boutons empilés sur mobile ;
- texte narratif conservé.

L’image étant horizontale, le rendu mobile peut présenter un effet letterbox naturel. Ce choix est préférable à un recadrage qui couperait le titre ou les éléments latéraux intégrés.

Les tests e2e ont été adaptés pour vérifier que la scène 3 / 12, correspondant à “Les attentes invisibles”, charge maintenant bien `02-les-attentes-invisibles.webp`.

## Limites

Aucune limite fonctionnelle identifiée.

La seule nuance technique est que la source fournie était un JPEG, alors que la convention du pack conserve les originaux en PNG. Le fichier officiel conservé dans le dépôt est donc un PNG généré depuis l’image jointe, sans modification éditoriale ni recadrage.

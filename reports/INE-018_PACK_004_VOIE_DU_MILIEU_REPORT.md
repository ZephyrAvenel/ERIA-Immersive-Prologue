# INE-018 — Ajout du PACK-004 La Voie du Milieu

## Résumé

Ajout d’une quatrième œuvre immersive autonome à INE :

`PACK-004 — La Voie du Milieu`

Le pack est intégré comme un `ine-narrative-pack` standard, afin de réutiliser le moteur narratif existant sans créer de composant spécifique ni modifier l’architecture.

Route publique prévue :

```text
/oeuvres/voie-du-milieu/
```

## Fichiers créés

- `packs/pack-004-voie-du-milieu/pack.json`
- `packs/pack-004-voie-du-milieu/README.md`
- `packs/pack-004-voie-du-milieu/assets/images/*.webp`
- `packs/pack-004-voie-du-milieu/assets/images/originals/*.png`
- `tests/integration/narrative-pack/pack-004.test.mjs`
- `reports/INE-018_PACK_004_VOIE_DU_MILIEU_REPORT.md`

## Fichiers modifiés

- `packs/index.json`
- `tests/integration/polarity-pack/pack-002.test.mjs`

## Images intégrées

Le ZIP fourni contenait 11 PNG, sans chemin dangereux.

Les PNG originaux ont été conservés dans :

```text
packs/pack-004-voie-du-milieu/assets/images/originals/
```

Les WebP optimisés utilisés par le moteur ont été placés dans :

```text
packs/pack-004-voie-du-milieu/assets/images/
```

Poids total PNG : 30 435 362 octets  
Poids total WebP : 3 332 932 octets

Toutes les images mesurent `1536 × 1024`.

## Mapping des images

| Nom original | Nom officiel |
| --- | --- |
| `file_00000000254c81f4a639860b74c46ca3.png` | `00-couverture-voie-du-milieu.png` |
| `file_00000000945c8246875dba2235bf15d4.png` | `01-le-seuil.png` |
| `file_00000000959882438bc19616310665ee.png` | `02-monde-des-oppositions.png` |
| `file_000000001a3882469094d133f03d4cd3.png` | `03-recits-qui-enferment.png` |
| `file_000000008ce08246be5a7008ccb67191.png` | `04-entre-deux-recits-un-choix.png` |
| `file_00000000c350824394670fb43ebef511.png` | `05-la-voie-du-milieu.png` |
| `file_0000000073bc8246bb89fee68499b6ad.png` | `06-presence-au-dela-des-recits.png` |
| `file_0000000057288243afea20560f0fc57f.png` | `07-le-choix-qui-faconne-le-monde.png` |
| `file_0000000048c08243b581a7da518418f9.png` | `08-au-seuil-dun-monde-vivant.png` |
| `file_000000005f608243bbfe68bb8404551e.png` | `09-et-demain.png` |
| `file_0000000009c88246b42355c780414d51.png` | `10-les-recits-vivants-continuent.png` |

## Mapping final des scènes

1. `scene-00` — La Voie du Milieu
2. `scene-01` — Le seuil
3. `scene-02` — Le monde des oppositions
4. `scene-03` — Les récits qui enferment
5. `scene-04` — Entre deux récits, un choix ?
6. `scene-05` — La voie du milieu
7. `scene-06` — La présence au-delà des récits
8. `scene-07` — Le choix qui façonne le monde
9. `scene-08` — Au seuil d’un monde vivant
10. `scene-09` — Et demain ?
11. `scene-10` — Les récits vivants continuent…

## Choix techniques

- Le pack utilise le format `ine-narrative-pack`.
- Aucun nouveau renderer n’a été créé.
- La couverture est la scène d’entrée (`scene-00`) afin d’afficher l’image officielle sans modifier le prologue de PACK-001.
- Les scènes sont intégrées dans `pack.json`, conformément au format narratif déjà utilisé par INE.
- L’ordre dans la bibliothèque est contrôlé par l’ordre du registre `packs/index.json`.

## Vérifications visuelles

Vérification effectuée sur build production local :

- bibliothèque avec 4 œuvres : OK ;
- PACK-004 affiché en quatrième position : OK ;
- couverture PACK-004 chargée dans la bibliothèque : OK ;
- route `/oeuvres/voie-du-milieu/` : OK ;
- première scène chargée : OK ;
- navigation jusqu’à la scène 11 / 11 : OK ;
- image finale chargée : OK ;
- lien de continuation vers `/bibliotheque/` : OK ;
- pictogramme bibliothèque présent : OK ;
- pas de débordement horizontal sur 360, 390, 430, 768 et 1280 px : OK.

## Tests et validations

- `npm run typecheck` : OK
- `npm run test:unit` : OK — 64 tests
- `npm run test:integration` : OK — 19 tests
- `npm run test:coverage` : OK — 83 tests, seuils respectés
- `npm run build` : OK après relance hors sandbox Windows
- `npm run test:e2e` : scénario sauté localement, Chrome non disponible
- Vérification navigateur intégré Codex : OK

## Limites

Le test navigateur automatisé complet n’a pas pu être exécuté localement car aucun binaire Chrome n’est disponible dans cet environnement. Une vérification réelle a été effectuée avec le navigateur intégré Codex sur le build de production local.

## Recommandations

Si une prochaine mission souhaite personnaliser les libellés de navigation par pack narratif, il faudra étendre le format `ine-narrative-pack` de manière générique. Cette mission n’a pas introduit cette évolution afin de respecter la contrainte de ne pas modifier l’architecture.

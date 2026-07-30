# INE-007 — Intégration des illustrations définitives du PACK-002

## Résultat

Les douze illustrations officielles fournies dans
`Pack narratif Polarités.zip` remplacent les placeholders du PACK-002. PACK-001
et son dossier `examples/demo-pack/` sont inchangés.

## Correspondance appliquée

| Rôle officiel | Fichier de production |
|---|---|
| Couverture avec les dix stèles | `00-couverture.webp` |
| Pont entre deux falaises | `01-affirmation-don.webp` |
| Grand arbre relié à la forêt | `02-autonomie-appartenance.webp` |
| Arbre entre nuit et jour | `03-memoire-avenir.webp` |
| Deux oiseaux dans le ciel | `04-proximite-liberte.webp` |
| Chemin traversant les saisons | `05-identite-transformation.webp` |
| Lac avec les ondes concentriques | `06-parole-silence.webp` |
| Deux lanternes sur le chemin | `07-conviction-dialogue.webp` |
| Porte ouverte vers la lumière | `08-protection-ouverture.webp` |
| Grand arbre dominant l'horizon | `09-racines-horizons.webp` |
| Pont de pierre sur la rivière | `10-fidelite-changement.webp` |
| « Le récit continue avec toi » | `11-cloture.webp` |

## Originaux et optimisation

Les douze PNG fournis sont copiés byte pour byte sous leur nom officiel dans
`assets/images/originals/`. Aucun original n'a été écrasé ou recompressé.

Les douze dérivés WebP :

- conservent les dimensions sources, soit `1536 × 1024` pour les paysages et
  `1024 × 1536` pour la couverture et la clôture ;
- utilisent une qualité élevée sans redimensionnement ;
- totalisent `5 541 058` octets contre `34 160 403` octets pour les PNG ;
- pèsent chacun moins de `700 000` octets.

## Manifeste et parcours

Le manifeste déclare désormais :

- `coverImage` et son alternative ;
- `closingImage` et son alternative ;
- les libellés de passage vers la clôture et de retour ;
- la couverture comme fallback officiel.

La couverture accompagne le seuil du PACK-002. Après la dixième polarité,
« Achever le parcours » affiche l'image de clôture, puis permet de revenir au
parcours. Ces données restent pilotées par le manifeste.

Les dix JSON référencent leurs WebP officiels. Aucun chemin SVG ne subsiste.

## Nettoyage

- dix placeholders SVG supprimés ;
- ancien fallback SVG supprimé ;
- aucun SVG résiduel dans `assets/images/` ;
- douze WebP de production, tous référencés par le manifeste ou un JSON ;
- douze PNG originaux conservés intentionnellement ;
- aucune ressource graphique orpheline.

## Documentation

`docs/PACK-002-POLARITES-VIVANTES.md`, le README du pack et le rapport INE-006
décrivent maintenant :

- les illustrations définitives PNG/WebP ;
- la convention `00` à `11` ;
- le rôle de la couverture et de la clôture ;
- la conservation des originaux ;
- la présence intentionnelle de texte intégré sur les deux compositions de
  seuil.

## Vérifications

```text
typecheck : succès
tests unitaires : 54/54
tests d'intégration : 9/9
tests avec couverture : 63/63
couverture : lignes 90,27 %, branches 83,69 %, fonctions 91,25 %
build de production : succès
scénario Chrome réel PACK-001 + PACK-002 : 1/1
originaux byte-identiques : 12/12
dimensions WebP conservées : 12/12
git diff --check : succès
diff PACK-001 (examples/demo-pack) : vide
```

Le scénario Chrome vérifie le parcours PACK-001 historique, la couverture du
PACK-002, ses dix polarités, l'absence de débordement horizontal, la clôture et
le retour au parcours.

## Publication Git

- commit d'intégration : `c01eb29a976d5eced571653296876fd51e6d0627`
- branche distante : `agent/ine-007-final-illustrations`
- push GitHub : confirmé le 30 juillet 2026

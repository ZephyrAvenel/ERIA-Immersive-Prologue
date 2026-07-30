# Rapport de mission INE-011A

## Conclusion

La divergence provenait exclusivement de l’état Git : la Pull Request #2 de la
mission INE-011 était encore ouverte en brouillon et n’avait jamais été
fusionnée dans `main`.

Le rapport INE-011 décrivait correctement le comportement de la branche
`agent/ine-011-prologue-entry`, mais sa formulation « mission terminée » ne
distinguait pas assez clairement une implémentation poussée et validée d’une
version effectivement fusionnée puis déployée.

La PR #2 a été rendue prête pour revue puis fusionnée. GitHub Pages a construit
et publié le commit de fusion
`8d9fb687003b44284243f5e4a94fd9aae598e93b`. La production correspond désormais
au parcours annoncé.

## État observé avant correction

### Git et Pull Request

- branche INE-011 présente :
  `agent/ine-011-prologue-entry` ;
- commit d’implémentation présent :
  `4ae36fc201f6942e20fef14a616826db0b9b01e9` ;
- tête finale de branche :
  `d1f94404d28f9d3244a3618b414e702c77c1374c` ;
- Pull Request #2 ouverte, fusionnable et encore en brouillon ;
- contrôle GitHub de la branche réussi ;
- `main` restait au commit Cycle I
  `17f77dc626257fad3b78528996b7ae680fda42cc`.

### Registre

Le registre de `main` ne possédait pas la propriété `home`. Celui de la branche
INE-011 déclarait :

```json
{
  "home": "les-gardiens-des-recits-vivants"
}
```

Le Player et le build utilisaient bien cette propriété sur la branche pour
résoudre la racine et produire la page d’accueil.

### GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` publie uniquement :

- après un push sur `main` ;
- ou après un déclenchement manuel.

Une branche ou une Pull Request validée ne peut donc pas modifier la production
tant qu’elle n’est pas fusionnée.

Avant correction, les contrôles directs de production donnaient :

| URL | Résultat |
|---|---|
| `/` | 200 — Bibliothèque des œuvres immersives |
| `/bibliotheque/` | 404 |
| `/packs/index.json` | 200 — propriété `home` absente |
| URL des Gardiens | 200 |
| URL de Polarités Vivantes | 200 |

## Cause racine

La chaîne s’était arrêtée entre validation et publication :

```text
Branche INE-011 validée
        ↓
PR #2 ouverte en brouillon
        ✕
main non mis à jour
        ↓
GitHub Pages republie uniquement main
        ↓
Production restée sur le Cycle I
```

Il ne s’agissait ni d’un défaut du registre INE-011, ni d’un problème du
routage, ni d’une modification requise dans Unicorn.

## Correction effectuée

1. vérification de la fusionnabilité de la PR #2 ;
2. vérification de son workflow Build : succès ;
3. passage de la PR de brouillon à prête pour revue ;
4. fusion dans `main` ;
5. déclenchement automatique du workflow GitHub Pages ;
6. suivi du workflow jusqu’à la conclusion `success` ;
7. vérification sans cache des ressources publiées ;
8. validation du comportement final dans un navigateur réel.

Références :

- PR : [#2 — INE-011 — Restaurer le prologue comme porte
  d’entrée](https://github.com/ZephyrAvenel/ERIA-Immersive-Prologue/pull/2) ;
- commit fusionné :
  `8d9fb687003b44284243f5e4a94fd9aae598e93b` ;
- workflow Pages :
  [Deploy GitHub Pages #30538714135](https://github.com/ZephyrAvenel/ERIA-Immersive-Prologue/actions/runs/30538714135).

Aucune modification du moteur n’a été nécessaire.

## Validation de production après correction

### Accueil

`https://zephyravenel.github.io/ERIA-Immersive-Prologue/`

- statut HTTP : 200 ;
- titre de document : `Les Gardiens des Récits Vivants` ;
- seuil visible : `Le Seuil` ;
- lien vers `/bibliotheque/` présent ;
- aucun débordement horizontal.

### Bibliothèque

`https://zephyravenel.github.io/ERIA-Immersive-Prologue/bibliotheque/`

- statut HTTP : 200 ;
- titre visible : `Bibliothèque des œuvres immersives` ;
- carte `Les Gardiens des Récits Vivants` présente ;
- carte `Polarités Vivantes` présente ;
- liens des deux œuvres corrects ;
- aucun débordement horizontal.

### URLs directes

Les routes suivantes répondent et ouvrent l’œuvre attendue :

- `/oeuvres/les-gardiens-des-recits-vivants/` ;
- `/oeuvres/polarites-vivantes/`.

Chaque œuvre conserve un accès vers la bibliothèque.

### Registre publié

`/packs/index.json` répond avec la propriété :

```json
"home": "les-gardiens-des-recits-vivants"
```

### Responsive de Polarités Vivantes

Contrôle réel à 360 × 800 px sur la première polarité :

- trois actions affichées en colonne ;
- largeurs mesurées : 313 px ;
- hauteurs mesurées : 52 à 53,6 px ;
- aucun chevauchement ;
- aucun débordement horizontal.

## Résultat final

Le comportement publié est désormais conforme au rapport INE-011 :

```text
/                         → Les Gardiens des Récits Vivants
/bibliotheque/            → Bibliothèque des œuvres immersives
/oeuvres/<slug>/          → Accès direct à chaque œuvre
```

Le code d’intégration Unicorn existant peut continuer à utiliser la racine. Il
n’a pas besoin d’être modifié.


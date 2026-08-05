# PACK-009 — Trouver sa juste place

Sous-titre : **Habiter sa place sans dominer, sans s’effacer.**

Ce pack est un parcours narratif contemplatif autonome de l’Immersive Narrative Engine. Il explore les rôles reçus, le besoin d’être validé, la juste distance, les gestes quotidiens et les récits vivants qui permettent de devenir présence dans un monde commun.

## Structure

- `pack.json` : manifeste narratif du pack.
- `assets/images/` : images WebP optimisées utilisées par le player.
- `assets/images/originals/` : PNG originaux conservés sans modification.

Le pack contient 11 entrées narratives :

1. Couverture — Trouver sa juste place
2. Les rôles que nous recevons
3. Le besoin d’être validé
4. Déposer les personnages
5. La juste distance
6. La place se construit
7. Les gestes qui transforment
8. Habiter un monde commun
9. Réécrire son récit
10. Les récits vivants
11. Devenir présence

## Mode d’affichage

PACK-009 active le layout optionnel :

```json
"layout": "image-then-text"
```

Chaque scène se déploie donc en deux temps :

1. contemplation de l’image complète ;
2. lecture du texte narratif complet.

Ce choix évite de réduire ou de rogner les images fortement éditorialisées, tout en conservant les textes narratifs dans leur intégralité.

## Images

Les images contiennent du texte intégré. Elles doivent rester lisibles et ne doivent pas être recadrées destructivement.

Pour remplacer une image :

1. conserver le PNG original renommé dans `assets/images/originals/` ;
2. générer un WebP optimisé dans `assets/images/` ;
3. mettre à jour uniquement le chemin de l’image dans `pack.json` si le nom change.

## Indépendance

Le pack ne dépend d’aucun autre pack narratif. Il est découvert par le registre `packs/index.json` et interprété par le moteur INE.

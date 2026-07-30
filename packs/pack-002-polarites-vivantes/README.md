# PACK-002 — Polarités Vivantes

Pack contemplatif indépendant pour l'Immersive Narrative Engine.

- `pack.json` décrit le pack et référence ses dix étapes.
- `polarities/` contient exclusivement les contenus JSON.
- `assets/images/` contient les douze WebP officiels destinés au moteur.
- `assets/images/originals/` conserve les douze PNG fournis sans modification.
- `assets/audio/` est réservé aux futurs paysages sonores.

Pour lancer ce pack seul, définir dans `apps/player/public/player.config.json` :

```json
{ "packUrl": "packs/pack-002-polarites-vivantes/pack.json" }
```

Le lien d'article actuellement utilisé est la racine publique du blog de
l'auteur. Il pourra être remplacé par l'URL canonique de l'article sans modifier
le moteur.

La convention d'illustration va de `00-couverture` à `11-cloture`. Les deux
compositions de seuil peuvent contenir du texte intégré ; les textes des dix
polarités restent exclusivement dans les JSON.

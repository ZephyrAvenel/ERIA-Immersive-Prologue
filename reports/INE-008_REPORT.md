# Rapport de mission INE-008

## Résultat

INE dispose désormais d’une architecture de diffusion statique où chaque œuvre peut avoir sa propre URL publique tout en utilisant un unique moteur. La recommandation a été matérialisée par un prototype intégré et testable.

Solution retenue :

```text
/                                  bibliothèque
/oeuvres/les-gardiens-des-recits-vivants/
/oeuvres/polarites-vivantes/
```

Les pages d’œuvre sont générées au build. Elles contiennent leurs métadonnées SEO et sociales, puis chargent le même bundle INE.

## Architectures étudiées

### Option A — URL dédiée par pack

Avantages : URL partageable, séparation visible des œuvres, accès direct.
Limites : GitHub Pages exige de vrais fichiers ; des pages maintenues manuellement dupliqueraient le shell, la configuration et les risques d’erreur. Les identifiants `pack-001` sont en outre peu éditoriaux.

### Option B — paramètre d’URL

Avantages : aucune génération de route, très pratique en développement.
Limites : URL technique, faible indépendance perçue, une seule page et un seul jeu de métadonnées pour les moteurs de recherche et les réseaux sociaux.

### Option C — routes éditoriales statiques générées

Avantages : URLs lisibles, accès direct natif sur GitHub Pages, métadonnées par œuvre, un seul bundle, aucune copie manuelle, ajout piloté par les données.
Coût : une petite étape de génération et la gestion explicite des slugs.

L’option C est retenue. Le paramètre de l’option B est conservé uniquement comme mécanisme de prévisualisation.

## Registre

L’ancien tableau `packs/index.json` répétait le titre, le type et le format. Cette duplication pouvait diverger des manifestes.

Le registre versionné contient maintenant uniquement :

- l’identifiant vérifié contre le manifeste ;
- le slug public ;
- le chemin du manifeste.

Une découverte automatique des dossiers dans le navigateur n’est pas possible sur un hébergement statique. Le registre explicite est donc suffisant et plus robuste. La découverte par scan au build pourra être envisagée après normalisation de l’emplacement de tous les packs.

## Prototype réalisé

- bibliothèque responsive alimentée par le registre et les manifestes ;
- cartes sémantiques avec couverture, titre, sous-titre, description et lien accessible ;
- routes directes `/oeuvres/<slug>/` ;
- sélection du pack par slug sans contenu métier dans le moteur ;
- génération de vrais `index.html` pour GitHub Pages ;
- `title`, description, canonical, Open Graph et carte Twitter propres à chaque œuvre ;
- maintien du mode de prévisualisation `?pack=…` ;
- registre validé, identifiants et slugs uniques ;
- contrat commun de catalogue ajouté aux manifestes ;
- aucun paquet ni service supplémentaire.

## Impacts techniques

Les manifestes deviennent la source unique des informations de catalogue. PACK-001 reçoit les champs éditoriaux communs et PACK-002 une description. Le schéma et le validateur narratifs acceptent ces métadonnées génériques ; le chargeur contemplatif exige également sa description.

Le moteur continue de ne contenir aucun texte ou média propre à une œuvre. Les libellés génériques de bibliothèque appartiennent à la localisation de l’interface.

Le build échoue si une entrée du registre pointe vers un manifeste absent ou incohérent. Ce choix empêche une publication contenant des liens morts.

## Indépendance

- PACK-001 et PACK-002 ne se référencent pas.
- Chaque route résout uniquement son entrée et son manifeste.
- Retirer un pack exige de retirer son entrée du registre ; aucun code moteur ne change.
- Le bundle partagé interprète les formats, pas les œuvres.

## Validation

Les vérifications couvrent :

- validation et déduplication du registre ;
- extraction des données de bibliothèque depuis les manifestes ;
- résolution des couvertures relativement aux manifestes ;
- rejet d’une incohérence entre registre et manifeste ;
- conservation des validations des deux formats de pack ;
- génération des pages statiques et des métadonnées ;
- accès direct aux deux œuvres ;
- bibliothèque, navigation clavier, textes alternatifs et responsive ;
- build de production et compatibilité GitHub Pages.

Résultats :

- typecheck : réussi ;
- tests unitaires : 57/57 réussis ;
- tests d’intégration : 9/9 réussis ;
- couverture : 66/66 tests réussis, 90,17 % lignes, 83,19 % branches, 91,25 % fonctions ;
- build de production : réussi, deux pages d’œuvre générées ;
- scénario Chrome réel : 1/1 réussi, incluant bibliothèque, accès direct aux deux packs, navigation, responsive, focus, alternatives textuelles et absence d’erreurs réseau.

Le bundle JavaScript de production reste unique (environ 33,2 kB brut, 10,1 kB gzip) et aucune dépendance n’a été ajoutée.

## Perspectives

La même source peut générer ultérieurement un sitemap, un flux public, des pages de prévisualisation sociale ou un sélecteur enrichi. Aucun de ces ajouts ne nécessite de déplacer le contenu dans le moteur.

La décision complète et le workflow sont documentés dans `docs/INE-DISTRIBUTION-ARCHITECTURE.md`.

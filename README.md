# Atelier Électricité

Application web responsive de révision des calculs, équations et unités électriques. Les réponses sont saisies librement, sans QCM.

## Parcours

1. L’accueil présente l’espace de révision et la dernière série terminée sur cet appareil.
2. Le menu permet de choisir **Calculs appliqués** ou **Équations & unités**, puis un thème précis ou tous les thèmes.
3. Une série comporte dix questions, avec validation au clavier, correction immédiate et bilan exportable en PDF.

## Thèmes

- Loi d’Ohm
- Charge électrique : coulombs, Ah, minutes, heures, capacité et autonomie quotidienne
- Puissance électrique
- Loi de Pouillet : bobines, fils ronds, lignes bifilaires, bandes rectangulaires, résistivité et changement de matériau
- Section ronde : rayon, diamètre et surface
- Résistances en série : équivalente, courant commun, répartition des tensions, lampes et résistance additionnelle de voltmètre
- Résistances en parallèle : deux à quatre résistances, éléments identiques, courants de branche, branche ajoutée et shunt d’ampèremètre
- Circuits mixtes : associations série/parallèle et valeurs manquantes, dans un énoncé unique avec schéma et résolution en cascade
- Chute de tension : résistance aller et retour, tension du récepteur ou du générateur, chute relative, section théorique et densité de courant

## Exercices du même genre qu’au cours

Les calculs appliqués proposent **56 modèles d’énoncés**, avec des données renouvelées. Les situations reprennent les types de problèmes des feuilles scolaires : lampes, batteries, bobines, appareils de mesure, conducteurs et réseaux de résistances. La puissance et la section ronde restent disponibles en complément. Les énoncés sont rédigés pour l’application ; le scan scolaire n’est pas distribué.

Chaque thème utilise un jeu de modèles mélangé : tous les modèles du thème sont parcourus avant de recommencer. En « Tous les thèmes », chaque catégorie apparaît avant le renouvellement du jeu. Les problèmes complexes se résolvent en plusieurs étapes, avec l’unité indiquée pour chaque réponse.

Les exercices distinguent la distance d’un trajet de la longueur totale d’une ligne bifilaire, et les Ah des coulombs. Les valeurs de résistivité sont fournies. π vient de la calculatrice. Les calculs de section de ligne demandent une valeur théorique, sans sélection d’une section commerciale. Les appareils de mesure sont idéalisés et l’autonomie d’une batterie suppose une capacité entièrement disponible à courant constant.

## Circuits mixtes en cascade

En **Calculs appliqués**, chaque exercice présente un seul circuit entre A et B, avec une résistance inconnue à retrouver à partir de sa tension et de son courant, ou de sa tension et de sa puissance. Trois ou quatre étapes se suivent : retrouver la résistance, réduire une première association, réutiliser ce résultat dans l’association suivante, jusqu’à **Req**.

Huit modèles sont proposés, dont les quatre montages initiaux : `(R₁ ∥ R₂) + R₃`, `(R₁ + R₂) ∥ R₃`, `((R₁ + R₂) ∥ R₃) + R₄` et `((R₁ ∥ R₂) + R₃) ∥ R₄`. Les nouveaux exercices comportent jusqu’à sept résistances, des courants et tensions à déterminer, une résistance inconnue déduite de courants de branche et un pont à voltmètre idéal entre points milieux. Le symbole `∥` désigne une association en parallèle.

Chaque résultat est corrigé avant de poursuivre. La valeur corrigée, arrondie à la précision demandée (quatre ou six décimales), est explicitement reprise aux étapes qui en dépendent ; une erreur initiale ne bloque donc pas le reste du raisonnement. Un exercice vaut un point, réparti à parts égales entre ses étapes. Les unités changent selon la grandeur demandée. Les réponses et corrections de toutes les étapes figurent dans le PDF.

En **Équations & unités**, les nouveaux thèmes proposent les relations de réduction globales, y compris la recherche d’une résistance en parallèle. Les écritures `R4`, `R₄`, `Req` et `Rt` sont acceptées.

## Réponses et notation

- **Calculs** : saisir le résultat dans l’unité indiquée. Virgule et point décimaux, espaces de groupement et notation scientifique sont acceptés. L’unité peut aussi être écrite après le nombre. La correction accepte l’arrondi à la précision affichée, avec une tolérance d’un demi-pas d’arrondi. Six décimales sont utilisées pour les petits résultats et les problèmes de conducteurs.
- **Équations** : écrire la partie droite, ou l’équation complète avec la grandeur demandée à gauche, puis saisir l’unité. Les écritures `*` / `×`, `/` / `÷`, `^2` / `²`, `sqrt(...)` / `√(...)`, `pi` / `π`, `rho` / `ρ`, `Rt` / `Rₜ`, `R1` / `R₁` sont acceptées. Les boutons de symboles facilitent la saisie sur mobile. Les expressions sont analysées sans `eval` et comparées sur 24 jeux de valeurs indépendantes pour reconnaître les réarrangements usuels. Cette comparaison numérique n’est pas une preuve algébrique générale.
- **Unités** : les écritures `ohm`, `mm2`, `mm^2`, `ohm.mm2/m` sont acceptées, ainsi que les symboles du cours.
- Une bonne réponse numérique vaut **1 point**. En mode équations, la relation et l’unité valent chacune **0,5 point**.
- Les aides sont désactivées par défaut et leur préférence est mémorisée. Dès qu’elles sont affichées pendant une série, le score final est **divisé par deux**, même si elles sont ensuite masquées. Les corrections après réponse restent toujours accessibles.
- Quitter une série en cours demande confirmation dans l’application.

## Interface et fonctionnement hors connexion

Interface claire, bleu nuit et vert désaturé, adaptée aux mobiles et aux ordinateurs. Navigation clavier, libellés de champs, messages de validation et préférence de mouvement réduit sont pris en charge.

L’application reste installable et fonctionne hors connexion après une première ouverture en ligne. Le service worker met en cache les fichiers de l’interface et de l’export PDF. Une nouvelle version s’active après fermeture des anciens onglets de l’application.

Le bilan PDF contient les questions, réponses saisies, corrections et points obtenus. Le partage utilise le menu du téléphone lorsque le partage de fichiers est disponible ; sinon le PDF est téléchargé pour être joint manuellement dans WhatsApp.

## Développement local

L’application utilise HTML, CSS et JavaScript, sans compilation ni dépendance d’exécution.

```sh
python -m http.server 8000
```

Ouvrir `http://localhost:8000`. Le serveur HTTP local permet de tester le service worker, indisponible avec une ouverture directe en `file://`.

Pour les vérifications de parcours, installer Playwright dans un environnement de développement, puis lancer :

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/app.spec.cjs
node tests/school-math.spec.cjs
```

Le premier script démarre son propre serveur, vérifie les saisies, les barèmes, les neuf thèmes, l’export PDF, les formats mobile et ordinateur et le mode hors connexion. Le second vérifie indépendamment les résultats et unités de 5 600 exercices générés, à partir de leurs données affichées. Les variables `PLAYWRIGHT_CHANNEL` et `NODE_PATH` permettent aussi d’utiliser un navigateur et un Playwright déjà installés.

## Application en ligne

https://atelier-electricite.erineu.chatgpt.site

L’hébergement se met à jour séparément du dépôt GitHub.

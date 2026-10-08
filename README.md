# Atelier Électricité

Application web responsive de révision des calculs, équations et unités électriques. Les réponses sont saisies librement, sans QCM.

## Parcours

1. L’accueil présente l’espace de révision et la dernière série terminée sur cet appareil.
2. Le menu permet de choisir **Calculs appliqués** ou **Équations & unités**, puis un thème précis ou tous les thèmes.
3. Une série comporte dix questions, avec validation au clavier, correction immédiate et bilan exportable en PDF.

## Thèmes

- Loi d’Ohm
- Charge électrique
- Puissance électrique
- Loi de Pouillet : résistance, résistivité, longueur et section
- Section ronde : rayon, diamètre et surface
- Résistances en série : total et résistance inconnue

## Réponses et notation

- **Calculs** : saisir le résultat dans l’unité indiquée. Virgule et point décimaux, espaces de groupement et notation scientifique sont acceptés. L’unité peut aussi être écrite après le nombre. La correction accepte l’arrondi à quatre décimales, ou six pour Pouillet, avec une tolérance d’un demi-pas d’arrondi.
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
```

Le script démarre son propre serveur, vérifie les saisies, les barèmes, les thèmes, l’export PDF, les formats mobile et ordinateur et le mode hors connexion. Les variables `PLAYWRIGHT_CHANNEL` et `NODE_PATH` permettent aussi d’utiliser un navigateur et un Playwright déjà installés.

## Application en ligne

https://atelier-electricite.erineu.chatgpt.site

L’hébergement se met à jour séparément du dépôt GitHub.

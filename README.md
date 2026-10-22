# NUBIAA Academia : le questionnaire d'onboarding

**`index.html`** est le site entier : un questionnaire qui se parcourt au scroll.

- **L'ouverture.** L'image naît entre « commence » et « ici. », puis passe en plein écran pour annoncer « Sept questions, deux minutes ».
- **Les 7 questions**, tirées du tunnel du PDF : domaine, profil, lieu, objectif, budget, coordonnées, créneau. Chaque question est une scène épinglée avec :
  - un fond de désert en parallaxe ;
  - un grand numéro ;
  - deux visuels flottants ;
  - un panneau en verre.
- **La page s'arrête à la question en cours.** Répondre ouvre la scène suivante et y emmène la page avec un ressort. La molette ou le doigt reprennent la main à tout moment. On peut remonter changer une réponse : les questions qui en dépendent se réécrivent.
- **La fin** affiche le rendez-vous, les 4 étapes qui suivent, l'export agenda (.ics) et le lien vers le programme.
- **Au clavier**, les touches 1 à 9 répondent à la question affichée.
- **« Autre » à chaque question** ouvre un champ libre, et rien ne part tant que la personne n'a pas écrit. Le récapitulatif garde sa réponse (« Autre : … »). Au créneau, « Aucun de ces créneaux ne me convient » permet de proposer un moment ; Stella le confirme ensuite sur WhatsApp.
- **Le logo en grand** referme le parcours.

**`presentation.html`** présente le programme avec le moteur « Site Immersif », et ses boutons ramènent au questionnaire. Les ajouts sont dans `presentation-extras.js` et `.css`, sans modifier `app.js` :
- **La barre**, la même que celle du questionnaire : logo et nom, partie en cours (« 3 / 8 · Programme »), « S'inscrire », jauge d'avancement.
- **La devise.** Chaque mot passe devant son image, coupée en deux moitiés qui s'écartent et se recollent au scroll, comme les lettres.
- **Les étapes.** Une icône par étape.
- **La fin.** Le grand logo, révélé en rideau.

**Le son** (`sound.js`) : une musique de fond, et un effet sonore par mouvement.

**La musique** est l'instru « Cutthroat » de Syndrome (`audio/musique-fond.mp3`, 2 min 39, réencodée en 112 kb/s avec le volume égalisé). Elle tourne en boucle sous les effets :
- elle passe dans la même chaîne que les effets, à un volume plus bas qu'eux ;
- elle entre en fondu sur 3 secondes, et s'arrête en fondu (touche M) ;
- elle se met en pause quand l'onglet est caché, et reprend au retour.

L'instru est diffusée comme « FREE » beat : en général, c'est gratuit avec crédit, pour un usage non commercial. Avant de lancer des pubs ou de vendre l'accès, vérifier la licence avec le producteur, ou acheter une licence.

**Les effets** : Chaque son part au moment exact où son mouvement démarre, au scroll, dans les deux sens. Ils sont synthétisés, sans fichier audio.

| Mouvement | Son |
|---|---|
| Les images qui s'écartent, les visuels qui flottent | un souffle d'air |
| Une image qui naît entre les mots, un guillemet qui monte | une montée tonale |
| Une image qui passe en plein écran | un souffle profond, puis un impact sourd |
| Un mot qui apparaît | un petit « toc » |
| Une lettre qui s'encre, une réponse qui arrive | un tic de frappe |
| Un ovale, un filet ou une pilule tracés à la main | un grattement de stylo |
| Une tuile du programme qui se pose | un choc mat |
| Un panneau en verre qui apparaît | un léger scintillement |
| Les deux moitiés de la devise qui se recollent ou se séparent | un « clac », ou un glissé |
| Le rideau de lames | un balayage stéréo, de gauche à droite puis retour |
| Le compteur d'étape | un cliquetis mécanique |
| Une phrase qui s'encre | un souffle d'encre |
| Une réponse choisie, la fin, le logo | deux notes, un arpège, une montée avec accord |

**Au chargement, une première question** : « Avec ou sans le son ? » (« Activer le son » ou « Continuer sans le son »).
- Ce clic débloque l'audio, que les navigateurs refusent avant tout geste. Ensuite la page continue ; le questionnaire attend même la réponse pour lancer son ouverture.
- Elle est posée à chaque chargement de page, en style Liquid Glass :
  - le verre réfracte la page derrière lui (sur Chrome et Edge ; ailleurs, un verre flouté) ;
  - un liseré de lumière borde la carte, et un reflet suit le pointeur ;
  - les boutons sont en verre, teinté bronze ou clair, et rebondissent à l'appui ;
  - à la réponse, la carte se replie en pilule vers le haut.
- Le focus va sur la réponse donnée la fois précédente.
- Il n'y a plus de bouton dans la barre. La touche M coupe ou remet le son à tout moment.
- `?son=0` ou `?son=1` dans l'adresse saute la question, pour les captures et les tests. Le choix est retenu pour la visite suivante. `python sources/test_son.py <dossier>` répond « Activer le son » à la question, fait défiler les deux pages, compte les sons déclenchés, puis vérifie que la touche M coupe tout.

## Lancer en local

```bash
node .claude/serve-nubiaa-onboarding.mjs
```

Depuis `D:\Claude\contenu\nubia-mind`, puis ouvrir http://localhost:4386.

## Ce qui se modifie où

| Quoi | Où |
|---|---|
| Questions, options, fonds, visuels flottants | `sources/questionnaire.src.js` (tableau `QUESTIONS`), puis `python sources/build_questionnaire.py` |
| Envoi des réponses, numéro WhatsApp, heures | bloc `CONFIG` en haut de `sources/questionnaire.src.js` |
| Mise en page, couleurs | `questionnaire.css` |
| Photos et fonds | `sources/build_images.py`, puis `python sources/build_images.py` |
| Textes de la page programme | `content.js`, moitié haute uniquement |
| Ajouts de la page programme (devise, icônes, logo) | `sources/presentation-extras.src.js`, puis `python sources/build_presentation.py` |
| Musique et effets | `sound.js` |

## Contrôles

- `python sources/captures.py <dossier>` : captures de chaque scène en desktop et en mobile, avec Edge. On peut aussi viser une scène à la main avec `?apercu=q-budget:0.06`.
- `python sources/captures_presentation.py <dossier>` : la même chose pour la page programme.
- `python sources/test_parcours.py <dossier>` : clique tout le parcours comme un visiteur, avec une réponse « Autre ». Il vérifie l'ouverture des scènes, la progression, la fin, le récapitulatif et la réécriture de la question 4.

Mettre le `<dossier>` sur D: : le disque C: est presque plein.

## Avant la mise en ligne

1. **Brancher l'envoi** : sans `CONFIG.endpoint`, aucune réponse ne part. Il faut une URL Google Apps Script vers le Sheet du business plan, ou un webhook Make.
2. **Le numéro WhatsApp de NUBIAA** dans `CONFIG.whatsapp`. Le bouton « Écrire à Stella » apparaît alors sur l'écran de fin.
3. **Le créneau** se choisit sans vérifier l'agenda de Stella. Pour éviter les doubles réservations, il faudra Calendly.
4. Sur la page programme, **l'e-mail `bonjour@nubiaa-academia.com` est provisoire**. La citation de Stella et la phrase sur la Nubie sont à valider avec elle.

## Archives

`sources/archive/` contient la première version de l'inscription : une page à part, avec des cartes qu'on glisse. Elle n'est plus reliée au site.

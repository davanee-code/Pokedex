# Conventions de développement

## Objectif
Produire un code lisible, simple et cohérent avec le projet. Ces conventions expriment mes préférences. Le projet utilise JavaScript. Ne pas introduire TypeScript ni créer de fichiers .ts ou .tsx. Appliquer les règles React et Next.js uniquement lorsque ces technologies sont présentes.

## Avant de modifier le code
- Lire les fichiers concernés, les composants similaires et la configuration du projet.
- Réutiliser les composants, utilitaires et styles existants avant d'en créer.
- Respecter les versions installées, les scripts du package.json et le gestionnaire de paquets associé au lockfile.
- Limiter les modifications au besoin demandé et préserver les changements déjà présents.
- Ne pas ajouter de dépendance pour un besoin simple couvert par les outils existants.

## CSS et styles
- Utiliser index.css comme point d'entrée et source des styles partagés : variables, couleurs, typographie, espacements et classes réutilisables. Lire ce fichier avant d'ajouter des styles.
- Si le projet utilise un autre point d'entrée, comme globals.css, appliquer ces principes à ce fichier sans créer un second système concurrent.
- Privilégier les classes utilitaires Tailwind CSS dans className lorsque possible. Respecter la version installée et la configuration du projet.
- Lorsqu'un même style ou ensemble cohérent de classes est utilisé à plusieurs endroits, le regrouper dans une classe réutilisable et explicite dans index.css, puis réutiliser cette classe. Ne pas extraire chaque utilitaire isolé, comme flex ou gap-4.
- Utiliser les mécanismes de composition compatibles avec la version de Tailwind du projet, par exemple @apply lorsque adapté, ou du CSS classique pour les styles qui le nécessitent.
- Réutiliser les valeurs du thème Tailwind et les variables existantes avant d'ajouter des valeurs arbitraires.
- Éviter les styles inline, sauf pour des valeurs réellement dynamiques. Ne pas ajouter une autre bibliothèque de styles sans besoin explicite.
- Privilégier Flexbox ou Grid et gap pour espacer les éléments frères. Utiliser padding pour l'espace intérieur d'un conteneur.
- Éviter margin pour construire les espacements courants. Les exceptions justifiées restent possibles, notamment margin-inline: auto pour centrer un conteneur. Ne pas remplacer mécaniquement une marge extérieure par du padding, car leur effet diffère.
- Réutiliser les variables CSS existantes. Si nécessaire, compléter une petite échelle cohérente d'espacements plutôt que multiplier les valeurs arbitraires.
- Utiliser des noms de classes explicites et limiter la portée des sélecteurs pour éviter les effets de bord.
- Éviter !important, les sélecteurs inutilement spécifiques et les dimensions fixes qui cassent le responsive.
- Privilégier rem pour la typographie et les espacements ; conserver px lorsqu'ils sont adaptés, par exemple pour une bordure fine.
- Prévoir les états hover, focus-visible, disabled et erreur lorsqu'ils s'appliquent.
- Respecter prefers-reduced-motion si des animations sont ajoutées.

## Lisibilité et organisation
- Nommer les variables et fonctions en anglais avec des noms descriptifs ; garder les textes de l'interface dans la langue du produit.
- Suivre les conventions de nommage et d'exports déjà présentes dans le projet.
- Écrire des fonctions et composants avec une responsabilité claire. Extraire une partie lorsqu'elle améliore réellement la lisibilité ou la réutilisation.
- Privilégier les conditions explicites et les retours anticipés aux ternaires imbriqués.
- Éviter les abstractions anticipées et les optimisations sans besoin identifié.
- Commenter les raisons ou contraintes non évidentes. Ne pas commenter chaque ligne.
- Respecter ESLint et Prettier du projet sans reformater les fichiers sans rapport avec la demande.

## JavaScript
- Utiliser const par défaut et let uniquement lorsque la variable doit être réassignée.
- Privilégier les comparaisons strictes et gérer explicitement les valeurs absentes.
- Vérifier les données externes avant de les exploiter et gérer les erreurs des opérations asynchrones.
- Utiliser JSDoc lorsque cela aide à comprendre une interface complexe, sans documenter les évidences.

## React et Next.js
- Utiliser des composants fonctionnels et respecter les règles des hooks.
- Calculer les valeurs dérivées directement lorsque possible plutôt que les dupliquer dans un state ou les synchroniser avec useEffect.
- Utiliser des clés stables pour les listes ; éviter l'index si la liste peut changer d'ordre ou de contenu.
- Ne pas ajouter useMemo ou useCallback systématiquement.
- Avec l'App Router de Next.js, garder les composants serveur par défaut et limiter use client aux parties qui nécessitent de l'interactivité ou des API navigateur.
- Ne jamais exposer un secret dans le code client ni dans une variable NEXT_PUBLIC_.
- Prévoir les états de chargement, d'erreur et de résultat vide pour les données asynchrones.

## Version mobile obligatoire
- Livrer chaque nouvelle interface avec une version mobile fonctionnelle, puis l'adapter aux tablettes et aux ordinateurs.
- Concevoir les styles selon une approche mobile-first ; choisir les points de rupture selon les besoins du contenu.
- Adapter menus, formulaires, cartes, tableaux et fenêtres modales aux petits écrans. Préserver toutes les fonctionnalités essentielles.
- Prévoir des zones tactiles suffisamment grandes et espacées. Aucune action essentielle ne doit dépendre uniquement du survol.
- Utiliser des mises en page fluides et éviter les hauteurs fixes pour les blocs de texte.
- Vérifier au minimum une largeur de 320 px, une largeur mobile courante et une largeur desktop lorsque l'environnement le permet.

## HTML et accessibilité
- Utiliser du HTML sémantique : button pour une action, lien pour une navigation, label associé à chaque champ.
- Rendre les interactions utilisables au clavier avec un focus visible.
- Donner un nom accessible aux boutons composés uniquement d'une icône et un texte alternatif pertinent aux images informatives.
- Préserver une hiérarchie de titres cohérente et des contrastes lisibles.
- Associer les erreurs de formulaire aux champs concernés et ne pas transmettre une information uniquement par la couleur.
- Pour les fenêtres modales, gérer le focus, sa restitution à la fermeture et la fermeture au clavier.
- Garder le contenu lisible et utilisable avec un zoom à 200 %. Utiliser les éléments HTML natifs avant de recourir à ARIA.
- Concevoir les nouveaux écrans pour les petits écrans puis adapter la mise en page aux espaces disponibles.
- Éviter le défilement horizontal involontaire et vérifier les contenus longs.

## Performance
- Limiter le JavaScript chargé et les dépendances ajoutées ; réutiliser les capacités natives lorsque possible.
- Servir des images aux dimensions adaptées, avec un format et une compression appropriés. Définir leurs dimensions pour limiter les décalages de mise en page.
- Charger paresseusement les images hors écran ; ne pas retarder volontairement l'image principale visible au chargement.
- Éviter les requêtes réseau redondantes et réutiliser le mécanisme de cache existant. Paginer les grandes collections si nécessaire.
- Différer le chargement des fonctionnalités lourdes et non essentielles lorsque cela apporte un bénéfice réel.
- Privilégier transform et opacity pour les animations ; éviter les animations coûteuses et les mises à jour inutiles.
- Mesurer avant d'optimiser un comportement complexe. Ne pas ajouter de mémoïsation systématique.

## Vérification et restitution
- Exécuter les vérifications pertinentes disponibles : lint, tests ciblés et build selon la nature du changement.
- Ajouter des tests pour les comportements métier et les corrections de bugs qui le justifient. Éviter les tests qui recopient simplement l'implémentation.
- Vérifier visuellement les modifications d'interface sur mobile et desktop lorsque l'environnement le permet, y compris les contenus longs et les états d'erreur.
- Vérifier la navigation au clavier et, si les outils sont disponibles, compléter avec un audit automatisé d'accessibilité et de performance, par exemple Lighthouse. Un audit automatique ne remplace pas les vérifications manuelles.
- Signaler clairement toute vérification mobile, d'accessibilité ou de performance qui n'a pas pu être réalisée. Ne pas annoncer de score ou de conformité non mesurés.
- Ne pas affirmer qu'une vérification a réussi si elle n'a pas été exécutée.
- Résumer en français ce qui a changé, les vérifications réalisées et les éventuelles limites.

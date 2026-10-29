# PokéTeam Lab

PokéTeam Lab est une application web développée avec React qui utilise les données de [PokéAPI](https://pokeapi.co/) pour explorer l’univers Pokémon.

L’objectif du projet est de proposer davantage qu’un Pokédex classique. L’application permet de rechercher des Pokémon, consulter leurs caractéristiques, composer une équipe et analyser ses forces et ses faiblesses.

> Le projet est actuellement en cours de développement.

## Fonctionnalités disponibles

- Explorer et rechercher des Pokémon
- Filtrer les Pokémon par type et génération
- Consulter leurs informations et statistiques
- Ajouter plusieurs Pokémon à une équipe
- Analyser les types, résistances et faiblesses de l’équipe
- Conserver l’équipe et les favoris dans l’onglet pendant la session, y compris après un rechargement

## Évolutions prévues

- Ajouter la fonctionnalité « Comparer » pour comparer les caractéristiques de plusieurs Pokémon. Elle n’est pas disponible dans cette version.

## Technologies utilisées

- React
- Vite
- Tailwind CSS
- PokéAPI
- JavaScript

## Installation

Cloner le projet puis installer les dépendances :

```bash
npm ci
```

Lancer le serveur de développement :

```bash
npm run dev
```

L’application sera accessible à l’adresse indiquée par Vite, généralement :

```text
http://localhost:5173
```

## Vérifications

```bash
npm run lint
npm test
npm run build
npm run preview
```

Les tests utilisent le module natif `node:test`. Ils couvrent les filtres, la sélection d’équipe, les calculs de types, les favoris ainsi que le cache et les erreurs de l’API. Le build génère le dossier `dist/`, à servir sur un hébergement statique.

## Choix techniques et limites

Les composants sont regroupés dans `src/components/`, les accès aux données dans `src/services/` et les règles métier dans `src/utils/`. Les tests sont regroupés dans `tests/`. Le thème et les styles partagés sont définis dans `src/index.css` avec Tailwind CSS.

Les requêtes sont mises en cache en mémoire, y compris pendant leur chargement. La navigation et le tri ne chargent que les détails de la page affichée. Les filtres globaux nécessitent encore de parcourir les caractéristiques de la collection par petits lots : leur premier chargement peut être long.

L’application nécessite une connexion réseau. L’équipe et les favoris utilisent `sessionStorage` : ils sont conservés au rechargement dans le même onglet, pendant sa session, et ne sont pas partagés entre appareils. Si le navigateur bloque le stockage, les sélections restent utilisables en mémoire et un message signale qu’elles ne pourront pas être conservées au rechargement. L’analyse d’équipe repose sur les types et statistiques de base : elle ne prend pas en compte les talents, objets, attaques connues ou conditions de combat.

## Source des données

Les informations et illustrations utilisées par l’application proviennent de [PokéAPI](https://pokeapi.co/). Les noms français sont issus de son dépôt de données. La provenance des icônes de types est documentée dans [SOURCE.md](public/icons/types/SOURCE.md).

L’icône Pokéball utilisée comme favicon et dans la navigation est créditée à [Nikita Golubev — Flaticon](https://www.flaticon.com/fr/icones-gratuites/pokeball) : « Pokeball icônes créées par Nikita Golubev - Flaticon ».

## Statut

🚧 Projet personnel en cours de développement.

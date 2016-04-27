# TODO solidify

### Fonctionnalité vue solidify

Nous devons mixer les vues classiques et les vues React, les 2 ne servent pas à faire les mêmes choses.
Nos vues classiques vont nous aider à créer des composants rapidement avec une DOM déjà posée par PHP.
Les composants React vont plutôt servir a du full web-app.

EDIT : Sûr ? Peut être 2 problématiques différentes, une de ciblage des éléments jQuery et une seconde de génération de contenu HTML dynamique.

#### Vues classiques
- Gestion des vues classiques avec séléction jQuery + évènements + Central.
- L'idée ici est d'avoir des scripts instanciés depuis notre DOM
- Génération de ces composants depuis la DOM et le script
- Pas besoin de trucs de folie, juste les bons helpers
- Librairie pour gérer la vie de ces composants (récupérer l'instance depuis la DOM, instancier, détruire, etc)
- S'inspirer de la notion d'état de React
- S'inspirer de la notion de props de React

#### Vues react
- Gestion des vues React pour de la génération full JS
- Génération de ces composants depuis la DOM et le script
- Doit aussi avoir les fonctionnalité de ciblage globales (helpers jQuery) mais pas locales (pas besoin de cibler dans le template, React fait ça très bien)
- Doit pouvoir aussi gérer Central
- Librairie pour gérer la vie de ces composants (récupérer l'instance depuis la DOM, instancier, détruire, etc)


### Navigation, routage et controlleurs


### Models


- Object `Config` dispo partout et fed automatiquement depuis l'app

- Routeur connecté à Grapnel
- Bootstrap connecté au routeur
- Possibilité de connecter une ReactView au bootstrap pour gérer seul les vues selon la route
- PlayIn / playOut / shouldPlayOut sur les pages

- Passer l'action et ses paramètres en props ! et ouai pas de double init !
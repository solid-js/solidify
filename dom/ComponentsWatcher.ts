export = ComponentsWatcher;

import View = require("../core/View");
import StringUtils = require("../utils/StringUtils");
import ArrayUtils = require("../utils/ArrayUtils");
import DependencyManager = require("../helpers/DependencyManager");


/**
 * How to inject property into component :
 * - Inject Number / string :
 * 		my-prop="5" will set component.myProp = 5.0
 * 		my-prop="that's neat !" will set component.myProp = "that's neat !"
 *
 * - Inject booleans
 * 		my-prop="true" will set myProp = true
 * 		my-prop="false" will set myProp = false
 *
 * - Inject object / array
 * 		my-object="{toto: 5, tutu:10}"
 * 		my-array="[1, 2, '3', {ok: true}, null]" will set component.myArray = [1, 2, '3', {ok: true}, null]
 *
 * - Inject global dependency :
 * 		my-model="#HomeModel#" will set component.myModel to the HomeModel dependency
 *
 * - Inject javascript evaluated content
 * 		my-global-prop="%window.location%" will set component.myGlobalProp = window.location
 *
 * - Call a method after the render with parameters
 *		my-method="(5, null, 'ok')" will call component.myMethod(5, null, "ok")
 */

/**
 * UPDATE :
 *
 * Update doit instancier les nouveaux composants
 * Attention à ne pas instancier plusieurs fois les mêmes composants
 *
 * TRANSFORMATION :
 *
 * Lorsqu'une balise est transformée en composant
 * Le ComponentsWatcher instancie le composant
 * Installe une référence vers la balise dans le composant.
 *
 * RECUPERATION :
 *
 * Un composant doit pouvoir être récupéré depuis un sélecteur jQuery.
 * Pour ça il nous faut une map {jquery : composant}
 * Cette map nous permet aussi de ne pas instancier plusieurs fois lors de l'update
 *
 * SUPPRESSION :
 *
 * La suppression de la balise ne supprimera pas le composant.
 * Il faut faire un dispose sur le composant pour que tout soit bien supprimé.
 *
 *
 * MAP :
 * Problème : On ne peut mettre que des string / number en clé en ES5
 * Solution 1 : Utiliser un data sur les noeuds ?
 * -> Cette solution nous oblige à parcourir tous les noeuds pour retrouner notre correspondance..
 *
 * Solution 2 : Faire un résumé du sélecteur pour le noeud ? (ex : body[0] > MainView[0] > Container[2] > Menu[0] > MenuElement[0])
 * -> Cette solution peut poser des problèmes en cas de modification de la DOM
 *
 * AUTRE :
 *
 * Update doit supprimer les composants qui ont été disposés.
 * Peut être pas passer par update mais par un signal sur Disposable ?
 */

interface IComponentPack
{
	element		: JQuery;
	type		: string;
	id			?: number;
	namespace	?: string;
	tagName		?: string;
	view		?: View;
}


class ComponentsWatcher
{

	// ------------------------------------------------------------------------- SINGLETON

	/**
	 * Singleton instance
	 */
	static __instance                   :ComponentsWatcher;

	/**
	 * Get access to the singleton instance of this class
	 */
	static getInstance ()
	{
		// Create the first instance
		if (this.__instance == null)
		{
			this.__instance = new ComponentsWatcher();
		}

		return this.__instance;
	}

	// ------------------------------------------------------------------------- STATICS

	static DEFAULT_ATTR_PREFIX					:string             				= "s-";

	// ------------------------------------------------------------------------- INTERNAL

	private _currentComponentId                 :number            					= 0;

	private _dependencyManager                  :DependencyManager;

	private _typesMap                           :string[]           				= [];

	private _componentsById						:{[index: number] : IComponentPack} = {};

	// ------------------------------------------------------------------------- GET / SET

	get typesMap ():string[]
	{
		return this._typesMap;
	}

	// ------------------------------------------------------------------------- CONSTRUCT

	constructor ()
	{
		this.initDependencyManager();
		this.initRemoveDetection();
	}

	// ------------------------------------------------------------------------- INIT

	private initDependencyManager ():void
	{
		this._dependencyManager = DependencyManager.getInstance();
	}

	private initRemoveDetection ():void
	{
		$(document).bind('DOMNodeRemoved', this.domNodeRemovedHandler);
	}

	domNodeRemovedHandler = (pEvent:JQueryEventObject):void =>
	{
		//console.info('-->', pEvent.target);
		return;
		var view:View = this.getViewFromElement(<Element>pEvent.target);


		if (view != null && view.autoDispose)
		{
			//console.info("-->", view.viewName);
		}

		//view != null && view.autoDispose && view.dispose();
	};

	// ------------------------------------------------------------------------- REGISTERING

	registerType (pType:string):void
	{
		if (!ArrayUtils.inArray(this._typesMap, pType))
		{
			this._typesMap.push(pType.toLowerCase());
		}
	}

	registerTypes (pTypes:string[]):void
	{
		for (var typeIndex in pTypes)
		{
			this.registerType(pTypes[typeIndex]);
		}
	}

	// ------------------------------------------------------------------------- GETTERS


	getViewById (pId:number):View
	{
		return (pId in this._componentsById ? this._componentsById[pId].view : null);
	}


	// Todo : SOLID documenter le fait que ça ne cherche qu'au premier niveau
	// Todo : SOLID Faire une version qui récupère avec un depth, est-elle utile ?

	getViewFromElement (pElement:Element):View
	{
		// Get the id of this node
		var id = $(pElement).attr(ComponentsWatcher.DEFAULT_ATTR_PREFIX + "id");

		// Try to get the associated view
		return id == null ? null : this.getViewById(parseInt(id, 10));
	}

	getViewsByJQuery (pJQuery:JQuery):View[]
	{
		// All views instances we found
		var views	:View[] = [];

		var view	:View;

		pJQuery.each( (i, el) => {

			view = this.getViewFromElement(el);

			view != null && views.push(view);
		});

		return views;
	}

	getViewsBySelector (pComponentSelector:string, pFromNode:JQuery = $("body")):View[]
	{
		// Browse components from a specific node
		return this.getViewsByJQuery(pFromNode.find(pComponentSelector));
	}

	// ------------------------------------------------------------------------- MANAGE

	// TODO : SOLID remove

	removeComponentByJQuery (pJQuery:JQuery):void
	{
		if (pJQuery != null)
		{
			var componentId = parseInt(pJQuery.attr(ComponentsWatcher.DEFAULT_ATTR_PREFIX + "id"), 10);

			if (componentId >= 0)
			{
				this.removeComponentById(componentId);
			}
		}
	}

	removeComponentById (pId:number):void
	{
		/**
		 * Suppression :
		 * Gérer ça depuis la vue ou depuis ComponentsWatcher ?
		 * Attention si on supprime une vue de la DOM a bien disposer la vue
		 * Ainsi que les childs !
		 */

		if (pId in this._componentsById)
		{
			delete this._componentsById[pId];
		}
	}

	// ------------------------------------------------------------------------- UPDATING

	update (pFromNode:JQuery = $("body")):void
	{
		var namespaceAttrName	= ComponentsWatcher.DEFAULT_ATTR_PREFIX + "ns";
		var idAttrName			= ComponentsWatcher.DEFAULT_ATTR_PREFIX + "id";

		var currentTypeName		:string;
		var currentTypeAttr		:string;

		var $componentsNodes	:JQuery;
		var $element            :JQuery;
		var elementDepth		:number;
		var componentPack		:IComponentPack;

		var componentsToCreate	:{[index:number]: IComponentPack[]}	= {};
		var componentsToInit	:IComponentPack[] = [];
		var currentAttribute	:Attr;
		var camelAttributeName	:string;
		var valueToInject		:any;
		var firstChar			:string;
		var lastChar			:string;
		var splittedTagName		:string[];

		var typeIndex			:number;

		var componentToCreateDepth	:string;
		var componentToCreateIndex	:number;
		var ViewClass				:{new(): View};
		var attributeIndex			:number;

		// Browse types we have to convert
		for (typeIndex = 0; typeIndex < this._typesMap.length; typeIndex ++)
		{
			// Get the type name and the attribute value for this type
			currentTypeName = this._typesMap[typeIndex];
			currentTypeAttr = ComponentsWatcher.DEFAULT_ATTR_PREFIX + currentTypeName;

			// Get all non converted components
			$componentsNodes = pFromNode.find('*[' + currentTypeAttr + ']:not([' + idAttrName + '])');

			// Browse all components to convert
			$componentsNodes.each((i, el) =>
			{
				// Target the node
				$element = $(el);

				// Get the depth of the component
				elementDepth = $element.parents().length;

				// Create depth slot
				if (!(elementDepth in componentsToCreate))
				{
					componentsToCreate[elementDepth] = [];
				}

				// Store component to create by depths, based on IComponentPack
				componentsToCreate[elementDepth].push({
					element: $element,
					type: currentTypeName
				});
			});
		}

		// Browse components to create by depths
		for (componentToCreateDepth in componentsToCreate)
		{
			// Browse components of this componentToCreateDepth
			for (componentToCreateIndex = 0; componentToCreateIndex < componentsToCreate[componentToCreateDepth].length; componentToCreateIndex ++)
			{
				// Target the component pack
				componentPack = componentsToCreate[componentToCreateDepth][componentToCreateIndex];

				// Store the component ID in the DOM and in the pack
				componentPack.element.attr(idAttrName, this._currentComponentId);
				componentPack.id = this._currentComponentId;

				// Get the namespace from the component
				componentPack.namespace = componentPack.element.attr(namespaceAttrName);

				// If not found right on the component, get from ancestors
				if (componentPack.namespace == null)
				{
					componentPack.namespace = componentPack.element.parents(
						'*[' + namespaceAttrName + ']'
					).eq(0).attr(namespaceAttrName);
				}

				// Get the tagName from the DOM
				componentPack.tagName = componentPack.element[0].tagName.toLowerCase();

				// Split the tagName on dashes to test if the tagName is "s-" like
				splittedTagName = componentPack.tagName.split("-");

				// Check if we have a "s-" like tag name
				if (splittedTagName.length < 2 || splittedTagName[0] != "s")
				{
					throw new Error('ComponentsWatcher.update // Components have to be snake-case names, starting with "s-" like this "<s-my-component>" (used: '+componentPack.tagName+').');
				}

				// Remove the "s-"
				splittedTagName.shift();

				// Convert to camelCase without the "s-"
				componentPack.tagName = StringUtils.snakeToCamelCase(splittedTagName.join(''));

				// Get class from tagName
				ViewClass = this._dependencyManager.requireModule(
					componentPack.namespace,
					componentPack.tagName,
					componentPack.type
				);

				// Instantiate the component
				componentPack.view = new ViewClass();

				// Activate auto dispose
				componentPack.view.autoDispose = true;

				// Get document node attributes
				for (attributeIndex = 0; attributeIndex < componentPack.element[0].attributes.length; attributeIndex ++)
				{
					// Get the attribute object
					currentAttribute = componentPack.element[0].attributes[attributeIndex];

					// Pick only defined from dom attributes
					if (currentAttribute.specified)
					{
						// -- PARAMS INJECTION
						if (
								// Check if it's not a configuration attribute
								currentAttribute.name != namespaceAttrName
								&&
								currentAttribute.name != idAttrName

								// Check if it's not a registered type
								&&
								currentAttribute.name.indexOf(ComponentsWatcher.DEFAULT_ATTR_PREFIX) != 0
							)
						{
							// Convert to camelCase
							camelAttributeName = StringUtils.snakeToCamelCase(currentAttribute.name);

							// Get the first and the last char
							firstChar = currentAttribute.value.charAt(0);
							lastChar = currentAttribute.value.charAt(currentAttribute.value.length - 1);

							// This is a JSON structure
							if (
									(firstChar == "{" && lastChar == "}")
									||
									(firstChar == "[" && lastChar == "]")
								)
							{
								valueToInject = eval.call(componentPack.view, '(' + currentAttribute.value + ')');
							}

							// This is a method call
							else if (firstChar == "(" && lastChar == ")")
							{
								// Eval on component scope as a JSON object
								valueToInject = eval.call(componentPack.view, '([' + currentAttribute.value.substr(1, currentAttribute.value.length - 2) + '])');

								// Check if our method exists
								if (!(camelAttributeName in componentPack.view))
								{
									throw new Error('ComponentsWatcher.update // Method ' + camelAttributeName + ' not found on view ' + componentPack.view.viewName + '.');
								}

								// Call method with json parameters
								componentPack.view[camelAttributeName].apply(componentPack.view, valueToInject);

								// Skip property injection
								continue;
							}

							// This is an dependency injection
							else if (firstChar == "#" && lastChar == "#")
							{
								valueToInject = this._dependencyManager.requireInstance(
									currentAttribute.value.substr(1, currentAttribute.value.length - 2)
								);
							}

							// This is an evaluation
							else if (firstChar == "%" && lastChar == "%")
							{
								valueToInject = eval.call(componentPack.view, '(' + currentAttribute.value.substr(1, currentAttribute.value.length - 2) + ')');
							}

							// This is a number (float or integer)
							else if (/^-?\d*\.?\\d+$/.test(valueToInject))
							{
								valueToInject = parseFloat(currentAttribute.value);
							}

							// This is a boolean
							else if (currentAttribute.value.toLowerCase() == "true" || currentAttribute.value.toLowerCase() == "false")
							{
								valueToInject = (currentAttribute.value.toLowerCase() == "true");
							}

							// This is a string
							else
							{
								valueToInject = currentAttribute.value + '';
							}

							// Inject into the view
							componentPack.view.injectProperty(camelAttributeName, valueToInject);
						}
					}
				}

				// Store the component instance by id
				this._componentsById[this._currentComponentId] = componentPack;

				// Set the element to the view
				componentPack.view.content = componentPack.element;

				// Inject namespace into dom
				componentPack.element.attr(namespaceAttrName, componentPack.namespace);

				// Defining the external content from dom
				componentPack.view.externalContent = componentPack.element.contents();

				// If we don't have external content, directly set the content as the tag to avoid the view to target parent
				if (componentPack.view.externalContent.length == 0)
				{
					componentPack.view.content = componentPack.element;
				}

				// Get to the next ID
				this._currentComponentId ++;

				// Reverse the order for the ready statement
				componentsToInit.unshift(componentPack);
			}
		}

		// Browse components to init them, in inverse order.
		for (var componentToReadyIndex in componentsToInit)
		{
			// Target the component pack
			componentPack = componentsToInit[componentToReadyIndex];

			// Init component
			componentPack.view.init();

			// Transfert non injection attributes to the new content
			for (attributeIndex = 0; attributeIndex < componentPack.element[0].attributes.length; attributeIndex ++)
			{
				// Target attribute
				currentAttribute = componentPack.element[0].attributes[attributeIndex];

				// Check if it's not a configuration attribute
				if (currentAttribute.specified)
				{
					// Extend classes on rendered template
					if (currentAttribute.name == "class")
					{
						componentPack.view.content.addClass(currentAttribute.value);
					}

					// Extend style on rendered template
					else if (currentAttribute.name == "style")
					{
						componentPack.view.content.attr("style", componentPack.view.content.attr("style") + ';' + currentAttribute.value)
					}

					// Add every attributes from external which are not declared in the template
					else if (componentPack.view.content.attr(currentAttribute.name) == null)
					{
						componentPack.view.content.attr(currentAttribute.name, currentAttribute.value);
					}
				}
			}
		}

		// Log if we added components
		if (componentsToInit.length > 0)
		{
			//SLog.log(0, );
			console.log("ComponentsWatcher.update // " + componentsToInit.length + " component(s) added.");
		}
	}

	/**
	 * TODO SOLID : refaire ce bordel, on ne devrait pas avoir à exposer cette méthode.
	 * Gestion automatique du cycle de vie des composants que ça soit via instanciation depuis le code ou depuis la DOM
	 */
	registerComponent (pComponent:View):void
	{
		// Store the component instance by id
		this._componentsById[this._currentComponentId] = {
			element: pComponent.content,
			id: this._currentComponentId,
			type: null,
			namespace: null,
			tagName: (pComponent.content != null && pComponent.content.length > 0 ? pComponent.content[0].tagName.toLowerCase() : null),
			view: pComponent,
		};

		// Définir l'id sur l'élément DOM
		pComponent.content.attr(ComponentsWatcher.DEFAULT_ATTR_PREFIX + "id", this._currentComponentId);

		// Get to the next ID
		this._currentComponentId ++;
	}
}
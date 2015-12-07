export = Router;

import Disposable = require("../core/Disposable");
import Signal = require("../helpers/Signal");
import StringUtils = require("../utils/StringUtils");
import EnvUtils = require("../utils/EnvUtils");

interface IRoute
{
	/**
	 * The route pattern for url checking
	 */
	pattern			:RegExp;

	/**
	 * The route pattern for quick params replacement when reverse routing
	 */
	reverseRoute	:string;

	/**
	 * Listing parameters and their types (name in key, type in value)
	 */
	params			:{[index:string] : string};

	/**
	 * Les index de chaque param pour les récupérer depuis la regex
	 */
	paramsIndexes	:string[];

	/**
	 * Action and controller names
	 */
	controllerName	:string;
	actionName		:string;
}

/**
 * Returned when checking if an route is corresponding to an URL
 */
interface IRouteOutput
{
	name		:string;
	controller	:string;
	action		:string;
	params		:{[index:string]: any};
}

/**
 * Called when the URL is corresponding to a route
 */
interface IInsideHandler
{
	(pControllerName:string, pActionName:string, pParams:any):void
}

/**
 * Called when the URL is not corresponding to a route
 */
interface IOutsideHandler
{
	():void
}

/**
 * A routes-handler containing routes and external handlers
 */
interface IRouteHandler
{
	routes			:IRoute[];
	insideHandler	:IInsideHandler;
	outsideHandler	:IOutsideHandler;
}

class Router extends Disposable
{
	/**
	 * Meta rule allowing parameter to be an integer
	 */
	static META_RULE_NUMBER = "([0-9]+)";

	/**
	 * Meta rule allowing parameter to be a slug type string (like "im-a-slug-55")
	 * Ne special char, dash separated.
	 */
	static META_RULE_STRING = "([0-9a-zA-Z_\%\+-]+)";

	/**
	 * Meta rule allowing parameter to be anything (will force the URL to end with this)
	 */
	static META_RULE_ANY = "(.+)";

	/**
	 * All available meta rules, by names
	 */
	static META_RULES = {
		"number"	: Router.META_RULE_NUMBER,
		"string"	: Router.META_RULE_STRING,
		"any"		: Router.META_RULE_ANY
	};

	/**
	 * Current instance of the router
	 */
	static __instance:Router;

	/**
	 * Get the only Router instance
	 */
	static getInstance ():Router
	{
		if (this.__instance == null)
		{
			this.__instance = new Router();
		}

		return this.__instance;
	}

	/**
	 * When the route has changed
	 */
	private _onRouteChanged:Signal = new Signal();
	get onRouteChanged ():Signal { return this._onRouteChanged; }

	/**
	 * When the route is not found (in any route-handlers)
	 */
	private _onRouteNotFound:Signal = new Signal();
	get onRouteNotFound ():Signal { return this._onRouteNotFound; }

	/**
	 * If the router is started and ready to catch url changes
	 */
	private _started:boolean = false;
	get started ():boolean { return this._started; }

	/**
	 * Pause the router (will not trigger new route if address bar URL has changed)
	 */
	private _paused:boolean = false;
	get paused ():boolean { return this._paused; }
	set paused (pValue:boolean)
	{
		// If changed
		if (this._paused != pValue)
		{
			this._paused = pValue;

			// Update
			this.routeChangedHandler();
		}
	}

	/**
	 * Get the baseURL if pushstate is activated
	 */
	get baseURL ():string
	{
		// Get base URL from pushState
		var baseURL:string = $['address'].state();

		// Patch if we are in hashbang mode
		if (baseURL == null || baseURL == undefined)
		{
			return "";
		}
		else if (baseURL.lastIndexOf("/") == baseURL.length - 1)
		{
			return baseURL.substr(0, baseURL.length - 1);
		}
		else return baseURL;
	}

	/**
	 * The current URL on the address bar
	 */
	private _currentURL			:string;
	get currentURL ():string { return this._currentURL; }
	set currentURL (pValue:string)
	{
		// If changed
		if (this._currentURL != pValue)
		{
			// Update but don't store (wait for the event)
			$['address'].value(pValue);
		}
	}

	/**
	 * The current route corresponding to the current URL.
	 * Use Router.open to open a route.
	 * Read only, can be null.
	 */
	private _currentRoute		:IRouteOutput;
	get currentRoute ():IRouteOutput { return this._currentRoute; }

	/**
	 * All routes handlers
	 */
	private _handlers:{[index:string]: IRouteHandler} = {};


	/**
	 * Internal method for processing external API routes into prepared IRoutes[].
	 * Will create a reverse URL pattern for quick URL creating.
	 * Will also create a route pattern for quick route matching from current address.
	 */
	private processRoutes (pRoutes:string[][]):IRoute[]
	{
		// Output array of processed routes
		var processedRoutes	:IRoute[] = [];

		// Loop vars
		var currentRoute	:string[];
		var convertedRoute	:IRoute;
		var hashPattern		:string;
		var newPattern		:string;
		var splittedAction	:string[];
		var start			:number;
		var end				:number;
		var splittedParam	:string[];
		var i, j;

		// Browse external API routes
		for (i in pRoutes)
		{
			// Target current external route
			currentRoute = pRoutes[i];

			// Check if we have both action and route
			if (currentRoute.length != 2)
			{
				throw new Error('Router.addRoutes // Routes declarations has to be like : ["Controller.action", "route/pattern.html"]');
			}

			// Split action in controllerName and actionName
			splittedAction = currentRoute[0].split(".");

			// Check if we have both controller and action names
			if (splittedAction.length != 2)
			{
				throw new Error('Router.addRoutes // Controller name and action name has to be dot separated, like : "Controller.action"');
			}

			// Create the converted route object
			convertedRoute = {
				pattern: null,
				reverseRoute: "",
				params: {},
				controllerName: splittedAction[0],
				actionName: splittedAction[1],
				paramsIndexes: []
			};

			// Copy route pattern declaration for params hashing
			hashPattern = currentRoute[1];

			// Index to detect params boundaries
			start = hashPattern.indexOf("{");
			end = 0;

			// Initialize the new pattern for quick detection
			newPattern = "";

			// Check if we have another incomming parameter on the route pattern declaration
			while (start != -1 && end != -1)
			{
				// Get boundaries for this param
				start = hashPattern.indexOf("{");
				end = hashPattern.indexOf("}");

				// Split the name from the meta
				splittedParam = hashPattern.substring(start + 1, end).split(":");

				// If we don't have param type, choose string by default
				if (splittedParam.length == 1)
				{
					splittedParam[1] = "string";
				}

				// Check if we have a name and a meta
				else if (splittedParam.length != 2 || !(splittedParam[1] in Router.META_RULES))
				{
					throw new Error('Router.processRoutes // Invalid param type in route ' + currentRoute[1] + ' has to be : "{paramName:paramType}", param types are available in Router statics (number / string / any)');
				}

				// Add param index
				convertedRoute.paramsIndexes.push(splittedParam[0]);

				// Add this hashed part to the reverse route width mustache boundaries and the param name (for quick replacement)
				convertedRoute.reverseRoute += hashPattern.substring(0, start) + "{{" + splittedParam[0] + "}}";

				// The same for the match pattern but with the meta (for quick checking)
				newPattern += hashPattern.substring(0, start) + "{{" + splittedParam[1] + "}}";

				// Register the param name in key and the meta in value
				convertedRoute.params[splittedParam[0]] = splittedParam[1];

				// Cut the hash for the next param detection iteration
				hashPattern = hashPattern.substring(end + 1, hashPattern.length);
				start = hashPattern.indexOf("{");
			}

			// Add the end of pattern to the reverse and match routes
			convertedRoute.reverseRoute += hashPattern.substring(0, hashPattern.length);
			newPattern += hashPattern.substring(0, hashPattern.length);

			// Replace regex reserved chars on the match pattern
			newPattern = newPattern
				.replace(/\./g, '\\.')
				.replace(/\+/g, '\\+')
				.replace(/\*/g, '\\*')
				.replace(/\$/g, '\\$')
				.replace(/\/$/, '/?'); // Optional last slash

			// Replace every meta name by its regex on the match pattern
			for (j in Router.META_RULES)
			{
				newPattern = newPattern.replace(new RegExp("(\{\{" + j + "\}\})", "g"), Router.META_RULES[j]);
			}

			// Convert it in regex and
			convertedRoute.pattern = new RegExp("^" + newPattern + "$");

			// Add to the list
			processedRoutes.push(convertedRoute);
		}

		// Return the converted routes list
		return processedRoutes;
	}

	/**
	 * Add routes to an handling context.
	 * Available param types are in statics
	 * @param pHandlingName Name of the context. For ex : "main" or "popup"
	 * @param pRoutes Listing routes, a route have to be like ["Controller.action", "route/pattern/{paramName:string}.html"]
	 * @param pInsideHandler Called when a route of this context is corresponding. Following IInsideHandler for parameters : (controllerName, actionName, parameters)
	 * @param pOutsideHandler Called when no route for this context is found
	 */
	addRoutes (pHandlingName:string, pRoutes:string[][], pInsideHandler:IInsideHandler, pOutsideHandler:IOutsideHandler):void
	{
		// Store the route context
		this._handlers[pHandlingName] = {
			routes			: this.processRoutes(pRoutes),
			insideHandler	: pInsideHandler,
			outsideHandler	: pOutsideHandler
		};
	}

	/**
	 * Get the route from a specific URL.
	 * Will return an IRouteOutput if a corresponding route is found.
	 */
	getRouteFromURL (pURL:string):IRouteOutput
	{
		var currentRoute:IRoute;
		var regexResult:any;

		// Browse routing handlers
		var i, j, k;
		for (i in this._handlers)
		{
			// Browse routes
			for (j in this._handlers[i].routes)
			{
				// Target route
				currentRoute = this._handlers[i].routes[j];

				// Check the URL on the pre-computed check pattern
				regexResult = currentRoute.pattern.exec(pURL);

				// If this is corresponding
				if (regexResult != null)
				{
					// Remove url and other stuff from result to get only parameters values
					regexResult.shift();

					delete regexResult.input;
					delete regexResult.index;

					// Map params indexed array to named object
					var outputParams:{[index:string] : any} = {};
					for (k in regexResult)
					{
						outputParams[currentRoute.paramsIndexes[k]] = regexResult[k];
					}

					// Return the formated route output with handling name, action, controller and parameters values
					return {
						name: i,
						controller: currentRoute.controllerName,
						action: currentRoute.actionName,
						params: outputParams
					};
				}
			}
		}

		// No corresponding route found
		return null;
	}

	/**
	 * Start the routing system.
	 * Routing can't be stopped but you can pause it for while if you want to avoid route triggers.
	 * Default watched links are with this selector a[internal-link]
	 * @param pPushStateBase If provided, will enable the HTML5 pushstate URL managing with this base.
	 * @param pWatchLinkSelector If provided with pPushStateBase, will enable click listening on every elements having this selector. Push state will be then fully activated.
	 */
	start (pPushStateBase:string = null, pWatchLinkSelector:string = 'a[internal-link]'):void
	{
		// If it's not already started
		if (!this._started)
		{
			// Router is now started
			this._started = true;

			// Enable push state if needed
			if (pPushStateBase != null)
			{
				$['address'].state(pPushStateBase);
			}

			// Dispatch first route change if no pushstate base declared
			// Or if we have no pushstate because IE9
			if (pPushStateBase == null || EnvUtils.getIEVersion() <= 9)
			{
				this.routeChangedHandler();
			}

			// Initialise link watcher if needed
			if (pWatchLinkSelector != null)
			{
				$(pWatchLinkSelector).on('click', this.watchedLinkClickedHandler);
			}

			// Start address bar listening
			$['address'].change((pEvent:any) =>
			{
				this.routeChangedHandler();
			});
		}
	}

	/**
	 * When a watched link is clicked
	 */
	private watchedLinkClickedHandler = (pEvent:JQueryEventObject):void =>
	{
		// Disable native browser click behavior
		pEvent.preventDefault();

		// Get the initialised push state base URL
		var pushStateBase:string = $['address'].state();

		// Get the link URL
		var href = $(pEvent.currentTarget).attr('href');

		if (href.indexOf(pushStateBase) == 0)
		{
			href = href.split(pushStateBase)[1];
		}

		this.currentURL = href;
	};

	/**
	 * Open a route for specific controller, action name and parameters.
	 * For exemple ("main", "Gallery", "all", {page: 2}) can give "/gallery/page/2.html" on the URL bar
	 * @param pHandlingName The name of the route configuration handling (maybe "main" or "popup" ?)
	 * @param pController The name of the required controller
	 * @param pAction The name of the required action
	 * @param pParams Key are names and real values for required parameters
	 */
	open (pHandlingName:string, pController:string, pAction:string = "index", pParams:{[index:string] : any} = {}):void
	{
		// Get the corresponding URL
		var url:string = this.reverseURL(pHandlingName, pController, pAction, pParams);

		// If we don't have a valid URL, throw an error
		if (url == null)
		{
			throw new Error('Router.open // Route not found for handling ' + pHandlingName + ', controller ' + pController + ', action ' + pAction + ' and parameters ' + JSON.stringify(pParams));
		}

		// Define the new URL on the address bar
		this.currentURL = url;
	}

	/**
	 * Alias for open with compacted controller and action names.
	 * Give 'ControllerName.actionName' formatted action to pCompactAction
	 * @param pHandlingName The name of the route configuration handling (maybe "main" or "popup" ?)
	 * @param pCompactAction Compacted controller and action name, formatted 'like ControllerName.actionName'
	 * @param pParams Key are names and real values for required parameters
	 */
	openCompact (pHandlingName:string, pCompactAction:string, pParams:{[index:string] : any} = {}):void
	{
		// Separate controller and action
		var splittedAction = pCompactAction.split(".");

		// Check developper stupidity
		if (splittedAction.length != 2)
		{
			throw new Error("Router.openCompact // pCompactAction need to be formated like : 'ControllerName.actionName'");
		}

		// Get the corresponding URL
		var url:string = this.reverseURL(pHandlingName, splittedAction[0], splittedAction[1], pParams);

		// If we don't have a valid URL, throw an error
		if (url == null)
		{
			throw new Error('Router.open // Route not found for handling ' + pHandlingName + ', controller ' + splittedAction[0] + ', action ' + splittedAction[1] + ' and parameters ' + JSON.stringify(pParams));
		}

		// Define the new URL on the address bar
		this.currentURL = url;
	}

	/**
	 * Get the URL from controller name, action name, and parameters.
	 * For exemple ("main", "Gallery", "all", {page: 2}) can return "/gallery/page/2.html"
	 * @param pHandlingName The name of the route configuration handling (maybe "main" or "popup" ?)
	 * @param pController The name of the required controller
	 * @param pAction The name of the required action
	 * @param pParams Key are names and real values for required parameters
	 * @returns reversed URL if route found, otherwise null will be returned.
	 */
	reverseURL (pHandlingName:string, pController:string, pAction:string = "index", pParams:{[index:string] : any} = {}, pFirstSlash:boolean = true):string
	{
		// Check our handling exists
		if (!(pHandlingName in this._handlers))
		{
			throw new Error('Router.reverseURL // ' + pHandlingName + ' not found in routes handling names.');
		}

		// Target our route handler
		var currentRouteHandler = this._handlers[pHandlingName];

		// Current route from loop
		var currentRoute:IRoute;

		// If all params for this loop are ok
		var paramsAreValid:boolean;

		// Converted params (slugs) for current route
		var convertedParams:any;

		// Browse routes
		var i, j;
		for (i in currentRouteHandler.routes)
		{
			// Target current route
			currentRoute = currentRouteHandler.routes[i];

			// Check if we have the same controller and action names
			if (
					currentRoute.controllerName.toLowerCase() == pController.toLowerCase()
					&&
					currentRoute.actionName.toLowerCase() == pAction.toLowerCase()
				)
			{
				// By default, all params are good (for exemple if we don't have any)
				paramsAreValid = true;

				// New converted params object for this route
				convertedParams = {};

				// Browse given parameters
				for (j in pParams)
				{
					// If this param doesn't exists in route specifications
					if (!(j in currentRoute.params))
					{
						// This is not this route
						paramsAreValid = false;
						break;
					}

					// Get the new param object with converted values
					convertedParams[j] = (
						// Convert slugs
						(Router.META_RULES[currentRoute.params[j]] == Router.META_RULE_STRING)
						? StringUtils.slugify(pParams[j])

						// Raw param, converted to string
						: pParams[j] + ''
					);

					// Check if this param is valid by checking meta
					if (!(new RegExp(Router.META_RULES[currentRoute.params[j]], "g")).exec(convertedParams[j]))
					{
						paramsAreValid = false;
						break;
					}
				}

				// Every params are ok
				if (paramsAreValid)
				{
					// Get the reverse route from template with converted parameters
					var routeURL = StringUtils.quickMustache(currentRoute.reverseRoute, convertedParams);

					// If we have to remove the leading /
					if (!pFirstSlash)
					{
						routeURL = routeURL.substr(1, routeURL.length);
					}

					// Return the route URL
					return routeURL;
				}
			}
		}

		// No corresponding route found
		return null;
	}

	/**
	 * Address bar URL changed
	 */
	private routeChangedHandler ():void
	{
		// Get the new URL from the address bar
		var newAddress = $['address'].value();

		// Supprimer les query parameters
		newAddress = newAddress.split('?')[0];

		// If our URL really changed
		if (newAddress != this._currentURL)
		{
			// Register the new URL
			this._currentURL = newAddress;

			// Get the corresponding route if available
			this._currentRoute = this.getRouteFromURL(this._currentURL);

			// Browse route handlers
			for (var i in this._handlers)
			{
				// If the found route is inside this handler
				if (this._currentRoute != null && this._currentRoute.name == i)
				{
					this._handlers[i].insideHandler(this._currentRoute.controller, this._currentRoute.action, this._currentRoute.params);
				}
				else
				{
					this._handlers[i].outsideHandler();
				}
			}

			// Dispatch the change or the not found
			if (this._currentRoute != null)
			{
				this._onRouteChanged.dispatch();
			}
			else
			{
				this._onRouteNotFound.dispatch();
			}

			// Track current page
			if ('ga' in window)
			{
				console.log("GA Tracking for " + newAddress);
				window['ga']('send', 'pageview', newAddress);
			}
		}
	}


	// todo : dispose
	dispose ():void
	{
		super.dispose();
	}
}
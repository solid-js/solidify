import {StringUtils} from "../utils/StringUtils";
import {ArrayUtils} from "../utils/ArrayUtils";
import {Signal} from "../helpers/Signal";
import {IPageStack} from "./IPageStack";

// ----------------------------------------------------------------------------- STRUCT

// TODO : Tout passer en static
// TODO : Créer Router.create plutôt que le new

/**
 * Interface for action parameters.
 * This is an associative array.
 * Value can be either string or number.
 */
export interface IActionParameters
{
	[index:string] : string|number;
}

/**
 * Interface for route matching with URLs.
 * This is created by the router.
 * It contains every info to run an action on a page with parameters.
 */
export interface IRouteMatch
{
	/**
	 * Page name.
	 * Can be a page to show in stack or any name that is fine to you.
	 */
	page				:string;

	/**
	 * Action to execute on page.
	 * Default is "index"
	 */
	action				?:string;

	/**
	 * Stack name which have to show page.
	 * Default is "main"
	 */
	stack				?:string;

	/**
	 * Parameters matching with this route.
	 */
	parameters			?:IActionParameters;

	/**
	 * Original route triggering this route match.
	 * Will be created by router when matchin. Do not touch :)
	 */
	_fromRoute			?:IRoute;
}

/**
 * Interface for a declared route listening.
 * This is created by dev using the router.
 * It contains every info to link a dynamic URL with a page / action.
 */
export interface IRoute
{
	/**
	 * Link to trigger this route, without base and with leading slash.
	 */
	url					:string;

	/**
	 * Page name.
	 * Can be a page to show in stack or any name that is fine to you.
	 */
	page				:string;

	/**
	 * Action to execute on page.
	 * Default is "index"
	 */
	action				?:string;

	/**
	 * Optional, called when route is triggered.
	 * @param pRouteMatch Matching route with action and parameters
	 */
	handler				?:( pRouteMatch:IRouteMatch ) => void;

	/**
	 * Stack name which have to show page.
	 * Default is "main"
	 */
	stack				?:string;

	/**
	 * Route regex for matching.
	 * Will be created by router when adding. Do not touch :)
	 */
	_matchingRegex		?:RegExp;

	/**
	 * Params name for matching.
	 * Will be created by router when adding. Do not touch :)
	 */
	_matchingParameter	?:string[];
}


/**
 * This router uses pushState.
 * See coverage at http://caniuse.com/#search=pushstate
 * IE 10+
 */
export class Router
{
	// ------------------------------------------------------------------------- SINGLETON

	// Our router singleton instance
	protected static __INSTANCE	:Router;

	/**
	 * Get router instance.
	 * Please create and configure it without this getter before.
	 * @returns {Router}
	 */
	static get instance ():Router
	{
		// If instance does'n exists
		if (Router.__INSTANCE == null)
		{
			// This is no good.
			throw new Error('Router.instance // Please create router in app Main file before using it.');
		}

		// Return instance
		return Router.__INSTANCE;
	}

	// ------------------------------------------------------------------------- STATICS

	/**
	 * Left delimiter for URL parameters templating
	 */
	static LEFT_PARAMETERS_DELIMITER 		= '{';

	/**
	 * Right delimiter for URL parameters templating
	 */
	static RIGHT_PARAMETER_DELIMITER 		= '}';

	/**
	 * Regex rule to detect slugified parameters.
	 * As string because we'll create one dynamic regex by route.
	 */
	static PARAMETER_RULE 					= '([0-9a-zA-Z\_\%\+\-]+)';

	/**
	 * Regex to replace parameters in URLs.
	 */
	static PARAMETER_REPLACE_RULE 			= /\{(.*?)\}/g;


	// ------------------------------------------------------------------------- LOCALS

	// If our router is started and is listening to route changes
	protected _isStarted = false;


	// ------------------------------------------------------------------------- PROPERTIES

	/**
	 * The base is the HTTP path between your server and your app.
	 *
	 * For example, if your app is installed here :
	 * http://www.my-server.com/any-folder/to/my-app/
	 *
	 * then your base is :
	 * /any-folder/to/my-app/
	 *
	 * Leading and trailing slash will be added if not present.
	 */
	protected _base					:string;
	get base ():string { return this._base }
	set base (value:string)
	{
		// Add leading and trailing slash
		value = StringUtils.leadingSlash(value, true);
		value = StringUtils.trailingSlash(value, true);

		// Set
		this._base = value;
	}

	/**
	 * List of declared routes
	 */
	protected _routes				:IRoute[] 			= [];
	get routes ():IRoute[] { return this._routes; }

	/**
	 * Current path, including base.
	 */
	protected _currentPath			:string;
	get currentPath ():string { return this._currentPath; }

	/**
	 * Current route matching with current URL
	 */
	protected _currentRouteMatch	:IRouteMatch;
	get currentRouteMatch ():IRouteMatch { return this._currentRouteMatch; }

	/**
	 * When current route is changing
	 */
	protected _onRouteChanged		:Signal				= new Signal();
	get onRouteChanged ():Signal { return this._onRouteChanged; }

	/**
	 * When route is not found
	 */
	protected _onNotFound			:Signal				= new Signal();
	get onNotFound ():Signal { return this._onNotFound; }



	// ------------------------------------------------------------------------- INIT

	/**
	 * Router constructor.
	 * Please use before accessing with singleton static methods.
	 * @param pBase The base of the app from the server. @see Router.base
	 * @param pRoutes List of declared routes.
	 */
	constructor (pBase:string = '', pRoutes:IRoute[] = null)
	{
		// Register instance
		Router.__INSTANCE = this;

		// Set base
		this.base = pBase;

		// Add routes
		this.addRoutes(pRoutes);

		// Listen to popstate
		window.addEventListener('popstate', this.popStateHandler );
	}


	// ------------------------------------------------------------------------- LINKS LISTENING

	/**
	 * Listen links to fire internal router.
	 * Default signature is a[data-internal-link]
	 * @param pLinkSignature Signature to listen.
	 */
	listenLinks (pLinkSignature = 'a[data-internal-link]')
	{
		$(document).on( 'click', pLinkSignature, this.linkClickedHandler );
	}

	/**
	 * When an internal link is clicked.
	 * @param pEvent
	 */
	protected linkClickedHandler = (pEvent:JQueryEventObject) =>
	{
		// Do not follow link
		pEvent.preventDefault();

		// Cibler le lien dans la DOM
		let $target = $( pEvent.currentTarget );

		// Get href
		let fullPath = $target.attr('href');

		// Do not go further if link does exists
		if (fullPath == null) return;

		// FIXME : Faire une fonction pour faire un replaceState ? Utile ?

		// Follow link
		this.openURL( fullPath );
	};


	// ------------------------------------------------------------------------- ANALYTICS

	// If this is our first track, because we have to ignore it
	protected _firstPageView = true;

	/**
	 * Track current page for google analytics
	 */
	protected trackCurrentPage ()
	{
		// Do not track first page view because we already fired it from DOM
		if (this._firstPageView)
		{
			this._firstPageView = false;
			return;
		}

		console[('ga' in window ? 'info' : 'warn')]('Router.trackingPage // ' + this._currentPath);

		// FIXME : Vérifier que c'est bien _currentPath qu'il faut envoyer ou alors le path sans base ?

		// Si la librairie est chargée
		if ('ga' in window)
		{
			// Signaler à google analytics
			window['ga']('send', 'pageview', this._currentPath);
		}
	}


	// ------------------------------------------------------------------------- ROUTE INIT

	/**
	 * Register new set of routes.
	 * Will be added to previously registered routes.
	 * @param pRoutes
	 */
	addRoutes (pRoutes:IRoute[])
	{
		// Do nothing if no routes
		if (pRoutes == null) return;

		// Add all routes
		pRoutes.map((route:IRoute) =>
		{
			// Prepare route
			this.prepareRoute( route );

			// Add route
			this._routes.push( route );
		});
	}

	/**
	 * Prepare route regex to optimise route matching phase.
	 * @param pRoute Route to prepare.
	 */
	protected prepareRoute (pRoute:IRoute)
	{
		// Check route config
		if (pRoute.page == null || pRoute.page == '')
		{
			throw new Error(`Router.prepareRoute // Invalid route "${pRoute.url}", property "page" have to be not null ans not empty.`);
		}

		// Default action to "index"
		if (pRoute.action == null || pRoute.action == '')
		{
			pRoute.action = 'index';
		}

		// Default stack to "main"
		if (pRoute.stack == null || pRoute.stack == '')
		{
			pRoute.stack = 'main';
		}

		// Get url shortcut
		let url = pRoute.url;

		// Index to detect params boundaries
		let start = url.indexOf( Router.LEFT_PARAMETERS_DELIMITER );
		let end = 0;

		// Initialize the new pattern for quick detection
		let pattern = '';

		// Setup route parameters name for matching
		pRoute._matchingParameter = [];

		// Check if we have another incomming parameter on the route pattern declaration
		while (start != -1 && end != -1)
		{
			// Get boundaries for this param
			start = url.indexOf( Router.LEFT_PARAMETERS_DELIMITER );
			end = url.indexOf( Router.RIGHT_PARAMETER_DELIMITER );

			// Get parameter name and store it inside route for matching
			pRoute._matchingParameter.push( url.substring(start + 1, end) );

			// Add parameter flag to replace with regex down bellow
			pattern += url.substring(0, start) + '%%PARAMETER%%';

			// Cut the hash for the next param detection iteration
			url = url.substring(end + 1, url.length);
			start = url.indexOf( Router.LEFT_PARAMETERS_DELIMITER );
		}

		// Add the end of pattern to the detect pattern
		pattern += url.substring(0, url.length);

		// Replace regex reserved chars on pattern
		// We do it before parameter flag this is important, to avoid doubling escaping
		pattern = pattern
			.replace(/\./g, '\\.')
			.replace(/\+/g, '\\+')
			.replace(/\*/g, '\\*')
			.replace(/\$/g, '\\$')
			.replace(/\/$/, '/?'); // Optional last slash

		// Remplace all parameter flag to corresponding regex for parameter detection
		pattern = pattern.replace(new RegExp("(\%\%PARAMETER\%\%)", 'g'), Router.PARAMETER_RULE);

		// Convert it to regex and store it inside route
		pRoute._matchingRegex = new RegExp(`^${pattern}$`);
	}

	// ------------------------------------------------------------------------- STACK MANAGEMENT

	// Stacks by names
	protected _stacks		:{ [index:string] : IPageStack } 	= {};

	/**
	 * Register a pageStack by name to manage pages with declared routes.
	 * @param pStackName Name of the stack.
	 * @param pStack Instance of the stack.
	 */
	registerStack (pStackName:string, pStack:IPageStack)
	{
		// Check errors
		if (pStackName in this._stacks)
		{
			throw new Error(`Router.registerStack // Stack ${pStackName} already registered`);
		}
		if (pStack == null)
		{
			throw new Error(`Router.registerStack // Can't register a null stack.`);

		}

		// Record instance by name
		this._stacks[ pStackName ] = pStack;
	}

	/**
	 * Return stack instance by its name.
	 * Will not throw anything but can return null
	 * @param pStackName Name of the stack we need
	 * @returns {IPageStack} Can return null if pageStack not found
	 */
	getStackByName (pStackName:string):IPageStack
	{
		return (
			(pStackName in this._stacks)
			? this._stacks[ pStackName ]
			: null
		);
	}

	// ------------------------------------------------------------------------- ROUTE IS CHANGING

	/**
	 * When state is popped.
	 * @param pEvent
	 */
	popStateHandler = (pEvent:Event) =>
	{
		// Update route
		this.updateCurrentRoute();
	};

	/**
	 * State is changed, update current route.
	 */
	updateCurrentRoute ()
	{
		// If router is running
		if (this._isStarted)
		{
			// Record path
			this._currentPath = location.pathname;

			// Track analytics
			this.trackCurrentPage();

			console.info('Router.updateCurrentRoute // Route', this._currentPath);

			// Convert URL to route and store it
			this._currentRouteMatch = this.URLToRoute( this._currentPath );

			// If our route is not found
			if (this._currentRouteMatch == null)
			{
				// Dispatch not found
				this._onNotFound.dispatch();

				// If we have a main stack
				let mainStack = this.getStackByName('main');

				// Show notFound page
				if (mainStack != null)
				{
					mainStack.showPage('NotFoundPage', 'index', {});
				}
			}

			// Route is found
			else
			{
				// Dispatch and give route
				this._onRouteChanged.dispatch( this._currentRouteMatch );

				// Check if we have original route hidden
				if (this._currentRouteMatch._fromRoute != null)
				{
					// Check if we have an handler
					if (this._currentRouteMatch._fromRoute.handler != null)
					{
						// Call handler with route match
						this._currentRouteMatch._fromRoute.handler( this._currentRouteMatch );
					}
				}

				// Get stack from route match
				let stack = this.getStackByName( this._currentRouteMatch.stack );

				// Check if stack exists if this is not the main stack
				if (this._currentRouteMatch.stack != 'main' && stack == null)
				{
					throw new Error(`Router.updateCurrentRoute // Stack ${this._currentRouteMatch.stack} is not registered.`);
				}

				// Show page on stack
				(stack != null) && stack.showPage(
					this._currentRouteMatch.page,
					this._currentRouteMatch.action,
					this._currentRouteMatch.parameters
				);
			}
		}
	}


	// ------------------------------------------------------------------------- URL / ROUTE CONVERTING

	/**
	 * Prepare URL to be compatible with router from several formats :
	 * - With or without base
	 * - With or without leading slash
	 * - Relative or absolute link
	 * - With or without protocol
	 * @param pURL : URL to be prepared for router.
	 * @returns {string} Prepared URL for router.
	 */
	prepareURL (pURL:string):string
	{
		// Detect if link is absolute
		let doubleSlashIndex = pURL.indexOf('//');
		if (doubleSlashIndex >= 0 && doubleSlashIndex < 7)
		{
			// Remove protocol and domain from URL
			let firstSlashIndex = pURL.indexOf('/', doubleSlashIndex + 2);
			pURL = pURL.substr(firstSlashIndex, pURL.length);
		}

		// Force leading slash on URL
		pURL = StringUtils.leadingSlash(pURL, true);

		// If our URL doesn't include base
		if (pURL.indexOf(this._base) != 0)
		{
			// Add base to URL
			pURL = this._base + StringUtils.leadingSlash(pURL, false);
		}

		// Return prepared URL
		return pURL;
	}

	/**
	 * Convert an URL to a route match.
	 * URL will be prepared to be compatible. @see Router.prepareURL
	 */
	URLToRoute (pURL:string):IRouteMatch
	{
		// Convert URL
		pURL = this.prepareURL( pURL );

		// Remove base from path and add leading slash
		let pathWithoutBase = StringUtils.leadingSlash(pURL.split(this._base, 2)[1], true);

		// The found route to return
		let foundRoute:IRouteMatch;

		// Browse routes
		this._routes.every( (route) =>
		{
			// Exec route prepared regex with current path
			let routeExec = route._matchingRegex.exec( pathWithoutBase );

			// If route can be compatible
			if (routeExec != null)
			{
				// Remove url and other stuff from result to get only parameters values
				routeExec.shift();
				delete routeExec.input;
				delete routeExec.index;

				// Map params indexed array to named object
				let parameters:IActionParameters = {};
				for (let k in routeExec)
				{
					parameters[route._matchingParameter[k]] = routeExec[k];
				}

				// Create route match object and configure it from route
				foundRoute = {
					page		: route.page,
					action		: route.action,
					stack		: route.stack,
					parameters	: parameters
				};

				// Hide from route to have access to handler
				foundRoute._fromRoute = route;

				// We found our route, do not continue
				return false;
			}

			// Not the good route, continue...
			else return true;
		});

		// Return found route
		return foundRoute;
	}

	/**
	 * Convert a matching route to its triggering URL.
	 * @param pRouteMatch Matching route to satisfy. Parameters will be slugified.
	 * @param pPrependBase If we have to prepend base before generated URL. Default is true.
	 * @returns {any} Can be null if route not found.
	 */
	routeToURL (pRouteMatch:IRouteMatch, pPrependBase = true):string
	{
		// Default properties for route match
		// Default action to "index"
		if (pRouteMatch.action == null || pRouteMatch.action == '')
		{
			pRouteMatch.action = 'index';
		}

		// Default stack to "main"
		if (pRouteMatch.stack == null || pRouteMatch.stack == '')
		{
			pRouteMatch.stack = 'main';
		}

		// Default parameters to empty object
		if (pRouteMatch.parameters == null)
		{
			pRouteMatch.parameters = {};
		}

		// Returned found URL
		let foundURL:string;

		// Browse routes
		this._routes.every( (route) =>
		{
			// Check if this route is ok with this match
			if (
					// Check page
					route.page == pRouteMatch.page
					&&
					// Check action
					route.action == pRouteMatch.action
					&&
					// Check stack
					route.stack == pRouteMatch.stack
				)
			{
				// Check parameters
				for (let i in pRouteMatch.parameters)
				{
					if (!ArrayUtils.inArray(route._matchingParameter, i))
					{
						return true;
					}
				}

				// Replace parameters and slugify them
				foundURL = route.url.replace(
					Router.PARAMETER_REPLACE_RULE, function (i, pMatch)
					{
						// Target matched param
						let matchedParam = pRouteMatch.parameters[pMatch];

						// Slugify it if this is a string only
						return (
							(typeof(matchedParam) == 'number')
							? matchedParam
							: StringUtils.slugify(
								(pRouteMatch.parameters[pMatch] as string)
							)
						);
					}
				);

				// Search is finished
				return false;
			}

			// Continue searching
			else return true;
		});

		// Not found, return null
		if (foundURL == null) return null;

		// Return found URL
		return (
			pPrependBase
			? this._base + StringUtils.leadingSlash(foundURL, false)
			: foundURL
		);
	}


	// ------------------------------------------------------------------------- CHANGE ROUTE

	/**
	 * Open an URL with pushState or replaceState methods.
	 * Will trigger popState event.
	 * Only for application internal links.
	 * URL will be prepared to be compatible. @see Router.prepareURL
	 * @param pURL Link to open, from server base or absolute.
	 * @param pAddToHistory If we have to add this link to users history (default is yes)
	 */
	openURL (pURL:string, pAddToHistory = true)
	{
		// Prepare URL to be compatible
		pURL = this.prepareURL( pURL );

		// Change URL and add to history or replace
		pAddToHistory
		? window.history.pushState(null, null, pURL)
		: window.history.replaceState(null, null, pURL);

		// Update route
		this.updateCurrentRoute();
	}

	/**
	 * Open a page with pushState or replaceState methods.
	 * Will trigger popState event.
	 * @param pRouteMatch Route to satisfy
	 * @param pAddToHistory If we have to add this link to users history (default is yes)
	 * @throws Error if route not found.
	 */
	openPage (pRouteMatch:IRouteMatch, pAddToHistory = true)
	{
		// Get URL from this route
		let url = this.routeToURL( pRouteMatch );

		// Throw error if URL is not found for this route
		if (url == null)
		{
			// TODO : Doit-on déclancher une erreur / balancer un notFound / console.error / ignorer ?
			throw new Error(`Router.openPage // Route not found.`);
		}

		// Open URL
		this.openURL( url, pAddToHistory );
	}


	// ------------------------------------------------------------------------- ENGINE

	/**
	 * Start route changes listening.
	 */
	start ()
	{
		this._isStarted = true;
		this.updateCurrentRoute();
	}

	/**
	 * Stop router from listening route changes.
	 */
	stop ()
	{
		this._isStarted = false;
	}
}
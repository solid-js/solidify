import {Disposable} from "./Disposable";

import {DependencyManager} from "../helpers/DependencyManager";
import {Config} from "./Config";

/**
 * Basic app parameters.
 * Can be extended to allow more parameters.
 */
export interface IAppParams
{
	env					:string;
	root				:JQuery;
	locale				:any;
	localeAndCountry	:string;
	base				:string;
}


export class App<AppParamsType> extends Disposable
{
	// ------------------------------------------------------------------------- STATICS


	// ------------------------------------------------------------------------- PROPERTIES

	/**
	 * Dependency manager to bind elements between them without hard coding dependencies.
	 */
	protected _dependencyManager              :DependencyManager;
	get dependencyManager ():DependencyManager { return this._dependencyManager; }


	// ------------------------------------------------------------------------- INIT

	/**
	 * App constructor.
	 * No need to override if there is no specific AppParams to add.
	 * @param pAppParams specify params at app construction. See IAppParams.
	 */
	constructor (pAppParams:AppParamsType)
	{
		// Relay
		super();

		// Patch de app base on parameters
		this.patchAppBase(pAppParams);

		// Init app parameters
		this.initConfig(pAppParams);

		// Init dependencies managment
		this.initDependencyManager();
		this.initDependencies();

		// Listen to app resize
		this.initAppResizeListening();

		// Start modules preparation
		this.initModulePreloading();
	}

	/**
	 * Inject app params into Config
	 * @param pAppParams specify params at app construction. See IAppParams.
	 */
	protected initConfig (pAppParams:AppParamsType)
	{
		Config.instance.inject(pAppParams)
	}

	/**
	 * Patch the base parameter from app params.
	 * Will check the base meta if base is not provided from constructor.
	 */
	protected patchAppBase (pAppParams:AppParamsType):void
	{
		// If we don't have base param
		if (!('base' in pAppParams))
		{
			// Target base meta tag
			var $baseMeta = $('head > base');

			// If we have one, get base from this meta
			if ($baseMeta.length > 0)
			{
				pAppParams['base'] = $baseMeta.attr('href');
			}
		}
	}


	// ------------------------------------------------------------------------- DEPENDENCY MANAGER

	initDependencyManager ():void
	{
		this._dependencyManager = DependencyManager.getInstance();
	}

	initDependencies ():void
	{
		throw new Error(`App.initDependencies // This method is strategy and have to be override.`);
	}


	// ------------------------------------------------------------------------- MODULES LOADING

	initModulePreloading ():void
	{
		this.dependencyManager.updateModuleCache((pLoadedModules) =>
		{
			// Init route managment
			this.initBootstrap();
			this.initRouterManager();
			this.initRoutes();

			// Our app is ready
			this.ready();
		});
	}


	// ------------------------------------------------------------------------- ROUTING

	initBootstrap ():void
	{
		//this._mainBootstrap = new Bootstrap(this.appNamespace);
	}

	initRouterManager ():void
	{
		//this._router = Router.getInstance();

		//this._router.onRouteChanged.add(this, this.routeChangedHandler);
		//this._router.onRouteNotFound.add(this, this.routeNotFoundHandler);
	}

	routeNotFoundHandler ():void { }

	routeChangedHandler ():void { }

	initRoutes ():void
	{
		// todo : throw error strategy
	}

	// ------------------------------------------------------------------------- APP RESIZE

	initAppResizeListening ():void
	{
		/*
		 $(window).resize(() =>
		 {
		 Central.getInstance("app").dispatch("resize");
		 });
		 */
	}


	// ------------------------------------------------------------------------- READY

	ready ():void { }
}

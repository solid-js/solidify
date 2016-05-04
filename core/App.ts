import {Disposable} from "./Disposable";

import {DependencyManager} from "../helpers/DependencyManager";
import {Config} from "./Config";
import {EnvUtils} from "../utils/EnvUtils";

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
	 * App parameters. Shorthand for Config.param as reference.
	 */
	protected _params			:AppParamsType;

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
		this.initModules();
		this.initDependencies();

		// Init env stuff
		this.initEnv();

		// Start modules preparation
		this.dependencyManager.updateModuleCache((pLoadedModules) =>
		{
			// Listen to app resize
			this.initAppResizeListening();

			// Init app view before routes
			this.initAppView();

			// Init boostrap managment
			this.initBootstrap();

			// Init routes
			this.initRoutes();

			// Our app is ready
			this.ready();
		});
	}

	/**
	 * Inject app params into Config
	 * @param pAppParams specify params at app construction. See IAppParams.
	 */
	protected initConfig (pAppParams:AppParamsType)
	{
		// Store in config
		Config.instance.inject(pAppParams);

		// Get reference
		this._params = Config.getAll<AppParamsType>();
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


	// ------------------------------------------------------------------------- ENV

	/**
	 * Init env dependent stuff.
	 * Will add env detection classes helpers to the body.
	 * Can be overrided.
	 */
	protected initEnv ():void
	{
		EnvUtils.addClasses();
	}


	// ------------------------------------------------------------------------- DEPENDENCY MANAGER

	/**
	 * Init dependency manager.
	 * No need to override it.
	 */
	protected initDependencyManager ():void
	{
		this._dependencyManager = DependencyManager.getInstance();
	}

	/**
	 * Init module path declarations.
	 */
	protected initModules ():void
	{
		throw new Error(`App.initModules // Please override App.initModule method to register module paths using DependencyManager.registerModulePath.`);
	}

	/**
	 * Init app dependencies.
	 */
	protected initDependencies ():void
	{
		throw new Error(`App.initDependencies // Please override App.initDependencies to map app dependencies using DependencyManager.registerClass or DependencyManager.registerInstance.`);
	}

	// ------------------------------------------------------------------------- APP VIEW

	/**
	 * Init app view.
	 * Called before routes initialisation to have appView instance available in routes delcarations.
	 */
	protected initAppView ():void
	{
		throw new Error(`App.initAppView // Please override App.initAppView to create application main view.`);
	}

	// ------------------------------------------------------------------------- ROUTING

	/**
	 * Init bootstrap
	 */
	protected initBootstrap ():void
	{
		// TODO : Mapper le bootstrap sur l'appView pour automatiser le truc
		//this._mainBootstrap = new Bootstrap(this.appNamespace);
	}

	protected routeNotFoundHandler ():void { }

	protected routeChangedHandler ():void { }

	/**
	 * Init routes
	 */
	protected initRoutes ():void
	{
		// TODO : Initialiser les routes via la classe Router, qui elle même compose Bootstrap et utilise Grapnel
		throw new Error(`App.initRoutes // Please override App.initRoutes to map app routes.`);
	}

	// ------------------------------------------------------------------------- APP RESIZE

	/**
	 * Init app resizing listening
	 */
	protected initAppResizeListening ():void
	{
		// TODO : Maper ça sur le nouveau Central
		/*
		 $(window).resize(() =>
		 {
		 Central.getInstance("app").dispatch("resize");
		 });
		 */
	}


	// ------------------------------------------------------------------------- READY

	/**
	 * When all the app is ready
	 */
	protected ready ():void { }
}

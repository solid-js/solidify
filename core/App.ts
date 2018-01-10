import {Disposable} from "./Disposable";
import {EnvUtils} from "../utils/EnvUtils";

export class App extends Disposable
{
	// ------------------------------------------------------------------------- STATICS


	// ------------------------------------------------------------------------- PROPERTIES

	// ------------------------------------------------------------------------- INIT

	/**
	 * App constructor.
	 * No need to override if there is no specific AppParams to add.
	 */
	constructor ()
	{
		// Relay
		super();

		// Init app config
		this.initConfig();

		// Init env stuff
		this.initEnv();

		// Init routes
		this.initRoutes();

		// Init app view before routes
		this.initAppView();

		// Our app is ready
		this.ready();
	}

	/**
	 * Init configuration.
	 * Can be overridden.
	 */
	protected initConfig ()
	{
		// Can be overridden
	}


	// ------------------------------------------------------------------------- ENV

	/**
	 * Init env dependent stuff.
	 * Will add env detection classes helpers to the body.
	 * Can be overridden.
	 */
	protected initEnv ():void
	{
		EnvUtils.addClasses();
	}


	// ------------------------------------------------------------------------- ROUTING

	/**
	 * Init routes
	 */
	protected initRoutes ():void
	{
		throw new Error(`App.initRoutes // Please override App.initRoutes to map app routes.`);
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


	// ------------------------------------------------------------------------- READY

	/**
	 * When all the app is ready
	 */
	protected ready ():void { }
}
import {Disposable} from "./Disposable";
import {EnvUtils} from "../utils/EnvUtils";

export class App extends Disposable
{
	// ------------------------------------------------------------------------- INIT

	/**
	 * App constructor.
	 * @param {boolean} pInitSequence if true, will go through prepare and init method. If false, it will directly go to ready.
	 */
	constructor ( pInitSequence:boolean )
	{
		// Relay
		super();

		// Launch init sequence
		if ( pInitSequence )
		{
			// Prepare app
			this.prepare();

			// Init app config
			this.initConfig();

			// Init env stuff
			this.initEnv();

			// Init routes
			this.initRoutes();
		}

		// Our app is ready
		this.ready();
	}

	/**
	 * Prepare App.
	 * Can be overridden.
	 */
	protected prepare ()
	{

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


	// ------------------------------------------------------------------------- READY

	/**
	 * When all the app is ready
	 */
	protected ready ():void { }
}
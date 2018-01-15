import {Disposable} from "./Disposable";

export class App extends Disposable
{
	// ------------------------------------------------------------------------- INIT

	/**
	 * App constructor.
	 * Set pInitSequence if this is an Hot Module Reloading trigger.
	 * @param {boolean} pInitSequence if true, will go through init method. If false, it will directly go to prepare and ready.
	 */
	constructor ( pInitSequence:boolean )
	{
		// Relay
		super();

		// Prepare app
		this.prepare();

		// Launch init sequence
		if ( pInitSequence )
		{
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

	}


	// ------------------------------------------------------------------------- ENV

	/**
	 * Init env dependent stuff.
	 * Can be overridden.
	 */
	protected initEnv ():void
	{

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
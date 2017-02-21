import {Disposable} from "./Disposable";

/**
 * This is a simple JQuery based view.
 */
export class JView extends Disposable
{
	// ------------------------------------------------------------------------- DOM

	// Starting node of our component
	$root			:JQuery;

	// ------------------------------------------------------------------------- INIT

	constructor ($pRoot:JQuery = null)
	{
		// Relay
		super();

		// Set root from parameter
		if ($pRoot != null)
		{
			this.$root = $pRoot;
		}

		// Initialise
		this.init();
	}

	/**
	 * Start init sequence
	 */
	protected init ()
	{
		this.prepareDependencies();
		this.beforeInit();
		this.targetRoot();
		this.prepareNodes();
		this.prepareEvents();
		this.afterInit();
		this.initComponents();
	}

	/**
	 * Prepare dependencies with DependenciyManager
	 */
	protected prepareDependencies () {}

	/**
	 * Middleware called just before init sequence
	 */
	protected beforeInit () { }

	/**
	 * Target our root if not already defined via constructor params
	 */
	protected targetRoot () { }

	/**
	 * Prepare node targeting from $root
	 */
	protected prepareNodes () { }

	/**
	 * Prepare events
	 */
	protected prepareEvents () { }

	/**
	 * Middleware called just after init sequence
	 */
	protected afterInit () { }

	/**
	 * Init components after init
	 */
	protected initComponents () {}
}
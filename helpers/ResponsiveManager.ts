import {Signal} from "./Signal";

/**
 - !!! Trouver un moyen de mutualiser les valeurs de breakpoint. Depuis CSS vers JS ? Un fichier Properties.js ?
 - Une sorte de ResponsiveManager qui balance des signaux / event ça pourrait être cool car comme ça on peut setState les react
 - ResponsiveManager.configure(...) sinon voir si on peut pas injecter depuis less une div ou autre qui a les props qu'on peut lire en JS
 - S'inspirer de ça : https://github.com/contra/react-responsive
 - Faudrait une sorte de block react if / else pour que ça soit plus pratique
 */


/**
 * A breakpoint.
 * Can be created in plain javascript for more usability.
 * All parameters are mandatory.
 */
export interface IBreakpoint
{
	orientation		:EOrientation;
	from			:number;
	name			:EBreakpointName;
}

/**
 * Orientation, for breakpoints too ;)
 */
export enum EOrientation
{
	HORIZONTAL,
	VERTICAL
}

/**
 * Pre-created sizes.
 * You can use either abstract or concrete naming.
 */
export enum EBreakpointName
{
	// Abstract paradigm
	TINY,
	EXTRA_SMALL,
	SMALL,
	MEDIUM,
	LARGE,
	EXTRA_LARGE,
	GIGANTIC,

	// Concrete paradigm
	MOBILE,
	TABLET,
	DESKTOP
}

export class ResponsiveManager
{
	// ------------------------------------------------------------------------- SINGLETON

	// Our singleton instance
	protected static __INSTANCE	:ResponsiveManager;

	/**
	 * Get responsive manager instance.
	 * @returns {ResponsiveManager}
	 */
	static get instance ():ResponsiveManager
	{
		// If instance does'n exists
		if (ResponsiveManager.__INSTANCE == null)
		{
			// Create a new one
			ResponsiveManager.__INSTANCE = new ResponsiveManager();
		}

		// Return instance
		return ResponsiveManager.__INSTANCE;
	}


	// ------------------------------------------------------------------------- PROPERTIES

	/**
	 * All registered breakpoints, horizontal and vertical.
	 * Can be unordered, breakpoint matching algorithm doesn't need ordered breakpoints.
	 */
	protected _breakpoints						:IBreakpoint[] = [];
	get breakpoints ():IBreakpoint[] { return this._breakpoints }

	/**
	 * When horizontal breakpoint changed after window resize.
	 */
	protected _onHorizontalBreakpointChanged	:Signal 		= new Signal();
	get onHorizontalBreakpointChanged ():Signal { return this._onHorizontalBreakpointChanged; }

	/**
	 * When vertical breakpoint changed after window resize.
	 */
	protected _onVerticalBreakpointChanged		:Signal 		= new Signal();
	get onVerticalBreakpointChanged ():Signal { return this._onVerticalBreakpointChanged; }

	/**
	 * When orientation has changed.
	 */
	protected _onOrientationChanged				:Signal 		= new Signal();
	get onOrientationChanged ():Signal { return this._onOrientationChanged; }

	/**
	 * When window size has changed.
	 */
	protected _onWindowSizeChanged					:Signal 		= new Signal();
	get onWindowSizeChanged ():Signal { return this._onWindowSizeChanged; }

	/**
	 * Current window width
	 */
	protected _currentWindowWidth				:number;
	get currentWindowWidth ():number { return this._currentWindowWidth; }

	/**
	 * Current window height
	 */
	protected _currentWindowHeight				:number;
	get currentWindowHeight ():number { return this._currentWindowHeight; }

	/**
	 * Current horizontal breakpoint.
	 * Can be null if breakpoints are not registered correctly.
	 */
	protected _currentHorizontalBreakpoint		:IBreakpoint;
	get currentHorizontalBreakpoint ():IBreakpoint { return this._currentHorizontalBreakpoint; }

	/**
	 * Current vertical breakpoint.
	 * Can be null if breakpoints are not registered correctly.
	 */
	protected _currentVerticalBreakpoint		:IBreakpoint;
	get currentVerticalBreakpoint ():IBreakpoint { return this._currentVerticalBreakpoint; }

	/**
	 * Current orientation.
	 * Orientation is defined by ratio between screen width and screen height.
	 * No native orientation API used.
	 */
	protected _currentOrientation				:EOrientation;
	get currentOrientation ():EOrientation { return this._currentOrientation; }


	// ------------------------------------------------------------------------- INIT

	/**
	 * Responsive Manager constructor.
	 */
	constructor ()
	{
		this.initEventsListening();
	}

	/**
	 * Init events listening
	 */
	protected initEventsListening ()
	{
		// Listen window size changing
		$(window).on( 'resize', this.windowResizeHandler.bind(this) );

		// Dispatch first resize to have breakpoints
		// without dispatching signals to avoid breakpoint the app
		this.windowResizeHandler( null );
	}


	// ------------------------------------------------------------------------- HANDLERS

	/**
	 * When the app window is resized.
	 * Will measure window and then update current breakpoints from those sizes.
	 * @param pEvent Will dispatch signals if this event is not null
	 */
	protected windowResizeHandler (pEvent:JQueryEventObject)
	{
		// Register window size
		this._currentWindowWidth = $(window).width();
		this._currentWindowHeight = $(window).height();

		// Dispatch new window size if we have an evet
		if (pEvent != null)
		{
			this._onWindowSizeChanged.dispatch(
				this._currentWindowWidth,
				this._currentWindowHeight
			);
		}

		// Update current breakpoints and orientation from those sizes
		// And dispatch signals only if this method is dispatched from an event
		this.updateCurrentBreakpoints( pEvent != null );
		this.updateCurrentOrientation( pEvent != null );
	}


	// ------------------------------------------------------------------------- ORIENTATION DETECTION

	/**
	 * Update current orientation and dispatch signals if needed.
	 * @param pDispatchSignal Dispatch signals if true
	 */
	protected updateCurrentOrientation ( pDispatchSignal:boolean )
	{
		// Compute new orientation from window sizes
		let newOrientation = (
			(this._currentWindowWidth > this._currentWindowHeight)
			? EOrientation.HORIZONTAL
			: EOrientation.VERTICAL
		);

		// If orientation changed
		if (newOrientation != this._currentOrientation)
		{
			// Registrer new orientation
			this._currentOrientation = newOrientation;

			// Dispatch if needed
			pDispatchSignal && this._onOrientationChanged.dispatch( newOrientation );
		}
	}


	// ------------------------------------------------------------------------- BREAKPOINT DETECTION

	/**
	 * Update current breakpoints and dispatch signals if needed.
	 * @param pDispatchSignal Dispatch signals if true
	 */
	protected updateCurrentBreakpoints ( pDispatchSignal:boolean )
	{
		// New breakpoints from new window size
		let newHorizontalBreakpoint	:IBreakpoint = null;
		let newVerticalBreakpoint	:IBreakpoint = null;

		// Browse all breakpoints
		this._breakpoints.map( (breakpoint) =>
		{
			// Get nearest horizontal breakpoint
			if (
					// Check orientation
					breakpoint.orientation == EOrientation.HORIZONTAL

					// If this breakpoint si near to window size
					&& this._currentWindowWidth > breakpoint.from

					// And if this breakpoint is bigger than previous nearest one
					&& (
						newHorizontalBreakpoint == null
						||
						breakpoint.from > newHorizontalBreakpoint.from
					)
				)
			{
				// We store this breakpoint as the nearest horizontal one for now
				newHorizontalBreakpoint = breakpoint;
			}

			// Get nearest vertical breakpoint
			if (
					// Check orientation
					breakpoint.orientation == EOrientation.VERTICAL

					// If this breakpoint si near to window size
					&& this._currentWindowHeight > breakpoint.from

					// And if this breakpoint is bigger than previous nearest one
					&& (
						newVerticalBreakpoint == null
						||
						breakpoint.from > newVerticalBreakpoint.from
					)
				)
			{
				// We store this breakpoint as the nearest vertical one for now
				newVerticalBreakpoint = breakpoint;
			}
		});

		// If horizontal breakpoint changed
		if (this._currentHorizontalBreakpoint != newHorizontalBreakpoint)
		{
			// Get old for signal and register new one
			let oldBreakpoint = this._currentHorizontalBreakpoint;
			this._currentHorizontalBreakpoint = newHorizontalBreakpoint;

			// Dispatch if needed
			if ( pDispatchSignal )
			{
				this._onHorizontalBreakpointChanged.dispatch(
					newHorizontalBreakpoint,
					oldBreakpoint
				);
			}
		}

		// If vertical breakpoint changed
		if (this._currentVerticalBreakpoint != newVerticalBreakpoint)
		{
			// Get old for signal and register new one
			let oldBreakpoint = this._currentVerticalBreakpoint;
			this._currentVerticalBreakpoint = newVerticalBreakpoint;

			// Dispatch if needed
			if ( pDispatchSignal )
			{
				this._onVerticalBreakpointChanged.dispatch(
					newVerticalBreakpoint,
					oldBreakpoint
				);
			}
		}
	}


	// ------------------------------------------------------------------------- BREAKPOINTS CONFIG

	/**
	 * Register a new set of breakpoints.
	 * Can be unordered and have to contains either horizontal and vertical breakpoints.
	 * @param pBreakpoints List of breakpoints as JSON formatted object.
	 */
	public setBreakpoints (pBreakpoints:IBreakpoint[])
	{
		// Register breakpoints
		this._breakpoints = pBreakpoints;

		// Dispatch first resize to have breakpoints
		// without dispatching signals to avoid breakpoint the app
		this.windowResizeHandler( null );
	}
}
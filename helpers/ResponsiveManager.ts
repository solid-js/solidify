import {Signal} from "./Signal";
import {StringUtils} from "../utils/StringUtils";
import {DOMUtils} from "../utils/DOMUtils";

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
	PHABLET,
	TABLET,
	LAPTOP,
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
	 * @important Please use horizontalLessThan and horizontalMoreThan instead of this
	 * to check breakpoints when building views.
	 * Those methods are stronger in case you add a breakpoint further in time.
	 */
	protected _currentHorizontalBreakpoint		:IBreakpoint;
	get currentHorizontalBreakpoint ():IBreakpoint { return this._currentHorizontalBreakpoint; }

	/**
	 * Current vertical breakpoint.
	 * Can be null if breakpoints are not registered correctly.
	 * @important Please use verticalLessThan and verticalMoreThan instead of this
	 * to check breakpoints when building views.
	 * Those methods are stronger in case you add a breakpoint further in time.
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
		// without dispatching signals to avoid breaking the app
		this.windowResizeHandler( null );
	}

	/**
	 * Auto set breakpoints from LESS.
	 * In fact less2js grunt plugin will convert less properties to JSON.
	 * This JSON file is loaded and parsed.
	 *
	 * Note that breakpoints have to be named like so :
	 * "breakpoints-%orientation%-%breakpointName%"
	 *
	 * %orientation% have to be camelCase version of EOrientation
	 * %breakpointName% have to be camelCase version of EBreakpointName.
	 *
	 * Values have to be as string in px.
	 *
	 * Ex, a valid breakpoint (in JSON :
	 * "breakpoint-vertical-extraSmall" : "320px"
	 *
	 * Will throw an error if JSON file is not found in JsonFiles registry.
	 *
	 * @param pJSONPath You can change JSON path if needed.
	 */
	public autoSetBreakpointsFromLess (pJSONPath = 'src/common/config/Atoms')
	{
		// Check if this JsonFile exists
		if (!(pJSONPath in JsonFiles))
		{
			throw new Error(`ResponsiveManager.autoSetBreakpointsFromLess // Json ${pJSONPath} not found in JsonFiles registry.`);
		}

		// Target breakpoints data
		let lessBreakpoints = JsonFiles[pJSONPath];

		// Browse orientations
		let orientationIndex = -1;
		while (++orientationIndex in EOrientation)
		{
			// Get orientation name
			let orientationEnumName = EOrientation[ orientationIndex ];
			let orientationCamelName = StringUtils.snakeToCamelCase(orientationEnumName, '_');

			// Browse breakpoints for each orientation
			let breakpointIndex = -1;
			while (++breakpointIndex in EBreakpointName)
			{
				// Get breakpoint name
				let breakpointEnumName = EBreakpointName[ breakpointIndex ];
				let breakpointCamelName = StringUtils.snakeToCamelCase(breakpointEnumName, '_');

				// Name of this breakpoint and orientation inside less file
				let lessVarName = 'breakpoint-' + orientationCamelName + '-' + breakpointCamelName;

				// If this variable exists
				if ( lessVarName in lessBreakpoints )
				{
					// Add breakpoint inside registry
					this._breakpoints.push({

						// Orientation back to enum format
						orientation: EOrientation[ orientationEnumName ],

						// Name back to enum format
						name : EBreakpointName[ breakpointEnumName ],

						// Parse value and extract pixel value
						from : DOMUtils.cssToNumber(
							lessBreakpoints[ lessVarName ]
						)[0]
					});
				}
			}
		}

		// Dispatch first resize to have breakpoints
		// without dispatching signals to avoid breaking the app
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


	// ------------------------------------------------------------------------- BREAKPOINT HELPERS

	/**
	 * Get a registered breakpoint as IBreakpoint from it's breakpoint name and orientation.
	 * IBreakpoint instance will be the same reference as the registered one.
	 * Will returns null if not found.
	 * @param pOrientation Orientation of the breakpoint we want to get
	 * @param pBreakpointName Breakpoint's name
	 * @returns {IBreakpoint} Reference of registered IBreakpoint. Can be null.
	 */
	protected getBreakpointFromNameAndOrientation (pOrientation:EOrientation, pBreakpointName:EBreakpointName):IBreakpoint
	{
		// Filter only matching breakpoints
		let matchingBreakpoints = this._breakpoints.filter( (breakpoint:IBreakpoint) =>
		{
			return (
				// Check orientation
				breakpoint.orientation == pOrientation

				// Check name
				&&
				breakpoint.name == pBreakpointName
			)
		});

		// Return matching breakpoint or null
		return (matchingBreakpoints.length > 0 ? matchingBreakpoints[0] : null);
	}

	/**
	 * Get the nearest breakpoint from a specific IBreakpoint.
	 * We can search for the next or previous breakpoint (@see parameters)
	 * Can be null if there is no bigger or smaller breakpoint on this orientation.
	 * Will check breakpoints only with the same orientation of pBreakpoint.
	 * @param pBreakpoint We want its sibling, next or previous
	 * @param pSearchNext If true, will search for next, otherwise, will search for previous breakpoint.
	 * @returns {IBreakpoint} The next or previous found breakpoint. Can be null.
	 */
	protected getNearestBreakpointFrom (pBreakpoint:IBreakpoint, pSearchNext:boolean):IBreakpoint
	{
		// Selected breakpoint to compare with others
		// And to get the nearest (above or below) from our breakpoint parameter
		let selectedBreakpoint:IBreakpoint;

		// Browse all breakpoints
		this._breakpoints.map( (breakpoint:IBreakpoint) =>
		{
			// Select breakpoint if :
			if (
					// We have the good orientation
					breakpoint.orientation == pBreakpoint.orientation

					// This is not the same breakpoint
					// We check the name to be compatible with non references IBreakpoints
					&&
					breakpoint.name != pBreakpoint.name

					// If this breakpoint is bigger or smaller
					// depending on pSearchNext parameters
					&& (
						pSearchNext
						? breakpoint.from > pBreakpoint.from
						: breakpoint.from < pBreakpoint.from
					)

					&&
					(
						// We select this one at this stage if we do not already have selected breakpoint
						selectedBreakpoint == null

						// Or we search for a breakpoint fitting in between
						|| (
							pSearchNext
							? breakpoint.from < selectedBreakpoint.from
							: breakpoint.from > selectedBreakpoint.from
						)
					)
				)
			{
				selectedBreakpoint = breakpoint;
			}
		});

		// Return selected breakpoint
		return selectedBreakpoint;
	}

	/**
	 * Get the next breakpoint from a specific IBreakpoint.
	 * @see getBreakpointFromNameAndOrientation to convert breakpoint from name and orientation to IBreakpoint.
	 * Can be null if there is no bigger or smaller breakpoint on this orientation.
	 * Will check breakpoints only with the same orientation of pBreakpoint.
	 * @param pBreakpoint We want its next sibling
	 * @returns {IBreakpoint} The next found breakpoint. Can be null.
	 */
	public getNextBreakpoint (pBreakpoint:IBreakpoint):IBreakpoint
	{
		return this.getNearestBreakpointFrom(pBreakpoint, true);
	}

	/**
	 * Get the previous breakpoint from a specific IBreakpoint.
	 * @see getBreakpointFromNameAndOrientation to convert breakpoint from name and orientation to IBreakpoint.
	 * Can be null if there is no bigger or smaller breakpoint on this orientation.
	 * Will check breakpoints only with the same orientation of pBreakpoint.
	 * @param pBreakpoint We want its previous sibling
	 * @returns {IBreakpoint} The previous found breakpoint. Can be null.
	 */
	public getPreviousBreakpoint (pBreakpoint:IBreakpoint):IBreakpoint
	{
		return this.getNearestBreakpointFrom(pBreakpoint, false);
	}


	// ------------------------------------------------------------------------- BREAKPOINT API

	/**
	 * Check if the current breakpoint state is less or equal to a specific breakpoint.
	 * Useful to check if you are in mobile or desktop for example.
	 * Please use this method along with isMoreOrEqualTo instead of currentHorizontalBreakpoint and currentVerticalBreakpoint.
	 * If you add breakpoints when building your application, your code will still work with this approach.
	 * @param pOrientation Orientation we want to check
	 * @param pBreakpointName Breakpoint name we want to check.
	 * @returns {boolean} True if current breakpoint is less or equal to this breakpoint.
	 */
	public isLessOrEqualTo (pOrientation:EOrientation, pBreakpointName:EBreakpointName):boolean
	{
		// Target IBreakpoint from name and orientation
		let currentBreakpoint = this.getBreakpointFromNameAndOrientation(pOrientation, pBreakpointName);

		// Check if we found a registered breakpoint with those parameters
		if (currentBreakpoint == null)
		{
			throw new Error(`ResponsiveManager.isLessOrEqualTo // Invalid breakpoint. ${EOrientation[pOrientation]} breakpoint named ${EBreakpointName[pBreakpointName]} is not registered.`);
		}

		// Get the next breakpoint
		let nextBreakpoint = this.getNextBreakpoint(currentBreakpoint);

		// Check if next breakpoint is invalid
		// This is non-sense to check if a breakpoint is less than the bigger breakpoint
		// Because every body fits
		if (nextBreakpoint == null)
		{
			throw new Error(`ResponsiveManager.isLessOrEqualTo // This is useless to check if a breakpoint is smaller than the bigger one (will always be true).`);
		}

		// Check if our breakpoint fits
		return (
			// Horizontal breakpoint
			(
				pOrientation == EOrientation.HORIZONTAL
				&&
				this._currentHorizontalBreakpoint.from < nextBreakpoint.from
			)

			// Vertical breakpoint
			|| (
				pOrientation == EOrientation.VERTICAL
				&&
				this._currentVerticalBreakpoint.from < nextBreakpoint.from
			)
		);
	}

	/**
	 * Check if the current breakpoint state is more or equal to a specific breakpoint.
	 * Useful to check if you are in mobile or desktop for example.
	 * Please use this method along with isLessOrEqualTo instead of currentHorizontalBreakpoint and currentVerticalBreakpoint.
	 * If you add breakpoints when building your application, your code will still work with this approach.
	 * @param pOrientation Orientation we want to check
	 * @param pBreakpointName Breakpoint name we want to check.
	 * @returns {boolean} True if current breakpoint is more or equal to this breakpoint.
	 */
	public isMoreOrEqualTo (pOrientation:EOrientation, pBreakpointName:EBreakpointName):boolean
	{
		// Target IBreakpoint from name and orientation
		let currentBreakpoint = this.getBreakpointFromNameAndOrientation(pOrientation, pBreakpointName);

		// Check if we found a registered breakpoint with those parameters
		if (currentBreakpoint == null)
		{
			throw new Error(`ResponsiveManager.isMoreOrEqualTo // Invalid breakpoint. ${EOrientation[pOrientation]} breakpoint named ${EBreakpointName[pBreakpointName]} is not registered.`);
		}

		// Get the previous breakpoint, just to check validity
		let previousBreakpoint = this.getPreviousBreakpoint(currentBreakpoint);

		// Check if previous breakpoint is invalid
		// This is non-sense to check if a breakpoint is more than the bigger breakpoint
		// Because every body fits
		if (previousBreakpoint == null)
		{
			throw new Error(`ResponsiveManager.isMoreOrEqualTo // This is useless to check if a breakpoint is bigger than the smaller one (will always be true).`);
		}

		// Check if our breakpoint fits
		return (
			// Horizontal breakpoint
			(
				pOrientation == EOrientation.HORIZONTAL
				&&
				this._currentHorizontalBreakpoint.from >= currentBreakpoint.from
			)

			// Vertical breakpoint
			|| (
				pOrientation == EOrientation.VERTICAL
				&&
				this._currentVerticalBreakpoint.from >= currentBreakpoint.from
			)
		);
	}
}
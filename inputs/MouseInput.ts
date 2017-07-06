


export interface IPoint
{
	x	:number;
	y	:number;
}


export class MouseInput
{

	// ------------------------------------------------------------------------- SINGLETON

	// Our singleton instance
	protected static __INSTANCE	:MouseInput;

	/**
	 * Get mouse input instance .
	 * @returns {MouseInput}
	 */
	static get instance ():MouseInput
	{
		// If instance does'n exists
		if (MouseInput.__INSTANCE == null)
		{
			// Create a new one
			MouseInput.__INSTANCE = new MouseInput();
		}

		// Return instance
		return MouseInput.__INSTANCE;
	}


	// ------------------------------------------------------------------------- PROPERTIES

	/**
	 * Pointer position in pixels
	 */
	protected _pointerPosition:IPoint;
	get pointerPosition ():IPoint { return this._pointerPosition; }

	/**
	 * Pointer position from 0 to 1
	 */
	protected _topLeftOffset:IPoint;
	get topLeftOffset ():IPoint { return this._topLeftOffset; }


	// ------------------------------------------------------------------------- INIT

	constructor () { }


	// ------------------------------------------------------------------------- MOUSE TRACKING

	/**
	 * Start pointer position tracking.
	 * Will setup mouse move event listening on document.
	 * Will populate MouseInput.mousePosition object at every mouse move.
	 * Can't be removed.
	 */
	startPointerPositionTracking ()
	{
		// Do not track if already tracking ;)
		if (this._pointerPosition != null) return;

		// By default our mouse is at the center
		this._pointerPosition = {
			x: $(window).width() / 2,
			y: $(window).height() / 2
		};
		this._topLeftOffset = {
			x: .5,
			y: .5
		};

		// Set values when pointer move
		$(document).mousemove( (event:JQueryEventObject) =>
		{
			let width = $(window).width();
			let height = $(window).height();

			this._pointerPosition.x = event.pageX;
			this._pointerPosition.y = event.pageY;

			this._topLeftOffset.x = event.pageX / width;
			this._topLeftOffset.y = event.pageY / height;
		});
	}
}
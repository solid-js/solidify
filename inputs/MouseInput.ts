


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
	 * Pointer position in pixels from viewport top left (excluding scroll)
	 */
	protected _viewportRelativePosition:IPoint;
	get viewportRelativePosition ():IPoint { return this._viewportRelativePosition; }

	/**
	 * Pointer position from 0 to 1 starting at viewport top left
	 */
	protected _viewportAbsolutePosition:IPoint;
	get viewportAbsolutePosition ():IPoint { return this._viewportAbsolutePosition; }

	/**
	 * Pointer position in pixels from page top left (including scroll)
	 */
	protected _pageRelativePosition:IPoint;
	get pageRelativePosition ():IPoint { return this._pageRelativePosition; }


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
		if (this._viewportRelativePosition != null) return;

		// By default our mouse is at the center
		this._viewportRelativePosition = {
			x: $(window).width() / 2,
			y: $(window).height() / 2
		};
		this._viewportAbsolutePosition = {
			x: .5,
			y: .5
		};
		this._pageRelativePosition = {
			x: this._viewportRelativePosition.x,
			y: this._viewportRelativePosition.y
		};

		// Set values when pointer move
		$(document).mousemove( (event:JQueryEventObject) =>
		{
			let width = $(window).width();
			let height = $(window).height();

			this._viewportRelativePosition.x = event.clientX;
			this._viewportRelativePosition.y = event.clientY;

			this._viewportAbsolutePosition.x = event.clientX / width;
			this._viewportAbsolutePosition.y = event.clientY / height;

			this._pageRelativePosition.x = event.pageX;
			this._pageRelativePosition.y = event.pageY;
		});
	}
}
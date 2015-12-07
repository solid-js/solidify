export = TouchInput;

import Disposable = require("lib/solidify/core/Disposable");
import TimerUtils = require("lib/solidify/utils/TimerUtils");
import ArrayUtils = require("lib/solidify/utils/ArrayUtils");

module TouchInput
{
	/**
	 * Delegate interface to handle touch dragging events
	 */
	export interface ITouchInputDelegate
	{
		inputTap (pTarget:JQuery):void;
		inputDragLock (pTarget:JQuery):void;
		inputDragUnlock (pTarget:JQuery):void;
		inputDragging (pTarget:JQuery, pDirection:TouchInput.InputDirection, pType:TouchInput.InputTypes, pXDelta:number, pYDelta:number, pEvent:JQueryEventObject):void;
	}

	/**
	 * Enumerating available directions for a drag
	 */
	export enum InputDirection
	{
		HORIZONTAL,
		VERTICAL,
		UNKNOWN
	}

	/**
	 * Allowed type of input
	 */
	export enum InputTypes
	{
		TOUCH = 1,
		MOUSE = 2
	}

	/**
	 * Normalized point (not original event)
	 */
	interface IPoint
	{
		// Identifying our touch
		id		:number;

		// The target used
		target	:JQuery;

		// Position
		x		:number;
		y		:number;

		// Velocity
		deltaX	:number;
		deltaY	:number;
	}

	/**
	 * Interface for original touch event from browser
	 */
	interface IOriginalTouch
	{
		identifier	:number;
		clientX		:number;
		clientY		:number;
	}

	/**
	 * Dispatcher class.
	 * Will provide touch dragging handlers on a specific delegate.
	 */
	export class TouchDispatcher extends Disposable
	{
		/**
		 * Mouse id is -1 because no touch will use this id
		 */
		static MOUSE_ID						:number						= -1;

		/**
		 * The last move event for external preventDefault
		 */
		private _lastMoveEvent				:JQueryEventObject;

		/**
		 * The delegate who honor handling
		 */
		private _delegate					:ITouchInputDelegate;
		get delegate ():ITouchInputDelegate { return this._delegate; }

		/**
		 * JQuery target listening events
		 */
		private _target						:JQuery;
		get target ():JQuery { return this._target; }

		/**
		 * Allowed input types
		 */
		private _inputTypes 				:number;
		get inputTypes ():number { return this._inputTypes; }

		/**
		 * Current used points
		 */
		private _points						:IPoint[]					= [];
		get points ():IPoint[] { return this._points; }

		/**
		 * Current direction for the first point
		 */
		private _currentDirection			:InputDirection				= InputDirection.UNKNOWN;
		get currentDirection ():InputDirection { return this._currentDirection; }

		/**
		 * If the event catching is enabled
		 */
		private _enabled					:boolean					= true;
		get enabled ():boolean { return this._enabled; }
		set enabled (pValue:boolean)
		{
			this._enabled = pValue;
		}

		/**
		 * If the prenventDefault is called on move events
		 */
		private _preventMove					:boolean				= false;
		get preventMove ():boolean { return this._preventMove; }
		set preventMove (pValue:boolean)
		{
			this._preventMove = pValue;
		}


		/**
		 * Constructor
		 * @param pDelegate The drag delegate. Have to implements ITouchInputDelegate
		 * @param pTarget The jQuery target used to listen events
		 * @param pInputTypes Allowed input types (look at the InputType enum). Can be multiple input types with the pipe | operator on enum (InputTypes.TOUCH | InputTypes.MOUSE) for example.
		 */
		constructor (pDelegate:ITouchInputDelegate, pTarget:JQuery, pInputTypes:number = InputTypes.TOUCH | InputTypes.MOUSE)
		{
			// Relay
			super();

			// Check parameters validity
			if (pDelegate == null)
			{
				throw new Error("TouchInput.TouchDispatcher error. Delegate can't be null.");
			}

			if (pTarget == null || pTarget.length == 0)
			{
				throw new Error("TouchInput.TouchDispatcher error. pTarget can't be null and have to target a DOM element.");
			}

			// Keep references
			this._delegate = pDelegate;
			this._target = pTarget;
			this._inputTypes = pInputTypes;

			// Start listening
			this.initListening();
		}

		/**
		 * Initialize listening on target
		 */
		private initListening ():void
		{
			// Listen touch
			this._target.bind("touchstart", this.touchHandler);
			this._target.bind("touchmove", this.touchHandler);
			this._target.bind("touchend", this.touchHandler);

			// Listen mouse
			this._target.bind("mousedown", this.mouseHandler);
			this._target.bind("mousemove", this.mouseHandler);
			this._target.bind("mouseup", this.mouseHandler);

			// Start frame based loop
			TimerUtils.addFrameHandler(this, this.frameHandler);
		}

		/**
		 * Stop listening on target
		 */
		private removeListening ():void
		{
			// Remove touch listening
			this._target.unbind("touchstart", this.touchHandler);
			this._target.unbind("touchmove", this.touchHandler);
			this._target.unbind("touchend", this.touchHandler);

			// Remove mouse listening
			this._target.unbind("mousedown", this.mouseHandler);
			this._target.unbind("mousemove", this.mouseHandler);
			this._target.unbind("mouseup", this.mouseHandler);

			// Stop frame based loop
			TimerUtils.removeFrameHandler(this.frameHandler);
		}

		/**
		 * Get the original touches with the correct interface from a JQuery event.
		 */
		private getOriginalTouches (pEvent:JQueryEventObject):IOriginalTouch[]
		{
			return pEvent.originalEvent['changedTouches'];
		}

		/**
		 * Every mouse event goes here
		 */
		private mouseHandler = (pEvent:JQueryEventObject):void =>
		{
			// Check enable and mouse input
			if (!this._enabled || !(this._inputTypes & InputTypes.MOUSE)) return;

			// If this is a move, check if we have the mouse point registered
			if (pEvent.type == "mousemove")
			{
				var hasMouseInput = false;

				for (var i = 0; i < this._points.length; i ++)
				{
					if (this._points[i].id == TouchDispatcher.MOUSE_ID)
					{
						hasMouseInput = true;
						break;
					}
				}

				if (!hasMouseInput) return;
			}

			// Process this mouse as a touch by creating a false touch input object
			this.processTouchEvent(pEvent, {
				identifier: TouchDispatcher.MOUSE_ID,
				clientX: pEvent.clientX,
				clientY: pEvent.clientY
			});

			// Stop propagation and browser behavior
			//pEvent.preventDefault();
			pEvent.stopPropagation();
		}

		/**
		 * Every touch event goes here.
		 * Used to dispath events by touch point entries.
		 */
		private touchHandler = (pEvent:JQueryEventObject):void =>
		{
			// Check enable and touch input
			if (!this._enabled || !(this._inputTypes & InputTypes.TOUCH)) return;

			// Get the original points
			var originalPoints = this.getOriginalTouches(pEvent);

			// Browse our points
			for (var i = 0; i < originalPoints.length; i ++)
			{
				this.processTouchEvent(pEvent, originalPoints[i]);
			}
		}

		/**
		 * Process an event on a touch point entry
		 */
		private processTouchEvent (pEvent:JQueryEventObject, pOriginalPoint:IOriginalTouch):void
		{
			// Get the target
			var target = $(pEvent.target);

			// Current point
			var currentPoint:IPoint;

			// Stop propagation
			pEvent.stopPropagation();

			// -- START
			if (pEvent.type == "touchstart" || pEvent.type == "mousedown")
			{
				// Convert the point to a normalized one
				this._points.push({
					id		: pOriginalPoint.identifier,
					target	: target,
					x		: pOriginalPoint.clientX,
					y		: pOriginalPoint.clientY,
					deltaX	: 0,
					deltaY	: 0
				});

				// If this is our first point
				if (this._points.length == 1)
				{
					// We don't have direction yet
					this._currentDirection = InputDirection.UNKNOWN;

					// Notify the delegate
					this._delegate.inputDragLock(target);
				}
			}

			// -- MOVE
			else if (pEvent.type == "touchmove" || pEvent.type == "mousemove")
			{
				// Record this event for external preventDefault
				this._lastMoveEvent = pEvent;

				// Prevent default on move if needed
				if (this._preventMove)
				{
					pEvent.preventDefault();
				}

				// Browse our current normalized points
				for (var i in this._points)
				{
					// Target this point
					currentPoint = this._points[i];

					// If ID matches
					if (currentPoint.id == pOriginalPoint.identifier)
					{
						// Compute velocity
						currentPoint.deltaX += currentPoint.x - pOriginalPoint.clientX;
						currentPoint.deltaY += currentPoint.y - pOriginalPoint.clientY;

						// Register new position
						currentPoint.x = pOriginalPoint.clientX;
						currentPoint.y = pOriginalPoint.clientY;

						// If we don't have direction yet
						if (this._currentDirection == InputDirection.UNKNOWN)
						{
							// Compute direciton from velocity
							if (Math.abs(currentPoint.deltaX) > Math.abs(currentPoint.deltaY))
							{
								this._currentDirection = InputDirection.HORIZONTAL;
							}
							else if (Math.abs(currentPoint.deltaY) >= Math.abs(currentPoint.deltaX))
							{
								this._currentDirection = InputDirection.VERTICAL;
							}
						}
					}
				}
			}

			// -- END
			else if (pEvent.type == "touchend" || pEvent.type == "mouseup")
			{
				// Cancel last event
				this._lastMoveEvent = null;

				// If this is the last point
				if (this._points.length == 1)
				{
					// Notify unlock
					this._delegate.inputDragUnlock(this._points[0].target);

					// If we don't have direction, this was a tap
					if (this._currentDirection == InputDirection.UNKNOWN)
					{
						this._delegate.inputTap(this._points[0].target);
					}

					// We don't have direction anymore
					this._currentDirection = InputDirection.UNKNOWN;
				}

				// Remove this point
				this._points = ArrayUtils.deleteWhere(this._points, {
					id: pOriginalPoint.identifier
				});
			}
		}

		/**
		 * Every frames
		 */
		private frameHandler ():void
		{
			// If we have only one point and a direction
			if (this._points.length == 1 && this._currentDirection != InputDirection.UNKNOWN)
			{
				// Target the main point
				var mainPoint = this._points[0];

				// And notify on the delegate
				this._delegate.inputDragging(
					mainPoint.target,
					this._currentDirection,
					mainPoint.id == TouchDispatcher.MOUSE_ID ? InputTypes.MOUSE : InputTypes.TOUCH,
					mainPoint.deltaX, mainPoint.deltaY,
					this._lastMoveEvent
				);
			}

			// Cancel velocity on all points
			for (var i = 0; i < this._points.length; i ++)
			{
				this._points[i].deltaX = 0;
				this._points[i].deltaY = 0;
			}
		}

		/**
		 * Destruct
		 */
		dispose ():void
		{
			// Relay
			super.dispose();

			// Stop listening
			this.removeListening();

			// Remove references
			this._target = null;
			this._delegate = null;
		}
	}
}
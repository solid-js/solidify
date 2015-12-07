export = Signal;

/**
 * Interface describing a listener.
 */
interface IListener
{
	scope		:any;
	handler		:() => any;
	once		:boolean;
	id			:number;
}

/**
 * TODO : Faire en sorte qu'on puisse forcer les types des paramètres des handlers à l'instanciation
 */

class Signal
{
	// ------------------------------------------------------------------------- LOCALS

	/**
	 * Current listener id
	 */
	private _id						:number						= 0;

	/**
	 * All registered listeners
	 */
	private _listeners				:IListener[]				= [];

	// ------------------------------------------------------------------------- GETTERS

	/**
	 * Get total attached listeners
	 */
	get length ():number
	{
		return this._listeners.length;
	}

	// ------------------------------------------------------------------------- CONSTRUCTION

	constructor () { }

	// ------------------------------------------------------------------------- ADDING / LISTENING

	// todo : doc du scope

	/**
	 * Add a listener. The handler will be called each time dispatch is called.
	 * The handler will get the dispatch parameters.
	 * Will return the id of the listening, for removing later.
	 */
	add (pScope:any, pHandler:(...rest) => any):number
	{
		return this.register(pScope, pHandler, false);

	}

	/**
	 * Same as add, but will be removed when dispatched once.
	 */
	addOnce (pScope:any, pHandler:(...rest) => any):number
	{
		return this.register(pScope, pHandler, true);
	}

	/**
	 * Register a listening.
	 */
	private register (pScope:any, pHandler:() => any, pOnce:boolean):number
	{
		this._listeners.push({
			scope	: pScope,
			handler	: pHandler,
			once	: pOnce,
			id		: ++ this._id
		});

		return this._id;
	}

	// ------------------------------------------------------------------------- DISPATCHING

	/**
	 * Dispatch the signal to all listeners. Will call all registered listeners with passed arguments.
	 * Will return the list of listeners returns (listeners not returning anythings will be ignored)
	 */
	dispatch (...rest):any[]
	{
		var results					:any[]			= [];
		var currentListener			:IListener;
		var currentResult			:any;
		var listenersToRemove		:IListener[]	= [];

		// Browse listeners
		for (var listenerIndex in this._listeners)
		{
			// Target current listener
			currentListener = this._listeners[listenerIndex];

			// Call the listener
			currentResult = currentListener.handler.apply(currentListener.scope, rest);

			// If we have result, add it to the return package
			if (currentResult != null && currentResult != undefined)
			{
				results.push(currentResult);
			}

			// If it's an once listener, mark as remove
			if (currentListener.once)
			{
				listenersToRemove.push(currentListener);
			}
		}

		// Remove all once listeners
		for (listenerIndex in listenersToRemove)
		{
			this.remove(listenersToRemove[listenerIndex].handler);
		}

		// Return the result package of all listeners
		return results;
	}

	// ------------------------------------------------------------------------- REMOVING

	/**
	 * Remove a listener by its id (returned by the add method) or by its handler reference.
	 * Will return true if the listener is found and removed.
	 */
	remove (pHandler:(...rest) => any):boolean;
	remove (pId:number):boolean;
	remove (pHandlerId:any):boolean
	{
		var newListeners		:IListener[]	= [];
		var currentListener		:IListener;
		var listenerDeleted		:boolean		= false;

		// Browse all listeners
		for (var i in this._listeners)
		{
			// Target current listener
			currentListener = this._listeners[i];

			// Check if we are on the listening to remove
			if (
					// We want to delete a listening by its handler reference
					(
						typeof pHandlerId == "function"
						&&
						currentListener.handler == pHandlerId
					)
					||
					// We want to delete a listening by its id
					(
						typeof pHandlerId == "number"
						&&
						currentListener.id == pHandlerId
					)
				)
			{
				// We deleted it (don't add it to the new list)
				listenerDeleted = true;
			}
			else
			{
				// Add all listeners
				newListeners.push(currentListener);
			}
		}

		// Remap new listeners
		this._listeners = newListeners;

		// Return if we found and delete our listening
		return listenerDeleted;
	}

	// ------------------------------------------------------------------------- DESTRUCTION

	dispose ():void
	{
		this._listeners = null;
	}
}
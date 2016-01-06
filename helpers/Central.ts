import {Disposable} from '../core/Disposable';

// TODO : un méthode watch par instance de central pour loguer tout ce qu'il passe

export module Central
{
	/**
	 * Handlers on actions
	 */
	interface IActionHandler
	{
		scope	:any;
		handler	:(pAction:IActionPromise) => any;
	}
	interface IHandlers
	{
		[index :string] :IActionHandler[];
	}

	/**
	 * Action interface with promise version for listeners
	 */
	export interface IAction
	{
		name		:string;
		data		:any;
		handlers	:number;
	}
	export interface IActionPromise extends IAction
	{
		success		:() => void;
		fail		:() => void;
	}

	/**
	 * Dispatcher class. Use getInstance to get a new one.
	 */
	export class Dispatcher extends Disposable
	{
		/**
		 * List of all handlers on every actions
		 */
		private _handlers:IHandlers = {};

		/**
		 * Add a listener on an action.
		 * @param pActionName Name of the action to listen to.
		 * @param pScope Scope applyed on the handler when the action will be dispatched.
		 * @param pHandler Function called when the action is dispatched.
		 */
		add (pActionName:string, pScope:any, pHandler:(pAction:IActionPromise) => void):void
		{
			if (!(pActionName in this._handlers))
			{
				this._handlers[pActionName] = [];
			}

			this._handlers[pActionName].push({
				scope: pScope,
				handler: pHandler
			});
		}

		/**
		 * Dispatch an action on the current channel. Will wait for every promises to be done.
		 * If any handler call the fail() command, the promise will be failed and pErrorHandler will be called.
		 * Handlers can be sync, in this case pSuccessHandler will be called in sync with the dispatch command.
		 * @param pActionName The name of the action to dispatch.
		 * @param pData Data associated to the action. Will be transmitted to every handlers via IAction.
		 * @param pSuccessHandler Called if every handlers are successful.
		 * @param pErrorHandler Called if any handler has failed.
		 * @returns Number of handlers called.
		 */
		dispatch (pActionName:string, pData:any = {}, pSuccessHandler:(pAction:IAction)=>void = null, pErrorHandler:(pAction:IAction)=>void = null):number
		{
			var checkPromise:(pSuccess:boolean) => void;

			// Create action from name and data
			var action:IActionPromise			= {
				name		: pActionName,
				data		: pData,
				handlers	: 0,

				success: function ()
				{
					checkPromise(true);
				},
				fail: function ()
				{
					checkPromise(false);
				}
			};

			// If we don't have any listeners on this action
			if (!(pActionName in this._handlers))
			{
				//pSuccessHandler(action);
				return 0;
			}

			// Target handlers liste
			var handlers			:IActionHandler[]	= this._handlers[pActionName];

			// Counting failed and succeed actions
			var totalActionsEnded	:number				= 0;
			var totalActionsFailed	:number				= 0;

			// Check if our promise is ended
			checkPromise = function (pSuccess:boolean):void
			{
				// Count
				(pSuccess ? totalActionsEnded ++ : totalActionsFailed ++);

				// Check
				if (totalActionsEnded + totalActionsFailed == handlers.length)
				{
					delete action.success;
					delete action.fail;

					// Success or fail on the dispatch callbacks
					(
						totalActionsFailed > 0
						? (pErrorHandler && pErrorHandler(action))
						: (pSuccessHandler && pSuccessHandler(action))
					);
				}
			}

			// Browse handlers
			var syncReturn:boolean;
			for (var i in handlers)
			{
				// Call the handler and get if we have a sync response
				syncReturn = handlers[i].handler.call(handlers[i].scope, action);

				// Add a handler count to the action
				action.handlers ++;

				// Sync success
				if (syncReturn === true)
				{
					action.success();
				}

				// Sync fail
				else if (syncReturn === false)
				{
					action.fail();
				}
			}

			return action.handlers;
		}

		/**
		 * Remove an attached handler to an action.
		 * @param pActionName Optionnal, the script reuns faster if provided.
		 * @param pHandler The handler to remove.
		 * @returns true if the handler was found and deleted.
		 */
		remove (pActionName:string, pHandler:(pAction:IActionPromise) => void):boolean
		{
			var i, j;

			// If the action name is ommited, find it with the handler reference. Slower.
			if (pActionName == null)
			{
				// Browse every actions
				for (i in this._handlers)
				{
					// Browse every listeners
					for (j in this._handlers[i])
					{
						// We found our handler and so our action
						if (this._handlers[i][j].handler == pHandler)
						{
							pActionName = i;
							break;
						}
					}

					// Stop browsing if we found our action
					if (pActionName != null)
					{
						break;
					}
				}
			}

			// If we don't have any listeners on this action, stop
			if (pActionName == null || !(pActionName in this._handlers))
			{
				return false;
			}

			// New collection of handlers for this action
			var newHandlers:IActionHandler[] = [];

			// Browse handlers of this action
			var found = false;
			for (j in this._handlers[pActionName])
			{
				// If this is not our handler
				if (this._handlers[pActionName][j].handler != pHandler)
				{
					// Add it to the new list
					newHandlers.push(this._handlers[pActionName][j]);
				}
				else
				{
					// We found and deleted our wanted handler
					found = true;
				}
			}

			// Apply the new handlers list on the action
			this._handlers[pActionName] = newHandlers;

			// Return if we found our handler
			return found;
		}

		/**
		 * Clear every listeners attached to an action.
		 * @param pActionName Name of the action.
		 * @returns true there was an action.
		 */
		clearAction (pActionName:string):boolean
		{
			// Check if the action exists
			if (pActionName in this._handlers)
			{
				// Delete it
				delete this._handlers[pActionName];
				return true;
			}

			// No action found with this name
			else return false;
		}

		/**
		 * Destroy central dispatcher channel
		 */
		dispose ():void
		{
			// Kill handlers
			this._handlers = null;

			// Relay
			super.dispose();
		}
	}

	/**
	 * List of all dispatchers
	 */
	var __dispatchers:{[index:string]:Dispatcher} = {};

	/**
	 * Get a new dispatcher on a specific channel
	 * @param pChannel Name of the channel. Default is "app".
	 */
	export function getInstance (pChannel:string = "app"):Dispatcher
	{
		// Check if you already have a central existing on this channel
		if (!(pChannel in __dispatchers))
		{
			__dispatchers[pChannel] = new Dispatcher();
		}

		// Return the central limited on the specific channel
		return __dispatchers[pChannel];
	}

	/**
	 * Dispatch an error
	 * @param pMethodName
	 * @param pActionSignature
	 */
	function parseActionSignature (pMethodName:string, pActionSignature:string):string[]
	{
		// Convert action signature
		var splitted = pActionSignature.split("/");

		// Check action signature
		if (splitted.length != 2)
		{
			throw new Error('Central.' + pMethodName + ' // Bad action signature. Action signature syntax : "channel/action". Used : ' + pActionSignature);
		}

		return splitted;
	}

	/**
	 * Add a listener on an action.
	 * (see Dispatcher.add)
	 * @param pActionSignature Name of the action to add, like this : "channel/actionName"
	 * @param pScope Scope applyed on the handler when the action will be dispatched.
	 * @param pHandler Function called when the action is dispatched.
	 */
	export function add (pActionSignature:string, pScope:any, pHandler:(pAction:IActionPromise) => void):void
	{
		// Parse and check action signature
		var splitted = parseActionSignature("dispatch", pActionSignature);

		// Relay
		getInstance(splitted[0]).add(splitted[1], pScope, pHandler);
	}

	/**
	 * Dispatch an action on the current channel. Will wait for every promises to be done.
	 * If any handler call the fail() command, the promise will be failed and pErrorHandler will be called.
	 * Handlers can be sync, in this case pSuccessHandler will be called in sync with the dispatch command.
	 * (see Dispatcher.dispatch)
	 * @param pActionSignature Name of the action to add, like this : "channel/actionName"
	 * @param pData Data associated to the action. Will be transmitted to every handlers via IAction.
	 * @param pSuccessHandler Called if every handlers are successful.
	 * @param pErrorHandler Called if any handler has failed.
	 * @returns Number of handlers called.
	 */
	export function dispatch (pActionSignature:string, pData:any = null, pSuccessHandler:(pAction:IAction) => void = null, pErrorHandler:(pAction:IAction) => void = null):number
	{
		// Parse and check action signature
		var splitted = parseActionSignature("dispatch", pActionSignature);

		// Relay
		return getInstance(splitted[0]).dispatch(splitted[1], pData, pSuccessHandler, pErrorHandler);
	}

	/**
	 * Remove an attached handler to an action.
	 * (see Dispatcher.remove)
	 * @param pActionSignature Name of the action to add, like this : "channel/actionName"
	 * @param pHandler The handler to remove.
	 * @returns true if the handler was found and deleted.
	 */
	export function remove (pActionSignature:string, pHandler:(pAction:IActionPromise) => void):boolean
	{
		// Parse and check action signature
		var splitted = parseActionSignature("remove", pActionSignature);

		// Relay
		return getInstance(splitted[0]).remove(splitted[1], pHandler);
	}

	/**
	 * Clear every listeners attached to an action.
	 * (see Dispatcher.clearAction)
	 * @param pActionSignature Name of the action to add, like this : "channel/actionName"
	 * @returns true there was an action.
	 */
	export function clearAction (pActionSignature:string):boolean
	{
		// Parse and check action signature
		var splitted = parseActionSignature("clearAction", pActionSignature);

		// Relay
		return getInstance(splitted[0]).clearAction(splitted[1]);
	}
}
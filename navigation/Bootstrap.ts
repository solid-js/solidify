export = Bootstrap;

import Disposable = require("../core/Disposable");
import DependencyManager = require("../helpers/DependencyManager");
import Controller = require("../core/Controller");

class Bootstrap extends Disposable
{

	private _dependencyManager:DependencyManager;

	private _namespace:string;
	get namespace ():string { return this._namespace; }

	private _moduleType:string;
	get moduleType ():string { return this._moduleType; }


	private _waitingControllerName		:string;
	private _waitingActionName			:string;
	private _waitingParams				:{[index:string] : any};

	private _waitingDeferred			:Q.Deferred<any>;

	private _locked						:boolean					= false;

	private _currentController			:Controller;

	private _currentControllerName		:string;
	private _currentActionName			:string;
	private _currentParams				:{[index:string] : any};

	get locked ():boolean { return this._locked; }

	get currentController ():Controller { return this._currentController; }

	get currentControllerName ():string { return this._currentControllerName; }
	get currentActionName ():string { return this._currentActionName; }
	get currentParams ():{[index:string] : any} { return this._waitingParams; }

	// todo : doc
	// todo : signals sur le lock et sur le changement de controlleur

	constructor (pNamespace:string, pModuleTypes:string = "controller")
	{
		super();

		this._namespace = pNamespace;
		this._moduleType = pModuleTypes;

		this._dependencyManager = DependencyManager.getInstance();
	}


	open (pControllerName:string, pActionName:string = "index", pParams:{[index:string] : any} = {}):void
	{
		// todo : gestion des erreurs dans les promises !
		// todo : Le top serait de pouvoir annuler un call si le controlleur en cours refuse le stop
		// todo : (par exemple perte de données sur le formulaire en cours)
		// todo : Du coup relayer la promise à la méthode open pour savoir de l'extérieur si la demande est ok

		// Override waiting controller / action / params
		this._waitingControllerName = pControllerName;
		this._waitingActionName = pActionName;
		this._waitingParams = pParams;

		// If the bootstrap is locked
		if (this._locked)
		{
			return;
		}

		// Lock the bootstrap
		this._locked = true;

		// Close the current controller
		this.closeCurrentController().then(() =>
		{
			//console.log("closed");

			// Open the new controller and call the action
			return this.openWaitingController();

		}).then(() =>
		{
			// Setting new controller name and action
			this._currentControllerName = this._waitingControllerName;
			this._currentActionName = this._waitingActionName;
			this._currentParams = this._waitingParams;

			// Reseting waiting controller
			this._waitingControllerName = null;
			this._waitingActionName = null;
			this._waitingParams = null;

			// Unlock
			this._locked = false;

			//console.log("opened");
		}).catch((pError:Error) => {

			console.error(pError.message, pError['stack']);
		});
	}

	// todo : doc
	private closeCurrentController ():Q.Promise<any>
	{
		//console.log("closing");

		// Promise from stopping the controller
		var closingPromise;

		// If we have to close the controller
		var closeCurrentController = (
			// If we have a controller captain obvious
			this._currentController != null
			// And if it's not the waiting controller
			&&
			this._currentControllerName != this._waitingControllerName
		);

		// Stop the current controller
		if (closeCurrentController)
		{
			closingPromise = this._currentController.stop();
		}

		// Wait for the controller to stop and return the promise
		return Q(closingPromise).then(() =>
		{
			// Dispose and remove references if we have to kill the controller
			if (closeCurrentController)
			{
				this._currentController.dispose();
				this._currentController = null;
			}

			return Q(true);
		});
	}

	// todo : doc
	private openWaitingController ():Q.Promise<any>
	{
		console.log("Bootstrap.open", this._waitingControllerName + '.' + this._waitingActionName);

		// If the waiting controller is different from the current one
		if (this._waitingControllerName != this._currentControllerName)
		{
			// Get the new controller class from dependency manager
			var ControllerClass = this._dependencyManager.requireModule(this._namespace, this._waitingControllerName, this._moduleType);

			// Instantiate controller and register reference
			this._currentController = new ControllerClass();

			// Check if this is a controller
			if (!("isController" in this._currentController) || !(this._currentController.isController))
			{
				throw new Error('Bootstrap.open // ' + this._waitingControllerName + ' is not a controller.');
			}

			// Init the controller
			this._currentController.init();

			// Open the controller and get promise
			var openingPromise = this._currentController.start();
		}

		if (this._currentController == null)
		{
			console.error("No controller found...");
			return;
		}

		// Check if our action is not in the controller
		if (
				// Action not in controller
				!(this._waitingActionName in this._currentController)
				||
				// Not a method
				(typeof this._currentController[this._waitingActionName] !== "function")
			)
		{
			throw new Error('Bootstrap.open // Action method ' + this._waitingActionName + ' not found on controller ' + this._waitingControllerName);
		}

		// todo : Vérifier si on doit rappeler l'action (controllerName / actionName / params différents)
		// todo : Ou pas, le routeur le fait déjà

		// If we have to call the action
		/*
		if (
				this._waitingActionName == this._currentActionName
				//&&
				//this._waitingParams.length ==
			)
		{
			for (var i in this._waitingParams)
			{
			}

		}*/

		return Q(openingPromise).then(() =>
		{
			// Call action on new controller instance
			var actionReturn = this._currentController[this._waitingActionName].call(this._currentController, this._waitingParams);

			return Q(actionReturn);
		});


		// Return the opening promise
		return Q(openingPromise);
	}

	/**
	 * Destruction
	 */
	dispose ():void
	{
		// todo : delete stuff
		this._dependencyManager = null;

		// Relay
		super.dispose();
	}
}
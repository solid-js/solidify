import {ReactView} from "./ReactView";
import {IPage} from "../navigation/IPage";

/**
 * Default interface for page properties
 */
export interface ReactPageProps
{
	action		:string;
	parameters	:{ [index:string]:any };
}

export class ReactPage<Props, States> extends ReactView<Props, States> implements IPage
{
	/**
	 * Animating lock. Is true when animating with playIn or playOut.
	 * Use this lock to disable features when animating.
	 */
	get animating ():boolean { return this._animating; }
	protected _animating:boolean;
	

	/**
	 * Constructor
	 */
	constructor (pProps:Props, pContext:any)
	{
		// Relay
		super(pProps, pContext);

		// Call action
		this.action();
	}

	/**
	 * When page params changes
	 * @param pNewProps New params list
	 */
	componentWillReceiveProps (pNewProps:any)
	{
		// Set new props
		this.props = pNewProps;

		// Recall action with new props
		this.action();
	}

	/**
	 * Have to be override.
	 * Action on this page.
	 * Have to check props.action and props.params to show proper content.
	 */
	action () { }

	/**
	 * Play intro animation.
	 * Have to return a promise when animation is ended.
	 * Animating lock is automatically enabled during animation.
	 * Use animating lock to disable features when animating.
	 * ex : if (this._animating) return
	 * To implement animation, please override playInPromiseHandler.
	 */
	playIn ():Promise<any>
	{
		return new Promise( resolve =>
		{
			// Lock animating
			this._animating = true;

			// Execute promise
			this.playInPromiseHandler( () =>
			{
				// Unlock animating
				this._animating = false;

				// Resolve promise
				resolve();
			});
		});
	}

	/**
	 * Play outro animation.
	 * Have to return a promise when animation is ended.
	 * Animating lock is automatically enabled during animation.
	 * Use animating lock to disable features when animating.
	 * ex : if (this._animating) return
	 * To implement animation, please override playOutPromiseHandler.
	 */
	playOut ():Promise<any>
	{
		return new Promise( resolve =>
		{
			// Lock animating
			this._animating = true;

			this.playOutPromiseHandler( () =>
			{
				// Unlock animating
				this._animating = false;

				// Resolve promise
				resolve();
			});
		});
	}


	/**
	 * Override this method to implement play in animation.
	 * Call complete handler when animation is done.
	 */
	protected playInPromiseHandler (pCompleteHandler:() => void)
	{
		pCompleteHandler();
	}

	/**
	 * Override this method to implement play out animation.
	 * Call complete handler when animation is done.
	 */
	protected playOutPromiseHandler (pCompleteHandler:() => void)
	{
		pCompleteHandler();
	}
}
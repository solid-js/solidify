import {React, ReactDom, ReactView} from "./ReactView";
import {IPage} from "../definitions/IPage";

/**
 * Default interface for page properties
 */
export interface ReactPageProps extends __React.Props<any>
{
	action	:string;
	params	:{ [index:string]:any };
}

export class ReactPage<Props, States> extends ReactView<Props, States> implements IPage
{
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
	 * Can be overrided.
	 * Can return false if the page can't be changed with router.
	 * Return true by default to always accept page changing.
	 */
	shouldPlayOut ():boolean
	{
		return true;
	}

	/**
	 * When page params changes
	 * @param pNewProps New params list
	 */
	componentWillReceiveProps (pNewProps:any)
	{
		// Add enumerable properties in props
		for (var i in pNewProps)
		{
			this.props[i] = pNewProps[i];
		}

		// Recall action with new props
		this.action();
	}

	/**
	 * Action on this page.
	 * Have to be override.
	 * Have to check props.action and props.params to show proper content.
	 */
	action () { }

	/**
	 * Play in animation.
	 * Have to return a promise when animation is ended.
	 */
	playIn ():Q.Promise<any>
	{
		return null;
	}

	/**
	 * Play out animation.
	 * Have to return a promise when animation is ended.
	 */
	playOut ():Q.Promise<any>
	{
		return null;
	}
}
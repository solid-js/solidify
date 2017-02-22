import {React, ReactDom, ReactView} from "./ReactView";
import {IPage} from "../navigation/IPage";

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
	 * Can return false if the page can't be activated from router.
	 * Return true by default to always accept page changing.
	 */
	shouldPlayIn ():boolean
	{
		return true;
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
	 */
	playIn ():Q.Promise<any>
	{
		return null;
	}

	/**
	 * Play outro animation.
	 * Have to return a promise when animation is ended.
	 */
	playOut ():Q.Promise<any>
	{
		return null;
	}
}
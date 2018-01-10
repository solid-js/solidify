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
	 */
	playIn ():Promise
	{
		return null;
	}

	/**
	 * Play outro animation.
	 * Have to return a promise when animation is ended.
	 */
	playOut ():Promise
	{
		return null;
	}
}
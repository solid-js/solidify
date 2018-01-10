import {IActionParameters} from "./Router";

/**
 * Interface for page.
 * It can be triggered from route and managed by an IPageStack
 */
export interface IPage
{
	/**
	 * Action on this page.
	 * Have to check props.action and props.params to show proper content.
	 */
	action (pActionName:string, pParams:IActionParameters);

	/**
	 * Play intro animation.
	 * Have to return a promise when animation is ended.
	 */
	playIn ():Promise<any>;

	/**
	 * Play outro animation.
	 * Have to return a promise when animation is ended.
	 */
	playOut ():Promise<any>;
}
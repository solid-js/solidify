import {IActionParameters} from "./Router";

/**
 * Interface for page.
 * It can be triggered from route and managed by an IPageStack
 */
export interface IPage
{
	/**
	 * Can return false if the page can't be activated from router.
	 * Return true by default to always accept page changing.
	 */
	shouldPlayIn ():boolean;

	/**
	 * Can return false if the page can't be changed with router.
	 * Return true by default to always accept page changing.
	 */
	shouldPlayOut ():boolean;

	/**
	 * Action on this page.
	 * Have to check props.action and props.params to show proper content.
	 */
	action (pActionName:string, pParams:IActionParameters);

	/**
	 * Play intro animation.
	 * Have to return a promise when animation is ended.
	 */
	playIn ():Q.Promise<any>;

	/**
	 * Play outro animation.
	 * Have to return a promise when animation is ended.
	 */
	playOut ():Q.Promise<any>;
}
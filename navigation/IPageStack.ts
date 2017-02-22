import {IPage} from "./IPage";

export interface IPageStack
{
	/**
	 * Current loaded page name. Can be null.
	 */
	readonly currentPageName		:string;

	/**
	 * Current displayed page. Can be null.
	 */
	readonly currentPage			:IPage;

	/**
	 * If we are in transition state.
	 */
	readonly isInTransition			:boolean;

	/**
	 * Afficher une page
	 * @param pPageName Le nom de la page à afficher (nom de classe qui sera chargé dynamiquement avec le type 'page')
	 * @param pActionName Le nom de l'action à appeler
	 * @param pParams Les paramètres de l'action à passer
	 * @returns false si la page ne sera pas chargée
	 */
	showPage (pPageName:string, pActionName:string, pParams:{[index:string]:any}):boolean;
}
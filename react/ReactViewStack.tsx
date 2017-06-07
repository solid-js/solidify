import {React, ReactDom, ReactView} from "./ReactView";
import {IPage} from "../navigation/IPage";
import {IPageStack} from "../navigation/IPageStack";
import {DependencyManager} from "../helpers/DependencyManager";

// ----------------------------------------------------------------------------- STRUCT

interface Props extends __React.Props<any> { }

interface States
{
	currentPage		?:any;
	action			?:string;
	parameters		?:{ [index:string]:any };
}


export class ReactViewStack extends ReactView<Props, States> implements IPageStack
{
	/**
	 * Current page name
	 */
	protected _currentPageName		:string;
	get currentPageName():string { return this._currentPageName; }

	/**
	 * Current page component in stack
	 */
	protected _currentPage			:IPage;
	get currentPage():IPage { return this._currentPage; }

	/**
	 * If we are in transition
	 */
	protected _isInTransition		:boolean;
	get isInTransition():boolean { return this._isInTransition; }


	// ------------------------------------------------------------------------- INIT

	prepare ()
	{
		// Init state
		this.initState({
			currentPage		:null,
			action			:null,
			parameters  	:null
		});
	}


	// ------------------------------------------------------------------------- RENDERING

	render ()
	{
		// Page type from state
		// Use alias with CapitalCase so react detects it
		let CurrentPageType = this.state.currentPage;

		// Return DOM with current page
		return (
			// Replace by span if not found
			(CurrentPageType == null)
				? <span />

				// Page with action and parameters
				: <CurrentPageType
					ref={ (r) => this._currentPage = r }
					action={this.state.action}
					parameters={this.state.parameters}
				/>
		);
	}

	/**
	 * Component is created
	 */
	componentDidMount () { }

	/**
	 * Component is updated
	 */
	componentDidUpdate (pOldProps:Props, pOldStates:States)
	{
		// If current page changed only, we need a playIn
		if (pOldStates.currentPage != this.state.currentPage)
		{
			// Call animation intro if this is a new page
			Q(this._currentPage.playIn()).done(() =>
			{
				// We are not in transition state anymore
				this._isInTransition = false;
			});
		}
	}


	// ------------------------------------------------------------------------- PAGES

	/**
	 * Show a new page in this stack.
	 * @param pPageName Page name which will be required from "page" module type with DependencyManager
	 * @param pActionName Action name to execute on page
	 * @param pParameters Action parameters to pass
	 * @returns false if page is not loaded
	 */
	public showPage (pPageName:string, pActionName:string, pParameters:{[index:string]:any}):boolean
	{
		// TODO : Faire le système d'annulation de changement de page
		// TODO : Avec shouldPlayIn et shouldPlayOut, voir ce que cela implique sur le routeur

		// If this is the same page
		if (pPageName == this._currentPageName)
		{
			// Just change action and parameters, not page
			this.setState({
				action		: pActionName,
				parameters  : pParameters
			});

			// Do not go further
			return true;
		}

		// Load new page and do intro
		let playInNewPage = () =>
		{
			// Now we are in transition state
			this._isInTransition = true;

			// Load page from dependency manager
			// FIXME : Warning, we do not check errors here !
			let pageClass = DependencyManager.getInstance().requireModule(pPageName, 'page', null);

			// Record page name
			this._currentPageName = pPageName;

			// Set state with new page class, action and parameters
			// React will do its magic !
			this.setState({
				currentPage	: pageClass,
				action		: pActionName,
				parameters  : pParameters
			});
		};

		// Outro animation on current page
		// Or going straight to the new page
		(this.state.currentPage == null)
			? playInNewPage()
			: Q(this._currentPage.playOut()).done(playInNewPage);

		// Everything is ok
		return true;
	}
}
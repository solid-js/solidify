import * as React from "react";
import * as ReactDOM from "react-dom";
import {ReactView} from "./ReactView";
import {IPage} from "../navigation/IPage";
import {IPageStack} from "../navigation/IPageStack";
import {IActionParameters} from "../navigation/Router";

// ----------------------------------------------------------------------------- STRUCT

/**
 * Transition between pages.
 */
export enum ETransitionType
{
	/**
	 * [default]
	 * New page will be added and played in after current page is played out.
	 */
	PAGE_SEQUENTIAL,

	/**
	 * New page will be added on top of current page.
	 * Current page will live until new page is played in and current page is played out.
	 */
	PAGE_CROSSED,

	/**
	 * Transition control is delegated to props.transitionController handler.
	 */
	CONTROLLED
}

/**
 * A page state, to show a page from Class / action / parameters
 */
interface IPageState
{
	// Page class to instanciate with react
	pageClass     	?:any;

	// Associated action and parameters
	action       	?:string;
	parameters    	?:IActionParameters;
}

/**
 * Transition control delegate API.
 */
interface ITransitionControl
{
	/**
	 * Custom transition delegate.
	 * Set props.transitionType to ETransitionType.CONTROLLER to enable custom transition control.
	 * Please return promise and resolve it when old page can be removed.
	 * @param $oldPage Old page DOM element
	 * @param $newPage New page DOM element
	 * @param pOldPage Old page instance
	 * @param pNewPage New page instance
	 */
	($oldPage:Element, $newPage:Element, pOldPage:IPage, pNewPage:IPage) : Promise;
}

interface Props
{
	/**
	 * Type of transition between pages. @see ETransitionType
	 */
	transitionType		?: ETransitionType;

	/**
	 * Custom transition delegate.
	 * Set props.transitionType to ETransitionType.CONTROLLER to enable custom transition control.
	 * Please return promise and resolve it when old page can be removed.
	 */
	transitionControl	?: ITransitionControl;

	/**
	 * Called when page is not found by DependencyManager.
	 * Will not be called if showPage(null...) is called.
	 * Will throw DependencyManager errors if not defined.
	 * @param pPageName
	 */
	onNotFound       	?: (pPageName:string) => void
}

interface States
{
	// Current page index so react is not lost between old and new pages
	currentPageIndex	?: number;

	// Old page state
	oldPage				?: IPageState;

	// New page state
	currentPage			?: IPageState;
}


export class ReactViewStack extends ReactView<Props, States> implements IPageStack
{
	/**
	 * Current page name
	 */
	protected _currentPageName		:string;
	get currentPageName():string { return this._currentPageName; }

	/**
	 * Old page, currently playing out
	 */
	protected _oldPage				:IPage;

	/**
	 * Current page component in stack
	 */
	protected _currentPage			:IPage;
	get currentPage():IPage { return this._currentPage; }

	/**
	 * If we are in transition
	 */
	protected _playedIn = true;
	protected _playedOut = true;
	get isInTransition():boolean { return !this._playedIn || !this._playedOut; }


	// ------------------------------------------------------------------------- INIT

	prepare ()
	{
		// Default transition type
		if (!('transitionType' in this.props))
		{
			this.props.transitionType = ETransitionType.PAGE_SEQUENTIAL;
		}

		// Init state
		this.initState({
			currentPageIndex	:0,
			oldPage				:null,
			currentPage			:null
		});
	}


	// ------------------------------------------------------------------------- RENDERING

	render ()
	{
		// Page types from state
		// Use alias with CapitalCase so react detects it
		const CurrentPageType = this.state.currentPage == null ? null : this.state.currentPage.pageClass;
		const OldPageType = this.state.oldPage == null ? null : this.state.oldPage.pageClass;

		// Return DOM with current page
		return <div className="ReactViewStack">

			{/* Show the old page in cas of crossed transition */}
			{
				OldPageType != null
				&&
				<OldPageType
					key={ this.state.currentPageIndex - 1 }
					ref={ (r) => this._oldPage = r }
					action={this.state.oldPage.action}
					parameters={this.state.oldPage.parameters}
				/>
			}

			{/* Show the new page */}
			{
				CurrentPageType != null
				&&
				<CurrentPageType
					key={ this.state.currentPageIndex }
					ref={ (r) => this._currentPage = r }
					action={this.state.currentPage.action}
					parameters={this.state.currentPage.parameters}
				/>
			}
		</div>
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
			// If we are in controlled transition type mode
			if (this.props.transitionType == ETransitionType.CONTROLLED)
			{
				// We need the control handler, check if.
				if (this.props.transitionControl == null)
				{
					throw new Error('ReactViewStack.transitionControl // Please set transitionControl handler.');
				}

				// Set transition state as started
				this._playedIn = false;
				this._playedOut = false;

				// Call transition control handler with old and new pages instances
				// Listen when finished through promise
				Q(
					this.props.transitionControl(
						ReactDOM.findDOMNode( this._oldPage as any ),
						ReactDOM.findDOMNode( this._currentPage as any ),
						this._oldPage,
						this._currentPage
					)
				).done( () =>
				{
					// Set transition state as ended
					this._playedIn = true;
					this._playedOut = true;

					// Remove old page from state
					this.setState({
						oldPage: null
					});
				});
			}
			else
			{
				// If we have an old page (crossed transition only)
				if (this._oldPage != null)
				{
					// Play it out
					this._oldPage.playOut().then( () =>
					{
						// Update transition state and check if we still need the old page
						this._playedOut = true;
						this.checkOldPage();
					});
				}

				// If we have a new page
				if (this._currentPage != null)
				{
					// Play it in
					this._currentPage.playIn().then( () =>
					{
						// Update transition state and check if we still need the old page
						this._playedIn = true;
						this.checkOldPage();
					});
				}
			}
		}
	}

	/**
	 * Check if old page is still usefull.
	 * Will remove oldPage if transition type is crossed
	 * and if old and new pages are played.
	 */
	protected checkOldPage ()
	{
		if (
			// Only for crossed transition type
			this.props.transitionType == ETransitionType.PAGE_CROSSED

			// Only when new page is played in and old page is played out
			&&
			this._playedIn && this._playedOut

			// Only if we have an old page (do we ?)
			&&
			this._oldPage != null
		)
		{
			// Remove old page from state
			this.setState({
				oldPage: null
			});
		}
	}


	// ------------------------------------------------------------------------- PAGES

	/**
	 * Show a new page in this stack.
	 *
	 * Pass every parameter as null if you need to clear the stack.
	 * Current page will be destroyed and no new page will be required.
	 *
	 * @param pPageName Page name which will be required from "page" module type with DependencyManager
	 * @param pActionName Action name to execute on page
	 * @param pParameters Action parameters to pass
	 * @returns false if page is not loaded
	 */
	public showPage (pPageName:string, pActionName:string, pParameters:IActionParameters):boolean
	{
		// TODO : Faire le système d'annulation de changement de page
		// TODO : Avec shouldPlayIn et shouldPlayOut, voir ce que cela implique sur le routeur

		// If this is the same page
		if (pPageName == this._currentPageName)
		{
			// Just change action and parameters, not page
			this.setState({
				currentPage : {
					pageClass  : (
						this.state.currentPage == null
							? null
							: this.state.currentPage.pageClass
					),
					action    : pActionName,
					parameters  : pParameters
				}
			});

			// Do not go further
			return true;
		}

		// Bind play in method to the good scope and with new action parameters
		const boundAddNewPage = this.addNewPage.bind(this, pPageName, pActionName, pParameters);

		// If we are in crossed transition mode or if this is the first page
		if (
			this.state.currentPage == null
			||
			this.props.transitionType == ETransitionType.PAGE_CROSSED
			||
			this.props.transitionType == ETransitionType.CONTROLLED
		)
		{
			// Start new page directly
			boundAddNewPage();
		}
		else
		{
			// We haven't played out yet
			this._playedOut = false;

			// Else we have to play out the current page first
			Q( this._currentPage.playOut() ).done( boundAddNewPage );
		}

		// Everything is ok
		return true;
	}

	/**
	 * Add new page to state, by its name.
	 * Will play in (through componentDidUpdate)
	 * And also trigger action and parameters.
	 * @param pPagePath Page path to play in
	 * @param pActionName Action name to trigger
	 * @param pParameters Associated parameters
	 */
	protected addNewPage (pPagePath:string, pActionName:string, pParameters:IActionParameters):void
	{
		// If we are in sequential transition
		// We have played out here
		if (this.props.transitionType == ETransitionType.PAGE_SEQUENTIAL)
		{
			this._playedOut = true;
		}

		// We are playing in new page from here.
		this._playedIn = false;

		// Record page name
		this._currentPageName = pPagePath;

		// Class of the new page, can be null if no new page is required
		let NewPageClass:any;

		// Only require new page if pageName is not null
		if (pPagePath != null)
		{
			// TODO :

			import(pPagePath)

			.catch( error =>
			{
				// Call not found handler
				if (this.props.onNotFound != null)
				{
					this.props.onNotFound( pPagePath );
				}
				// If we do not have handler, throw error
				else
				{
					throw error;
				}
			})

			.then( NewPageClass =>
			{
				// Set state with new page class, action and parameters
				// React will do its magic !
				this.setState({

					// Incrément index for keys so react isn't lost between old and new pages
					currentPageIndex : this.state.currentPageIndex + 1,

					// Record current page as old page if we are in crossed or controlled transition type
					oldPage : (
						(
							this.props.transitionType == ETransitionType.PAGE_CROSSED
							||
							this.props.transitionType == ETransitionType.CONTROLLED
						)
						? this.state.currentPage
						: null
					),

					// New page and associated action and parameters
					currentPage    : {
						pageClass  : NewPageClass,
						action        : pActionName,
						parameters : pParameters
					}
				});
			});
		}
	}
}
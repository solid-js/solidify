
import * as React from "react";
import * as ReactDOM from "react-dom";

export class ReactView<Props, States> extends React.Component<Props, States>
{
	// ------------------------------------------------------------------------- PROPS

	public props		:Props;
	public state		:States;


	// ------------------------------------------------------------------------- INIT

	constructor (props:Props, context:any)
	{
		// Relay construction
		super(props, context);

		// Prepare component
		this.prepare();
	}

	/**
	 * Prepare component before init
	 */
	protected prepare () { }

	/**
	 * Set or init new state for component.
	 * Will securely set state if state is null.
	 * Will update state with setState if state is already present.
	 * @param pState New state
	 * @param pCallback When state is ready
	 */
	protected initState (pState:States, pCallback?: () => any):void
	{
		// TODO : Voir si ça ne fait pas doublon avec getInitialState !
		// http://brewhouse.io/blog/2015/03/24/best-practices-for-component-state-in-reactjs.html

		// If have no current state
		if (this.state == null)
		{
			// Securely set state
			this.state = pState;

			// Callback if needed
			pCallback && pCallback();
		}

		// Juste relay state udpate
		else super.setState(pState, pCallback);
	}

	// ------------------------------------------------------------------------- REFS

	/**
	 * Get Element Collection for a ref element.
	 * You can declare ref elements in JSX with the ref attribute as a string.
	 * Really handy since JSX can change DOM on the fly.
	 * @param pRefName The ref name as string in the JSX DOM. Can be an array of string
	 * @returns {Element[]} Targeted element collection
	 */
	protected $ (pRefName:string|string[]):Element[]
	{
		// If we have an array of refs
		if (Array.isArray(pRefName))
		{
			// Map each ref DOM node to an element collection
			return (pRefName as string[] ).map(
				pSubName => ReactDOM.findDOMNode( this.refs[pSubName] )
			);
		}
		else
		{
			// Target DOM node and add to an Element Collection
			return [ ReactDOM.findDOMNode( this.refs[pRefName] ) ];
		}
	}


	/**
	 * Ref object in a array of components and as an Element Collection.
	 * Have to be called with ref JSX parameter, like this : ref={this.refNodes.bind(this, 'name', key)}
	 * Will store an array of component called _name
	 * Will store an Element Collection called $name
	 * @param pRefName Name of the array and to collection. Will be prefixed by _ for component array and by $ for Element collection.
	 * @param pComponent The component sent by react ref.
	 * @param pKey Key of the component, as number or string.
	 */
	protected refNodes (pRefName:string, pKey:number|string, pComponent:ReactView<any, any>):void
	{
		// Get collections names
		const arrayName = '_' + pRefName;
		const htmlCollectionName = '$' + pRefName;

		// If our collection does not exists
		// We create it
		if (!(arrayName in this))
		{
			this[arrayName] = [];
		}

		// If our new component is null
		// React maybe removed it from the DOM (not sure)
		if (pComponent == null)
		{
			// Removed unmounted components from the list
			delete this[arrayName][pKey];
		}
		else
		{
			// Store mounted component in collection
			this[arrayName][pKey] = pComponent;
		}

		// Convert the component collection as an element collection
		this[htmlCollectionName] = [
			Object.keys( this[arrayName] ).map(
				( pComponent:any ) => ReactDOM.findDOMNode(this[arrayName][pComponent])
			)
		];
	}
}
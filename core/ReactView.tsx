//import React = __React;
//import ReactDom = __React.__DOM;

// TODO : l'export React va poser problème dès qu'on aura à utiliser la lib ici et donc à réactiver l'import ... A surveiller ...

//import {DOMNode} from "../dom/DOMNode";

//import * as React from "react";


export class ReactView<Props, States> extends __React.Component<Props, States>
{
	public props		:Props;
	public state		:States;

	constructor (props:Props, context:{})
	{
		super(props, context);
		this.state = this.initState();
	}

	protected initState ():States
	{
		return null;
	}

	protected getRefNode (pRefName:string):JQuery
	{
		return $(ReactDom.findDOMNode(this.refs[pRefName]));
	}
}

export var React = __React;
export var ReactDom = __React.__DOM;
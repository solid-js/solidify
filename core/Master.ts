export = Master;

import Disposable = require("./Disposable");
import DOMNode = require("../dom/DOMNode");

class Master extends Disposable
{
	public domNode					:DOMNode;

	private _initialised			:boolean			= false;

	constructor ()
	{
		super();

		this.initDOMNode();
	}

	initDOMNode ():void
	{
		this.domNode = new DOMNode(this);
	}

	init ():void
	{
		if (this._initialised) throw new Error("Master.init // Already initialised.");

		this._initialised = true;

		this.configure();
	}

	configure ():void { }
}
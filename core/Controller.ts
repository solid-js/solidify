export = Controller;

import Master = require("./Master");
import DOMNode = require("../dom/DOMNode");

class Controller extends Master
{
	get isController ():boolean { return true; }

	start ():any { }

	stop ():any { }

	index (...rest):void { }
}
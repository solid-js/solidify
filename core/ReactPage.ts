import {React, ReactDom, ReactView} from "./ReactView";
import {IPage} from "../definitions/IPage";



export class ReactPage<Props, States> extends ReactView<Props, States> implements IPage
{

	shouldPlayOut ():boolean
	{
		return true;
	}

	action (pActionName:string, pParams:{[index:string]:any})
	{
		return null;
	}

	playIn ():Q.Promise<any>
	{
		return null;
	}

	playOut ():Q.Promise<any>
	{
		return null;
	}
}
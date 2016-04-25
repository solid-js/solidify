


declare interface IGrapnelRequest
{
	params:any
}

declare interface IGrapnelConstructorParams
{
	pushState	?:boolean;
	root		?:string;
	hashBang	?:boolean;
}

declare interface IGrapnelMiddleWareHandler
{
	(pReq:IGrapnelRequest, event:GrapnelEvent, next:any): void;
}

declare class GrapnelEvent
{
	parent:() => void;
	preventDefault:() => void;
}

declare class Grapnel
{
	static listen : (pOptions:IGrapnelConstructorParams, pRoutes:{ [index:string]:IGrapnelMiddleWareHandler } ) => Grapnel;

	constructor (pParams:IGrapnelConstructorParams);

	get (
		pRoute:string,
		pHandler:IGrapnelMiddleWareHandler
	) : void;

	get (
		pRoute:string,
		pMiddleWare:IGrapnelMiddleWareHandler,
		pHandler:IGrapnelMiddleWareHandler
	) : void;

	on (pEventName:string, pHandler:(pEvent:Event) => void) : void;

	path (pPath?:string|boolean) : string;

	navigate (pRoute:string);
}

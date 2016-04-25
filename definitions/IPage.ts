

export interface IPage
{
	shouldPlayOut ():boolean;

	action (pActionName:string, pParams:{[index:string]:any});

	playIn ():Q.Promise<any>;

	playOut ():Q.Promise<any>;
}
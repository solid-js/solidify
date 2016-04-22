


export class Config
{
	protected static __instance:Config;

	static get instance ()
	{
		if (Config.__instance == null)
		{
			Config.__instance = new Config();
		}

		return Config.__instance;
	}


	static getAll<ParamsType> ():ParamsType
	{
		return this.instance.getAll<ParamsType>();
	}

	static getFromName (pVarName:string)
	{
		return this.instance.getFromName(pVarName);
	}


	protected _params:any = {};

	constructor () { }

	inject (pProps)
	{
		console.log('inject', pProps);
		for (var i in pProps)
		{
			this._params[i] = pProps[i];
		}
	}

	getAll<ParamsType> ():ParamsType
	{
		return this._params;
	}

	getFromName (pVarName:string)
	{
		return this._params[pVarName];
	}
}
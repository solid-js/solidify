export class ArrayUtils
{
	// TODO : Passer ses utils en generics pour garder le type
	// TODO : Virer var i in et passer en indexs

	static inArray (pArray:any[], pElement:any):boolean
	{
		for (var i in pArray)
		{
			if (pArray[i] == pElement)
			{
				return true;
			}
		}

		return false;
	}

	static deleteWhere (pArray:any[], pWhere:{}):any[]
	{
		var newArray = [];

		for (var i in pArray)
		{
			for (var j in pWhere)
			{
				if (!(j in pArray[i]) || pWhere[j] != pArray[i][j])
				{
					newArray.push(pArray[i]);
					break;
				}
			}
		}

		return newArray;
	}

	static removeElement (pArray:any[], pElement:any)
	{
		var newArray = [];
		for (var i in pArray)
		{
			if (pArray[i] != pElement)
			{
				newArray.push(pArray[i]);
			}
		}
		return newArray;
	}
}
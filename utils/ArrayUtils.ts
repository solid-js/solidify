export class ArrayUtils
{
	// TODO : Passer ses utils en generics pour garder le type

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
}
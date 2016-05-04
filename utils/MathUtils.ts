export class MathUtils
{
	/**
	 * Get the angle between 3 points in radians
	 * @param pPoints An array container 3 points, each point object need to have 'x' and 'y' properties.
	 * @return Angle in radians
	 */
	static angle3 (pPoints:{x:number; y:number}[]):number
	{
		// Get 3 absolute angles
		var AB = Math.sqrt(Math.pow(pPoints[1].x - pPoints[0].x, 2) + Math.pow(pPoints[1].y - pPoints[0].y, 2));
		var BC = Math.sqrt(Math.pow(pPoints[1].x - pPoints[2].x, 2) + Math.pow(pPoints[1].y - pPoints[2].y, 2));
		var AC = Math.sqrt(Math.pow(pPoints[2].x - pPoints[0].x, 2) + Math.pow(pPoints[2].y - pPoints[0].y, 2));

		// Compute relative angle between the 3 points
		return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
	}

	/**
	 * Convert radian angle to degrees
	 */
	static radToDeg (pAngle:number):number
	{
		return pAngle / Math.PI * 180;
	}

	/**
	 * Convert degree angle to radians
	 */
	static degToRad (pAngle:number):number
	{
		return pAngle / 180 * Math.PI;
	}

	/**
	 * Get number value from a jquery css property.
	 * Will return an array with the number parsed value and the unit.
	 * Can parse % and px values.
	 * Will return [0, null] in case of error.
	 * Exemple : cssToNumber("35px") -> [35, "px"]
	 * @param pValue The returned value from jQuery css
	 * @return First value is the number value, second index is the unit ("px" or "%")
	 */
	static cssToNumber (pValue:string):any[]
	{
		// Chercher l'unité "px"
		var indexToCut = pValue.indexOf("px");

		// Chercher l'unité "%""
		if (indexToCut == -1)
		{
			indexToCut = pValue.indexOf("%");
		}

		// Résultat
		return (
			// Si on n'a pas trouvé l'unité
			indexToCut == -1

				// On ne peut pas retourner
				? [
				parseFloat(pValue),
				null
			]

				// Séparer la valeur de l'unité
				: [
				parseFloat(pValue.substr(0, indexToCut)),
				pValue.substr(indexToCut, pValue.length).toLowerCase()
			]
		)
	}

	/**
	 * Return an offset value in a range from 0 to max.
	 * For exemple :
	 * 1. if currentValue is 8, max is 9 and you set an offset of 1, you'll get back to 0.
	 *
	 * It also works for negative offsets :
	 * 2. If currentValue is 0, max is 9 and you set an offset of -1, you'll get to 8
	 *
	 * It works with all offsets as real numbers less than max :
	 * 3. If currentValue is 3, max is 9 and you set an offset of 8, you'll get to 2
	 *
	 * @param pCurrentValue
	 * @param pMax
	 * @param pOffset
	 * @returns {number}
	 */
	static circularRange (pCurrentValue:number, pMax:number, pOffset:number):number
	{
		return (((pCurrentValue + pOffset) % pMax) + pMax) % pMax;
	}
}
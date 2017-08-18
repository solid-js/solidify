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
		let AB = Math.sqrt(Math.pow(pPoints[1].x - pPoints[0].x, 2) + Math.pow(pPoints[1].y - pPoints[0].y, 2));
		let BC = Math.sqrt(Math.pow(pPoints[1].x - pPoints[2].x, 2) + Math.pow(pPoints[1].y - pPoints[2].y, 2));
		let AC = Math.sqrt(Math.pow(pPoints[2].x - pPoints[0].x, 2) + Math.pow(pPoints[2].y - pPoints[0].y, 2));

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

	/**
	 * Limit a value between a min and a max
	 * @param pMin Can't go bellow
	 * @param pValue Our value to limit
	 * @param pMax Can't go above
	 * @returns {number} Limited value
	 */
	static limitRange (pMin:number, pValue:number, pMax:number):number
	{
		return Math.max(pMin, Math.min(pValue, pMax));
	}

	/**
	 * Return a random number between min and max.
	 * @param pMin Can't go bellow
	 * @param pMax Can't go above
	 * @param pRound If true, will be rounded by Math.floor.
	 * @returns {number}
	 */
	static randomRange (pMin:number, pMax:number, pRound = false)
	{
		// Get random value between min and max
		let value = pMin + Math.random() * (pMax - pMin);

		// Round if needed and return
		return pRound ? Math.floor(value) : value;
	}

	/**
	 * Return a random integer number between 0 and pTo, excluded.
	 * Usefull to get a random element from an array.
	 * @param pTo Maximum number, excluded.
	 * @returns {number} int from 0 to pTo, excluded
	 */
	static randomTo (pTo:number):number
	{
		return Math.floor(Math.random() * pTo);
	}

	/**
	 * Return true or false, you don't know.
	 * @returns {boolean}
	 */
	static randomBool ():boolean
	{
		return Math.random() > .5;
	}

	/**
	 * Returns positive modulo, even when 'n' is negative.
	 * From http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
	 */
	static positiveModulo (n:number, m:number):number
	{
		return ((n % m) + m) % m;
	}
}
export class DOMUtils
{
	/**
	 * The name of the silly greensock injected var
	 */
	private static GS_TRANSFORM_KEY = '_gsTransform';

	/**
	 * Get a position value transformed by Greensock.
	 * Ex X or Y while a transition on a any object.
	 */
	static getGreensockValue (pTarget:any):number
	{
		// No target
		if (pTarget == null)
		{
			return null;
		}

		// Transform key available
		else if (DOMUtils.GS_TRANSFORM_KEY in pTarget)
		{
			return pTarget[DOMUtils.GS_TRANSFORM_KEY];
		}

		// Transform key available in first child (jQuery)
		else if ((0 in pTarget) && DOMUtils.GS_TRANSFORM_KEY in pTarget[0])
		{
			return pTarget[0][DOMUtils.GS_TRANSFORM_KEY];
		}

		// Oops
		else return null;
	}
}
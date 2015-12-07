export = DOMUtils;

class DOMUtils
{
	private static GS_TRANSFORM_KEY = '_gsTransform';

	static getGreensockValue (pTarget:any)
	{
		if (pTarget == null)
		{
			return null;
		}
		else if (DOMUtils.GS_TRANSFORM_KEY in pTarget)
		{
			return pTarget[DOMUtils.GS_TRANSFORM_KEY];
		}
		else if (DOMUtils.GS_TRANSFORM_KEY in pTarget[0])
		{
			return pTarget[0][DOMUtils.GS_TRANSFORM_KEY];
		}

		else return null;
	}
}
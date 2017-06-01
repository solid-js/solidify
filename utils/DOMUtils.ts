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

	/**
	 * Get size of scrollbar following client env.
	 * Warning hazardous code !
	 * @returns the default size of a vertical scrollbar
	 */
	static getScrollBarSize ():Number
	{
		// Create temp scrollable div
		let $scrollableDiv = $('<div></div>').addClass('verticalScroll').css({
			position: 'absolute',
			width: 100,
			height: 100,
			overflow: 'scroll',
			top: -9999
		});

		// Append it to body
		$scrollableDiv.appendTo($('body'));

		// Measure inner and outer size
		let scrollBarWidth = $scrollableDiv[0].offsetWidth - $scrollableDiv[0].clientWidth;

		// Remove from dom
		$scrollableDiv.remove();

		// Return measured size and pray
		return scrollBarWidth;
	}

	/**
	 * Get the height of a JQuery element at size 'auto'.
	 * Will measure height at auto and rollback to previous height in a blink.
	 * Element have to be in DOM. Preferable to have it visible (with no display:none parents)
	 * @param $pElement The jquery element to measure. Only one element please :)
	 * @param pIncludeBorderAndPadding If we have to include padding and border in measurement
	 * @param pIncludeMargins If we have to include padding and border in measurement
	 * @returns {number} The height in pixels
	 */
	static getAutoHeight ($pElement:JQuery, pIncludeBorderAndPadding = false, pIncludeMargins = false):number
	{
		// Get the current height value
		let currentHeightValue = $pElement.css('height');

		// Set to auto
		$pElement.css({height: 'auto'});

		// Measure the auto height
		let descriptionHeight = pIncludeBorderAndPadding ? $pElement.outerHeight(pIncludeMargins) : $pElement.height();

		// Roll back to the first measured height value
		$pElement.css({height: currentHeightValue});

		// Return auto height
		return descriptionHeight;
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
		let indexToCut = pValue.indexOf("px");

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
	 * Get scaled value of any DOM element even if scale is modified by a parent.
	 * @param pElement The element (not jquery this time) to check
	 * @returns {[number,number]} Will return an array with width and height values.
	 */
	static getGlobalScale (pElement:Element):number[]
	{
		return [
			pElement.getBoundingClientRect().width / pElement['offsetWidth'],
			pElement.getBoundingClientRect().height / pElement['offsetHeight']
		];
	}

	/**
	 * Will check if a target is corresponding to a selector, or if a parent of
	 * this target is also corresponding to this selector.
	 * Really handy to know if a global handler is on a specific objet,
	 * or any of its children.
	 * Will return jQuery selector and not boolean if you want to do
	 * operation on targeted parent.
	 * Check length to know if any parent is found.
	 * @param pTarget The jQuery element to check or its parents.
	 * @param pSelector Selector on which target or parent we have to check.
	 * @returns {JQuery} target or any of its parents correspond to the selector
	 */
	static isTargetOrParent (pTarget:JQuery, pSelector:string):JQuery
	{
		return (
			pTarget.is(pSelector)
			? pTarget
			: pTarget.parents(pSelector)
		);
	}
}
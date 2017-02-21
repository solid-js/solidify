export class LoadUtils
{
	/**
	 * Will check if an image is loaded.
	 * Will only check element 0 of the jQuery target.
	 * @param $pElement JQuery targeting image element. Will only check first one.
	 * @returns {boolean|any} true if image is loaded.
	 */
	static checkCompleteAttribute ($pElement:JQuery):boolean
	{
		return (0 in $pElement && 'complete' in $pElement[0] && $pElement[0]['complete']);
	}

	/**
	 * This method is a patch for jQuery.load.
	 * With jQuery, if you listen image loading, it will fail if images are retrieved from the cache,
	 * or if images are loaded before you start the listener.
	 * This will just check if the image is already loaded on handler attachment. Simple.
	 * @param $pElement The jQuery element you want to check. Only image, only one element.
	 * @param pHandler Called when image is loaded. Element will be passed on first parameter, and event as second argument if available.
	 */
	static patchedImageLoad ($pElement:JQuery, pHandler:($pElement:JQuery, pEvent:JQueryEventObject) => void)
	{
		// Check our jQuery target. Not null and have to target one element. We do not check if it's an image at this point.
		if ($pElement == null || $pElement.length != 1) throw new Error('LoadUtils.patchedOnLoad // $pElement need to target only one DOM element.');

		// Check if the complete property exists and is set to true
		if (LoadUtils.checkCompleteAttribute($pElement))
		{
			// The image is already loaded
			pHandler($pElement, null);
		}
		else
		{
			// The image is not loaded, attach handler
			$pElement.one('load', (pEvent) => pHandler($pElement, pEvent) );
		}
	}

	/**
	 * Preload images from URL's. Will call handler when images are loaded.
	 * TODO : Test from new refactoring
	 * @param pURLs URL's of images to load
	 * @param pHandler Called when all images are loaded. First argument is list of loaded images elements.
	 */
	static preloadImages (pURLs:string[], pHandler:(pImages:Element[]) => void):void
	{
		// Count images
		let total = pURLs.length;
		let current = 0;

		// Images elements
		let images:HTMLImageElement[] = [];

		// Called when an image is loaded
		let handler = function ($pElement:JQuery)
		{
			// Add image element to list
			images.push($pElement[0] as HTMLImageElement);

			// Remove element to avoid memory leaks
			$pElement.remove();

			// Count loaded image
			// If all are loaded, call handler
			if (++ current == total)
			{
				pHandler(images);
			}
		};

		// Browse URL's to load
		for (let i in pURLs)
		{
			// Load image
			LoadUtils.patchedImageLoad(
				// Create void image tag, attach loader THEN set src attribute to start loading
				$('<img />', {
					src: pURLs[i]
				}),
				// When loaded
				handler
			);
		}
	}

	/**
	 * WARNING, HAZARDOUS NUCLEAR NOT SO TESTED WEAPON.
	 * USE WITH CAUTION.
	 * Dirty hack from http://stackoverflow.com/questions/5680013/how-to-be-notified-once-a-web-font-has-loaded
	 * Preload fonts. It will add text node to body with wanted font. Invisible.
	 * Then it goes nasty but also clever :) It will check for any size change. If a change is detected, then the font is loaded.
	 * TODO : Change the way of targeting fonts : Use a class, cleaner since the name of the font is typed into CSS.
	 * @param fonts List of fonts name to load.
	 * @param callback Called when all fonts are loaded.
	 */
	static preloadFont (fonts:string[], callback:() => void):void
	{
		let loadedFonts = 0;

		function fontLoaded ()
		{
			if (++ loadedFonts == fonts.length)
			{
				callback();
			}
		}

		for (let i = 0, l = fonts.length; i < l; ++i)
		{
			(function(font) {
				let node = document.createElement('span');
				// Characters that vary significantly among different fonts
				node.innerHTML = 'giItT1WQy@!-/#';
				// Visible - so we can measure it - but not on the screen
				node.style.position      = 'absolute';
				node.style.left          = '-10000px';
				node.style.top           = '-10000px';
				// Large font size makes even subtle changes obvious
				node.style.fontSize      = '300px';
				// Reset any font properties
				node.style.fontFamily    = 'sans-serif';
				node.style.fontVariant   = 'normal';
				node.style.fontStyle     = 'normal';
				node.style.fontWeight    = 'normal';
				node.style.letterSpacing = '0';
				document.body.appendChild(node);

				// Remember width with no applied web font
				let width = node.offsetWidth;

				node.style.fontFamily = font;

				let interval;
				let checked = 0;
				function checkFont()
				{
					//console.log("CHECK", node.offsetWidth, width);

					// Compare current width with original width
					if(node.offsetWidth != width || ++checked > 200 /* 10s */)
					{
						node.parentNode.removeChild(node);
						node = null;

						if (interval)
						{
							window.clearInterval(interval);
							fontLoaded();
						}
					}
				}

				interval = window.setInterval(checkFont, 100);

			})(fonts[i]);
		}
	}
}
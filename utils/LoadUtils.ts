export class LoadUtils
{
	// TODO : Doc !

	static preloadImages (pURLs:string[], pHandler:(pImages:Element[]) => void):void
	{
		var total = pURLs.length;
		var current = 0;

		var images = [];

		var handler = function (pEvent:JQueryEventObject)
		{
			images.push(pEvent.target);

			if (++ current == total)
			{
				pHandler(images);
			}
		};

		// TODO : Vérifier si on n'a pas un leak ici (balise crée dans le vide avec un handler)

		for (var i in pURLs)
		{
			$('<img src="' + pURLs[i] + '" />').load(handler);
		}
	}

	// TODO : Doc !

	// Dirty hack from http://stackoverflow.com/questions/5680013/how-to-be-notified-once-a-web-font-has-loaded

	static preloadFont (fonts:string[], callback:() => void):void
	{
		var loadedFonts = 0;

		function fontLoaded ()
		{
			if (++ loadedFonts == fonts.length)
			{
				callback();
			}
		}

		for(var i = 0, l = fonts.length; i < l; ++i)
		{
			(function(font) {
				var node = document.createElement('span');
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
				var width = node.offsetWidth;

				node.style.fontFamily = font;

				var interval;
				var checked = 0;
				function checkFont()
				{
					console.log("CHECK", node.offsetWidth, width);

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
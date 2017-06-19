// todo : SOLID doc pour les différents dégradé implémenter + throw error si pDirection pas bon

export enum GradientTypes
{
	LINEAR,
	RADIAL
}

export class BitmapUtils
{
	/**
	 * Générer un bitmap dégradé
	 * @param pWidth Largeur de l'image
	 * @param pHeight Hauteur de l'image
	 * @param pColorStops Liste des couleurs (premier index étant la position du dégradé entre 0 et 1, et en second index la couleur)
	 * @param pGradientType Linear or radial gradient. Look for enum GradientTypes on module BitmapUtils.
	 * @param pDirection Direction du dégradé comme suit : x0 y0 x1 y1
	 * @returns Le dégradé sous forme d'élément canvas
	 */
	static generateGradient (pWidth:number, pHeight:number, pColorStops:any[][], pGradientType:GradientTypes, pDirection:number[] = [0, 0, pWidth, pHeight]):HTMLCanvasElement
	{
		// Créer le canvas aux bonnes dimensions
		var canvas = document.createElement('canvas');
		canvas.width = pWidth;
		canvas.height = pHeight;

		// Récupérer le contexte 2D
		var context = canvas.getContext('2d');

		// Dessiner sur toute la surface
		context.rect(0, 0, pWidth, pHeight);

		var gradient;

		if (pGradientType == GradientTypes.RADIAL)
		{
			pDirection[0] = pWidth / 2;
			pDirection[1] = pHeight / 2;
			pDirection[2] = Math.min(pWidth, pHeight) / 2;

			gradient = context.createRadialGradient(pDirection[0], pDirection[1], 0, pDirection[0], pDirection[1], pDirection[2]);
		}
		else if (pGradientType == GradientTypes.LINEAR)
		{
			if (pDirection.length != 4)
			{
				// todo : throw error
			}

			// Créer le dégradé linéaire
			gradient = context.createLinearGradient(pDirection[0], pDirection[1], pDirection[2], pDirection[3]);
		}
		else
		{
			// todo : throw error
		}

		// Ajouter chaque stop
		for (var i in pColorStops)
		{
			gradient.addColorStop(pColorStops[i][0], pColorStops[i][1]);
		}

		// Dessiner
		context.fillStyle = gradient;
		context.fill();

		// Retourner le canvas
		return canvas;
	}

	// todo : doc

	static generateText (pText:string, pWidth:number, pHeight:number, pFont:string = "12px Arial", pColor:string = "black", pAlign:string = "left", pVerticalOffset:number = 1):HTMLCanvasElement
	{
		// Créer le canvas aux bonnes dimensions
		var canvas = document.createElement('canvas');

		// Définir la taille
		canvas.width = pWidth;
		canvas.height = pHeight;

		// Récupérer le contexte 2D
		var context = canvas.getContext('2d');

		// Configurer le texte
		context.font = pFont;
		context.textBaseline = "top";
		context.fillStyle = pColor;
		context.textAlign = pAlign;

		var horizontalOffset = 1;

		if (pAlign.toLowerCase() == "center")
		{
			horizontalOffset = pWidth / 2;
		}

		// Ecrire le texte
		context.fillText(pText, horizontalOffset, pVerticalOffset);

		// Retourner le canvas
		return canvas;
	}

	/**
	 * Create canvas from multiline text.
	 * Height will be auto from fixed width.
	 * Width and height will be defined on canvas object.
	 * @param pText text to print on canvas
	 * @param pMaxWidth max-width in pixel of the text. If the text overlaps this width, it warps.
	 * @param pLineHeight distance between the lines, in pixel.
	 * @param pFont size and font name of the text
	 * @param pColor color of the text
	 * @param pAlign alignement of the text left/center/right
	 * @param pPadding Padding arround text to avoid bleeding
	 * @returns {HTMLCanvasElement}
	 */
	static generateMultilineText (pText:string, pMaxWidth:number, pLineHeight:number, pFont:string = "12px Arial", pColor:string = "black", pAlign:string = "left", pPadding = 2):HTMLCanvasElement
	{
		// Create canvas and get 2D context
		let canvas = document.createElement('canvas');
		let context = canvas.getContext('2d');

		// Configure text drawing
		context.font = pFont;
		context.textBaseline = "top";
		context.fillStyle = pColor;
		context.textAlign = pAlign;

		// Split text in words to get auto line breaks
		let words = pText.split(' ');
		let currentLine = '';
		let lines = [];

		// Get final height of the canvas
		let y = pPadding;
		for (let n = 0; n < words.length; n++)
		{
			// Add a word at end of line
			let testLine = currentLine + words[n] + ' ';
			let metrics = context.measureText(testLine);
			let testWidth = metrics.width;

			// If we get too much width
			if (testWidth > (pMaxWidth - (pPadding * 2)) && n > 0)
			{
				// Register line for drawing
				lines.push(currentLine);

				// Reset next line and add last word to next line
				currentLine = words[n] + ' ';

				// Break line
				y += pLineHeight;
			}

			// Still not filling all current line
			else
			{
				// Test next word on same line
				currentLine = testLine;
			}
		}

		// Register last line for drawing
		lines.push(currentLine);

		// Set canvas size before re-setting context options
		canvas.width = pMaxWidth;
		canvas.height = y + pPadding + pLineHeight;

		// Configure text drawing options now our canvas is resized
		context.font = pFont;
		context.textBaseline = "top";
		context.fillStyle = pColor;
		context.textAlign = pAlign;

		// Draw lines on canvas
		y = pPadding;
		for (let n = 0; n < lines.length; n++)
		{
			context.fillText(lines[n], pPadding, (n * pLineHeight));
		}

		// Return filled canvas
		return canvas;
	}
}

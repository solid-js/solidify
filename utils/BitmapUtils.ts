export = BitmapUtils;

module BitmapUtils
{
	// todo : SOLID doc pour les différents dégradé implémenter + throw error si pDirection pas bon

	export enum GradientTypes
	{
		LINEAR,
		RADIAL
	}

	/**
	 * Générer un bitmap dégradé
	 * @param pWidth Largeur de l'image
	 * @param pHeight Hauteur de l'image
	 * @param pColorStops Liste des couleurs (premier index étant la position du dégradé entre 0 et 1, et en second index la couleur)
	 * @param pGradientType Linear or radial gradient. Look for enum GradientTypes on module BitmapUtils.
	 * @param pDirection Direction du dégradé comme suit : x0 y0 x1 y1
	 * @returns Le dégradé sous forme d'élément canvas
	 */
	export function generateGradient (pWidth:number, pHeight:number, pColorStops:any[][], pGradientType:GradientTypes, pDirection:number[] = [0, 0, pWidth, pHeight]):HTMLCanvasElement
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

	export function generateText (pText:string, pWidth:number, pHeight:number, pFont:string = "12px Arial", pColor:string = "black", pAlign:string = "left", pVerticalOffset:number = 1):HTMLCanvasElement
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
}
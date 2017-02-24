


export class Color
{
	r:number;
	g:number;
	b:number;

	constructor (pR:number = 0, pG:number = 0, pB:number = 0)
	{
		this.r = pR;
		this.g = pG;
		this.b = pB;
	}
}


export class ColorsUtils
{
	static convertHexToColor (pHex:string):Color
	{
		let match = pHex.replace(/#/,'').match(/.{1,2}/g);

		return new Color(
			parseInt(match[0], 16),
			parseInt(match[1], 16),
			parseInt(match[2], 16)
		);
	}


	static colorBetween (pA:Color, pB:Color, pRatio)
	{
		let newColor = new Color();

		['r', 'g', 'b'].map((colorName) =>
		{
			newColor[colorName] = Math.round(pA[colorName] + (pB[colorName] - pA[colorName]) * pRatio);
		});

		return newColor;
	}
}
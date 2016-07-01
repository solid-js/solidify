export class StringUtils
{
	/**
	 * Add a trailing slash to the end of the path if not provided.
	 * For ex: "/lib/test" become "/lib/test/".
	 * @param pPath String path with or without trailing slash
	 * @returns patched path with trailing slash
	 */
	static addTrailingSlash (pPath:string):string
	{
		return (pPath.lastIndexOf("/") != pPath.length - 1 ? pPath + "/" : pPath);
	}

	/**
	 * First letter capital on given string.
	 * For ex: "courgette? Oui!" become "Courgette, Oui!"
	 */
	static upperCaseFirstChar (pSource:string):string
	{
		return pSource.substr(0, 1).toUpperCase() + pSource.substr(1, pSource.length);
	}

	/**
	 * First letter in low case on given string.
	 * For ex: "Fromage? Oui!" become "fromage? Oui!"
	 */
	static lowerCaseFirstChar (pSource:string):string
	{
		return pSource.substr(0, 1).toLowerCase() + pSource.substr(1, pSource.length);
	}

	/**
	 * Convert a snake case formated string to a camel case format.
	 * Ex: "my-string" will be converted to "myString"
	 */
	static snakeToCamelCase (pSource:string, pSeparator:string = '-'):string
	{
		// Seperate dashs
		var splitted = pSource.toLowerCase().split(pSeparator);
		var total = splitted.length;

		// Return raw if it's not a snake
		if (total < 2) return pSource.toLowerCase();

		// The first is not uppercase
		var out = splitted[0];

		// Others are upper cased first
		for (var i = 1; i < total; i ++)
		{
			out += (i == 0 ? splitted[i] : StringUtils.upperCaseFirstChar(splitted[i]));
		}

		return out;
	}

	// todo : cameltosnake
	/*
	 static camelToSnakeCase (pSource:string):string { }
	 */

	/**
	 * Convertir un enum en string, camelCase ou snakeCase.
	 * Va convertir un EMonEnum.MA_VALEUR en "maValeur" ou "ma-valeur"
	 * @param pEnumValue La valeur de l'enum ( EMonEnum.MA_VALEUR )
	 * @param pEnumClass La classe de l'enum ( EMonEnum )
	 * @param pCamelCase si true on ressort "maValeur" si false on ressort "ma-valeur"
	 * @returns {string} Le nom en camelCase ou snake-case
	 */
	static enumToString (pEnumValue:number, pEnumClass:Object, pCamelCase = true):string
	{
		// On récupère le string en underscore depuis notre enum
		var enumStringValue = pEnumClass[pEnumValue] as string;

		// On converti en snakeCase
		var enumSnakeValue = enumStringValue.toLowerCase().split('_').join('-');

		// On retourne en camel ou en snake
		return pCamelCase ? StringUtils.snakeToCamelCase(enumSnakeValue) : enumSnakeValue;
	}

	/**
	 * Get file name from any path.
	 * Will return full string if no slash found.
	 * ex : 'usr/bin/TestFile' will return 'TestFile'
	 */
	static getFileFromPath (pPath:string):string
	{
		var lastIndex = pPath.lastIndexOf('/');

		if (lastIndex == -1)
		{
			lastIndex = 0;
		}

		return pPath.substring(lastIndex + 1, pPath.length);
	}

	/**
	 * Get the base folder from any path.
	 * Will include trailing slash.
	 * Will return full string if no slash found.
	 * ex: 'usr/bin/TestFile' will return 'usr/bin/'
	 */
	static getBaseFromPath (pPath:string):string
	{
		var lastIndex = pPath.lastIndexOf('/');

		if (lastIndex == -1)
		{
			lastIndex = pPath.length;
		}

		return pPath.substring(0, lastIndex);
	}

	/**
	 * Micro template engine using regex and mustache like notation
	 * @param pTemplate Base mustache like template (ex: "Hey {{userName}} !")
	 * @param pValues List of replaces values (ex : {userName: "You"})
	 * @returns the computed template with values (ex : "Hey You !")
	 */
	static quickMustache (pTemplate:string, pValues:{}):string
	{
		return pTemplate.replace(/\{\{(.*?)\}\}/g, function(i, pMatch) {
			return pValues[pMatch];
		});
	}

	/**
	 * Converting ASCII special chars to slug regular chars (ex: 'héhé lol' is converted to 'hehe-lol')
	 * Handy for URLs
	 */
	static SLUG_REGEX = [ {
		regex: /[\xC0-\xC6]/g,
		char: 'A'
	}, {
		regex: /[\xE0-\xE6]/g,
		char: 'a'
	}, {
		regex: /[\xC8-\xCB]/g,
		char: 'E'
	}, {
		regex: /[\xE8-\xEB]/g,
		char: 'e'
	}, {
		regex: /[\xCC-\xCF]/g,
		char: 'I'
	}, {
		regex: /[\xEC-\xEF]/g,
		char: 'i'
	}, {
		regex: /[\xD2-\xD6]/g,
		char: 'O'
	}, {
		regex: /[\xF2-\xF6]/g,
		char: 'o'
	}, {
		regex: /[\xD9-\xDC]/g,
		char: 'U'
	}, {
		regex: /[\xF9-\xFC]/g,
		char: 'u'
	}, {
		regex: /[\xC7-\xE7]/g,
		char: 'c'
	}, {
		regex: /[\xD1]/g,
		char: 'N'
	}, {
		regex: /[\xF1]/g,
		char: 'n'
	}
	];

	/**
	 * Converting a string for URL's.
	 * For ex : "I'm a robot" will be converted to "im-a-robot"
	 */
	static slugify (pInput:string):string
	{
		const total = this.SLUG_REGEX.length;
		for (var i = 0; i < total; i ++)
		{
			pInput = pInput.replace(this.SLUG_REGEX[i].regex, this.SLUG_REGEX[i].char);
		}

		return pInput.toLowerCase()
			.replace(/\s+/g, '-')           // Replacing spaces by dashes
			.replace(/[^a-z0-9-]/g, '')     // Deleting non alphanumeric chars
			.replace(/\-{2,}/g,'-');        // Deleting multiple dashes
	}


	/**
	 * Will parse a query string like this :
	 * test=myValue&varName=otherValue
	 * to this
	 * {test: 'myValue', varName: 'otherValue'}
	 * No double declaration checking, no nesting, no number parsing.
	 * Will start after first ? or first # if found.
	 * @param pQueryString The query string to parse
	 * @returns Associative object with parsed values
	 */
	static parseQueryString (pQueryString:string):{[index:string]:string}
	{
		let varSplitters = ['&', '='];
		var queryStarters = ['?', '#'];

		// Start parsing after query starters
		for (var j in queryStarters)
		{
			// Check that query start are before var spliiters
			if (pQueryString.indexOf(queryStarters[j]) < pQueryString.indexOf(varSplitters[1]))
			{
				pQueryString = pQueryString.substring(pQueryString.indexOf(queryStarters[j]) + 1, pQueryString.length);
			}
		}

		// Split every parameters on &
		var queryParameters = pQueryString.split(varSplitters[0]);

		// Output parameters
		var params:{[index:string]:string} = {};

		// Parse parameters
		var pair:string[];
		for (var i = queryParameters.length - 1; i >= 0; i--)
		{
			// Get var name and value pair
			pair = queryParameters[i].split(varSplitters[1]);

			// Do not validate void var names
			if (pair[0].length == 0) continue;

			// Decode var name, value and store them in output bag
			params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
		}

		// Return params bag
		return params;
	}
}
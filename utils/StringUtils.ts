export = StringUtils;

class StringUtils
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
    static snakeToCamelCase (pSource:string):string
    {
        // Seperate dashs
        var splitted = pSource.toLowerCase().split('-');
        var total = splitted.length;

        // Return raw if it's not a snake
        if (total < 2) return pSource;

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
    static camelToSnakeCase (pSource:string):string
    {
        return "todoLOL";
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
    ]

    /**
     * Converting a string for URL's.
     * For ex : "I'm a robot" will be converted to "im-a-robot"
     */
    static slugify (pInput:string):string
    {
        for (var i in this.SLUG_REGEX)
        {
            pInput = pInput.replace(this.SLUG_REGEX[i].regex, this.SLUG_REGEX[i].char);
        }

        return pInput.toLowerCase()
            .replace(/\s+/g, '-')           // Replacing spaces by dashes
            .replace(/[^a-z0-9-]/g, '')     // Deleting non alphanumeric chars
            .replace(/\-{2,}/g,'-');        // Deleting multiple dashes
    }
}
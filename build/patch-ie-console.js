if ('console' in window)
{
	if (!('group' in console))
	{
		console.group = console.log;
		console.groupEnd = function () {};
	}
}
import {Disposable} from "./Disposable";

export class JView extends Disposable
{
	$root:JQuery;

	constructor ($pRoot:JQuery = null)
	{
		super();

		if ($pRoot != null)
		{
			this.$root = $pRoot;
		}

		('readyState' in document && document.readyState == 'complete')
		? this.init()
		: $(() => this.init());
	}

	protected init ()
	{
		this.beforeInit();
		this.targetRoot();
		this.prepareNodes();
		this.prepareEvents();
		this.afterInit();
	}

	protected beforeInit ()
	{

	}

	protected targetRoot ()
	{

	}

	protected prepareNodes ()
	{

	}

	protected prepareEvents ()
	{

	}

	protected afterInit ()
	{

	}
}
export = Disposable;

// Todo : this

class Disposable
{
	isDisposed:boolean = false;

	dispose ():void
	{
		this.isDisposed = true;
	}
}
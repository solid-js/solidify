


export class ScrollLocker
{

	// ------------------------------------------------------------------------- SINGLETON

	// Our singleton instance
	protected static __INSTANCE	:ScrollLocker;

	/**
	 * Get scroll locker instance.
	 * @returns {ScrollLocker}
	 */
	static get instance ():ScrollLocker
	{
		// If instance does'n exists
		if (ScrollLocker.__INSTANCE == null)
		{
			// Create a new one
			ScrollLocker.__INSTANCE = new ScrollLocker();
		}

		// Return instance
		return ScrollLocker.__INSTANCE;
	}


	// ------------------------------------------------------------------------- DOM

	/**
	 * Container to lock.
	 */
	$containerToLock			:JQuery;

	// ------------------------------------------------------------------------- LOCALS

	/**
	 * Get current lock level.
	 * If 0, scroll is unlocked.
	 * If more than 0, scroll is locked.
	 * Can't be less than 0.
	 * @type {number}
	 */
	protected _lockLevel						= 0;
	get lockLevel ():number { return this._lockLevel; }


	// ------------------------------------------------------------------------- INIT

	/**
	 * Scroll locker constructor.
	 * Default container to lock is html + body (to be Mozilla / IE compliant)
	 * You can create a custom scroll locker associated to a specific container.
	 * @param $pContainerToLock
	 */
	constructor ($pContainerToLock = $('html,body'))
	{
		this.$containerToLock = $pContainerToLock;
	}

	// ------------------------------------------------------------------------- PUBLIC

	/**
	 * Add a scroll lock.
	 * Lock level will increase.
	 */
	addLock ()
	{
		// Add lock level
		this._lockLevel ++;

		// Update lock state with new lock level
		this.updateLockState();
	}

	/**
	 * Remove a scroll lock.
	 * Lock level will decrease.
	 */
	removeLock ()
	{
		// Remove lock level
		this._lockLevel --;

		// Check if our lock level is correct
		if (this._lockLevel < 0)
		{
			throw new Error('ScrollLocker.removeLock // Too many lock removed. Please check your implementation. Ex : Do not remove on click handler with an animation because the user can click several times since the animation ;)');
		}

		// Update lock state with new lock level
		this.updateLockState();
	}

	/**
	 * Add one scroll lock if true.
	 * Remove one scroll lock if false.
	 * @param pToggle Adding or removing a scroll lock.
	 */
	toggleLock (pToggle:boolean)
	{
		pToggle ? this.addLock() : this.removeLock();
	}


	// ------------------------------------------------------------------------- STATE

	/**
	 * Update and apply lock state to container from lock level
	 */
	updateLockState ()
	{
		console.log('UPDATE LOCK STATE', this._lockLevel > 0, this.$containerToLock);


		this.$containerToLock.css({
			overflow : (this._lockLevel > 0) ? 'hidden' : ''
		});
	}
}
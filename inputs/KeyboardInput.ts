export = KeyboardInput;

import Signal = require("lib/solidify/helpers/Signal");

module KeyboardInput
{
	export var KONAMI_SEQUENCE = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

	export class Sequence
	{
		private _currentIndex					:number				= 0;
		get currentIndex ():number { return this._currentIndex; }

		private _sequence						:number[];
		get sequence ():number[] { return this._sequence; }
		set sequence (pValue:number[])
		{
			this._sequence = pValue;
			this._currentIndex = 0;
		}

		private _onIndexChanged					:Signal				= new Signal();
		get onIndexChanged ():Signal { return this._onIndexChanged; }

		private _onSequenceEntered				:Signal				= new Signal();
		get onSequenceEntered ():Signal { return this._onSequenceEntered; }


		constructor (pSequence:number[])
		{
			this._sequence = pSequence;

			$(window).bind("keydown", this.keyDownHandler);
		}

		keyDownHandler = (pEvent:JQueryEventObject):void =>
		{
			var oldIndex = this._currentIndex;

			this._currentIndex = (
				pEvent.keyCode == this._sequence[this._currentIndex]
				? this._currentIndex + 1
				: 0
			);

			if (oldIndex != this._currentIndex)
			{
				this._onIndexChanged.dispatch();
			}

			if (this._currentIndex == this._sequence.length)
			{
				this._onSequenceEntered.dispatch();

				this._currentIndex = 0;
			}
		}

		dispose ():void
		{
			$(window).unbind("keydown", this.keyDownHandler);
		}
	}
}
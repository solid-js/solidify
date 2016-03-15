import {TimerUtils} from "./TimerUtils";
export class ScrollUtils
{
	static initScrollSmoothing ()
	{
		var container,
			running=false,
			currentY = 0,
			targetY = 0,
			oldY = 0,
			maxScrollTop= 0,
			minScrollTop,
			direction,
			onRenderCallback=null,
			fricton = 0.60, // higher value for slower deceleration
			vy = 0,
			stepAmt = 2,
			minMovement= 0.1;


		var updateScrollTarget = function (amt)
		{
			targetY += amt;
			vy += (targetY - oldY) * stepAmt;

			oldY = targetY;
		};

		TimerUtils.polyfillRequestAnimationFrame();

		var render = function ()
		{
			if (vy < -(minMovement) || vy > minMovement)
			{
				currentY = (currentY + vy);
				if (currentY > maxScrollTop)
				{
					currentY = vy = 0;
				}
				else if (currentY < minScrollTop)
				{
					vy = 0;
					currentY = minScrollTop;
				}
				container.scrollTop(-currentY);

				vy *= fricton;

				//   vy += ts * (currentY-targetY);
				// scrollTopTweened += settings.tweenSpeed * (scrollTop - scrollTopTweened);
				// currentY += ts * (targetY - currentY);

				if(onRenderCallback)
				{
					onRenderCallback();
				}
			}
		};

		var animateLoop = function ()
		{
			if (!running) return;

			render();

			window.requestAnimationFrame(animateLoop);
		};

		var onWheel = function (e)
		{
			e.preventDefault();
			var evt = e.originalEvent;

			var delta = evt.detail ? evt.detail * -1 : evt.wheelDelta / 40;
			var dir = delta < 0 ? -1 : 1;

			if (dir != direction) {
				vy = 0;
				direction = dir;
			}

			//reset currentY in case non-wheel scroll has occurred (scrollbar drag, etc.)
			currentY = -container.scrollTop();

			updateScrollTarget(delta);
		};

		/*
		 * http://jsbin.com/iqafek/2/edit
		 */
		$.fn.smoothWheel = function () {
			//  var args = [].splice.call(arguments, 0);
			var options = jQuery.extend({}, arguments[0]);
			return this.each(function (index, elm) {

				container = $(this);
				container.bind("mousewheel", onWheel);
				container.bind("DOMMouseScroll", onWheel);

				//set target/old/current Y to match current scroll position to prevent jump to top of container
				targetY = oldY = container.get(0).scrollTop;
				currentY = -targetY;

				minScrollTop = container.get(0).clientHeight - container.get(0).scrollHeight;
				if(options.onRender){
					onRenderCallback = options.onRender;
				}
				if(options.remove){
					//log("122","smoothWheel","remove", "");
					running=false;
					container.unbind("mousewheel", onWheel);
					container.unbind("DOMMouseScroll", onWheel);
				}else if(!running){
					running=true;
					animateLoop();
				}
			});
		};
	}
}
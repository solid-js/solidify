export = EnvUtils;

module EnvUtils
{
	/**
	 * Listing of devices types available.
	 * Just handheld or desktop, no mobile / phone / laptop because we manage this via mediaQueries.
	 * If not found, will be desktop by default
	 */
	export enum DeviceType
	{
		HANDHELD,
		DESKTOP
	}

	/**
	 * Available platforms.
	 * Only the most common.
	 */
	export enum Platform
	{
		IOS,
		ANDROID,
		WINDOWS,
		MAC,
		UNKNOWN
	}

	/**
	 * Available browsers
	 * Only the most common.
	 */
	export enum Browser
	{
		CHROME,
		SAFARI,
		IE,
		MOZILLA,
		OPERA,
		UNKNOWN
	}
	/**
	 * Available browsers engines
	 * Only the most common.
	 */
	export enum BrowserEngine
	{
		WEBKIT,
		TRIDENT,
		GECKO,
		UNKNOWN
	}

	/**
	 * Interface for the environment capabilities
	 */
	export interface ICapabilities
	{
		retina		:boolean;
		touch		:boolean;
		audio		:boolean;
		video		:boolean;
		pushState	:boolean;
		geolocation	:boolean;
		webGL		:boolean;
	}

	/**
	 * If we need a detection
	 */
	var __NEED_DETECTION	:boolean			= true;

	/**
	 * Client informations
	 */
	var __DEVICE_TYPE		:DeviceType;
	var __PLATFORM			:Platform;
	var __BROWSER			:Browser;
	var __BROWSER_ENGINE	:BrowserEngine;
	var __CAPABILITIES		:ICapabilities;

	/**
	 * Init detection once and on demand.
	 * Will collect all needed informations.
	 */
	function initDetection ():void
	{
		if (!__NEED_DETECTION) return;

		// Get browser signature
		var browserSignature = navigator.userAgent.toLowerCase();

		// Detect device type and platform
		if (/ipad|iphone|ipod/gi.test(browserSignature))
		{
			__DEVICE_TYPE = DeviceType.HANDHELD;
			__PLATFORM = Platform.IOS;
		}
		else if (/android/gi.test(browserSignature))
		{
			__DEVICE_TYPE = DeviceType.HANDHELD;
			__PLATFORM = Platform.ANDROID;
		}
		else if (/mac/gi.test(browserSignature))
		{
			__DEVICE_TYPE = DeviceType.DESKTOP;
			__PLATFORM = Platform.MAC;
		}
		else if (/windows phone/gi.test(browserSignature))
		{
			__DEVICE_TYPE = DeviceType.HANDHELD;
			__PLATFORM = Platform.WINDOWS;
		}
		else if (/windows/gi.test(browserSignature))
		{
			__DEVICE_TYPE = DeviceType.DESKTOP;
			__PLATFORM = Platform.WINDOWS;
		}
		else
		{
			__DEVICE_TYPE = DeviceType.DESKTOP;
			__PLATFORM = Platform.UNKNOWN;
		}

		// Detect browser
		if (/chrome/gi.test(browserSignature))
		{
			__BROWSER = Browser.CHROME;
		}
		else if (/safari/gi.test(browserSignature))
		{
			__BROWSER = Browser.SAFARI;
		}
		else if (/msie/gi.test(browserSignature) || ("ActiveXObject" in window))
		{
			__BROWSER = Browser.IE;
		}
		else if (/mozilla/gi.test(browserSignature))
		{
			__BROWSER = Browser.MOZILLA;
		}
		else if (/opera/gi.test(browserSignature))
		{
			__BROWSER = Browser.OPERA;
		}
		else
		{
			__BROWSER = Browser.UNKNOWN;
		}

		// Detect browser engine
		if (/webkit/gi.test(browserSignature))
		{
			__BROWSER_ENGINE = BrowserEngine.WEBKIT;
		}
		else if (/trident/gi.test(browserSignature))
		{
			__BROWSER_ENGINE = BrowserEngine.TRIDENT;
		}
		else if (/gecko/gi.test(browserSignature))
		{
			__BROWSER_ENGINE = BrowserEngine.GECKO;
		}
		else
		{
			__BROWSER_ENGINE = BrowserEngine.UNKNOWN;
		}

		// Detect client capabilities
		__CAPABILITIES = {
			retina		:(("devicePixelRatio" in window) && window.devicePixelRatio >= 1.5),
			touch		:("ontouchstart" in document),
			audio		:("canPlayType" in document.createElement("audio")),
			video		:("canPlayType" in document.createElement("video")),
			pushState	:("history" in window && "pushState" in history),
			geolocation	:("geolocation" in navigator),
			webGL		:(isWebglAvailable())
		};

		// Don't need detection anymore
		__NEED_DETECTION = false;
	}

	/**
	 * Detect WebGL capability
	 */
	function isWebglAvailable ()
	{
		try
		{
			var canvas = document.createElement("canvas");
			return !!(
				window["WebGLRenderingContext"] &&
				(canvas.getContext("webgl") ||
				canvas.getContext("experimental-webgl"))
			);
		}
		catch(e)
		{
			return false;
		}
	}


	/**
	 * Get the device type following enum DeviceType
	 */
	export function getDeviceType ():DeviceType
	{
		initDetection();
		return __DEVICE_TYPE;
	}

	/**
	 * Check if we run in a specific device type.
	 * See enum DeviceType
	 */
	export function isDeviceType (pDeviceType:DeviceType):boolean
	{
		initDetection();
		return getDeviceType() == pDeviceType;
	}


	/**
	 * Get the platform following enum Platform
	 */
	export function getPlatform ():Platform
	{
		initDetection();
		return __PLATFORM;
	}

	/**
	 * Check if we run in a specific platform.
	 * See enum Platform
	 */
	export function isPlatform (pPlatform:Platform):boolean
	{
		initDetection();
		return getPlatform() == pPlatform;
	}


	/**
	 * Get the browser following enum Browser
	 */
	export function getBrowser ():Browser
	{
		initDetection();
		return __BROWSER;
	}

	/**
	 * Get IE Version
	 * Returns Number.POSITIVE_INFINITY if not IE, so you can test if version <= 9 for ex
	 */
	export function getIEVersion ():number
	{
		var myNav = navigator.userAgent.toLowerCase();
		return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1], 10) : Number.POSITIVE_INFINITY;
	}

	/**
	 * Check if we run in a specific browser.
	 * See enum Browser
	 */
	export function isBrowser (pBrowser:Browser):boolean
	{
		initDetection();
		return getBrowser() == pBrowser;
	}


	/**
	 * Get the browser engine following enum BrowserEngine
	 */
	export function getBrowserEngine ():BrowserEngine
	{
		initDetection();
		return __BROWSER_ENGINE;
	}

	/**
	 * Check if we run in a specific browser engine.
	 * See enum BrowserEngine
	 */
	export function isBrowserEngine (pBrowserEngine:BrowserEngine):boolean
	{
		initDetection();
		return getBrowserEngine() == pBrowserEngine;
	}


	/**
	 * Get environment capabilities like retina / touch / geolocation ...
	 * See class ICapabilities.
	 */
	export function getCapabilities ():ICapabilities
	{
		initDetection();
		return __CAPABILITIES;
	}
}


/*
 console.log("---------");
 console.log("deviceType", EnvUtils.getDeviceType());
 console.log("platform", EnvUtils.getPlatform());
 console.log("browser", EnvUtils.getBrowser());
 console.log("browserEngine", EnvUtils.getBrowserEngine());
 console.log("capabilities", EnvUtils.getCapabilities());
 console.log("---------");
 */
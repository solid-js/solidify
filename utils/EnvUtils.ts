// TODO : Ajouter le test de l'autoplay : https://github.com/Modernizr/Modernizr/blob/master/feature-detects/video/autoplay.js
// TODO : A faire optionnel (ajouté avec un import depuis l'extérieur de ce fichier)
// TODO : Car la mini video embed dans le fichier pèse un minimum


/**
 * Listing of devices types available.
 * Just handheld or desktop, no mobile / phone / laptop because we manage this via mediaQueries.
 * If not found, will be desktop by default
 */
import {StringUtils} from "./StringUtils";
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

export class EnvUtils
{
	/**
	 * If we need a detection
	 */
	private static __NEED_DETECTION		:boolean			= true;

	/**
	 * Client informations
	 */
	private static __DEVICE_TYPE		:DeviceType;
	private static __PLATFORM			:Platform;
	private static __BROWSER			:Browser;
	private static __BROWSER_ENGINE		:BrowserEngine;
	private static __CAPABILITIES		:ICapabilities;

	/**
	 * Init detection once and on demand.
	 * Will collect all needed informations.
	 */
	private static initDetection ():void
	{
		if (!EnvUtils.__NEED_DETECTION) return;

		// Get browser signature
		var browserSignature = navigator.userAgent.toLowerCase();

		// Detect device type and platform
		if (/ipad|iphone|ipod/gi.test(browserSignature))
		{
			EnvUtils.__DEVICE_TYPE = DeviceType.HANDHELD;
			EnvUtils.__PLATFORM = Platform.IOS;
		}
		else if (/android/gi.test(browserSignature))
		{
			EnvUtils.__DEVICE_TYPE = DeviceType.HANDHELD;
			EnvUtils.__PLATFORM = Platform.ANDROID;
		}
		else if (/mac/gi.test(browserSignature))
		{
			EnvUtils.__DEVICE_TYPE = DeviceType.DESKTOP;
			EnvUtils.__PLATFORM = Platform.MAC;
		}
		else if (/windows phone/gi.test(browserSignature))
		{
			EnvUtils.__DEVICE_TYPE = DeviceType.HANDHELD;
			EnvUtils.__PLATFORM = Platform.WINDOWS;
		}
		else if (/windows/gi.test(browserSignature))
		{
			EnvUtils.__DEVICE_TYPE = DeviceType.DESKTOP;
			EnvUtils.__PLATFORM = Platform.WINDOWS;
		}
		else
		{
			EnvUtils.__DEVICE_TYPE = DeviceType.DESKTOP;
			EnvUtils.__PLATFORM = Platform.UNKNOWN;
		}

		// Detect browser
		if (/chrome/gi.test(browserSignature))
		{
			EnvUtils.__BROWSER = Browser.CHROME;
		}
		else if (/safari/gi.test(browserSignature))
		{
			EnvUtils.__BROWSER = Browser.SAFARI;
		}
		else if (/msie/gi.test(browserSignature) || ("ActiveXObject" in window))
		{
			EnvUtils.__BROWSER = Browser.IE;
		}
		else if (/mozilla/gi.test(browserSignature))
		{
			EnvUtils.__BROWSER = Browser.MOZILLA;
		}
		else if (/opera/gi.test(browserSignature))
		{
			EnvUtils.__BROWSER = Browser.OPERA;
		}
		else
		{
			EnvUtils.__BROWSER = Browser.UNKNOWN;
		}

		// Detect browser engine
		if (/webkit/gi.test(browserSignature))
		{
			EnvUtils.__BROWSER_ENGINE = BrowserEngine.WEBKIT;
		}
		else if (/trident/gi.test(browserSignature))
		{
			EnvUtils.__BROWSER_ENGINE = BrowserEngine.TRIDENT;
		}
		else if (/gecko/gi.test(browserSignature))
		{
			EnvUtils.__BROWSER_ENGINE = BrowserEngine.GECKO;
		}
		else
		{
			EnvUtils.__BROWSER_ENGINE = BrowserEngine.UNKNOWN;
		}

		// Detect client capabilities
		EnvUtils.__CAPABILITIES = {
			retina		:(("devicePixelRatio" in window) && window.devicePixelRatio >= 1.5),
			touch		:("ontouchstart" in document),
			audio		:("canPlayType" in document.createElement("audio")),
			video		:("canPlayType" in document.createElement("video")),
			pushState	:("history" in window && "pushState" in history),
			geolocation	:("geolocation" in navigator),
			webGL		:(EnvUtils.isWebglAvailable())
		};

		// Don't need detection anymore
		EnvUtils.__NEED_DETECTION = false;
	}

	/**
	 * Detect WebGL capability
	 */
	static isWebglAvailable ():boolean
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
	static getDeviceType ():DeviceType
	{
		EnvUtils.initDetection();
		return EnvUtils.__DEVICE_TYPE;
	}

	/**
	 * Check if we run in a specific device type.
	 * See enum DeviceType
	 */
	static isDeviceType (pDeviceType:DeviceType):boolean
	{
		EnvUtils.initDetection();
		return EnvUtils.getDeviceType() == pDeviceType;
	}


	/**
	 * Get the platform following enum Platform
	 */
	static getPlatform ():Platform
	{
		EnvUtils.initDetection();
		return EnvUtils.__PLATFORM;
	}

	/**
	 * Check if we run in a specific platform.
	 * See enum Platform
	 */
	static isPlatform (pPlatform:Platform):boolean
	{
		EnvUtils.initDetection();
		return EnvUtils.getPlatform() == pPlatform;
	}


	/**
	 * Get the browser following enum Browser
	 */
	static getBrowser ():Browser
	{
		EnvUtils.initDetection();
		return EnvUtils.__BROWSER;
	}

	/**
	 * Get IE Version
	 * Returns Number.POSITIVE_INFINITY if not IE, so you can test if version <= 9 for ex
	 */
	static getIEVersion ():number
	{
		var myNav = navigator.userAgent.toLowerCase();
		return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1], 10) : Number.POSITIVE_INFINITY;
	}

	/**
	 * Check if we run in a specific browser.
	 * See enum Browser
	 */
	static isBrowser (pBrowser:Browser):boolean
	{
		EnvUtils.initDetection();
		return EnvUtils.getBrowser() == pBrowser;
	}


	/**
	 * Get the browser engine following enum BrowserEngine
	 */
	static getBrowserEngine ():BrowserEngine
	{
		EnvUtils.initDetection();
		return EnvUtils.__BROWSER_ENGINE;
	}

	/**
	 * Check if we run in a specific browser engine.
	 * See enum BrowserEngine
	 */
	static isBrowserEngine (pBrowserEngine:BrowserEngine):boolean
	{
		EnvUtils.initDetection();
		return EnvUtils.getBrowserEngine() == pBrowserEngine;
	}


	/**
	 * Get environment capabilities like retina / touch / geolocation ...
	 * See class ICapabilities.
	 */
	static getCapabilities ():ICapabilities
	{
		EnvUtils.initDetection();
		return EnvUtils.__CAPABILITIES;
	}

	/**
	 * Log stuff about your environment
	 */
	static log ():void
	{
		console.group("EnvUtils.log");
		console.log("deviceType", EnvUtils.getDeviceType());
		console.log("platform", EnvUtils.getPlatform());
		console.log("browser", EnvUtils.getBrowser());
		console.log("browserEngine", EnvUtils.getBrowserEngine());
		console.log("capabilities", EnvUtils.getCapabilities());
		console.groupEnd();
	}

	/**
	 * Will add capabilities classes to DOM Element via selector.
	 * Can add for ex :
	 * is-chrome
	 * is-webkit
	 * is-windows
	 * And also capabilities like :
	 * has-video
	 * has-geolocation
	 */
	static addClasses (pToSelector:string = 'body', pPrefix = ''):void
	{
		// Get env properties
		EnvUtils.initDetection();

		// Wait DOM
		$(() =>
		{
			// Target selector
			var $domRoot = $(pToSelector);

			// Add env properties classes
			$domRoot.addClass(pPrefix + 'is-' + StringUtils.snakeToCamelCase(Browser[EnvUtils.__BROWSER]				, '_'));
			$domRoot.addClass(pPrefix + 'is-' + StringUtils.snakeToCamelCase(BrowserEngine[EnvUtils.__BROWSER_ENGINE]	, '_'));
			$domRoot.addClass(pPrefix + 'is-' + StringUtils.snakeToCamelCase(DeviceType[EnvUtils.__DEVICE_TYPE]			, '_'));
			$domRoot.addClass(pPrefix + 'is-' + StringUtils.snakeToCamelCase(Platform[EnvUtils.__PLATFORM]				, '_'));

			// Add capabilites
			for (var i in EnvUtils.__CAPABILITIES)
			{
				EnvUtils.__CAPABILITIES[i] && $domRoot.addClass(pPrefix + 'has-' + i);
			}
		});
	}
}

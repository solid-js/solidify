/**
 * App bundle static require
 */
export interface IBundleRequire
{
	// If this bundle has been required
	required	?:boolean;

	// Name of the bundle
	name		:string;

	// Main class of the app bundle
	main		:any;
}

/**
 * App bundles static require list interface
 */
export interface IBundleRequireList
{
	// FuseBox package manager app bundles paths
	paths : string[];

	// App bundle static requires statements for quantum mode
	requires : () => IBundleRequire[];
}

/**
 * Solid App Bundle Manager.
 * Load and check loading of app bundles.
 */
export class SolidBundles
{
	// Global variable name for bundles check interval
	static WINDOW_CHECK_INTERVAL = '__solidCheckInterval';

	// Global variable name for app bundle loading handler
	static WINDOW_LOADED_HANDLER = 'SolidBundleLoaded';

	// Global variable name for FuseBox package manager in dev mode
	static WINDOW_FUSE_BOX_NAME = 'FuseBox';

	// Global variable name for HMR counter
	static WINDOW_HMR_COUNT = '__solidHmrCount';

	// Bundle loaded check frequency
	static CHECK_FREQUENCY = 1000 / 30;

	// App bundles require list
	static __bundlesRequireList:IBundleRequireList;

	// Waiting bundle loaded handler
	static __waitingHandlers = {};


	/**
	 * Start Solid Bundle manager.
	 * @param pBundleRequireList Compiled require list from fuse.
	 */
	static start ( pBundleRequireList:IBundleRequireList )
	{
		// Check if handler exists
		if ( !(SolidBundles.WINDOW_LOADED_HANDLER in window) )
		{
			throw new Error(`Create a global handler named ${SolidBundles.WINDOW_LOADED_HANDLER} into your html markup to init app bundles.`);
		}

		// Register require list
		SolidBundles.__bundlesRequireList = pBundleRequireList;

		// Init HMR count
		window[ SolidBundles.WINDOW_HMR_COUNT ] = (
			( SolidBundles.WINDOW_HMR_COUNT in window )
			? window[ SolidBundles.WINDOW_HMR_COUNT ] + 1
			: 0
		);

		// Expose public API
		window['SolidBundles'] = SolidBundles;

		// Start checking only if loop isn't started. So HMR will not add loops.
		if ( !(SolidBundles.WINDOW_CHECK_INTERVAL in window))
		{
			// Start loop
			window[SolidBundles.WINDOW_CHECK_INTERVAL] = window.setInterval(
				SolidBundles.checkBundles,
				SolidBundles.CHECK_FREQUENCY
			);

			// Check bundles directly
			SolidBundles.checkBundles();
		}
	}

	/**
	 * Load an app bundle.
	 * @param {string} pBundleName Name of the app bundle to load.
	 * @param {string} pLoadedHandler Called when app bundle is loaded. First argument is app class.
	 */
	static loadBundle (pBundleName:string, pLoadedHandler ?: (pAppMain:any) => void)
	{
		// Create script tag
		let scriptTag = document.createElement('script');

		// Get bundle path from injected env
		const bundlePath = process.env['BUNDLE_PATH'];

		// Target bundle file
		scriptTag.setAttribute('src', `${bundlePath}${pBundleName}.js`);

		// Add to head and start loading
		document.head.appendChild(scriptTag);

		// Register handler
		if (pLoadedHandler != null)
		{
			SolidBundles.__waitingHandlers[ pBundleName ] = pLoadedHandler;
		}
	}

	/**
	 * Method to check if every app bundles are loaded.
	 * This loop will run until every bundles are loaded.
	 */
	static checkBundles ()
	{
		// Loaded bundles list
		let bundles:IBundleRequire[];

		// In production mode, we use quantum to resolve
		// So require will not do XHR
		if (process.env.NODE_ENV === 'production')
		{
			// Get bundle through require
			bundles = SolidBundles.__bundlesRequireList.requires();
		}

		// In dev mode, we uses FuseBox, which tries to resolves through XHR
		else
		{
			// Get bundles from FuseBox paths
			bundles = SolidBundles.__bundlesRequireList.paths.map(
				bundlePath => (

					// If FuseBox has the package, import it, so we avoid an XHR
					window[ SolidBundles.WINDOW_FUSE_BOX_NAME ].exists( bundlePath )
					? window[ SolidBundles.WINDOW_FUSE_BOX_NAME ].import( bundlePath )

					// Else, set to null so next operations will consider this bundle as missing
					: null
				)
			);
		}

		// Browse bundles
		bundles.map( bundle =>
		{
			// If this bundle is loaded and was never required
			if (bundle != null && !('required' in bundle))
			{
				// Set it as required
				bundle.required = true;

				// Expose its name and main bundle
				window[ SolidBundles.WINDOW_LOADED_HANDLER ]( bundle.name, bundle.main );

				// If we have a waiting loaded handler
				if (bundle.name in SolidBundles.__waitingHandlers)
				{
					// Call handler and pass bundle main
					SolidBundles.__waitingHandlers[ bundle.name ]( bundle.main );

					// Remove waiting handler
					delete SolidBundles.__waitingHandlers[ bundle.name ];
				}
			}
		});

		// Filter required bundles to check if any bundle is still missing
		let bundlesToRequire = bundles.filter(
			bundle => ( bundle == null )
		);

		// If we don't have bundle to require anymore
		if (bundlesToRequire.length == 0)
		{
			// Kill the loop and remove interval checker
			clearInterval( window[SolidBundles.WINDOW_CHECK_INTERVAL] );
			delete window[SolidBundles.WINDOW_CHECK_INTERVAL];
		}
	}

	/**
	 * Is true if App is reloaded from Hot Module Reloading.
	 */
	static get isHMRTrigger ()
	{
		return ( window[ SolidBundles.WINDOW_HMR_COUNT ] > 0 );
	}
}
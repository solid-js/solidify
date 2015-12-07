export = ThreeView;

import View = require("../core/View");
import TimerUtils = require("lib/solidify/utils/TimerUtils");
import EnvUtils = require("lib/solidify/utils/EnvUtils");
import Central = require("lib/solidify/helpers/Central");


// TODO : problème d'upscale lorsqu'on resize le browser

/**
 * Config objects
 */
class BackgroundConfig
{
	color	:number;
	alpha	:number;
}
class CameraConfig
{
	near	:number;
	far		:number;
	fov		:any;
}
class FogConfig
{
	near	:number;
	far		:number;
	color	:number;
}

class ThreeView extends View
{
	/**
	 * Main 3D camera
	 */
	get camera ()			:THREE.Camera { return this._camera; }
	private _camera			:THREE.Camera;

	/**
	 * Main 3D renderer
	 */
	get canvasMode ()		:boolean { return this._canvasMode; }
	private _canvasMode		:boolean			= false;

	/**
	 * Main 3D renderer
	 */
	get renderer ()			:THREE.WebGLRenderer { return this._renderer; }
	private _renderer		:THREE.WebGLRenderer;

	/**
	 * Main 3D scene
	 */
	get scene ()			:THREE.Scene { return this._scene; }
	private _scene			:THREE.Scene;

	/**
	 * Size of the viewport
	 */
	get renderSize ()		:number[] { return this._renderSize; }
	private _renderSize		:number[];

	/**
	 * If the engine is paused, no frame are generated.
	 */
	get paused ():boolean { return this._paused; }
	set paused (pValue:boolean)
	{
		// Only if value is different to avoid multiple frame handlers
		if (this._paused != pValue)
		{
			this._paused = pValue;

			// Update state
			if (this._paused)
			{
				TimerUtils.removeFrameHandler(this.enterFrameHandler);
			}
			else
			{
				TimerUtils.addFrameHandler(this, this.enterFrameHandler);
			}
		}
	}
	private _paused			:boolean			= true;


	/**
	 * Initialise the Three engine with a camera and an optional fog.
	 * Will not start the render loop. Call startRender to start the renderLoop.
	 * ThreeView.threeCanvas need to be attached to the DOM before rendering.
	 * @param pBackground Background related options. Keep alpha to 1 for better render performances.
	 * @param pCamera Camera related options. Keep near and far close for better render performances. Default field of view is 70.
	 * @param pFog Will apply if a fog to the scene. Set to null to disable fog.
	 * @param pAntialias Smooth the screen if set to true. Can slow down framerate. Default is false.
	 * @param pAllowCanvas Allow canvas rendering. May be ultra slow on handheld devices.
	 * @returns true if the renderer is valid (webGL or canvas if allowed).
	 */
	initEngine (
		pBackground	:BackgroundConfig 	= {color: 0x000000, alpha: 1},
		pCamera		:CameraConfig 		= {near: 10, far: 10000, fov: 70},
		pFog		:FogConfig 			= {near: 10, far: 10000, color: 0x000000},
		pAntialias	:boolean			= false,
		pAllowCanvas:boolean			= true,
		pAutoRatio	:boolean			= false
	):boolean
	{
		// Check if we are not already initialised
		if (this._renderer != null) throw new Error("ThreeView.initEngine // Already initialised.");

		// Try WebGL context
		if (EnvUtils.getCapabilities().webGL)
		{
			this._renderer = new THREE.WebGLRenderer({
				antialias: pAntialias
			});
		}

		// Try canvas if allowed
		else if (pAllowCanvas)
		{
			this._canvasMode = true;
			this._renderer = new THREE['CanvasRenderer']();
		}

		// Nothing works
		else return false;

		// Set the background
		this._renderer.setClearColor(pBackground.color, pBackground.alpha);

		// Define pixel ratio
		if (pAutoRatio)
		{
			this._renderer['setPixelRatio'](window.devicePixelRatio);
		}

		// Define content dom
		this.internalContent = $(this._renderer.domElement);

		// Init camera
		if (typeof pCamera.fov == "number")
		{
			this._camera = new THREE.PerspectiveCamera(pCamera.fov, 1, pCamera.near, pCamera.far);
		}
		else if (typeof pCamera.fov == "object")
		{
			this._camera = new THREE.OrthographicCamera(pCamera.fov[0], pCamera.fov[1], pCamera.fov[2], pCamera.fov[3], pCamera.near, pCamera.far);
		}

		// Init scene
		this._scene = new THREE.Scene();

		// Apply fog if needed
		if (pFog != null)
		{
			this._scene.fog = new THREE.Fog(
				pFog.color,
				pFog.near,
				pFog.far
			);
		}

		// Init stuff from child class
		this.initExternals();
		this.initMaterials();
		this.initScene();

		// Listen when app is resized
		Central.add("app/resize", this, this.appResizedHandler);

		// Our engine is ok
		return true;
	}

	/**
	 * Start rendering engine
	 */
	startEngine ():void
	{
		// Check if we are on DOM
		if (!this.isAttachedToDocument)
		{
			//throw new Error("ThreeView.startRender // ThreeView.threeCanvas need to be attached to DOM before the rendering can start.");
		}

		// Resize
		this.updateRenderSize();

		// We got dimensions
		this.engineStarted();

		// Enable render loop
		this.paused = false;

		this.enterFrameHandler();
	}

	/**
	 * We got dimensions
	 */
	engineStarted ():void {}

	/**
	 * Init external assets (abstract method)
	 */
	initExternals ():void {}

	/**
	 * Init materials (abstract method)
	 */
	initMaterials ():void {}

	/**
	 * Init scene (abstract method)
	 */
	initScene ():void {}

	/**
	 * Update render size from domElement
	 */
	updateRenderSize ():void
	{
		// Target parent
		var parent = this.content.parent();

		// No dimensions if not attached to root
		if (parent == null)
		{
			this._renderSize = [0, 0];
		}

		// Get dimensions from parent
		else if (this._renderer != null)
		{
			this._renderSize = [parent.width(), parent.height()];

			// Update camera aspect ratio
			if ("aspect" in this._camera)
			{
				(<THREE.PerspectiveCamera>this._camera).aspect = this._renderSize[0] / this._renderSize[1];
			}
			else
			{
				(<THREE.OrthographicCamera>this._camera).left = -this._renderSize[0] / 2;
				(<THREE.OrthographicCamera>this._camera).right = this._renderSize[0] / 2;
				(<THREE.OrthographicCamera>this._camera).top = this._renderSize[1] / 2;
				(<THREE.OrthographicCamera>this._camera).bottom = -this._renderSize[1] / 2;
			}

			// Update camera projection
			if ("updateProjectionMatrix" in this._camera)
			{
				(<THREE.PerspectiveCamera>this._camera).updateProjectionMatrix();
			}

			// Update renderer
			this._renderer.setSize(this._renderSize[0], this._renderSize[1]);
		}
	}

	/**
	 * App is resized.
	 * NB : Ici on fait une closure pour ne pas avoir de problème lors du Central.remove
	 */
	private appResizedHandler = ():void =>
	{
		//console.log("ThreeView.appResizedHandler", this.viewName);

		// Get dimensions from node
		this.updateRenderSize();
	};

	/**
	 * Called on each frames.
	 * NB : Ici on fait une closure pour ne pas avoir de problème lors du removeFrameHandler
	 */
	enterFrameHandler = ():void =>
	{
		this._renderer.render(this._scene, this._camera);
	};

	/**
	 * Destruction
	 */
	dispose ():void
	{
		// Delete app resize listening
		Central.remove("app/resize", this.appResizedHandler);

		// Stop the timer
		TimerUtils.removeFrameHandler(this.enterFrameHandler);

		// Relay
		super.dispose();
	}
}
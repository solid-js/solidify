import {StringUtils} from '../utils/StringUtils';
import {ModuleUtils} from '../utils/ModuleUtils';
import {ArrayUtils} from '../utils/ArrayUtils';

// ----------------------------------------------------------------------------- INTERFACES

/**
 * Internal interface for modules path
 */
export interface IModulePathStorage
{
    /**
     * {
     * 		"type" : ["path"]
     * }
     */
    [index:string]: string[];
}

/**
 * Internal interface for dependencies storage
 */
interface IDependency
{
    // External instance of the dependency or generated one from classRef
    instance    : any;

    // Class constructor of the dependency if instance not given
    classRef    : {new(): any};

    // Will produce only one instance of classRef
    singleton   : boolean;
}

/**
 * Our public class
 */
export class DependencyManager
{
    // ------------------------------------------------------------------------- SINGLETON

    /**
     * Singleton instance
     */
    static __instance                   :DependencyManager;

    /**
     * Get access to the singleton instance of this class
     */
    static getInstance ()
    {
        // Create the first instance
        if (this.__instance == null)
        {
            this.__instance = new DependencyManager();
        }

        return this.__instance;
    }


    // ------------------------------------------------------------------------- LOCALS

    /**
     * Associated modules paths by modules types.
     */
    private _modulesPath                :IModulePathStorage                      = {};

    /**
     * Stored dependencies
     */
    private _dependencies               :{[index:string] : IDependency}          = {};


    // ------------------------------------------------------------------------- CONSTRUCT

    /**
     * Constructor
     */
    constructor () { }


    // ------------------------------------------------------------------------- REGISTERING

    /**
     * Add a module path to be able to requireModule after.
     * For ex : ("src/components/", "Component")
     * will allow MenuComponent to be required from the path "src/component/MenuComponent"
     * NB1: Types are stored to lower case.
     * NB2: You'll have to call updateModuleCache to be able to require synchronously.
     */
    registerModulePath (pModuleType:string, pModulePath:string):void
    {
        // Type at lowerCase to avoid stupid things
        pModuleType = pModuleType.toLowerCase();

        // Add this module type if not yet registered
        if (!(pModuleType in this._modulesPath))
        {
            this._modulesPath[pModuleType] = [];
        }

        // Record the path with trailing slash to the module type
        this._modulesPath[pModuleType].push(StringUtils.trailingSlash(pModulePath));
    }

    /**
     * Register several modules at once (look at registerModulePath).
     * You have to follow IModulePathStorage implementation like so :
     * moduleType -> [modulePath]
     * NB1: Types are stored to lower case.
     * NB2: You'll have to call updateModuleCache to be able to require synchronously.
     */
    registerModulesPath (pPaths:IModulePathStorage):void
    {
		// Browse module types
		for (let moduleType in pPaths)
		{
			// To lowercase
			moduleType = moduleType.toLowerCase();

			// Insert if not existent
			if (!(moduleType in this._modulesPath))
			{
				this._modulesPath[moduleType] = [];
			}

			// Insert all paths for this module
			for (let modulePathIndex in pPaths[moduleType])
			{
				this._modulesPath[moduleType].push(
					StringUtils.trailingSlash(pPaths[moduleType][modulePathIndex])
				);
			}
		}
    }


    // ------------------------------------------------------------------------- HELPERS

    /**
     * Flat array of stored modules path (without type)
     */
    getFlatModulesPath ():string[]
    {
        let modulesPath:string[] = [];
		for (let moduleType in this._modulesPath)
		{
			for (let pathIndex in this._modulesPath[moduleType])
			{
				modulesPath.push(this._modulesPath[moduleType][pathIndex]);
			}
		}
        return modulesPath;
    }

    /**
     * Flat array of all stored modules types
     */
    getFlatModulesTypes ():string[]
    {
        let modulesType:string[] = [];
		for (let moduleType in this._modulesPath)
		{
			if (!ArrayUtils.inArray(modulesType, moduleType))
			{
				modulesType.push(moduleType);
			}
		}
        return modulesType;
    }

    /**
     * Update registered module cache to get registered modules preloaded in requirejs.
     * This is mandatory to load module synchronously.
     * This is async so the handler will callback when every modules are preloaded.
     */
    updateModuleCache (pHandler:(pLoadedModules:string[]) => void):void
    {
        // Get flat version of all dynamic modules path
        let modulesPath = this.getFlatModulesPath();

        // Preload those modules and get beck via the handler
        ModuleUtils.preloadModules(modulesPath, (pLoadedModules:string[]):void =>
        {
        	console.group(`DependencyManager.updateModuleCache // ${pLoadedModules.length} loaded`);
			console.log(pLoadedModules);
            console.groupEnd();

            // Relay
            pHandler(pLoadedModules);
        });
    }

    // ------------------------------------------------------------------------- REQUIRING

    /**
     * Require a module by name and type, from registered modules paths.
	 * Important : module have to be pre-loaded with updateModuleCache method !
     * @param pModuleName The name of the module to get, for ex: "Home" to get "HomeController"
     * @param pModuleType The type of the module to get, for ex: "Controller" to get "HomeController"
     * @param pConstructorArguments Pass an array of arguments to instantiate the module, if not provided, the module reference will be returned.
     * @param pExportName Name of the exported element to get (default is 'default', for ex : 'export default class Test' will work. Also, if there is no default exported element but an element is exported with the name of the module, it will works.
     * @returns The module if available in sync module. Otherwise module will be return by the handler.
     */
    requireModule (pModuleName:string, pModuleType:string, pConstructorArguments:any[] = null, pExportName:string = 'default'):any
    {
        // Type at lowerCase to avoid stupid things
        pModuleType = pModuleType.toLowerCase();

        // Get loaded modules via requireJS
        let loadedModules       = ModuleUtils.getLoadedModulesNames();

        // Keep in key for faster check
        let loadedModulesByKey:{[index: string]: any} = {};
        for (let moduleName in loadedModules)
        {
            // Lowercase in key, and keep the rich case version in value
            loadedModulesByKey[moduleName.toLowerCase()] = moduleName;
        }

        // Target the module path
        let currentModulePath   :string;

        // Registered base path
        let localModulePath     :string;

		// Full path of the found module
		let fullModulePath		:string;

        // Check if we have this module type registered
        if (!(pModuleType in this._modulesPath))
        {
            throw new Error(`DependencyManager.requireModule // Module type ${pModuleType} not found when loading ${pModuleName}.`);
        }

        // Run on modules paths registered for this module type
        for (let modulePathIndex in this._modulesPath[pModuleType])
        {
            // Get the path
            localModulePath = this._modulesPath[pModuleType][modulePathIndex];

            // Generate the module path with low case on the first letter
            currentModulePath = (localModulePath + pModuleName + "/" + pModuleName).toLowerCase();

            // And check if this path exist in loaded requirejs libs
            if (loadedModulesByKey[currentModulePath] != null)
            {
                // We found it, get the full path
				fullModulePath = loadedModulesByKey[currentModulePath];
                break;
            }
        }

        // The lib was not found
        if (fullModulePath == null)
        {
            throw new Error(`DependencyManager.requireModule // Module ${pModuleName} not found with type ${pModuleType}. Please check if the module is loaded or update modules caches.`);
        }

		// Load the module
		let module = ModuleUtils.requireSync(loadedModulesByKey[currentModulePath]);

		// The exported element from the module to get
		let moduleExport:any;

		// Get the file name for the export class if export by name is not found
		let moduleFileName:string = StringUtils.getFileFromPath(fullModulePath);

		// Try to get the export via parameter
		if (pExportName in module)
		{
			moduleExport = module[pExportName];
		}

		// Try via class name
		else if (moduleFileName in module)
		{
			moduleExport = module[moduleFileName];
		}

		// Not found
		else
		{
			console.log(module);
			throw new Error(`DependencyManager.requireModule // Module ${pModuleName} is found with type ${pModuleType} but the export ${pExportName} is not found.`);
		}

		// Return the module export instanciated or not depending on constructor argument parameter
		return this.instanciateModule(moduleExport, pConstructorArguments);
    }

    /**
     * Instantiate a module if arguments provided, return module class otherwise.
     */
    private instanciateModule (pModuleReference, pConstructorArguments:any[] = null)
    {
        return (
            // Call handler with module reference if we don't have arguments
            pConstructorArguments == null
            ? pModuleReference

            // Else instantiate with arguments
            : ModuleUtils.dynamicNew(pModuleReference, pConstructorArguments)
        );
    }


    // ------------------------------------------------------------------------- NO MODULES

	/**
	 * Check if a dependency is already registered, by its name.
	 * @param pName Name of dependency to search for.
	 * @throws Error if dependency is already registered
	 */
    private checkAlreadyRegisteredDependency (pName:string):void
    {
        if (pName in this._dependencies)
        {
            throw new Error(`DependencyManager.register[Instance|Class] // ${pName} is already registered. Please delete it with deleteDependecy before.`);
        }
    }

    /**
     * Register an dependency instance by name
     * @param pName The name of the dependecy to be abble to require it
     * @param pInstance The instance of the dependency to store
     */
    public registerInstance (pName:string, pInstance:any):void
    {
		// Check if our dependency isn't already registered
        this.checkAlreadyRegisteredDependency(pName);

		// Record instance
        this._dependencies[pName] = {
            instance: pInstance,
            classRef: null,
            singleton: true
        };
    }

    /**
     * Register a dependency class by name.
     * The class will be instanciated each time the dependency is required.
     * Only one instance will be created on require if singleton is set to true.
     * @param pName The name of the dependecy to be abble to require it
     * @param pClass The class of the dependency to store
     * @param pSingleton If we have to instanciate only on the first require
     */
    public registerClass (pName:string, pClass:{new () : any}, pSingleton:boolean = false):void
    {
		// Check if our dependency isn't already registered
        this.checkAlreadyRegisteredDependency(pName);

		// Record class ref
        this._dependencies[pName] = {
            instance: null,
            classRef: pClass,
            singleton: pSingleton
        };
    }

    /**
     * Create the instance of a require dependency by its name.
     * @param pName Name of the dependency to create.
     * @returns {any}
	 * @throws Error if dependency not found in require.
     */
    public requireInstance (pName:string):any
    {
    	// If not declared
        if (!(pName in this._dependencies))
        {
            throw new Error(`DependencyManager.requireInstance // ${pName} instance not found.`);
        }

        // Check if
		// - we have the instance
		// - this is a singleton
        let currentDependency:IDependency = this._dependencies[pName];
        if (
                (
                    currentDependency.classRef != null
                    &&
                    currentDependency.instance == null
                )
                ||
                !currentDependency.singleton
            )
        {
        	// Create new instance and store it
            currentDependency.instance = new currentDependency.classRef;
        }

        // Return instance
        return currentDependency.instance;
    }

    // todo : getDependencies -> ??
    // todo : removeDependency
    public removeDependency (pName:string):void
    {
		throw new Error('DependencyManager.error // TODO');
    }
}
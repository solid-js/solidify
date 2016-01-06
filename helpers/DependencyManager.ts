import {StringUtils} from '../utils/StringUtils';
import {ModuleUtils} from '../utils/ModuleUtils';
import {ArrayUtils} from '../utils/ArrayUtils';

// TODO : Virer la notion de namespace !

// ----------------------------------------------------------------------------- INTERFACES

/**
 * Internal interface for modules path
 */
interface IModulePathStorage
{
    /**
     * {
     *      "namespace" : {
     *          "type" : ["path"]
     *      }
     * }
     */
    [index:string]: {[index:string]: string[]};
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
     * For ex : ("myNameSpace", "src/components/", "Component")
     * will allow MenuComponent to be required from the path "src/component/MenuComponent" in namespace myNameSpace.
     * NB1: Namespace and module types are stored to lower case.
     * NB2: You'll have to call updateModuleCache to be able to require synchronously.
     */
    registerModulePath (pNamespace:string, pModulePath:string, pModuleType:string):void
    {
        // Namespace and type at lowerCase to avoid stupid things
        pNamespace = pNamespace.toLowerCase();
        pModuleType = pModuleType.toLowerCase();

        // Add this namespace if not yet registered
        if (!(pNamespace in this._modulesPath))
        {
            this._modulesPath[pNamespace] = {};
        }

        // Add this module type if not yet registered
        if (!(pModuleType in this._modulesPath[pNamespace]))
        {
            this._modulesPath[pNamespace][pModuleType] = [];
        }

        // Record the path with trailing slash to the module type
        this._modulesPath[pNamespace][pModuleType].push(StringUtils.addTrailingSlash(pModulePath));
    }

    /**
     * Register several modules at once (look at registerModulePath).
     * You have to follow IModulePathStorage implementation like so :
     * namespace -> moduleType -> [modulePath]
     * NB1: Namespace and module types are stored to lower case.
     * NB2: You'll have to call updateModuleCache to be able to require synchronously.
     */
    registerModulesPath (pPaths:IModulePathStorage):void
    {
        var moduleNamespaceLowerCase:string;

        // Browse namespaces
        for (var moduleNamespace in pPaths)
        {
            // To lowercase
            moduleNamespaceLowerCase = moduleNamespace.toLowerCase();

            // Insert if not existent
            if (!(moduleNamespaceLowerCase in this._modulesPath))
            {
                this._modulesPath[moduleNamespaceLowerCase] = {};
            }

            // Browse module types
            for (var moduleType in pPaths[moduleNamespace])
            {
                // To lowercase
                moduleType = moduleType.toLowerCase();

                // Insert if not existent
                if (!(moduleType in this._modulesPath[moduleNamespaceLowerCase]))
                {
                    this._modulesPath[moduleNamespaceLowerCase][moduleType] = [];
                }

                // Insert all paths for this module / namespace
                for (var modulePathIndex in pPaths[moduleNamespace][moduleType])
                {
                    this._modulesPath[moduleNamespaceLowerCase][moduleType].push(
                        StringUtils.addTrailingSlash(pPaths[moduleNamespace][moduleType][modulePathIndex])
                    );
                }
            }
        }
    }


    // ------------------------------------------------------------------------- HELPERS

    /**
     * Flat array of stored modules path (without namespace and type)
     */
    getFlatModulesPath ():string[]
    {
        var modulesPath:string[] = [];

        for (var moduleNamespace in this._modulesPath)
        {
            for (var moduleType in this._modulesPath[moduleNamespace])
            {
                for (var pathIndex in this._modulesPath[moduleNamespace][moduleType])
                {
                    modulesPath.push(this._modulesPath[moduleNamespace][moduleType][pathIndex]);
                }
            }
        }

        return modulesPath;
    }

    /**
     * Flat array of all stored modules types
     */
    getFlatModulesTypes ():string[]
    {
        var modulesType:string[] = [];

        for (var moduleNamespace in this._modulesPath)
        {
            for (var moduleType in this._modulesPath[moduleNamespace])
            {
                if (!ArrayUtils.inArray(modulesType, moduleType))
                {
                    modulesType.push(moduleType);
                }
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
        //SLog.log(0, "Updating dependency manager cache...");
        console.log("Updating dependency manager cache...");

        // Get flat version of all dynamic modules path
        var modulesPath = this.getFlatModulesPath();

        // Preload those modules and get beck via the handler
        ModuleUtils.preloadModules(modulesPath, (pLoadedModules:string[]):void =>
        {
            //SLog.log(0, "-> " + pLoadedModules.length + " module(s) loaded.");
            console.log("-> " + pLoadedModules.length + " module(s) loaded.");

            // Relay
            pHandler(pLoadedModules);
        });
    }

    // ------------------------------------------------------------------------- REQUIRING

    /**
     * Require a module by name and type, from registered modules paths.
     * TODO : Faire une version qui rend les namespace optionnels ? -> Peut être une mauvaise idée
     * @param pNamespace The name of the namespace to get the module from.
     * @param pModuleName The name of the module to get, for ex: "Home" to get "HomeController"
     * @param pModuleType The type of the module to get, for ex: "Controller" to get "HomeController"
     * @param pConstructorArguments Pass an array of arguments to instantiate the module, if not provided, the module reference will be returned.
     * @param pHandler Called when the module is ready, first parameter is your module reference or module instance.
     * @returns The module if available in sync module. Otherwise module will be return by the handler.
     */
    requireModule (pNamespace:string, pModuleName:string, pModuleType:string, pConstructorArguments:any[] = null, pHandler:(any) => void = null):any
    {
		// TODO: Solid : ATTENTION si ici le namespace est undefined, rien n'est instancié ! BUG CHELOU
		// TODO: Solid : Faire en sorte d'avoir un namespace par défaut

        // Namespace and type at lowerCase to avoid stupid things
        pNamespace = pNamespace.toLowerCase();
        pModuleType = pModuleType.toLowerCase();

        // Get loaded and not loaded modules via requireJS
        var registryModules     = ModuleUtils.getRegistryNames();
        var loadedModules       = ModuleUtils.getLoadedModulesNames();

        // Convert all modules path to lowercase for safer search and keep in key for faster check
        var lowerCaseLoadedModules:{[index: string]: any} = {};
        var moduleName:string;
        for (moduleName in registryModules)
        {
            // Lowercase in key, and keep the rich case version in value
            lowerCaseLoadedModules[moduleName.toLowerCase()] = moduleName;
        }
        for (moduleName in loadedModules)
        {
            // Lowercase in key, and keep the rich case version in value
            lowerCaseLoadedModules[moduleName.toLowerCase()] = moduleName;
        }

        // Target the module path
        var currentModulePath   :string;

        // Registered base path
        var localModulePath     :string;

        // If we found our damn module
        var moduleFound         :boolean = false;


        // Check if wa have this namespace registered
        if (!(pNamespace in this._modulesPath))
        {
            throw new Error('DependencyManager.requireModule // Namespace "' + pNamespace + '" not found.');
        }

        // Check if we have this module type registered
        if (!(pModuleType in this._modulesPath[pNamespace]))
        {
            throw new Error('DependencyManager.requireModule // Module type "' + pModuleType + '" not found in namespace "' + pNamespace + '".');
        }

        // Run on modules paths registered for this module type
        for (var modulePathIndex in this._modulesPath[pNamespace][pModuleType])
        {
            // Get the path
            localModulePath = this._modulesPath[pNamespace][pModuleType][modulePathIndex];

            // Generate the module path with low case on the first letter
            currentModulePath = (localModulePath + pModuleName + "/" + pModuleName + pModuleType).toLowerCase();

            // And check if this path exist in loaded requirejs libs
            if (lowerCaseLoadedModules[currentModulePath] != null)
            {
                // We found it
                moduleFound = true;
                break;
            }
        }

        // The lib was not found
        if (!moduleFound)
        {
            throw new Error('DependencyManager.requireModule // Module "' + pModuleName + '" not found with type "' + pModuleType + '" in namespace "' + pNamespace + '".');
        }

        // If we are in async mode
        if (pHandler != null)
        {
            // Call the require proxy to get the module by its path
            ModuleUtils.requireProxy([lowerCaseLoadedModules[currentModulePath]], (pModuleReference) =>
            {
                // When its loaded, instantiate with arguments if needed and callback
                pHandler(this.instanciateModule(pModuleReference, pConstructorArguments));
            });
        }
        else
        {
            // Get the module in sync mode, instantiate if needed and return
            return this.instanciateModule(
                ModuleUtils.requireProxy([lowerCaseLoadedModules[currentModulePath]]),
                pConstructorArguments
            );
        }
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

    private checkAlreadyRegisteredDependency (pName:string):void
    {
        if (pName in this._dependencies)
        {
            throw new Error('DependencyManager.register[Instance|Class] // ' + pName + ' is already registered. Please delete it with deleteDependecy before.');
        }
    }

    /**
     * Register an dependency instance by name
     * @param pName The name of the dependecy to be abble to require it
     * @param pInstance The instance of the dependency to store
     */
    public registerInstance (pName:string, pInstance:any):void
    {
        this.checkAlreadyRegisteredDependency(pName);

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
        this.checkAlreadyRegisteredDependency(pName);

        this._dependencies[pName] = {
            instance: null,
            classRef: pClass,
            singleton: pSingleton
        };
    }

    /**
     * todo : doc
     * @param pName
     * @returns {any}
     */
    public requireInstance (pName:string):any
    {
        if (!(pName in this._dependencies))
        {
            throw new Error('DependencyManager.requireInstance // ' + pName + ' instance not found.');
        }

        var currentDependency:IDependency = this._dependencies[pName];

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
            currentDependency.instance = new currentDependency.classRef;
        }

        return currentDependency.instance;
    }

    // todo : getDependencies
    // todo : removeDependency

    public removeDependency (pName:string):void
    {
    }
}
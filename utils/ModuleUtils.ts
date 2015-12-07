export = ModuleUtils;

class ModuleUtils
{
    /**
     * All defined and not loaded modules names in requirejs
     */
    static getRegistryNames ():{[index:string] : any}
    {
        return window['requirejs'].s.contexts['_'].registry;
    }

    /**
     * All defined and loaded modules names in requirejs
     */
    static getLoadedModulesNames ():{[index:string] : any}
    {
        return window['requirejs'].s.contexts['_'].defined;
    }

    /**
     * A proxy method to the require global function from requirejs.
     * If you load a module in sync mode (no handler), only the first module from dependencies list will be loaded.
     * In sync mode, all loaded have to be preloaded once in async mode.
     * @param pDependencies List of dependencies needed
     * @param pHandler Called when dependencies are loaded, each argument is a reference to the dependency from the list
     * @returns nothing good for now
     */
    static requireProxy (pDependencies:string[], pHandler:(...args) => void = null):any
    {
        // Scope the require global function
        var r = window["requirejs"];

        // Call with handler if provided
        return (pHandler != null ? r(pDependencies, pHandler) : r(pDependencies[0]));
    }

    /**
     * Instantiate a class with its reference and an arguments list.
     * @param pClassReference Reference to the object to instantiate.
     * @param pConstructorArguments List of arguments passed as parameters to the constructor.
     * @returns the instance of the instantiated object.
     */
    static dynamicNew (pClassReference:any, pConstructorArguments:any[]):any
    {
        // Dynamic wrapped constructor to get arguments
        function DynamicClass ():void
        {
            // Call the constructor with arguments
            pClassReference.apply(this, pConstructorArguments);
        }

        // Apply prototype to the wrapped constructor
        DynamicClass.prototype = pClassReference.prototype;

        // Return the instance of the wrapped constructor
        return new DynamicClass();
    }

    /**
     * Preload requirejs modules so they can be accessed synchronously.
     * @param pModulesPath Base path of modules to load (for ex: "src/components/" will preload all modules declared with a name starting with "src/components/")
     * @param pLoadedHandler Called when all modules are preloaded. List of modules passed in argument.
     */
    static preloadModules (pModulesPath:string[], pLoadedHandler:(pLoadedModules:string[]) => void):void
    {
        // Get the requirejs registry
        var registry            :{[index:string] : any} = this.getRegistryNames();

        // And the loaded modules list from requirejs
        var loadedModules       :{[index:string] : any} = this.getLoadedModulesNames();

        // Modules loaded and to load
        var modulesToLoad       :string[]   = [];
        var totalLoadedModules  :number     = 0;

        // Browse path we have to load
        for (var modulePathIndex in pModulesPath)
        {
            // Browser modules list
            for (var moduleName in registry)
            {
                if (
                        // If our module name start with a needed module path
                        moduleName.toLowerCase().indexOf( pModulesPath[modulePathIndex].toLowerCase() ) != -1

                        // And if this module is not already loaded
                        &&
                        !(moduleName in loadedModules)
                    )
                {
                    // Add the module name to the list of modules we have to load
                    modulesToLoad.push(moduleName);

                    // Use the require proxy to preload
                    this.requireProxy([moduleName], () =>
                    {
                        // When loaded, count it
                        totalLoadedModules ++;

                        // Callback when we have every modules
                        if (totalLoadedModules == modulesToLoad.length)
                        {
                            pLoadedHandler(modulesToLoad);
                        }
                    });
                }
            }
        }

        // If we don't have any module
        if (modulesToLoad.length == 0)
        {
            pLoadedHandler(modulesToLoad);
        }
    }
}
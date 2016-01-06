import {ModuleBase} from "./ModuleBase";

export class AppBase extends ModuleBase
{
    // -------------------------------------------------------------------------

    // todo : doc
	// TODO : Méthode pour voir si un controlleur / action existe avant le dispatch

    private _dependencyManager              :DependencyManager;

    private _componentsWatcher              :ComponentsWatcher;

    private _router                         :Router;

    private _mainBootstrap                  :Bootstrap;

    //private _urlBase                         :string;
    //get urlBase ():string { return this._urlBase; }


    get dependencyManager ():DependencyManager { return this._dependencyManager; }

    get componentsWatcher ():ComponentsWatcher { return this._componentsWatcher; }

    get router ():Router { return this._router; }

    get mainBootstrap ():Bootstrap { return this._mainBootstrap; }


    constructor ()
    {
        super();

        //this.initURLBase();
        this.configure();

        this.initBootstrap();
        this.initRouterManager();
        this.initRoutes();

        this.initDependencyManager();
        this.initDependencies();

        this.initAppResizeListening();

        this.initModulePreloading();
    }

	/*
    initURLBase ():void
    {
        this._urlBase = $('head > base').attr('href');
    }
    */

    configure ():void
    {
        // todo : throw error car strategy
    }

    initDependencyManager ():void
    {
        this._dependencyManager = DependencyManager.getInstance();
    }

    initDependencies ():void
    {
        // todo : throw error strategy
    }

    initBootstrap ():void
    {
        this._mainBootstrap = new Bootstrap(this.appNamespace);
    }

    initRouterManager ():void
    {
        this._router = Router.getInstance();

        this._router.onRouteChanged.add(this, this.routeChangedHandler);
        this._router.onRouteNotFound.add(this, this.routeNotFoundHandler);
    }

    routeNotFoundHandler ():void { }

    routeChangedHandler ():void { }

    initRoutes ():void
    {
        // todo : throw error strategy
    }

    initAppResizeListening ():void
    {
        $(window).resize(() =>
        {
            Central.getInstance("app").dispatch("resize");
        });
    }

    initModulePreloading ():void
    {
        this.dependencyManager.updateModuleCache((pLoadedModules) =>
        {
            this.initComponentsWatcher();
        });
    }

    initComponentsWatcher ():void
    {
        this._componentsWatcher = ComponentsWatcher.getInstance();

        this._componentsWatcher.registerTypes(
            this._dependencyManager.getFlatModulesTypes()
        );

        this._componentsWatcher.update();

        this.ready();
    }

    ready ():void { }
}

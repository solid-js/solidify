import {Disposable} from '../core/Disposable';
import {Master} from '../core/Master'
import {View} from '../core/View'
import {ArrayUtils} from '../utils/ArrayUtils'
//import {ComponentsWatcher} from '../dom/ComponentsWatcher'
import {Signal} from '../helpers/Signal'
import {Central} from '../helpers/Central'

// ----------------------------------------------------------------------------- STRUCTS

/**
 * Selector overload declaration
 */
export interface ISelectors
{
    [index:string] : string;
}

/**
 * Binding overload declaration
 */
export interface IBindings
{
    [index:string] : (...rest) => any;
}

/**
 * Registerd binding for removal
 */
export interface IMappedHandler
{
    handler : (...rest) => void;
    target  : any;
    name    : string;
    type    : number;
}

// ----------------------------------------------------------------------------- CLASS

export class DOMNode extends Disposable
{
    /**
     * Event detection to event types
     */
    static SIGNAL_SEPARATOR     :string         = ".";
    static EVENT_SEPARATOR      :string         = ":";
    static CENTRAL_SEPARATOR    :string         = "/";

    /**
     * Associated master on which nodes and events will be binded
     */
    private _master             :Master;

    /**
     * Overloaded selectors declarations
     */
    public selectors            :ISelectors     = {};

    /**
     * Overloaded bindings declarations
     */
    public bindings			    :IBindings      = {};

    /**
     * All binded events for removal
     */
    private _mappedHandlers 	:{[index:string] : IMappedHandler} = {};

    /**
     * Node constructor, strongly associated to a master to inject props.
     */
    constructor (pMaster:Master)
    {
        // Relay
        super();

        // Store reference to the master to inject props
        this._master = pMaster;
    }

    // ------------------------------------------------------------------------- CONFIG

    // Todo : SOLID Documenter les méthodes config : le fait qu'on puisse supprimer et la notion d'extends
    // todo : SOLID vérifier suppression d'events !
    // todo : SOLID Gestion des pOnlyNames sur selectors & bindings + les vérifier

    configure (pSelectors:ISelectors, pBindings:IBindings = null):void
    {
        // Append configuration
        this.configureSelectors(pSelectors);

        if (pBindings != null)
        {
            this.configureBindings(pBindings);
        }

        // IMPORTANT : Will auto update after configuration only if it's not a view
        // If it's a view, the view will update after rendering
        if (!this.isMasterView())
        {
            this.update();
        }
    }

    /**
     * Update all configured selectors and bindings.
     * Will remove and remap every bindings.
     */
    update (pOnlyNames:string[] = null, pOnlyLocals:boolean = false):void
    {
        this.processSelectors(pOnlyNames, pOnlyLocals);
        this.processBindings(pOnlyNames);
    }

    configureSelectors (pSelectors:ISelectors):void
    {
        // Add / remove every selectors to the current config
        for (var propName in pSelectors)
        {
            // Remove a selector if the value is null and the selector already registerd
            if (pSelectors[propName] == null && this.selectors[propName] != null)
            {
                delete this.selectors[propName];
            }

            // Add a selector
            else
            {
                this.selectors[propName] = pSelectors[propName];
            }
        }
    }

    configureBindings (pBindings:IBindings)
    {
        // Add every bindings to the current config
        for (var propName in pBindings)
        {
            // Remove a binding if the value is null and the binding already registerd
            if (pBindings[propName] == null && this.bindings[propName] != null)
            {
                delete this.bindings[propName];
            }

            // Add a binding
            else
            {
                this.bindings[propName] = pBindings[propName];
            }
        }
    }

    // ------------------------------------------------------------------------- PROCESSING

    /**
     * Will convert every declaration in the "selectors" prop into a jquery targeting
     * @param pOnlyNames Names of selectors you want to process only.
     */
    processSelectors (pOnlyNames:string[] = null, pOnlyLocals:boolean = false)
    {
        var currentSelectorSignature    :string;
        var jquerySelectorName          :string;
        var jqueryTargetedElement       :JQuery;
        var viewComponents              :Master[];
        var thisIndex                   :number;

        // Browser local nodes
        for (var selectorName in this.selectors)
        {
            // Skip if we have restricted names to update
            if (pOnlyNames != null)
            {
                if (!ArrayUtils.inArray(pOnlyNames, selectorName))
                {
                    continue;
                }
            }

            // Target the property in the view
            jquerySelectorName = ("$" + selectorName);
            currentSelectorSignature = this.selectors[selectorName];

            // todo : SOLID Doit-on faire du pattern dans les signatures ?

            // Check if we start with a "this"
            thisIndex = currentSelectorSignature.toLowerCase().indexOf("this");

            if (
                    // If our declaration start with a "this" keyword or ">" statement, local targeting
                    (
                        thisIndex == 0
                        ||
                        currentSelectorSignature.indexOf(">") == 0
                    )

                    // And if our master is a view (*)
                    &&
                    this.isMasterView()
                )
            {
                // Patch the selector for jQuery if we start with "this"
                if (thisIndex == 0)
                {
                    currentSelectorSignature = currentSelectorSignature.substr(4, currentSelectorSignature.length);
                }

                // Select from content
                jqueryTargetedElement = (<View>this._master).content.find(currentSelectorSignature);
            }

            // If we are updating only locals, we don't shave "this" in the selector so skip
            else if (pOnlyLocals)
            {
                continue;
            }

            // Global targeting
            else
            {
                // Select from document
                jqueryTargetedElement = $(currentSelectorSignature);
            }

            // Apply to the view as local
            this._master[jquerySelectorName] = jqueryTargetedElement;

            // Browser selector for view components
			// TODO : Disabled
            //viewComponents = ComponentsWatcher.getInstance().getViewsByJQuery(jqueryTargetedElement);

            // Insert groups into View[]
            if (this._master[selectorName] instanceof Array || viewComponents.length > 1)
            {
                this._master[selectorName] = viewComponents;
            }

            // Insert lonely elements directly into a local prop
            else if (viewComponents.length == 1)
            {
                this._master[selectorName] = viewComponents[0];
            }
        }
    }

    /**
     * Convert local "events" declaration into event bindings.
     * @param pOnlyNames Names of events you want to process only.
     */
    processBindings (pOnlyNames:string[] = null):void
    {
        var eventParts		    :string[];
        var handler			    :(...rest) => any;
        var selectorName	    :string;
        var jquerySelectorName	:string;
        var eventName		    :string;
        var eventType           :number;

        // Browse our loval events declaration
        for (var eventDeclaration in this.bindings)
        {
            // Check if this is an DOM event declaration
            if (eventDeclaration.indexOf(DOMNode.EVENT_SEPARATOR) != -1)
            {
                // Split selector from event name and specify event type
                eventType = 0;
                eventParts = eventDeclaration.split(DOMNode.EVENT_SEPARATOR);
            }

            // Or if this is a signal event declaration
            else if (eventDeclaration.indexOf(DOMNode.SIGNAL_SEPARATOR) != -1)
            {
                // Split selector from signal name and specify event type
                eventType = 1;
                eventParts = eventDeclaration.split(DOMNode.SIGNAL_SEPARATOR);
            }

            // Or if this is a central event declaration
            else if (eventDeclaration.indexOf(DOMNode.CENTRAL_SEPARATOR) != -1)
            {
                // Split selector from central name and specify event type
                eventType = 2;
                eventParts = eventDeclaration.split(DOMNode.CENTRAL_SEPARATOR);
            }

            // Neither, this declaration is not valid
            else
            {
                throw new Error('DOMNode.processBindings // Invalid binding declaration "' + eventDeclaration + '"' + this.errorViewName());
            }

			// Skip if we have restricted names to update
			if (pOnlyNames != null)
			{
				if (!ArrayUtils.inArray(pOnlyNames, eventParts[0]))
				{
					continue;
				}
			}


			// Get the parts from this declaration
            handler = this.bindings[eventDeclaration];

            // Get the subject node and the event name
            selectorName = eventParts[0];
            eventName = eventParts[1];

            // Target our jquery selector name
            jquerySelectorName = ("$" + selectorName);

            var thisSelector = null;
            var isThisSelector = false;

            // Check if the selector target "this"
            if (selectorName.toLowerCase() == "this")
            {
                isThisSelector = true;

                // Check if we are not trying to bind a DOM event on a non-view master
                if (eventType == 0 && !this.isMasterView())
                {
                    throw new Error('DOMNode.processBindings // Can\'t bind event ' + eventName + ' on non view master.');
                }
                else if (eventType == 2)
                {
                    throw new Error('DOMNode.processBindings // Can\'t bind central action ' + eventName + ' on an object. Central actions are bindable on channels only.');
                }
            }

            // Check if the selector part of the declaration is valid
            else if (
                    eventType == 1
                    &&
                    (!(selectorName in this._master) || this._master[selectorName] == null)
                )
            {
                throw new Error('DOMNode.processBindings // ' + selectorName + ' component not found' + this.errorViewName());
            }
            else if (
                    eventType == 0
                    &&
                    (!(selectorName in this.selectors) || this.selectors[selectorName] == null)
                )
            {
                throw new Error('DOMNode.processBindings // ' + jquerySelectorName + ' dom element not found' + this.errorViewName());
            }

            // We are not on a "this" selector
            else
            {
                isThisSelector = false;
            }

            // Delete the current event binding if already registerd
            this.removeBinding(eventDeclaration);

            // If the subject is "this"
            if (isThisSelector)
            {
                // Listen signal
                if (eventType == 1)
                {
                    this.registerSignalOnComponent(this._master, eventName, selectorName, eventDeclaration, handler);
                }

                // Listen DOM event on view content
                else if (this.isMasterView())
                {
                    this.registerEventOnDOM((<View> this._master).content, eventName, eventDeclaration, handler);
                }
            }

            // Add signal listening on component(s)
            else if (eventType == 1)
            {
                if (this._master[selectorName] instanceof Array)
                {
                    for (var i in this._master[selectorName])
                    {
                        this.registerSignalOnComponent(this._master[selectorName][i], eventName, selectorName, eventDeclaration, handler);
                    }
                }
                else
                {
                    this.registerSignalOnComponent(this._master[selectorName], eventName, selectorName, eventDeclaration, handler);
                }
            }

            // Add central action listening on channel
            else if (eventType == 2)
            {
                this.registerCentralOnMaster(selectorName, eventName, eventDeclaration, handler);
            }

            // Otherwise browse jquery selector and bind
            else
            {
                this._master[jquerySelectorName].each((i, el) =>
                {
                    this.registerEventOnDOM($(el), eventName, eventDeclaration, handler);
                });
            }
        }
    }

    // ------------------------------------------------------------------------- REMOVING

    /**
     * Remove a bindings with the event declaration.
     * Will return true if the binding is found.
     */
    removeBinding (pEventDeclaration:string):boolean
    {
        // If our event declaration is not found
        if (!(pEventDeclaration in this._mappedHandlers)) return false;

        // Target our mapped event
        var mappedHandler:IMappedHandler = this._mappedHandlers[pEventDeclaration];

        // DOM event
        if (mappedHandler.type == 0)
        {
            mappedHandler.target.unbind(mappedHandler.name, mappedHandler.handler);
        }

        // Signal event
        else if (mappedHandler.type == 1)
        {
            mappedHandler.target[mappedHandler.name].remove(mappedHandler.handler);
        }

        // Central Event
        else if (mappedHandler.type == 2)
        {
            Central.getInstance(mappedHandler.target).remove(mappedHandler.name, mappedHandler.handler);
        }

        // Remove event declaration slot
        delete this._mappedHandlers[pEventDeclaration];

        return true;
    }

    /**
     * Remove registered selectors
     */
    removeSelectors ():void
    {
        for (var i in this.selectors)
        {
            delete this._master[i];
            delete this.selectors[i];
        }
    }

    /**
     * Remove registered bindings
     */
    removeBindings ():void
    {
        for (var i in this.bindings)
        {
            this.removeBinding(i);
            delete this.bindings[i];
        }
    }

    /**
     * Destruction.
     * Remove all bindings / selectors on the master and dispose.
     */
    dispose ():void
    {
        // Remove bindings before selectors
        this.removeBindings();
        this.removeSelectors();

        // Delete slots to throw errors if used
        this.selectors = null;
        this.bindings = null;
        this._mappedHandlers = null;

        // Relay
        super.dispose();
    }

    // ------------------------------------------------------------------------- IDENTIFYING MASTER

    /**
     * Check if our master is a view
     */
    private isMasterView ():boolean
    {
        /**
         * todo : SOLID WTF
         * ULTRA WARNING DE OUF :
         * Attention, si on utilise
         * this._master instanceof View
         * Ou si on utilise View ici, requirejs perd ses choux !
         */

        return ("viewName" in this._master && this._master["viewName"] != null && this._master["viewName"] != "");
    }

    /**
     * Get the view name for error throwing
     */
    private errorViewName ():string
    {
        return (this.isMasterView() ? ' in view ' + this._master["viewName"] : '');
    }

    // ------------------------------------------------------------------------- REGISTERING BINDINDS

    /**
     * Bind a DOM event and register it
     */
    private registerEventOnDOM (pElement:JQuery, pEventName:string, pLocalDeclaration:string, pHandler:(...rest) => any):void
    {
        // Make a proxy to lock "this" on the master
        var proxyHandler = (...rest) =>
        {
            pHandler.apply(this._master, [pElement].concat(rest));
        };

        // Bind
        pElement.bind(pEventName, proxyHandler);

        // Register
        this.registerMappedHandler(pLocalDeclaration, pElement, pEventName, proxyHandler, 0);
    }

    /**
     * Bind a signal and register it
     */
    private registerSignalOnComponent (pComponent:any, pEventName:string, pSelectorName:string, pLocalDeclaration:string, pHandler:(...rest) => any):void
    {
        // Check if our signal extists on the component
        if (!(pEventName in pComponent) || pComponent[pEventName] == null || !(pComponent[pEventName] instanceof Signal))
        {
            throw new Error('DOMNode.processBindings // Signal ' + pEventName + ' not found on component ' + pSelectorName + this.errorViewName());
        }

        // Make a proxy to lock "this" on the master
        var proxyHandler = (...rest) =>
        {
            pHandler.apply(this._master, [pComponent].concat(rest));
        };

        // Bind
        (<Signal> pComponent[pEventName]).add(this._master, proxyHandler);

        // Register
        this.registerMappedHandler(pLocalDeclaration, pComponent, pEventName, proxyHandler, 1);
    }

    /**
     * Bind a central event and register it
     */
    private registerCentralOnMaster (pSelectorName:any, pEventName:string, pLocalDeclaration:string, pHandler:(...rest) => any):void
    {
        // Bind
        Central.getInstance(pSelectorName).add(pEventName, this._master, pHandler);

        // Register
        this.registerMappedHandler(pLocalDeclaration, pSelectorName, pEventName, pHandler, 2);
    }

    /**
     * Register a binding for futur removal
     * @param pLocalDeclaration Declaration of the binding (used as key)
     * @param pTarget The component or the host of the binding
     * @param pName Name of the listened event
     * @param pHandler Attached handler
     * @param pType Type of binding (0 : DOM / 1 : Signal / 2 : Central)
     */
    private registerMappedHandler (pLocalDeclaration:string, pTarget:any, pName:string, pHandler:(...rest) => any, pType:number):void
    {
        this._mappedHandlers[pLocalDeclaration] = {
            handler: pHandler,
            target: pTarget,
            name: pName,
            type: pType
        };
    }
}
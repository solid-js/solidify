import Master = require("./Master");
import DOMNode = require("../dom/DOMNode");
import ComponentsWatcher = require("../dom/ComponentsWatcher");

export class View extends Master
{
	static EXTERNAL_NODE_REPLACER = "s-external-replacer";
	static INTERNAL_NODE_REPLACER = "s-internal-replacer";


	public content					:JQuery;

	public externalContent			:JQuery;

	public internalContent			:JQuery;

	public data						:any;

	public viewName					:string						= "anonymous view";

	public isAttachedToDocument		:boolean 					= false;

	// todo : doc
	public autoDispose				:boolean 					= false;

	private _markups				:{(...rest): string}[]		= [];

	// todo : Passer le __file__ en tableau de files ? Intégrés via prototype, ça permetterait de vérifier le type de chaque élément au runtime :)
	// -> ça m'a l'air compliqué à implémenter ...

	// todo : gestion des signaux pour les afterRender etc pour pouvoir appeler des méthodes qui ont besoin du template depuis l'extérieu
	// todo : gestion des addedToDOM / removed... en signaux

	// todo : doc
	init ():void
	{
		// Relay (will call configure)
		super.init();

		// Init template related stuff
		this.initTemplate();

		// Start rendering
		this.render();
	}

	// todo : doc
	configure ():void
	{

	}

	// todo : doc
	remove ():void
	{
		// If we have content
		if (this.content != null)
		{
			// Remove from DOM
			(this.content.parent() != null) && this.content.remove();

			// Remove from componentsWatcher
			ComponentsWatcher.getInstance().removeComponentByJQuery(this.content);
		}

		// Remove all handlers from node
		this.domNode.dispose();

		// Dispose the view
		this.dispose();
	}

	// todo : doc
	initTemplate ():void
	{
		// Check if this template markup is referenced
		if (this.viewName in TemplateFiles)
		{
			// Store the markup function
			this.addTemplate(this.viewName);
		}
	}

	// todo : doc
	addTemplate (pTemplatePath:string):void
	{
		// Store the markup function
		this._markups.push(TemplateFiles[pTemplatePath]);
	}

	// todo : doc
	render ():void
	{
		// Todo : supprimer les composants du watcher si on rerender

		// TODO : Trouver une alternative aux 2 events qui ne sont pas dispo sur ff et ie

		this.beforeRender();

		// If we have markups to render
		if (this._markups.length > 0)
		{
			var oldContent				:JQuery		= this.content;
			var generatedContent		:string;
			var parentTemplate			:string		= "";
			var jqueryGeneratedContent	:JQuery;

			// Default data so we can insert external and parent data
			if (this.data == null)
			{
				this.data = {};
			}

			// todo : SOLID idée, ajouter la possibilité de register des tag custom (comme s-external) dans les templates
			// todo : SOLID Ca pourrait aider pour intégrer le canvas dans un hbs avec {{s-three}} par exemple

			// If we have external data from the current DOM
			// Insert a replacement tag
			this.data["s-internal"] = (this.internalContent != null ? '<' + View.INTERNAL_NODE_REPLACER + "></" + View.INTERNAL_NODE_REPLACER + ">" : null);
			this.data["s-external"] = (this.externalContent != null ? '<' + View.EXTERNAL_NODE_REPLACER + "></" + View.EXTERNAL_NODE_REPLACER + ">" : null);

			// Browse all markups
			for (var markupIndex in this._markups)
			{
				// Generate template with data
				generatedContent = this._markups[markupIndex](this.data);

				// Transform to jquery content
				jqueryGeneratedContent = $(generatedContent);

				// Inject parent template data for extends purpose
				this.data["s-parent"] = parentTemplate;

				// Store generated data as parent for the next markup
				parentTemplate = generatedContent;
			}

			// Insert internal content after template generation
			if (this.internalContent != null)
			{
				jqueryGeneratedContent.find(View.INTERNAL_NODE_REPLACER).first().replaceWith(this.internalContent);
			}

			// Insert external content after template generation
			// It allow to keep real dom elements otherwise we would had to insert string formated content, which is bad mkay
			if (this.externalContent != null)
			{
				// todo : SOLID Problème quand on le vire, le replace supprime le contenu de externalContent
				// Avant c'était patché avec un clone, qu'il faut éviter à tout prix
				jqueryGeneratedContent.find(View.EXTERNAL_NODE_REPLACER).first().replaceWith(this.externalContent);
			}

			// Target new content
			this.content = jqueryGeneratedContent;

			// If this view content is included in parent
			if (oldContent != null && oldContent.parent() != null)
			{
				// Remplace the node by new content
				oldContent.replaceWith(this.content);
			}

			// Search for components
			ComponentsWatcher.getInstance().update(this.content);
		}
		else if (this.content == null)
		{
			// We don't have any template, so we pick the parent of our content from the DOM
			if (this.externalContent != null)
			{
				this.content = this.externalContent.parent();
			}
			else if (this.internalContent != null)
			{
				this.content = this.internalContent;
			}
			else
			{
				throw new Error("View.render // No content to render.");
			}
		}

		// todo : OPTIMISATION trouver un moyen de remap les selecteurs / bindings locaux uniquement

		// todo : PUTAIN DE BUG AVEC LE PARENT QUI CHANGE QUAND ON FAIT DU NESTED COMPONENTS -> GROS GROS BINS A REGLER !!!!!!!!

		// Remap local selectors and bindings
		this.domNode.update();

		// Call the after render
		this.afterRender();
	}

	// Todo : doc
	beforeRender ():void { }
	afterRender ():void { }

	// Todo : doc
	addedToDOM ():void { }
	removedFromDOM ():void { }

	/**
	 * Inject property, used by ComponentsWatcher.
	 * Can be overrider to transform or block property injection.
	 * @param pPropertyName Name of the property
	 * @param pValue Value of the property
	 */
	injectProperty (pPropertyName:string, pValue:any):void
	{
		this[pPropertyName] = pValue;
	}

	/**
	 * View destruction. Will unbind all events
	 */
	dispose ():void
	{
		// todo : remove propre de tous les events / central / signals / ComponentsWatcher ...

		super.dispose();
	}
}
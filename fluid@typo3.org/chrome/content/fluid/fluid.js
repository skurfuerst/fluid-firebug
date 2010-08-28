FBL.ns(function() {with (FBL) {
	// Name of the panel we are inserting.
	var panelName = "FluidFirebugPanel";

	var numberOfDocumentationPanels = 2;

	/**
	 * Here, there are some helper functions which are available throughout all
	 * the panels.
	 */
	Firebug.FluidModule = extend(Firebug.Module, {
		// If a panel is switched, only show the Fluid buttons if
		// we are in the Fluid-Panel, else, hide the buttons.
		showPanel: function(browser, panel) {
			var isFluidPanel = panel && (panel.name == panelName);
			var fluidButtons = browser.chrome.$("fluidButtons");
			collapse(fluidButtons, !isFluidPanel);
		},

		// triggered if the button "View Template Source" is clicked
		onViewTemplateSource: function(context) {
			context.getPanel(panelName, false).display('templateSource');
		},

		// triggered if the button "View Layout Source" is clicked
		onViewLayoutSource: function(context) {
			context.getPanel(panelName, false).display('layoutSource');
		},

		showDetailInformation: function(uri) {
			this.xhrRequest(uri, function(request) {
				var json = eval( "(" + request.responseText + ")");
				for (var i=0; i < numberOfDocumentationPanels; i++) {
					var currentPanel = Firebug.currentContext.getPanel('FluidDocumentation' + i);
					if (typeof json[i] != 'undefined') {
						var currentTabConfiguration = json[i];
						currentPanel.setTitle(currentTabConfiguration.title);
						currentPanel.setContent(currentTabConfiguration.data);
						$('fbPanelBar2').openPanel("FluidDocumentation" + i);
					} else {
						$('fbPanelBar2').closePanel("FluidDocumentation" + i);
					}
				}
			}, this);
		},
		/**
		 * Helper function which does a XHR GET request.
		 */
		xhrRequest: function(uri, callback, scope) {
			var request = new XMLHttpRequest();
			request.onreadystatechange = function() {
				if (request.readyState == 4 && request.status == 200) {
					callback.call(scope, request);
				}
			}
			request.open("GET", uri, true);
			request.send(null);
		}
	});
	Firebug.registerModule(Firebug.FluidModule);

	/**
	 * THE MAIN PANEL. This loads the fluid template source.
	 */
	function FluidPanel() {}
	FluidPanel.prototype = extend(Firebug.Panel, {
		name: panelName,
		title: "Fluid",

		// Contents of the tab which are currently displayed.
		currentlyDisplayed: '',
		initialize: function() {
			Firebug.Panel.initialize.apply(this, arguments);
			this.display('templateSource');
			this.displayExplanationText();
		},
		display: function(mode) {
			if (mode == this.currentlyDisplayed) return; // nothing to do.
			this.currentlyDisplayed = mode;

			var panel = this;
			panel.panelNode.innerHTML = "Loading...";
			Firebug.FluidModule.xhrRequest(this.getTemplateAnalyzerUri(mode), this.dataLoaded, this);
		},
		displayExplanationText: function() {
			var currentPanel = Firebug.currentContext.getPanel('FluidDocumentation0');
			currentPanel.setTitle('About');
			currentPanel.setContent("<h2>About</h2><p>This is the Fluid Template Analyzer. Please click on the highlighted elements on the left to display additional information about them.</p>");
			$('fbPanelBar2').openPanel("FluidDocumentation0");

			for (var i=1; i<numberOfDocumentationPanels; i++) {
				$('fbPanelBar2').closePanel("FluidDocumentation" + i);
			}
		},
		dataLoaded: function(request) {
			if (request.responseText.indexOf("<!--FLUID-TEMPLATE-SOURCE-->") != -1) {
				this.panelNode.innerHTML = request.responseText;
				this.setUpEvents();
			} else {
				this.panelNode.innerHTML = "No Fluid Template.";
			}
		},
		setUpEvents: function() {
			var tagsWithAdditionalInformation = Sizzle("[data-informationuri]", this.panelNode);
			var l = tagsWithAdditionalInformation.length;
			for (var i=0; i<l; i++) {
				var singleTag = tagsWithAdditionalInformation[i];
				singleTag.addEventListener('click', function() {
					var fluidDetailsPanel = Firebug.FluidModule.showDetailInformation(this.getAttribute('data-informationuri'));
				}, false);
			}
		},
		getTemplateAnalyzerUri: function(mode) {
			var argument;
			if (this.context.window.location.search == "") {
				argument = "?f3-fluid-debug=firebug";
			} else {
				argument = "&f3-fluid-debug=firebug";
			}
			return this.context.window.location.href + argument + "&f3-fluid-mode=" + mode;
		}
	});

	Firebug.registerPanel(FluidPanel);

	function AbstractFluidDetailsPanel() {}
	AbstractFluidDetailsPanel.prototype = extend(Firebug.Panel, {
		name: "FluidDetails",
		parentPanel: panelName,
		title: "About",

		setContent: function(data) {
			this.panelNode.innerHTML = data;
		},
		setTitle: function(title) {
			// HACK: Store the current title inside the prototype of the object.
			this.__proto__.title = title;
			var tab = $('fbPanelBar2').getTab(this.name);
			if (typeof tab !== 'undefined') {
				tab.setAttribute('label', title);
			}
		}
	});

	for (var i=0; i<numberOfDocumentationPanels; i++) {
		var docPanel = function() {};
		docPanel.prototype = extend(AbstractFluidDetailsPanel.prototype, {
			name: "FluidDocumentation" + i,
			title: "FluidDocumentation" + i,
			order: i
		});

		Firebug.registerPanel(docPanel);
	}
}});

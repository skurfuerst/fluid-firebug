FBL.ns(function() { with (FBL) {
	// Name of the panel we are inserting.
	var panelName = "FluidFirebugPanel";

	Firebug.FluidModule = extend(Firebug.Module, {
		// If a panel is switched, only show the Fluid buttons if
		// we are in the Fluid-Panel, else, hide the buttons.
		showPanel: function(browser, panel) {
			var isFluidPanel = panel && (panel.name == panelName);
			var fluidButtons = browser.chrome.$("fluidButtons");
			collapse(fluidButtons, !isFluidPanel);
		},

		onViewTemplateSource: function(context) {
			Firebug.currentContext.getPanel("Fluid", false).display('templateSource');
		},
		onViewLayoutSource: function(context) {
			Firebug.currentContext.getPanel("Fluid", false).display('layoutSource');
		}
	});
	Firebug.registerModule(Firebug.FluidModule);

	// The actual panel
	function FluidPanel() {}
	FluidPanel.prototype = extend(Firebug.Panel, {
		name: panelName,
		title: "Fluid",

		// Contents of the tab which are currently displayed.
		currentlyDisplayed: '',
		initialize: function() {
			Firebug.Panel.initialize.apply(this, arguments);
			this.display('templateSource');
		},
		display: function(mode) {
			if (mode == this.currentlyDisplayed) return; // nothing to do.
			this.currentlyDisplayed = mode;

			var panel = this;
			panel.panelNode.innerHTML = "Loading...";
			var request = new XMLHttpRequest();
			request.onreadystatechange = function() {
				if (request.readyState == 4 && request.status == 200) {
					panel.dataLoaded.call(panel, request);
				}
			}
			request.open("GET", this.getTemplateAnalyzerUri(mode), true);
			request.send(null);
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
					var fluidDetailsPanel = Firebug.currentContext.getPanel("FluidDetails", false);
					fluidDetailsPanel.loadUri(this.getAttribute('data-informationuri'));
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

	function FluidDetailsPanel() {}
	FluidDetailsPanel.prototype = extend(Firebug.Panel, {
		name: "FluidDetails",
		parentPanel: panelName,
		title: "Details",
		loadUri: function(uri) {
			var panel = this;

			panel.panelNode.innerHTML = "Loading...";
			var request = new XMLHttpRequest();
			request.onreadystatechange = function() {
				if (request.readyState == 4 && request.status == 200) {
					panel.dataLoaded.call(panel, request);
				}
			}
			request.open("GET", uri, true);
			request.send(null);
		},
		dataLoaded: function(request) {
			this.panelNode.innerHTML = request.responseText;
		}
	});

	Firebug.registerPanel(FluidDetailsPanel);

}});

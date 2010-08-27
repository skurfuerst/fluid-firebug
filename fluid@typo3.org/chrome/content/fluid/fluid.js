FBL.ns(function() { with (FBL) {

	function FluidPanel() {}

	FluidPanel.prototype = extend(Firebug.Panel, {
		name: "Fluid",
		title: "Fluid",

		initialize: function() {
			Firebug.Panel.initialize.apply(this, arguments);

			var panel = this;

			var argument = "";
			if (panel.context.window.location.search == "") {
				argument = "?f3-fluid-debug=firebug";
			} else {
				argument = "&f3-fluid-debug=firebug";
			}
			var fluidTemplateAnalyzerUri =
				panel.context.window.location.href + argument;

			eval('panel.panelNode.innerHTML = "Loading..."');
			var request = new XMLHttpRequest();
			request.onreadystatechange = function() {
				if (request.readyState == 4 && request.status == 200) {
					if (request.responseText.indexOf("<!--FLUID-TEMPLATE-SOURCE-->") != -1) {
						panel.panelNode.innerHTML = request.responseText;
					} else {
						panel.panelNode.innerHTML = "No Fluid Template.";
					}
				}
			}
			request.open("GET", fluidTemplateAnalyzerUri, true);
			request.send(null);
		},
	});

	Firebug.registerPanel(FluidPanel);

}});

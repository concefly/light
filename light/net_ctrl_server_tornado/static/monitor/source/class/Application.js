/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/**
 * This is the main application class of your custom application "monitor"
 *
 * @asset(monitor/*)
 */
qx.Class.define("monitor.Application",
{
	extend : qx.application.Standalone,

	/*
	*****************************************************************************
	 MEMBERS
	*****************************************************************************
	*/

	members :
	{
		/**
		 * This method contains the initial application code and gets called 
		 * during startup of the application
		 * 
		 * @lint ignoreDeprecated(alert)
		 */
		main : function()
		{
			// Call super class
			this.base(arguments);

			// Enable logging in debug variant
			if (qx.core.Environment.get("qx.debug"))
			{
				// support native logging capabilities, e.g. Firebug for Firefox
				qx.log.appender.Native;
				// support additional cross-browser console. Press F7 to toggle visibility
				qx.log.appender.Console;
			}

			/*
			-------------------------------------------------------------------------
			Below is your actual application code...
			-------------------------------------------------------------------------
			*/

			var doc = this.getRoot();
			
			var composite = new qx.ui.container.Composite();
			composite.setLayout(new qx.ui.layout.HBox(5));
			
			var tree = new monitor.GroupDevTree();
			tree.update();
			tree.set({width:300, height:500});
			composite.add(tree);
			
			var groupFixText = new monitor.GroupFixInfoText();
			tree.addListener('changeSelection',function(e)
			{
				var dat = e.getData()[0].getModel();
				groupFixText.update(dat.getZaddr());
			},this);
			composite.add(groupFixText);
			
			var groupVarArea = new monitor.GroupVarInfoArea();
			groupVarArea.set({width:300, height:500});
			tree.addListener('changeSelection',function(e)
			{
				var dat = e.getData()[0].getModel();
				groupVarArea.update(dat.getZaddr());
			},this);
			composite.add(groupVarArea);
			
			var devFixText = new monitor.DevFixInfoText();
			tree.addListener('changeSelection',function(e)
			{
				var dat = e.getData()[0].getModel();
				if( dat.getType() == 'device' )
				{
					devFixText.update(dat.getZaddr(),dat.getId());
				}
			},this);
			composite.add(devFixText);
			
			var devVarArea = new monitor.DevVarInfoArea();
			devVarArea.set({width:300, height:500});
			tree.addListener('changeSelection',function(e)
			{
				var dat = e.getData()[0].getModel();
				if( dat.getType() == 'device' )
				{
					devVarArea.update(dat.getZaddr(),dat.getId());
				}
			},this);
			composite.add(devVarArea);
			
			doc.add(composite);
			
		}
	}
});


qx.Class.define('monitor.GroupInfoGroup',
{
	extend: qx.ui.groupbox.GroupBox,
	
	members:
	{
		__coreData: null,
		__fix: null,
		__var: null
	},
	
	construct: function()
	{
		this.base(arguments);
		
		//~ 设置布局
		this.setLayout(new qx.ui.layout.HBox(1));
		
		//~ 
		this.__fix = new monitor.GroupFixInfo("Fix information");
		
		//~ 
		this.add(this.__fix);
	}
});

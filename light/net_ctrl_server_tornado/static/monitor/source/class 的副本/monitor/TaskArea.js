
qx.Class.define('monitor.TaskArea',
{
	extend: qx.ui.groupbox.GroupBox,
	
	members:
	{
		__dev00: null,
		__dev01: null,
		
		__devDyn: null
	},
	
	construct: function()
	{
		this.base(arguments);
		
		//~ 设置布局
		this.setLayout(new qx.ui.layout.VBox());
		
		//~ 
		this.__devDyn = new monitor.DevDyn();
		
		//~ 
		this.__dev00 = new monitor.Dev00Task('Device type 00');
		this.__dev00.addListener('changeValue')
		
		//~ 
		this.add(this.__dev00);
	}
});

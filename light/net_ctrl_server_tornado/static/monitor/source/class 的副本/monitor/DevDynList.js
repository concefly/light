
qx.Class.define('monitor.DevDynList',
{
	extend: qx.ui.form.List,
	
	members:
	{
		__ctrl: null,
		__store: null,
		
		update: function(zaddr,id,limit)
		{
			this.__store.update(zaddr,id,limit);
		},
		
		clear: function()
		{
			this.__store.clear();
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		
		this.__ctrl = new qx.data.controller.List(null,this,'label');
		
		this.__store = new monitor.DevDyn();
		this.__store.bind('model',this.__ctrl,'model');
	}
});

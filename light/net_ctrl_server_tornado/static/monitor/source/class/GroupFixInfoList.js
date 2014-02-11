
qx.Class.define('monitor.GroupFixInfoList',
{
	extend: qx.ui.form.List,
	
	members:
	{
		__ctrl: null,
		__store: null,
		
		update: function(zaddr)
		{
			if(this.__store==null)
			{
				this.__store = new monitor.GroupFixInfo();
				this.__store.bind('model',this.__ctrl,'model');
			}
			this.__store.update(zaddr);
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		this.__ctrl = new qx.data.controller.List(null,this,'item');
	}
});

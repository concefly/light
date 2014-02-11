
qx.Class.define("monitor.SysInfo",
{
	extend: qx.core.Object,
	
	properties:
	{
		url: {init:'localhost/', nullable:false, check:'String'},
		value: {nullable:true, event:'changeValue'}
	},
	
	statics:
	{
		path: 'api/sys_info'
	},
	
	members:
	{
		__json: null,

		update: function()
		{
			if(this.__json==null)
			{
				this.__json = new qx.data.store.Jsonp();
				this.__json.setCallbackName('callback');
				this.__json.setCallbackParam('callback');
				this.__json.bind('model',this,'value');
				this.__json.setUrl(this.getUrl()+this.self(arguments).path);
			}
			else
			{
				this.__json.reload();
			}
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		this.setUrl(arguments[0]);
	}
});

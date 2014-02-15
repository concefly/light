
qx.Class.define('monitor.GroupFixInfo',
{
	extend: qx.core.Object,
	
	properties:
	{
		zaddr: {nullable:true, event:'changeZaddr'},
		model: {init:qx.data.marshal.Json.createModel([{item:'null', content:'null'}]), event:'changeModel'}
	},
	
	statics:
	{
		path: '/api/group_fix_info'
	},
	
	members:
	{
		__store: null,
		__zaddr: null,
		
		update: function(zaddr)
		{
			if(this.__store==null)
			{
				this.__store = new qx.io.request.Xhr(this.self(arguments).path,'POST');
				this.__store.addListener('success',this._convert,this);
			}
			this.__store.setRequestData({zaddr:zaddr});
			this.__store.send();
			this.__zaddr = zaddr;
		},
		
		_convert: function(e)
		{
			var rawRes = e.getTarget().getResponse();
			var res = eval('('+rawRes+')');
			
			this.setZaddr(this.__zaddr);
			this.setModel(qx.data.marshal.Json.createModel(res));
		}
	},
	
	construct: function()
	{
		this.debug('into group fix info construct()');
		this.base(arguments);
	}
});

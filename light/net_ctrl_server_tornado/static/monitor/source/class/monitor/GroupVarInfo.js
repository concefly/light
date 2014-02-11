
qx.Class.define('monitor.GroupVarInfo',
{
	extend: qx.core.Object,
	
	properties:
	{
		zaddr: {nullable:true, event:'changeZaddr'},
		model: {init:qx.data.marshal.Json.createModel([{item:'null', content:'null'}]), event:'changeModel'}
	},
	
	statics:
	{
		path: '/api/group_var_info'
	},
	
	members:
	{
		__store: null,
		__zaddr: null,
		
		update: function(zaddr)
		{
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
		},
		
		remoteUpdate: function()
		{
			var req = {};
			req['zaddr'] = this.getZaddr();
			this.getModel().forEach(function(item)
			{
				req[ item.getItem() ] = item.getContent();
			},this);
			this.__store.setRequestData(req);
			this.__store.send();
		},
		
		clear: function()
		{
			this.setModel(qx.data.marshal.Json.createModel([{item:'null', content:'null'}]));
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		this.__store = new qx.io.request.Xhr(this.self(arguments).path,'POST');
		this.__store.addListener('success',this._convert,this);
	}
});


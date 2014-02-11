
qx.Class.define('monitor.DevVarInfo',
{
	extend: qx.core.Object,
	
	properties:
	{
		zaddr: {nullable:true, event:'changeZaddr'},
		id: {nullable:true, event:'changeId'},
		model: {init:qx.data.marshal.Json.createModel([{item:'null', content:'null'}]), event:'changeModel'}
	},
	
	statics:
	{
		path: '/api/dev_var_info'
	},
	
	members:
	{
		__store: null,
		__zaddr: null,
		__id: null,
		
		update: function(zaddr,id)
		{
			this.__store.setRequestData({zaddr:zaddr, id:id});
			this.__store.send();
			this.__zaddr = zaddr;
			this.__id = id;
		},
		
		_convert: function(e)
		{
			var rawRes = e.getTarget().getResponse();
			var res = eval('('+rawRes+')');
			
			this.setZaddr(this.__zaddr);
			this.setId(this.__id);
			this.setModel(qx.data.marshal.Json.createModel(res));
		},
		
		remoteUpdate: function()
		{
			var req = {};
			req['zaddr'] = this.getZaddr();
			req['id'] = this.getId();
			this.getModel().forEach(function(item)
			{
				req[ item.getItem() ] = item.getContent();
			},this);
			//~ this.debug(qx.util.Serializer.toJson(req));
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



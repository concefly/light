
qx.Class.define('monitor.DevFixInfo',
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
		path: '/api/dev_fix_info'
	},
	
	members:
	{
		__store: null,
		__zaddr: null,
		__id: null,
		
		update: function(zaddr,id)
		{
			if(this.__store==null)
			{
				this.__store = new qx.io.request.Xhr(this.self(arguments).path,'POST');
				this.__store.addListener('success',this._convert,this);
			}
			this.__store.setRequestData({zaddr:zaddr, id:id});
			this.__store.send();
			this.__zaddr = zaddr;
			this.__id = id;
		},
		
		clear: function()
		{
			this.setModel(qx.data.marshal.Json.createModel([{item:'null', content:'null'}]));
		},
		
		_convert: function(e)
		{
			var rawRes = e.getTarget().getResponse();
			var res = eval('('+rawRes+')');
			
			this.setZaddr(this.__zaddr);
			this.setId(this.__id);
			this.setModel(qx.data.marshal.Json.createModel(res));
		}
	},
	
	construct: function()
	{
		this.base(arguments);
	}
});


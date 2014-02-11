
qx.Class.define('monitor.DevDyn',
{
	extend: qx.core.Object,
	
	properties:
	{
		zaddr: {nullable:true, event:'changeZaddr'},
		id: {nullable:true, event:'changeId'},
		model: {init:qx.data.marshal.Json.createModel([{label:'null'}]), event:'changeModel'}
	},
	
	statics:
	{
		path: '/api/dev_dyn'
	},
	
	members:
	{
		__store: null,
		__zaddr: null,
		__id: null,
		
		update: function(zaddr,id,limit)
		{
			this.__store.setRequestData({zaddr:zaddr, id:id, limit:limit});
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
		
		remoteAdd: function(zaddr,id,limit,datDict)
		{
			var req = {};
			req['zaddr'] = zaddr;
			req['id'] = id;
			req['limit'] = limit;
			for(var k in datDict)
			{
				req[k] = datDict[k];
			}
			this.__store.setRequestData(req);
			this.__store.send();
		},
		
		clear: function()
		{
			this.setModel(qx.data.marshal.Json.createModel([{label:'null'}]));
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		this.__store = new qx.io.request.Xhr(this.self(arguments).path,'POST');
		this.__store.addListener('success',this._convert,this);
	}
});




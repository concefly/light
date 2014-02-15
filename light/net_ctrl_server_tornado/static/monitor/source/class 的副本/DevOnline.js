
qx.Class.define("monitor.DevOnline",
{
	extend: qx.core.Object,
	
	properties:
	{
		value: {nullable:true, event:'changeValue'}
	},
	
	statics:
	{
		path: '/api/dev_online'
	},
	
	events:
	{
		error: 'qx.event.type.Data'
	},
	
	members:
	{
		__req: null,
		
		update: function(zaddr,id)
		{
			if(this.__req==null)
			{
				this.__req = new qx.io.request.Xhr( this.self(arguments).path, 'post');
				this.__req.addListener('success',this.convert,this);
			}
			this.__req.setRequestData({'zaddr':zaddr, 'id':id});
			this.__req.send();
		},
		
		convert: function(e)
		{
			var req = e.getTarget();
			var dat = eval('('+req.getResponse()+')');
			var state = dat['state'];
			var msg = dat['message'];
			if(state==200)
			{
				var res = new qx.data.Array(dat['response']);
				this.setValue( res ) ;
			}
			else
				this.fireDataEvent('error',dat);
		}
	},
	
	construct: function()
	{
		this.base(arguments);
	}
});


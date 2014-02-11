
qx.Class.define('monitor.HttpResponse',
{
	extend: qx.io.request.Xhr,
	
	properties:
	{
		state: {init:200, event:'changeState'},
		message: {init:'ok', event:'changeMessage'},
		response: {init:qx.data.marshal.Json.createModel([]), event:'changeResponse'}
	},
	
	members:
	{
		_onSuccess: function(e)
		{
			var rawRes = e.getTarget().getResponse();
			alert(rawRes);
			var res = eval('('+ rawRes +')');
			this.set('state',res['state']);
			this.set('message',res['message']);
			this.set('response',qx.data.marshal.Json.createModel(res['response']));
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		
		this.addListener('success',this._onSuccess,this);
	}
});

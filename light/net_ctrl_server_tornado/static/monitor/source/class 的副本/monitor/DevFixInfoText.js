
qx.Class.define('monitor.DevFixInfoText',
{
	extend: qx.ui.form.TextArea,
	
	members:
	{
		__store: null,
		
		update: function(zaddr,id)
		{
			this.__store.update(zaddr,id);
		},
		
		clear: function()
		{
			this.__store.clear();
		},
		
		_onChangeModel: function(e)
		{
			var model = e.getData();
			var str = '';
			
			model.forEach(function(item)
			{
				str += item.getItem() + ':\n' + item.getContent() + '\n\n';
			},this);
			
			this.setValue(str);
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		this.__store = new monitor.DevFixInfo();
		this.__store.addListener('changeModel',this._onChangeModel,this);
	}
});


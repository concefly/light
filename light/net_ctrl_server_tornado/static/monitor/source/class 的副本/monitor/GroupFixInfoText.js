
qx.Class.define('monitor.GroupFixInfoText',
{
	extend: qx.ui.form.TextArea,
	
	members:
	{
		__store: null,
		
		update: function(zaddr)
		{
			this.__store.update(zaddr);
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
		this.debug('into group fix info text construct()');
		this.base(arguments);
		this.__store = new monitor.GroupFixInfo();
		this.__store.addListener('changeModel',this._onChangeModel,this);
	}
});

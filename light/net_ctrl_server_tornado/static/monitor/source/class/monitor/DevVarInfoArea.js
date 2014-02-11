
qx.Class.define('monitor.DevVarInfoArea',
{
	extend: qx.ui.groupbox.GroupBox,
	
	members:
	{
		__store: new monitor.DevVarInfo(),
		
		__form: new qx.ui.form.Form(),
		__nameText: new qx.ui.form.TextField(),
		__descText: new qx.ui.form.TextArea(),
		__commitBtn: new qx.ui.form.Button('commit'),
		
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
			var tmp = {};
			
			this.__nameText.setValue('');
			this.__descText.setValue('');
			model.forEach(function(item)
			{
				if(item.getItem()=='name')
				{
					this.__nameText.setValue(item.getContent());
				}
				else if(item.getItem()=='describe')
				{
					this.__descText.setValue(item.getContent());
				}
			},this);
		},
		
		_onCommit: function()
		{
			this.__store.getModel().forEach(function(item)
			{
				var it = item.getItem();
				if(it == 'name')
				{
					item.setContent( this.__nameText.getValue() );
				}
				if(it == 'describe')
				{
					item.setContent( this.__descText.getValue() );
				}
			},this);
			this.__store.remoteUpdate();
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		
		this.__store.addListener('changeModel',this._onChangeModel,this);
		this.__commitBtn.addListener('execute',this._onCommit,this);
		
		this.__form.addGroupHeader('Device var info');
		this.__form.add(this.__nameText,'Name');
		this.__form.add(this.__descText,'Describe');
		this.__form.addButton(this.__commitBtn);
		
		this.setLayout(new qx.ui.layout.Canvas());
		this.add(new qx.ui.form.renderer.Single(this.__form));
	}
});


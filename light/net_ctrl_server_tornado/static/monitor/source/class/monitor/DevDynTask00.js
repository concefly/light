
qx.Class.define('monitor.DevDynTask00',
{
	extend: qx.ui.container.Composite,
	
	events:
	{
		changeValue: 'qx.event.type.Data'
	},
	
	properties:
	{
		zaddr: {nullable:true, check:'Integer', event:'changeZaddr'},
		id: {nullable:true, check:'Integer', event:'changeId'}
	},
	
	members:
	{
		__core: null,
		__checkBox: null,
		__commitBtn: null,
		__form: null,
		
		_getLight: function()
		{
			var zaddr = this.getZaddr();
			var id = this.getId();
			var dyns = this.__core.getDevDyn00();
			var light;
			
			for(var i in dyns)
			{
				if(dyns[i].zaddr==zaddr && dyns[i].id==id)
				{
					light = dyns[i].light;
					break;
				}
			}
			
			return light;
		},
		
		_build: function(e)
		{
			var light = this._getLight();

			if(typeof(light)=='boolean')
			{
				this.__checkBox.setValue(light);
			}
		},
		
		_onCommit: function()
		{
			var clight = this.__checkBox.getValue();
			if(clight)
				this.fireDataEvent('changeValue',true);
			else
				this.fireDataEvent('changeValue',false);
		}
	},
	
	construct: function(core)
	{
		this.base(arguments);
		
		this.__core = core;
		
		//~ 初始化组件
		this.__checkBox = new qx.ui.form.CheckBox('选中为开');
		
		this.__commitBtn = new qx.ui.form.Button('提交');
		this.__commitBtn.addListener('execute',this._onCommit,this);
		
		this.__form = new qx.ui.form.Form();
		this.__form.addGroupHeader('不可调光灯具');
		this.__form.add(this.__checkBox,'开关');
		this.__form.addButton(this.__commitBtn);
		
		//~ 
		this.setLayout(new qx.ui.layout.Canvas());
		this.add(new qx.ui.form.renderer.Single(this.__form));
		
		//~ 连接信号
		this.__core.addListener('changeDevDyn00',this._build,this);
		
		this.addListener('changeZaddr',this._build,this);
		this.addListener('changeId',this._build,this);
	}
});


qx.Class.define('monitor.DevDynTask01',
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
		__slider: null,
		__valueText: null,
		__commitBtn: null,
		__form: null,
		
		_getLight: function()
		{
			var zaddr = this.getZaddr();
			var id = this.getId();
			var dyns = this.__core.getDevDyn01();
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
			if(typeof(light)=='number')
			{
				this.__slider.setValue(light);
				this.__valueText.setValue(light.toString());
			}
		},
		
		_onCommit: function()
		{
			var clight = this.__slider.getValue();
			this.fireDataEvent('changeValue',clight);
		},
		
		_onSliderChangeValue: function(e)
		{
			var value = e.getData();
			this.__valueText.setValue(value.toString());
		}
	},
	
	construct: function(core)
	{
		this.base(arguments);
		
		this.__core = core;
		
		//~ 初始化组件
		this.__slider = new qx.ui.form.Slider();
		this.__slider.set({minimum:0, maximum:100, width:200});
		this.__slider.addListener('changeValue',this._onSliderChangeValue,this);
		this.__valueText = new qx.ui.form.TextField();
		this.__valueText.set({readOnly:true});
		this.__commitBtn = new qx.ui.form.Button('提交');
		this.__commitBtn.addListener('execute',this._onCommit,this);
		
		this.__form = new qx.ui.form.Form();
		this.__form.addGroupHeader('可调亮度灯具');
		this.__form.add(new qx.ui.form.TextField('最小值:0 最大值:100').set({readOnly:true}),'说明');
		this.__form.add(this.__slider,'亮度调节器');
		this.__form.add(this.__valueText,'设定值');
		this.__form.addButton(this.__commitBtn);
		
		//~ 
		this.setLayout(new qx.ui.layout.Canvas());
		this.add(new qx.ui.form.renderer.Single(this.__form));
		
		//~ 连接信号
		this.__core.addListener('changeDevDyn01',this._build,this);
		
		this.addListener('changeZaddr',this._build,this);
		this.addListener('changeId',this._build,this);
	}
});


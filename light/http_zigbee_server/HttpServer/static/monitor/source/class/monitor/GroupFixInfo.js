
qx.Class.define('monitor.GroupFixInfo',
{
	extend: qx.ui.groupbox.GroupBox,
	
	properties:
	{
		zaddr: {nullable:true, check:'Integer', event:'changeZaddr'}
	},
	
	members:
	{
		__coreData: null,
		__nameLabel: null,
		__describeLabel: null,
		
		_build: function(e)
		{
			var fixInfo = this.__coreData.getGroupFixInfo();
			var zaddr = this.getZaddr();
			
			this.__nameLabel.setValue('');
			this.__describeLabel.setValue('');
			
			for(var i in fixInfo)
			{
				if(fixInfo[i].zaddr == zaddr)
				{
					this.__nameLabel.setValue(fixInfo[i].name);
					this.__describeLabel.setValue(fixInfo[i].describe);
					break;
				}
			}
		}
	},
	
	construct: function(title,coreData)
	{
		this.base(arguments,title);
		
		//~ 设置数据源
		this.__coreData = coreData;
		
		//~ 连接信号
		this.__coreData.addListener('changeGroupOnline',this._build,this);
		this.__coreData.addListener('changeGroupFixInfo',this._build,this);
		
		this.addListener('changeZaddr',this._build,this);
		
		//~ 设置布局
		this.setLayout(new qx.ui.layout.Grid(2,2));
		
		//~ 初始化组件
		this.__nameLabel = new qx.ui.basic.Label('null').set({rich:true});
		this.__describeLabel = new qx.ui.basic.Label('null').set({rich:true});
		
		//~ 添加组件
		this.add(new qx.ui.basic.Label('<b>Name:</b>').set({rich:true}),{row: 0, column: 0});
		this.add(this.__nameLabel,{row: 0, column: 1});
		
		this.add(new qx.ui.basic.Label('<b>Describe:</b>').set({rich:true}),{row: 1, column: 0});
		this.add(this.__describeLabel,{row: 1, column: 1});
	}
	
});

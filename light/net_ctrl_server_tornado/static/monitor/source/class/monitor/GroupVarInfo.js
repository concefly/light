
qx.Class.define('monitor.GroupVarInfo',
{
	extend: qx.ui.groupbox.GroupBox,
	
	properties:
	{
		zaddr: {nullable:true, check:'Integer', event:'changeZaddr'}
	},
	
	members:
	{
		__core: null,
		
		__form: null,
		__nameText: null,
		__descText: null,
		__commitBtn: null,
		
		_build: function(e)
		{
			var varInfo = this.__core.getGroupVarInfo();
			var zaddr = this.getZaddr();
			
			this.__nameText.setValue('');
			this.__descText.setValue('');
			
			for(var i in varInfo)
			{
				if(varInfo[i].zaddr == zaddr)
				{
					this.__nameText.setValue(varInfo[i].name);
					this.__descText.setValue(varInfo[i].describe);
					break;
				}
			}
		},
		
		_commit: function()
		{
			var name = this.__nameText.getValue();
			var desc = this.__descText.getValue();
			var zaddr = this.getZaddr();
			
			this.__core.remoteUpdate('GroupVarInfo',zaddr,{name:name, describe:desc});
		}
	},
	
	construct: function(title,core)
	{
		this.base(arguments,title);
		
		this.__core = core;
		
		//~ 连接信号
		this.__core.addListener('changeGroupOnline',this._build,this);
		this.__core.addListener('changeGroupVarInfo',this._build,this);
		
		this.addListener('changeZaddr',this._build,this);
		
		//~ 设置布局
		this.setLayout(new qx.ui.layout.Canvas());
		
		//~ 初始化组件
		this.__form = new qx.ui.form.Form();
		this.__nameText = new qx.ui.form.TextField();
		this.__descText = new qx.ui.form.TextArea();
		this.__commitBtn = new qx.ui.form.Button('提交');
		this.__commitBtn.addListener('execute',this._commit,this);
		
		//~ 初始化表单
		this.__form.add(this.__nameText,'Name');
		this.__form.add(this.__descText,'Describe');
		this.__form.addButton(this.__commitBtn);
		
		//~ 生成表单
		this.add(new qx.ui.form.renderer.Single(this.__form));
	}
});

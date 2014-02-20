
qx.Class.define('monitor.DevDynTask',
{
	extend: qx.ui.groupbox.GroupBox,
	
	properties:
	{
		zaddr: {nullable:true, check:'Integer', event:'changeZaddr'},
		id: {nullable:true, check:'Integer', event:'changeId'}
	},
	
	members:
	{
		__core: null,
		
		__dev00: null,
		__dev01: null,
		
		_build: function(e)
		{
			var zaddr = this.getZaddr();
			var id = this.getId();
			var devOnline = this.__core.getDevOnline();
			var mn = null;
			var sn = null;
			
			this.removeAll();
			
			if(id==null)
				return ;
			
			for(var i in devOnline)
			{
				if(devOnline[i].zaddr==zaddr && devOnline[i].id==id)
				{
					mn = devOnline[i].MajorNum;
					sn = devOnline[i].SubNum;
					break;
				}
			}
			
			if(mn==0 && sn==0)
				this.add(this.__dev00);
			else if (mn==0 && sn==1)
				this.add(this.__dev01);
		},
		
		_remoteUpdate00: function(e)
		{
			var value = 0;
			var zaddr = this.getZaddr();
			var id = this.getId();
			if(e.getData())
				value = 1;
			this.__core.remoteUpdate('DevDyn00',zaddr,id,{light:value});
		},
		
		_remoteUpdate01: function(e)
		{
			var value = e.getData();
			var zaddr = this.getZaddr();
			var id = this.getId();
			this.__core.remoteUpdate('DevDyn01',zaddr,id,{light:value});
		}
	},
	
	construct: function(title,core)
	{
		this.base(arguments,title);
		
		this.__core = core;
		this.__core.addListener('changeDevDyn00',this._build,this);
		this.__core.addListener('changeDevDyn01',this._build,this);
		
		this.addListener('changeZaddr',this._build,this);
		this.addListener('changeId',this._build,this);
		
		//~ 初始化任务组件
		this.__dev00 = new monitor.DevDynTask00(this.__core);
		this.bind('zaddr',this.__dev00,'zaddr');
		this.bind('id',this.__dev00,'id');
		this.__dev00.addListener('changeValue',this._remoteUpdate00,this);
		
		this.__dev01 = new monitor.DevDynTask01(this.__core);
		this.bind('zaddr',this.__dev01,'zaddr');
		this.bind('id',this.__dev01,'id');
		this.__dev01.addListener('changeValue',this._remoteUpdate01,this);
		
		//~ 
		this.setLayout(new qx.ui.layout.VBox(3));
	}
});


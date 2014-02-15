
qx.Class.define('monitor.DevDynList',
{
	extend: qx.ui.form.List,
	
	properties:
	{
		zaddr: {nullable:true, check:'Integer', event:'changeZaddr'},
		id: {nullable:true, check:'Integer', event:'changeId'}
	},
	
	members:
	{
		__coreData: null,
		
		_build: function(e)
		{
			var zaddr = this.getZaddr();
			var id = this.getId();
			var devOnline = this.__coreData.getDevOnline();
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
				this._build00();
			else if (mn==0 && sn==1)
				this._build01();
		},
		
		_build00: function()
		{
			var zaddr = this.getZaddr();
			var id = this.getId();
			var dyn00 = this.__coreData.getDevDyn00();
			for(var i in dyn00)
			{
				if(dyn00[i].zaddr==zaddr && dyn00[i].id==id)
				{
					var label = '';
					label += dyn00[i].time+' light:'+dyn00[i].light;
					var thisItem = new qx.ui.form.ListItem(label);
					this.add(thisItem);
				}
			}
		},
		
		_build01: function()
		{
			var zaddr = this.getZaddr();
			var id = this.getId();
			var dyn01 = this.__coreData.getDevDyn01();
			for(var i in dyn01)
			{
				if(dyn01[i].zaddr==zaddr && dyn01[i].id==id)
				{
					var label = '';
					label += dyn01[i].time+' light:'+dyn01[i].light;
					var thisItem = new qx.ui.form.ListItem(label);
					this.add(thisItem);
				}
			}
		}
	},
	
	construct: function(coreData)
	{
		this.base(arguments);
		
		this.__coreData = coreData;
		this.__coreData.addListener('changeDevDyn00',this._build,this);
		this.__coreData.addListener('changeDevDyn01',this._build,this);
		
		this.addListener('changeZaddr',this._build,this);
		this.addListener('changeId',this._build,this);
	}
});

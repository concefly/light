
qx.Class.define('monitor.GroupDevTree',
{
	extend: qx.ui.tree.Tree,
	
	properties:
	{
		zaddr: {nullable:true, check:'Integer', event:'changeZaddr'},
		id: {nullable:true, check:'Integer', event:'changeId'}
	},
	
	members:
	{
		__coreData: null,
		
		setCoreData: function(obj)
		{
			this.__coreData = obj;
			
			this.__coreData.addListener('changeGroupOnline',this._build,this);
			this.__coreData.addListener('changeDevOnline',this._build,this);
		},
		
		_build: function(e)
		{
			var groups = this.__coreData.getGroupOnline();
			var devs = this.__coreData.getDevOnline();
			//~ 构建树
			var root = new qx.ui.tree.TreeFolder('Groups');
			root.setOpen(true);
			
			for(var i in groups)
			{
				var groupLabel = '';
				groupLabel += groups[i].ChipCode+'@'+groups[i].zaddr+' '+groups[i].DevCount+'s '+ groups[i].time;
				
				var thisGroup = new qx.ui.tree.TreeFolder(groupLabel);
				thisGroup.setModel({type:'group', zaddr:groups[i].zaddr});
				
				for(var j in devs)
				{
					if(devs[j].zaddr==groups[i].zaddr)
					{
						var devLabel = '';
						devLabel += devs[j].id+' of '+devs[j].MajorNum+','+devs[j].SubNum;
						
						var thisDev = new qx.ui.tree.TreeFile(devLabel);
						thisDev.setModel({type:'device', zaddr:groups[i].zaddr, id:devs[j].id});
						
						thisGroup.add(thisDev);
					}
				}
				
				root.add(thisGroup);
			}
			
			this.setRoot(root);
		}
	},
	
	construct: function(coreData)
	{
		this.base(arguments,coreData);
		
		this.__coreData = coreData;
		this.__coreData.addListener('changeGroupOnline',this._build,this);
		this.__coreData.addListener('changeDevOnline',this._build,this);
		
		this.addListener('changeSelection',function(e)
		{
			var item = e.getData()[0];
			var type = item.getModel().type;
			var zaddr = item.getModel().zaddr;
			
			this.setZaddr(zaddr);
			if(type=='group')
				this.setId(null);
			else
				this.setId(item.getModel().id);
		},this);
	}
});

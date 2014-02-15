
qx.Class.define('monitor.monitor',
{
	extend: qx.ui.groupbox.GroupBox,
	
	members:
	{
		//~ 监视、控制 组件
		__tree: null,
		__groupFix: null,
		__groupVar: null,
		__devFix: null,
		__devVar: null,
		__devDyn: null,
		__task: null
		
	},
	
	construct: function()
	{
		this.base(arguments);
		
		//~ 初始化组件
		this.__tree = new monitor.GroupDevTree();
		this.__tree.set({width:300});
		this.__groupFix = new monitor.GroupFixInfoText();
		this.__groupVar = new monitor.GroupVarInfoArea();
		this.__devFix = new monitor.DevFixInfoText();
		this.__devVar = new monitor.DevVarInfoArea();
		this.__devDyn = new monitor.DevDynList();
		this.__devDyn.set({width:400, height:300});
		this.__task = new monitor.TaskArea();
		this.debug('Creating element done');
		
		//~ 初始化布局
		//~ 控制群 固定、可变 信息
		var gGroup = new qx.ui.groupbox.GroupBox('Group Info');
		gGroup.setLayout(new qx.ui.layout.HBox(5));
		gGroup.add(this.__groupFix);
		gGroup.add(this.__groupVar);
		this.debug('Creating gGroup done');
		
		//~ 设备 固定、可变 信息
		var dGroup = new qx.ui.groupbox.GroupBox('Device Info');
		dGroup.setLayout(new qx.ui.layout.HBox(5));
		dGroup.add(this.__devFix);
		dGroup.add(this.__devVar);
		this.debug('Creating dGroup done');
		
		//~ 群信息组 + 设备信息组
		var gdGroup = new qx.ui.groupbox.GroupBox('Information');
		gdGroup.setLayout(new qx.ui.layout.VBox(5));
		gdGroup.add(gGroup);
		gdGroup.add(dGroup);
		this.debug('Creating gdGroup done');
		
		//~ 动态信息组 + 任务组
		var dtGroup = new qx.ui.groupbox.GroupBox('Dynamic and task');
		dtGroup.setLayout(new qx.ui.layout.VBox(5));
		dtGroup.add(this.__devDyn);
		dtGroup.add(this.__task);
		this.debug('Creating dtGroup done');
		
		this.setLayout(new qx.ui.layout.HBox(5));
		this.add(this.__tree);
		this.add(gdGroup);
		this.add(dtGroup);
		this.debug('Creating self done');
		
		//~ 初始化动作
		this.__tree.update();
		
		//~ 连接信号
		this.__tree.addListener('changeSelection',function(e)
		{
			var dat = e.getData()[0].getModel();
			if(dat.getType()=='group')
			{
				var zaddr = dat.getZaddr();
				this.__groupFix.update(zaddr);
				this.__groupVar.update(zaddr);
				this.__devFix.clear();
				this.__devVar.clear();
				this.__devDyn.clear();
			}
			else
			{
				var zaddr = dat.getZaddr();
				var id = dat.getId();
				this.__groupFix.update(zaddr);
				this.__groupVar.update(zaddr);
				this.__devFix.update(zaddr,id);
				this.__devVar.update(zaddr,id);
				this.__devDyn.update(zaddr,id,50);
			}
		},this);
				
	}
});

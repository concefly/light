
qx.Class.define('monitor.monitor',
{
	extend: qx.ui.container.Composite,
	
	properties:
	{
		zaddr: {nullable:true, check:'Integer', event:'changeZaddr'},
		id: {nullable:true, check:'Integer', event:'changeId'}
	},
	
	members:
	{
		__coreData: null,
		__tree: null,
		__groupFix: null,
		__groupVar: null,
		__devFix: null,
		__devVar: null,
		__devDyn: null,
		__devTask: null
	},
	
	construct: function()
	{
		this.base(arguments);
		
		//~ 设置布局
		this.setLayout(new qx.ui.layout.HBox(5));
		
		//~ 初始化组件
		this.__coreData = new monitor.CoreData();
		this.__coreData.updateAll();
		this.__coreData.startLongPulling();
		
		this.__tree = new monitor.GroupDevTree(this.__coreData);
		this.__tree.setWidth(300);
		this.__tree.setHeight(500);
		this.__tree.bind('zaddr',this,'zaddr');
		this.__tree.bind('id',this,'id');
		
		this.__groupFix = new monitor.GroupFixInfo('控制群 固定信息',this.__coreData);
		this.bind('zaddr',this.__groupFix,'zaddr');
		
		this.__groupVar = new monitor.GroupVarInfo('控制群 自定义信息',this.__coreData);
		this.bind('zaddr',this.__groupVar,'zaddr');
		
		this.__devFix = new monitor.DevFixInfo('设备 固定信息',this.__coreData);
		this.bind('zaddr',this.__devFix,'zaddr');
		this.bind('id',this.__devFix,'id');
		
		this.__devVar = new monitor.DevVarInfo('设备 自定义信息',this.__coreData);
		this.bind('zaddr',this.__devVar,'zaddr');
		this.bind('id',this.__devVar,'id');
		
		this.__devDyn = new monitor.DevDynList(this.__coreData);
		this.__devDyn.setWidth(400);
		this.bind('zaddr',this.__devDyn,'zaddr');
		this.bind('id',this.__devDyn,'id');
		
		this.__devTask = new monitor.DevDynTask('任务栏',this.__coreData);
		this.bind('zaddr',this.__devTask,'zaddr');
		this.bind('id',this.__devTask,'id');
		
		this.debug('初始化组件 done');
		
		//~ 初始化 tree 组
		var treeGroup = new qx.ui.groupbox.GroupBox('设备树');
		treeGroup.setLayout(new qx.ui.layout.VBox(2));
		treeGroup.add(this.__tree);
		
		this.debug('初始化 tree 组 done');
		
		//~ 初始化 info 组
		var infoGroup = new qx.ui.groupbox.GroupBox('控制群与设备信息');
		infoGroup.setLayout(new qx.ui.layout.Grid(2,2));
		infoGroup.add(this.__groupFix, {row:0, column:0});
		infoGroup.add(this.__groupVar, {row:0, column:1});
		infoGroup.add(this.__devFix, {row:1, column:0});
		infoGroup.add(this.__devVar, {row:1, column:1});
		this.debug('初始化 info 组 done');
		
		//~ 初始化 dyn,task 组
		var dtGroup = new qx.ui.groupbox.GroupBox('设备动态与任务');
		dtGroup.setLayout(new qx.ui.layout.VBox(2));
		dtGroup.add(this.__devDyn);
		dtGroup.add(this.__devTask);
		this.debug('初始化 dyn,task 组 done');
		
		//~ 添加组件
		this.add(treeGroup);
		this.add(infoGroup);
		this.add(dtGroup);
		this.debug('添加组件 done');
	}
});

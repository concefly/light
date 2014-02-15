
qx.Class.define('monitor.CoreData',
{
	extend: qx.core.Object,
	
	properties:
	{
		groupOnline: {init:[], event:'changeGroupOnline'},
		groupFixInfo: {init:[], event:'changeGroupFixInfo'},
		groupVarInfo: {init:[], event:'changeGroupVarInfo'},
		whiteList: {init:[], event:'changeWhiteList'},
		
		devOnline: {init:[], event:'changeDevOnline'},
		devFixInfo: {init:[], event:'changeDevFixInfo'},
		devVarInfo: {init:[], event:'changeDevVarInfo'},
		
		devDyn00: {init:[], event:'changeDevDyn00'},
		devDyn01: {init:[], event:'changeDevDyn01'}
	},
	
	members:
	{
		__storeGroOnl: null,
		__storeGroFixInf: null,
		__storeGroVarInf: null,
		__storeWhiLis: null,
		
		__storeDevOnl: null,
		__storeDevFixInf: null,
		__storeDevVarInf: null,
		
		__storeDevDyn00: null,
		__storeDevDyn01: null,
		
		//~ 更新数据库映射
		update: function(dbName)
		{
			if(dbName=='GroupOnline')
				this.__storeGroOnl.send();
			else if(dbName=='GroupVarInfo')
			{
				this.__storeGroVarInf.send();
			}
			else if(dbName=='GroupFixInfo')
			{
				this.__storeGroFixInf.send();
			}
			
			else if(dbName=='DevOnline')
				this.__storeDevOnl.send();
			else if(dbName=='DevFixInfo')
			{
				this.__storeDevFixInf.send();
			}
			else if(dbName=='DevVarInfo')
			{
				this.__storeDevVarInf.send();
			}
			else if(dbName=='DevDyn00')
			{
				this.__storeDevDyn00.setRequestData({limit:100});
				this.__storeDevDyn00.send();
			}
			else if(dbName=='DevDyn01')
			{
				this.__storeDevDyn01.setRequestData({limit:100});
				this.__storeDevDyn01.send();
			}
		},
		
		updateAll: function()
		{
			this.update('GroupOnline');
			this.update('GroupFixInfo');
			this.update('GroupVarInfo');
			this.update('DevOnline');
			this.update('DevFixInfo');
			this.update('DevVarInfo');
			this.update('DevDyn00');
			this.update('DevDyn01');
		},
		
		remoteUpdate: function()
		{
			var dbName = arguments[0];
			
			if(dbName=='GroupVarInfo')
			{
				//~ 'GroupVarInfo', zaddr, datDict
				var req = {};
				req.zaddr = arguments[1];
				for(var k in arguments[2])
				{
					req[k] = arguments[2][k];
				}
				this.__storeGroVarInf.setRequestData(req);
				this.__storeGroVarInf.send();
			}
			else if(dbName=='DevVarInfo')
			{
				//~ 'DevVarInfo', zaddr, id, datDict
				var req = {};
				req.zaddr = arguments[1];
				req.id = arguments[2];
				for(var k in arguments[3])
				{
					req[k] = arguments[3][k];
				}
				this.__storeDevVarInf.setRequestData(req);
				this.__storeDevVarInf.send();
			}
			else if(dbName=='DevDyn00')
			{
				//~ 'DevDyn00', zaddr, id, datDict
				var req = {};
				req.zaddr = arguments[1];
				req.id = arguments[2];
				req.limit = 100;
				for(var k in arguments[3])
				{
					req[k] = arguments[3][k];
				}
				this.__storeDevDyn00.setRequestData(req);
				this.__storeDevDyn00.send();
			}
			else if(dbName=='DevDyn01')
			{
				//~ 'DevDyn01', zaddr, id, datDict
				var req = {};
				req.zaddr = arguments[1];
				req.id = arguments[2];
				req.limit = 100;
				for(var k in arguments[3])
				{
					req[k] = arguments[3][k];
				}
				this.__storeDevDyn01.setRequestData(req);
				this.__storeDevDyn01.send();
			}
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		
		//~ 初始化 store
		this.__storeGroOnl = new qx.io.request.Xhr('/api/group_online','post');
		this.__storeGroFixInf = new qx.io.request.Xhr('/api/group_fix_info','post');
		this.__storeGroVarInf = new qx.io.request.Xhr('/api/group_var_info','post');
		this.__storeWhiLis = new qx.io.request.Xhr('/api/white_list','post');
		
		this.__storeDevOnl = new qx.io.request.Xhr('/api/dev_online','post');
		this.__storeDevFixInf = new qx.io.request.Xhr('/api/dev_fix_info','post');
		this.__storeDevVarInf = new qx.io.request.Xhr('/api/dev_var_info','post');
		
		this.__storeDevDyn00 = new qx.io.request.Xhr('/api/dev_dyn00','post');
		this.__storeDevDyn01 = new qx.io.request.Xhr('/api/dev_dyn01','post');
		
		//~ 绑定 store 信号
		this.__storeGroOnl.addListener('success',function(e){this.set('groupOnline',eval('('+e.getTarget().getResponse()+')'));},this);
		this.__storeGroFixInf.addListener('success',function(e){this.set('groupFixInfo',eval('('+e.getTarget().getResponse()+')'));},this);
		this.__storeGroVarInf.addListener('success',function(e){this.set('groupVarInfo',eval('('+e.getTarget().getResponse()+')'));},this);
		this.__storeWhiLis.addListener('success',function(e){this.set('whiteList',eval('('+e.getTarget().getResponse()+')'));},this);
		
		this.__storeDevOnl.addListener('success',function(e){this.set('devOnline',eval('('+e.getTarget().getResponse()+')'));},this);
		this.__storeDevFixInf.addListener('success',function(e){this.set('devFixInfo',eval('('+e.getTarget().getResponse()+')'));},this);
		this.__storeDevVarInf.addListener('success',function(e){this.set('devVarInfo',eval('('+e.getTarget().getResponse()+')'));},this);
		
		this.__storeDevDyn00.addListener('success',function(e){this.set('devDyn00',eval('('+e.getTarget().getResponse()+')'));},this);
		this.__storeDevDyn01.addListener('success',function(e){this.set('devDyn01',eval('('+e.getTarget().getResponse()+')'));},this);
	}
});


qx.Class.define("monitor.GroupDevTree",
{
	extend: qx.ui.tree.Tree,
	
	statics:
	{
		path: '/api/group_dev_tree'
	},
	
	properties:
	{
		model: {nullable:true, event:'changeModel'}
	},
	
	members:
	{
		__json: null,
		__ctrl: null,
		
		update: function()
		{
			if(this.__json==null)
			{
				this.__json = new qx.data.store.Json();
				this.__json.bind('model',this.__ctrl,'model');
				this.__json.addListener('loaded',this._onLoaded,this);
				this.__json.setUrl(this.self(arguments).path);
			}
			else
				this.__json.reload();
		},
		
		_onLoaded: function(e)
		{
			var res = e.getData();
			
			this.setModel( res );
			this.getRoot().setOpen(true);
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		this.__ctrl = new qx.data.controller.Tree(null,this,'kids','label');
	}
});

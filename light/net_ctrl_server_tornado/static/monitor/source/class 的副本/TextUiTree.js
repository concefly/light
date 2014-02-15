
qx.Class.define("monitor.TextUiTree",
{
	extend: qx.ui.tree.Tree,
	construct: function()
	{
		this.base(arguments);
		
		//~ var root = new qx.ui.tree.TreeFolder('root');
		//~ root.setOpen(true);
		//~ 
		//~ var A= new qx.ui.tree.TreeFolder('A');
		//~ var a0 = new qx.ui.tree.TreeFile('a0');
		//~ A.add(a0);
		//~ 
		//~ root.add(A);
		//~ this.setRoot(root);
		var dat = 
		{
			label:'root',
			kids:[
			{
				label:'group',
				kids:[
				{
					label:'device'
				}]
			}]
		};
		var ctrl = new qx.data.controller.Tree(qx.data.marshal.Json.createModel(dat),this,'kids','label');
		
	}
});

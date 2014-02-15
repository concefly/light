
qx.Class.define('monitor.Dev00Task',
{
	extend: qx.ui.groupbox.GroupBox,
	
	events:
	{
		changeValue: 'qx.event.type.Data'
	},
	
	members:
	{
		__switchOn: null,
		__switchOff: null,
		
		__radioManager: null,
		
		_onChangeSelection: function(e)
		{
			var label = e.getData().getLabel();
			var dat = {};
			
			if(label=='On')
				dat.light = 1;
			else
				dat.light = 0;
			
			this.fireDataEvent('changeValue',dat);
		}
	},
	
	construct: function()
	{
		this.base(arguments);
		
		//~ 设置布局
		this.setLayout(new qx.ui.layout.VBox());
		
		this.__switchOn = new qx.ui.form.RadioButton('On');
		this.__switchOff = new qx.ui.form.RadioButton('Off');
		
		this.add(this.__switchOn);
		this.add(this.__switchOff);
		
		//~ 设置 manager
		this.__radioManager = new qx.ui.form.RadioGroup(this.__switchOn, this.__switchOff);
		this.__radioManager.addListener('changeSelection',this._onChangeSelection,this);
	}
});

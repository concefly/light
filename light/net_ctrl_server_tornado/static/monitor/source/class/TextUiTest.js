
qx.Class.define("monitor.TextUiTest",
{
	extend: qx.ui.form.TextArea,
	construct: function()
	{
		this.base(arguments);
		this.setValue("This is a text area");
	}
});

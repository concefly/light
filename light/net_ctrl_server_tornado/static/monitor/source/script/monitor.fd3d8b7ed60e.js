/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This interface defines the necessary features a form renderer should have.
 * Keep in mind that all renderes has to be widgets.
 */
qx.Interface.define("qx.ui.form.renderer.IFormRenderer",
{
  members :
  {
    /**
     * Add a group of form items with the corresponding names. The names should
     * be displayed as hint for the user what to do with the form item.
     * The title is optional and can be used as grouping for the given form
     * items.
     *
     * @param items {qx.ui.core.Widget[]} An array of form items to render.
     * @param names {String[]} An array of names for the form items.
     * @param title {String?} A title of the group you are adding.
     * @param itemsOptions {Array?null} The added additional data.
     * @param headerOptions {Map?null} The options map as defined by the form
     *   for the current group header.
     */
    addItems : function(items, names, title, itemsOptions, headerOptions) {},


    /**
     * Adds a button the form renderer.
     *
     * @param button {qx.ui.form.Button} A button which should be added to
     *   the form.
     * @param options {Map?null} The added additional data.
     */
    addButton : function(button, options) {}

  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Abstract renderer for {@link qx.ui.form.Form}. This abstract renderer should
 * be the superclass of all form renderer. It takes the form, which is
 * supplied as constructor parameter and configures itself. So if you need to
 * set some additional information on your renderer before adding the widgets,
 * be sure to do that before calling this.base(arguments, form).
 */
qx.Class.define("qx.ui.form.renderer.AbstractRenderer",
{
  type : "abstract",
  extend : qx.ui.core.Widget,
  implement : qx.ui.form.renderer.IFormRenderer,

  /**
   * @param form {qx.ui.form.Form} The form to render.
   */
  construct : function(form)
  {
    this.base(arguments);

    this._visibilityBindingIds = [];
    this._labels = [];

    // translation support
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener(
        "changeLocale", this._onChangeLocale, this
      );
      this._names = [];
    }

    // add the groups
    var groups = form.getGroups();
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i];
      this.addItems(
        group.items, group.labels, group.title, group.options, group.headerOptions
      );
    }

    // add the buttons
    var buttons = form.getButtons();
    var buttonOptions = form.getButtonOptions();
    for (var i = 0; i < buttons.length; i++) {
      this.addButton(buttons[i], buttonOptions[i]);
    }
  },


  members :
  {
    _names : null,
    _visibilityBindingIds : null,
    _labels : null,


    /**
     * Helper to bind the item's visibility to the label's visibility.
     * @param item {qx.ui.core.Widget} The form element.
     * @param label {qx.ui.basic.Label} The label for the form element.
     */
    _connectVisibility : function(item, label) {
      // map the items visibility to the label
      var id = item.bind("visibility", label, "visibility");
      this._visibilityBindingIds.push({id: id, item: item});
    },


    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    _onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e) {
        for (var i = 0; i < this._names.length; i++) {
          var entry = this._names[i];
          if (entry.name && entry.name.translate) {
            entry.name = entry.name.translate();
          }
          var newText = this._createLabelText(entry.name, entry.item);
          entry.label.setValue(newText);
        };
      },

      "false" : null
    }),


    /**
     * Creates the label text for the given form item.
     *
     * @param name {String} The content of the label without the
     *   trailing * and :
     * @param item {qx.ui.form.IForm} The item, which has the required state.
     * @return {String} The text for the given item.
     */
    _createLabelText : function(name, item)
    {
      var required = "";
      if (item.getRequired()) {
       required = " <span style='color:red'>*</span> ";
      }

      // Create the label. Append a colon only if there's text to display.
      var colon = name.length > 0 || item.getRequired() ? " :" : "";
      return name + required + colon;
    },


    // interface implementation
    addItems : function(items, names, title) {
      throw new Error("Abstract method call");
    },


    // interface implementation
    addButton : function(button) {
      throw new Error("Abstract method call");
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().removeListener("changeLocale", this._onChangeLocale, this);
    }
    this._names = null;

    // remove all created lables
    for (var i=0; i < this._labels.length; i++) {
      this._labels[i].dispose();
    };

    // remove the visibility bindings
    for (var i = 0; i < this._visibilityBindingIds.length; i++) {
      var entry = this._visibilityBindingIds[i];
      entry.item.removeBinding(entry.id);
    };
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Single column renderer for {@link qx.ui.form.Form}.
 */
qx.Class.define("qx.ui.form.renderer.Single",
{
  extend : qx.ui.form.renderer.AbstractRenderer,


  construct : function(form)
  {
    var layout = new qx.ui.layout.Grid();
    layout.setSpacing(6);
    layout.setColumnFlex(0, 1);
    layout.setColumnAlign(0, "right", "top");
    this._setLayout(layout);

    this.base(arguments, form);
  },


  members :
  {
    _row : 0,
    _buttonRow : null,


    /**
     * Add a group of form items with the corresponding names. The names are
     * displayed as label.
     * The title is optional and is used as grouping for the given form
     * items.
     *
     * @param items {qx.ui.core.Widget[]} An array of form items to render.
     * @param names {String[]} An array of names for the form items.
     * @param title {String?} A title of the group you are adding.
     */
    addItems : function(items, names, title) {
      // add the header
      if (title != null) {
        this._add(
          this._createHeader(title), {row: this._row, column: 0, colSpan: 2}
        );
        this._row++;
      }

      // add the items
      for (var i = 0; i < items.length; i++) {
        var label = this._createLabel(names[i], items[i]);
        this._add(label, {row: this._row, column: 0});
        var item = items[i];
        label.setBuddy(item);
        this._add(item, {row: this._row, column: 1});
        this._row++;

        this._connectVisibility(item, label);

        // store the names for translation
        if (qx.core.Environment.get("qx.dynlocale")) {
          this._names.push({name: names[i], label: label, item: items[i]});
        }
      }
    },


    /**
     * Adds a button the form renderer. All buttons will be added in a
     * single row at the bottom of the form.
     *
     * @param button {qx.ui.form.Button} The button to add.
     */
    addButton : function(button) {
      if (this._buttonRow == null) {
        // create button row
        this._buttonRow = new qx.ui.container.Composite();
        this._buttonRow.setMarginTop(5);
        var hbox = new qx.ui.layout.HBox();
        hbox.setAlignX("right");
        hbox.setSpacing(5);
        this._buttonRow.setLayout(hbox);
        // add the button row
        this._add(this._buttonRow, {row: this._row, column: 0, colSpan: 2});
        // increase the row
        this._row++;
      }

      // add the button
      this._buttonRow.add(button);
    },


    /**
     * Returns the set layout for configuration.
     *
     * @return {qx.ui.layout.Grid} The grid layout of the widget.
     */
    getLayout : function() {
      return this._getLayout();
    },


    /**
     * Creates a label for the given form item.
     *
     * @param name {String} The content of the label without the
     *   trailing * and :
     * @param item {qx.ui.core.Widget} The item, which has the required state.
     * @return {qx.ui.basic.Label} The label for the given item.
     */
    _createLabel : function(name, item) {
      var label = new qx.ui.basic.Label(this._createLabelText(name, item));
      // store lables for disposal
      this._labels.push(label);
      label.setRich(true);
      label.setAppearance("form-renderer-label");
      return label;
    },


    /**
     * Creates a header label for the form groups.
     *
     * @param title {String} Creates a header label.
     * @return {qx.ui.basic.Label} The header for the form groups.
     */
    _createHeader : function(title) {
      var header = new qx.ui.basic.Label(title);
      // store lables for disposal
      this._labels.push(header);
      header.setFont("bold");
      if (this._row != 0) {
        header.setMarginTop(10);
      }
      header.setAlignX("left");
      return header;
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    // first, remove all buttons from the button row because they
    // should not be disposed
    if (this._buttonRow) {
      this._buttonRow.removeAll();
      this._disposeObjects("_buttonRow");
    }
  }
});

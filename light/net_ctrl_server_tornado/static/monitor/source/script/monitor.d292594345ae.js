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
 * The form object is responsible for managing form items. For that, it takes
 * advantage of two existing qooxdoo classes.
 * The {@link qx.ui.form.Resetter} is used for resetting and the
 * {@link qx.ui.form.validation.Manager} is used for all validation purposes.
 *
 * The view code can be found in the used renderer ({@link qx.ui.form.renderer}).
 */
qx.Class.define("qx.ui.form.Form",
{
  extend : qx.core.Object,


  construct : function()
  {
    this.base(arguments);

    this.__groups = [];
    this._buttons = [];
    this._buttonOptions = [];
    this._validationManager = new qx.ui.form.validation.Manager();
    this._resetter = this._createResetter();
  },


  members :
  {
    __groups : null,
    _validationManager : null,
    _groupCounter : 0,
    _buttons : null,
    _buttonOptions : null,
    _resetter : null,

    /*
    ---------------------------------------------------------------------------
       ADD
    ---------------------------------------------------------------------------
    */

    /**
     * Adds a form item to the form including its internal
     * {@link qx.ui.form.validation.Manager} and {@link qx.ui.form.Resetter}.
     *
     * *Hint:* The order of all add calls represent the order in the layout.
     *
     * @param item {qx.ui.form.IForm} A supported form item.
     * @param label {String} The string, which should be used as label.
     * @param validator {Function | qx.ui.form.validation.AsyncValidator ? null}
     *   The validator which is used by the validation
     *   {@link qx.ui.form.validation.Manager}.
     * @param name {String?null} The name which is used by the data binding
     *   controller {@link qx.data.controller.Form}.
     * @param validatorContext {var?null} The context of the validator.
     * @param options {Map?null} An additional map containin custom data which
     *   will be available in your form renderer specific to the added item.
     */
    add : function(item, label, validator, name, validatorContext, options) {
      if (this.__isFirstAdd()) {
        this.__groups.push({
          title: null, items: [], labels: [], names: [],
          options: [], headerOptions: {}
        });
      }
      // save the given arguments
      this.__groups[this._groupCounter].items.push(item);
      this.__groups[this._groupCounter].labels.push(label);
      this.__groups[this._groupCounter].options.push(options);
      // if no name is given, use the label without not working character
      if (name == null) {
        name = label.replace(
          /\s+|&|-|\+|\*|\/|\||!|\.|,|:|\?|;|~|%|\{|\}|\(|\)|\[|\]|<|>|=|\^|@|\\/g, ""
        );
      }
      this.__groups[this._groupCounter].names.push(name);

      // add the item to the validation manager
      this._validationManager.add(item, validator, validatorContext);
      // add the item to the reset manager
      this._resetter.add(item);
    },


    /**
     * Adds a group header to the form.
     *
     * *Hint:* The order of all add calls represent the order in the layout.
     *
     * @param title {String} The title of the group header.
     * @param options {Map?null} A special set of custom data which will be
     *   given to the renderer.
     */
    addGroupHeader : function(title, options) {
      if (!this.__isFirstAdd()) {
        this._groupCounter++;
      }
      this.__groups.push({
        title: title, items: [], labels: [], names: [],
        options: [], headerOptions: options
      });
    },


    /**
     * Adds a button to the form.
     *
     * *Hint:* The order of all add calls represent the order in the layout.
     *
     * @param button {qx.ui.form.Button} The button to add.
     * @param options {Map?null} An additional map containin custom data which
     *   will be available in your form renderer specific to the added button.
     */
    addButton : function(button, options) {
      this._buttons.push(button);
      this._buttonOptions.push(options || null);
    },


    /**
     * Returns whether something has already been added.
     *
     * @return {Boolean} true, if nothing has been added jet.
     */
    __isFirstAdd : function() {
      return this.__groups.length === 0;
    },


    /*
    ---------------------------------------------------------------------------
       RESET SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Resets the form. This means reseting all form items and the validation.
     */
    reset : function() {
      this._resetter.reset();
      this._validationManager.reset();
    },


    /**
     * Redefines the values used for resetting. It calls
     * {@link qx.ui.form.Resetter#redefine} to get that.
     */
    redefineResetter : function() {
      this._resetter.redefine();
    },


    /**
     * Redefines the value used for resetting of the given item. It calls
     * {@link qx.ui.form.Resetter#redefineItem} to get that.
     *
     * @param item {qx.ui.core.Widget} The item to redefine.
     */
    redefineResetterItem : function(item) {
      this._resetter.redefineItem(item);
    },



    /*
    ---------------------------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------------------------
    */

    /**
     * Validates the form using the
     * {@link qx.ui.form.validation.Manager#validate} method.
     *
     * @return {Boolean | null} The validation result.
     */
    validate : function() {
      return this._validationManager.validate();
    },


    /**
     * Returns the internally used validation manager. If you want to do some
     * enhanced validation tasks, you need to use the validation manager.
     *
     * @return {qx.ui.form.validation.Manager} The used manager.
     */
    getValidationManager : function() {
      return this._validationManager;
    },


    /*
    ---------------------------------------------------------------------------
       RENDERER SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Accessor method for the renderer which returns all added items in a
     * array containing a map of all items:
     * {title: title, items: [], labels: [], names: []}
     *
     * @return {Array} An array containing all necessary data for the renderer.
     * @internal
     */
    getGroups : function() {
      return this.__groups;
    },


    /**
     * Accessor method for the renderer which returns all added buttons in an
     * array.
     * @return {Array} An array containing all added buttons.
     * @internal
     */
    getButtons : function() {
      return this._buttons;
    },


    /**
     * Accessor method for the renderer which returns all added options for
     * the buttons in an array.
     * @return {Array} An array containing all added options for the buttons.
     * @internal
     */
    getButtonOptions : function() {
      return this._buttonOptions;
    },



    /*
    ---------------------------------------------------------------------------
       INTERNAL
    ---------------------------------------------------------------------------
    */

    /**
     * Returns all added items as a map.
     *
     * @return {Map} A map containing for every item an entry with its name.
     *
     * @internal
     */
    getItems : function() {
      var items = {};
      // go threw all groups
      for (var i = 0; i < this.__groups.length; i++) {
        var group = this.__groups[i];
        // get all items
        for (var j = 0; j < group.names.length; j++) {
          var name = group.names[j];
          items[name] = group.items[j];
        }
      }
      return items;
    },


    /**
     * Creates and returns the used resetter class.
     *
     * @return {qx.ui.form.Resetter} the resetter class.
     *
     * @internal
     */
    _createResetter : function() {
      return new qx.ui.form.Resetter();
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    // holding references to widgets --> must set to null
    this.__groups = this._buttons = this._buttonOptions = null;
    this._validationManager.dispose();
    this._resetter.dispose();
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
 * The resetter is responsible for managing a set of items and resetting these
 * items on a {@link #reset} call. It can handle all form items supplying a
 * value property and all widgets implementing the single selection linked list
 * or select box.
 */
qx.Class.define("qx.ui.form.Resetter",
{
  extend : qx.core.Object,


  construct : function()
  {
    this.base(arguments);

    this.__items = [];
  },

  members :
  {
    __items : null,

    /**
     * Adding a widget to the reseter will get its current value and store
     * it for resetting. To access the value, the given item needs to specify
     * a value property or implement the {@link qx.ui.core.ISingleSelection}
     * interface.
     *
     * @param item {qx.ui.core.Widget} The widget which should be added.
     */
    add : function(item) {
      // check the init values
      if (this._supportsValue(item)) {
        var init = item.getValue();
      } else if (this.__supportsSingleSelection(item)) {
        var init = item.getSelection();
      } else if (this.__supportsDataBindingSelection(item)) {
        var init = item.getSelection().concat();
      } else {
        throw new Error("Item " + item + " not supported for reseting.");
      }
      // store the item and its init value
      this.__items.push({item: item, init: init});
    },


    /**
     * Resets all added form items to their initial value. The initial value
     * is the value in the widget during the {@link #add}.
     */
    reset: function() {
      // reset all form items
      for (var i = 0; i < this.__items.length; i++) {
        var dataEntry = this.__items[i];
        // set the init value
        this.__setItem(dataEntry.item, dataEntry.init);
      }
    },


    /**
     * Resets a single given item. The item has to be added to the resetter
     * instance before. Otherwise, an error is thrown.
     *
     * @param item {qx.ui.core.Widget} The widget, which should be resetted.
     */
    resetItem : function(item)
    {
      // get the init value
      var init;
      for (var i = 0; i < this.__items.length; i++) {
        var dataEntry = this.__items[i];
        if (dataEntry.item === item) {
          init = dataEntry.init;
          break;
        }
      };

      // check for the available init value
      if (init === undefined) {
        throw new Error("The given item has not been added.");
      }

      this.__setItem(item, init);
    },


    /**
     * Internal helper for setting an item to a given init value. It checks
     * for the supported APIs and uses the fitting API.
     *
     * @param item {qx.ui.core.Widget} The item to reset.
     * @param init {var} The value to set.
     */
    __setItem : function(item, init)
    {
      // set the init value
      if (this._supportsValue(item)) {
        item.setValue(init);
      } else if (
        this.__supportsSingleSelection(item) ||
        this.__supportsDataBindingSelection(item)
      ) {
        item.setSelection(init);
      }
    },


    /**
     * Takes the current values of all added items and uses these values as
     * init values for resetting.
     */
    redefine: function() {
      // go threw all added items
      for (var i = 0; i < this.__items.length; i++) {
        var item = this.__items[i].item;
        // set the new init value for the item
        this.__items[i].init = this.__getCurrentValue(item);
      }
    },


    /**
     * Takes the current value of the given item and stores this value as init
     * value for resetting.
     *
     * @param item {qx.ui.core.Widget} The item to redefine.
     */
    redefineItem : function(item)
    {
      // get the data entry
      var dataEntry;
      for (var i = 0; i < this.__items.length; i++) {
        if (this.__items[i].item === item) {
          dataEntry = this.__items[i];
          break;
        }
      };

      // check for the available init value
      if (dataEntry === undefined) {
        throw new Error("The given item has not been added.");
      }

      // set the new init value for the item
      dataEntry.init = this.__getCurrentValue(dataEntry.item);
    },


    /**
     * Internal helper top access the value of a given item.
     *
     * @param item {qx.ui.core.Widget} The item to access.
     * @return {var} The item's value
     */
    __getCurrentValue : function(item)
    {
      if (this._supportsValue(item)) {
        return item.getValue();
      } else if (
        this.__supportsSingleSelection(item) ||
        this.__supportsDataBindingSelection(item)
      ) {
        return item.getSelection();
      }
    },


    /**
     * Returns true, if the given item implements the
     * {@link qx.ui.core.ISingleSelection} interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsSingleSelection : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection);
    },


    /**
     * Returns true, if the given item implements the
     * {@link qx.data.controller.ISelection} interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsDataBindingSelection : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.data.controller.ISelection);
    },


    /**
     * Returns true, if the value property is supplied by the form item.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    _supportsValue : function(formItem) {
      var clazz = formItem.constructor;
      return (
        qx.Class.hasInterface(clazz, qx.ui.form.IBooleanForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.IColorForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.IDateForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.INumberForm) ||
        qx.Class.hasInterface(clazz, qx.ui.form.IStringForm)
      );
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    // holding references to widgets --> must set to null
    this.__items = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have boolean as their primary
 * data type like a checkbox.
 */
qx.Interface.define("qx.ui.form.IBooleanForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Boolean|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Boolean|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have boolean as their primary
 * data type like a colorchooser.
 */
qx.Interface.define("qx.ui.form.IColorForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Color|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Color|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have date as their primary
 * data type like datechooser's.
 */
qx.Interface.define("qx.ui.form.IDateForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Date|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Date|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This mixin redirects all children handling methods to a child widget of the
 * including class. This is e.g. used in {@link qx.ui.window.Window} to add
 * child widgets directly to the window pane.
 *
 * The including class must implement the method <code>getChildrenContainer</code>,
 * which has to return the widget, to which the child widgets should be added.
 */
qx.Mixin.define("qx.ui.core.MRemoteChildrenHandling",
{
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Forward the call with the given function name to the children container
     *
     * @param functionName {String} name of the method to forward
     * @param a1 {var} first argument of the method to call
     * @param a2 {var} second argument of the method to call
     * @param a3 {var} third argument of the method to call
     * @return {var} The return value of the forward method
     */
    __forward : function(functionName, a1, a2, a3)
    {
      var container = this.getChildrenContainer();
      if (container === this) {
        functionName = "_" + functionName;
      }
      return (container[functionName])(a1, a2, a3);
    },


    /**
     * Returns the children list
     *
     * @return {LayoutItem[]} The children array (Arrays are
     *   reference types, please do not modify them in-place)
     */
    getChildren : function() {
      return this.__forward("getChildren");
    },


    /**
     * Whether the widget contains children.
     *
     * @return {Boolean} Returns <code>true</code> when the widget has children.
     */
    hasChildren : function() {
      return this.__forward("hasChildren");
    },


    /**
     * Adds a new child widget.
     *
     * The supported keys of the layout options map depend on the layout manager
     * used to position the widget. The options are documented in the class
     * documentation of each layout manager {@link qx.ui.layout}.
     *
     * @param child {LayoutItem} the item to add.
     * @param options {Map?null} Optional layout data for item.
     * @return {Widget} This object (for chaining support)
     */
    add : function(child, options) {
      return this.__forward("add", child, options);
    },


    /**
     * Remove the given child item.
     *
     * @param child {LayoutItem} the item to remove
     * @return {Widget} This object (for chaining support)
     */
    remove : function(child) {
      return this.__forward("remove", child);
    },


    /**
     * Remove all children.
     * @return {Array} An array containing the removed children.
     */
    removeAll : function() {
      return this.__forward("removeAll");
    },


    /**
     * Returns the index position of the given item if it is
     * a child item. Otherwise it returns <code>-1</code>.
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param child {LayoutItem} the item to query for
     * @return {Integer} The index position or <code>-1</code> when
     *   the given item is no child of this layout.
     */
    indexOf : function(child) {
      return this.__forward("indexOf", child);
    },


    /**
     * Add a child at the specified index
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param child {LayoutItem} item to add
     * @param index {Integer} Index, at which the item will be inserted
     * @param options {Map?null} Optional layout data for item.
     */
    addAt : function(child, index, options) {
      this.__forward("addAt", child, index, options);
    },


    /**
     * Add an item before another already inserted item
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param child {LayoutItem} item to add
     * @param before {LayoutItem} item before the new item will be inserted.
     * @param options {Map?null} Optional layout data for item.
     */
    addBefore : function(child, before, options) {
      this.__forward("addBefore", child, before, options);
    },


    /**
     * Add an item after another already inserted item
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param child {LayoutItem} item to add
     * @param after {LayoutItem} item, after which the new item will be inserted
     * @param options {Map?null} Optional layout data for item.
     */
    addAfter : function(child, after, options) {
      this.__forward("addAfter", child, after, options);
    },


    /**
     * Remove the item at the specified index.
     *
     * This method works on the widget's children list. Some layout managers
     * (e.g. {@link qx.ui.layout.HBox}) use the children order as additional
     * layout information. Other layout manager (e.g. {@link qx.ui.layout.Grid})
     * ignore the children order for the layout process.
     *
     * @param index {Integer} Index of the item to remove.
     * @return {qx.ui.core.LayoutItem} The removed item
     */
    removeAt : function(index) {
      return this.__forward("removeAt", index);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This mixin redirects the layout manager to a child widget of the
 * including class. This is e.g. used in {@link qx.ui.window.Window} to configure
 * the layout manager of the window pane instead of the window directly.
 *
 * The including class must implement the method <code>getChildrenContainer</code>,
 * which has to return the widget, to which the layout should be set.
 */

qx.Mixin.define("qx.ui.core.MRemoteLayoutHandling",
{
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Set a layout manager for the widget. A a layout manager can only be connected
     * with one widget. Reset the connection with a previous widget first, if you
     * like to use it in another widget instead.
     *
     * @param layout {qx.ui.layout.Abstract} The new layout or
     *     <code>null</code> to reset the layout.
     */
    setLayout : function(layout) {
      this.getChildrenContainer().setLayout(layout);
    },


    /**
     * Get the widget's layout manager.
     *
     * @return {qx.ui.layout.Abstract} The widget's layout manager
     */
    getLayout : function() {
      return this.getChildrenContainer().getLayout();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Martin Wittemann (martinwittemann)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * Group boxes are used to group a set of form elements.
 *
 * @childControl frame {qx.ui.container.Composite} frame for the content widgets
 * @childControl legend {qx.ui.basic.Atom} legend to show at top of the groupbox
 */
qx.Class.define("qx.ui.groupbox.GroupBox",
{
  extend : qx.ui.core.Widget,
  include : [
    qx.ui.core.MRemoteChildrenHandling,
    qx.ui.core.MRemoteLayoutHandling,
    qx.ui.core.MContentPadding,
    qx.ui.form.MForm
  ],
  implement : [qx.ui.form.IForm],



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param legend {String?""} The group boxes legend
   * @param icon {String?""} The icon of the legend
   */
  construct : function(legend, icon)
  {
    this.base(arguments);

    this._setLayout(new qx.ui.layout.Canvas);

    // Sub widgets
    this._createChildControl("frame");
    this._createChildControl("legend");

    // Processing parameters
    if (legend != null) {
      this.setLegend(legend);
    }

    if (icon != null) {
      this.setIcon(icon);
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init   : "groupbox"
    },


    /**
     * Property for setting the position of the legend.
     */
    legendPosition :
    {
      check     : ["top", "middle"],
      init      : "middle",
      apply     : "_applyLegendPosition",
      themeable : true
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      invalid : true
    },


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "frame":
          control = new qx.ui.container.Composite();
          this._add(control, {left: 0, top: 6, right: 0, bottom: 0});
          break;

        case "legend":
          control = new qx.ui.basic.Atom();
          control.addListener("resize", this._repositionFrame, this);
          this._add(control, {left: 0, right: 0});
          break;
      }

      return control || this.base(arguments, id);
    },


    /**
     * Returns the element, to which the content padding should be applied.
     *
     * @return {qx.ui.core.Widget} The content padding target.
     */
    _getContentPaddingTarget : function() {
      return this.getChildControl("frame");
    },


    /*
    ---------------------------------------------------------------------------
      LEGEND POSITION HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Apply method for applying the legend position. It calls the
     * {@link #_repositionFrame} method.
     */
    _applyLegendPosition: function(e)
    {
      if (this.getChildControl("legend").getBounds()) {
        this._repositionFrame();
      }
    },


    /**
     * Repositions the frame of the group box dependent on the
     * {@link #legendPosition} property.
     */
    _repositionFrame: function()
    {
      var legend = this.getChildControl("legend");
      var frame = this.getChildControl("frame");

      // get the current height of the legend
      var height = legend.getBounds().height;

      // check for the property legend position
      if (this.getLegendPosition() == "middle") {
        frame.setLayoutProperties({"top": Math.round(height / 2)});
      } else if (this.getLegendPosition() == "top") {
        frame.setLayoutProperties({"top": height});
      }
    },





    /*
    ---------------------------------------------------------------------------
      GETTER FOR SUB WIDGETS
    ---------------------------------------------------------------------------
    */


    /**
     * The children container needed by the {@link qx.ui.core.MRemoteChildrenHandling}
     * mixin
     *
     * @return {qx.ui.container.Composite} pane sub widget
     */
    getChildrenContainer : function() {
      return this.getChildControl("frame");
    },





    /*
    ---------------------------------------------------------------------------
      SETTER/GETTER
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the label of the legend sub widget if the given string is
     * valid. Otherwise the legend sub widget get not displayed.
     *
     * @param legend {String} new label of the legend sub widget
     */
    setLegend : function(legend)
    {
      var control = this.getChildControl("legend");

      if (legend !== null)
      {
        control.setLabel(legend);
        control.show();
      }
      else
      {
        control.exclude();
      }
    },


    /**
     * Accessor method for the label of the legend sub widget
     *
     * @return {String} Label of the legend sub widget
     */
    getLegend : function() {
      return this.getChildControl("legend").getLabel();
    },


    /**
     * Sets the icon of the legend sub widget.
     *
     * @param icon {String} source of the new icon of the legend sub widget
     */
    setIcon : function(icon) {
      this.getChildControl("legend").setIcon(icon);
    },


    /**
     * Accessor method for the icon of the legend sub widget
     *
     * @return {String} source of the new icon of the legend sub widget
     */
    getIcon : function() {
      return this.getChildControl("legend").getIcon();
    }
  }
});

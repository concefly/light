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
 * Each object, which should be managed by a {@link RadioGroup} have to
 * implement this interface.
 */
qx.Interface.define("qx.ui.form.IRadioItem",
{

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the item was checked or unchecked */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Set whether the item is checked
     *
     * @param value {Boolean} whether the item should be checked
     */
    setValue : function(value) {},


    /**
     * Get whether the item is checked
     *
     * @return {Boolean} whether the item it checked
     */
    getValue : function() {},


    /**
     * Set the radiogroup, which manages this item
     *
     * @param value {qx.ui.form.RadioGroup} The radiogroup, which should
     *     manage the item.
     */
    setGroup : function(value) {
      this.assertInstance(value, qx.ui.form.RadioGroup);
    },


    /**
     * Get the radiogroup, which manages this item
     *
     * @return {qx.ui.form.RadioGroup} The radiogroup, which manages the item.
     */
    getGroup : function() {}
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
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * This mixin links all methods to manage the single selection.
 *
 * The class which includes the mixin has to implements two methods:
 *
 * <ul>
 * <li><code>_getItems</code>, this method has to return a <code>Array</code>
 *    of <code>qx.ui.core.Widget</code> that should be managed from the manager.
 * </li>
 * <li><code>_isAllowEmptySelection</code>, this method has to return a
 *    <code>Boolean</code> value for allowing empty selection or not.
 * </li>
 * </ul>
 */
qx.Mixin.define("qx.ui.core.MSingleSelectionHandling",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fires after the selection was modified */
    "changeSelection" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** @type {qx.ui.core.SingleSelectionManager} the single selection manager */
    __manager : null,


    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Returns an array of currently selected items.
     *
     * Note: The result is only a set of selected items, so the order can
     * differ from the sequence in which the items were added.
     *
     * @return {qx.ui.core.Widget[]} List of items.
     */
    getSelection : function() {
      var selected = this.__getManager().getSelected();

      if (selected) {
        return [selected];
      } else {
        return [];
      }
    },

    /**
     * Replaces current selection with the given items.
     *
     * @param items {qx.ui.core.Widget[]} Items to select.
     * @throws {Error} if one of the items is not a child element and if
     *    items contains more than one elements.
     */
    setSelection : function(items) {
      switch(items.length)
      {
        case 0:
          this.resetSelection();
          break;
        case 1:
          this.__getManager().setSelected(items[0]);
          break;
        default:
          throw new Error("Could only select one item, but the selection" +
            " array contains " + items.length + " items!");
      }
    },

    /**
     * Clears the whole selection at once.
     */
    resetSelection : function() {
      this.__getManager().resetSelected();
    },

    /**
     * Detects whether the given item is currently selected.
     *
     * @param item {qx.ui.core.Widget} Any valid selectable item.
     * @return {Boolean} Whether the item is selected.
     * @throws {Error} if one of the items is not a child element.
     */
    isSelected : function(item) {
      return this.__getManager().isSelected(item);
    },

    /**
     * Whether the selection is empty.
     *
     * @return {Boolean} Whether the selection is empty.
     */
    isSelectionEmpty : function() {
      return this.__getManager().isSelectionEmpty();
    },


    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables: function(all) {
      return this.__getManager().getSelectables(all);
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER
    ---------------------------------------------------------------------------
    */


    /**
     * Event listener for <code>changeSelected</code> event on single
     * selection manager.
     *
     * @param e {qx.event.type.Data} Data event.
     */
    _onChangeSelected : function(e) {
      var newValue = e.getData();
      var oldVlaue = e.getOldData();

      newValue == null ? newValue = [] : newValue = [newValue];
      oldVlaue == null ? oldVlaue = [] : oldVlaue = [oldVlaue];

      this.fireDataEvent("changeSelection", newValue, oldVlaue);
    },

    /**
     * Return the selection manager if it is already exists, otherwise creates
     * the manager.
     *
     * @return {qx.ui.core.SingleSelectionManager} Single selection manager.
     */
    __getManager : function()
    {
      if (this.__manager == null)
      {
        var that = this;
        this.__manager = new qx.ui.core.SingleSelectionManager(
        {
          getItems : function() {
            return that._getItems();
          },

          isItemSelectable : function(item) {
            if (that._isItemSelectable) {
              return that._isItemSelectable(item);
            } else {
              return item.isVisible();
            }
          }
        });
        this.__manager.addListener("changeSelected", this._onChangeSelected, this);
      }
      this.__manager.setAllowEmptySelection(this._isAllowEmptySelection());

      return this.__manager;
    }
  },


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  destruct : function() {
    this._disposeObjects("__manager");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Responsible for the single selection management.
 *
 * The class manage a list of {@link qx.ui.core.Widget} which are returned from
 * {@link qx.ui.core.ISingleSelectionProvider#getItems}.
 *
 * @internal
 */
qx.Class.define("qx.ui.core.SingleSelectionManager",
{
  extend : qx.core.Object,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  /**
   * Construct the single selection manager.
   *
   * @param selectionProvider {qx.ui.core.ISingleSelectionProvider} The provider
   * for selection.
   */
  construct : function(selectionProvider) {
    this.base(arguments);

    if (qx.core.Environment.get("qx.debug")) {
      qx.core.Assert.assertInterface(selectionProvider,
        qx.ui.core.ISingleSelectionProvider,
        "Invalid selectionProvider!");
    }

    this.__selectionProvider = selectionProvider;
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */


  events :
  {
    /** Fires after the selection was modified */
    "changeSelected" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */


  properties :
  {
    /**
     * If the value is <code>true</code> the manager allows an empty selection,
     * otherwise the first selectable element returned from the
     * <code>qx.ui.core.ISingleSelectionProvider</code> will be selected.
     */
    allowEmptySelection :
    {
      check : "Boolean",
      init : true,
      apply : "__applyAllowEmptySelection"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** @type {qx.ui.core.Widget} The selected widget. */
    __selected : null,

    /** @type {qx.ui.core.ISingleSelectionProvider} The provider for selection management */
    __selectionProvider : null,


    /*
    ---------------------------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the current selected element.
     *
     * @return {qx.ui.core.Widget | null} The current selected widget or
     *    <code>null</code> if the selection is empty.
     */
    getSelected : function() {
      return this.__selected;
    },

    /**
     * Selects the passed element.
     *
     * @param item {qx.ui.core.Widget} Element to select.
     * @throws {Error} if the element is not a child element.
     */
    setSelected : function(item) {
      if (!this.__isChildElement(item)) {
        throw new Error("Could not select " + item +
          ", because it is not a child element!");
      }

      this.__setSelected(item);
    },

    /**
     * Reset the current selection. If {@link #allowEmptySelection} is set to
     * <code>true</code> the first element will be selected.
     */
    resetSelected : function(){
      this.__setSelected(null);
    },

    /**
     * Return <code>true</code> if the passed element is selected.
     *
     * @param item {qx.ui.core.Widget} Element to check if selected.
     * @return {Boolean} <code>true</code> if passed element is selected,
     *    <code>false</code> otherwise.
     * @throws {Error} if the element is not a child element.
     */
    isSelected : function(item) {
      if (!this.__isChildElement(item)) {
        throw new Error("Could not check if " + item + " is selected," +
          " because it is not a child element!");
      }
      return this.__selected === item;
    },

    /**
     * Returns <code>true</code> if selection is empty.
     *
     * @return {Boolean} <code>true</code> if selection is empty,
     *    <code>false</code> otherwise.
     */
    isSelectionEmpty : function() {
      return this.__selected == null;
    },

    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables : function(all)
    {
      var items = this.__selectionProvider.getItems();
      var result = [];

      for (var i = 0; i < items.length; i++)
      {
        if (this.__selectionProvider.isItemSelectable(items[i])) {
          result.push(items[i]);
        }
      }

      // in case of an user selecable list, remove the enabled items
      if (!all) {
        for (var i = result.length -1; i >= 0; i--) {
          if (!result[i].getEnabled()) {
            result.splice(i, 1);
          }
        };
      }

      return result;
    },


    /*
    ---------------------------------------------------------------------------
       APPLY METHODS
    ---------------------------------------------------------------------------
    */


    // apply method
    __applyAllowEmptySelection : function(value, old)
    {
      if (!value) {
        this.__setSelected(this.__selected);
      }
    },


    /*
    ---------------------------------------------------------------------------
       HELPERS
    ---------------------------------------------------------------------------
    */

    /**
     * Set selected element.
     *
     * If passes value is <code>null</code>, the selection will be reseted.
     *
     * @param item {qx.ui.core.Widget | null} element to select, or
     *    <code>null</code> to reset selection.
     */
    __setSelected : function(item) {
      var oldSelected = this.__selected;
      var newSelected = item;

      if (newSelected != null && oldSelected === newSelected) {
        return;
      }

      if (!this.isAllowEmptySelection() && newSelected == null) {
        var firstElement = this.getSelectables(true)[0];

        if (firstElement) {
          newSelected = firstElement;
        }
      }

      this.__selected = newSelected;
      this.fireDataEvent("changeSelected", newSelected, oldSelected);
    },

    /**
     * Checks if passed element is a child element.
     *
     * @param item {qx.ui.core.Widget} Element to check if child element.
     * @return {Boolean} <code>true</code> if element is child element,
     *    <code>false</code> otherwise.
     */
    __isChildElement : function(item)
    {
      var items = this.__selectionProvider.getItems();

      for (var i = 0; i < items.length; i++)
      {
        if (items[i] === item)
        {
          return true;
        }
      }
      return false;
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */
  destruct : function() {
    if (this.__selectionProvider.toHashCode) {
      this._disposeObjects("__selectionProvider");
    } else {
      this.__selectionProvider = null;
    }

    this._disposeObjects("__selected");
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
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */
/**
 * Defines the callback for the single selection manager.
 *
 * @internal
 */
qx.Interface.define("qx.ui.core.ISingleSelectionProvider",
{
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Returns the elements which are part of the selection.
     *
     * @return {qx.ui.core.Widget[]} The widgets for the selection.
     */
    getItems: function() {},

    /**
     * Returns whether the given item is selectable.
     *
     * @param item {qx.ui.core.Widget} The item to be checked
     * @return {Boolean} Whether the given item is selectable
     */
    isItemSelectable : function(item) {}
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
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The radio group handles a collection of items from which only one item
 * can be selected. Selection another item will deselect the previously selected
 * item.
 *
 * This class is e.g. used to create radio groups or {@link qx.ui.form.RadioButton}
 * or {@link qx.ui.toolbar.RadioButton} instances.
 *
 * We also offer a widget for the same purpose which uses this class. So if
 * you like to act with a widget instead of a pure logic coupling of the
 * widgets, take a look at the {@link qx.ui.form.RadioButtonGroup} widget.
 */
qx.Class.define("qx.ui.form.RadioGroup",
{
  extend : qx.core.Object,
  implement : [
    qx.ui.core.ISingleSelection,
    qx.ui.form.IForm,
    qx.ui.form.IModelSelection
  ],
  include : [
    qx.ui.core.MSingleSelectionHandling,
    qx.ui.form.MModelSelection
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  /**
   * @param varargs {qx.core.Object} A variable number of items, which are
   *     initially added to the radio group, the first item will be selected.
   */
  construct : function(varargs)
  {
    this.base(arguments);

    // create item array
    this.__items = [];

    // add listener before call add!!!
    this.addListener("changeSelection", this.__onChangeSelection, this);

    if (varargs != null) {
      this.add.apply(this, arguments);
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */


  properties :
  {
    /**
     * Whether the radio group is enabled
     */
    enabled :
    {
      check : "Boolean",
      apply : "_applyEnabled",
      event : "changeEnabled",
      init: true
    },

    /**
     * Whether the selection should wrap around. This means that the successor of
     * the last item is the first item.
     */
    wrap :
    {
      check : "Boolean",
      init: true
    },

    /**
     * If is set to <code>true</code> the selection could be empty,
     * otherwise is always one <code>RadioButton</code> selected.
     */
    allowEmptySelection :
    {
      check : "Boolean",
      init : false,
      apply : "_applyAllowEmptySelection"
    },

    /**
     * Flag signaling if the group at all is valid. All children will have the
     * same state.
     */
    valid : {
      check : "Boolean",
      init : true,
      apply : "_applyValid",
      event : "changeValid"
    },

    /**
     * Flag signaling if the group is required.
     */
    required : {
      check : "Boolean",
      init : false,
      event : "changeRequired"
    },

    /**
     * Message which is shown in an invalid tooltip.
     */
    invalidMessage : {
      check : "String",
      init: "",
      event : "changeInvalidMessage",
      apply : "_applyInvalidMessage"
    },


    /**
     * Message which is shown in an invalid tooltip if the {@link #required} is
     * set to true.
     */
    requiredInvalidMessage : {
      check : "String",
      nullable : true,
      event : "changeInvalidMessage"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** @type {qx.ui.form.IRadioItem[]} The items of the radio group */
    __items : null,


    /*
    ---------------------------------------------------------------------------
      UTILITIES
    ---------------------------------------------------------------------------
    */


    /**
     * Get all managed items
     *
     * @return {qx.ui.form.IRadioItem[]} All managed items.
     */
    getItems : function() {
      return this.__items;
    },


    /*
    ---------------------------------------------------------------------------
      REGISTRY
    ---------------------------------------------------------------------------
    */


    /**
     * Add the passed items to the radio group.
     *
     * @param varargs {qx.ui.form.IRadioItem} A variable number of items to add.
     */
    add : function(varargs)
    {
      var items = this.__items;
      var item;

      for (var i=0, l=arguments.length; i<l; i++)
      {
        item = arguments[i];

        if (qx.lang.Array.contains(items, item)) {
          continue;
        }

        // Register listeners
        item.addListener("changeValue", this._onItemChangeChecked, this);

        // Push RadioButton to array
        items.push(item);

        // Inform radio button about new group
        item.setGroup(this);

        // Need to update internal value?
        if (item.getValue()) {
          this.setSelection([item]);
        }
      }

      // Select first item when only one is registered
      if (!this.isAllowEmptySelection() && items.length > 0 && !this.getSelection()[0]) {
        this.setSelection([items[0]]);
      }
    },

    /**
     * Remove an item from the radio group.
     *
     * @param item {qx.ui.form.IRadioItem} The item to remove.
     */
    remove : function(item)
    {
      var items = this.__items;
      if (qx.lang.Array.contains(items, item))
      {
        // Remove RadioButton from array
        qx.lang.Array.remove(items, item);

        // Inform radio button about new group
        if (item.getGroup() === this) {
          item.resetGroup();
        }

        // Deregister listeners
        item.removeListener("changeValue", this._onItemChangeChecked, this);

        // if the radio was checked, set internal selection to null
        if (item.getValue()) {
          this.resetSelection();
        }
      }
    },


    /**
     * Returns an array containing the group's items.
     *
     * @return {qx.ui.form.IRadioItem[]} The item array
     */
    getChildren : function()
    {
      return this.__items;
    },


    /*
    ---------------------------------------------------------------------------
      LISTENER FOR ITEM CHANGES
    ---------------------------------------------------------------------------
    */


    /**
     * Event listener for <code>changeValue</code> event of every managed item.
     *
     * @param e {qx.event.type.Data} Data event
     */
    _onItemChangeChecked : function(e)
    {
      var item = e.getTarget();
      if (item.getValue()) {
        this.setSelection([item]);
      } else if (this.getSelection()[0] == item) {
        this.resetSelection();
      }
    },


    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */
    // property apply
    _applyInvalidMessage : function(value, old) {
      for (var i = 0; i < this.__items.length; i++) {
        this.__items[i].setInvalidMessage(value);
      }
    },

    // property apply
    _applyValid: function(value, old) {
      for (var i = 0; i < this.__items.length; i++) {
        this.__items[i].setValid(value);
      }
    },

    // property apply
    _applyEnabled : function(value, old)
    {
      var items = this.__items;
      if (value == null)
      {
        for (var i=0, l=items.length; i<l; i++) {
          items[i].resetEnabled();
        }
      }
      else
      {
        for (var i=0, l=items.length; i<l; i++) {
          items[i].setEnabled(value);
        }
      }
    },

    // property apply
    _applyAllowEmptySelection : function(value, old)
    {
      if (!value && this.isSelectionEmpty()) {
        this.resetSelection();
      }
    },


    /*
    ---------------------------------------------------------------------------
      SELECTION
    ---------------------------------------------------------------------------
    */


    /**
     * Select the item following the given item.
     */
    selectNext : function()
    {
      var item = this.getSelection()[0];
      var items = this.__items;
      var index = items.indexOf(item);
      if (index == -1) {
        return;
      }

      var i = 0;
      var length = items.length;

      // Find next enabled item
      if (this.getWrap()) {
        index = (index + 1) % length;
      } else {
        index = Math.min(index + 1, length - 1);
      }

      while (i < length && !items[index].getEnabled())
      {
        index = (index + 1) % length;
        i++;
      }

      this.setSelection([items[index]]);
    },


    /**
     * Select the item previous the given item.
     */
    selectPrevious : function()
    {
      var item = this.getSelection()[0];
      var items = this.__items;
      var index = items.indexOf(item);
      if (index == -1) {
        return;
      }

      var i = 0;
      var length = items.length;

      // Find previous enabled item
      if (this.getWrap()) {
        index = (index - 1 + length) % length;
      } else {
        index = Math.max(index - 1, 0);
      }

      while (i < length && !items[index].getEnabled())
      {
        index = (index - 1 + length) % length;
        i++;
      }

      this.setSelection([items[index]]);
    },


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS FOR SELECTION API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the items for the selection.
     *
     * @return {qx.ui.form.IRadioItem[]} Items to select.
     */
    _getItems : function() {
      return this.getItems();
    },

    /**
     * Returns if the selection could be empty or not.
     *
     * @return {Boolean} <code>true</code> If selection could be empty,
     *    <code>false</code> otherwise.
     */
    _isAllowEmptySelection: function() {
      return this.isAllowEmptySelection();
    },


    /**
     * Returns whether the item is selectable. In opposite to the default
     * implementation (which checks for visible items) every radio button
     * which is part of the group is selected even if it is currently not visible.
     *
     * @param item {qx.ui.form.IRadioItem} The item to check if its selectable.
     * @return {Boolean} <code>true</code> if the item is part of the radio group
     *    <code>false</code> otherwise.
     */
    _isItemSelectable : function(item) {
      return this.__items.indexOf(item) != -1;
    },


    /**
     * Event handler for <code>changeSelection</code>.
     *
     * @param e {qx.event.type.Data} Data event.
     */
    __onChangeSelection : function(e)
    {
      var value = e.getData()[0];
      var old = e.getOldData()[0];

      if (old) {
        old.setValue(false);
      }

      if (value) {
        value.setValue(true);
      }
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */


  destruct : function() {
    this._disposeArray("__items");
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

************************************************************************ */

/**
 * Radio buttons can be used in radio groups to allow to the user to select
 * exactly one item from a list. Radio groups are established by adding
 * radio buttons to a radio manager {@link qx.ui.form.RadioGroup}.
 *
 * Example:
 * <pre class="javascript">
 *   var container = new qx.ui.container.Composite(new qx.ui.layout.VBox);
 *
 *   var female = new qx.ui.form.RadioButton("female");
 *   var male = new qx.ui.form.RadioButton("male");
 *
 *   var mgr = new qx.ui.form.RadioGroup();
 *   mgr.add(female, male);
 *
 *   container.add(male);
 *   container.add(female);
 * </pre>
 */
qx.Class.define("qx.ui.form.RadioButton",
{
  extend : qx.ui.form.Button,
  include : [
    qx.ui.form.MForm,
    qx.ui.form.MModelProperty
  ],
  implement : [
    qx.ui.form.IRadioItem,
    qx.ui.form.IForm,
    qx.ui.form.IBooleanForm,
    qx.ui.form.IModel
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String?null} An optional label for the radio button.
   */
  construct : function(label)
  {
    if (qx.core.Environment.get("qx.debug")) {
      this.assertArgumentsCount(arguments, 0, 1);
    }

    this.base(arguments, label);

    // Add listeners
    this.addListener("execute", this._onExecute);
    this.addListener("keypress", this._onKeyPress);
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The assigned qx.ui.form.RadioGroup which handles the switching between registered buttons */
    group :
    {
      check  : "qx.ui.form.RadioGroup",
      nullable : true,
      apply : "_applyGroup"
    },

    /** The value of the widget. True, if the widget is checked. */
    value :
    {
      check : "Boolean",
      nullable : true,
      event : "changeValue",
      apply : "_applyValue",
      init: false
    },

    // overridden
    appearance :
    {
      refine : true,
      init : "radiobutton"
    },

    // overridden
    allowGrowX :
    {
      refine : true,
      init : false
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
      checked : true,
      focused : true,
      invalid : true,
      hovered : true
    },

    // overridden (from MExecutable to keet the icon out of the binding)
    /**
     * @lint ignoreReferenceField(_bindableProperties)
     */
    _bindableProperties :
    [
      "enabled",
      "label",
      "toolTipText",
      "value",
      "menu"
    ],

    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyValue : function(value, old)
    {
      value ?
        this.addState("checked") :
        this.removeState("checked");
    },


    /** The assigned {@link qx.ui.form.RadioGroup} which handles the switching between registered buttons */
    _applyGroup : function(value, old)
    {
      if (old) {
        old.remove(this);
      }

      if (value) {
        value.add(this);
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENT-HANDLER
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for the "execute" event.
     *
     * Sets the property "checked" to true.
     *
     * @param e {qx.event.type.Event} execute event
     */
    _onExecute : function(e) {
      var grp = this.getGroup();
      if (grp && grp.getAllowEmptySelection()) {
        this.toggleValue();
      } else {
        this.setValue(true);
      }
    },


    /**
     * Event listener for the "keyPress" event.
     *
     * Selects the previous RadioButton when pressing "Left" or "Up" and
     * Selects the next RadioButton when pressing "Right" and "Down"
     *
     * @param e {qx.event.type.KeySequence} KeyPress event
     */
    _onKeyPress : function(e)
    {

      var grp = this.getGroup();
      if (!grp) {
        return;
      }

      switch(e.getKeyIdentifier())
      {
        case "Left":
        case "Up":
          grp.selectPrevious();
          break;

        case "Right":
        case "Down":
          grp.selectNext();
          break;
      }
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
     * Alexander Steitz (aback)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Modern color theme
 */
qx.Theme.define("qx.theme.modern.Color",
{
  colors :
  {
    /*
    ---------------------------------------------------------------------------
      BACKGROUND COLORS
    ---------------------------------------------------------------------------
    */

    // application, desktop, ...
    "background-application" : "#DFDFDF",

    // pane color for windows, splitpanes, ...
    "background-pane" : "#F3F3F3",

    // textfields, ...
    "background-light" : "#FCFCFC",

    // headers, ...
    "background-medium" : "#EEEEEE",

    // splitpane
    "background-splitpane" : "#AFAFAF",

    // tooltip, ...
    "background-tip" : "#ffffdd",

    // error tooltip
    "background-tip-error": "#C72B2B",

    // tables, ...
    "background-odd" : "#E4E4E4",

    // html area
    "htmlarea-background" : "white",

    // progress bar
    "progressbar-background" : "white",




    /*
    ---------------------------------------------------------------------------
      TEXT COLORS
    ---------------------------------------------------------------------------
    */

    // other types
    "text-light" : "#909090",
    "text-gray" : "#4a4a4a",

    // labels
    "text-label" : "#1a1a1a",

    // group boxes
    "text-title" : "#314a6e",

    // text fields
    "text-input" : "#000000",

    // states
    "text-hovered"  : "#001533",
    "text-disabled" : "#7B7A7E",
    "text-selected" : "#fffefe",
    "text-active"   : "#26364D",
    "text-inactive" : "#404955",
    "text-placeholder" : "#CBC8CD",






    /*
    ---------------------------------------------------------------------------
      BORDER COLORS
    ---------------------------------------------------------------------------
    */

    "border-inner-scrollbar" : "white",

    // menus, tables, scrollbars, list, etc.
    "border-main" : "#4d4d4d",
    "menu-separator-top" : "#C5C5C5",
    "menu-separator-bottom" : "#FAFAFA",

    // between toolbars
    "border-separator" : "#808080",
    "border-toolbar-button-outer" : "#b6b6b6",
    "border-toolbar-border-inner" : "#f8f8f8",
    "border-toolbar-separator-right" : "#f4f4f4",
    "border-toolbar-separator-left" : "#b8b8b8",

    // text fields
    "border-input" : "#334866",
    "border-inner-input" : "white",

    // disabled text fields
    "border-disabled" : "#B6B6B6",

    // tab view, window
    "border-pane" : "#00204D",

    // buttons
    "border-button" : "#666666",

    // tables (vertical line)
    "border-column" : "#CCCCCC",

    // focus state of text fields
    "border-focused" : "#99C3FE",

    // invalid form widgets
    "invalid" : "#990000",
    "border-focused-invalid" : "#FF9999",

    // drag & drop
    "border-dragover" : "#33508D",

    "keyboard-focus" : "black",


    /*
    ---------------------------------------------------------------------------
      TABLE COLORS
    ---------------------------------------------------------------------------
    */

    // equal to "background-pane"
    "table-pane" : "#F3F3F3",

    // own table colors
    // "table-row-background-selected" and "table-row-background-focused-selected"
    // are inspired by the colors of the selection decorator
    "table-focus-indicator" : "#0880EF",
    "table-row-background-focused-selected" : "#084FAB",
    "table-row-background-focused" : "#80B4EF",
    "table-row-background-selected" : "#084FAB",

    // equal to "background-pane" and "background-odd"
    "table-row-background-even" : "#F3F3F3",
    "table-row-background-odd" : "#E4E4E4",

    // equal to "text-selected" and "text-label"
    "table-row-selected" : "#fffefe",
    "table-row" : "#1a1a1a",

    // equal to "border-collumn"
    "table-row-line" : "#CCC",
    "table-column-line" : "#CCC",

    "table-header-hovered" : "white",

    /*
    ---------------------------------------------------------------------------
      PROGRESSIVE TABLE COLORS
    ---------------------------------------------------------------------------
    */

    "progressive-table-header"              : "#AAAAAA",
    "progressive-table-header-border-right" : "#F2F2F2",


    "progressive-table-row-background-even" : "#F4F4F4",
    "progressive-table-row-background-odd"  : "#E4E4E4",

    "progressive-progressbar-background"         : "gray",
    "progressive-progressbar-indicator-done"     : "#CCCCCC",
    "progressive-progressbar-indicator-undone"   : "white",
    "progressive-progressbar-percent-background" : "gray",
    "progressive-progressbar-percent-text"       : "white",


    /*
    ---------------------------------------------------------------------------
      CSS ONLY COLORS
    ---------------------------------------------------------------------------
    */
    "selected-start" : "#004DAD",
    "selected-end" : "#00368A",
    "background-selected" : "#00368A",

    "tabview-background" : "#07125A",

    "shadow" : qx.core.Environment.get("css.rgba") ? "rgba(0, 0, 0, 0.4)" : "#999999",

    "pane-start" : "#FBFBFB",
    "pane-end" : "#F0F0F0",

    "group-background" : "#E8E8E8",
    "group-border" : "#B4B4B4",

    "radiobutton-background" : "#EFEFEF",

    "checkbox-border" : "#314A6E",
    "checkbox-focus" : "#87AFE7",
    "checkbox-hovered" : "#B2D2FF",
    "checkbox-hovered-inner" : "#D1E4FF",
    "checkbox-inner" : "#EEEEEE",
    "checkbox-start" : "#E4E4E4",
    "checkbox-end" : "#F3F3F3",
    "checkbox-disabled-border" : "#787878",
    "checkbox-disabled-inner" : "#CACACA",
    "checkbox-disabled-start" : "#D0D0D0",
    "checkbox-disabled-end" : "#D8D8D8",
    "checkbox-hovered-inner-invalid" : "#FAF2F2",
    "checkbox-hovered-invalid" : "#F7E9E9",

    "radiobutton-checked" : "#005BC3",
    "radiobutton-disabled" : "#D5D5D5",
    "radiobutton-checked-disabled" : "#7B7B7B",
    "radiobutton-hovered-invalid" : "#F7EAEA",

    "tooltip-error" : "#C82C2C",

    "scrollbar-start" : "#CCCCCC",
    "scrollbar-end" : "#F1F1F1",
    "scrollbar-slider-start" : "#EEEEEE",
    "scrollbar-slider-end" : "#C3C3C3",

    "button-border-disabled" : "#959595",
    "button-start" : "#F0F0F0",
    "button-end" : "#AFAFAF",
    "button-disabled-start" : "#F4F4F4",
    "button-disabled-end" : "#BABABA",
    "button-hovered-start" : "#F0F9FE",
    "button-hovered-end" : "#8EB8D6",
    "button-focused" : "#83BAEA",

    "border-invalid" : "#930000",

    "input-start" : "#F0F0F0",
    "input-end" : "#FBFCFB",
    "input-focused-start" : "#D7E7F4",
    "input-focused-end" : "#5CB0FD",
    "input-focused-inner-invalid" : "#FF6B78",
    "input-border-disabled" : "#9B9B9B",
    "input-border-inner" : "white",

    "toolbar-start" : "#EFEFEF",
    "toolbar-end" : "#DDDDDD",

    "window-border" : "#00204D",
    "window-border-caption" : "#727272",
    "window-caption-active-text" : "white",
    "window-caption-active-start" : "#084FAA",
    "window-caption-active-end" : "#003B91",
    "window-caption-inactive-start" : "#F2F2F2",
    "window-caption-inactive-end" : "#DBDBDB",
    "window-statusbar-background" : "#EFEFEF",

    "tabview-start" : "#FCFCFC",
    "tabview-end" : "#EEEEEE",
    "tabview-inactive" : "#777D8D",
    "tabview-inactive-start" : "#EAEAEA",
    "tabview-inactive-end" : "#CECECE",

    "table-header-start" : "#E8E8E8",
    "table-header-end" : "#B3B3B3",

    "menu-start" : "#E8E8E9",
    "menu-end" : "#D9D9D9",
    "menubar-start" : "#E8E8E8",

    "groupitem-start" : "#A7A7A7",
    "groupitem-end" : "#949494",
    "groupitem-text" : "white",
    "virtual-row-layer-background-even" : "white",
    "virtual-row-layer-background-odd" : "white"
  }
});

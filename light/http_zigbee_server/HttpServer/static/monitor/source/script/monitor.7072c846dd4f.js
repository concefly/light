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
 * <h2>List Controller</h2>
 *
 * *General idea*
 * The list controller is responsible for synchronizing every list like widget
 * with a data array. It does not matter if the array contains atomic values
 * like strings of complete objects where one property holds the value for
 * the label and another property holds the icon url. You can even use converters
 * that make the label show a text corresponding to the icon, by binding both
 * label and icon to the same model property and converting one of them.
 *
 * *Features*
 *
 * * Synchronize the model and the target
 * * Label and icon are bindable
 * * Takes care of the selection
 * * Passes on the options used by {@link qx.data.SingleValueBinding#bind}
 *
 * *Usage*
 *
 * As model, only {@link qx.data.Array}s do work. The currently supported
 * targets are
 *
 * * {@link qx.ui.form.SelectBox}
 * * {@link qx.ui.form.List}
 * * {@link qx.ui.form.ComboBox}
 *
 * All the properties like model, target or any property path is bindable.
 * Especially the model is nice to bind to another selection for example.
 * The controller itself can only work if it has a model and a target set. The
 * rest of the properties may be empty.
 *
 * *Cross reference*
 *
 * * If you want to bind single values, use {@link qx.data.controller.Object}
 * * If you want to bind a tree widget, use {@link qx.data.controller.Tree}
 * * If you want to bind a form widget, use {@link qx.data.controller.Form}
 */
qx.Class.define("qx.data.controller.List",
{
  extend : qx.core.Object,
  include: qx.data.controller.MSelection,
  implement : qx.data.controller.ISelection,

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param model {qx.data.Array?null} The array containing the data.
   *
   * @param target {qx.ui.core.Widget?null} The widget which should show the
   *   ListItems.
   *
   * @param labelPath {String?null} If the model contains objects, the labelPath
   *   is the path reference to the property in these objects which should be
   *   shown as label.
   */
  construct : function(model, target, labelPath)
  {
    this.base(arguments);

    // lookup table for filtering and sorting
    this.__lookupTable = [];

    // register for bound target properties and onUpdate methods
    // from the binding options
    this.__boundProperties = [];
    this.__boundPropertiesReverse = [];
    this.__onUpdate = {};

    if (labelPath != null) {
      this.setLabelPath(labelPath);
    }
    if (model != null) {
      this.setModel(model);
    }
    if (target != null) {
      this.setTarget(target);
    }
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Data array containing the data which should be shown in the list. */
    model :
    {
      check: "qx.data.IListData",
      apply: "_applyModel",
      event: "changeModel",
      nullable: true,
      dereference: true
    },


    /** The target widget which should show the data. */
    target :
    {
      apply: "_applyTarget",
      event: "changeTarget",
      nullable: true,
      init: null,
      dereference: true
    },


    /**
     * The path to the property which holds the information that should be
     * shown as a label. This is only needed if objects are stored in the model.
     */
    labelPath :
    {
      check: "String",
      apply: "_applyLabelPath",
      nullable: true
    },


    /**
     * The path to the property which holds the information that should be
     * shown as an icon. This is only needed if objects are stored in the model
     * and if the icon should be shown.
     */
    iconPath :
    {
      check: "String",
      apply: "_applyIconPath",
      nullable: true
    },


    /**
     * A map containing the options for the label binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    labelOptions :
    {
      apply: "_applyLabelOptions",
      nullable: true
    },


    /**
     * A map containing the options for the icon binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    iconOptions :
    {
      apply: "_applyIconOptions",
      nullable: true
    },


    /**
     * Delegation object, which can have one or more functions defined by the
     * {@link IControllerDelegate} interface.
     */
    delegate :
    {
      apply: "_applyDelegate",
      event: "changeDelegate",
      init: null,
      nullable: true
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // private members
    __changeModelListenerId : null,
    __lookupTable : null,
    __onUpdate : null,
    __boundProperties : null,
    __boundPropertiesReverse : null,
    __syncTargetSelection : null,
    __syncModelSelection : null,


    /*
    ---------------------------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------------------------
    */
    /**
     * Updates the filter and the target. This could be used if the filter
     * uses an additional parameter which changes the filter result.
     */
    update: function() {
      this.__changeModelLength();
      this.__renewBindings();

      this._updateSelection();
    },


    /*
    ---------------------------------------------------------------------------
       APPLY METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * If a new delegate is set, it applies the stored configuration for the
     * list items to the already created list items once.
     *
     * @param value {qx.core.Object|null} The new delegate.
     * @param old {qx.core.Object|null} The old delegate.
     */
    _applyDelegate: function(value, old) {
      this._setConfigureItem(value, old);
      this._setFilter(value, old);
      this._setCreateItem(value, old);
      this._setBindItem(value, old);
    },


    /**
     * Apply-method which will be called if the icon options has been changed.
     * It invokes a renewing of all set bindings.
     *
     * @param value {Map|null} The new icon options.
     * @param old {Map|null} The old icon options.
     */
    _applyIconOptions: function(value, old) {
      this.__renewBindings();
    },


    /**
     * Apply-method which will be called if the label options has been changed.
     * It invokes a renewing of all set bindings.
     *
     * @param value {Map|null} The new label options.
     * @param old {Map|null} The old label options.
     */
    _applyLabelOptions: function(value, old) {
      this.__renewBindings();
    },


    /**
     * Apply-method which will be called if the icon path has been changed.
     * It invokes a renewing of all set bindings.
     *
     * @param value {String|null} The new icon path.
     * @param old {String|null} The old icon path.
     */
    _applyIconPath: function(value, old) {
      this.__renewBindings();
    },


    /**
     * Apply-method which will be called if the label path has been changed.
     * It invokes a renewing of all set bindings.
     *
     * @param value {String|null} The new label path.
     * @param old {String|null} The old label path.
     */
    _applyLabelPath: function(value, old) {
      this.__renewBindings();
    },


    /**
     * Apply-method which will be called if the model has been changed. It
     * removes all the listeners from the old model and adds the needed
     * listeners to the new model. It also invokes the initial filling of the
     * target widgets if there is a target set.
     *
     * @param value {qx.data.Array|null} The new model array.
     * @param old {qx.data.Array|null} The old model array.
     */
    _applyModel: function(value, old) {
      // remove the old listener
      if (old != undefined) {
        if (this.__changeModelListenerId != undefined) {
          old.removeListenerById(this.__changeModelListenerId);
        }
      }

      // erase the selection if there is something selected
      if (this.getSelection() != undefined && this.getSelection().length > 0) {
        this.getSelection().splice(0, this.getSelection().length).dispose();
      }

      // if a model is set
      if (value != null) {
        // add a new listener
        this.__changeModelListenerId =
          value.addListener("change", this.__changeModel, this);

        // renew the index lookup table
        this.__buildUpLookupTable();
        // check for the new length
        this.__changeModelLength();

        // as we only change the labels of the items, the selection change event
        // may be missing so we invoke it here
        if (old == null) {
          this._changeTargetSelection();
        } else {
          // update the selection asynchronously
          this.__syncTargetSelection = true;
          qx.ui.core.queue.Widget.add(this);
        }
      } else {
        var target = this.getTarget();
        // if the model is set to null, we should remove all items in the target
        if (target != null) {
          // we need to remove the bindings too so use the controller method
          // for removing items
          var length = target.getChildren().length;
          for (var i = 0; i < length; i++) {
            this.__removeItem();
          };
        }
      }
    },


    /**
     * Apply-method which will be called if the target has been changed.
     * When the target changes, every binding needs to be reset and the old
     * target needs to be cleaned up. If there is a model, the target will be
     * filled with the data of the model.
     *
     * @param value {qx.ui.core.Widget|null} The new target.
     * @param old {qx.ui.core.Widget|null} The old target.
     */
    _applyTarget: function(value, old) {
      // add a listener for the target change
      this._addChangeTargetListener(value, old);

      // if there was an old target
      if (old != undefined) {
        // remove all element of the old target
        var removed = old.removeAll();
        for (var i=0; i<removed.length; i++) {
          removed[i].destroy();
        }
        // remove all bindings
        this.removeAllBindings();
      }

      if (value != null) {
        if (this.getModel() != null) {
          // add a binding for all elements in the model
          for (var i = 0; i < this.__lookupTable.length; i++) {
            this.__addItem(this.__lookup(i));
          }
        }
      }
    },


    /*
    ---------------------------------------------------------------------------
       EVENT HANDLER
    ---------------------------------------------------------------------------
    */
    /**
     * Event handler for the change event of the model. If the model changes,
     * Only the selection needs to be changed. The change of the data will
     * be done by the binding.
     */
    __changeModel: function() {
      // need an asynchronous selection update because the bindings have to be
      // executed to update the selection probably (using the widget queue)
      // this.__syncTargetSelection = true;
      this.__syncModelSelection = true;
      qx.ui.core.queue.Widget.add(this);

      // update on filtered lists... (bindings need to be renewed)
      if (this.__lookupTable.length != this.getModel().getLength()) {
        this.update();
      }
    },


    /**
     * Internal method used to sync the selection. The controller uses the
     * widget queue to schedule the selection update. An asynchronous handling of
     * the selection is needed because the bindings (event listeners for the
     * binding) need to be executed before the selection is updated.
     * @internal
     */
    syncWidget : function()
    {
      if (this.__syncTargetSelection) {
        this._changeTargetSelection();
      }
      if (this.__syncModelSelection) {
        this._updateSelection();
      }
      this.__syncModelSelection = this.__syncTargetSelection = null;
    },


    /**
     * Event handler for the changeLength of the model. If the length changes
     * of the model, either ListItems need to be removed or added to the target.
     */
    __changeModelLength: function() {
      // only do something if there is a target
      if (this.getTarget() == null) {
        return;
      }

      // build up the look up table
      this.__buildUpLookupTable();

      // get the length
      var newLength = this.__lookupTable.length;
      var currentLength = this.getTarget().getChildren().length;

      // if there are more item
      if (newLength > currentLength) {
        // add the new elements
        for (var j = currentLength; j < newLength; j++) {
          this.__addItem(this.__lookup(j));
        }
      // if there are less elements
      } else if (newLength < currentLength) {
        // remove the unnecessary items
        for (var j = currentLength; j > newLength; j--) {
          this.__removeItem();
        }
      }

      // sync the target selection in case someone deleted a item in
      // selection mode "one" [BUG #4839]
      this.__syncTargetSelection = true;
      qx.ui.core.queue.Widget.add(this);
    },


    /**
     * Helper method which removes and adds the change listener of the
     * controller to the model. This is sometimes necessary to ensure that the
     * listener of the controller is executed as the last listener of the chain.
     */
    __moveChangeListenerAtTheEnd : function() {
      var model = this.getModel();
      // it can be that the bindings has been reset without the model so
      // maybe there is no model in some scenarios
      if (model != null) {
        model.removeListenerById(this.__changeModelListenerId);
        this.__changeModelListenerId =
          model.addListener("change", this.__changeModel, this);
      }

    },


    /*
    ---------------------------------------------------------------------------
       ITEM HANDLING
    ---------------------------------------------------------------------------
    */
    /**
     * Creates a ListItem and delegates the configure method if a delegate is
     * set and the needed function (configureItem) is available.
     *
     * @return {qx.ui.form.ListItem} The created and configured ListItem.
     */
    _createItem: function() {
      var delegate = this.getDelegate();
      // check if a delegate and a create method is set
      if (delegate != null && delegate.createItem != null) {
        var item = delegate.createItem();
      } else {
        var item = new qx.ui.form.ListItem();
      }

      // if there is a configure method, invoke it
      if (delegate != null && delegate.configureItem != null) {
        delegate.configureItem(item);
      }
      return item;
    },


    /**
     * Internal helper to add ListItems to the target including the creation
     * of the binding.
     *
     * @param index {Number} The index of the item to add.
     */
    __addItem: function(index) {
      // create a new ListItem
      var listItem = this._createItem();
      // set up the binding
      this._bindListItem(listItem, index);
      // add the ListItem to the target
      this.getTarget().add(listItem);
    },


    /**
     * Internal helper to remove ListItems from the target. Also the binding
     * will be removed properly.
     */
    __removeItem: function() {
      this._startSelectionModification();
      var children = this.getTarget().getChildren();
      // get the last binding id
      var index = children.length - 1;
      // get the item
      var oldItem = children[index];
      this._removeBindingsFrom(oldItem);
      // remove the item
      this.getTarget().removeAt(index);
      oldItem.destroy();
      this._endSelectionModification();
    },


    /**
     * Returns all models currently visible by the list. This method is only
     * useful if you use the filter via the {@link #delegate}.
     *
     * @return {qx.data.Array} A new data array container all the models
     *   which representation items are currently visible.
     */
    getVisibleModels : function()
    {
      var visibleModels = [];
      var target = this.getTarget();
      if (target != null) {
        var items = target.getChildren();
        for (var i = 0; i < items.length; i++) {
          visibleModels.push(items[i].getModel());
        };
      }

      return new qx.data.Array(visibleModels);
    },


    /*
    ---------------------------------------------------------------------------
       BINDING STUFF
    ---------------------------------------------------------------------------
    */
    /**
     * Sets up the binding for the given ListItem and index.
     *
     * @param item {qx.ui.form.ListItem} The internally created and used
     *   ListItem.
     * @param index {Number} The index of the ListItem.
     */
    _bindListItem: function(item, index) {
      var delegate = this.getDelegate();
      // if a delegate for creating the binding is given, use it
      if (delegate != null && delegate.bindItem != null) {
        delegate.bindItem(this, item, index);
      // otherwise, try to bind the listItem by default
      } else {
        this.bindDefaultProperties(item, index);
      }
    },


    /**
     * Helper-Method for binding the default properties (label, icon and model)
     * from the model to the target widget.
     *
     * This method should only be called in the
     * {@link qx.data.controller.IControllerDelegate#bindItem} function
     * implemented by the {@link #delegate} property.
     *
     * @param item {qx.ui.form.ListItem} The internally created and used
     *   ListItem.
     * @param index {Number} The index of the ListItem.
     */
    bindDefaultProperties : function(item, index)
    {
      // model
      this.bindProperty(
        "", "model", null, item, index
      );

      // label
      this.bindProperty(
        this.getLabelPath(), "label", this.getLabelOptions(), item, index
      );

      // if the iconPath is set
      if (this.getIconPath() != null) {
        this.bindProperty(
          this.getIconPath(), "icon", this.getIconOptions(), item, index
        );
      }
    },


    /**
     * Helper-Method for binding a given property from the model to the target
     * widget.
     * This method should only be called in the
     * {@link qx.data.controller.IControllerDelegate#bindItem} function
     * implemented by the {@link #delegate} property.
     *
     * @param sourcePath {String | null} The path to the property in the model.
     *   If you use an empty string, the whole model item will be bound.
     * @param targetProperty {String} The name of the property in the target
     *   widget.
     * @param options {Map | null} The options used by
     *   {@link qx.data.SingleValueBinding#bind} to use for the binding.
     * @param targetWidget {qx.ui.core.Widget} The target widget.
     * @param index {Number} The index of the current binding.
     */
    bindProperty: function(sourcePath, targetProperty, options, targetWidget, index) {
      // create the options for the binding containing the old options
      // including the old onUpdate function
      if (options != null) {
        var options = qx.lang.Object.clone(options);
        this.__onUpdate[targetProperty] = options.onUpdate;
        delete options.onUpdate;
      } else {
        options = {};
        this.__onUpdate[targetProperty] = null;
      }
      options.onUpdate =  qx.lang.Function.bind(this._onBindingSet, this, index);
      options.ignoreConverter = "model"

      // build up the path for the binding
      var bindPath = "model[" + index + "]";
      if (sourcePath != null && sourcePath != "") {
        bindPath += "." + sourcePath;
      }
      // create the binding
      var id = this.bind(bindPath, targetWidget, targetProperty, options);
      targetWidget.setUserData(targetProperty + "BindingId", id);

      // save the bound property
      if (!qx.lang.Array.contains(this.__boundProperties, targetProperty)) {
        this.__boundProperties.push(targetProperty);
      }
    },


    /**
     * Helper-Method for binding a given property from the target widget to
     * the model.
     * This method should only be called in the
     * {@link qx.data.controller.IControllerDelegate#bindItem} function
     * implemented by the {@link #delegate} property.
     *
     * @param targetPath {String | null} The path to the property in the model.
     * @param sourcePath {String} The name of the property in the target.
     * @param options {Map | null} The options to use by
     *   {@link qx.data.SingleValueBinding#bind} for the binding.
     * @param sourceWidget {qx.ui.core.Widget} The source widget.
     * @param index {Number} The index of the current binding.
     */
    bindPropertyReverse: function(
      targetPath, sourcePath, options, sourceWidget, index
    ) {
      // build up the path for the binding
      var targetBindPath = "model[" + index + "]";
      if (targetPath != null && targetPath != "") {
        targetBindPath += "." + targetPath;
      }
      // create the binding
      var id = sourceWidget.bind(sourcePath, this, targetBindPath, options);
      sourceWidget.setUserData(targetPath + "ReverseBindingId", id);

      // save the bound property
      if (!qx.lang.Array.contains(this.__boundPropertiesReverse, targetPath)) {
        this.__boundPropertiesReverse.push(targetPath);
      }
    },


    /**
     * Method which will be called on the invoke of every binding. It takes
     * care of the selection on the change of the binding.
     *
     * @param index {Number} The index of the current binding.
     * @param sourceObject {qx.core.Object} The source object of the binding.
     * @param targetObject {qx.core.Object} The target object of the binding.
     */
    _onBindingSet: function(index, sourceObject, targetObject) {
      // ignore the binding set if the model is already set to null
      if (this.getModel() == null || this._inSelectionModification()) {
        return;
      }

      // go through all bound target properties
      for (var i = 0; i < this.__boundProperties.length; i++) {
        // if there is an onUpdate for one of it, invoke it
        if (this.__onUpdate[this.__boundProperties[i]] != null) {
          this.__onUpdate[this.__boundProperties[i]]();
        }
      }
    },


    /**
     * Internal helper method to remove the binding of the given item.
     *
     * @param item {Number} The item of which the binding which should
     *   be removed.
     */
    _removeBindingsFrom: function(item) {
      // go through all bound target properties
      for (var  i = 0; i < this.__boundProperties.length; i++) {
        // get the binding id and remove it, if possible
        var id = item.getUserData(this.__boundProperties[i] + "BindingId");
        if (id != null) {
          this.removeBinding(id);
        }
      }
      // go through all reverse bound properties
      for (var i = 0; i < this.__boundPropertiesReverse.length; i++) {
        // get the binding id and remove it, if possible
        var id = item.getUserData(
          this.__boundPropertiesReverse[i] + "ReverseBindingId"
        );
        if (id != null) {
          item.removeBinding(id);
        }
      };
    },


    /**
     * Internal helper method to renew all set bindings.
     */
    __renewBindings: function() {
      // ignore, if no target is set (startup)
      if (this.getTarget() == null || this.getModel() == null) {
        return;
      }

      // get all children of the target
      var items = this.getTarget().getChildren();
      // go through all items
      for (var i = 0; i < items.length; i++) {
        this._removeBindingsFrom(items[i]);
        // add the new binding
        this._bindListItem(items[i], this.__lookup(i));
      }

      // move the controllers change handler for the model to the end of the
      // listeners queue
      this.__moveChangeListenerAtTheEnd();
    },


    /*
    ---------------------------------------------------------------------------
       DELEGATE HELPER
    ---------------------------------------------------------------------------
    */
    /**
     * Helper method for applying the delegate It checks if a configureItem
     * is set end invokes the initial process to apply the given function.
     *
     * @param value {Object} The new delegate.
     * @param old {Object} The old delegate.
     */
    _setConfigureItem: function(value, old) {
      if (value != null && value.configureItem != null && this.getTarget() != null) {
        var children = this.getTarget().getChildren();
        for (var i = 0; i < children.length; i++) {
          value.configureItem(children[i]);
        }
      }
    },


    /**
     * Helper method for applying the delegate It checks if a bindItem
     * is set end invokes the initial process to apply the given function.
     *
     * @param value {Object} The new delegate.
     * @param old {Object} The old delegate.
     */
    _setBindItem: function(value, old) {
      // if a new bindItem function is set
      if (value != null && value.bindItem != null) {
        // do nothing if the bindItem function did not change
        if (old != null && old.bindItem != null && value.bindItem == old.bindItem) {
          return;
        }
        this.__renewBindings();
      }
    },


    /**
     * Helper method for applying the delegate It checks if a createItem
     * is set end invokes the initial process to apply the given function.
     *
     * @param value {Object} The new delegate.
     * @param old {Object} The old delegate.
     */
    _setCreateItem: function(value, old) {
      if (
        this.getTarget() == null ||
        this.getModel() == null ||
        value == null ||
        value.createItem == null
      ) {
        return;
      }
      this._startSelectionModification();

      // remove all bindings
      var children = this.getTarget().getChildren();
      for (var i = 0, l = children.length; i < l; i++) {
        this._removeBindingsFrom(children[i]);
      }

      // remove all elements of the target
      var removed = this.getTarget().removeAll();
      for (var i=0; i<removed.length; i++) {
        removed[i].destroy();
      }

      // update
      this.update();

      this._endSelectionModification();
      this._updateSelection();
    },


    /**
     * Apply-Method for setting the filter. It removes all bindings,
     * check if the length has changed and adds or removes the items in the
     * target. After that, the bindings will be set up again and the selection
     * will be updated.
     *
     * @param value {Function|null} The new filter function.
     * @param old {Function|null} The old filter function.
     */
    _setFilter: function(value, old) {
      // update the filter if it has been removed
      if ((value == null || value.filter == null) &&
          (old != null && old.filter != null)) {
        this.__removeFilter();
      }

      // check if it is necessary to do anything
      if (
        this.getTarget() == null ||
        this.getModel() == null ||
        value == null ||
        value.filter == null
      ) {
        return;
      }
      // if yes, continue

      this._startSelectionModification();

      // remove all bindings
      var children = this.getTarget().getChildren();
      for (var i = 0, l = children.length; i < l; i++) {
        this._removeBindingsFrom(children[i]);
      }

      // store the old lookup table
      var oldTable = this.__lookupTable;
      // generate a new lookup table
      this.__buildUpLookupTable();

      // if there are lesser items
      if (oldTable.length > this.__lookupTable.length) {
        // remove the unnecessary items
        for (var j = oldTable.length; j > this.__lookupTable.length; j--) {
          this.getTarget().removeAt(j - 1).destroy();
        }
      // if there are more items
      } else if (oldTable.length < this.__lookupTable.length) {
        // add the new elements
        for (var j = oldTable.length; j < this.__lookupTable.length; j++) {
          var tempItem = this._createItem();
          this.getTarget().add(tempItem);
        }
      }

      // bind every list item again
      var listItems = this.getTarget().getChildren();
      for (var i = 0; i < listItems.length; i++) {
        this._bindListItem(listItems[i], this.__lookup(i));
      }

      // move the controllers change handler for the model to the end of the
      // listeners queue
      this.__moveChangeListenerAtTheEnd();

      this._endSelectionModification();
      this._updateSelection();
    },


    /**
     * This helper is responsible for removing the filter and setting the
     * controller to a valid state without a filtering.
     */
    __removeFilter : function()
    {
      // renew the index lookup table
      this.__buildUpLookupTable();
      // check for the new length
      this.__changeModelLength();
      // renew the bindings
      this.__renewBindings();

      // need an asynchronous selection update because the bindings have to be
      // executed to update the selection probably (using the widget queue)
      this.__syncModelSelection = true;
      qx.ui.core.queue.Widget.add(this);
    },


    /*
    ---------------------------------------------------------------------------
       LOOKUP STUFF
    ---------------------------------------------------------------------------
    */
    /**
     * Helper-Method which builds up the index lookup for the filter feature.
     * If no filter is set, the lookup table will be a 1:1 mapping.
     */
    __buildUpLookupTable: function() {
      var model = this.getModel();
      if (model == null) {
        return;
      }
      var delegate = this.getDelegate();
      if (delegate != null) {
        var filter = delegate.filter;
      }

      this.__lookupTable = [];
      for (var i = 0; i < model.getLength(); i++) {
        if (filter == null || filter(model.getItem(i))) {
          this.__lookupTable.push(i);
        }
      }
    },


    /**
     * Function for accessing the lookup table.
     *
     * @param index {Integer} The index of the lookup table.
     * @return {Number} Item index from lookup table
     */
    __lookup: function(index) {
      return this.__lookupTable[index];
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

   destruct : function() {
     this.__lookupTable = this.__onUpdate = this.__boundProperties = null;
     this.__boundPropertiesReverse = null;

     // remove yourself from the widget queue
     qx.ui.core.queue.Widget.remove(this);
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
 * A item for a list. Could be added to all List like widgets but also
 * to the {@link qx.ui.form.SelectBox} and {@link qx.ui.form.ComboBox}.
 */
qx.Class.define("qx.ui.form.ListItem",
{
  extend : qx.ui.basic.Atom,
  implement : [qx.ui.form.IModel],
  include : [qx.ui.form.MModelProperty],



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String} Label to use
   * @param icon {String?null} Icon to use
   * @param model {String?null} The items value
   */
  construct : function(label, icon, model)
  {
    this.base(arguments, label, icon);

    if (model != null) {
      this.setModel(model);
    }

    this.addListener("mouseover", this._onMouseOver, this);
    this.addListener("mouseout", this._onMouseOut, this);
  },




  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events:
  {
    /** (Fired by {@link qx.ui.form.List}) */
    "action" : "qx.event.type.Event"
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    appearance :
    {
      refine : true,
      init : "listitem"
    }
  },


  members :
  {
    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      focused : true,
      hovered : true,
      selected : true,
      dragover : true
    },


    /**
     * Event handler for the mouse over event.
     */
    _onMouseOver : function() {
      this.addState("hovered");
    },


    /**
     * Event handler for the mouse out event.
     */
    _onMouseOut : function() {
      this.removeState("hovered");
    }
  },

  destruct : function() {
    this.removeListener("mouseover", this._onMouseOver, this);
    this.removeListener("mouseout", this._onMouseOut, this);
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

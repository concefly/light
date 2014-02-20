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
 * Mixin for the selection in the data binding controller.
 * It contains an selection property which can be manipulated.
 * Remember to call the method {@link #_addChangeTargetListener} on every
 * change of the target.
 * It is also important that the elements stored in the target e.g. ListItems
 * do have the corresponding model stored as user data under the "model" key.
 */
qx.Mixin.define("qx.data.controller.MSelection",
{

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    // check for a target property
    if (!qx.Class.hasProperty(this.constructor, "target")) {
      throw new Error("Target property is needed.");
    }

    // create a default selection array
    if (this.getSelection() == null) {
      this.__ownSelection = new qx.data.Array();
      this.setSelection(this.__ownSelection);
    }
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties : {
    /**
     * Data array containing the selected model objects. This property can be
     * manipulated directly which means that a push to the selection will also
     * select the corresponding element in the target.
     */
    selection :
    {
      check: "qx.data.Array",
      event: "changeSelection",
      apply: "_applySelection",
      init: null
    }
  },


  events : {
    /**
     * This event is fired as soon as the content of the selection property changes, but
     * this is not equal to the change of the selection of the widget. If the selection
     * of the widget changes, the content of the array stored in the selection property
     * changes. This means you have to listen to the change event of the selection array
     * to get an event as soon as the user changes the selected item.
     * <pre class="javascript">obj.getSelection().addListener("change", listener, this);</pre>
     */
    "changeSelection" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // private members //
    // set the semaphore-like variable for the selection change
    _modifingSelection : 0,
    __selectionListenerId : null,
    __selectionArrayListenerId : null,
    __ownSelection : null,

    /*
    ---------------------------------------------------------------------------
       APPLY METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * Apply-method for setting a new selection array. Only the change listener
     * will be removed from the old array and added to the new.
     *
     * @param value {qx.data.Array} The new data array for the selection.
     * @param old {qx.data.Array|null} The old data array for the selection.
     */
    _applySelection: function(value, old) {
      // remove the old listener if necessary
      if (this.__selectionArrayListenerId != undefined && old != undefined) {
        old.removeListenerById(this.__selectionArrayListenerId);
      }
      // add a new change listener to the changeArray
      this.__selectionArrayListenerId = value.addListener(
        "change", this.__changeSelectionArray, this
      );

      // apply the new selection
      this._updateSelection();
    },


    /*
    ---------------------------------------------------------------------------
       EVENT HANDLER
    ---------------------------------------------------------------------------
    */
    /**
     * Event handler for the change of the data array holding the selection.
     * If a change is in the selection array, the selection update will be
     * invoked.
     */
    __changeSelectionArray: function() {
      this._updateSelection();
    },


    /**
     * Event handler for a change in the target selection.
     * If the selection in the target has changed, the selected model objects
     * will be found and added to the selection array.
     */
    _changeTargetSelection: function() {
      // dont do anything without a target
      if (this.getTarget() == null) {
        return;
      }

      // if a selection API is supported
      if (!this.__targetSupportsMultiSelection()
        && !this.__targetSupportsSingleSelection()) {
        return;
      }

      // if __changeSelectionArray is currently working, do nothing
      if (this._inSelectionModification()) {
        return;
      }

      // get both selections
      var targetSelection = this.getTarget().getSelection();
      var selection = this.getSelection();
      if (selection == null) {
        selection = new qx.data.Array();
        this.__ownSelection = selection;
        this.setSelection(selection);
      }

      // go through the target selection
      var spliceArgs = [0, selection.getLength()];
      for (var i = 0; i < targetSelection.length; i++) {
        spliceArgs.push(targetSelection[i].getModel());
      }
      // use splice to ensure a correct change event [BUG #4728]
      selection.splice.apply(selection, spliceArgs).dispose();

      // fire the change event manually
      this.fireDataEvent("changeSelection", this.getSelection());
    },


    /*
    ---------------------------------------------------------------------------
       SELECTION
    ---------------------------------------------------------------------------
    */
    /**
     * Helper method which should be called by the classes including this
     * Mixin when the target changes.
     *
     * @param value {qx.ui.core.Widget|null} The new target.
     * @param old {qx.ui.core.Widget|null} The old target.
     */
    _addChangeTargetListener: function(value, old) {
      // remove the old selection listener
      if (this.__selectionListenerId != undefined && old != undefined) {
        old.removeListenerById(this.__selectionListenerId);
      }

      if (value != null) {
        // if a selection API is supported
        if (
          this.__targetSupportsMultiSelection()
          || this.__targetSupportsSingleSelection()
        ) {
          // add a new selection listener
          this.__selectionListenerId = value.addListener(
            "changeSelection", this._changeTargetSelection, this
          );
        }
      }
    },


    /**
     * Method for updating the selection. It checks for the case of single or
     * multi selection and after that checks if the selection in the selection
     * array is the same as in the target widget.
     */
    _updateSelection: function() {
      // do not update if no target is given
      if (!this.getTarget()) {
        return;
      }
      // mark the change process in a flag
      this._startSelectionModification();

      // if its a multi selection target
      if (this.__targetSupportsMultiSelection()) {

        var targetSelection = [];
        // go through the selection array
        for (var i = 0; i < this.getSelection().length; i++) {
          // store each item
          var model = this.getSelection().getItem(i);
          var selectable = this.__getSelectableForModel(model);
          if (selectable != null) {
            targetSelection.push(selectable);
          }
        }
        this.getTarget().setSelection(targetSelection);

        // get the selection of the target
        targetSelection = this.getTarget().getSelection();
        // get all items selected in the list
        var targetSelectionItems = [];
        for (var i = 0; i < targetSelection.length; i++) {
          targetSelectionItems[i] = targetSelection[i].getModel();
        }

        // go through the controller selection
        for (var i = this.getSelection().length - 1; i >= 0; i--) {
          // if the item in the controller selection is not selected in the list
          if (!qx.lang.Array.contains(
            targetSelectionItems, this.getSelection().getItem(i)
          )) {
            // remove the current element and get rid of the return array
            this.getSelection().splice(i, 1).dispose();
          }
        }

      // if its a single selection target
      } else if (this.__targetSupportsSingleSelection()) {
        // get the model which should be selected
        var item = this.getSelection().getItem(this.getSelection().length - 1);
        if (item !== undefined) {
          // select the last selected item (old selection will be removed anyway)
          this.__selectItem(item);
          // remove the other items from the selection data array and get
          // rid of the return array
          this.getSelection().splice(
            0, this.getSelection().getLength() - 1
          ).dispose();
        } else {
          // if there is no item to select (e.g. new model set [BUG #4125]),
          // reset the selection
          this.getTarget().resetSelection();
        }

      }

      // reset the changing flag
      this._endSelectionModification();
    },


    /**
     * Helper-method returning true, if the target supports multi selection.
     * @return {Boolean} true, if the target supports multi selection.
     */
    __targetSupportsMultiSelection: function() {
      var targetClass = this.getTarget().constructor;
      return qx.Class.implementsInterface(targetClass, qx.ui.core.IMultiSelection);
    },


    /**
     * Helper-method returning true, if the target supports single selection.
     * @return {Boolean} true, if the target supports single selection.
     */
    __targetSupportsSingleSelection: function() {
      var targetClass = this.getTarget().constructor;
      return qx.Class.implementsInterface(targetClass, qx.ui.core.ISingleSelection);
    },


    /**
     * Internal helper for selecting an item in the target. The item to select
     * is defined by a given model item.
     *
     * @param item {qx.core.Object} A model element.
     */
    __selectItem: function(item) {
      var selectable = this.__getSelectableForModel(item);
      // if no selectable could be found, just return
      if (selectable == null) {
        return;
      }
      // if the target is multi selection able
      if (this.__targetSupportsMultiSelection()) {
        // select the item in the target
        this.getTarget().addToSelection(selectable);
      // if the target is single selection able
      } else if (this.__targetSupportsSingleSelection()) {
        this.getTarget().setSelection([selectable]);
      }
    },


    /**
     * Returns the list item storing the given model in its model property.
     *
     * @param model {var} The representing model of a selectable.
     * @return {Object|null} List item or <code>null</code> if none was found
     */
    __getSelectableForModel : function(model)
    {
      // get all list items
      var children = this.getTarget().getSelectables(true);

      // go through all children and search for the child to select
      for (var i = 0; i < children.length; i++) {
        if (children[i].getModel() == model) {
          return children[i];
        }
      }
      // if no selectable was found
      return null;
    },


    /**
     * Helper-Method signaling that currently the selection of the target is
     * in change. That will block the change of the internal selection.
     * {@link #_endSelectionModification}
     */
    _startSelectionModification: function() {
      this._modifingSelection++;
    },


    /**
     * Helper-Method signaling that the internal changing of the targets
     * selection is over.
     * {@link #_startSelectionModification}
     */
    _endSelectionModification: function() {
      this._modifingSelection > 0 ? this._modifingSelection-- : null;
    },


    /**
     * Helper-Method for checking the state of the selection modification.
     * {@link #_startSelectionModification}
     * {@link #_endSelectionModification}
     * @return {Boolean} <code>true</code> if selection modification is active
     */
    _inSelectionModification: function() {
      return this._modifingSelection > 0;
    }

  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (this.__ownSelection) {
      this.__ownSelection.dispose();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Interface for data binding classes offering a selection.
 */
qx.Interface.define("qx.data.controller.ISelection",
{
  members :
  {
    /**
     * Setter for the selection.
     * @param value {qx.data.IListData} The data of the selection.
     */
    setSelection : function(value) {},


    /**
     * Getter for the selection list.
     * @return {qx.data.IListData} The current selection.
     */
    getSelection : function() {},


    /**
     * Resets the selection to its default value.
     */
    resetSelection : function() {}
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
 * <h2>Tree Controller</h2>
 *
 * *General idea*
 *
 * The tree controller is the controller made for the {@link qx.ui.tree.Tree}
 * widget in qooxdoo. Therefore, it is responsible for creating and adding the
 * tree folders to the tree given as target.
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
 * As model, you can use every qooxdoo widget structure having one property,
 * which is a data array holding the children of the current node. There can
 * be as many additional as you like.
 * You need to specify a model, a target, a child path and a label path to
 * make the controller work.
 *
 * *Cross reference*
 *
 * * If you want to bind single values, use {@link qx.data.controller.Object}
 * * If you want to bind a list like widget, use {@link qx.data.controller.List}
 * * If you want to bin a form widget, use {@link qx.data.controller.Form}
 */
qx.Class.define("qx.data.controller.Tree",
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
   * @param model {qx.core.Object?null} The root element of the model, which holds
   *   the data.
   *
   * @param target {qx.ui.tree.Tree?null} The target widgets which should be a tree.
   *
   * @param childPath {String?null} The name of the property in the model, which
   *   holds the data array containing the children.
   *
   * @param labelPath {String?null} The name of the property in the model,
   *   which holds the value to be displayed as the label of the tree items.
   */
  construct : function(model, target, childPath, labelPath)  {
    this.base(arguments);

    // internal bindings reference
    this.__bindings = {};
    this.__boundProperties = [];

    // reference to the child
    this.__childrenRef = {};

    if (childPath != null) {
      this.setChildPath(childPath);
    }
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
    /** The root element of the data. */
    model :
    {
      check: "qx.core.Object",
      apply: "_applyModel",
      event: "changeModel",
      nullable: true,
      dereference: true
    },


    /** The tree to bind the data to. */
    target :
    {
      apply: "_applyTarget",
      event: "changeTarget",
      init: null,
      nullable: true,
      dereference: true
    },


    /** The name of the property, where the children are stored in the model. */
    childPath :
    {
      check: "String",
      apply: "_applyChildPath",
      nullable: true
    },


    /**
     * The name of the property, where the value for the tree folders label
     * is stored in the model classes.
     */
    labelPath :
    {
      check: "String",
      apply: "_applyLabelPath",
      nullable: true
    },


    /**
     * The name of the property, where the source for the tree folders icon
     * is stored in the model classes.
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
     * Delegation object, which can have one ore more function defined by the
     * {@link IControllerDelegate} interface.
     */
    delegate :
    {
      apply: "_applyDelegate",
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
    __childrenRef : null,
    __bindings : null,
    __boundProperties : null,
    __oldChildrenPath : null,


    /*
    ---------------------------------------------------------------------------
       APPLY METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * If a new delegate is set, it applies the stored configuration for the
     * tree folder to the already created folders once.
     *
     * @param value {qx.core.Object|null} The new delegate.
     * @param old {qx.core.Object|null} The old delegate.
     */
    _applyDelegate: function(value, old) {
      this._setConfigureItem(value, old);
      this._setCreateItem(value, old);
      this._setBindItem(value, old);
    },


    /**
     * Apply-method which will be called after the icon options had been
     * changed. This method will invoke a renewing of all bindings.
     *
     * @param value {Map|null} The new options map.
     * @param old {Map|null} The old options map.
     */
    _applyIconOptions: function(value, old) {
      this.__renewBindings();
    },


    /**
     * Apply-method which will be called after the label options had been
     * changed. This method will invoke a renewing of all bindings.
     *
     * @param value {Map|null} The new options map.
     * @param old {Map|null} The old options map.
     */
    _applyLabelOptions: function(value, old) {
      this.__renewBindings();
    },


    /**
     * Apply-method which will be called after the target had been
     * changed. This method will clean up the old tree and will initially
     * build up the new tree containing the data from the model.
     *
     * @param value {qx.ui.tree.Tree|null} The new tree.
     * @param old {qx.ui.tree.Tree|null} The old tree.
     */
    _applyTarget: function(value, old) {
      // if there was an old target
      if (old != undefined) {
        this.__emptyTarget(old);
      }

      // if a model is set
      if (this.getModel() != null) {
        // build up the tree
        this.__buildTree();
      }

      // add a listener for the target change
      this._addChangeTargetListener(value, old);
    },


    /**
     * Apply-method which will be called after the model had been
     * changed. This method invoke a new building of the tree.
     *
     * @param value {qx.core.Object|null} The new tree.
     * @param old {qx.core.Object|null} The old tree.
     */
    _applyModel: function(value, old) {
      this.__buildTree();
    },


    /**
     * Apply-method which will be called after the child path had been
     * changed. This method invoke a new building of the tree.
     *
     * @param value {String|null} The new path to the children property.
     * @param old {String|null} The old path to the children property.
     */
    _applyChildPath: function(value, old) {
      // save the old name because it is needed to remove the old bindings
      this.__oldChildrenPath = old;
      this.__buildTree();
      // reset the old name
      this.__oldChildrenPath = null;
    },


    /**
     * Apply-method which will be called after the icon path had been
     * changed. This method invoke a new building of the tree.
     *
     * @param value {String|null} The new path to the icon property.
     * @param old {String|null} The old path or the icon property.
     */
    _applyIconPath: function(value, old) {
      this.__renewBindings();
    },


    /**
     * Apply-method which will be called after the label path had been
     * changed. This method invoke a new building of the tree.
     *
     * @param value {String|null} The new path to the label property.
     * @param old {String|null} The old path of the label property.
     */
    _applyLabelPath: function(value, old) {
      this.__buildTree();
    },


    /*
    ---------------------------------------------------------------------------
       EVENT HANDLER
    ---------------------------------------------------------------------------
    */
    /**
     * Handler function handling the change of a length of a children array.
     * This method invokes a rebuild of the corresponding subtree.
     *
     * @param ev {qx.event.type.Event} The changeLength event of a data array.
     */
    __changeModelChildren: function(ev) {
      // get the stored data
      var children =  ev.getTarget();
      var treeNode = this.__childrenRef[children.toHashCode()].treeNode;
      var modelNode = this.__childrenRef[children.toHashCode()].modelNode;
      // update the subtree
      this.__updateTreeChildren(treeNode, modelNode);

      // update the selection in case a selected element has been removed
      this._updateSelection();
    },


    /**
     * Handler function taking care of the changes of the children array itself.
     *
     * @param e {qx.event.type.Data} Change event for the children property.
     */
    __changeChildrenArray: function(e) {
      var children = e.getData();
      var oldChildren = e.getOldData();

      // get the old ref and delete it
      var oldRef = this.__childrenRef[oldChildren.toHashCode()];
      oldChildren.removeListenerById(oldRef.changeListenerId);
      delete this.__childrenRef[oldChildren.toHashCode()];
      // remove the old change listener for the children
      oldRef.modelNode.removeListenerById(oldRef.changeChildernListenerId);

      // add a new change listener
      var modelNode = oldRef.modelNode;
      var property = qx.Class.getPropertyDefinition(
        oldRef.modelNode.constructor, this.getChildPath()
      );
      var eventName = property.event;
      var changeChildernListenerId = modelNode.addListener(
        eventName, this.__changeChildrenArray, this
      );

      // add the new ref
      var treeNode = oldRef.treeNode;
      this.__childrenRef[children.toHashCode()] =
      {
        modelNode: modelNode,
        treeNode: treeNode,
        changeListenerId: oldRef.changeListenerId,
        changeChildernListenerId : changeChildernListenerId
      };

      // update the subtree
      this.__updateTreeChildren(treeNode, modelNode);

      // update the selection in case a selected element has been removed
      this._updateSelection();
    },


    /*
    ---------------------------------------------------------------------------
       ITEM HANDLING
    ---------------------------------------------------------------------------
    */
    /**
     * Creates a TreeFolder and delegates the configure method if a delegate is
     * set and the needed function (configureItem) is available.
     *
     * @return {qx.ui.tree.core.AbstractTreeItem} The created and configured TreeFolder.
     */
    _createItem: function() {
      var delegate = this.getDelegate();
      // check if a delegate and a create method is set
      if (delegate != null && delegate.createItem != null) {
        var item = delegate.createItem();
      } else {
        var item = new qx.ui.tree.TreeFolder();
      }

      // check if a delegate is set and if the configure function is available
      if (delegate != null && delegate.configureItem != null) {
        delegate.configureItem(item);
      }
      return item;
    },


    /**
     * Internal helper function to build up the tree corresponding to the data
     * stored in the model. This function creates the root node and hands the
     * recursive creation of all subtrees to the {#__updateTreeChildren}
     * function.
     */
    __buildTree: function() {
      // only fill the target if there is a target, its known how to
      // access the children and what needs to be displayed as label
      if (this.getTarget() == null || this.getChildPath() == null) {
        return;
      }

      // check for the binding knowledge
      if (
        (this.getLabelPath() == null && this.getDelegate() == null)
        || (this.getLabelPath() == null && this.getDelegate() != null && this.getDelegate().bindItem == null)
      ) {
        return;
      }

      // Clean the target completely
      this.__emptyTarget();

      // only build up a new tree if a model is given
      if (this.getModel() != null) {
        // create a new root node
        var rootNode = this._createItem();
        rootNode.setModel(this.getModel());
        // bind the root node
        this.__addBinding(this.getModel(), rootNode);
        this.__updateTreeChildren(rootNode, this.getModel());
        // assign the new root once the tree has been built
        this.getTarget().setRoot(rootNode);
      }
    },


    /**
     * Main method building up the tree folders corresponding to the given
     * model node. The new created subtree will be added to the given tree node.
     *
     * @param rootNode {qx.ui.tree.TreeFolder} The tree folder to add the new
     *   created subtree.
     *
     * @param modelNode {qx.core.Object} The model nodes which represent the
     *   data in the current subtree.
     */
    __updateTreeChildren: function(rootNode, modelNode) {
      // ignore items which don't have children
      if (modelNode["get" + qx.lang.String.firstUp(this.getChildPath())] == undefined) {
        return;
      }
      // get all children of the current model node
      var children =
        modelNode["get" + qx.lang.String.firstUp(this.getChildPath())]();

      // store the children reference
      if (this.__childrenRef[children.toHashCode()] == undefined) {
        // add the listener for the change
        var changeListenerId = children.addListener(
          "change", this.__changeModelChildren, this
        );
        // add a listener for the change of the children array itself
        var property = qx.Class.getPropertyDefinition(
          modelNode.constructor, this.getChildPath()
        );
        var eventName = property.event;
        var changeChildernListenerId = modelNode.addListener(
          eventName, this.__changeChildrenArray, this
        );
        this.__childrenRef[children.toHashCode()] =
        {
          modelNode: modelNode,
          treeNode: rootNode,
          changeListenerId: changeListenerId,
          changeChildernListenerId : changeChildernListenerId
        };
      }

      // go threw all children in the model
      for (var i = 0; i < children.length; i++) {
        // if there is no node in the tree or the current node does not fit
        if (rootNode.getChildren()[i] == null || children.getItem(i) != rootNode.getChildren()[i].getModel())
        {
          //check if the node was just moved
          for (var j = i; j < rootNode.getChildren().length; j++) {
            if (rootNode.getChildren()[j].getModel() === children.getItem(i)) {
              var oldIndex = j;
              break;
            }
          }
          // if it is in the tree
          if (oldIndex != undefined) {
            // get the corresponding node
            var currentNode = rootNode.getChildren()[oldIndex];
            // check if it is selected
            if (this.getTarget().isSelected(currentNode)) {
              var wasSelected = true;
            }
            // remove the item at its old place (will remove the selection)
            rootNode.removeAt(oldIndex);
            // add the node at the current position
            rootNode.addAt(currentNode, i);
            // select it again if it was selected
            if (wasSelected) {
              this.getTarget().addToSelection(currentNode);
            }

          // if the node is new
          } else {
            // add the child node
            var treeNode = this._createItem();
            treeNode.setModel(children.getItem(i));
            rootNode.addAt(treeNode, i);
            this.__addBinding(children.getItem(i), treeNode);

            // add all children recursive
            this.__updateTreeChildren(treeNode, children.getItem(i));
          }
        }
      }
      // remove the rest of the tree items if they exist
      for (var i = rootNode.getChildren().length -1; i >= children.length; i--) {
        var treeFolder = rootNode.getChildren()[i];
        this.__removeFolder(treeFolder, rootNode);
      }
    },


    /**
     * Removes all folders and bindings for the current set target.
     * @param tree {qx.ui.tree.Tree} The tree to empty.
     */
    __emptyTarget: function(tree) {
      if (tree == null) {
        tree = this.getTarget();
      }
      // only do something if a tree is set
      if (tree == null) {
        return;
      }
      // remove the root node
      var root = tree.getRoot();
      if (root != null) {
        tree.setRoot(null);
        this.__removeAllFolders(root);
        var model = root.getModel();
        if (model) {
          this.__removeBinding(model);
        }
        root.destroy();
        this.__childrenRef = {};
      }
    },


    /**
     * Removes all child folders of the given tree node. Also removes all
     * bindings for the removed folders.
     *
     * @param node {qx.ui.tree.core.AbstractTreeItem} The used tree folder.
     */
    __removeAllFolders: function(node) {
      var children = node.getChildren() || [];
      // remove all subchildren
      for (var i = children.length - 1; i >= 0; i--) {
        if (children[i].getChildren().length > 0) {
          this.__removeAllFolders(children[i]);
        }
        this.__removeFolder(children[i], node);
      }
    },


    /**
     * Internal helper method removing the given folder form the given root
     * node. All set bindings will be removed and the old tree folder will be
     * destroyed.
     *
     * @param treeFolder {qx.ui.tree.core.AbstractTreeItem} The folder to remove.
     * @param rootNode {qx.ui.tree.core.AbstractTreeItem} The folder holding the
     *   treeFolder.
     */
    __removeFolder: function(treeFolder, rootNode) {
      // get the model
      var model = treeFolder.getModel();
      var childPath = this.__oldChildrenPath || this.getChildPath()
      var childrenGetterName = "get" + qx.lang.String.firstUp(childPath);

      // if the model does have a child path
      if (model[childrenGetterName] != undefined)
      {
        // remove the old children listener
        var children = model[childrenGetterName]();
        var oldRef = this.__childrenRef[children.toHashCode()];
        children.removeListenerById(oldRef.changeListenerId);
        model.removeListenerById(oldRef.changeChildernListenerId);
        // also remove all its children [BUG #4296]
        this.__removeAllFolders(treeFolder);

        // delete the model reference
        delete this.__childrenRef[children.toHashCode()];
      }
      // get the binding and remove it
      this.__removeBinding(model);
      // remove the folder from the tree
      rootNode.remove(treeFolder);
      // get rid of the old tree folder
      treeFolder.destroy();
    },


    /*
    ---------------------------------------------------------------------------
       BINDING STUFF
    ---------------------------------------------------------------------------
    */
    /**
     * Helper method for binding a given property from the model to the target
     * widget.
     * This method should only be called in the
     * {@link qx.data.controller.IControllerDelegate#bindItem} function
     * implemented by the {@link #delegate} property.
     *
     * @param sourcePath {String | null} The path to the property in the model.
     *   If you use an empty string, the whole model item will be bound.
     * @param targetPath {String} The name of the property in the target
     *   widget.
     * @param options {Map | null} The options to use by
     *  {@link qx.data.SingleValueBinding#bind} for the binding.
     * @param targetWidget {qx.ui.tree.core.AbstractTreeItem} The target widget.
     * @param modelNode {var} The model node which should be bound to the target.
     */
    bindProperty: function(sourcePath, targetPath, options, targetWidget, modelNode) {
      // set up the binding
      var id = modelNode.bind(sourcePath, targetWidget, targetPath, options);
      // check for the storage for the references
      if (this.__bindings[targetPath] == null) {
        this.__bindings[targetPath] = {};
      }
      // store the binding reference
      var storage = this.__bindings[targetPath];
      if (storage[modelNode.toHashCode()]) {
        if (storage[modelNode.toHashCode()].id) {
          throw new Error(
            "Can not bind the same target property '" + targetPath + "' twice."
          );
        }
        storage[modelNode.toHashCode()].id = id;
      } else {
        storage[modelNode.toHashCode()] = {
          id: id,
          reverseId: null,
          treeNode: targetWidget
        };
      }

      // save the bound property
      if (!qx.lang.Array.contains(this.__boundProperties, targetPath)) {
        this.__boundProperties.push(targetPath);
      }
    },


    /**
     * Helper method for binding a given property from the target widget to
     * the model.
     * This method should only be called in the
     * {@link qx.data.controller.IControllerDelegate#bindItem} function
     * implemented by the {@link #delegate} property.
     *
     * @param targetPath {String | null} The path to the property in the model.
     * @param sourcePath {String} The name of the property in the target
     *   widget.
     * @param options {Map | null} The options to use by
     *   {@link qx.data.SingleValueBinding#bind} for the binding.
     * @param sourceWidget {qx.ui.tree.core.AbstractTreeItem} The source widget.
     * @param modelNode {var} The model node which should be bound to the target.
     */
    bindPropertyReverse : function(
      targetPath, sourcePath, options, sourceWidget, modelNode
    )
    {
      // set up the binding
      var id = sourceWidget.bind(sourcePath, modelNode, targetPath, options);

      // check for the storage for the references
      if (this.__bindings[sourcePath] == null) {
        this.__bindings[sourcePath] = {};
      }
      // check if there is already a stored item
      var storage = this.__bindings[sourcePath];
      if (storage[modelNode.toHashCode()]) {
        if (storage[modelNode.toHashCode()].reverseId) {
          throw new Error(
            "Can not reverse bind the same target property '" + targetPath + "' twice."
          );
        }
        storage[modelNode.toHashCode()].reverseId = id;
      } else {
        storage[modelNode.toHashCode()] = {
          id: null,
          reverseId: id,
          treeNode: sourceWidget
        };
      }

      // save the bound property
      if (!qx.lang.Array.contains(this.__boundProperties, sourcePath)) {
        this.__boundProperties.push(sourcePath);
      }
    },


    /**
     * Helper method for binding the default properties (label and icon) from
     * the model to the target widget.
     *
     * This method should only be called in the
     * {@link qx.data.controller.IControllerDelegate#bindItem} function
     * implemented by the {@link #delegate} property.
     *
     * @param treeNode {qx.ui.tree.core.AbstractTreeItem} The tree node
     *   corresponding to the model node.
     * @param modelNode {qx.core.Object} The model node holding the data.
     */
    bindDefaultProperties : function(treeNode, modelNode)
    {
      // label binding
      this.bindProperty(this.getLabelPath(), "label", this.getLabelOptions(), treeNode, modelNode);

      // icon binding
      if (this.getIconPath() != null) {
        this.bindProperty(this.getIconPath(), "icon", this.getIconOptions(), treeNode, modelNode);
      }
    },


    /**
     * Helper method renewing all bindings with the currently saved options and
     * paths.
     */
    __renewBindings: function() {
      // get the first bound property
      var firstProp;
      for (var key in this.__bindings) {
        firstProp = key;
        break;
      }
      // go through all stored bindings for that property
      // (should have all the same amount of entries and tree nodes)
      for (var hash in this.__bindings[firstProp]) {
        // get the data
        var treeNode = this.__bindings[firstProp][hash].treeNode;
        var modelNode = qx.core.ObjectRegistry.fromHashCode(hash);
        // remove the old bindings
        this.__removeBinding(modelNode);
        // add the new bindings
        this.__addBinding(modelNode, treeNode);
      }
    },


    /**
     * Internal helper method adding the right bindings from the given
     * modelNode to the given treeNode.
     *
     * @param modelNode {qx.core.Object} The model node holding the data.
     * @param treeNode {qx.ui.tree.TreeFolder} The corresponding tree folder
     *   to the model node.
     */
    __addBinding: function(modelNode, treeNode) {
      var delegate = this.getDelegate();
      // if a delegate for creating the binding is given, use it
      if (delegate != null && delegate.bindItem != null) {
        delegate.bindItem(this, treeNode, modelNode);

      // otherwise, try to bind the listItem by default
      } else {
        this.bindDefaultProperties(treeNode, modelNode);
      }
    },


    /**
     * Internal helper method for removing bindings for a given model node.
     *
     * @param modelNode {qx.core.Object} the model node for which the bindings
     *   should be removed.
     */
    __removeBinding: function(modelNode) {
      for (var i = 0; i < this.__boundProperties.length; i++) {
        var property = this.__boundProperties[i];
        var bindingsMap = this.__bindings[property][modelNode.toHashCode()];
        if (bindingsMap != null) {
          if (bindingsMap.id) {
            modelNode.removeBinding(bindingsMap.id);
            bindingsMap.id = null;
          }
          if (bindingsMap.reverseId) {
            bindingsMap.treeNode.removeBinding(bindingsMap.reverseId);
            bindingsMap.reverseId = null;
          }
          delete this.__bindings[property][modelNode.toHashCode()];
        }
      }
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
      if (
        value != null && value.configureItem != null &&
        this.getTarget() != null && this.getModel() != null
      ) {
        var children = this.getTarget().getRoot().getItems(true, true, false);
        for (var i = 0; i < children.length; i++) {
          value.configureItem(children[i]);
        }
      }
    },


    /**
     * Helper method for applying the delegate. It checks if a createItem
     * is set and invokes the initial process to apply the given function.
     *
     * @param value {Object} The new delegate.
     * @param old {Object} The old delegate.
     */
    _setCreateItem: function(value, old) {
      // do nothing if no tree can be build
      if (this.getTarget() == null || this.getModel() == null) {
        return;
      }
      // do nothing if no delegate function is set
      if (value == null || value.createItem == null) {
        return;
      }
      // do nothing it the delegate function has not changed
      if (old && old.createItem && value && value.createItem && old.createItem == value.createItem) {
        return;
      }
      this._startSelectionModification();

      this.__emptyTarget();
      this.__buildTree();

      this._endSelectionModification();
      this._updateSelection();
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
        this.__buildTree();
      }
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

   destruct : function() {
     this.setTarget(null);
     this.setModel(null);
     this.__bindings = this.__childrenRef = this.__boundProperties = null;
   }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Derrell Lipman (derrell)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * The tree folder is a tree element, which can have nested tree elements.
 */
qx.Class.define("qx.ui.tree.TreeFolder",
{
  extend : qx.ui.tree.core.AbstractTreeItem,


  properties :
  {
    appearance :
    {
      refine : true,
      init : "tree-folder"
    }
  },


  members :
  {
    // overridden
    _addWidgets : function()
    {
      this.addSpacer();
      this.addOpenButton();
      this.addIcon();
      this.addLabel();
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

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
 * <h2>Form Controller</h2>
 *
 * *General idea*
 *
 * The form controller is responsible for connecting a form with a model. If no
 * model is given, a model can be created. This created model will fit exactly
 * to the given form and can be used for serialization. All the connections
 * between the form items and the model are handled by an internal
 * {@link qx.data.controller.Object}.
 *
 * *Features*
 *
 * * Connect a form to a model (bidirectional)
 * * Create a model for a given form
 *
 * *Usage*
 *
 * The controller only works if both a controller and a model are set.
 * Creating a model will automatically set the created model.
 *
 * *Cross reference*
 *
 * * If you want to bind single values, use {@link qx.data.controller.Object}
 * * If you want to bind a list like widget, use {@link qx.data.controller.List}
 * * If you want to bind a tree widget, use {@link qx.data.controller.Tree}
 */
qx.Class.define("qx.data.controller.Form",
{
  extend : qx.core.Object,

  /**
   * @param model {qx.core.Object | null} The model to bind the target to. The
   *   given object will be set as {@link #model} property.
   * @param target {qx.ui.form.Form | null} The form which contains the form
   *   items. The given form will be set as {@link #target} property.
   * @param selfUpdate {Boolean?false} If set to true, you need to call the
   *   {@link #updateModel} method to get the data in the form to the model.
   *   Otherwise, the data will be synced automatically on every change of
   *   the form.
   */
  construct : function(model, target, selfUpdate)
  {
    this.base(arguments);

    this._selfUpdate = !!selfUpdate;
    this.__bindingOptions = {};

    if (model != null) {
      this.setModel(model);
    }

    if (target != null) {
      this.setTarget(target);
    }
  },


  properties :
  {
    /** Data object containing the data which should be shown in the target. */
    model :
    {
      check: "qx.core.Object",
      apply: "_applyModel",
      event: "changeModel",
      nullable: true,
      dereference: true
    },


    /** The target widget which should show the data. */
    target :
    {
      check: "qx.ui.form.Form",
      apply: "_applyTarget",
      event: "changeTarget",
      nullable: true,
      init: null,
      dereference: true
    }
  },


  members :
  {
    __objectController : null,
    __bindingOptions : null,


    /**
     * The form controller uses for setting up the bindings the fundamental
     * binding layer, the {@link qx.data.SingleValueBinding}. To achieve a
     * binding in both directions, two bindings are neede. With this method,
     * you have the opportunity to set the options used for the bindings.
     *
     * @param name {String} The name of the form item for which the options
     *   should be used.
     * @param model2target {Map} Options map used for the binding from model
     *   to target. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     * @param target2model {Map} Options map used for the binding from target
     *   to model. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     */
    addBindingOptions : function(name, model2target, target2model)
    {
      this.__bindingOptions[name] = [model2target, target2model];

      // return if not both, model and target are given
      if (this.getModel() == null || this.getTarget() == null) {
        return;
      }

      // renew the affected binding
      var item = this.getTarget().getItems()[name];
      var targetProperty =
        this.__isModelSelectable(item) ? "modelSelection[0]" : "value";

      // remove the binding
      this.__objectController.removeTarget(item, targetProperty, name);
      // set up the new binding with the options
      this.__objectController.addTarget(
        item, targetProperty, name, !this._selfUpdate, model2target, target2model
      );
    },


    /**
     * Creates and sets a model using the {@link qx.data.marshal.Json} object.
     * Remember that this method can only work if the form is set. The created
     * model will fit exactly that form. Changing the form or adding an item to
     * the form will need a new model creation.
     *
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     * @return {qx.core.Object} The created model.
     */
    createModel : function(includeBubbleEvents) {
      var target = this.getTarget();

      // throw an error if no target is set
      if (target == null) {
        throw new Error("No target is set.");
      }

      var items = target.getItems();
      var data = {};
      for (var name in items) {
        var names = name.split(".");
        var currentData = data;
        for (var i = 0; i < names.length; i++) {
          // if its the last item
          if (i + 1 == names.length) {
            // check if the target is a selection
            var clazz = items[name].constructor;
            var itemValue = null;
            if (qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection)) {
              // use the first element of the selection because passed to the
              // marshaler (and its single selection anyway) [BUG #3541]
              itemValue = items[name].getModelSelection().getItem(0) || null;
            } else {
              itemValue = items[name].getValue();
            }
            // call the converter if available [BUG #4382]
            if (this.__bindingOptions[name] && this.__bindingOptions[name][1]) {
              itemValue = this.__bindingOptions[name][1].converter(itemValue);
            }
            currentData[names[i]] = itemValue;
          } else {
            // if its not the last element, check if the object exists
            if (!currentData[names[i]]) {
              currentData[names[i]] = {};
            }
            currentData = currentData[names[i]];
          }
        }
      }

      var model = qx.data.marshal.Json.createModel(data, includeBubbleEvents);
      this.setModel(model);

      return model;
    },


    /**
     * Responsible for synching the data from entered in the form to the model.
     * Please keep in mind that this method only works if you create the form
     * with <code>selfUpdate</code> set to true. Otherwise, this method will
     * do nothing because updates will be synched automatically on every
     * change.
     */
    updateModel: function(){
      // only do stuff if self update is enabled and a model or target is set
      if (!this._selfUpdate || !this.getModel() || !this.getTarget()) {
        return;
      }

      var items = this.getTarget().getItems();
      for (var name in items) {
        var item = items[name];
        var sourceProperty =
          this.__isModelSelectable(item) ? "modelSelection[0]" : "value";

        var options = this.__bindingOptions[name];
        options = options && this.__bindingOptions[name][1];

        qx.data.SingleValueBinding.updateTarget(
          item, sourceProperty, this.getModel(), name, options
        );
      }
    },


    // apply method
    _applyTarget : function(value, old) {
      // if an old target is given, remove the binding
      if (old != null) {
        this.__tearDownBinding(old);
      }

      // do nothing if no target is set
      if (this.getModel() == null) {
        return;
      }

      // target and model are available
      if (value != null) {
        this.__setUpBinding();
      }
    },


    // apply method
    _applyModel : function(value, old) {

      // set the model to null to reset all items before removing them
      if (this.__objectController != null && value == null) {
        this.__objectController.setModel(null);
      }

      // first, get rid off all bindings (avoids wrong data population)
      if (this.__objectController != null) {
        var items = this.getTarget().getItems();
        for (var name in items) {
          var item = items[name];
          var targetProperty =
            this.__isModelSelectable(item) ? "modelSelection[0]" : "value";
          this.__objectController.removeTarget(item, targetProperty, name);
        }
      }

      // set the model of the object controller if available
      if (this.__objectController != null) {
        this.__objectController.setModel(value);
      }

      // do nothing is no target is set
      if (this.getTarget() == null) {
        return;
      }

      // model and target are available
      if (value != null) {
        this.__setUpBinding();
      }
    },


    /**
     * Internal helper for setting up the bindings using
     * {@link qx.data.controller.Object#addTarget}. All bindings are set
     * up bidirectional.
     */
    __setUpBinding : function() {
      // create the object controller
      if (this.__objectController == null) {
        this.__objectController = new qx.data.controller.Object(this.getModel());
      }

      // get the form items
      var items = this.getTarget().getItems();

      // connect all items
      for (var name in items) {
        var item = items[name];
        var targetProperty =
          this.__isModelSelectable(item) ? "modelSelection[0]" : "value";
        var options = this.__bindingOptions[name];

        // try to bind all given items in the form
        try {
          if (options == null) {
            this.__objectController.addTarget(item, targetProperty, name, !this._selfUpdate);
          } else {
            this.__objectController.addTarget(
              item, targetProperty, name, !this._selfUpdate, options[0], options[1]
            );
          }
        // ignore not working items
        } catch (ex) {
          if (qx.core.Environment.get("qx.debug")) {
            this.warn("Could not bind property " + name + " of " + this.getModel());
          }
        }
      }
      // make sure the initial values of the model are taken for resetting [BUG #5874]
      this.getTarget().redefineResetter();
    },


    /**
     * Internal helper for removing all set up bindings using
     * {@link qx.data.controller.Object#removeTarget}.
     *
     * @param oldTarget {qx.ui.form.Form} The form which has been removed.
     */
    __tearDownBinding : function(oldTarget) {
      // do nothing if the object controller has not been created
      if (this.__objectController == null) {
        return;
      }

      // get the items
      var items = oldTarget.getItems();

      // disconnect all items
      for (var name in items) {
        var item = items[name];
        var targetProperty =
          this.__isModelSelectable(item) ? "modelSelection[0]" : "value";
        this.__objectController.removeTarget(item, targetProperty, name);
      }
    },


    /**
     * Returns whether the given item implements
     * {@link qx.ui.core.ISingleSelection} and
     * {@link qx.ui.form.IModelSelection}.
     *
     * @param item {qx.ui.form.IForm} The form item to check.
     *
     * @return {Boolean} true, if given item fits.
     */
    __isModelSelectable : function(item) {
      return qx.Class.hasInterface(item.constructor, qx.ui.core.ISingleSelection) &&
      qx.Class.hasInterface(item.constructor, qx.ui.form.IModelSelection);
    }

  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

   destruct : function() {
     // dispose the object controller because the bindings need to be removed
     if (this.__objectController) {
       this.__objectController.dispose();
     }
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
 * <h2>Object Controller</h2>
 *
 * *General idea*
 *
 * The idea of the object controller is to make the binding of one model object
 * containing one or more properties as easy as possible. Therefore the
 * controller can take a model as property. Every property in that model can be
 * bound to one or more target properties. The binding will be for
 * atomic types only like Numbers, Strings, ...
 *
 * *Features*
 *
 * * Manages the bindings between the model properties and the different targets
 * * No need for the user to take care of the binding ids
 * * Can create an bidirectional binding (read- / write-binding)
 * * Handles the change of the model which means adding the old targets
 *
 * *Usage*
 *
 * The controller only can work if a model is set. If the model property is
 * null, the controller is not working. But it can be null on any time.
 *
 * *Cross reference*
 *
 * * If you want to bind a list like widget, use {@link qx.data.controller.List}
 * * If you want to bind a tree widget, use {@link qx.data.controller.Tree}
 * * If you want to bind a form widget, use {@link qx.data.controller.Form}
 */
qx.Class.define("qx.data.controller.Object",
{
  extend : qx.core.Object,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param model {qx.core.Object?null} The model for the model property.
   */
  construct : function(model)
  {
    this.base(arguments);

    // create a map for all created binding ids
    this.__bindings = {};
    // create an array to store all current targets
    this.__targets = [];

    if (model != null) {
      this.setModel(model);
    }
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The model object which does have the properties for the binding. */
    model :
    {
      check: "qx.core.Object",
      event: "changeModel",
      apply: "_applyModel",
      nullable: true,
      dereference: true
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
    __targets : null,
    __bindings : null,

    /**
     * Apply-method which will be called if a new model has been set.
     * All bindings will be moved to the new model.
     *
     * @param value {qx.core.Object|null} The new model.
     * @param old {qx.core.Object|null} The old model.
     */
    _applyModel: function(value, old) {
      // for every target
      for (var i = 0; i < this.__targets.length; i++) {
        // get the properties
        var targetObject = this.__targets[i][0];
        var targetProperty = this.__targets[i][1];
        var sourceProperty = this.__targets[i][2];
        var bidirectional = this.__targets[i][3];
        var options = this.__targets[i][4];
        var reverseOptions = this.__targets[i][5];

        // remove it from the old if possible
        if (old != undefined && !old.isDisposed()) {
          this.__removeTargetFrom(targetObject, targetProperty, sourceProperty, old);
        }

        // add it to the new if available
        if (value != undefined) {
          this.__addTarget(
            targetObject, targetProperty, sourceProperty, bidirectional,
            options, reverseOptions
          );
        } else {
          // in shutdown situations, it may be that something is already
          // disposed [BUG #4343]
          if (targetObject.isDisposed() || qx.core.ObjectRegistry.inShutDown) {
            continue;
          }
          // if the model is null, reset the current target
          if (targetProperty.indexOf("[") == -1) {
            targetObject["reset" + qx.lang.String.firstUp(targetProperty)]();
          } else {
            var open = targetProperty.indexOf("[");
            var index = parseInt(
              targetProperty.substring(open + 1, targetProperty.length - 1), 10
            );
            targetProperty = targetProperty.substring(0, open);
            var targetArray = targetObject["get" + qx.lang.String.firstUp(targetProperty)]();
            if (index == "last") {
              index = targetArray.length;
            }
            if (targetArray) {
              targetArray.setItem(index, null);
            }
          }
        }
      }
    },


    /**
     * Adds a new target to the controller. After adding the target, the given
     * property of the model will be bound to the targets property.
     *
     * @param targetObject {qx.core.Object} The object on which the property
     *   should be bound.
     *
     * @param targetProperty {String} The property to which the binding should
     *   go.
     *
     * @param sourceProperty {String} The name of the property in the model.
     *
     * @param bidirectional {Boolean?false} Signals if the binding should also work
     *   in the reverse direction, from the target to source.
     *
     * @param options {Map?null} The options Map used by the binding from source
     *   to target. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     *
     * @param reverseOptions {Map?null} The options used by the binding in the
     *   reverse direction. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     */
    addTarget: function(
      targetObject, targetProperty, sourceProperty,
      bidirectional, options, reverseOptions
    ) {

      // store the added target
      this.__targets.push([
        targetObject, targetProperty, sourceProperty,
        bidirectional, options, reverseOptions
      ]);

      // delegate the adding
      this.__addTarget(
        targetObject, targetProperty, sourceProperty,
        bidirectional, options, reverseOptions
      );
    },


    /**
    * Does the work for {@link #addTarget} but without saving the target
    * to the internal target registry.
    *
    * @param targetObject {qx.core.Object} The object on which the property
    *   should be bound.
    *
    * @param targetProperty {String} The property to which the binding should
    *   go.
    *
    * @param sourceProperty {String} The name of the property in the model.
    *
    * @param bidirectional {Boolean?false} Signals if the binding should also work
    *   in the reverse direction, from the target to source.
    *
    * @param options {Map?null} The options Map used by the binding from source
    *   to target. The possible options can be found in the
    *   {@link qx.data.SingleValueBinding} class.
    *
    * @param reverseOptions {Map?null} The options used by the binding in the
    *   reverse direction. The possible options can be found in the
    *   {@link qx.data.SingleValueBinding} class.
    */
    __addTarget: function(
      targetObject, targetProperty, sourceProperty,
      bidirectional, options, reverseOptions
    ) {

      // do nothing if no model is set
      if (this.getModel() == null) {
        return;
      }

      // create the binding
      var id = this.getModel().bind(
        sourceProperty, targetObject, targetProperty, options
      );
      // create the reverse binding if necessary
      var idReverse = null
      if (bidirectional) {
        idReverse = targetObject.bind(
          targetProperty, this.getModel(), sourceProperty, reverseOptions
        );
      }

      // save the binding
      var targetHash = targetObject.toHashCode();
      if (this.__bindings[targetHash] == undefined) {
        this.__bindings[targetHash] = [];
      }
      this.__bindings[targetHash].push(
        [id, idReverse, targetProperty, sourceProperty, options, reverseOptions]
      );
    },

    /**
     * Removes the target identified by the three properties.
     *
     * @param targetObject {qx.core.Object} The target object on which the
     *   binding exist.
     *
     * @param targetProperty {String} The targets property name used by the
     *   adding of the target.
     *
     * @param sourceProperty {String} The name of the property of the model.
     */
    removeTarget: function(targetObject, targetProperty, sourceProperty) {
      this.__removeTargetFrom(
        targetObject, targetProperty, sourceProperty, this.getModel()
      );

      // delete the target in the targets reference
      for (var i = 0; i < this.__targets.length; i++) {
        if (
          this.__targets[i][0] == targetObject
          && this.__targets[i][1] == targetProperty
          && this.__targets[i][2] == sourceProperty
        ) {
          this.__targets.splice(i, 1);
        }
      }
    },


    /**
     * Does the work for {@link #removeTarget} but without removing the target
     * from the internal registry.
     *
     * @param targetObject {qx.core.Object} The target object on which the
     *   binding exist.
     *
     * @param targetProperty {String} The targets property name used by the
     *   adding of the target.
     *
     * @param sourceProperty {String} The name of the property of the model.
     *
     * @param sourceObject {String} The source object from which the binding
     *   comes.
     */
    __removeTargetFrom: function(
      targetObject, targetProperty, sourceProperty, sourceObject
    ) {
      // check for not fitting targetObjects
      if (!(targetObject instanceof qx.core.Object)) {
        // just do nothing
        return;
      }

      var currentListing = this.__bindings[targetObject.toHashCode()];
      // if no binding is stored
      if (currentListing == undefined || currentListing.length == 0) {
        return;
      }

      // go threw all listings for the object
      for (var i = 0; i < currentListing.length; i++) {
        // if it is the listing
        if (
          currentListing[i][2] == targetProperty &&
          currentListing[i][3] == sourceProperty
        ) {
          // remove the binding
          var id = currentListing[i][0];
          sourceObject.removeBinding(id);
          // check for the reverse binding
          if (currentListing[i][1] != null) {
            targetObject.removeBinding(currentListing[i][1]);
          }
          // delete the entry and return
          currentListing.splice(i, 1);
          return;
        }
      }
    }
  },


  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    // set the model to null to get the bindings removed
    if (this.getModel() != null && !this.getModel().isDisposed()) {
      this.setModel(null);
    }
  }
});

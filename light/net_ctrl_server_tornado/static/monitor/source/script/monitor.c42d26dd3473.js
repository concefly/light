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
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * The JSON data store is responsible for fetching data from an url. The type
 * of the data has to be json.
 *
 * The loaded data will be parsed and saved in qooxdoo objects. Every value
 * of the loaded data will be stored in a qooxdoo property. The model classes
 * for the data will be created automatically.
 *
 * For the fetching itself it uses the {@link qx.io.request.Xhr} class and
 * for parsing the loaded javascript objects into qooxdoo objects, the
 * {@link qx.data.marshal.Json} class will be used.
 *
 * Please note that if you
 *
 * * upgrade from qooxdoo 1.4 or lower
 * * choose not to force the old transport
 * * use a delegate with qx.data.store.IStoreDelegate#configureRequest
 *
 * you probably need to change the implementation of your delegate to configure
 * the {@link qx.io.request.Xhr} request.
 *
 */
qx.Class.define("qx.data.store.Json",
{
  extend : qx.core.Object,


  /**
   * @param url {String|null} The url where to find the data. The store starts
   *   loading as soon as the URL is give. If you want to change some details
   *   concerning the request, add null here and set the URL as soon as
   *   everything is set up.
   * @param delegate {Object?null} The delegate containing one of the methods
   *   specified in {@link qx.data.store.IStoreDelegate}.
   */
  construct : function(url, delegate)
  {
    this.base(arguments);


    // store the marshaler and the delegate
    this._marshaler = new qx.data.marshal.Json(delegate);
    this._delegate = delegate;

    if (url != null) {
      this.setUrl(url);
    }
  },


  events :
  {
    /**
     * Data event fired after the model has been created. The data will be the
     * created model.
     */
    "loaded" : "qx.event.type.Data",

    /**
     * Fired when an error (aborted, timeout or failed) occurred
     * during the load. The data contains the respons of the request.
     * If you want more details, use the {@link #changeState} event.
     */
    "error" : "qx.event.type.Data"
  },


  properties :
  {
    /**
     * Property for holding the loaded model instance.
     */
    model : {
      nullable: true,
      event: "changeModel"
    },


    /**
     * The state of the request as an url. If you want to check if the request
     * did it’s job, use, the {@link #changeState} event and check for one of the
     * listed values.
     */
    state : {
      check : [
        "configured", "queued", "sending", "receiving",
        "completed", "aborted", "timeout", "failed"
      ],
      init : "configured",
      event : "changeState"
    },


    /**
     * The url where the request should go to.
     */
    url : {
      check: "String",
      apply: "_applyUrl",
      event: "changeUrl",
      nullable: true
    }
  },


  members :
  {
    _marshaler : null,
    _delegate : null,

    __request : null,

    // apply function
    _applyUrl: function(value, old) {
      if (value != null) {
        // take care of the resource management
        value = qx.util.AliasManager.getInstance().resolve(value);
        value = qx.util.ResourceManager.getInstance().toUri(value);

        this._createRequest(value);
      }
    },

    /**
     * Get request
     *
     * @return {Object} The request.
     */
    _getRequest: function() {
      return this.__request;
    },


    /**
     * Set request.
     *
     * @param request {Object} The request.
     */
    _setRequest: function(request) {
      this.__request = request;
    },


    /**
     * Creates and sends a GET request with the given url.
     *
     * Listeners will be added to respond to the request’s "success",
     * "changePhase" and "fail" event.
     *
     * @param url {String} The url for the request.
     */
    _createRequest: function(url) {
      // dispose old request
      if (this.__request) {
        this.__request.dispose();
        this.__request = null;
      }

      var req = new qx.io.request.Xhr(url);
      this._setRequest(req);

      // request json representation
      req.setAccept("application/json");

      // parse as json no matter what content type is returned
      req.setParser("json");

      // register the internal event before the user has the change to
      // register its own event in the delegate
      req.addListener("success", this._onSuccess, this);

      // check for the request configuration hook
      var del = this._delegate;
      if (del && qx.lang.Type.isFunction(del.configureRequest)) {
        this._delegate.configureRequest(req);
      }

      // map request phase to it’s own phase
      req.addListener("changePhase", this._onChangePhase, this);

      // add failed, aborted and timeout listeners
      req.addListener("fail", this._onFail, this);

      req.send();
    },


    /**
     * Handler called when request phase changes.
     *
     * Sets the store’s state.
     *
     * @param ev {qx.event.type.Data} The request’s changePhase event.
     */
    _onChangePhase : function(ev) {
      var requestPhase = ev.getData(),
          requestPhaseToStorePhase = {},
          state;

      requestPhaseToStorePhase = {
        "opened": "configured",
        "sent": "sending",
        "loading": "receiving",
        "success": "completed",
        "abort": "aborted",
        "timeout": "timeout",
        "statusError": "failed"
      };

      state = requestPhaseToStorePhase[requestPhase];
      if (state) {
        this.setState(state);
      }
    },


    /**
     * Handler called when not completing the request successfully.
     *
     * @param ev {qx.event.type.Event} The request’s fail event.
     */
    _onFail : function(ev) {
      var req = ev.getTarget();
      this.fireDataEvent("error", req);
    },


    /**
     * Handler for the completion of the requests. It invokes the creation of
     * the needed classes and instances for the fetched data using
     * {@link qx.data.marshal.Json}.
     *
     * @param ev {qx.event.type.Event} The request’s success event.
     */
    _onSuccess : function(ev)
    {
      if (this.isDisposed()) {
        return;
      }

       var req = ev.getTarget(),
           data = req.getResponse();

       // check for the data manipulation hook
       var del = this._delegate;
       if (del && qx.lang.Type.isFunction(del.manipulateData)) {
         data = this._delegate.manipulateData(data);
       }

       // create the class
       this._marshaler.toClass(data, true);

       var oldModel = this.getModel();

       // set the initial data
       this.setModel(this._marshaler.toModel(data));

       // get rid of the old model
       if (oldModel && oldModel.dispose) {
         oldModel.dispose();
       }

       // fire complete event
       this.fireDataEvent("loaded", this.getModel());

       // get rid of the request object
       if (this.__request) {
         this.__request.dispose();
         this.__request = null;
       }
    },


    /**
     * Reloads the data with the url set in the {@link #url} property.
     */
    reload: function() {
      var url = this.getUrl();
      if (url != null) {
        this._createRequest(url);
      }
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function()
  {
    if (this.__request != null) {
      this._disposeObjects("__request");
    }

    // The marshaler internally uses the singleton pattern
    // (constructor.$$instance.
    this._disposeSingletonObjects("_marshaler");
    this._delegate = null;
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
 * Defines the methods needed by every marshaler which should work with the
 * qooxdoo data stores.
 */
qx.Interface.define("qx.data.marshal.IMarshaler",
{
  members :
  {
    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code>. Two objects containing the same keys will not
     * create two different classes.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass : function(data, includeBubbleEvents) {},


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel : function(data) {}
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
 * This class is responsible for converting json data to class instances
 * including the creation of the classes.
 */
qx.Class.define("qx.data.marshal.Json",
{
  extend : qx.core.Object,
  implement : [qx.data.marshal.IMarshaler],

  /**
   * @param delegate {Object} An object containing one of the methods described
   *   in {@link qx.data.marshal.IMarshalerDelegate}.
   */
  construct : function(delegate)
  {
    this.base(arguments);

    this.__delegate = delegate;
  },

  statics :
  {
    $$instance : null,

    /**
     * Creates a qooxdoo object based on the given json data. This function
     * is just a static wrapper. If you want to configure the creation
     * process of the class, use {@link qx.data.marshal.Json} directly.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     *
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    createModel : function(data, includeBubbleEvents) {
      // singleton for the json marshaler
      if (this.$$instance === null) {
        this.$$instance = new qx.data.marshal.Json();
      }
      // be sure to create the classes first
      this.$$instance.toClass(data, includeBubbleEvents);
      // return the model
      return this.$$instance.toModel(data);
    }
  },


  members :
  {
    __delegate : null,


    /**
     * Converts a given object into a hash which will be used to identify the
     * classes under the namespace <code>qx.data.model</code>.
     *
     * @param data {Object} The JavaScript object from which the hash is
     *   required.
     * @return {String} The hash representation of the given JavaScript object.
     */
    __jsonToHash: function(data) {
      return Object.keys(data).sort().join('"');
    },


    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code> and the hash of the data created by
     * {@link #__jsonToHash}. Two objects containing the same keys will not
     * create two different classes. The class creation process also supports
     * the functions provided by its delegate.
     *
     * Important, please keep in mind that only valid JavaScript identifiers
     * can be used as keys in the data map. For convenience '-' in keys will
     * be removed (a-b will be ab in the end).
     *
     * @see qx.data.store.IStoreDelegate
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass: function(data, includeBubbleEvents) {
      this.__toClass(data, includeBubbleEvents, null, 0);
    },


    /**
     * Implementation of {@link #toClass} used for recursion.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     */
    __toClass : function(data, includeBubbleEvents, parentProperty, depth) {
      // break on all primitive json types and qooxdoo objects
      if (
        !qx.lang.Type.isObject(data)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        // check for arrays
        if (data instanceof Array || qx.Bootstrap.getClass(data) == "Array") {
          for (var i = 0; i < data.length; i++) {
            this.__toClass(data[i], includeBubbleEvents, null, depth+1);
          }
        }

        // ignore arrays and primitive types
        return;
      }

      var hash = this.__jsonToHash(data);

      // ignore rules
      if (this.__ignore(hash, parentProperty, depth)) {
        return;
      }

      // check for the possible child classes
      for (var key in data) {
        this.__toClass(data[key], includeBubbleEvents, key, depth+1);
      }

      // class already exists
      if (qx.Class.isDefined("qx.data.model." + hash)) {
        return;
      }

      // class is defined by the delegate
      if (
        this.__delegate
        && this.__delegate.getModelClass
        && this.__delegate.getModelClass(hash, data) != null
      ) {
        return;
      }

      // create the properties map
      var properties = {};
      // include the disposeItem for the dispose process.
      var members = {__disposeItem : this.__disposeItem};
      for (var key in data) {
        // apply the property names mapping
        if (this.__delegate && this.__delegate.getPropertyMapping) {
          key = this.__delegate.getPropertyMapping(key, hash);
        }

        // stip the unwanted characters
        key = key.replace(/-|\.|\s+/g, "");
        // check for valid JavaScript identifier (leading numbers are ok)
        if (qx.core.Environment.get("qx.debug")) {
          this.assertTrue((/^[$0-9A-Za-z_]*$/).test(key),
          "The key '" + key + "' is not a valid JavaScript identifier.")
        }

        properties[key] = {};
        properties[key].nullable = true;
        properties[key].event = "change" + qx.lang.String.firstUp(key);
        // bubble events
        if (includeBubbleEvents) {
          properties[key].apply = "_applyEventPropagation";
        }
        // validation rules
        if (this.__delegate && this.__delegate.getValidationRule) {
          var rule = this.__delegate.getValidationRule(hash, key);
          if (rule) {
            properties[key].validate = "_validate" + key;
            members["_validate" + key] = rule;
          }
        }
      }

      // try to get the superclass, qx.core.Object as default
      if (this.__delegate && this.__delegate.getModelSuperClass) {
        var superClass =
          this.__delegate.getModelSuperClass(hash) || qx.core.Object;
      } else {
        var superClass = qx.core.Object;
      }

      // try to get the mixins
      var mixins = [];
      if (this.__delegate && this.__delegate.getModelMixins) {
        var delegateMixins = this.__delegate.getModelMixins(hash);
        // check if its an array
        if (!qx.lang.Type.isArray(delegateMixins)) {
          if (delegateMixins != null) {
            mixins = [delegateMixins];
          }
        } else {
          mixins = delegateMixins;
        }
      }

      // include the mixin for the event bubbling
      if (includeBubbleEvents) {
        mixins.push(qx.data.marshal.MEventBubbling);
      }

      // create the map for the class
      var newClass = {
        extend : superClass,
        include : mixins,
        properties : properties,
        members : members,
        destruct : this.__disposeProperties
      };

      qx.Class.define("qx.data.model." + hash, newClass);
    },


    /**
     * Destructor for all created classes which disposes all stuff stored in
     * the properties.
     */
    __disposeProperties : function() {
      var properties = qx.util.PropertyUtil.getAllProperties(this.constructor);
      for (var desc in properties) {
        this.__disposeItem(this.get(properties[desc].name));
      };
    },


    /**
     * Helper for disposing items of the created class.
     *
     * @param item {var} The item to dispose.
     */
    __disposeItem : function(item) {
      if (!(item instanceof qx.core.Object)) {
        // ignore all non objects
        return;
      }
      // ignore already disposed items (could happen during shutdown)
      if (item.isDisposed()) {
        return;
      }
      item.dispose();
    },


    /**
     * Creates an instance for the given data hash.
     *
     * @param hash {String} The hash of the data for which an instance should
     *   be created.
     * @param data {Map} The data for which an instance should be created.
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    __createInstance: function(hash, data) {
      var delegateClass;
      // get the class from the delegate
      if (this.__delegate && this.__delegate.getModelClass) {
        delegateClass = this.__delegate.getModelClass(hash, data);
      }
      if (delegateClass != null) {
        return (new delegateClass());
      } else {
        var className = "qx.data.model." + hash;
        var clazz = qx.Class.getByName(className);
        if (!clazz) {
          throw new Error("Class '" + className + "' could not be found.");
        }
        return (new clazz());
      }
    },


    /**
     * Helper to decide if the delegate decides to ignore a data set.
     * @param hash {String} The property names.
     * @param parentProperty {String|null} The name of the property the data
     *   will be stored in.
     * @param depth {Number} The depth of the object relative to the data root.
     * @return {Boolean} <code>true</code> if the set should be ignored
     */
    __ignore : function(hash, parentProperty, depth) {
      var del = this.__delegate;
      return del && del.ignore && del.ignore(hash, parentProperty, depth);
    },


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method. The creation
     * of the class itself is delegated to the {@link #__createInstance} method,
     * which could use the {@link qx.data.store.IStoreDelegate} methods, if
     * given.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel: function(data) {
      return this.__toModel(data, null, 0);
    },


    /**
     * Implementation of {@link #toModel} used for recursion.
     *
     * @param data {Object} The object for which models should be created.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     * @return {qx.core.Object} The created model object.
     */
    __toModel: function(data, parentProperty, depth) {
      var isObject = qx.lang.Type.isObject(data);
      var isArray = data instanceof Array || qx.Bootstrap.getClass(data) == "Array";

      if (
        (!isObject && !isArray)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        return data;

      // ignore rules
      } else if (this.__ignore(this.__jsonToHash(data), parentProperty, depth)) {
        return data;

      } else if (isArray) {
        var array = new qx.data.Array();
        // set the auto dispose for the array
        array.setAutoDisposeItems(true);

        for (var i = 0; i < data.length; i++) {
          array.push(this.__toModel(data[i], null, depth+1));
        }
        return array;

      } else if (isObject) {
        // create an instance for the object
        var hash = this.__jsonToHash(data);
        var model = this.__createInstance(hash, data);

        // go threw all element in the data
        for (var key in data) {
          // apply the property names mapping
          var propertyName = key;
          if (this.__delegate && this.__delegate.getPropertyMapping) {
            propertyName = this.__delegate.getPropertyMapping(key, hash);
          }
          var propertyNameReplaced = propertyName.replace(/-|\.|\s+/g, "");
          // warn if there has been a replacement
          if (
            (qx.core.Environment.get("qx.debug")) &&
            qx.core.Environment.get("qx.debug.databinding")
          ) {
            if (propertyNameReplaced != propertyName) {
              this.warn(
                "The model contained an illegal name: '" + key +
                "'. Replaced it with '" + propertyName + "'."
              );
            }
          }
          propertyName = propertyNameReplaced;
          // only set the properties if they are available [BUG #5909]
          var setterName = "set" + qx.lang.String.firstUp(propertyName);
          if (model[setterName]) {
            model[setterName](this.__toModel(data[key], key, depth+1));
          }
        }
        return model;
      }

      throw new Error("Unsupported type!");
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this.__delegate = null;
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
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * AbstractRequest serves as a base class for {@link qx.io.request.Xhr}
 * and {@link qx.io.request.Jsonp}. It contains methods to conveniently
 * communicate with transports found in {@link qx.bom.request}.
 *
 * The general procedure to derive a new request is to choose a
 * transport (override {@link #_createTransport}) and link
 * the transport’s response (override {@link #_getParsedResponse}).
 * The transport must implement {@link qx.bom.request.IRequest}.
 *
 * To adjust the behavior of {@link #send} override
 * {@link #_getConfiguredUrl} and {@link #_getConfiguredRequestHeaders}.
 */
qx.Class.define("qx.io.request.AbstractRequest",
{
  type : "abstract",

  extend : qx.core.Object,

  /**
   * @param url {String?} The URL of the resource to request.
   */
  construct : function(url)
  {
    this.base(arguments);

    if (url !== undefined) {
      this.setUrl(url);
    }

    this.__requestHeaders = {};

    var transport = this._transport = this._createTransport();
    this._setPhase("unsent");

    this.__onReadyStateChangeBound = qx.lang.Function.bind(this._onReadyStateChange, this);
    this.__onLoadBound = qx.lang.Function.bind(this._onLoad, this);
    this.__onLoadEndBound = qx.lang.Function.bind(this._onLoadEnd, this);
    this.__onAbortBound = qx.lang.Function.bind(this._onAbort, this);
    this.__onTimeoutBound = qx.lang.Function.bind(this._onTimeout, this);
    this.__onErrorBound = qx.lang.Function.bind(this._onError, this);

    transport.onreadystatechange = this.__onReadyStateChangeBound;
    transport.onload = this.__onLoadBound;
    transport.onloadend = this.__onLoadEndBound;
    transport.onabort = this.__onAbortBound;
    transport.ontimeout = this.__onTimeoutBound;
    transport.onerror = this.__onErrorBound;
  },

  events :
  {
    /**
     * Fired on every change of the transport’s readyState.
     */
    "readyStateChange": "qx.event.type.Event",

    /**
     * Fired when request completes without error and transport’s status
     * indicates success.
     */
    "success": "qx.event.type.Event",

    /**
     * Fired when request completes without error.
     */
    "load": "qx.event.type.Event",

    /**
     * Fired when request completes with or without error.
     */
    "loadEnd": "qx.event.type.Event",

    /**
     * Fired when request is aborted.
     */
    "abort": "qx.event.type.Event",

    /**
     * Fired when request reaches timeout limit.
     */
    "timeout": "qx.event.type.Event",

    /**
     * Fired when request completes with error.
     */
    "error": "qx.event.type.Event",

    /**
     * Fired when request completes without error but erroneous HTTP status.
     */
    "statusError": "qx.event.type.Event",

    /**
     * Fired on timeout, error or remote error.
     *
     * This event is fired for convenience. Usually, it is recommended
     * to handle error related events in a more granular approach.
     */
    "fail": "qx.event.type.Event",

    /**
    * Fired on change of the parsed response.
    *
    * This event allows to use data binding with the
    * parsed response as source.
    *
    * For example, to bind the response to the value of a label:
    *
    * <pre class="javascript">
    * // req is an instance of qx.io.request.*,
    * // label an instance of qx.ui.basic.Label
    * req.bind("response", label, "value");
    * </pre>
    *
    * The response is parsed (and therefore changed) only
    * after the request completes successfully. This means
    * that when a new request is made the initial emtpy value
    * is ignored, instead only the final value is bound.
    *
    */
    "changeResponse": "qx.event.type.Data",

    /**
     * Fired on change of the phase.
     */
    "changePhase": "qx.event.type.Data"
  },

  properties :
  {
    /**
     * The URL of the resource to request.
     *
     * Note: Depending on the configuration of the request
     * and/or the transport chosen, query params may be appended
     * automatically.
     */
    url: {
      check: "String"
    },


    /**
     * Timeout limit in milliseconds. Default (0) means no limit.
     */
    timeout: {
      check: "Number",
      nullable: true,
      init: 0
    },

    /**
     * Data to be send as part of the request.
     *
     * Supported types:
     *
     * * String
     * * Map
     * * qooxdoo Object
     *
     * For every supported type except strings, a URL encoded string
     * with unsafe characters escaped is internally generated and sent
     * as part of the request.
     *
     * Depending on the underlying transport and its configuration, the request
     * data is transparently included as URL query parameters or embedded in the
     * request body as form data.
     *
     * If a string is given the user must make sure it is properly formatted and
     * escaped. See {@link qx.util.Serializer#toUriParameter}.
     *
     */
    requestData: {
      check: function(value) {
        return qx.lang.Type.isString(value) ||
               qx.Class.isSubClassOf(value.constructor, qx.core.Object) ||
               qx.lang.Type.isObject(value);
      },
      nullable: true
    },

    /**
     * Authentication delegate.
     *
     * The delegate must implement {@link qx.io.request.authentication.IAuthentication}.
     */
    authentication: {
      check: "qx.io.request.authentication.IAuthentication",
      nullable: true
    }
  },

  members :
  {

    /**
     * Bound handlers.
     */
    __onReadyStateChangeBound: null,
    __onLoadBound: null,
    __onLoadEndBound: null,
    __onAbortBound: null,
    __onTimeoutBound: null,
    __onErrorBound: null,

    /**
     * Parsed response.
     */
    __response: null,

    /**
     * Abort flag.
     */
     __abort: null,

    /**
     * Current phase.
     */
    __phase: null,

    /**
     * Request headers.
     */
    __requestHeaders: null,

    /**
     * Request headers (deprecated).
     */
    __requestHeadersDeprecated: null,

    /**
     * Holds transport.
     */
    _transport: null,

    /*
    ---------------------------------------------------------------------------
      CONFIGURE TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Create and return transport.
     *
     * This method MUST be overridden, unless the constructor is overridden as
     * well. It is called by the constructor and should return the transport that
     * is to be interfaced.
     *
     * @return {qx.bom.request} Transport.
     */
    _createTransport: function() {
      throw new Error("Abstract method call");
    },

    /**
     * Get configured URL.
     *
     * A configured URL typically includes a query string that
     * encapsulates transport specific settings such as request
     * data or no-cache settings.
     *
     * This method MAY be overridden. It is called in {@link #send}
     * before the request is initialized.
     *
     * @return {String} The configured URL.
     */
    _getConfiguredUrl: function() {},

    /**
     * Get configuration related request headers.
     *
     * This method MAY be overridden to add request headers for features limited
     * to a certain transport.
     *
     * @return {Map} Map of request headers.
     */
    _getConfiguredRequestHeaders: function() {},

    /**
     * Get parsed response.
     *
     * Is called in the {@link #_onReadyStateChange} event handler
     * to parse and store the transport’s response.
     *
     * This method MUST be overridden.
     *
     * @return {String} The parsed response of the request.
     */
    _getParsedResponse: function() {
      throw new Error("Abstract method call");
    },

    /**
     * Get method.
     *
     * This method MAY be overridden. It is called in {@link #send}
     * before the request is initialized.
     *
     * @return {String} The method.
     */
    _getMethod: function() {
      return "GET";
    },

    /**
     * Whether async.
     *
     * This method MAY be overridden. It is called in {@link #send}
     * before the request is initialized.
     *
     * @return {Boolean} Whether to process asynchronously.
     */
    _isAsync: function() {
      return true;
    },

    /*
    ---------------------------------------------------------------------------
      INTERACT WITH TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Send request.
     */
    send: function() {
      var transport = this._transport,
          url, method, async, serializedData;

      //
      // Open request
      //

      url = this._getConfiguredUrl();

      // Drop fragment (anchor) from URL as per
      // http://www.w3.org/TR/XMLHttpRequest/#the-open-method
      if (/\#/.test(url)) {
        url = url.replace(/\#.*/, "");
      }

      transport.timeout = this.getTimeout();

      // Support transports with enhanced feature set
      method = this._getMethod();
      async = this._isAsync();

      // Open
      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Open low-level request with method: " +
          method + ", url: " + url + ", async: " + async);
      }

      transport.open(method, url, async);
      this._setPhase("opened");

      //
      // Send request
      //

      serializedData = this._serializeData(this.getRequestData());

      this._setRequestHeaders();

      // Send
      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Send low-level request");
      }
      method == "GET" ? transport.send() : transport.send(serializedData);
      this._setPhase("sent");
    },

    /**
     * Abort request.
     */
    abort: function() {
       if (qx.core.Environment.get("qx.debug.io")) {
         this.debug("Abort request");
       }
       this.__abort = true;

       // Update phase to "abort" before user handler are invoked [BUG #5485]
       this.__phase = "abort";

       this._transport.abort();
    },

    /*
    ---------------------------------------------------------------------------
     REQUEST HEADERS
    ---------------------------------------------------------------------------
    */

    /**
     * Apply configured request headers to transport.
     *
     * This method MAY be overridden to customize application of request headers
     * to transport.
     */
    _setRequestHeaders: function() {
      var transport = this._transport,
          requestHeaders = this._getAllRequestHeaders();

      for (var key in requestHeaders) {
        transport.setRequestHeader(key, requestHeaders[key]);
      }

    },

    /**
     * Get all request headers.
     *
     * @return {Map} All request headers.
     */
    _getAllRequestHeaders: function() {
      var requestHeaders = {};
      // Transport specific headers
      qx.lang.Object.mergeWith(requestHeaders, this._getConfiguredRequestHeaders());
      // Authentication delegate
      qx.lang.Object.mergeWith(requestHeaders, this.__getAuthRequestHeaders());
      // User-defined, requestHeaders property (deprecated)
      qx.lang.Object.mergeWith(requestHeaders, this.__requestHeadersDeprecated);
      // User-defined
      qx.lang.Object.mergeWith(requestHeaders, this.__requestHeaders);

      return requestHeaders;
    },

    /**
    * Retrieve authentication headers from auth delegate.
    *
    * @return {Map} Authentication related request headers.
    */
    __getAuthRequestHeaders: function() {
      var auth = this.getAuthentication(),
          headers = {};

      if (auth) {
        auth.getAuthHeaders().forEach(function(header) {
          headers[header.key] = header.value;
        });
        return headers;
      }
    },

    /**
     * Set a request header.
     *
     * Note: Setting request headers has no effect after the request was send.
     *
     * @param key {String} Key of the header.
     * @param value {String} Value of the header.
     */
    setRequestHeader: function(key, value) {
      this.__requestHeaders[key] = value;
    },

    /**
     * Get a request header.
     *
     * @param key {String} Key of the header.
     * @return {String} The value of the header.
     */
    getRequestHeader: function(key) {
       return this.__requestHeaders[key];
    },

    /**
     * Remove a request header.
     *
     * Note: Removing request headers has no effect after the request was send.
     *
     * @param key {String} Key of the header.
     */
    removeRequestHeader: function(key) {
      if (this.__requestHeaders[key]) {
       delete this.__requestHeaders[key];
      }
    },


    /*
    ---------------------------------------------------------------------------
     QUERY TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Get low-level transport.
     *
     * Note: To be used with caution!
     *
     * This method can be used to query the transport directly,
     * but should be used with caution. Especially, it
     * is not advisable to call any destructive methods
     * such as <code>open</code> or <code>send</code>.
     *
     * @return {Object} An instance of a class found in
     *  <code>qx.bom.request.*</code>
     */

     // This method mainly exists so that some methods found in the
     // low-level transport can be deliberately omitted here,
     // but still be accessed should it be absolutely necessary.
     //
     // Valid use cases include to query the transport’s responseXML
     // property if performance is critical and any extra parsing
     // should be avoided at all costs.
     //
    getTransport: function() {
      return this._transport;
    },

    /**
     * Get current ready state.
     *
     * States can be:
     * UNSENT:           0,
     * OPENED:           1,
     * HEADERS_RECEIVED: 2,
     * LOADING:          3,
     * DONE:             4
     *
     * @return {Number} Ready state.
     */
    getReadyState: function() {
      return this._transport.readyState;
    },

    /**
     * Get current phase.
     *
     * A more elaborate version of {@link #getReadyState}, this method indicates
     * the current phase of the request. Maps to stateful (i.e. deterministic)
     * events (success, abort, timeout, statusError) and intermediate
     * readyStates (unsent, configured, loading, load).
     *
     * When the requests is successful, it progresses the states:<br>
     * 'unsent', 'opened', 'sent', 'loading', 'load', 'success'
     *
     * In case of failure, the final state is one of:<br>
     * 'abort', 'timeout', 'statusError'
     *
     * For each change of the phase, a {@link #changePhase} data event is fired.
     *
     * @return {String} Current phase.
     *
     */
    getPhase: function() {
      return this.__phase;
    },

    /**
     * Get status code.
     *
     * @return {Number} The transport’s status code.
     */
    getStatus: function() {
      return this._transport.status;
    },

    /**
     * Get status text.
     *
     * @return {String} The transport’s status text.
     */
    getStatusText: function() {
      return this._transport.statusText;
    },

    /**
     * Get raw (unprocessed) response.
     *
     * @return {String} The raw response of the request.
     */
    getResponseText: function() {
      return this._transport.responseText;
    },

    /**
     * Get all response headers from response.
     *
     * @return {String} All response headers.
     */
    getAllResponseHeaders: function() {
      return this._transport.getAllResponseHeaders();
    },

    /**
     * Get a single response header from response.
     *
     * @param key {String}
     *   Key of the header to get the value from.
     * @return {String}
     *   Response header.
     */
    getResponseHeader: function(key) {
      return this._transport.getResponseHeader(key);
    },

    /**
     * Override the content type response header from response.
     *
     * @param contentType {String}
     *   Content type for overriding.
     * @see qx.bom.request.Xhr#overrideMimeType
     */
    overrideResponseContentType: function(contentType) {
      return this._transport.overrideMimeType(contentType);
    },

    /**
     * Get the content type response header from response.
     *
     * @return {String}
     *   Content type response header.
     */
    getResponseContentType: function() {
      return this.getResponseHeader("Content-Type");
    },

    /**
     * Whether request completed (is done).
     */
    isDone: function() {
      return this.getReadyState() === 4;
    },

    /*
    ---------------------------------------------------------------------------
      RESPONSE
    ---------------------------------------------------------------------------
    */

    /**
     * Get parsed response.
     *
     * @return {String} The parsed response of the request.
     */
    getResponse: function() {
      return this.__response;
    },

    /**
     * Set response.
     *
     * @param response {String} The parsed response of the request.
     */
    _setResponse: function(response) {
      var oldResponse = response;

      if (this.__response !== response) {
        this.__response = response;
        this.fireEvent("changeResponse", qx.event.type.Data, [this.__response, oldResponse]);
      }
    },

    /*
    ---------------------------------------------------------------------------
      EVENT HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Handle "readyStateChange" event.
     */
    _onReadyStateChange: function() {
      var readyState = this.getReadyState();

      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Fire readyState: " + readyState);
      }

      this.fireEvent("readyStateChange");

      // Transport switches to readyState DONE on abort and may already
      // have successful HTTP status when response is served from cache.
      //
      // Not fire custom event "loading" (or "success", when cached).
      if (this.__abort) {
        return;
      }

      if (readyState === 3) {
        this._setPhase("loading");
      }

      if (this.isDone()) {
        this.__onReadyStateDone();
      }
    },

    /**
     * Called internally when readyState is DONE.
     */
    __onReadyStateDone: function() {
      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Request completed with HTTP status: " + this.getStatus());
      }

      // Event "load" fired in onLoad
      this._setPhase("load");

      // Successful HTTP status
      if (qx.util.Request.isSuccessful(this.getStatus())) {

        // Parse response
        if (qx.core.Environment.get("qx.debug.io")) {
          this.debug("Response is of type: '" + this.getResponseContentType() + "'");
        }

        this._setResponse(this._getParsedResponse());

        this._fireStatefulEvent("success");

      // Erroneous HTTP status
      } else {

        try {
          this._setResponse(this._getParsedResponse());
        } catch (e) {
          // ignore if it does not work
        }

        // A remote error failure
        if (this.getStatus() !== 0) {
          this._fireStatefulEvent("statusError");
          this.fireEvent("fail");
        }
      }
    },

    /**
     * Handle "load" event.
     */
    _onLoad: function() {
      this.fireEvent("load");
    },

    /**
     * Handle "loadEnd" event.
     */
    _onLoadEnd: function() {
      this.fireEvent("loadEnd");
    },

    /**
     * Handle "abort" event.
     */
    _onAbort: function() {
      this._fireStatefulEvent("abort");
    },

    /**
     * Handle "timeout" event.
     */
    _onTimeout: function() {
      this._fireStatefulEvent("timeout");

      // A network error failure
      this.fireEvent("fail");
    },

    /**
     * Handle "error" event.
     */
    _onError: function() {
      this.fireEvent("error");

      // A network error failure
      this.fireEvent("fail");
    },

    /*
    ---------------------------------------------------------------------------
      INTERNAL / HELPERS
    ---------------------------------------------------------------------------
    */

    /**
     * Fire stateful event.
     *
     * Fires event and sets phase to name of event.
     *
     * @param evt {String} Name of the event to fire.
     */
    _fireStatefulEvent: function(evt) {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertString(evt);
      }
      this._setPhase(evt);
      this.fireEvent(evt);
    },

    /**
     * Set phase.
     *
     * @param phase {String} The phase to set.
     */
    _setPhase: function(phase) {
      var previousPhase = this.__phase;

      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertString(phase);
        qx.core.Assert.assertMatch(phase,
          /^(unsent)|(opened)|(sent)|(loading)|(load)|(success)|(abort)|(timeout)|(statusError)$/);
      }

      this.__phase = phase;
      this.fireDataEvent("changePhase", phase, previousPhase);
    },

    /**
     * Serialize data.
     *
     * @param data {String|Map|qx.core.Object} Data to serialize.
     * @return {String|null} Serialized data.
     */
    _serializeData: function(data) {
      var isPost = typeof this.getMethod !== "undefined" && this.getMethod() == "POST",
          isJson = (/application\/.*\+?json/).test(this.getRequestHeader("Content-Type"));

      if (!data) {
        return null;
      }

      if (qx.lang.Type.isString(data)) {
        return data;
      }

      if (qx.Class.isSubClassOf(data.constructor, qx.core.Object)) {
        return qx.util.Serializer.toUriParameter(data);
      }

      if (isJson && (qx.lang.Type.isObject(data) || qx.lang.Type.isArray(data))) {
        return qx.lang.Json.stringify(data);
      }

      if (qx.lang.Type.isObject(data)) {
        return qx.util.Uri.toParameter(data, isPost);
      }
    }
  },

  environment:
  {
    "qx.debug.io": false
  },

  destruct: function()
  {
    var transport = this._transport,
        noop = function() {};

    if (this._transport) {
      transport.onreadystatechange = transport.onload = transport.onloadend =
      transport.onabort = transport.ontimeout = transport.onerror = noop;

      transport.dispose();
    }
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
     * Tristan Koch (tristankoch)
     * Richard Sternagel (rsternagel)

************************************************************************ */

/**
 * Static helpers for handling HTTP requests.
 */
qx.Bootstrap.define("qx.util.Request",
{
  statics:
  {
    /**
     * Whether URL given points to resource that is cross-domain,
     * i.e. not of same origin.
     *
     * @param url {String} URL.
     * @return {Boolean} Whether URL is cross domain.
     */
    isCrossDomain: function(url) {
      var result = qx.util.Uri.parseUri(url),
          location = window.location;

      if (!location) {
        return false;
      }

      var protocol = location.protocol;

      // URL is relative in the sence that it points to origin host
      if (!(url.indexOf("//") !== -1)) {
        return false;
      }

      if (protocol.substr(0, protocol.length-1) == result.protocol &&
          location.host === result.host &&
          location.port === result.port) {
        return false;
      }

      return true;
    },

    /**
     * Determine if given HTTP status is considered successful.
     *
     * @param status {Number} HTTP status.
     * @return {Boolean} Whether status is considered successful.
     */
    isSuccessful: function(status) {
      return (status >= 200 && status < 300 || status === 304);
    },

    /**
     * Determine if given HTTP method is valid.
     *
     * @param method {String} HTTP method.
     * @return {Boolean} Whether method is a valid HTTP method.
     */
    isMethod: function(method) {
      var knownMethods = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT", "PATCH"];
      return (knownMethods.indexOf(method) !== -1) ? true : false;
    },

    /**
     * Request body is ignored for HTTP method GET and HEAD.
     *
     * See http://www.w3.org/TR/XMLHttpRequest2/#the-send-method.
     *
     * @param method {String} The HTTP method.
     * @return {Boolean} Whether request may contain body.
     */
    methodAllowsRequestBody: function(method) {
      return !((/^(GET|HEAD)$/).test(method));
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
 * This is an util class responsible for serializing qooxdoo objects.
 *
 * @ignore(qx.data, qx.data.IListData)
 * @ignore(qx.locale, qx.locale.LocalizedString)
 */
qx.Class.define("qx.util.Serializer",
{
  statics :
  {

    /**
     * Serializes the properties of the given qooxdoo object. To get the
     * serialization working, every property needs to have a string
     * representation because the value of the property will be concatenated to the
     * serialized string.
     *
     * @param object {qx.core.Object} Any qooxdoo object
     * @param qxSerializer {Function} Function used for serializing qooxdoo
     *   objects stored in the propertys of the object. Check for the type of
     *   classes <ou want to serialize and return the serialized value. In all
     *   other cases, just return nothing.
     * @param dateFormat {qx.util.format.DateFormat} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String} The serialized object.
     */
    toUriParameter : function(object, qxSerializer, dateFormat)
    {
      var result = "";
      var properties = qx.util.PropertyUtil.getAllProperties(object.constructor);

      for (var name in properties) {
        // ignore property groups
        if (properties[name].group != undefined) {
          continue;
        }
        var value = object["get" + qx.lang.String.firstUp(name)]();

        // handle arrays
        if (qx.lang.Type.isArray(value)) {
          var isdataArray = qx.data && qx.data.IListData &&
            qx.Class.hasInterface(value && value.constructor, qx.data.IListData);
          for (var i = 0; i < value.length; i++) {
            var valueAtI = isdataArray ? value.getItem(i) : value[i];
            result += this.__toUriParameter(name, valueAtI, qxSerializer);
          }
        } else if (qx.lang.Type.isDate(value) && dateFormat != null) {
          result += this.__toUriParameter(
            name, dateFormat.format(value), qxSerializer
          );
        } else {
          result += this.__toUriParameter(name, value, qxSerializer);
        }
      }
      return result.substring(0, result.length - 1);
    },


    /**
     * Helper method for {@link #toUriParameter}. Check for qooxdoo objects
     * and returns the serialized name value pair for the given parameter.
     *
     * @param name {String} The name of the value
     * @param value {var} The value itself
     * @param qxSerializer {Function} The serializer for qooxdoo objects.
     * @return {String} The serialized name value pair.
     */
    __toUriParameter : function(name, value, qxSerializer)
    {

      if (value && value.$$type == "Class") {
        value = value.classname;
      }

      if (value && (value.$$type == "Interface" || value.$$type == "Mixin")) {
        value = value.name;
      }

      if (value instanceof qx.core.Object && qxSerializer != null) {
        var encValue = encodeURIComponent(qxSerializer(value));
        if (encValue === undefined) {
          var encValue = encodeURIComponent(value);
        }
      } else {
        var encValue = encodeURIComponent(value);
      }
      return encodeURIComponent(name) + "=" + encValue + "&";
    },


    /**
     * Serializes the properties of the given qooxdoo object into a native
     * object.
     *
     * @param object {qx.core.Object}
     *   Any qooxdoo object
     *
     * @param qxSerializer {Function}
     *   Function used for serializing qooxdoo objects stored in the propertys
     *   of the object. Check for the type of classes you want to serialize
     *   and return the serialized value. In all other cases, just return
     *   nothing.
     * @param dateFormat {qx.util.format.DateFormat} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String}
     *   The serialized object.
     */
    toNativeObject : function(object, qxSerializer, dateFormat)
    {
      var result;

      // null or undefined
      if (object == null)
      {
        return null;
      }

      // data array
      if (qx.data && qx.data.IListData && qx.Class.hasInterface(object.constructor, qx.data.IListData))
      {
        result = [];
        for (var i = 0; i < object.getLength(); i++)
        {
          result.push(qx.util.Serializer.toNativeObject(
            object.getItem(i), qxSerializer, dateFormat)
          );
        }

        return result;
      }

      // other arrays
      if (qx.lang.Type.isArray(object))
      {
        result = [];
        for (var i = 0; i < object.length; i++)
        {
          result.push(qx.util.Serializer.toNativeObject(
            object[i], qxSerializer, dateFormat)
          );
        }

        return result;
      }

      // return names for qooxdoo classes
      if (object.$$type == "Class") {
        return object.classname;
      }

      // return names for qooxdoo interfaces and mixins
      if (object.$$type == "Interface" || object.$$type == "Mixin") {
        return object.name;
      }

      // qooxdoo object
      if (object instanceof qx.core.Object)
      {
        if (qxSerializer != null)
        {
          var returnValue = qxSerializer(object);

          // if we have something returned, return that
          if (returnValue != undefined)
          {
            return returnValue;
          }

          // continue otherwise
        }

        result = {};

        var properties =
          qx.util.PropertyUtil.getAllProperties(object.constructor);

        for (var name in properties)
        {
          // ignore property groups
          if (properties[name].group != undefined)
          {
            continue;
          }

          var value = object["get" + qx.lang.String.firstUp(name)]();
          result[name] = qx.util.Serializer.toNativeObject(
            value, qxSerializer, dateFormat
          );
        }

        return result;
      }

      // date objects with date format
      if (qx.lang.Type.isDate(object) && dateFormat != null) {
        return dateFormat.format(object);
      }

      // localized strings
      if (qx.locale && qx.locale.LocalizedString && object instanceof qx.locale.LocalizedString) {
        return object.toString();
      }

      // JavaScript objects
      if (qx.lang.Type.isObject(object))
      {
        result = {};

        for (var key in object)
        {
          result[key] = qx.util.Serializer.toNativeObject(
            object[key], qxSerializer, dateFormat
          );
        }

        return result;
      }

      // all other stuff, including String, Date, RegExp
      return object;
    },


    /**
     * Serializes the properties of the given qooxdoo object into a json object.
     *
     * @param object {qx.core.Object} Any qooxdoo object
     * @param qxSerializer {Function?} Function used for serializing qooxdoo
     *   objects stored in the propertys of the object. Check for the type of
     *   classes <ou want to serialize and return the serialized value. In all
     *   other cases, just return nothing.
     * @param dateFormat {qx.util.format.DateFormat?} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String} The serialized object.
     */
    toJson : function(object, qxSerializer, dateFormat) {
      var result = "";

      // null or undefined
      if (object == null) {
        return "null";
      }

      // data array
      if (qx.data && qx.data.IListData && qx.Class.hasInterface(object.constructor, qx.data.IListData)) {
        result += "[";
        for (var i = 0; i < object.getLength(); i++) {
          result += qx.util.Serializer.toJson(object.getItem(i), qxSerializer, dateFormat) + ",";
        }
        if (result != "[") {
          result = result.substring(0, result.length - 1);
        }
        return result + "]";
      }

      // other arrays
      if (qx.lang.Type.isArray(object)) {
        result += "[";
        for (var i = 0; i < object.length; i++) {
          result += qx.util.Serializer.toJson(object[i], qxSerializer, dateFormat) + ",";
        }
        if (result != "[") {
          result = result.substring(0, result.length - 1);
        }
        return result + "]";
      }

      // return names for qooxdoo classes
      if (object.$$type == "Class") {
        return '"' + object.classname + '"';
      }

      // return names for qooxdoo interfaces and mixins
      if (object.$$type == "Interface" || object.$$type == "Mixin") {
        return '"' + object.name + '"';
      }


      // qooxdoo object
      if (object instanceof qx.core.Object) {
        if (qxSerializer != null) {
          var returnValue = qxSerializer(object);
          // if we have something returned, ruturn that
          if (returnValue != undefined) {
            return '"' + returnValue + '"';
          }
          // continue otherwise
        }
        result += "{";
        var properties = qx.util.PropertyUtil.getAllProperties(object.constructor);
        for (var name in properties) {
          // ignore property groups
          if (properties[name].group != undefined) {
            continue;
          }
          var value = object["get" + qx.lang.String.firstUp(name)]();
          result += '"' + name + '":' + qx.util.Serializer.toJson(value, qxSerializer, dateFormat) + ",";
        }
        if (result != "{") {
          result = result.substring(0, result.length - 1);
        }
        return result + "}";
      }

      // localized strings
      if (qx.locale && qx.locale.LocalizedString && object instanceof qx.locale.LocalizedString) {
        object = object.toString();
        // no return here because we want to have the string checks as well!
      }

      // date objects with formater
      if (qx.lang.Type.isDate(object) && dateFormat != null) {
        return '"' + dateFormat.format(object) + '"';
      }

      // javascript objects
      if (qx.lang.Type.isObject(object)) {
        result += "{";
        for (var key in object) {
          result += '"' + key + '":' +
                    qx.util.Serializer.toJson(object[key], qxSerializer, dateFormat) + ",";
        }
        if (result != "{") {
          result = result.substring(0, result.length - 1);
        }
        return result + "}";
      }

      // strings
      if (qx.lang.Type.isString(object)) {
        // escape
        object = object.replace(/([\\])/g, '\\\\');
        object = object.replace(/(["])/g, '\\"');
        object = object.replace(/([\r])/g, '\\r');
        object = object.replace(/([\f])/g, '\\f');
        object = object.replace(/([\n])/g, '\\n');
        object = object.replace(/([\t])/g, '\\t');
        object = object.replace(/([\b])/g, '\\b');

        return '"' + object + '"';
      }

      // Date and RegExp
      if (qx.lang.Type.isDate(object) || qx.lang.Type.isRegExp(object)) {
        return '"' + object + '"';
      }

      // all other stuff
      return object + "";
    }
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
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * Send HTTP requests and handle responses using the HTTP client API.
 *
 * Configuration of the request is done with properties. Events are fired for
 * various states in the life cycle of a request, such as "success". Request
 * data is transparently processed.
 *
 * Here is how to request a JSON file and listen to the "success" event:
 *
 * <pre class="javascript">
 * var req = new qx.io.request.Xhr("/some/path/file.json");
 *
 * req.addListener("success", function(e) {
 *   var req = e.getTarget();
 *
 *   // Response parsed according to the server's
 *   // response content type, e.g. JSON
 *   req.getResponse();
 * }, this);
 *
 * // Send request
 * req.send();
 * </pre>
 *
 * Some noteable features:
 *
 * * Abstraction of low-level request
 * * Convenient setup using properties
 * * Fine-grained events
 * * Symbolic phases
 * * Transparent processing of request data
 * * Stream-lined authentication
 * * Automagic parsing of response based on content type
 *
 * Cross-origin requests are supported, but require browser support
 * (see <a href="http://caniuse.com/#search=CORS">caniuse.com</a>) and backend configuration
 * (see <a href="https://developer.mozilla.org/en-US/docs/docs/HTTP/Access_control_CORS>MDN</a>).
 * Note that IE's <code>XDomainRequest</code> is not currently supported.
 * For a cross-browser alternative, consider {@link qx.io.request.Jsonp}.
 *
 * In order to debug requests, set the environment flag
 * <code>qx.debug.io</code>.
 *
 * Internally uses {@link qx.bom.request.Xhr}.
 */
qx.Class.define("qx.io.request.Xhr",
{
  extend: qx.io.request.AbstractRequest,

  /**
   * @param url {String?} The URL of the resource to request.
   * @param method {String?} The HTTP method.
   */
  construct: function(url, method) {
    if (method !== undefined) {
      this.setMethod(method);
    }

    this.base(arguments, url);
    this._parser = this._createResponseParser();
  },

  // Only document events with transport specific details.
  // For a complete list of events, refer to AbstractRequest.

  events:
  {
    /**
     * Fired on every change of the transport’s readyState.
     *
     * See {@link qx.bom.request.Xhr} for available readyStates.
     */
    "readyStateChange": "qx.event.type.Event",

    /**
    * Fired when request completes without eror and transport’s status
    * indicates success.
     *
     * Refer to {@link qx.util.Request#isSuccessful} for a list of HTTP
     * status considered successful.
     */
    "success": "qx.event.type.Event",

    /**
     * Fired when request completes without error.
     *
     * Every request not canceled or aborted completes. This means that
     * even requests receiving a response with erroneous HTTP status
     * fire a "load" event. If you are only interested in successful
     * responses, listen to the {@link #success} event instead.
     */
    "load": "qx.event.type.Event",

    /**
     * Fired when request completes without error but erroneous HTTP status.
     *
     * Refer to {@link qx.util.Request#isSuccessful} for a list of HTTP
     * status considered successful.
     */
    "statusError": "qx.event.type.Event"
  },

  properties:
  {
    /**
     * The HTTP method.
     */
    method: {
      init: "GET"
    },

    /**
     * Whether the request should be executed asynchronously.
     */
    async: {
      check: "Boolean",
      init: true
    },

    /**
     * The content type to accept. By default, every content type
     * is accepted.
     *
     * Note: Some backends send distinct representations of the same
     * resource depending on the content type accepted. For instance,
     * a backend may respond with either a JSON (the accept header
     * indicates so) or a HTML representation (the default, no accept
     * header given).
     */
    accept: {
      check: "String",
      nullable: true
    },

    /**
     * Whether to allow request to be answered from cache.
     *
     * Allowed values:
     *
     * * <code>true</code>: Allow caching (Default)
     * * <code>false</code>: Prohibit caching. Appends nocache parameter to URL.
     * * <code>String</code>: Any Cache-Control request directive
     *
     * If a string is given, it is inserted in the request's Cache-Control
     * header. A request’s Cache-Control header may contain a number of directives
     * controlling the behavior of any caches in between client and origin
     * server.
     *
     * * <code>"no-cache"</code>: Force caches to submit request in order to
     *   validate the freshness of the representation. Note that the requested
     *   resource may still be served from cache if the representation is
     *   considered fresh. Use this directive to ensure freshness but save
     *   bandwidth when possible.
     * * <code>"no-store"</code>: Do not keep a copy of the representation under
     *   any conditions.
     *
     * See <a href="http://www.mnot.net/cache_docs/#CACHE-CONTROL">
     * Caching tutorial</a> for an excellent introduction to Caching in general.
     * Refer to the corresponding section in the
     * <a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9">
     * HTTP 1.1 specification</a> for more details and advanced directives.
     *
     * It is recommended to choose an appropriate Cache-Control directive rather
     * than prohibit caching using the nocache parameter.
     */
    cache: {
      check: function(value) {
        return qx.lang.Type.isBoolean(value) ||
          qx.lang.Type.isString(value);
      },
      init: true
    }
  },

  members:
  {

    /**
     * @type {Function} Parser.
     */
    _parser: null,

    /*
    ---------------------------------------------------------------------------
      CONFIGURE TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Create XHR transport.
     *
     * @return {qx.bom.request.Xhr} Transport.
     */
    _createTransport: function() {
      return new qx.bom.request.Xhr();
    },

    /**
     * Get configured URL.
     *
     * Append request data to URL if HTTP method is GET. Append random
     * string to URL if required by value of {@link #cache}.
     *
     * @return {String} The configured URL.
     */
    _getConfiguredUrl: function() {
      var url = this.getUrl(),
          serializedData;

      if (this.getMethod() === "GET" && this.getRequestData()) {
        serializedData = this._serializeData(this.getRequestData());
        url = qx.util.Uri.appendParamsToUrl(url, serializedData);
      }

      if (this.getCache() === false) {
        // Make sure URL cannot be served from cache and new request is made
        url = qx.util.Uri.appendParamsToUrl(url, {nocache: new Date().valueOf()});
      }

      return url;
    },

    // overridden
    _getConfiguredRequestHeaders: function() {
      var headers = {},
          isAllowsBody = qx.util.Request.methodAllowsRequestBody(this.getMethod());

      // Follow convention to include X-Requested-With header when same origin
      if (!qx.util.Request.isCrossDomain(this.getUrl())) {
        headers["X-Requested-With"] = "XMLHttpRequest";
      }

      // Include Cache-Control header if configured
      if (qx.lang.Type.isString(this.getCache())) {
        headers["Cache-Control"] = this.getCache();
      }

      // By default, set content-type urlencoded for requests with body
      if (this.getRequestData() !== "null" && isAllowsBody) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }

      // What representations to accept
      if (this.getAccept()) {
        if (qx.core.Environment.get("qx.debug.io")) {
          this.debug("Accepting: '" + this.getAccept() + "'");
        }
        headers["Accept"] = this.getAccept();
      }

      return headers;
    },

    // overridden
    _getMethod: function() {
      return this.getMethod();
    },

    // overridden
    _isAsync: function() {
      return this.isAsync();
    },

    /*
    ---------------------------------------------------------------------------
      PARSING
    ---------------------------------------------------------------------------
    */

    /**
     * Create response parser.
     *
     * @return {qx.util.ResponseParser} parser.
     */
    _createResponseParser: function() {
        return new qx.util.ResponseParser();
    },

    /**
     * Returns response parsed with parser determined by content type.
     *
     * @return {String|Object} The parsed response of the request.
     */
    _getParsedResponse: function() {
      var response = this._transport.responseText,
          contentType = this.getResponseContentType() || "";

      return this._parser.parse(response, contentType);
    },

    /**
     * Set parser used to parse response once request has
     * completed successfully.
     *
     * @see qx.util.ResponseParser#setParser
     *
     * @param parser {String|Function}
     * @return {Function} The parser function
     */
    setParser: function(parser) {
      return this._parser.setParser(parser);
    }
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
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * A wrapper of the XMLHttpRequest host object (or equivalent). The interface is
 * similar to <a href="http://www.w3.org/TR/XMLHttpRequest/">XmlHttpRequest</a>.
 *
 * Hides browser inconsistencies and works around bugs found in popular
 * implementations.
 *
 * <div class="desktop">
 * Example:
 *
 * <pre class="javascript">
 *  var req = new qx.bom.request.Xhr();
 *  req.onload = function() {
 *    // Handle data received
 *    req.responseText;
 *  }
 *
 *  req.open("GET", url);
 *  req.send();
 * </pre>
 * </div>
 *
 * @ignore(XDomainRequest)
 * @ignore(qx.event, qx.event.GlobalError.*)
 *
 * @require(qx.bom.request.Xhr#open)
 * @require(qx.bom.request.Xhr#send)
 * @require(qx.bom.request.Xhr#on)
 * @require(qx.bom.request.Xhr#onreadystatechange)
 * @require(qx.bom.request.Xhr#onload)
 * @require(qx.bom.request.Xhr#onloadend)
 * @require(qx.bom.request.Xhr#onerror)
 * @require(qx.bom.request.Xhr#onabort)
 * @require(qx.bom.request.Xhr#ontimeout)
 * @require(qx.bom.request.Xhr#setRequestHeader)
 * @require(qx.bom.request.Xhr#getAllResponseHeaders)
 * @require(qx.bom.request.Xhr#getRequest)
 * @require(qx.bom.request.Xhr#overrideMimeType)
 * @require(qx.bom.request.Xhr#dispose)
 * @require(qx.bom.request.Xhr#isDisposed)
 *
 * @group (IO)
 */
qx.Bootstrap.define("qx.bom.request.Xhr",
{

  extend: Object,

  construct: function() {
    var boundFunc = qx.Bootstrap.bind(this.__onNativeReadyStateChange, this);

    // GlobalError shouldn't be included in qx.Website builds so use it
    // if it's available but otherwise ignore it (see ignore stated above).
    if (qx.event && qx.event.GlobalError && qx.event.GlobalError.observeMethod) {
      this.__onNativeReadyStateChangeBound = qx.event.GlobalError.observeMethod(boundFunc);
    } else {
      this.__onNativeReadyStateChangeBound = boundFunc;
    }

    this.__onNativeAbortBound = qx.Bootstrap.bind(this.__onNativeAbort, this);
    this.__onTimeoutBound = qx.Bootstrap.bind(this.__onTimeout, this);

    this.__initNativeXhr();
    this._emitter = new qx.event.Emitter();

    // BUGFIX: IE
    // IE keeps connections alive unless aborted on unload
    if (window.attachEvent) {
      this.__onUnloadBound = qx.Bootstrap.bind(this.__onUnload, this);
      window.attachEvent("onunload", this.__onUnloadBound);
    }
  },

  statics :
  {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
  },


  events : {
    /** Fired at ready state changes. */
    "readystatechange" : "qx.bom.request.Xhr",

    /** Fired on error. */
    "error" : "qx.bom.request.Xhr",

    /** Fired at loadend. */
    "loadend" : "qx.bom.request.Xhr",

    /** Fired on timeouts. */
    "timeout" : "qx.bom.request.Xhr",

    /** Fired when the request is aborted. */
    "abort" : "qx.bom.request.Xhr",

    /** Fired on successful retrieval. */
    "load" : "qx.bom.request.Xhr"
  },


  members :
  {
    /*
    ---------------------------------------------------------------------------
      PUBLIC
    ---------------------------------------------------------------------------
    */

    /**
     * @type {Number} Ready state.
     *
     * States can be:
     * UNSENT:           0,
     * OPENED:           1,
     * HEADERS_RECEIVED: 2,
     * LOADING:          3,
     * DONE:             4
     */
    readyState: 0,

    /**
     * @type {String} The response of the request as text.
     */
    responseText: "",

    /**
     * @type {Object} The response of the request as a Document object.
     */
    responseXML: null,

    /**
     * @type {Number} The HTTP status code.
     */
    status: 0,

    /**
     * @type {String} The HTTP status text.
     */
    statusText: "",

    /**
     * @type {Number} Timeout limit in milliseconds.
     *
     * 0 (default) means no timeout. Not supported for synchronous requests.
     */
    timeout: 0,

    /**
     * Initializes (prepares) request.
     *
     * @ignore(XDomainRequest)
     *
     * @param method {String?"GET"}
     *  The HTTP method to use.
     * @param url {String}
     *  The URL to which to send the request.
     * @param async {Boolean?true}
     *  Whether or not to perform the operation asynchronously.
     * @param user {String?null}
     *  Optional user name to use for authentication purposes.
     * @param password {String?null}
     *  Optional password to use for authentication purposes.
     */
    open: function(method, url, async, user, password) {
      this.__checkDisposed();

      // Mimick native behavior
      if (typeof url === "undefined") {
        throw new Error("Not enough arguments");
      } else if (typeof method === "undefined") {
        method = "GET";
      }

      // Reset flags that may have been set on previous request
      this.__abort = false;
      this.__send = false;
      this.__conditional = false;

      // Store URL for later checks
      this.__url = url;

      if (typeof async == "undefined") {
        async = true;
      }
      this.__async = async;

      // BUGFIX
      // IE < 9 and FF < 3.5 cannot reuse the native XHR to issue many requests
      if (!this.__supportsManyRequests() && this.readyState > qx.bom.request.Xhr.UNSENT) {
        // XmlHttpRequest Level 1 requires open() to abort any pending requests
        // associated to the object. Since we're dealing with a new object here,
        // we have to emulate this behavior. Moreover, allow old native XHR to be garbage collected
        //
        // Dispose and abort.
        //
        this.dispose();

        // Replace the underlying native XHR with a new one that can
        // be used to issue new requests.
        this.__initNativeXhr();
      }

      // Restore handler in case it was removed before
      this.__nativeXhr.onreadystatechange = this.__onNativeReadyStateChangeBound;

      try {
        if (qx.core.Environment.get("qx.debug.io")) {
          qx.Bootstrap.debug(qx.bom.request.Xhr, "Open native request with method: " +
            method + ", url: " + url + ", async: " + async);
        }

        this.__nativeXhr.open(method, url, async, user, password);

      // BUGFIX: IE, Firefox < 3.5
      // Some browsers do not support Cross-Origin Resource Sharing (CORS)
      // for XMLHttpRequest. Instead, an exception is thrown even for async requests
      // if URL is cross-origin (as per XHR level 1). Use the proprietary XDomainRequest
      // if available (supports CORS) and handle error (if there is one) this
      // way. Otherwise just assume network error.
      //
      // Basically, this allows to detect network errors.
      } catch(OpenError) {

        // Only work around exceptions caused by cross domain request attempts
        if (!qx.util.Request.isCrossDomain(url)) {
          // Is same origin
          throw OpenError;
        }

        if (!this.__async) {
          this.__openError = OpenError;
        }

        if (this.__async) {
          // Try again with XDomainRequest
          // (Success case not handled on purpose)
          // - IE 9
          if (window.XDomainRequest) {
            this.readyState = 4;
            this.__nativeXhr = new XDomainRequest();
            this.__nativeXhr.onerror = qx.Bootstrap.bind(function() {
              this._emit("readystatechange");
              this._emit("error");
              this._emit("loadend");
            }, this);

            if (qx.core.Environment.get("qx.debug.io")) {
              qx.Bootstrap.debug(qx.bom.request.Xhr, "Retry open native request with method: " +
                method + ", url: " + url + ", async: " + async);
            }
            this.__nativeXhr.open(method, url, async, user, password);
            return;
          }

          // Access denied
          // - IE 6: -2146828218
          // - IE 7: -2147024891
          // - Legacy Firefox
          window.setTimeout(qx.Bootstrap.bind(function() {
            if (this.__disposed) {
              return;
            }
            this.readyState = 4;
            this._emit("readystatechange");
            this._emit("error");
            this._emit("loadend");
          }, this));
        }

      }

      // BUGFIX: IE < 9
      // IE < 9 tends to cache overly agressive. This may result in stale
      // representations. Force validating freshness of cached representation.
      if (qx.core.Environment.get("engine.name") === "mshtml" &&
        qx.core.Environment.get("browser.documentmode") < 9 &&
        this.__nativeXhr.readyState > 0) {
          this.__nativeXhr.setRequestHeader("If-Modified-Since", "-1");
        }

      // BUGFIX: Firefox
      // Firefox < 4 fails to trigger onreadystatechange OPENED for sync requests
      if (qx.core.Environment.get("engine.name") === "gecko" &&
          parseInt(qx.core.Environment.get("engine.version"), 10) < 2 &&
          !this.__async) {
        // Native XHR is already set to readyState DONE. Fake readyState
        // and call onreadystatechange manually.
        this.readyState = qx.bom.request.Xhr.OPENED;
        this._emit("readystatechange");
      }

    },

    /**
     * Sets an HTTP request header to be used by the request.
     *
     * Note: The request must be initialized before using this method.
     *
     * @param key {String}
     *  The name of the header whose value is to be set.
     * @param value {String}
     *  The value to set as the body of the header.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    setRequestHeader: function(key, value) {
      this.__checkDisposed();

      // Detect conditional requests
      if (key == "If-Match" || key == "If-Modified-Since" ||
        key == "If-None-Match" || key == "If-Range") {
        this.__conditional = true;
      }

      this.__nativeXhr.setRequestHeader(key, value);
      return this;
    },

    /**
     * Sends request.
     *
     * @param data {String|Document?null}
     *  Optional data to send.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    send: function(data) {
      this.__checkDisposed();

      // BUGFIX: IE & Firefox < 3.5
      // For sync requests, some browsers throw error on open()
      // while it should be on send()
      //
      if (!this.__async && this.__openError) {
        throw this.__openError;
      }

      // BUGFIX: Opera
      // On network error, Opera stalls at readyState HEADERS_RECEIVED
      // This violates the spec. See here http://www.w3.org/TR/XMLHttpRequest2/#send
      // (Section: If there is a network error)
      //
      // To fix, assume a default timeout of 10 seconds. Note: The "error"
      // event will be fired correctly, because the error flag is inferred
      // from the statusText property. Of course, compared to other
      // browsers there is an additional call to ontimeout(), but this call
      // should not harm.
      //
      if (qx.core.Environment.get("engine.name") === "opera" &&
          this.timeout === 0) {
        this.timeout = 10000;
      }

      // Timeout
      if (this.timeout > 0) {
        this.__timerId = window.setTimeout(this.__onTimeoutBound, this.timeout);
      }

      // BUGFIX: Firefox 2
      // "NS_ERROR_XPC_NOT_ENOUGH_ARGS" when calling send() without arguments
      data = typeof data == "undefined" ? null : data;

      // Some browsers may throw an error when sending of async request fails.
      // This violates the spec which states only sync requests should.
      try {
        if (qx.core.Environment.get("qx.debug.io")) {
          qx.Bootstrap.debug(qx.bom.request.Xhr, "Send native request");
        }
        this.__nativeXhr.send(data);
      } catch(SendError) {
        if (!this.__async) {
          throw SendError;
        }

        // BUGFIX
        // Some browsers throws error when file not found via file:// protocol.
        // Synthesize readyState changes.
        if (this._getProtocol() === "file:") {
          this.readyState = 2;
          this.__readyStateChange();

          var that = this;
          window.setTimeout(function() {
            if (that.__disposed) {
              return;
            }
            that.readyState = 3;
            that.__readyStateChange();

            that.readyState = 4;
            that.__readyStateChange();
          });

        }

      }

      // BUGFIX: Firefox
      // Firefox fails to trigger onreadystatechange DONE for sync requests
      if (qx.core.Environment.get("engine.name") === "gecko" && !this.__async) {
        // Properties all set, only missing native readystatechange event
        this.__onNativeReadyStateChange();
      }

      // Set send flag
      this.__send = true;
      return this;
    },

    /**
     * Abort request - i.e. cancels any network activity.
     *
     * Note:
     *  On Windows 7 every browser strangely skips the loading phase
     *  when this method is called (because readyState never gets 3).
     *
     *  So keep this in mind if you rely on the phases which are
     *  passed through. They will be "opened", "sent", "abort"
     *  instead of normally "opened", "sent", "loading", "abort".
     *
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    abort: function() {
      this.__checkDisposed();

      this.__abort = true;
      this.__nativeXhr.abort();

      if (this.__nativeXhr) {
        this.readyState = this.__nativeXhr.readyState;
      }
      return this;
    },


    /**
     * Helper to emit events and call the callback methods.
     * @param event {String} The name of the event.
     */
    _emit: function(event) {
      if (this["on" + event]) {
        this["on" + event]();
      }
      this._emitter.emit(event, this);
    },

    /**
     * Event handler for XHR event that fires at every state change.
     *
     * Replace with custom method to get informed about the communication progress.
     */
    onreadystatechange: function() {},

    /**
     * Event handler for XHR event "load" that is fired on successful retrieval.
     *
     * Note: This handler is called even when the HTTP status indicates an error.
     *
     * Replace with custom method to listen to the "load" event.
     */
    onload: function() {},

    /**
     * Event handler for XHR event "loadend" that is fired on retrieval.
     *
     * Note: This handler is called even when a network error (or similar)
     * occurred.
     *
     * Replace with custom method to listen to the "loadend" event.
     */
    onloadend: function() {},

    /**
     * Event handler for XHR event "error" that is fired on a network error.
     *
     * Replace with custom method to listen to the "error" event.
     */
    onerror: function() {},

    /**
    * Event handler for XHR event "abort" that is fired when request
    * is aborted.
    *
    * Replace with custom method to listen to the "abort" event.
    */
    onabort: function() {},

    /**
    * Event handler for XHR event "timeout" that is fired when timeout
    * interval has passed.
    *
    * Replace with custom method to listen to the "timeout" event.
    */
    ontimeout: function() {},


    /**
     * Add an event listener for the given event name.
     *
     * @param name {String} The name of the event to listen to.
     * @param listener {Function} The function to execute when the event is fired
     * @param ctx {var?} The context of the listener.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    on: function(name, listener, ctx) {
      this._emitter.on(name, listener, ctx);
      return this;
    },


    /**
     * Get a single response header from response.
     *
     * @param header {String}
     *  Key of the header to get the value from.
     * @return {String}
     *  Response header.
     */
    getResponseHeader: function(header) {
      this.__checkDisposed();

      return this.__nativeXhr.getResponseHeader(header);
    },

    /**
     * Get all response headers from response.
     *
     * @return {String} All response headers.
     */
    getAllResponseHeaders: function() {
      this.__checkDisposed();

      return this.__nativeXhr.getAllResponseHeaders();
    },

    /**
     * Overrides the MIME type returned by the server
     * and must be called before @send()@.
     *
     * Note:
     *
     * * IE doesn't support this method so in this case an Error is thrown.
     * * after calling this method @getResponseHeader("Content-Type")@
     *   may return the original (Firefox 23, IE 10, Safari 6) or
     *   the overriden content type (Chrome 28+, Opera 15+).
     *
     *
     * @param mimeType {String} The mimeType for overriding.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    overrideMimeType: function(mimeType) {
      this.__checkDisposed();

      if (this.__nativeXhr.overrideMimeType) {
        this.__nativeXhr.overrideMimeType(mimeType);
      } else {
        throw new Error("Native XHR object doesn't support overrideMimeType.");
      }

      return this;
    },

    /**
     * Get wrapped native XMLHttpRequest (or equivalent).
     *
     * Can be XMLHttpRequest or ActiveX.
     *
     * @return {Object} XMLHttpRequest or equivalent.
     */
    getRequest: function() {
      return this.__nativeXhr;
    },

    /*
    ---------------------------------------------------------------------------
      HELPER
    ---------------------------------------------------------------------------
    */

    /**
     * Dispose object and wrapped native XHR.
     * @return {Boolean} <code>true</code> if the object was successfully disposed
     */
    dispose: function() {
      if (this.__disposed) {
        return false;
      }

      window.clearTimeout(this.__timerId);

      // Remove unload listener in IE. Aborting on unload is no longer required
      // for this instance.
      if (window.detachEvent) {
        window.detachEvent("onunload", this.__onUnloadBound);
      }

      // May fail in IE
      try {
        this.__nativeXhr.onreadystatechange;
      } catch(PropertiesNotAccessable) {
        return false;
      }

      // Clear out listeners
      var noop = function() {};
      this.__nativeXhr.onreadystatechange = noop;
      this.__nativeXhr.onload = noop;
      this.__nativeXhr.onerror = noop;

      // Abort any network activity
      this.abort();

      // Remove reference to native XHR
      this.__nativeXhr = null;

      this.__disposed = true;
      return true;
    },


    /**
     * Check if the request has already beed disposed.
     * @return {Boolean} <code>true</code>, if the request has been disposed.
     */
    isDisposed : function() {
      return !!this.__disposed;
    },


    /*
    ---------------------------------------------------------------------------
      PROTECTED
    ---------------------------------------------------------------------------
    */

    /**
     * Create XMLHttpRequest (or equivalent).
     *
     * @return {Object} XMLHttpRequest or equivalent.
     */
    _createNativeXhr: function() {
      var xhr = qx.core.Environment.get("io.xhr");

      if (xhr === "xhr") {
        return new XMLHttpRequest();
      }

      if (xhr == "activex") {
        return new window.ActiveXObject("Microsoft.XMLHTTP");
      }

      qx.Bootstrap.error(this, "No XHR support available.");
    },

    /**
     * Get protocol of requested URL.
     *
     * @return {String} The used protocol.
     */
    _getProtocol: function() {
      var url = this.__url;
      var protocolRe = /^(\w+:)\/\//;

      // Could be http:// from file://
      if (url !== null && url.match) {
        var match = url.match(protocolRe);
        if (match && match[1]) {
          return match[1];
        }
      }

      return window.location.protocol;
    },

    /*
    ---------------------------------------------------------------------------
      PRIVATE
    ---------------------------------------------------------------------------
    */

    /**
     * @type {Object} XMLHttpRequest or equivalent.
     */
    __nativeXhr: null,

    /**
     * @type {Boolean} Whether request is async.
     */
    __async: null,

    /**
     * @type {Function} Bound __onNativeReadyStateChange handler.
     */
    __onNativeReadyStateChangeBound: null,

    /**
     * @type {Function} Bound __onNativeAbort handler.
     */
    __onNativeAbortBound: null,

    /**
     * @type {Function} Bound __onUnload handler.
     */
    __onUnloadBound: null,

    /**
     * @type {Function} Bound __onTimeout handler.
     */
    __onTimeoutBound: null,

    /**
     * @type {Boolean} Send flag
     */
    __send: null,

    /**
     * @type {String} Requested URL
     */
    __url: null,

    /**
     * @type {Boolean} Abort flag
     */
    __abort: null,

    /**
     * @type {Boolean} Timeout flag
     */
    __timeout: null,

    /**
     * @type {Boolean} Whether object has been disposed.
     */
    __disposed: null,

    /**
     * @type {Number} ID of timeout timer.
     */
    __timerId: null,

    /**
     * @type {Error} Error thrown on open, if any.
     */
    __openError: null,

    /**
     * @type {Boolean} Conditional get flag
     */
     __conditional: null,

    /**
     * Init native XHR.
     */
    __initNativeXhr: function() {
      // Create native XHR or equivalent and hold reference
      this.__nativeXhr = this._createNativeXhr();

      // Track native ready state changes
      this.__nativeXhr.onreadystatechange = this.__onNativeReadyStateChangeBound;

      // Track native abort, when supported
      if (this.__nativeXhr.onabort) {
        this.__nativeXhr.onabort = this.__onNativeAbortBound;
      }

      // Reset flags
      this.__disposed = this.__send = this.__abort = false;
    },

    /**
     * Track native abort.
     *
     * In case the end user cancels the request by other
     * means than calling abort().
     */
    __onNativeAbort: function() {
      // When the abort that triggered this method was not a result from
      // calling abort()
      if (!this.__abort) {
        this.abort();
      }
    },

    /**
     * Handle native onreadystatechange.
     *
     * Calls user-defined function onreadystatechange on each
     * state change and syncs the XHR status properties.
     */
    __onNativeReadyStateChange: function() {
      var nxhr = this.__nativeXhr,
          propertiesReadable = true;

      if (qx.core.Environment.get("qx.debug.io")) {
        qx.Bootstrap.debug(qx.bom.request.Xhr, "Received native readyState: " + nxhr.readyState);
      }

      // BUGFIX: IE, Firefox
      // onreadystatechange() is called twice for readyState OPENED.
      //
      // Call onreadystatechange only when readyState has changed.
      if (this.readyState == nxhr.readyState) {
        return;
      }

      // Sync current readyState
      this.readyState = nxhr.readyState;

      // BUGFIX: IE
      // Superfluous onreadystatechange DONE when aborting OPENED
      // without send flag
      if (this.readyState === qx.bom.request.Xhr.DONE &&
          this.__abort && !this.__send) {
        return;
      }

      // BUGFIX: IE
      // IE fires onreadystatechange HEADERS_RECEIVED and LOADING when sync
      //
      // According to spec, only onreadystatechange OPENED and DONE should
      // be fired.
      if (!this.__async && (nxhr.readyState == 2 || nxhr.readyState == 3)) {
        return;
      }

      // Default values according to spec.
      this.status = 0;
      this.statusText = this.responseText = "";
      this.responseXML = null;

      if (this.readyState >= qx.bom.request.Xhr.HEADERS_RECEIVED) {
        // In some browsers, XHR properties are not readable
        // while request is in progress.
        try {
          this.status = nxhr.status;
          this.statusText = nxhr.statusText;
          this.responseText = nxhr.responseText;
          this.responseXML = nxhr.responseXML;
        } catch(XhrPropertiesNotReadable) {
          propertiesReadable = false;
        }

        if (propertiesReadable) {
          this.__normalizeStatus();
          this.__normalizeResponseXML();
        }
      }

      this.__readyStateChange();

      // BUGFIX: IE
      // Memory leak in XMLHttpRequest (on-page)
      if (this.readyState == qx.bom.request.Xhr.DONE) {
        // Allow garbage collecting of native XHR
        if (nxhr) {
          nxhr.onreadystatechange = function() {};
        }
      }

    },

    /**
     * Handle readystatechange. Called internally when readyState is changed.
     */
    __readyStateChange: function() {
      var that = this;

      // Cancel timeout before invoking handlers because they may throw
      if (this.readyState === qx.bom.request.Xhr.DONE) {
        // Request determined DONE. Cancel timeout.
        window.clearTimeout(this.__timerId);
      }

      // BUGFIX: IE
      // IE < 8 fires LOADING and DONE on open() - before send() - when from cache
      if (qx.core.Environment.get("engine.name") == "mshtml" &&
          qx.core.Environment.get("browser.documentmode") < 8) {

        // Detect premature events when async. LOADING and DONE is
        // illogical to happen before request was sent.
        if (this.__async && !this.__send && this.readyState >= qx.bom.request.Xhr.LOADING) {

          if (this.readyState == qx.bom.request.Xhr.LOADING) {
            // To early to fire, skip.
            return;
          }

          if (this.readyState == qx.bom.request.Xhr.DONE) {
            window.setTimeout(function() {
              if (that.__disposed) {
                return;
              }
              // Replay previously skipped
              that.readyState = 3;
              that._emit("readystatechange");

              that.readyState = 4;
              that._emit("readystatechange");
              that.__readyStateChangeDone();
            });
            return;
          }

        }
      }

      // Always fire "readystatechange"
      this._emit("readystatechange");
      if (this.readyState === qx.bom.request.Xhr.DONE) {
        this.__readyStateChangeDone();
      }
    },

    /**
     * Handle readystatechange. Called internally by
     * {@link #__readyStateChange} when readyState is DONE.
     */
    __readyStateChangeDone: function() {
      // Fire "timeout" if timeout flag is set
      if (this.__timeout) {
        this._emit("timeout");

        // BUGFIX: Opera
        // Since Opera does not fire "error" on network error, fire additional
        // "error" on timeout (may well be related to network error)
        if (qx.core.Environment.get("engine.name") === "opera") {
          this._emit("error");
        }

        this.__timeout = false;

      // Fire either "abort", "load" or "error"
      } else {
        if (this.__abort) {
          this._emit("abort");
        } else{
          if (this.__isNetworkError()) {
            this._emit("error");
          } else {
            this._emit("load");
          }
        }
      }

      // Always fire "onloadend" when DONE
      this._emit("loadend");
    },

    /**
     * Check for network error.
     *
     * @return {Boolean} Whether a network error occured.
     */
    __isNetworkError: function() {
      var error;

      // Infer the XHR internal error flag from statusText when not aborted.
      // See http://www.w3.org/TR/XMLHttpRequest2/#error-flag and
      // http://www.w3.org/TR/XMLHttpRequest2/#the-statustext-attribute
      //
      // With file://, statusText is always falsy. Assume network error when
      // response is empty.
      if (this._getProtocol() === "file:") {
        error = !this.responseText;
      } else {
        error = !this.statusText;
      }

      return error;
    },

    /**
     * Handle faked timeout.
     */
    __onTimeout: function() {
      // Basically, mimick http://www.w3.org/TR/XMLHttpRequest2/#timeout-error
      var nxhr = this.__nativeXhr;
      this.readyState = qx.bom.request.Xhr.DONE;

      // Set timeout flag
      this.__timeout = true;

      // No longer consider request. Abort.
      nxhr.abort();
      this.responseText = "";
      this.responseXML = null;

      // Signal readystatechange
      this.__readyStateChange();
    },

    /**
     * Normalize status property across browsers.
     */
    __normalizeStatus: function() {
      var isDone = this.readyState === qx.bom.request.Xhr.DONE;

      // BUGFIX: Most browsers
      // Most browsers tell status 0 when it should be 200 for local files
      if (this._getProtocol() === "file:" && this.status === 0 && isDone) {
        if (!this.__isNetworkError()) {
          this.status = 200;
        }
      }

      // BUGFIX: IE
      // IE sometimes tells 1223 when it should be 204
      if (this.status === 1223) {
        this.status = 204;
      }

      // BUGFIX: Opera
      // Opera tells 0 for conditional requests when it should be 304
      //
      // Detect response to conditional request that signals fresh cache.
      if (qx.core.Environment.get("engine.name") === "opera") {
        if (
          isDone &&                 // Done
          this.__conditional &&     // Conditional request
          !this.__abort &&          // Not aborted
          this.status === 0         // But status 0!
        ) {
          this.status = 304;
        }
      }
    },

    /**
     * Normalize responseXML property across browsers.
     */
    __normalizeResponseXML: function() {
      // BUGFIX: IE
      // IE does not recognize +xml extension, resulting in empty responseXML.
      //
      // Check if Content-Type is +xml, verify missing responseXML then parse
      // responseText as XML.
      if (qx.core.Environment.get("engine.name") == "mshtml" &&
          (this.getResponseHeader("Content-Type") || "").match(/[^\/]+\/[^\+]+\+xml/) &&
           this.responseXML && !this.responseXML.documentElement) {
        var dom = new window.ActiveXObject("Microsoft.XMLDOM");
        dom.async = false;
        dom.validateOnParse = false;
        dom.loadXML(this.responseText);
        this.responseXML = dom;
      }
    },

    /**
     * Handler for native unload event.
     */
    __onUnload: function() {
      try {
        // Abort and dispose
        if (this) {
          this.dispose();
        }
      } catch(e) {}
    },

    /**
     * Helper method to determine whether browser supports reusing the
     * same native XHR to send more requests.
     * @return {Boolean} <code>true</code> if request object reuse is supported
     */
    __supportsManyRequests: function() {
      var name = qx.core.Environment.get("engine.name");
      var version = qx.core.Environment.get("browser.version");

      return !(name == "mshtml" && version < 9 ||
               name == "gecko" && version < 3.5);
    },

    /**
     * Throw when already disposed.
     */
    __checkDisposed: function() {
      if (this.__disposed) {
        throw new Error("Already disposed");
      }
    }
  },

  defer: function() {
    qx.core.Environment.add("qx.debug.io", false);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Richard Sternagel (rsternagel)

************************************************************************ */

/**
 * Parsers for parsing response strings (especially for XHR).
 *
 * Known parsers are: <code>"json"</code> and <code>"xml"</code>.
 *
 * @require(qx.util.ResponseParser#parse)
 */
qx.Bootstrap.define("qx.util.ResponseParser",
{

  /**
   * @param parser {String|Function} See {@link #setParser}.
   */
  construct: function(parser) {
    if (parser !== undefined) {
      this.setParser(parser);
    }
  },

  statics:
  {
    /**
     * @type {Map} Map of parser functions. Parsers defined here can be
     * referenced symbolically, e.g. with {@link #setParser}.
     *
     * Known parsers are: <code>"json"</code> and <code>"xml"</code>.
     */
    PARSER: {
      json: qx.lang.Json.parse,
      xml: qx.xml.Document.fromString
    }
  },

  members :
  {
    __parser: null,

    /**
     * Returns given response parsed with parser
     * determined by {@link #_getParser}.
     *
     * @param response {String} response (e.g JSON/XML string)
     * @param contentType {String} contentType (e.g. 'application/json')
     * @return {String|Object} The parsed response of the request.
     */
    parse: function(response, contentType) {
      var parser = this._getParser(contentType);

      if (typeof parser === "function") {
        if (response !== "") {
          return parser.call(this, response);
        }
      }

      return response;
    },


    /**
     * Set parser used to parse response once request has
     * completed successfully.
     *
     * Usually, the parser is correctly inferred from the
     * content type of the response. This method allows to force the
     * parser being used, e.g. if the content type returned from
     * the backend is wrong or the response needs special parsing.
     *
     * Parser most typically used can be referenced symbolically.
     * To cover edge cases, a function can be given. When parsing
     * the response, this function is called with the raw response as
     * first argument.
     *
     * @param parser {String|Function}
     *
     * Can be:
     *
     * <ul>
     *   <li>A parser defined in {@link qx.util.ResponseParser#PARSER},
     *       referenced by string.</li>
     *   <li>The function to invoke.
     *       Receives the raw response as argument.</li>
     * </ul>
     *
     * @return {Function} The parser function
     */
    setParser: function(parser) {
      // Symbolically given known parser
      if (typeof qx.util.ResponseParser.PARSER[parser] === "function") {
        return this.__parser = qx.util.ResponseParser.PARSER[parser];
      }

      // If parser is not a symbol, it must be a function
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertFunction(parser);
      }

      return this.__parser = parser;
    },


    /**
     * Gets the parser.
     *
     * If not defined explicitly using {@link #setParser},
     * the parser is inferred from the content type.
     *
     * Override this method to extend the list of content types
     * being handled.
     *
     * @param contentType {String}
     * @return {Function|null} The parser function or <code>null</code> if the
     * content type is undetermined.
     *
     */
    _getParser: function(contentType) {
      var parser = this.__parser,
          contentTypeOrig = "",
          contentTypeNormalized = "";

      // Use user-provided parser, if any
      if (parser) {
        return parser;
      }

      // See http://restpatterns.org/Glossary/MIME_Type

      contentTypeOrig = contentType || "";

      // Ignore parameters (e.g. the character set)
      contentTypeNormalized = contentTypeOrig.replace(/;.*$/, "");

      if ((/^application\/(\w|\.)*\+?json$/).test(contentTypeNormalized)) {
        parser = qx.util.ResponseParser.PARSER.json;
      }

      if ((/^application\/xml$/).test(contentTypeNormalized)) {
        parser = qx.util.ResponseParser.PARSER.xml;
      }

      // Deprecated
      if ((/[^\/]+\/[^\+]+\+xml$/).test(contentTypeOrig)) {
        parser = qx.util.ResponseParser.PARSER.xml;
      }

      return parser;
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
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * The Scroller wraps a {@link Pane} and provides scroll bars to interactively
 * scroll the pane's content.
 *
 * @childControl pane {qx.ui.virtual.core.Pane} Virtual pane.
 */
qx.Class.define("qx.ui.virtual.core.Scroller",
{
  extend : qx.ui.core.scroll.AbstractScrollArea,


  /**
   * @param rowCount {Integer?0} The number of rows of the virtual grid.
   * @param columnCount {Integer?0} The number of columns of the virtual grid.
   * @param cellHeight {Integer?10} The default cell height.
   * @param cellWidth {Integer?10} The default cell width.
   */
  construct : function(rowCount, columnCount, cellHeight, cellWidth)
  {
    this.base(arguments);

    this.__pane = new qx.ui.virtual.core.Pane(rowCount, columnCount, cellHeight, cellWidth);
    this.__pane.addListener("update", this._computeScrollbars, this);
    this.__pane.addListener("scrollX", this._onScrollPaneX, this);
    this.__pane.addListener("scrollY", this._onScrollPaneY, this);

    if (qx.core.Environment.get("os.scrollBarOverlayed")) {
      this._add(this.__pane, {edge: 0});
    } else {
      this._add(this.__pane, {row: 0, column: 0});
    }

  },


  properties :
  {
    // overridden
    width :
    {
      refine : true,
      init : null
    },


    // overridden
    height :
    {
      refine : true,
      init : null
    }
  },


  members :
  {
    /** @type {Pane} Virtual pane. */
    __pane : null,


    /*
    ---------------------------------------------------------------------------
      ACCESSOR METHODS
    ---------------------------------------------------------------------------
    */


    /**
     * Get the scroller's virtual pane.
     *
     * @return {Pane} The scroller's pane.
     */
    getPane : function() {
      return this.__pane;
    },


    /*
    ---------------------------------------------------------------------------
      CHILD CONTROL SUPPORT
    ---------------------------------------------------------------------------
    */


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      if (id == "pane") {
        return this.__pane;
      } else {
        return this.base(arguments, id);
      }
    },


    /*
    ---------------------------------------------------------------------------
      ITEM LOCATION SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * NOT IMPLEMENTED
     *
     * @param item {qx.ui.core.Widget} Item to query.
     * @return {Integer} Top offset.
     * @abstract
     */
    getItemTop : function(item)
    {
      throw new Error("The method 'getItemTop' is not implemented!");
    },


    /**
     * NOT IMPLEMENTED
     *
     * @param item {qx.ui.core.Widget} Item to query.
     * @return {Integer} Top offset.
     * @abstract
     */
    getItemBottom : function(item)
    {
      throw new Error("The method 'getItemBottom' is not implemented!");
    },


    /**
     * NOT IMPLEMENTED
     *
     * @param item {qx.ui.core.Widget} Item to query.
     * @return {Integer} Top offset.
     * @abstract
     */
    getItemLeft : function(item)
    {
      throw new Error("The method 'getItemLeft' is not implemented!");
    },


    /**
     * NOT IMPLEMENTED
     *
     * @param item {qx.ui.core.Widget} Item to query.
     * @return {Integer} Right offset.
     * @abstract
     */
    getItemRight : function(item)
    {
      throw new Error("The method 'getItemRight' is not implemented!");
    },


    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */


    // overridden
    _onScrollBarX : function(e) {
      this.__pane.setScrollX(e.getData());
    },


    // overridden
    _onScrollBarY : function(e) {
      this.__pane.setScrollY(e.getData());
    }
  },


  destruct : function()
  {
    this.__pane.dispose();
    this.__pane = null;
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
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * The Pane provides a window of a larger virtual grid.
 *
 * The actual rendering is performed by one or several layers ({@link ILayer}.
 * The pane computes, which cells of the virtual area is visible and instructs
 * the layers to render these cells.
 */
qx.Class.define("qx.ui.virtual.core.Pane",
{
  extend : qx.ui.core.Widget,


  /**
   * @param rowCount {Integer?0} The number of rows of the virtual grid.
   * @param columnCount {Integer?0} The number of columns of the virtual grid.
   * @param cellHeight {Integer?10} The default cell height.
   * @param cellWidth {Integer?10} The default cell width.
   */
  construct : function(rowCount, columnCount, cellHeight, cellWidth)
  {
    this.base(arguments);

    this.__rowConfig = new qx.ui.virtual.core.Axis(cellHeight, rowCount);
    this.__columnConfig = new qx.ui.virtual.core.Axis(cellWidth, columnCount);

    this.__scrollTop = 0;
    this.__scrollLeft = 0;


    this.__paneHeight = 0;
    this.__paneWidth = 0;

    this.__layerWindow = {};
    this.__jobs = {};

    // create layer container. The container does not have a layout manager
    // layers are positioned using "setUserBounds"
    this.__layerContainer = new qx.ui.container.Composite();
    this.__layerContainer.setUserBounds(0, 0, 0, 0);
    this._add(this.__layerContainer);

    this.__layers = [];

    this.__rowConfig.addListener("change", this.fullUpdate, this);
    this.__columnConfig.addListener("change", this.fullUpdate, this);

    this.addListener("resize", this._onResize, this);
    this.addListenerOnce("appear", this._onAppear, this);

    this.addListener("mousedown", this._onMouseDown, this);
    this.addListener("click", this._onClick, this);
    this.addListener("dblclick", this._onDblclick, this);
    this.addListener("contextmenu", this._onContextmenu, this);
  },


  events :
  {
    /** Fired if a cell is clicked. */
    cellClick : "qx.ui.virtual.core.CellEvent",

    /** Fired if a cell is right-clicked. */
    cellContextmenu : "qx.ui.virtual.core.CellEvent",

    /** Fired if a cell is double-clicked. */
    cellDblclick : "qx.ui.virtual.core.CellEvent",

    /** Fired on resize of either the container or the (virtual) content. */
    update : "qx.event.type.Event",

    /** Fired if the pane is scrolled horizontally. */
    scrollX : "qx.event.type.Data",

    /** Fired if the pane is scrolled vertically. */
    scrollY : "qx.event.type.Data"
  },


  properties :
  {
    // overridden
    width :
    {
      refine : true,
      init : 400
    },


    // overridden
    height :
    {
      refine : true,
      init : 300
    }
  },


  members :
  {
    __rowConfig : null,
    __columnConfig : null,
    __scrollTop : null,
    __scrollLeft : null,
    __paneHeight : null,
    __paneWidth : null,
    __layerWindow : null,
    __jobs : null,
    __layerContainer : null,
    __layers : null,
    __dontFireUpdate : null,
    __columnSizes : null,
    __rowSizes : null,
    __mouseDownCoords : null,


    /*
    ---------------------------------------------------------------------------
      ACCESSOR METHODS
    ---------------------------------------------------------------------------
    */


    /**
     * Get the axis object, which defines the row numbers and the row sizes.
     *
     * @return {Axis} The row configuration.
     */
    getRowConfig : function() {
      return this.__rowConfig;
    },


    /**
     * Get the axis object, which defines the column numbers and the column sizes.
     *
     * @return {Axis} The column configuration.
     */
    getColumnConfig : function() {
      return this.__columnConfig;
    },


    /*
    ---------------------------------------------------------------------------
      LAYER MANAGEMENT
    ---------------------------------------------------------------------------
    */


    /**
     * Returns an array containing the layer container.
     *
     * @return {Object[]} The layer container array.
     */
    getChildren : function() {
      return [this.__layerContainer];
    },


    /**
     * Add a layer to the layer container.
     *
     * @param layer {ILayer} The layer to add.
     */
    addLayer : function(layer)
    {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertInterface(layer, qx.ui.virtual.core.ILayer);
      }

      this.__layers.push(layer);
      layer.setUserBounds(0, 0, 0, 0);
      this.__layerContainer.add(layer);
    },


    /**
     * Get a list of all layers.
     *
     * @return {ILayer[]} List of the pane's layers.
     */
    getLayers : function() {
      return this.__layers;
    },


    /**
     * Get a list of all visible layers.
     *
     * @return {ILayer[]} List of the pane's visible layers.
     */
    getVisibleLayers : function()
    {
      var layers = [];
      for (var i=0; i<this.__layers.length; i++)
      {
        var layer = this.__layers[i];
        if (layer.isVisible()) {
          layers.push(layer);
        }
      }
      return layers;
    },


    /*
    ---------------------------------------------------------------------------
      SCROLL SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * The maximum horizontal scroll position.
     *
     * @return {Integer} Maximum horizontal scroll position.
     */
    getScrollMaxX : function()
    {
      var paneSize = this.getInnerSize();

      if (paneSize) {
        return Math.max(0, this.__columnConfig.getTotalSize() - paneSize.width);
      }

      return 0;
    },


    /**
     * The maximum vertical scroll position.
     *
     * @return {Integer} Maximum vertical scroll position.
     */
    getScrollMaxY : function()
    {
      var paneSize = this.getInnerSize();

      if (paneSize) {
        return Math.max(0, this.__rowConfig.getTotalSize() - paneSize.height);
      }

      return 0;
    },


    /**
     * Scrolls the content to the given left coordinate.
     *
     * @param value {Integer} The vertical position to scroll to.
     */
    setScrollY : function(value)
    {
      var max = this.getScrollMaxY();

      if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }

      if (this.__scrollTop !== value)
      {
        var old = this.__scrollTop;
        this.__scrollTop = value;
        this._deferredUpdateScrollPosition();
        this.fireDataEvent("scrollY", value, old);
      }
    },


    /**
     * Returns the vertical scroll offset.
     *
     * @return {Integer} The vertical scroll offset.
     */
    getScrollY : function() {
      return this.__scrollTop;
    },


    /**
     * Scrolls the content to the given top coordinate.
     *
     * @param value {Integer} The horizontal position to scroll to.
     */
    setScrollX : function(value)
    {
      var max = this.getScrollMaxX();

      if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }

      if (value !== this.__scrollLeft)
      {
        var old = this.__scrollLeft;
        this.__scrollLeft = value;
        this._deferredUpdateScrollPosition();

        this.fireDataEvent("scrollX", value, old);
      }
    },


    /**
     * Returns the horizontal scroll offset.
     *
     * @return {Integer} The horizontal scroll offset.
     */
    getScrollX : function() {
      return this.__scrollLeft;
    },


    /**
     * The (virtual) size of the content.
     *
     * @return {Map} Size of the content (keys: <code>width</code> and
     *     <code>height</code>).
     */
    getScrollSize : function()
    {
      return {
        width: this.__columnConfig.getTotalSize(),
        height: this.__rowConfig.getTotalSize()
      }
    },


    /*
    ---------------------------------------------------------------------------
      SCROLL INTO VIEW SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * Scrolls a row into the visible area of the pane.
     *
     * @param row {Integer} The row's index.
     */
    scrollRowIntoView : function(row)
    {
      var bounds = this.getBounds();
      if (!bounds)
      {
        this.addListenerOnce("appear", function()
        {
          // It's important that the registered events are first dispatched.
          qx.event.Timer.once(function() {
            this.scrollRowIntoView(row);
          }, this, 0);
        }, this);
        return;
      }

      var itemTop = this.__rowConfig.getItemPosition(row);
      var itemBottom = itemTop + this.__rowConfig.getItemSize(row);
      var scrollTop = this.getScrollY();

      if (itemTop < scrollTop) {
        this.setScrollY(itemTop);
      } else if (itemBottom > scrollTop + bounds.height) {
        this.setScrollY(itemBottom - bounds.height);
      }
    },


    /**
     * Scrolls a column into the visible area of the pane.
     *
     * @param column {Integer} The column's index.
     */
    scrollColumnIntoView : function(column)
    {
      var bounds = this.getBounds();
      if (!bounds)
      {
        this.addListenerOnce("appear", function()
        {
          // It's important that the registered events are first dispatched.
          qx.event.Timer.once(function() {
            this.scrollColumnIntoView(column);
          }, this, 0);
        }, this);
        return;
      }

      var itemLeft = this.__columnConfig.getItemPosition(column);
      var itemRight = itemLeft + this.__columnConfig.getItemSize(column);
      var scrollLeft = this.getScrollX();

      if (itemLeft < scrollLeft) {
        this.setScrollX(itemLeft);
      } else if (itemRight > scrollLeft + bounds.width) {
        this.setScrollX(itemRight - bounds.width);
      }
    },


    /**
     * Scrolls a grid cell into the visible area of the pane.
     *
     * @param row {Integer} The cell's row index.
     * @param column {Integer} The cell's column index.
     */
    scrollCellIntoView : function(column, row)
    {
      var bounds = this.getBounds();
      if (!bounds)
      {
        this.addListenerOnce("appear", function()
        {
          // It's important that the registered events are first dispatched.
          qx.event.Timer.once(function() {
            this.scrollCellIntoView(column, row);
          }, this, 0);
        }, this);
        return;
      }

      this.scrollColumnIntoView(column);
      this.scrollRowIntoView(row);
    },


    /*
    ---------------------------------------------------------------------------
      CELL SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * Get the grid cell at the given absolute document coordinates. This method
     * can be used to convert the mouse position returned by
     * {@link qx.event.type.Mouse#getDocumentLeft} and
     * {@link qx.event.type.Mouse#getDocumentLeft} into cell coordinates.
     *
     * @param documentX {Integer} The x coordinate relative to the viewport
     *    origin.
     * @param documentY {Integer} The y coordinate relative to the viewport
     *    origin.
     * @return {Map|null} A map containing the <code>row</code> and <code>column</code>
     *    of the found cell. If the coordinate is outside of the pane's bounds
     *    or there is no cell at the coordinate <code>null</code> is returned.
     */
    getCellAtPosition: function(documentX, documentY)
    {
      var rowData, columnData;
      var paneLocation = this.getContentLocation();

      if (
        !paneLocation ||
        documentY < paneLocation.top ||
        documentY >= paneLocation.bottom ||
        documentX < paneLocation.left ||
        documentX >= paneLocation.right
      ) {
        return null;
      }

      rowData = this.__rowConfig.getItemAtPosition(
        this.getScrollY() + documentY - paneLocation.top
      );

      columnData = this.__columnConfig.getItemAtPosition(
        this.getScrollX() + documentX - paneLocation.left
      );

      if (!rowData || !columnData) {
        return null;
      }

      return {
        row : rowData.index,
        column : columnData.index
      };
    },


    /*
    ---------------------------------------------------------------------------
      PREFETCH SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * Increase the layers width beyond the needed width to improve
     * horizontal scrolling. The layers are only resized if invisible parts
     * left/right of the pane window are smaller than minLeft/minRight.
     *
     * @param minLeft {Integer} Only prefetch if the invisible part left of the
     *    pane window if smaller than this (pixel) value.
     * @param maxLeft {Integer} The amount of pixel the layers should reach
     *    left of the pane window.
     * @param minRight {Integer} Only prefetch if the invisible part right of the
     *    pane window if smaller than this (pixel) value.
     * @param maxRight {Integer} The amount of pixel the layers should reach
     *    right of the pane window.
     */
    prefetchX : function(minLeft, maxLeft, minRight, maxRight)
    {
      var layers = this.getVisibleLayers();
      if (layers.length == 0) {
        return;
      }

      var bounds = this.getBounds();
      if (!bounds) {
        return;
      }

      var paneRight = this.__scrollLeft + bounds.width;
      var rightAvailable = this.__paneWidth - paneRight;
      if (
        this.__scrollLeft - this.__layerWindow.left  < Math.min(this.__scrollLeft, minLeft) ||
        this.__layerWindow.right - paneRight < Math.min(rightAvailable, minRight)
      )
      {
        var left = Math.min(this.__scrollLeft, maxLeft);
        var right = Math.min(rightAvailable, maxRight)
        this._setLayerWindow(
          layers,
          this.__scrollLeft - left,
          this.__scrollTop,
          bounds.width + left + right,
          bounds.height,
          false
        );
      }
    },


    /**
     * Increase the layers height beyond the needed height to improve
     * vertical scrolling. The layers are only resized if invisible parts
     * above/below the pane window are smaller than minAbove/minBelow.
     *
     * @param minAbove {Integer} Only prefetch if the invisible part above the
     *    pane window if smaller than this (pixel) value.
     * @param maxAbove {Integer} The amount of pixel the layers should reach
     *    above the pane window.
     * @param minBelow {Integer} Only prefetch if the invisible part below the
     *    pane window if smaller than this (pixel) value.
     * @param maxBelow {Integer} The amount of pixel the layers should reach
     *    below the pane window.
     */
    prefetchY : function(minAbove, maxAbove, minBelow, maxBelow)
    {
      var layers = this.getVisibleLayers();
      if (layers.length == 0) {
        return;
      }

      var bounds = this.getBounds();
      if (!bounds) {
        return;
      }

      var paneBottom = this.__scrollTop + bounds.height;
      var belowAvailable = this.__paneHeight - paneBottom;
      if (
        this.__scrollTop - this.__layerWindow.top  < Math.min(this.__scrollTop, minAbove) ||
        this.__layerWindow.bottom - paneBottom < Math.min(belowAvailable, minBelow)
      )
      {
        var above = Math.min(this.__scrollTop, maxAbove);
        var below = Math.min(belowAvailable, maxBelow)
        this._setLayerWindow(
          layers,
          this.__scrollLeft,
          this.__scrollTop - above,
          bounds.width,
          bounds.height + above + below,
          false
        );
      }
    },


    /*
    ---------------------------------------------------------------------------
      EVENT LISTENER
    ---------------------------------------------------------------------------
    */


    /**
     * Resize event handler.
     *
     * Updates the visible window.
     */
    _onResize : function()
    {
      if (this.getContentElement().getDomElement())
      {
        this.__dontFireUpdate = true;
        this._updateScrollPosition();
        this.__dontFireUpdate = null;
        this.fireEvent("update");
      }
    },


    /**
     * Resize event handler. Do a full update on first appear.
     */
    _onAppear : function() {
      this.fullUpdate();
    },

    /**
     * Event listener for mouse down. Remembers cell position to prevent mouse event when cell position change.
     *
     * @param e {qx.event.type.Mouse} The incoming mouse event.
     */
    _onMouseDown : function(e) {
      this.__mouseDownCoords = this.getCellAtPosition(e.getDocumentLeft(), e.getDocumentTop());
    },

    /**
     * Event listener for mouse clicks. Fires an cellClick event.
     *
     * @param e {qx.event.type.Mouse} The incoming mouse event.
     */
    _onClick : function(e) {
      this.__handleMouseCellEvent(e, "cellClick");
    },


    /**
     * Event listener for context menu clicks. Fires an cellContextmenu event.
     *
     * @param e {qx.event.type.Mouse} The incoming mouse event.
     */
    _onContextmenu : function(e) {
      this.__handleMouseCellEvent(e, "cellContextmenu");
    },


    /**
     * Event listener for double clicks. Fires an cellDblclick event.
     *
     * @param e {qx.event.type.Mouse} The incoming mouse event.
     */
    _onDblclick : function(e) {
       this.__handleMouseCellEvent(e, "cellDblclick");
    },


    /**
     * Converts a mouse event into a cell event and fires the cell event if the
     * mouse is over a cell.
     *
     * @param e {qx.event.type.Mouse} The mouse event.
     * @param cellEventType {String} The name of the cell event to fire.
     */
    __handleMouseCellEvent : function(e, cellEventType)
    {
      var coords = this.getCellAtPosition(e.getDocumentLeft(), e.getDocumentTop());
      if (!coords) {
        return;
      }

      var mouseDownCoords = this.__mouseDownCoords;
      if (mouseDownCoords == null || mouseDownCoords.row !== coords.row || mouseDownCoords.column !== coords.column) {
        return;
      }

      this.fireNonBubblingEvent(
        cellEventType,
        qx.ui.virtual.core.CellEvent,
        [this, e, coords.row, coords.column]
      );
    },


    /*
    ---------------------------------------------------------------------------
      PANE UPDATE
    ---------------------------------------------------------------------------
    */


    // overridden
    syncWidget : function(jobs)
    {
      if (this.__jobs._fullUpdate) {
        this._fullUpdate();
      } else if (this.__jobs._updateScrollPosition) {
        this._updateScrollPosition();
      }
      this.__jobs = {};
    },


    /**
     * Sets the size of the layers to contain the cells at the pixel position
     * "left/right" up to "left+minHeight/right+minHeight". The offset of the
     * layer container is adjusted to respect the pane's scroll top and scroll
     * left values.
     *
     * @param layers {ILayer[]} List of layers to update.
     * @param left {Integer} Maximum left pixel coordinate of the layers.
     * @param top {Integer} Maximum top pixel coordinate of the layers.
     * @param minWidth {Integer} The minimum end coordinate of the layers will
     *    be larger than <code>left+minWidth</code>.
     * @param minHeight {Integer} The minimum end coordinate of the layers will
     *    be larger than <code>top+minHeight</code>.
     * @param doFullUpdate {Boolean?false} Whether a full update on the layer
     *    should be performed of if only the layer window should be updated.
     */
    _setLayerWindow : function(layers, left, top, minWidth, minHeight, doFullUpdate)
    {
      var rowCellData = this.__rowConfig.getItemAtPosition(top);
      if (rowCellData)
      {
        var firstRow = rowCellData.index;
        var rowSizes = this.__rowConfig.getItemSizes(firstRow, minHeight + rowCellData.offset);
        var layerHeight = qx.lang.Array.sum(rowSizes);
        var layerTop = top - rowCellData.offset;
        var layerBottom = top - rowCellData.offset + layerHeight;
      }
      else
      {
        var firstRow = 0;
        var rowSizes = [];
        var layerHeight = 0;
        var layerTop = 0;
        var layerBottom = 0;
      }

      var columnCellData = this.__columnConfig.getItemAtPosition(left);
      if (columnCellData)
      {
        var firstColumn = columnCellData.index;
        var columnSizes = this.__columnConfig.getItemSizes(firstColumn, minWidth + columnCellData.offset);
        var layerWidth = qx.lang.Array.sum(columnSizes);
        var layerLeft = left - columnCellData.offset;
        var layerRight = left - columnCellData.offset + layerWidth;
      }
      else
      {
        var firstColumn = 0;
        var columnSizes = [];
        var layerWidth = 0;
        var layerLeft = 0;
        var layerRight = 0;
      }

      this.__layerWindow = {
        top: layerTop,
        bottom: layerBottom,
        left: layerLeft,
        right: layerRight
      }

      this.__layerContainer.setUserBounds(
        (this.getPaddingLeft() || 0) + (this.__layerWindow.left - this.__scrollLeft),
        (this.getPaddingTop() || 0) + (this.__layerWindow.top - this.__scrollTop),
        layerWidth, layerHeight
      );

      this.__columnSizes = columnSizes;
      this.__rowSizes = rowSizes;

      for (var i=0; i<this.__layers.length; i++)
      {
        var layer = this.__layers[i];
        layer.setUserBounds(0, 0, layerWidth, layerHeight);

        if (doFullUpdate) {
          layer.fullUpdate(firstRow, firstColumn, rowSizes, columnSizes);
        } else {
          layer.updateLayerWindow(firstRow, firstColumn, rowSizes, columnSizes);
        }
      }
    },



    /**
     * Check whether the pane was resized and fire an {@link #update} event if
     * it was.
     */
    __checkPaneResize : function()
    {
      if (this.__dontFireUpdate) {
        return;
      }

      var scrollSize = this.getScrollSize();
      if (
        this.__paneHeight !== scrollSize.height ||
        this.__paneWidth !== scrollSize.width
      )
      {
        this.__paneHeight = scrollSize.height;
        this.__paneWidth = scrollSize.width;
        this.fireEvent("update");
      }
    },


    /**
     * Schedule a full update on all visible layers.
     */
    fullUpdate : function()
    {
      this.__jobs._fullUpdate = 1;
      qx.ui.core.queue.Widget.add(this);
    },


    /**
     * Whether a full update is scheduled.
     *
     * @return {Boolean} Whether a full update is scheduled.
     */
    isUpdatePending : function() {
      return !!this.__jobs._fullUpdate;
    },


    /**
     * Perform a full update on all visible layers. All cached data will be
     * discarded.
     */
    _fullUpdate : function()
    {
      var layers = this.getVisibleLayers();
      if (layers.length == 0)
      {
        this.__checkPaneResize();
        return;
      }

      var bounds = this.getBounds();

      if (!bounds) {
        return; // the pane has not yet been rendered -> wait for the appear event
      }



      this._setLayerWindow(
        layers,
        this.__scrollLeft, this.__scrollTop,
        bounds.width, bounds.height,
        true
      );

      this.__checkPaneResize();
    },


    /**
     * Schedule an update the visible window of the grid according to the top
     * and left scroll positions.
     */
    _deferredUpdateScrollPosition : function()
    {
      this.__jobs._updateScrollPosition = 1;
      qx.ui.core.queue.Widget.add(this);
    },


    /**
     * Update the visible window of the grid according to the top and left scroll
     * positions.
     */
    _updateScrollPosition : function()
    {
      var layers = this.getVisibleLayers();
      if (layers.length == 0)
      {
        this.__checkPaneResize();
        return;
      }

      var bounds = this.getBounds();
      if (!bounds) {
        return; // the pane has not yet been rendered -> wait for the appear event
      }

      // the visible window of the virtual coordinate space
      var paneWindow = {
        top: this.__scrollTop,
        bottom: this.__scrollTop + bounds.height,
        left: this.__scrollLeft,
        right: this.__scrollLeft + bounds.width
      };

      if (
        this.__layerWindow.top <= paneWindow.top &&
        this.__layerWindow.bottom >= paneWindow.bottom &&
        this.__layerWindow.left <= paneWindow.left &&
        this.__layerWindow.right >= paneWindow.right
      )
      {
        // only update layer container offset
        this.__layerContainer.setUserBounds(
          (this.getPaddingLeft() || 0) + (this.__layerWindow.left - paneWindow.left),
          (this.getPaddingTop() || 0) + (this.__layerWindow.top - paneWindow.top),
          this.__layerWindow.right - this.__layerWindow.left,
          this.__layerWindow.bottom - this.__layerWindow.top
        );
      }
      else
      {
        this._setLayerWindow(
          layers,
          this.__scrollLeft, this.__scrollTop,
          bounds.width, bounds.height,
          false
        )
      }

      this.__checkPaneResize();
    }
  },


  destruct : function()
  {
    this._disposeArray("__layers");
    this._disposeObjects("__rowConfig", "__columnConfig", "__layerContainer");
    this.__layerWindow = this.__jobs = this.__columnSizes =
      this.__rowSizes = null;
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * The axis maps virtual screen coordinates to item indexes. By default all
 * items have the same size but it is also possible to give specific items
 * a different size.
 */
qx.Class.define("qx.ui.virtual.core.Axis",
{
  extend : qx.core.Object,

  /**
   * @param defaultItemSize {Integer} The default size of the items.
   * @param itemCount {Integer} The number of item on the axis.
   */
  construct : function(defaultItemSize, itemCount)
  {
    this.base(arguments);

    this.itemCount = itemCount;
    this.defaultItemSize = defaultItemSize;

    // sparse array
    this.customSizes = {};
  },


  events :
  {
    /** Every change to the axis configuration triggers this event. */
    "change" : "qx.event.type.Event"
  },


  members :
  {
    __ranges : null,


    /**
     * Get the default size of the items.
     *
     * @return {Integer} The default item size.
     */
    getDefaultItemSize : function() {
      return this.defaultItemSize;
    },


    /**
     * Set the default size the items.
     *
     * @param defaultItemSize {Integer} The default size of the items.
     */
    setDefaultItemSize : function(defaultItemSize)
    {
      if (this.defaultItemSize !== defaultItemSize)
      {
        this.defaultItemSize = defaultItemSize;
        this.__ranges = null;
        this.fireNonBubblingEvent("change");
      }
    },


    /**
     * Get the number of items in the axis.
     *
     * @return {Integer} The number of items.
     */
    getItemCount : function() {
      return this.itemCount;
    },


    /**
     * Set the number of items in the axis.
     *
     * @param itemCount {Integer} The new item count.
     */
    setItemCount : function(itemCount)
    {
      if (this.itemCount !== itemCount)
      {
        this.itemCount = itemCount;
        this.__ranges = null;
        this.fireNonBubblingEvent("change");
      }
    },


    /**
     * Sets the size of a specific item. This allow item, which have a size
     * different from the default size.
     *
     * @param index {Integer} Index of the item to change.
     * @param size {Integer} New size of the item.
     */
    setItemSize : function(index, size)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertArgumentsCount(arguments, 2, 2);
        this.assert(
          size > 0 || size === null,
          "'size' must be 'null' or an integer larger than 0."
        );
      }
      if (this.customSizes[index] == size) {
        return;
      }

      if (size === null) {
        delete this.customSizes[index];
      } else {
        this.customSizes[index] = size;
      }
      this.__ranges = null;
      this.fireNonBubblingEvent("change");
    },


    /**
     * Get the size of the item at the given index.
     *
     * @param index {Integer} Index of the item to get the size for.
     * @return {Integer} Size of the item.
     */
    getItemSize : function(index)
    {
      // custom size of 0 is not allowed
      return this.customSizes[index] || this.defaultItemSize;
    },


    /**
     * Reset all custom sizes set with {@link #setItemSize}.
     */
    resetItemSizes : function()
    {
      this.customSizes = {};
      this.__ranges = null;
      this.fireNonBubblingEvent("change");
    },


    /**
     * Split the position range into disjunct intervals. Each interval starts
     * with a custom sized cell. Each position is contained in exactly one range.
     * The ranges are sorted according to their start position.
     *
     * Complexity: O(n log n) (n = number of custom sized cells)
     *
     * @return {Map[]} The sorted list of ranges.
     */
    __getRanges : function()
    {
      if (this.__ranges) {
        return this.__ranges;
      }

      var defaultSize = this.defaultItemSize;
      var itemCount = this.itemCount;

      var indexes = [];
      for (var key in this.customSizes)
      {
        var index = parseInt(key, 10);
        if (index < itemCount) {
          indexes.push(index);
        }
      }
      if (indexes.length == 0)
      {
        var ranges = [{
          startIndex: 0,
          endIndex: itemCount - 1,
          firstItemSize: defaultSize,
          rangeStart: 0,
          rangeEnd: itemCount * defaultSize - 1
        }];
        this.__ranges = ranges;
        return ranges;
      }

      indexes.sort(function(a,b) { return a > b ? 1 : -1});

      var ranges = [];
      var correctionSum = 0;

      for (var i=0; i<indexes.length; i++)
      {
        var index = indexes[i];
        if (index >= itemCount) {
          break;
        }

        var cellSize = this.customSizes[index];
        var rangeStart = index * defaultSize + correctionSum;

        correctionSum += cellSize - defaultSize;

        ranges[i] = {
          startIndex: index,
          firstItemSize: cellSize,
          rangeStart: rangeStart
        };
        if (i > 0) {
          ranges[i-1].rangeEnd = rangeStart-1;
          ranges[i-1].endIndex = index-1;
        }
      }

      // fix first range
      if (ranges[0].rangeStart > 0)
      {
        ranges.unshift({
          startIndex: 0,
          endIndex: ranges[0].startIndex-1,
          firstItemSize: defaultSize,
          rangeStart: 0,
          rangeEnd: ranges[0].rangeStart-1
        });
      }

      // fix last range
      var lastRange = ranges[ranges.length-1];
      var remainingItemsSize = (itemCount - lastRange.startIndex - 1) * defaultSize;
      lastRange.rangeEnd = lastRange.rangeStart + lastRange.firstItemSize + remainingItemsSize - 1;
      lastRange.endIndex = itemCount - 1;

      this.__ranges = ranges;
      return ranges;
    },


    /**
     * Returns the range, which contains the position
     *
     * Complexity: O(log n) (n = number of custom sized cells)
     *
     * @param position {Integer} The position.
     * @return {Map} The range, which contains the given position.
     */
    __findRangeByPosition : function(position)
    {
      var ranges = this.__ranges || this.__getRanges();

      var start = 0;
      var end = ranges.length-1;

      // binary search in the sorted ranges list
      while (true)
      {
        var pivot = start + ((end - start) >> 1);
        var range = ranges[pivot];

        if (range.rangeEnd < position) {
          start = pivot + 1;
        } else if (range.rangeStart > position) {
          end = pivot - 1;
        } else {
          return range;
        }
      }
    },


    /**
     * Get the item and the offset into the item at the given position.
     *
     * @param position {Integer|null} The position to get the item for.
     * @return {Map} A map with the keys <code>index</code> and
     *    <code>offset</code>. The index is the index of the item containing the
     *    position and offsets specifies offset into this item. If the position
     *    is outside of the range, <code>null</code> is returned.
     */
    getItemAtPosition : function(position)
    {
      if (position < 0 || position >= this.getTotalSize()) {
        return null;
      }

      var range = this.__findRangeByPosition(position);

      var startPos = range.rangeStart;
      var index = range.startIndex;
      var firstItemSize = range.firstItemSize;

      if (startPos + firstItemSize > position)
      {
        return {
          index: index,
          offset: position - startPos
        }
      }
      else
      {
        var defaultSize = this.defaultItemSize;
        return {
          index: index + 1 + Math.floor((position - startPos - firstItemSize) / defaultSize),
          offset: (position - startPos - firstItemSize) % defaultSize
        }
      }
    },


    /**
     * Returns the range, which contains the position.
     *
     * Complexity: O(log n) (n = number of custom sized cells)
     *
     * @param index {Integer} The index of the item to get the range for.
     * @return {Map} The range for the index.
     */
    __findRangeByIndex : function(index)
    {
      var ranges = this.__ranges || this.__getRanges();

      var start = 0;
      var end = ranges.length-1;

      // binary search in the sorted ranges list
      while (true)
      {
        var pivot = start + ((end - start) >> 1);
        var range = ranges[pivot];

        if (range.endIndex < index) {
          start = pivot + 1;
        } else if (range.startIndex > index) {
          end = pivot - 1;
        } else {
          return range;
        }
      }
    },


    /**
     * Get the start position of the item with the given index.
     *
     * @param index {Integer} The item's index.
     * @return {Integer|null} The start position of the item. If the index is outside
     *    of the axis range <code>null</code> is returned.
     */
    getItemPosition : function(index)
    {
      if (index < 0 || index >= this.itemCount) {
        return null;
      }

      var range = this.__findRangeByIndex(index);

      if (range.startIndex == index) {
        return range.rangeStart;
      } else {
        return range.rangeStart + range.firstItemSize + (index-range.startIndex-1) * this.defaultItemSize;
      }
    },


    /**
     * Returns the sum of all cell sizes.
     *
     * @return {Integer} The sum of all item sizes.
     */
    getTotalSize : function()
    {
      var ranges = this.__ranges || this.__getRanges();
      return ranges[ranges.length-1].rangeEnd + 1;
    },


    /**
     * Get an array of item sizes starting with the item at "startIndex". The
     * sum of all sizes in the returned array is at least "minSizeSum".
     *
     * @param startIndex {Integer} The index of the first item.
     * @param minSizeSum {Integer} The minimum sum of the item sizes.
     * @return {Integer[]} List of item sizes starting with the size of the item
     *    at index <code>startIndex</code>. The sum of the item sizes is at least
     *    <code>minSizeSum</code>.
     */
    getItemSizes : function(startIndex, minSizeSum)
    {
      var customSizes = this.customSizes;
      var defaultSize = this.defaultItemSize;

      var sum = 0;
      var sizes = [];
      var i=0;
      while (sum < minSizeSum)
      {
        var itemSize = customSizes[startIndex++] || defaultSize;
        sum += itemSize;
        sizes[i++] = itemSize;
        if (startIndex >= this.itemCount) {
          break;
        }
      }
      return sizes;
    }
  },


  destruct : function() {
    this.customSizes = this.__ranges = null;
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * A layer is responsible to render one aspect of a virtual pane. The pane tells
 * each layer to render/update a specific window of the virtual grid.
 */
qx.Interface.define("qx.ui.virtual.core.ILayer",
{
  members :
  {
    /**
     * Do a complete update of the layer. All cached data should be discarded.
     * This method is called e.g. after changes to the grid geometry
     * (row/column sizes, row/column count, ...).
     *
     * Note: This method can only be called after the widgets initial appear
     * event has been fired because it may work with the widget's DOM elements.
     *
     * @param firstRow {Integer} Index of the first row to display.
     * @param firstColumn {Integer} Index of the first column to display.
     * @param rowSizes {Integer[]} Array of heights for each row to display.
     * @param columnSizes {Integer[]} Array of widths for each column to display.
     */
    fullUpdate : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    ) {
      this.assertArgumentsCount(arguments, 6, 6);
      this.assertPositiveInteger(firstRow);
      this.assertPositiveInteger(firstColumn);
      this.assertArray(rowSizes);
      this.assertArray(columnSizes);
    },


    /**
     * Update the layer to display a different window of the virtual grid.
     * This method is called if the pane is scrolled, resized or cells
     * are prefetched. The implementation can assume that no other grid
     * data has been changed since the last "fullUpdate" of "updateLayerWindow"
     * call.
     *
     * Note: This method can only be called after the widgets initial appear
     * event has been fired because it may work with the widget's DOM elements.
     *
     * @param firstRow {Integer} Index of the first row to display.
     * @param firstColumn {Integer} Index of the first column to display.
     * @param rowSizes {Integer[]} Array of heights for each row to display.
     * @param columnSizes {Integer[]} Array of widths for each column to display.
     */
    updateLayerWindow : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    ) {
      this.assertArgumentsCount(arguments, 6, 6);
      this.assertPositiveInteger(firstRow);
      this.assertPositiveInteger(firstColumn);
      this.assertArray(rowSizes);
      this.assertArray(columnSizes);
    },


    /**
     * Update the layer to reflect changes in the data the layer displays.
     */
    updateLayerData : function() {}
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
     * David Perez Carmona (david-perez)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * A cell event instance contains all data for mouse events related to cells in
 * a pane.
 **/
qx.Class.define("qx.ui.virtual.core.CellEvent",
{
  extend : qx.event.type.Mouse,


  properties :
  {
    /** The table row of the event target. */
    row :
    {
      check : "Integer",
      nullable: true
    },

    /** The table column of the event target. */
    column :
    {
      check : "Integer",
      nullable: true
    }
  },


  members :
  {
     /**
      * Initialize the event.
      *
      * @param scroller {qx.ui.table.pane.Scroller} The tables pane scroller.
      * @param me {qx.event.type.Mouse} The original mouse event.
      * @param row {Integer?null} The cell's row index.
      * @param column {Integer?null} The cell's column index.
      */
     init : function(scroller, me, row, column)
     {
       me.clone(this);
       this.setBubbles(false);

       this.setRow(row);
       this.setColumn(column);
     }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Implements the different selection modes single, multi, additive and one
 * selection with there drag and quick selection.
 *
 * Example how to use selection:
 * <pre class="javascript">
 * var rawData = [];
 * for (var i = 0; i < 2500; i++) {
 *  rawData[i] = "Item No " + i;
 * }
 *
 * var model = qx.data.marshal.Json.createModel(rawData);
 * var list = new qx.ui.list.List(model);
 *
 * // Pre-Select "Item No 20"
 * list.getSelection().push(model.getItem(20));
 *
 * // log change selection
 * list.getSelection().addListener("change", function(e) {
 *   this.debug("Selection: " + list.getSelection().getItem(0));
 * }, this);
 * </pre>
 *
 * @internal
 */
qx.Mixin.define("qx.ui.virtual.selection.MModel",
{
  construct : function()
  {
    this._initSelectionManager();
    this.__defaultSelection = new qx.data.Array();
    this.initSelection(this.__defaultSelection);
  },


  properties :
  {
    /** Current selected items */
    selection :
    {
      check : "qx.data.Array",
      event : "changeSelection",
      apply : "_applySelection",
      nullable : false,
      deferredInit : true
    },


    /**
     * The selection mode to use.
     *
     * For further details please have a look at:
     * {@link qx.ui.core.selection.Abstract#mode}
     */
    selectionMode :
    {
      check : ["single", "multi", "additive", "one"],
      init : "single",
      apply : "_applySelectionMode"
    },


    /**
     * Enable drag selection (multi selection of items through
     * dragging the mouse in pressed states).
     *
     * Only possible for the selection modes <code>multi</code> and <code>additive</code>
     */
    dragSelection :
    {
      check : "Boolean",
      init : false,
      apply : "_applyDragSelection"
    },


    /**
     * Enable quick selection mode, where no click is needed to change the selection.
     *
     * Only possible for the modes <code>single</code> and <code>one</code>.
     */
    quickSelection :
    {
      check : "Boolean",
      init : false,
      apply : "_applyQuickSelection"
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


  members :
  {
    /** @type {qx.ui.virtual.selection.Row} selection manager */
    _manager : null,


    /** @type {Boolean} flag to ignore the selection change from {@link #selection} */
    __ignoreChangeSelection : false,


    /** @type {Boolean} flag to ignore the selection change from <code>_manager</code> */
    __ignoreManagerChangeSelection : false,

    __defaultSelection : null,


    /**
     * Initialize the selection manager with his delegate.
     */
    _initSelectionManager : function()
    {
      var self = this;
      var selectionDelegate =
      {
        isItemSelectable : function(row) {
          return self._provider.isSelectable(row);
        },

        styleSelectable : function(row, type, wasAdded)
        {
          if (type != "selected") {
            return;
          }

          if (wasAdded) {
            self._provider.styleSelectabled(row);
          } else {
            self._provider.styleUnselectabled(row);
          }
        }
      }

      this._manager = new qx.ui.virtual.selection.Row(
        this.getPane(), selectionDelegate
      );
      this._manager.attachMouseEvents(this.getPane());
      this._manager.attachKeyEvents(this);
      this._manager.addListener("changeSelection", this._onManagerChangeSelection, this);
    },


    /**
     * Method to update the selection, this method can be used when the model has
     * changes.
     */
    _updateSelection : function()
    {
      if (this._manager == null) {
        return;
      }

      this._onChangeSelection();
    },


    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */


    // apply method
    _applySelection : function(value, old)
    {
      value.addListener("change", this._onChangeSelection, this);

      if (old != null) {
        old.removeListener("change", this._onChangeSelection, this);
      }

      this._onChangeSelection();
    },


    // apply method
    _applySelectionMode : function(value, old) {
      this._manager.setMode(value);
    },


    // apply method
    _applyDragSelection : function(value, old) {
      this._manager.setDrag(value);
    },


    // apply method
    _applyQuickSelection : function(value, old) {
      this._manager.setQuick(value);
    },


    /*
    ---------------------------------------------------------------------------
      SELECTION HANDLERS
    ---------------------------------------------------------------------------
    */


    /**
     * Event handler for the internal selection change {@link #selection}.
     *
     * @param e {qx.event.type.Data} the change event.
     */
    _onChangeSelection : function(e)
    {
      if (this.__ignoreManagerChangeSelection == true) {
        return;
      }

      this.__ignoreChangeSelection = true;
      var selection = this.getSelection();

      var newSelection = [];
      for (var i = 0; i < selection.getLength(); i++)
      {
        var item = selection.getItem(i);
        var selectables = this._getSelectables();
        var index = -1;

        if (selectables != null) {
          index = selectables.indexOf(item);
        }

        var row = this._reverseLookup(index);

        if (row >= 0) {
          newSelection.push(row);
        }
      }

      if (this._beforeApplySelection != null &&
          qx.lang.Type.isFunction(this._beforeApplySelection)) {
        this._beforeApplySelection(newSelection);
      }

      try {
        if (!qx.lang.Array.equals(newSelection, this._manager.getSelection())) {
          this._manager.replaceSelection(newSelection);
        }
      }
      catch(ex)
      {
        this._manager.selectItem(newSelection[newSelection.length - 1]);
      }
      this.__synchronizeSelection();

      if (this._afterApplySelection != null &&
          qx.lang.Type.isFunction(this._afterApplySelection)) {
        this._afterApplySelection();
      }

      this.__ignoreChangeSelection = false;
    },


    /**
     * Event handler for the selection change from the <code>_manager</code>.
     *
     * @param e {qx.event.type.Data} the change event.
     */
    _onManagerChangeSelection : function(e)
    {
      if (this.__ignoreChangeSelection == true) {
        return;
      }

      this.__ignoreManagerChangeSelection = true;

      this.__synchronizeSelection();

      this.__ignoreManagerChangeSelection = false;
    },


    /**
     * Synchronized the selection form the manager with the local one.
     */
    __synchronizeSelection : function()
    {
      if (this.__isSelectionEquals()) {
        return
      }

      var managerSelection = this._manager.getSelection();
      var newSelection = [];

      for (var i = 0; i < managerSelection.length; i++)
      {
        var item = this._getDataFromRow(managerSelection[i]);

        if (item != null) {
          newSelection.push(item);
        }
      }

      this.__replaceSelection(newSelection);
    },


    /**
     * Replace the current selection with the passed selection Array.
     *
     * @param newSelection {qx.data.Array} The new selection.
     */
    __replaceSelection : function(newSelection)
    {
      var selection = this.getSelection();
      if (newSelection.length > 0)
      {
        var args = [0, selection.getLength()];
        args = args.concat(newSelection);
        // dispose data array returned by splice to avoid memory leak
        var temp = selection.splice.apply(selection, args);
        temp.dispose();
      } else {
        selection.removeAll();
      }
    },


    /**
     * Checks whether the local and the manager selection are equal.
     *
     * @return {Boolean} <code>true</code> if the selections are equal,
     *   <code>false</code> otherwise.
     */
    __isSelectionEquals : function()
    {
      var selection = this.getSelection();
      var managerSelection = this._manager.getSelection();

      if (selection.getLength() !== managerSelection.length) {
        return false;
      }

      for (var i = 0; i < selection.getLength(); i++)
      {
        var item = selection.getItem(i);
        var selectables = this._getSelectables()
        var index = -1;

        if (selectables != null) {
          index = selectables.indexOf(item);
        }
        var row = this._reverseLookup(index);

        if (row !== managerSelection[i]) {
          return false;
        };
      }
      return true;
    },


    /**
     * Helper Method to select default item.
     */
    _applyDefaultSelection : function() {
      if (this._manager != null) {
        this._manager._applyDefaultSelection();
      }
    }
  },


  destruct : function()
  {
    this._manager.dispose();
    this._manager = null;
    if (this.__defaultSelection) {
      this.__defaultSelection.dispose();
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
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * Abstract base class for selection manager, which manage selectable items
 * rendered in a virtual {@link qx.ui.virtual.core.Pane}.
 */
qx.Class.define("qx.ui.virtual.selection.Abstract",
{
  extend : qx.ui.core.selection.Abstract,


  /*
   *****************************************************************************
      CONSTRUCTOR
   *****************************************************************************
   */

  /**
   * @param pane {qx.ui.virtual.core.Pane} The virtual pane on which the
   *    selectable item are rendered
   * @param selectionDelegate {ISelectionDelegate?null} An optional delegate,
   *    which can be used to customize the behavior of the selection manager
   *    without sub classing it.
   */
  construct : function(pane, selectionDelegate)
  {
    this.base(arguments);

    if (qx.core.Environment.get("qx.debug")) {
      this.assertInstance(pane, qx.ui.virtual.core.Pane);
    }

    this._pane = pane;
    this._delegate = selectionDelegate || {};
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
      DELEGATE METHODS
    ---------------------------------------------------------------------------
    */

    // overridden
    _isSelectable : function(item) {
      return this._delegate.isItemSelectable ?
        this._delegate.isItemSelectable(item) :
        true;
    },


    // overridden
    _styleSelectable : function(item, type, enabled)
    {
      if (this._delegate.styleSelectable) {
        this._delegate.styleSelectable(item, type, enabled);
      }
    },


    /*
    ---------------------------------------------------------------------------
      EVENTS
    ---------------------------------------------------------------------------
    */

    /**
     * Attach mouse events to the managed pane.
     */
    attachMouseEvents : function()
    {
      var paneElement = this._pane.getContentElement();
      paneElement.addListener("mousedown", this.handleMouseDown, this);
      paneElement.addListener("mouseup", this.handleMouseUp, this);
      paneElement.addListener("mouseover", this.handleMouseOver, this);
      paneElement.addListener("mousemove", this.handleMouseMove, this);
      paneElement.addListener("losecapture", this.handleLoseCapture, this);
    },


    /**
     * Detach mouse events from the managed pane.
     */
    detatchMouseEvents : function()
    {
      var paneElement = this._pane.getContentElement();
      paneElement.removeListener("mousedown", this.handleMouseDown, this);
      paneElement.removeListener("mouseup", this.handleMouseUp, this);
      paneElement.removeListener("mouseover", this.handleMouseOver, this);
      paneElement.removeListener("mousemove", this.handleMouseMove, this);
      paneElement.removeListener("losecapture", this.handleLoseCapture, this);
    },


    /**
     * Attach key events to manipulate the selection using the keyboard. The
     * event target doesn't need to be the pane itself. It can be an widget,
     * which received key events. Usually the key event target is the
     * {@link qx.ui.virtual.core.Scroller}.
     *
     * @param target {qx.core.Object} the key event target.
     *
     */
    attachKeyEvents : function(target) {
      target.addListener("keypress", this.handleKeyPress, this);
    },


    /**
     * Detach key events.
     *
     * @param target {qx.core.Object} the key event target.
     */
    detachKeyEvents : function(target) {
      target.removeListener("keypress", this.handleKeyPress, this);
    },


    /**
     * Attach list events. The selection mode <code>one</code> need to know,
     * when selectable items are added or removed. If this mode is used the
     * <code>list</code> parameter must fire <code>addItem</code> and
     * <code>removeItem</code> events.
     *
     * @param list {qx.core.Object} the event target for <code>addItem</code> and
     *    <code>removeItem</code> events
     */
    attachListEvents : function(list)
    {
      list.addListener("addItem", this.handleAddItem, this);
      list.addListener("removeItem", this.handleRemoveItem, this);
    },


    /**
     * Detach list events.
     *
     * @param list {qx.core.Object} the event target for <code>addItem</code> and
     *    <code>removeItem</code> events
     */
    detachListEvents : function(list)
    {
      list.removeListener("addItem", this.handleAddItem, this);
      list.removeListener("removeItem", this.handleRemoveItem, this);
    },


    /*
    ---------------------------------------------------------------------------
      IMPLEMENT ABSTRACT METHODS
    ---------------------------------------------------------------------------
    */

    // overridden
    _capture : function() {
      this._pane.capture();
    },


    // overridden
    _releaseCapture : function() {
      this._pane.releaseCapture();
    },


    // overridden
    _getScroll : function()
    {
      return {
        left : this._pane.getScrollX(),
        top: this._pane.getScrollY()
      };
    },


    // overridden
    _scrollBy : function(xoff, yoff)
    {
      this._pane.setScrollX(this._pane.getScrollX() + xoff);
      this._pane.setScrollY(this._pane.getScrollY() + yoff);
    },


    // overridden
    _getLocation : function()
    {
      var elem = this._pane.getContentElement().getDomElement();
      return elem ? qx.bom.element.Location.get(elem) : null;
    },


    // overridden
    _getDimension : function() {
      return this._pane.getInnerSize();
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this._pane = this._delegate = null;
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
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * Row selection manager
 */
qx.Class.define("qx.ui.virtual.selection.Row",
{
  extend : qx.ui.virtual.selection.Abstract,


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Returns the number of all items in the pane. This number may contain
     * unselectable items as well.
     *
     * @return {Integer} number of items
     */
    _getItemCount : function() {
      return this._pane.getRowConfig().getItemCount();
    },


    /*
    ---------------------------------------------------------------------------
      IMPLEMENT ABSTRACT METHODS
    ---------------------------------------------------------------------------
    */

    // overridden
    _getSelectableFromMouseEvent : function(event)
    {
      var cell = this._pane.getCellAtPosition(
        event.getDocumentLeft(),
        event.getDocumentTop()
      );

      if (!cell) {
        return null;
      }

      return this._isSelectable(cell.row) ? cell.row : null;
    },


    // overridden
    getSelectables : function(all)
    {
      var selectables = [];

      for (var i=0, l=this._getItemCount(); i<l; i++)
      {
        if (this._isSelectable(i)) {
          selectables.push(i);
        }
      }

      return selectables;
    },


    // overridden
    _getSelectableRange : function(item1, item2)
    {
      var selectables = [];
      var min = Math.min(item1, item2);
      var max = Math.max(item1, item2);

      for (var i=min; i<=max; i++)
      {
        if (this._isSelectable(i)) {
          selectables.push(i);
        }
      }

      return selectables;
    },


    // overridden
    _getFirstSelectable : function()
    {
      var count = this._getItemCount();
      for (var i=0; i<count; i++)
      {
        if (this._isSelectable(i)) {
          return i;
        }
      }
      return null;
    },


    // overridden
    _getLastSelectable : function()
    {
      var count = this._getItemCount();
      for (var i=count-1; i>=0; i--)
      {
        if (this._isSelectable(i)) {
          return i;
        }
      }
      return null;
    },


    // overridden
    _getRelatedSelectable : function(item, relation)
    {
      if (relation == "above")
      {
        var startIndex = item-1;
        var endIndex = 0;
        var increment = -1;
      }
      else if (relation == "under")
      {
        var startIndex = item+1;
        var endIndex = this._getItemCount()-1;
        var increment = 1;
      }
      else
      {
        return null;
      }

      for (var i=startIndex; i !== endIndex+increment; i += increment)
      {
        if (this._isSelectable(i)) {
          return i;
        }
      }
      return null;
    },


    // overridden
    _getPage : function(lead, up)
    {
      if (up) {
        return this._getFirstSelectable();
      } else {
        return this._getLastSelectable();
      }
    },


    // overridden
    _selectableToHashCode : function(item) {
      return item;
    },


    // overridden
    _scrollItemIntoView : function(item) {
      this._pane.scrollRowIntoView(item);
    },


    // overridden
    _getSelectableLocationX : function(item)
    {
      return {
        left: 0,
        right: this._pane.getColumnConfig().getTotalSize() - 1
      };
    },


    // overridden
    _getSelectableLocationY : function(item)
    {
      var rowConfig = this._pane.getRowConfig();

      var itemTop = rowConfig.getItemPosition(item);
      var itemBottom = itemTop + rowConfig.getItemSize(item) - 1;

      return {
        top: itemTop,
        bottom: itemBottom
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * The <code>qx.ui.list.List</code> is based on the virtual infrastructure and
 * supports filtering, sorting, grouping, single selection, multi selection,
 * data binding and custom rendering.
 *
 * Using the virtual infrastructure has considerable advantages when there is a
 * huge amount of model items to render because the virtual infrastructure only
 * creates widgets for visible items and reuses them. This saves both creation
 * time and memory.
 *
 * With the {@link qx.ui.list.core.IListDelegate} interface it is possible
 * to configure the list's behavior (item and group renderer configuration,
 * filtering, sorting, grouping, etc.).
 *
 * Here's an example of how to use the widget:
 * <pre class="javascript">
 * //create the model data
 * var rawData = [];
 * for (var i = 0; i < 2500; i++) {
 *  rawData[i] = "Item No " + i;
 * }
 * var model = qx.data.marshal.Json.createModel(rawData);
 *
 * //create the list
 * var list = new qx.ui.list.List(model);
 *
 * //configure the lists's behavior
 * var delegate = {
 *   sorter : function(a, b) {
 *     return a > b ? 1 : a < b ? -1 : 0;
 *   }
 * };
 * list.setDelegate(delegate);
 *
 * //Pre-Select "Item No 20"
 * list.getSelection().push(model.getItem(20));
 *
 * //log selection changes
 * list.getSelection().addListener("change", function(e) {
 *   this.debug("Selection: " + list.getSelection().getItem(0));
 * }, this);
 * </pre>
 *
 * @childControl row-layer {qx.ui.virtual.layer.Row} layer for all rows
 */
qx.Class.define("qx.ui.list.List",
{
  extend : qx.ui.virtual.core.Scroller,
  include : [qx.ui.virtual.selection.MModel],
  implement : qx.data.controller.ISelection,

  /**
   * Creates the <code>qx.ui.list.List</code> with the passed model.
   *
   * @param model {qx.data.IListData|null} model for the list.
   */
  construct : function(model)
  {
    this.base(arguments, 0, 1, 20, 100);

    this._init();

    this.__defaultGroups = new qx.data.Array();
    this.initGroups(this.__defaultGroups);

    if(model != null) {
      this.initModel(model);
    }

    this.initItemHeight();
  },


  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "virtual-list"
    },


    // overridden
    focusable :
    {
      refine : true,
      init : true
    },


    // overridden
    width :
    {
      refine : true,
      init : 100
    },


    // overridden
    height :
    {
      refine : true,
      init : 200
    },


    /** Data array containing the data which should be shown in the list. */
    model :
    {
      check : "qx.data.IListData",
      apply : "_applyModel",
      event: "changeModel",
      nullable : true,
      deferredInit : true
    },


    /** Default item height */
    itemHeight :
    {
      check : "Integer",
      init : 25,
      apply : "_applyRowHeight",
      themeable : true
    },


    /**
     * The path to the property which holds the information that should be
     * displayed as a label. This is only needed if objects are stored in the
     * model.
     */
    labelPath :
    {
      check: "String",
      apply: "_applyLabelPath",
      nullable: true
    },


    /**
     * The path to the property which holds the information that should be
     * displayed as an icon. This is only needed if objects are stored in the
     * model and icons should be displayed.
     */
    iconPath :
    {
      check: "String",
      apply: "_applyIconPath",
      nullable: true
    },


    /**
     * The path to the property which holds the information that should be
     * displayed as a group label. This is only needed if objects are stored in the
     * model.
     */
    groupLabelPath :
    {
      check: "String",
      apply: "_applyGroupLabelPath",
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
     * A map containing the options for the group label binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    groupLabelOptions :
    {
      apply: "_applyGroupLabelOptions",
      nullable: true
    },


    /**
     * Delegation object which can have one or more functions defined by the
     * {@link qx.ui.list.core.IListDelegate} interface.
     */
    delegate :
    {
      apply: "_applyDelegate",
      event: "changeDelegate",
      init: null,
      nullable: true
    },


    /**
     * Indicates that the list is managing the {@link #groups} automatically.
     */
    autoGrouping :
    {
      check: "Boolean",
      init: true
    },


    /**
     * Contains all groups for data binding, but do only manipulate the array
     * when the {@link #autoGrouping} is set to <code>false</code>.
     */
    groups :
    {
      check: "qx.data.Array",
      event: "changeGroups",
      nullable: false,
      deferredInit: true
    }
  },


  members :
  {
    /** @type {qx.ui.virtual.layer.Row} background renderer */
    _background : null,


    /** @type {qx.ui.list.provider.IListProvider} provider for cell rendering */
    _provider : null,


    /** @type {qx.ui.virtual.layer.Abstract} layer which contains the items. */
    _layer : null,


    /**
     * @type {Array} lookup table to get the model index from a row. To get the
     *   correct value after applying filter, sorter, group.
     *
     * Note the value <code>-1</code> indicates that the value is a group item.
     */
    __lookupTable : null,


    /** @type {Array} lookup table for getting the group index from the row */
    __lookupTableForGroup : null,


    /**
     * @type {Map} contains all groups with the items as children. The key is
     *   the group name and the value is an <code>Array</code> containing each
     *   item's model index.
     */
    __groupHashMap : null,


    /**
     * @type {Boolean} indicates when one or more <code>String</code> are used for grouping.
     */
    __groupStringsUsed : false,


    /**
     * @type {Boolean} indicates when one or more <code>Object</code> are used for grouping.
     */
    __groupObjectsUsed : false,


    /**
     * @type {Boolean} indicates when a default group is used for grouping.
     */
    __defaultGroupUsed : false,

    __defaultGroups : null,


    /**
     * Trigger a rebuild from the internal data structure.
     */
    refresh : function() {
      this.__buildUpLookupTable();
    },


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "row-layer" :
          control = new qx.ui.virtual.layer.Row(null, null);
          break;
      }
      return control || this.base(arguments, id);
    },


    /**
     * Initializes the virtual list.
     */
    _init : function()
    {
      this._provider = new qx.ui.list.provider.WidgetProvider(this);

      this.__lookupTable = [];
      this.__lookupTableForGroup = [];
      this.__groupHashMap = {};
      this.__groupStringsUsed = false;
      this.__groupObjectsUsed = false;
      this.__defaultGroupUsed = false;

      this.getPane().addListener("resize", this._onResize, this);

      this._initBackground();
      this._initLayer();
    },


    /**
     * Initializes the background renderer.
     */
    _initBackground : function()
    {
      this._background = this.getChildControl("row-layer");
      this.getPane().addLayer(this._background);
    },


    /**
     * Initializes the layer for rendering.
     */
    _initLayer : function()
    {
      this._layer = this._provider.createLayer();
      this.getPane().addLayer(this._layer);
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the model data for the given row.
     *
     * @param row {Integer} row to get data for.
     * @return {var|null} the row's model data.
     */
    _getDataFromRow : function(row) {
      var data = null;

      var model = this.getModel();
      if (model == null) {
        return null;
      }

      if (this._isGroup(row)) {
        data = this.getGroups().getItem(this._lookupGroup(row));
      } else {
        data = model.getItem(this._lookup(row));
      }

      if (data != null) {
        return data;
      } else {
        return null;
      }
    },


    /**
     * Return the internal lookup table. But do not manipulate the
     * lookup table!
     *
     * @return {Array} The internal lookup table.
     */
    _getLookupTable : function() {
      return this.__lookupTable;
    },


    /**
     * Performs a lookup from row to model index.
     *
     * @param row {Number} The row to look at.
     * @return {Number} The model index or
     *   <code>-1</code> if the row is a group item.
     */
    _lookup : function(row) {
      return this.__lookupTable[row];
    },


    /**
     * Performs a lookup from row to group index.
     *
     * @param row {Number} The row to look at.
     * @return {Number} The group index or
     *   <code>-1</code> if the row is a not a group item.
     */
    _lookupGroup : function(row) {
      return this.__lookupTableForGroup.indexOf(row);
    },


    /**
     * Performs a lookup from model index to row.
     *
     * @param index {Number} The index to look at.
     * @return {Number} The row or <code>-1</code>
     *  if the index is not a model index.
     */
    _reverseLookup : function(index) {
      if (index < 0) {
        return -1;
      }
      return this.__lookupTable.indexOf(index);
    },


    /**
     * Checks if the passed row is a group or an item.
     *
     * @param row {Integer} row to check.
     * @return {Boolean} <code>true</code> if the row is a group element,
     *  <code>false</code> if the row is an item element.
     */
    _isGroup : function(row) {
      return this._lookup(row) == -1;
    },


    /**
     * Returns the selectable model items.
     *
     * @return {qx.data.Array | null} The selectable items.
     */
    _getSelectables : function() {
      return this.getModel();
    },


    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */


    // apply method
    _applyModel : function(value, old)
    {
      if (value != null) {
        value.addListener("changeLength", this._onModelChange, this);
      }

      if (old != null) {
        old.removeListener("changeLength", this._onModelChange, this);
      }

      this._provider.removeBindings();
      this._onModelChange();
    },


    // apply method
    _applyRowHeight : function(value, old) {
      this.getPane().getRowConfig().setDefaultItemSize(value);
    },


    // apply method
    _applyLabelPath : function(value, old) {
      this._provider.setLabelPath(value);
    },


    // apply method
    _applyIconPath : function(value, old) {
      this._provider.setIconPath(value);
    },


    // apply method
    _applyGroupLabelPath : function(value, old) {
      this._provider.setGroupLabelPath(value);
    },


    // apply method
    _applyLabelOptions : function(value, old) {
      this._provider.setLabelOptions(value);
    },


    // apply method
    _applyIconOptions : function(value, old) {
      this._provider.setIconOptions(value);
    },


    // apply method
    _applyGroupLabelOptions : function(value, old) {
      this._provider.setGroupLabelOptions(value);
    },


    // apply method
    _applyDelegate : function(value, old) {
      this._provider.setDelegate(value);
      this.__buildUpLookupTable();
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLERS
    ---------------------------------------------------------------------------
    */


    /**
     * Event handler for the resize event.
     *
     * @param e {qx.event.type.Data} resize event.
     */
    _onResize : function(e) {
      this.getPane().getColumnConfig().setItemSize(0, e.getData().width);
    },


    /**
     * Event handler for the model change event.
     *
     * @param e {qx.event.type.Data} model change event.
     */
    _onModelChange : function(e) {
      this.__buildUpLookupTable();
      this._applyDefaultSelection();
    },


    /*
    ---------------------------------------------------------------------------
      HELPER ROUTINES
    ---------------------------------------------------------------------------
    */


    /**
     * Helper method to update the row count.
     */
    __updateRowCount : function()
    {
      this.getPane().getRowConfig().setItemCount(this.__lookupTable.length);
      this.getPane().fullUpdate();
    },


    /**
     * Internal method for building the lookup table.
     */
    __buildUpLookupTable : function()
    {
      this.__lookupTable = [];
      this.__lookupTableForGroup = [];
      this.__groupHashMap = {};

      if (this.isAutoGrouping()) {
        this.getGroups().removeAll();
      }

      var model = this.getModel();

      if (model != null) {
        this._runDelegateFilter(model);
        this._runDelegateSorter(model);
        this._runDelegateGroup(model);
      }

      this._updateSelection();
      this.__updateRowCount();
    },


    /**
     * Invokes filtering using the filter given in the delegate.
     *
     * @param model {qx.data.IListData} The model.
     */
    _runDelegateFilter : function (model)
    {
      var filter = qx.util.Delegate.getMethod(this.getDelegate(), "filter");

      for (var i = 0,l = model.length; i < l; ++i)
      {
        if (filter == null || filter(model.getItem(i))) {
          this.__lookupTable.push(i);
        }
      }
    },


    /**
     * Invokes sorting using the sorter given in the delegate.
     *
     * @param model {qx.data.IListData} The model.
     */
    _runDelegateSorter : function (model)
    {
      if (this.__lookupTable.length == 0) {
        return;
      }

      var sorter = qx.util.Delegate.getMethod(this.getDelegate(), "sorter");

      if (sorter != null)
      {
        this.__lookupTable.sort(function(a, b)
        {
          return sorter(model.getItem(a), model.getItem(b));
        });
      }
    },


    /**
     * Invokes grouping using the group result given in the delegate.
     *
     * @param model {qx.data.IListData} The model.
     */
    _runDelegateGroup : function (model)
    {
      var groupMethod = qx.util.Delegate.getMethod(this.getDelegate(), "group");

      if (groupMethod != null)
      {
        for (var i = 0,l = this.__lookupTable.length; i < l; ++i)
        {
          var index = this.__lookupTable[i];
          var item = this.getModel().getItem(index);
          var group = groupMethod(item);

          this.__addGroup(group, index);
        }
        this.__lookupTable = this.__createLookupFromGroup();
      }
    },


    /**
     * Adds a model index the the group.
     *
     * @param group {String|Object|null} the group.
     * @param index {Integer} model index to add.
     */
    __addGroup : function(group, index)
    {
      // if group is null add to default group
      if (group == null)
      {
        this.__defaultGroupUsed = true;
        group = "???";
      }

      var name = this.__getUniqueGroupName(group);
      if (this.__groupHashMap[name] == null)
      {
        this.__groupHashMap[name] = [];
        if (this.isAutoGrouping()) {
          this.getGroups().push(group);
        }
      }
      this.__groupHashMap[name].push(index);
    },


    /**
     * Creates a lookup table form the internal group hash map.
     *
     * @return {Array} the lookup table based on the internal group hash map.
     */
    __createLookupFromGroup : function()
    {
      this.__checkGroupStructure();

      var result = [];
      var row = 0;
      var groups = this.getGroups();
      for (var i = 0; i < groups.getLength(); i++)
      {
        var group = groups.getItem(i);

        // indicate that the value is a group
        result.push(-1);
        this.__lookupTableForGroup.push(row);
        row++;

        var key = this.__getUniqueGroupName(group);
        var groupMembers = this.__groupHashMap[key];
        if (groupMembers != null)
        {
          for (var k = 0; k < groupMembers.length; k++) {
            result.push(groupMembers[k]);
            row++;
          }
        }
      }
      return result;
    },


    /**
     * Returns an unique group name for the passed group.
     *
     * @param group {String|Object} Group to find unique group name.
     * @return {String} Unique group name.
     */
    __getUniqueGroupName : function(group)
    {
      var name = null;
      if (!qx.lang.Type.isString(group))
      {
        var index = this.getGroups().indexOf(group);
        this.__groupObjectsUsed = true;

        name = "group";
        if (index == -1) {
           name += this.getGroups().getLength();
        } else {
          name += index;
        }
      }
      else
      {
        this.__groupStringsUsed = true;
        var name = group;
      }
      return name;
    },


    /**
     * Checks that <code>Object</code> and <code>String</code> are not mixed
     * as group identifier, otherwise an exception occurs.
     */
    __checkGroupStructure : function() {
      if (this.__groupObjectsUsed && this.__defaultGroupUsed ||
          this.__groupObjectsUsed && this.__groupStringsUsed)
      {
        throw new Error("GroupingTypeError: You can't mix 'Objects' and 'Strings' as" +
          " group identifier!");
      }
    }
  },


  destruct : function()
  {
    var model = this.getModel();
    if (model != null) {
      model.removeListener("changeLength", this._onModelChange, this);
    }

    var pane = this.getPane()
    if (pane != null) {
      pane.removeListener("resize", this._onResize, this);
    }

    this._background.dispose();
    this._provider.dispose();
    this._layer.dispose();
    this._background = this._provider = this._layer =
      this.__lookupTable = this.__lookupTableForGroup =
      this.__groupHashMap = null;

    if (this.__defaultGroups) {
      this.__defaultGroups.dispose();
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * Abstract base class for layers of a virtual pane.
 *
 * This class queues calls to {@link #fullUpdate}, {@link #updateLayerWindow}
 * and {@link #updateLayerData} and only performs the absolute necessary
 * actions. Concrete implementation of this class must at least implement
 * the {@link #_fullUpdate} method. Additionally the two methods
 * {@link #_updateLayerWindow} and {@link #_updateLayerData} may be implemented
 * to increase the performance.
 */
qx.Class.define("qx.ui.virtual.layer.Abstract",
{
  extend : qx.ui.core.Widget,
  type : "abstract",

  implement : [qx.ui.virtual.core.ILayer],

  /*
   *****************************************************************************
      CONSTRUCTOR
   *****************************************************************************
   */

   construct : function()
   {
     this.base(arguments);

     this.__jobs = {};
   },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    anonymous :
    {
      refine: true,
      init: true
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __jobs : null,
    __arguments : null,

    __firstRow : null,
    __firstColumn : null,
    __rowSizes : null,
    __columnSizes : null,


    /**
     * Get the first rendered row
     *
     * @return {Integer} The first rendered row
     */
    getFirstRow : function() {
      return this.__firstRow;
    },


    /**
     * Get the first rendered column
     *
     * @return {Integer} The first rendered column
     */
    getFirstColumn : function() {
      return this.__firstColumn;
    },


    /**
     * Get the sizes of the rendered rows
     *
     * @return {Integer[]} List of row heights
     */
    getRowSizes : function() {
      return this.__rowSizes || [];
    },


    /**
     * Get the sizes of the rendered column
     *
     * @return {Integer[]} List of column widths
     */
    getColumnSizes : function() {
      return this.__columnSizes || [];
    },


    // overridden
    syncWidget : function(jobs)
    {
      // return if the layer is not yet rendered
      // it will rendered in the appear event
      if (!this.getContentElement().getDomElement()) {
        return;
      }

      if (
        this.__jobs.fullUpdate ||
        this.__jobs.updateLayerWindow && this.__jobs.updateLayerData
      )
      {
        this._fullUpdate.apply(this, this.__arguments);
      }
      else if (this.__jobs.updateLayerWindow)
      {
        this._updateLayerWindow.apply(this, this.__arguments);
      }
      else if (this.__jobs.updateLayerData  && this.__rowSizes)
      {
        this._updateLayerData();
      }

      if (this.__jobs.fullUpdate || this.__jobs.updateLayerWindow)
      {
        var args = this.__arguments;
        this.__firstRow = args[0];
        this.__firstColumn = args[1];
        this.__rowSizes = args[2];
        this.__columnSizes = args[3];
      }

      this.__jobs = {};
    },


    /**
     * Update the layer to reflect changes in the data the layer displays.
     *
     * Note: It is guaranteed that this method is only called after the layer
     * has been rendered.
     */
    _updateLayerData : function()
    {
      this._fullUpdate(
        this.__firstRow, this.__firstColumn,
        this.__rowSizes, this.__columnSizes
      );
    },


    /**
     * Do a complete update of the layer. All cached data should be discarded.
     * This method is called e.g. after changes to the grid geometry
     * (row/column sizes, row/column count, ...).
     *
     * Note: It is guaranteed that this method is only called after the layer
     * has been rendered.
     *
     * @param firstRow {Integer} Index of the first row to display
     * @param firstColumn {Integer} Index of the first column to display
     * @param rowSizes {Integer[]} Array of heights for each row to display
     * @param columnSizes {Integer[]} Array of widths for each column to display
     */
    _fullUpdate : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    ) {
      throw new Error("Abstract method '_fullUpdate' called!");
    },


    /**
     * Update the layer to display a different window of the virtual grid.
     * This method is called if the pane is scrolled, resized or cells
     * are prefetched. The implementation can assume that no other grid
     * data has been changed since the last "fullUpdate" of "updateLayerWindow"
     * call.
     *
     * Note: It is guaranteed that this method is only called after the layer
     * has been rendered.
     *
     * @param firstRow {Integer} Index of the first row to display
     * @param firstColumn {Integer} Index of the first column to display
     * @param rowSizes {Integer[]} Array of heights for each row to display
     * @param columnSizes {Integer[]} Array of widths for each column to display
     */
    _updateLayerWindow : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    )
    {
      this._fullUpdate(
        firstRow, firstColumn,
        rowSizes, columnSizes
      );
    },


    // interface implementation
    updateLayerData : function()
    {
      this.__jobs.updateLayerData = true;
      qx.ui.core.queue.Widget.add(this);
    },


    // interface implementation
    fullUpdate : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    )
    {
      this.__arguments = arguments;
      this.__jobs.fullUpdate = true;
      qx.ui.core.queue.Widget.add(this);
    },


    // interface implementation
    updateLayerWindow : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    ) {
      this.__arguments = arguments;
      this.__jobs.updateLayerWindow = true;
      qx.ui.core.queue.Widget.add(this);
    }
  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__jobs = this.__arguments = this.__rowSizes = this.__columnSizes = null;
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * Abstract base class for the {@link Row} and {@link Column} layers.
 */
qx.Class.define("qx.ui.virtual.layer.AbstractBackground",
{
  extend : qx.ui.virtual.layer.Abstract,


  /*
   *****************************************************************************
      CONSTRUCTOR
   *****************************************************************************
   */

   /**
    * @param colorEven {Color?null} color for even indexes
    * @param colorOdd {Color?null} color for odd indexes
    */
   construct : function(colorEven, colorOdd)
   {
     this.base(arguments);

     if (colorEven) {
       this.setColorEven(colorEven);
     }

     if (colorOdd) {
       this.setColorOdd(colorOdd);
     }

     this.__customColors = {};
     this.__decorators = {};
   },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** color for event indexes */
    colorEven :
    {
      nullable : true,
      check : "Color",
      apply : "_applyColorEven",
      themeable : true
    },

    /** color for odd indexes */
    colorOdd :
    {
      nullable : true,
      check : "Color",
      apply : "_applyColorOdd",
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
    __colorEven : null,
    __colorOdd : null,
    __customColors : null,
    __decorators : null,


    /*
    ---------------------------------------------------------------------------
      COLOR HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the color for the given index
     *
     * @param index {Integer} Index to set the color for
     * @param color {Color|null} the color to set. A value of <code>null</code>
     *    will reset the color.
     */
    setColor : function(index, color)
    {
      if (color) {
        this.__customColors[index] = qx.theme.manager.Color.getInstance().resolve(color);
      } else {
        delete(this.__customColors[index]);
      }
    },


    /**
     * Clear all colors set using {@link #setColor}.
     */
    clearCustomColors : function()
    {
      this.__customColors = {};
      this.updateLayerData();
    },


    /**
     * Get the color at the given index
     *
     * @param index {Integer} The index to get the color for.
     * @return {Color} The color at the given index
     */
    getColor : function(index)
    {
      var customColor = this.__customColors[index];
      if (customColor) {
        return customColor;
      } else {
        return index % 2 == 0 ? this.__colorEven : this.__colorOdd;
      }
    },


    // property apply
    _applyColorEven : function(value, old)
    {
      if (value) {
        this.__colorEven = qx.theme.manager.Color.getInstance().resolve(value);
      } else {
        this.__colorEven = null;
      }
      this.updateLayerData();
    },


    // property apply
    _applyColorOdd : function(value, old)
    {
      if (value) {
        this.__colorOdd = qx.theme.manager.Color.getInstance().resolve(value);
      } else {
        this.__colorOdd = null;
      }
      this.updateLayerData();
    },


    /**
     * Sets the decorator for the given index
     *
     * @param index {Integer} Index to set the color for
     * @param decorator {Decorator|null} the decorator to set. A value of
     *    <code>null</code> will reset the decorator.
     */
    setBackground : function(index, decorator)
    {
      if (decorator) {
        this.__decorators[index] = qx.theme.manager.Decoration.getInstance().resolve(decorator);
      } else {
        delete(this.__decorators[index]);
      }
      this.updateLayerData();
    },


    /**
     * Get the decorator at the given index
     *
     * @param index {Integer} The index to get the decorator for.
     * @return {Decorator} The decorator at the given index
     */
    getBackground : function(index) {
      return this.__decorators[index];
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this.__customColors = this.__decorators = null;
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * The Row layer renders row background colors.
 */
qx.Class.define("qx.ui.virtual.layer.Row",
{
  extend : qx.ui.virtual.layer.AbstractBackground,


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
      init : "row-layer"
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
    _fullUpdate : function(firstRow, firstColumn, rowSizes, columnSizes)
    {
      var html = [];

      var width = qx.lang.Array.sum(columnSizes);

      var top = 0;
      var row = firstRow;
      var childIndex = 0;

      for (var y=0; y<rowSizes.length; y++)
      {
        var color = this.getColor(row);
        var backgroundColor = color ? "background-color:" + color + ";" : "";

        var decorator = this.getBackground(row);
        var styles = decorator ? qx.bom.element.Style.compile(decorator.getStyles()) : "";

        html.push(
          "<div style='",
          "position: absolute;",
          "left: 0;",
          "top:", top, "px;",
          "height:", rowSizes[y], "px;",
          "width:", width, "px;",
          backgroundColor,
          styles,
          "'>",
          "</div>"
        );
        childIndex++;

        top += rowSizes[y];
        row += 1;
      }

      var el = this.getContentElement().getDomElement();
      // hide element before changing the child nodes to avoid
      // premature reflow calculations
      el.style.display = "none";
      el.innerHTML = html.join("");

      el.style.display = "block";
      this._width = width;
    },


    // overridden
    _updateLayerWindow : function(firstRow, firstColumn, rowSizes, columnSizes)
    {
      if (
        firstRow !== this.getFirstRow() ||
        rowSizes.length !== this.getRowSizes().length ||
        this._width < qx.lang.Array.sum(columnSizes)
      ) {
        this._fullUpdate(firstRow, firstColumn, rowSizes, columnSizes);
      }
    },


    // overridden
    setColor : function(index, color)
    {
      this.base(arguments, index, color);

      if (this.__isRowRendered(index)) {
        this.updateLayerData();
      }
    },


    // overridden
    setBackground : function(index, decorator)
    {
      this.base(arguments, index, decorator);
      if (this.__isRowRendered(index)) {
        this.updateLayerData();
      }
    },


    /**
     * Whether the row with the given index is currently rendered (i.e. in the
     * layer's view port).
     *
     * @param index {Integer} The row's index
     * @return {Boolean} Whether the row is rendered
     */
    __isRowRendered : function(index)
    {
      var firstRow = this.getFirstRow();
      var lastRow = firstRow + this.getRowSizes().length - 1;
      return index >= firstRow && index <= lastRow;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * This interface needs to implemented from all {@link qx.ui.list.List} providers.
 *
 * @internal
 */
qx.Interface.define("qx.ui.list.provider.IListProvider",
{
  members :
  {
    /**
     * Creates a layer for item and group rendering.
     *
     * @return {qx.ui.virtual.layer.Abstract} new layer.
     */
    createLayer : function() {},


    /**
     * Creates a renderer for item rendering.
     *
     * @return {var} new item renderer.
     */
    createItemRenderer : function() {},


    /**
     * Creates a renderer for group rendering.
     *
     * @return {var} new group renderer.
     */
    createGroupRenderer : function() {},


    /**
     * Styles a selected item.
     *
     * @param row {Integer} row to style.
     */
    styleSelectabled : function(row) {},


    /**
     * Styles a not selected item.
     *
     * @param row {Integer} row to style.
     */
    styleUnselectabled : function(row) {},


    /**
     * Returns if the passed row can be selected or not.
     *
     * @param row {Integer} row to select.
     * @return {Boolean} <code>true</code> when the row can be selected,
     *    <code>false</code> otherwise.
     */
    isSelectable : function(row) {},


    /**
     * The path to the property which holds the information that should be
     * shown as a label. This is only needed if objects are stored in the model.
     *
     * @param path {String} path to the property.
     */
    setLabelPath : function(path) {},


    /**
     * The path to the property which holds the information that should be
     * shown as an icon. This is only needed if objects are stored in the model
     * and if the icon should be shown.
     *
     * @param path {String} path to the property.
     */
    setIconPath : function(path) {},


    /**
     * A map containing the options for the label binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     *
     * @param options {Map} options for the label binding.
     */
    setLabelOptions : function(options) {},


    /**
     * A map containing the options for the icon binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     *
     * @param options {Map} options for the icon binding.
     */
    setIconOptions : function(options) {},


    /**
     * Delegation object, which can have one or more functions defined by the
     * {@link qx.ui.list.core.IListDelegate} interface.
     *
     * @param delegate {Object} delegation object.
     */
    setDelegate : function(delegate) {},


    /**
     * Remove all bindings from all bounded items.
     */
    removeBindings : function() {}
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * A widget cell provider provides the {@link qx.ui.virtual.layer.WidgetCell}
 * with configured widgets to render the cells and pools/releases unused
 * cell widgets.
 */
qx.Interface.define("qx.ui.virtual.core.IWidgetCellProvider",
{
  members :
  {
    /**
     * This method returns the configured cell for the given cell. The return
     * value may be <code>null</code> to indicate that the cell should be empty.
     *
     * @param row {Integer} The cell's row index.
     * @param column {Integer} The cell's column index.
     * @return {qx.ui.core.LayoutItem} The configured widget for the given cell.
     */
    getCellWidget : function(row, column) {},

    /**
     * Release the given cell widget. Either pool or destroy the widget.
     *
     * @param widget {qx.ui.core.LayoutItem} The cell widget to pool.
     */
    poolCellWidget : function(widget) {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The mixin controls the binding between model and item.
 *
 * @internal
 */
qx.Mixin.define("qx.ui.list.core.MWidgetController",
{
  construct : function() {
    this.__boundItems = [];
  },


  properties :
  {
    /**
     * The path to the property which holds the information that should be
     * shown as a label. This is only needed if objects are stored in the model.
     */
    labelPath :
    {
      check: "String",
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
      nullable: true
    },


    /**
     * The path to the property which holds the information that should be
     * displayed as a group label. This is only needed if objects are stored in the
     * model.
     */
    groupLabelPath :
    {
      check: "String",
      nullable: true
    },


    /**
     * A map containing the options for the label binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    labelOptions :
    {
      nullable: true
    },


    /**
     * A map containing the options for the icon binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    iconOptions :
    {
      nullable: true
    },


    /**
     * A map containing the options for the group label binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    groupLabelOptions :
    {
      nullable: true
    },


    /**
     * Delegation object, which can have one or more functions defined by the
     * {@link qx.ui.list.core.IListDelegate} interface.
     */
    delegate :
    {
      event: "changeDelegate",
      init: null,
      nullable: true
    }
  },


  members :
  {
    /** @type {Array} which contains the bounded items */
    __boundItems : null,


    /**
     * Helper-Method for binding the default properties from
     * the model to the target widget. The used default properties
     * depends on the passed item. When the passed item is
     * a list item the "label" and "icon" property is used.
     * When the passed item is a group item the "value" property is
     * used.
     *
     * This method should only be called in the
     * {@link IListDelegate#bindItem} function
     * implemented by the {@link #delegate} property.
     *
     * @param item {qx.ui.core.Widget} The internally created and used
     *   list or group item.
     * @param index {Integer} The index of the item.
     */
    bindDefaultProperties : function(item, index)
    {
      if(item.getUserData("cell.type") != "group")
      {
        // bind model first
        this.bindProperty(
            "", "model", null, item, index
        );

        this.bindProperty(
          this.getLabelPath(), "label", this.getLabelOptions(), item, index
        );

        if (this.getIconPath() != null) {
          this.bindProperty(
            this.getIconPath(), "icon", this.getIconOptions(), item, index
          );
        }
      }
      else
      {
        this.bindProperty(
          this.getGroupLabelPath(), "value", this.getGroupLabelOptions(), item, index
        );
      }
    },


    /**
     * Helper-Method for binding a given property from the model to the target
     * widget.
     * This method should only be called in the
     * {@link IListDelegate#bindItem} function implemented by the
     * {@link #delegate} property.
     *
     * @param sourcePath {String | null} The path to the property in the model.
     *   If you use an empty string, the whole model item will be bound.
     * @param targetProperty {String} The name of the property in the target widget.
     * @param options {Map | null} The options to use for the binding.
     * @param targetWidget {qx.ui.core.Widget} The target widget.
     * @param index {Integer} The index of the current binding.
     */
    bindProperty : function(sourcePath, targetProperty, options, targetWidget, index)
    {
      var type = targetWidget.getUserData("cell.type")
      var bindPath = this.__getBindPath(index, sourcePath, type);

      if (options) {
        options.ignoreConverter = "model";
      }

      var id = this._list.bind(bindPath, targetWidget, targetProperty, options);
      this.__addBinding(targetWidget, id);
    },


    /**
     * Helper-Method for binding a given property from the target widget to
     * the model.
     * This method should only be called in the
     * {@link IListDelegate#bindItem} function implemented by the
     * {@link #delegate} property.
     *
     * @param targetPath {String | null} The path to the property in the model.
     * @param sourceProperty {String} The name of the property in the target.
     * @param options {Map | null} The options to use for the binding.
     * @param sourceWidget {qx.ui.core.Widget} The source widget.
     * @param index {Integer} The index of the current binding.
     */
    bindPropertyReverse : function(targetPath, sourceProperty, options, sourceWidget, index)
    {
      var type = sourceWidget.getUserData("cell.type")
      var bindPath = this.__getBindPath(index, targetPath, type);

      var id = sourceWidget.bind(sourceProperty, this._list, bindPath, options);
      this.__addBinding(sourceWidget, id);
    },


    /**
     * Remove all bindings from all bounded items.
     */
    removeBindings : function()
    {
      while(this.__boundItems.length > 0) {
        var item = this.__boundItems.pop();
        this._removeBindingsFrom(item);
      }
    },


    /**
     * Configure the passed item if a delegate is set and the needed
     * function {@link IListDelegate#configureItem} is available.
     *
     * @param item {qx.ui.core.Widget} item to configure.
     */
    _configureItem : function(item)
    {
      var delegate = this.getDelegate();

      if (delegate != null && delegate.configureItem != null) {
        delegate.configureItem(item);
      }
    },


    /**
     * Configure the passed item if a delegate is set and the needed
     * function {@link IListDelegate#configureGroupItem} is available.
     *
     * @param item {qx.ui.core.Widget} item to configure.
     */
    _configureGroupItem : function(item)
    {
      var delegate = this.getDelegate();

      if (delegate != null && delegate.configureGroupItem != null) {
        delegate.configureGroupItem(item);
      }
    },


    /**
     * Sets up the binding for the given item and index.
     *
     * @param item {qx.ui.core.Widget} The internally created and used item.
     * @param index {Integer} The index of the item.
     */
    _bindItem : function(item, index) {
      var delegate = this.getDelegate();

      if (delegate != null && delegate.bindItem != null) {
        delegate.bindItem(this, item, index);
      } else {
        this.bindDefaultProperties(item, index);
      }
    },


    /**
     * Sets up the binding for the given group item and index.
     *
     * @param item {qx.ui.core.Widget} The internally created and used item.
     * @param index {Integer} The index of the item.
     */
    _bindGroupItem : function(item, index) {
      var delegate = this.getDelegate();

      if (delegate != null && delegate.bindGroupItem != null) {
        delegate.bindGroupItem(this, item, index);
      } else {
        this.bindDefaultProperties(item, index);
      }
    },


    /**
     * Removes the binding of the given item.
     *
     * @param item {qx.ui.core.Widget} The item which the binding should
     *   be removed.
     */
    _removeBindingsFrom : function(item) {
      var bindings = this.__getBindings(item);

      while (bindings.length > 0) {
        var id = bindings.pop();

        try {
          this._list.removeBinding(id);
        } catch(e) {
          item.removeBinding(id);
        }
      }

      if (qx.lang.Array.contains(this.__boundItems, item)) {
        qx.lang.Array.remove(this.__boundItems, item);
      }
    },


    /**
     * Helper method to create the path for binding.
     *
     * @param index {Integer} The index of the item.
     * @param path {String|null} The path to the property.
     * @param type {String} The type <code>["item", "group"]</code>.
     * @return {String} The binding path
     */
    __getBindPath : function(index, path, type)
    {
      var bindPath = "model[" + index + "]";
      if (type == "group") {
        bindPath = "groups[" + index + "]";
      }

      if (path != null && path != "") {
        bindPath += "." + path;
      }

      return bindPath;
    },


    /**
     * Helper method to save the binding for the widget.
     *
     * @param widget {qx.ui.core.Widget} widget to save binding.
     * @param id {var} the id from the binding.
     */
    __addBinding : function(widget, id)
    {
      var bindings = this.__getBindings(widget);

      if (!qx.lang.Array.contains(bindings, id)) {
        bindings.push(id);
      }

      if (!qx.lang.Array.contains(this.__boundItems, widget)) {
        this.__boundItems.push(widget);
      }
    },


    /**
     * Helper method which returns all bound id from the widget.
     *
     * @param widget {qx.ui.core.Widget} widget to get all binding.
     * @return {Array} all bound id's.
     */
    __getBindings : function(widget)
    {
      var bindings = widget.getUserData("BindingIds");

      if (bindings == null) {
        bindings = [];
        widget.setUserData("BindingIds", bindings);
      }

      return bindings;
    }
  },


  destruct : function() {
    this.__boundItems = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * The provider implements the {@link qx.ui.virtual.core.IWidgetCellProvider} API,
 * which can be used as delegate for the widget cell rendering and it
 * provides a API to bind the model with the rendered item.
 *
 * @internal
 */
qx.Class.define("qx.ui.list.provider.WidgetProvider",
{
  extend : qx.core.Object,

  implement : [
   qx.ui.virtual.core.IWidgetCellProvider,
   qx.ui.list.provider.IListProvider
  ],

  include : [qx.ui.list.core.MWidgetController],


  /**
   * Creates the <code>WidgetProvider</code>
   *
   * @param list {qx.ui.list.List} list to provide.
   */
  construct : function(list)
  {
    this.base(arguments);

    this._list = list;

    this._itemRenderer = this.createItemRenderer();
    this._groupRenderer = this.createGroupRenderer();

    this._itemRenderer.addListener("created", this._onItemCreated, this);
    this._groupRenderer.addListener("created", this._onGroupItemCreated, this);
    this._list.addListener("changeDelegate", this._onChangeDelegate, this);
  },


  members :
  {
    /** @type {qx.ui.virtual.cell.WidgetCell} the used item renderer */
    _itemRenderer : null,


    /** @type {qx.ui.virtual.cell.WidgetCell} the used group renderer */
    _groupRenderer : null,


    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */


    // interface implementation
    getCellWidget : function(row, column)
    {
      var widget = null;

      if (!this._list._isGroup(row))
      {
        widget = this._itemRenderer.getCellWidget();
        widget.setUserData("cell.type", "item");
        this._bindItem(widget, this._list._lookup(row));

        if(this._list._manager.isItemSelected(row)) {
          this._styleSelectabled(widget);
        } else {
          this._styleUnselectabled(widget);
        }
      }
      else
      {
        widget = this._groupRenderer.getCellWidget();
        widget.setUserData("cell.type", "group");
        this._bindGroupItem(widget, this._list._lookupGroup(row));
      }

      return widget;
    },


    // interface implementation
    poolCellWidget : function(widget) {
      this._removeBindingsFrom(widget);

      if (widget.getUserData("cell.type") == "item") {
        this._itemRenderer.pool(widget);
      } else if (widget.getUserData("cell.type") == "group") {
        this._groupRenderer.pool(widget);
      }
      this._onPool(widget);
    },


    // interface implementation
    createLayer : function() {
      return new qx.ui.virtual.layer.WidgetCell(this);
    },


    // interface implementation
    createItemRenderer : function()
    {
      var createWidget = qx.util.Delegate.getMethod(this.getDelegate(), "createItem");

      if (createWidget == null) {
        createWidget = function() {
          return new qx.ui.form.ListItem();
        }
      }

      var renderer = new qx.ui.virtual.cell.WidgetCell();
      renderer.setDelegate({
        createWidget : createWidget
      });

      return renderer;
    },


    // interface implementation
    createGroupRenderer : function() {
      var createWidget = qx.util.Delegate.getMethod(this.getDelegate(), "createGroupItem");

      if (createWidget == null)
      {
        createWidget = function()
        {
          var group = new qx.ui.basic.Label();
          group.setAppearance("group-item");

          return group;
        }
      }

      var renderer = new qx.ui.virtual.cell.WidgetCell();
      renderer.setDelegate({
        createWidget : createWidget
      });

      return renderer;
    },


    // interface implementation
    styleSelectabled : function(row)
    {
      var widget = this.__getWidgetFrom(row);
      this._styleSelectabled(widget);
    },


    // interface implementation
    styleUnselectabled : function(row)
    {
      var widget = this.__getWidgetFrom(row);
      this._styleUnselectabled(widget);
    },


    // interface implementation
    isSelectable : function(row)
    {
      if (this._list._isGroup(row)) {
        return false;
      }

      var widget = this._list._layer.getRenderedCellWidget(row, 0);

      if (widget != null) {
        return widget.isEnabled();
      } else {
        return true;
      }
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL API
    ---------------------------------------------------------------------------
    */


    /**
     * Styles a selected item.
     *
     * @param widget {qx.ui.core.Widget} widget to style.
     */
    _styleSelectabled : function(widget) {
      this.__updateStates(widget, {selected: 1});
    },


    /**
     * Styles a not selected item.
     *
     * @param widget {qx.ui.core.Widget} widget to style.
     */
    _styleUnselectabled : function(widget) {
      this.__updateStates(widget, {});
    },


    /**
     * Calls the delegate <code>onPool</code> method when it is used in the
     * {@link #delegate} property.
     *
     * @param item {qx.ui.core.Widget} Item to modify.
     */
    _onPool : function(item)
    {
      var onPool = qx.util.Delegate.getMethod(this.getDelegate(), "onPool");

      if (onPool != null) {
        onPool(item);
      }
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLERS
    ---------------------------------------------------------------------------
    */


    /**
     * Event handler for the created item widget event.
     *
     * @param event {qx.event.type.Data} fired event.
     */
    _onItemCreated : function(event)
    {
      var widget = event.getData();
      this._configureItem(widget);
    },


    /**
     * Event handler for the created item widget event.
     *
     * @param event {qx.event.type.Data} fired event.
     */
    _onGroupItemCreated : function(event)
    {
      var widget = event.getData();
      this._configureGroupItem(widget);
    },


    /**
     * Event handler for the change delegate event.
     *
     * @param event {qx.event.type.Data} fired event.
     */
    _onChangeDelegate : function(event)
    {
      this._itemRenderer.dispose();
      this._itemRenderer = this.createItemRenderer();
      this._itemRenderer.addListener("created", this._onItemCreated, this);
      this._groupRenderer.dispose();
      this._groupRenderer = this.createGroupRenderer();
      this._groupRenderer.addListener("created", this._onGroupItemCreated, this);
      this.removeBindings();
      this._list.getPane().fullUpdate();
    },


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */


    /**
     * Helper method to get the widget from the passed row.
     *
     * @param row {Integer} row to search.
     * @return {qx.ui.core.Widget|null} The found widget or <code>null</code> when no widget found.
     */
    __getWidgetFrom : function(row) {
      return this._list._layer.getRenderedCellWidget(row, 0);
    },


    /**
     * Helper method to update the states from a widget.
     *
     * @param widget {qx.ui.core.Widget} widget to set states.
     * @param states {Map} the state to set.
     */
    __updateStates : function(widget, states)
    {
      if(widget == null) {
        return;
      }

      this._itemRenderer.updateStates(widget, states);
    }
  },


  destruct : function()
  {
    this._itemRenderer.dispose();
    this._groupRenderer.dispose();
    this._itemRenderer = this._groupRenderer = null;
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
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * The WidgetCell layer renders each cell with a qooxdoo widget. The concrete
 * widget instance for each cell is provided by a cell provider.
 */
qx.Class.define("qx.ui.virtual.layer.WidgetCell",
{
  extend : qx.ui.virtual.layer.Abstract,

  include : [
    qx.ui.core.MChildrenHandling
  ],


  /**
   * @param widgetCellProvider {qx.ui.virtual.core.IWidgetCellProvider} This
   *    class manages the life cycle of the cell widgets.
   */
  construct : function(widgetCellProvider)
  {
    this.base(arguments);
    this.setZIndex(12);

    if (qx.core.Environment.get("qx.debug")) {
      this.assertInterface(
        widgetCellProvider,
        qx.ui.virtual.core.IWidgetCellProvider
      );
    }

    this._cellProvider = widgetCellProvider;
    this.__spacerPool = [];
  },


  /*
   *****************************************************************************
      PROPERTIES
   *****************************************************************************
   */

   properties :
   {
     // overridden
     anonymous :
     {
       refine: true,
       init: false
     }
   },

  events :
  {
    /**
     * Is fired when the {@link #_fullUpdate} or the
     * {@link #_updateLayerWindow} is finished.
     */
    updated : "qx.event.type.Event"
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
     __spacerPool : null,

     /**
     * Returns the widget used to render the given cell. May return null if the
     * cell isn’t rendered currently rendered.
     *
     * @param row {Integer} The cell's row index
     * @param column {Integer} The cell's column index
     * @return {qx.ui.core.LayoutItem|null} the widget used to render the given
     *    cell or <code>null</code>
     */
     getRenderedCellWidget : function(row, column)
     {
       var columnCount = this.getColumnSizes().length;
       var rowCount = this.getRowSizes().length;

       var firstRow = this.getFirstRow();
       var firstColumn = this.getFirstColumn();

       if (
         row < firstRow ||
         row >= firstRow + rowCount ||
         column < firstColumn ||
         column >= firstColumn + columnCount
       ) {
         return null;
       }

       var childIndex = (column - firstColumn) + (row - firstRow) * columnCount;
       var widget = this._getChildren()[childIndex];

       if (widget.getUserData("cell.empty")) {
         return null;
       } else {
         return widget;
       }
     },


    /**
     * Get the spacer widget, for empty cells
     *
     * @return {qx.ui.core.Spacer} The spacer widget.
     */
    _getSpacer : function()
    {
      var spacer = this.__spacerPool.pop();
      if (!spacer)
      {
        spacer = new qx.ui.core.Spacer();
        spacer.setUserData("cell.empty", 1);
      }
      return spacer;
    },


    /**
     * Activates one of the still not empty items.
     * @param elementToPool {qx.ui.core.Widget} The widget which gets pooled.
     */
    _activateNotEmptyChild : function(elementToPool)
    {
      // get the current active element
      var active = qx.ui.core.FocusHandler.getInstance().getActiveWidget();
      // if the element to pool is active or one of its children
      if (active == elementToPool || qx.ui.core.Widget.contains(elementToPool, active)) {
        // search for a new child to activate
        var children = this._getChildren();
        for (var i = children.length - 1; i >= 0; i--) {
          if (!children[i].getUserData("cell.empty")) {
            children[i].activate();
            break;
          }
        };
      }
    },


    // overridden
    _fullUpdate : function(firstRow, firstColumn, rowSizes, columnSizes)
    {
      var cellProvider = this._cellProvider;

      var children = this._getChildren();
      for (var i=0; i<children.length; i++)
      {
        var child = children[i];
        if (child.getUserData("cell.empty")) {
          this.__spacerPool.push(child);
        } else {
          this._activateNotEmptyChild(child);
          cellProvider.poolCellWidget(child);
        }
      }

      this._removeAll();

      var top = 0;
      var left = 0;

      for (var y=0; y<rowSizes.length; y++)
      {
        for (var x=0; x<columnSizes.length; x++)
        {
          var row = firstRow + y;
          var column = firstColumn + x;

          var item = cellProvider.getCellWidget(row, column) || this._getSpacer();
          item.setUserBounds(left, top, columnSizes[x], rowSizes[y]);
          item.setUserData("cell.row", row);
          item.setUserData("cell.column", column);
          this._add(item);

          left += columnSizes[x];
        }
        top += rowSizes[y];
        left = 0;
      }

      this.fireEvent("updated");
    },


    _updateLayerWindow : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    )
    {
      // compute overlap of old and new window
      //
      //      +---+
      //      |  ##--+
      //      |  ##  |
      //      +--##  |
      //         +---+
      //


    if (qx.core.Environment.get("qx.debug"))
    {
      this.assertPositiveInteger(firstRow);
      this.assertPositiveInteger(firstColumn);
      this.assertArray(rowSizes);
      this.assertArray(columnSizes);
    }


      var lastRow = firstRow + rowSizes.length - 1;
      var lastColumn = firstColumn + columnSizes.length - 1;

      var overlap = {
        firstRow: Math.max(firstRow, this.getFirstRow()),
        lastRow: Math.min(lastRow, this._lastRow),
        firstColumn: Math.max(firstColumn, this.getFirstColumn()),
        lastColumn: Math.min(lastColumn, this._lastColumn)
      }

      this._lastColumn = lastColumn;
      this._lastRow = lastRow;

      if (
        overlap.firstRow > overlap.lastRow ||
        overlap.firstColumn > overlap.lastColumn
      ) {
        return this._fullUpdate(
          firstRow, firstColumn,
          rowSizes, columnSizes
        );
      }

      // collect the widgets to move
      var children = this._getChildren();
      var lineLength = this.getColumnSizes().length;
      var widgetsToMove = [];
      var widgetsToMoveIndexes = {};
      for (var row=firstRow; row<=lastRow; row++)
      {
        widgetsToMove[row] = [];
        for (var column=firstColumn; column<=lastColumn; column++)
        {
          if (
            row >= overlap.firstRow &&
            row <= overlap.lastRow &&
            column >= overlap.firstColumn &&
            column <= overlap.lastColumn
          )
          {
            var x = column - this.getFirstColumn();
            var y = row - this.getFirstRow();
            var index = y*lineLength + x;
            widgetsToMove[row][column] = children[index];
            widgetsToMoveIndexes[index] = true;
          }
        }
      }

      var cellProvider = this._cellProvider;

      // pool widgets
      var children = this._getChildren();
      for (var i=0; i<children.length; i++)
      {
        if (!widgetsToMoveIndexes[i])
        {
          var child = children[i];
          if (child.getUserData("cell.empty")) {
            this.__spacerPool.push(child);
          } else {
            this._activateNotEmptyChild(child);
            cellProvider.poolCellWidget(child);
          }
        }
      }

      this._removeAll();

      var top = 0;
      var left = 0;

      for (var y=0; y<rowSizes.length; y++)
      {
        for (var x=0; x<columnSizes.length; x++)
        {
          var row = firstRow + y;
          var column = firstColumn + x;

          var item =
            widgetsToMove[row][column] ||
            cellProvider.getCellWidget(row, column) ||
            this._getSpacer();

          item.setUserBounds(left, top, columnSizes[x], rowSizes[y]);
          item.setUserData("cell.row", row);
          item.setUserData("cell.column", column);
          this._add(item);

          left += columnSizes[x];
        }
        top += rowSizes[y];
        left = 0;
      }

      this.fireEvent("updated");
    }
  },

  destruct : function()
  {
    var children = this._getChildren();
    for (var i=0; i<children.length; i++) {
      children[i].dispose();
    }

    this._cellProvider = this.__spacerPool = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Methods to work with the delegate pattern.
 */
qx.Class.define("qx.util.Delegate",
{
  statics :
  {
    /**
     * Returns the delegate method given my its name.
     *
     * @param delegate {Object} The delegate object to check the method.
     * @param specificMethod {String} The name of the delegate method.
     * @return {Function|null} The requested method or null, if no method is set.
     */
    getMethod : function(delegate, specificMethod)
    {
      if (qx.util.Delegate.containsMethod(delegate, specificMethod)) {
        return qx.lang.Function.bind(delegate[specificMethod], delegate);
      }

      return null;
    },



    /**
     * Checks, if the given delegate is valid or if a specific method is given.
     *
     * @param delegate {Object} The delegate object.
     * @param specificMethod {String} The name of the method to search for.
     * @return {Boolean} True, if everything was ok.
     */
    containsMethod : function (delegate, specificMethod)
    {
      var Type = qx.lang.Type;

      if (Type.isObject(delegate)) {
        return Type.isFunction(delegate[specificMethod]);
      }

      return false;
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
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * A widget cell renderer manages a pool of widgets to render cells in a
 * {@link qx.ui.virtual.layer.WidgetCell} layer.
 */
qx.Interface.define("qx.ui.virtual.cell.IWidgetCell",
{
  members :
  {
    /**
     * Get a widget instance to render the cell
     *
     * @param data {var} Data needed for the cell to render.
     * @param states {Map} The states set on the cell (e.g. <i>selected</i>,
     * <i>focused</i>, <i>editable</i>).
     *
     * @return {qx.ui.core.LayoutItem} The cell widget
     */
    getCellWidget : function(data, states) {},


    /**
     * Release the given widget instance.
     *
     * Either pool or dispose the widget.
     *
     * @param widget {qx.ui.core.LayoutItem} The cell widget to pool
     */
    pool : function(widget) {},


    /**
     * Update the states of the given widget.
     *
     * @param widget {qx.ui.core.LayoutItem} The cell widget to update
     * @param states {Map} The cell widget's states
     */
    updateStates : function(widget, states) {},


    /**
     * Update the data the cell widget should display
     *
     * @param widget {qx.ui.core.LayoutItem} The cell widget to update
     * @param data {var} The data to display
     */
    updateData : function(widget, data) {}
  }
});
/**
 * Abstract base class for widget based cell renderer.
 */
qx.Class.define("qx.ui.virtual.cell.AbstractWidget",
{
  extend : qx.core.Object,
  implement : [qx.ui.virtual.cell.IWidgetCell],


  construct : function()
  {
    this.base(arguments);

    this.__pool = [];
  },


  events :
  {
    /** Fired when a new <code>LayoutItem</code> is created. */
    "created" : "qx.event.type.Data"
  },


  members :
  {
    __pool : null,


    /**
     * Creates the widget instance.
     *
     * @abstract
     * @return {qx.ui.core.LayoutItem} The widget used to render a cell
     */
    _createWidget : function() {
      throw new Error("abstract method call");
    },


    // interface implementation
    updateData : function(widget, data) {
      throw new Error("abstract method call");
    },


    // interface implementation
    updateStates : function(widget, states)
    {
      var oldStates = widget.getUserData("cell.states");

      // remove old states
      if (oldStates)
      {
        var newStates = states || {};
        for (var state in oldStates)
        {
          if (!newStates[state]) {
            widget.removeState(state);
          }
        }
      }
      else
      {
        oldStates = {};
      }

      // apply new states
      if (states)
      {
        for (var state in states)
        {
          if (!oldStates.state) {
            widget.addState(state);
          }
        }
      }

      widget.setUserData("cell.states", states);
    },


    // interface implementation
    getCellWidget : function(data, states)
    {
      var widget = this.__getWidgetFromPool();
      this.updateStates(widget, states);
      this.updateData(widget, data);
      return widget;
    },


    // interface implementation
    pool : function(widget) {
      this.__pool.push(widget);
    },

    /**
     * Cleanup all <code>LayoutItem</code> and destroy them.
     */
    _cleanupPool : function() {
      var widget = this.__pool.pop();

      while(widget)
      {
        widget.destroy();
        widget = this.__pool.pop();
      }
    },

    /**
     * Returns a <code>LayoutItem</code> from the pool, when the pool is empty
     * a new <code>LayoutItem</code> is created.
     *
     * @return {qx.ui.core.LayoutItem} The cell widget
     */
    __getWidgetFromPool : function()
    {
      var widget = this.__pool.pop();

      if (widget == null)
      {
        widget = this._createWidget();
        this.fireDataEvent("created", widget);
      }

      return widget;
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function()
  {
    this._cleanupPool();
    this.__pool = null;
  }
})
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * Cell renderer can be used for Widget rendering. The Widget creation can be configured with the
 * {@link #delegate} property:
 *
 * <pre class="javascript">
 * widgetCell.setDelegate(
 * {
 *   createWidget : function() {
 *     return new qx.ui.form.ListItem();
 *   }
 * });
 * </pre>
 *
 * When the {@link #delegate} property is not used {@link qx.ui.core.Widget} instances are created as
 * fallback.
 *
 * The {@link #updateData} method can be used to update any Widget property. Just use a <code>Map</code>
 * with property name as key:
 *
 * <pre class="javascript">
 * // widget is a qx.ui.form.ListItem instance
 * widgetCell.updateData(widget,
 * {
 *   label: "my label value",
 *   icon: "qx/icon/22/emotes/face-angel.png"
 * });
 * </pre>
 */
qx.Class.define("qx.ui.virtual.cell.WidgetCell",
{
  extend : qx.ui.virtual.cell.AbstractWidget,

  properties :
  {
    /**
     * Delegation object, which can have one or more functions defined by the
     * {@link qx.ui.virtual.cell.IWidgetCellDelegate} interface.
     */
    delegate :
    {
      apply: "_applyDelegate",
      init: null,
      nullable: true
    }
  },

  members :
  {
    // apply method
    _applyDelegate : function(value, old) {
      this._cleanupPool();
    },

    // overridden
    _createWidget : function() {
      var delegate = this.getDelegate();

      if (delegate != null && delegate.createWidget != null) {
        return delegate.createWidget();
      } else {
        return new qx.ui.core.Widget();
      }
    },

    // overridden
    updateData : function(widget, data) {
      for (var key in data)
      {
        if (qx.Class.hasProperty(widget.constructor, key)) {
          qx.util.PropertyUtil.setUserValue(widget, key, data[key]);
        } else {
          throw new Error("Can't update data! The key '" + key + "' is not a Property!")
        }
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
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */

/**
 * Support for native and custom events.
 *
 * @require(qx.module.Polyfill)
 * @group (Core)
 */
qx.Bootstrap.define("qx.module.Event", {
  statics :
  {
    /**
     * Event normalization registry
     *
     * @internal
     */
    __normalizations : {},

    /**
     * Registry of event hooks
     * @internal
     */
    __hooks : {
      on : {},
      off : {}
    },

    /**
     * Registers a listener for the given event type on each item in the
     * collection. This can be either native or custom events.
     *
     * @attach {qxWeb}
     * @param type {String} Type of the event to listen for
     * @param listener {Function} Listener callback
     * @param context {Object?} Context the callback function will be executed in.
     * Default: The element on which the listener was registered
     * @param useCapture {Boolean?} Attach the listener to the capturing
     * phase if true
     * @return {qxWeb} The collection for chaining
     */
    on : function(type, listener, context, useCapture) {
      for (var i=0; i < this.length; i++) {
        var el = this[i];
        var ctx = context || qxWeb(el);

        // call hooks
        var hooks = qx.module.Event.__hooks.on;
        // generic
        var typeHooks = hooks["*"] || [];
        // type specific
        if (hooks[type]) {
          typeHooks = typeHooks.concat(hooks[type]);
        }
        for (var j=0, m=typeHooks.length; j<m; j++) {
          typeHooks[j](el, type, listener, context);
        }

        var bound = function(event) {
          // apply normalizations
          var registry = qx.module.Event.__normalizations;
          // generic
          var normalizations = registry["*"] || [];
          // type specific
          if (registry[type]) {
            normalizations = normalizations.concat(registry[type]);
          }

          for (var x=0, y=normalizations.length; x<y; x++) {
            event = normalizations[x](event, el, type);
          }
          // call original listener with normalized event
          listener.apply(this, [event]);
        }.bind(ctx);
        bound.original = listener;

        // add native listener
        if (qx.bom.Event.supportsEvent(el, type)) {
          qx.bom.Event.addNativeListener(el, type, bound, useCapture);
        }
        // create an emitter if necessary
        if (!el.__emitter) {
          el.__emitter = new qx.event.Emitter();
        }

        var id = el.__emitter.on(type, bound, ctx);
        if (!el.__listener) {
          el.__listener = {};
        }
        if (!el.__listener[type]) {
          el.__listener[type] = {};
        }
        el.__listener[type][id] = bound;

        if (!context) {
          // store a reference to the dynamically created context so we know
          // what to check for when removing the listener
          if (!el.__ctx) {
            el.__ctx = {};
          }
          el.__ctx[id] = ctx;
        }
      }
      return this;
    },


    /**
     * Unregisters event listeners for the given type from each element in the
     * collection.
     *
     * @attach {qxWeb}
     * @param type {String} Type of the event
     * @param listener {Function} Listener callback
     * @param context {Object?} Listener callback context
     * @param useCapture {Boolean?} Attach the listener to the capturing
     * phase if true
     * @return {qxWeb} The collection for chaining
     */
    off : function(type, listener, context, useCapture) {
      var removeAll = (listener === null && context === null);

      for (var j=0; j < this.length; j++) {
        var el = this[j];

        // continue if no listeners are available
        if (!el.__listener) {
          continue;
        }

        var types = [];
        if (type !== null) {
          types.push(type);
        } else {
          // no type specified, remove all listeners
          for (var listenerType in el.__listener) {
            types.push(listenerType);
          }
        }

        for (var i=0, l=types.length; i<l; i++) {
          for (var id in el.__listener[types[i]]) {
            var storedListener = el.__listener[types[i]][id];
            if (removeAll || storedListener == listener || storedListener.original == listener) {
              // get the stored context
              var hasStoredContext = typeof el.__ctx !== "undefined" && el.__ctx[id];
              var storedContext;
              if (!context && hasStoredContext) {
                storedContext = el.__ctx[id];
              }
              // remove the listener from the emitter
              el.__emitter.off(types[i], storedListener, storedContext || context);

              // check if it's a bound listener which means it was a native event
              if (removeAll || storedListener.original == listener) {
                // remove the native listener
                qx.bom.Event.removeNativeListener(el, types[i], storedListener, useCapture);
              }

              delete el.__listener[types[i]][id];

              if (hasStoredContext) {
                delete el.__ctx[id];
              }
            }
          }

          // call hooks
          var hooks = qx.module.Event.__hooks.off;
          // generic
          var typeHooks = hooks["*"] || [];
          // type specific
          if (hooks[type]) {
            typeHooks = typeHooks.concat(hooks[type]);
          }
          for (var k=0, m=typeHooks.length; k<m; k++) {
            typeHooks[k](el, type, listener, context);
          }
        }

      }

      return this;
    },

    /**
     * Removes all event listeners (or all listeners for a given type) from the
     * collection.
     *
     * @attach {qxWeb}
     * @param type {String?} Event type. All listeners will be removed if this is undefined.
     * @return {qxWeb} The collection for chaining
     */
    allOff : function(type) {
      return this.off(type || null, null, null);
    },

    /**
     * Fire an event of the given type.
     *
     * @attach {qxWeb}
     * @param type {String} Event type
     * @param data {var?} Optional data that will be passed to the listener
     * callback function.
     * @return {qxWeb} The collection for chaining
     */
    emit : function(type, data) {
      for (var j=0; j < this.length; j++) {
        var el = this[j];
        if (el.__emitter) {
          el.__emitter.emit(type, data);
        }
      }
      return this;
    },


    /**
     * Attaches a listener for the given event that will be executed only once.
     *
     * @attach {qxWeb}
     * @param type {String} Type of the event to listen for
     * @param listener {Function} Listener callback
     * @param context {Object?} Context the callback function will be executed in.
     * Default: The element on which the listener was registered
     * @return {qxWeb} The collection for chaining
     */
    once : function(type, listener, context) {
      var self = this;
      var wrappedListener = function(data) {
        self.off(type, wrappedListener, context);
        listener.call(this, data);
      };
      this.on(type, wrappedListener, context);
      return this;
    },


    /**
     * Checks if one or more listeners for the given event type are attached to
     * the first element in the collection
     *
     * @attach {qxWeb}
     * @param type {String} Event type, e.g. <code>mousedown</code>
     * @param listener {Function?} Event listener to check for.
     * @param context {Object?} Context object listener to check for.
     * @return {Boolean} <code>true</code> if one or more listeners are attached
     */
    hasListener : function(type, listener, context) {
      if (!this[0] || !this[0].__emitter ||
        !this[0].__emitter.getListeners()[type])
      {
        return false;
      }

      if (listener) {
        var attachedListeners = this[0].__emitter.getListeners()[type];
        for (var i = 0; i < attachedListeners.length; i++) {
          var hasListener = false;
          if (attachedListeners[i].listener == listener) {
            hasListener = true;
          }
          if (attachedListeners[i].listener.original &&
              attachedListeners[i].listener.original == listener) {
            hasListener =  true;
          }

          if (hasListener) {
            if (context !== undefined) {
              if (attachedListeners[i].ctx === context) {
                return true;
              }
            } else {
              return true;
            }
          }
        }
        return false;
      }
      return this[0].__emitter.getListeners()[type].length > 0;
    },


    /**
     * Copies any event listeners that are attached to the elements in the
     * collection to the provided target element
     *
     * @internal
     * @param target {Element} Element to attach the copied listeners to
     */
    copyEventsTo : function(target) {
      // Copy both arrays to make sure the original collections are not manipulated.
      // If e.g. the 'target' array contains a DOM node with child nodes we run into
      // problems because the 'target' array is flattened within this method.
      var source = this.concat();
      var targetCopy = target.concat();

      // get all children of source and target
      for (var i = source.length - 1; i >= 0; i--) {
        var descendants = source[i].getElementsByTagName("*");
        for (var j=0; j < descendants.length; j++) {
          source.push(descendants[j]);
        }
      }

      for (var i = targetCopy.length -1; i >= 0; i--) {
        var descendants = targetCopy[i].getElementsByTagName("*");
        for (var j=0; j < descendants.length; j++) {
          targetCopy.push(descendants[j]);
        }
      }
      // make sure no emitter object has been copied
      targetCopy.forEach(function(el) {
        el.__emitter = null;
      });

      for (var i=0; i < source.length; i++) {
        var el = source[i];
        if (!el.__emitter) {
          continue;
        }
        var storage = el.__emitter.getListeners();
        for (var name in storage) {
          for (var j = storage[name].length - 1; j >= 0; j--) {
            var listener = storage[name][j].listener;
            if (listener.original) {
              listener = listener.original;
            }
            qxWeb(targetCopy[i]).on(name, listener, storage[name][j].ctx);
          }
        }
      }
    },


    __isReady : false,


    /**
     * Executes the given function once the document is ready.
     *
     * @attachStatic {qxWeb}
     * @param callback {Function} callback function
     */
    ready : function(callback) {
      // DOM is already ready
      if (document.readyState === "complete") {
        window.setTimeout(callback, 1);
        return;
      }

      // listen for the load event so the callback is executed no matter what
      var onWindowLoad = function()
      {
        qx.module.Event.__isReady = true;
        callback();
      };

      qxWeb(window).on("load", onWindowLoad);

      var wrappedCallback = function() {
        qxWeb(window).off("load", onWindowLoad);
        callback();
      };

      // Listen for DOMContentLoaded event if available (no way to reliably detect
      // support)
      if (qxWeb.env.get("engine.name") !== "mshtml" || qxWeb.env.get("browser.documentmode") > 8) {
        qx.bom.Event.addNativeListener(document, "DOMContentLoaded", wrappedCallback);
      }
      else {
        // Continually check to see if the document is ready
        var timer = function() {
          // onWindowLoad already executed
          if (qx.module.Event.__isReady) {
            return;
          }
          try {
            // If DOMContentLoaded is unavailable, use the trick by Diego Perini
            // http://javascript.nwbox.com/IEContentLoaded/
            document.documentElement.doScroll("left");
            if (document.body) {
              wrappedCallback();
            }
          }
          catch(error) {
            window.setTimeout(timer, 100);
          }
        };

        timer();
      }
    },


    /**
     * Bind one or two callbacks to the collection.
     * If only the first callback is defined the collection
     * does react on 'mouseover' only.
     *
     * @attach {qxWeb}
     *
     * @param callbackIn {Function} callback when hovering over
     * @param callbackOut {Function?} callback when hovering out
     * @return {qxWeb} The collection for chaining
     */
    hover : function(callbackIn, callbackOut) {

      this.on("mouseover", callbackIn, this);

      if (qx.lang.Type.isFunction(callbackOut)) {
        this.on("mouseout", callbackOut, this);
      }

      return this;
    },


    /**
     * Registers a normalization function for the given event types. Listener
     * callbacks for these types will be called with the return value of the
     * normalization function instead of the regular event object.
     *
     * The normalizer will be called with two arguments: The original event
     * object and the element on which the event was triggered
     *
     * @attachStatic {qxWeb, $registerEventNormalization}
     * @param types {String[]} List of event types to be normalized. Use an
     * asterisk (<code>*</code>) to normalize all event types
     * @param normalizer {Function} Normalizer function
     */
    $registerNormalization : function(types, normalizer)
    {
      if (!qx.lang.Type.isArray(types)) {
        types = [types];
      }
      var registry = qx.module.Event.__normalizations;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (qx.lang.Type.isFunction(normalizer)) {
          if (!registry[type]) {
            registry[type] = [];
          }
          registry[type].push(normalizer);
        }
      }
    },


    /**
     * Unregisters a normalization function from the given event types.
     *
     * @attachStatic {qxWeb, $unregisterEventNormalization}
     * @param types {String[]} List of event types
     * @param normalizer {Function} Normalizer function
     */
    $unregisterNormalization : function(types, normalizer)
    {
      if (!qx.lang.Type.isArray(types)) {
        types = [types];
      }
      var registry = qx.module.Event.__normalizations;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (registry[type]) {
          qx.lang.Array.remove(registry[type], normalizer);
        }
      }
    },


    /**
     * Returns all registered event normalizers
     *
     * @attachStatic {qxWeb, $getEventNormalizationRegistry}
     * @return {Map} Map of event types/normalizer functions
     */
    $getRegistry : function()
    {
      return qx.module.Event.__normalizations;
    },


    /**
     * Registers an event hook for the given event types.
     *
     * @attachStatic {qxWeb, $registerEventHook}
     * @param types {String[]} List of event types
     * @param registerHook {Function} Hook function to be called on event registration
     * @param unregisterHook {Function?} Hook function to be called on event deregistration
     * @internal
     */
    $registerEventHook : function(types, registerHook, unregisterHook)
    {
      if (!qx.lang.Type.isArray(types)) {
        types = [types];
      }
      var onHooks = qx.module.Event.__hooks.on;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (qx.lang.Type.isFunction(registerHook)) {
          if (!onHooks[type]) {
            onHooks[type] = [];
          }
          onHooks[type].push(registerHook);
        }
      }
      if (!unregisterHook) {
        return;
      }
      var offHooks = qx.module.Event.__hooks.off;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (qx.lang.Type.isFunction(unregisterHook)) {
          if (!offHooks[type]) {
            offHooks[type] = [];
          }
          offHooks[type].push(unregisterHook);
        }
      }
    },


    /**
     * Unregisters a hook from the given event types.
     *
     * @attachStatic {qxWeb, $unregisterEventHooks}
     * @param types {String[]} List of event types
     * @param registerHook {Function} Hook function to be called on event registration
     * @param unregisterHook {Function?} Hook function to be called on event deregistration
     * @internal
     */
    $unregisterEventHook : function(types, registerHook, unregisterHook)
    {
      if (!qx.lang.Type.isArray(types)) {
        types = [types];
      }
      var onHooks = qx.module.Event.__hooks.on;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (onHooks[type]) {
          qx.lang.Array.remove(onHooks[type], registerHook);
        }
      }
      if (!unregisterHook) {
        return;
      }
      var offHooks = qx.module.Event.__hooks.off;
      for (var i=0,l=types.length; i<l; i++) {
        var type = types[i];
        if (offHooks[type]) {
          qx.lang.Array.remove(offHooks[type], unregisterHook);
        }
      }
    },


    /**
     * Returns all registered event hooks
     *
     * @attachStatic {qxWeb, $getEventHookRegistry}
     * @return {Map} Map of event types/registration hook functions
     * @internal
     */
    $getHookRegistry : function()
    {
      return qx.module.Event.__hooks;
    }
  },


  defer : function(statics) {
    qxWeb.$attach({
      "on" : statics.on,
      "off" : statics.off,
      "allOff" : statics.allOff,
      "once" : statics.once,
      "emit" : statics.emit,
      "hasListener" : statics.hasListener,
      "copyEventsTo" : statics.copyEventsTo,
      "hover" : statics.hover
    });

    qxWeb.$attachStatic({
      "ready": statics.ready,
      "$registerEventNormalization" : statics.$registerNormalization,
      "$unregisterEventNormalization" : statics.$unregisterNormalization,
      "$getEventNormalizationRegistry" : statics.$getRegistry,

      "$registerEventHook" : statics.$registerEventHook,
      "$unregisterEventHook" : statics.$unregisterEventHook,
      "$getEventHookRegistry" : statics.$getHookRegistry
    });
  }
});

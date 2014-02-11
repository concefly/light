/** qooxdoo v3.5 | (c) 2013 1&1 Internet AG, http://1und1.de | http://qooxdoo.org/license */
(function(){
if (!window.qx) window.qx = qxWeb.$$qx;
var qx = window.qx;

if (!qx.$$environment) qx.$$environment = {};
var envinfo = {"json":true,"qx.application":"library.Application","qx.debug":false,"qx.debug.databinding":false,"qx.debug.dispose":false,"qx.debug.io":false,"qx.debug.ui.queue":false,"qx.globalErrorHandling":false,"qx.optimization.variants":true,"qx.revision":"","qx.theme":"qx.theme.Modern","qx.version":"3.5"};
for (var k in envinfo) qx.$$environment[k] = envinfo[k];

qx.$$packageData = {};

/** qooxdoo v3.5 | (c) 2013 1&1 Internet AG, http://1und1.de | http://qooxdoo.org/license */
qx.$$packageData['0']={"locales":{},"resources":{},"translations":{"C":{},"en":{}}};

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
 * This class is used to define mixins (similar to mixins in Ruby).
 *
 * Mixins are collections of code and variables, which can be merged into
 * other classes. They are similar to classes but don't support inheritance.
 *
 * See the description of the {@link #define} method how a mixin is defined.
 *
 * @require(qx.lang.normalize.Array)
 */
qx.Bootstrap.define("qx.Mixin", {
  statics : {
    /*
    ---------------------------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------------------------
    */
    /**
     * Define a new mixin.
     *
     * Example:
     * <pre class='javascript'>
     * qx.Mixin.define("name",
     * {
     *   include: [SuperMixins],
     *
     *   properties: {
     *     tabIndex: {type: "number", init: -1}
     *   },
     *
     *   members:
     *   {
     *     prop1: "foo",
     *     meth1: function() {},
     *     meth2: function() {}
     *   }
     * });
     * </pre>
     *
     * @param name {String} name of the mixin
     * @param config {Map ? null} Mixin definition structure. The configuration map has the following keys:
     *   <table>
     *     <tr><th>Name</th><th>Type</th><th>Description</th></tr>
     *     <tr><th>construct</th><td>Function</td><td>An optional mixin constructor. It is called on instantiation each
     *         class including this mixin. The constructor takes no parameters.</td></tr>
     *     <tr><th>destruct</th><td>Function</td><td>An optional mixin destructor.</td></tr>
     *     <tr><th>include</th><td>Mixin[]</td><td>Array of mixins, which will be merged into the mixin.</td></tr>
     *     <tr><th>statics</th><td>Map</td><td>
     *         Map of statics of the mixin. The statics will not get copied into the target class. They remain
     *         accessible from the mixin. This is the same behaviour as statics in interfaces ({@link qx.Interface#define}).
     *     </td></tr>
     *     <tr><th>members</th><td>Map</td><td>Map of members of the mixin.</td></tr>
     *     <tr><th>properties</th><td>Map</td><td>Map of property definitions. For a description of the format of a property definition see
     *           {@link qx.core.Property}.</td></tr>
     *     <tr><th>events</th><td>Map</td><td>
     *         Map of events the mixin fires. The keys are the names of the events and the values are
     *         corresponding event type classes.
     *     </td></tr>
     *   </table>
     *
     * @return {qx.Mixin} The configured mixin
     */
    define : function(name, config){

      if(config){

        // Normalize include
        if(config.include && !(qx.Bootstrap.getClass(config.include) === "Array")){

          config.include = [config.include];
        };
        {
        };
        // Create Interface from statics
        var mixin = config.statics ? config.statics : {
        };
        qx.Bootstrap.setDisplayNames(mixin, name);
        for(var key in mixin){

          if(mixin[key] instanceof Function){

            mixin[key].$$mixin = mixin;
          };
        };
        // Attach configuration
        if(config.construct){

          mixin.$$constructor = config.construct;
          qx.Bootstrap.setDisplayName(config.construct, name, "constructor");
        };
        if(config.include){

          mixin.$$includes = config.include;
        };
        if(config.properties){

          mixin.$$properties = config.properties;
        };
        if(config.members){

          mixin.$$members = config.members;
          qx.Bootstrap.setDisplayNames(config.members, name + ".prototype");
        };
        for(var key in mixin.$$members){

          if(mixin.$$members[key] instanceof Function){

            mixin.$$members[key].$$mixin = mixin;
          };
        };
        if(config.events){

          mixin.$$events = config.events;
        };
        if(config.destruct){

          mixin.$$destructor = config.destruct;
          qx.Bootstrap.setDisplayName(config.destruct, name, "destruct");
        };
      } else {

        var mixin = {
        };
      };
      // Add basics
      mixin.$$type = "Mixin";
      mixin.name = name;
      // Attach toString
      mixin.toString = this.genericToString;
      // Assign to namespace
      mixin.basename = qx.Bootstrap.createNamespace(name, mixin);
      // Store class reference in global mixin registry
      this.$$registry[name] = mixin;
      // Return final mixin
      return mixin;
    },
    /**
     * Check compatibility between mixins (including their includes)
     *
     * @param mixins {Mixin[]} an array of mixins
     * @throws {Error} when there is a conflict between the mixins
     * @return {Boolean} <code>true</code> if the mixin passed the compatibilty check
     */
    checkCompatibility : function(mixins){

      var list = this.flatten(mixins);
      var len = list.length;
      if(len < 2){

        return true;
      };
      var properties = {
      };
      var members = {
      };
      var events = {
      };
      var mixin;
      for(var i = 0;i < len;i++){

        mixin = list[i];
        for(var key in mixin.events){

          if(events[key]){

            throw new Error('Conflict between mixin "' + mixin.name + '" and "' + events[key] + '" in member "' + key + '"!');
          };
          events[key] = mixin.name;
        };
        for(var key in mixin.properties){

          if(properties[key]){

            throw new Error('Conflict between mixin "' + mixin.name + '" and "' + properties[key] + '" in property "' + key + '"!');
          };
          properties[key] = mixin.name;
        };
        for(var key in mixin.members){

          if(members[key]){

            throw new Error('Conflict between mixin "' + mixin.name + '" and "' + members[key] + '" in member "' + key + '"!');
          };
          members[key] = mixin.name;
        };
      };
      return true;
    },
    /**
     * Checks if a class is compatible to the given mixin (no conflicts)
     *
     * @param mixin {Mixin} mixin to check
     * @param clazz {Class} class to check
     * @throws {Error} when the given mixin is incompatible to the class
     * @return {Boolean} true if the mixin is compatible to the given class
     */
    isCompatible : function(mixin, clazz){

      var list = qx.util.OOUtil.getMixins(clazz);
      list.push(mixin);
      return qx.Mixin.checkCompatibility(list);
    },
    /**
     * Returns a mixin by name
     *
     * @param name {String} class name to resolve
     * @return {Class} the class
     */
    getByName : function(name){

      return this.$$registry[name];
    },
    /**
     * Determine if mixin exists
     *
     * @param name {String} mixin name to check
     * @return {Boolean} true if mixin exists
     */
    isDefined : function(name){

      return this.getByName(name) !== undefined;
    },
    /**
     * Determine the number of mixins which are defined
     *
     * @return {Number} the number of mixins
     */
    getTotalNumber : function(){

      return qx.Bootstrap.objectGetLength(this.$$registry);
    },
    /**
     * Generates a list of all mixins given plus all the
     * mixins these includes plus... (deep)
     *
     * @param mixins {Mixin[] ? []} List of mixins
     * @return {Array} List of all mixins
     */
    flatten : function(mixins){

      if(!mixins){

        return [];
      };
      // we need to create a copy and not to modify the existing array
      var list = mixins.concat();
      for(var i = 0,l = mixins.length;i < l;i++){

        if(mixins[i].$$includes){

          list.push.apply(list, this.flatten(mixins[i].$$includes));
        };
      };
      return list;
    },
    /*
    ---------------------------------------------------------------------------
       PRIVATE/INTERNAL API
    ---------------------------------------------------------------------------
    */
    /**
     * This method will be attached to all mixins to return
     * a nice identifier for them.
     *
     * @internal
     * @return {String} The mixin identifier
     */
    genericToString : function(){

      return "[Mixin " + this.name + "]";
    },
    /** Registers all defined mixins */
    $$registry : {
    },
    /** @type {Map} allowed keys in mixin definition */
    __allowedKeys : null,
    /**
     * Validates incoming configuration and checks keys and values
     *
     * @signature function(name, config)
     * @param name {String} The name of the class
     * @param config {Map} Configuration map
     */
    __validateConfig : function(name, config){
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Andreas Ecker (ecker)

************************************************************************ */
/**
 * Basis for Aspect Oriented features in qooxdoo.
 *
 * This class makes it possible to attach functions (aspects) before or
 * after each function call of any function defined in {@link qx.Class#define}.
 *
 * Classes, which define own aspects must add an explicit require to this class
 * in the header comment using the following code:
 *
 * <pre>
 * &#35;require(qx.core.Aspect)
 * &#35;ignore(auto-require)
 * </pre>
 *
 * One example for a qooxdoo aspect is profiling ({@link qx.dev.Profile}).
 */
qx.Bootstrap.define("qx.core.Aspect", {
  statics : {
    /** @type {Array} Registry for all known aspect wishes */
    __registry : [],
    /**
     * This function is used by {@link qx.Class#define} to wrap all statics, members and
     * constructors.
     *
     * @param fullName {String} Full name of the function including the class name.
     * @param fcn {Function} function to wrap.
     * @param type {String} Type of the wrapped function. One of "member", "static",
     *          "constructor", "destructor" or "property".
     *
     * @return {Function} wrapped function
     */
    wrap : function(fullName, fcn, type){

      var before = [];
      var after = [];
      var reg = this.__registry;
      var entry;
      for(var i = 0;i < reg.length;i++){

        entry = reg[i];
        if((entry.type == null || type == entry.type || entry.type == "*") && (entry.name == null || fullName.match(entry.name))){

          entry.pos == -1 ? before.push(entry.fcn) : after.push(entry.fcn);
        };
      };
      if(before.length === 0 && after.length === 0){

        return fcn;
      };
      var wrapper = function(){

        for(var i = 0;i < before.length;i++){

          before[i].call(this, fullName, fcn, type, arguments);
        };
        var ret = fcn.apply(this, arguments);
        for(var i = 0;i < after.length;i++){

          after[i].call(this, fullName, fcn, type, arguments, ret);
        };
        return ret;
      };
      if(type !== "static"){

        wrapper.self = fcn.self;
        wrapper.base = fcn.base;
      };
      fcn.wrapper = wrapper;
      wrapper.original = fcn;
      return wrapper;
    },
    /**
     * Register a function to be called just before or after each time
     * one of the selected functions is called.
     *
     * @param fcn {Function} Function to be called just before or after any of the
     *     selected functions is called. If position is "before" the functions
     *     supports the same signature as {@link qx.dev.Profile#profileBefore}. If
     *     position is "after" it supports the same signature as
     *     {@link qx.dev.Profile#profileAfter}.
     * @param position {String?"after"} One of "before" or "after". Whether the function
     *     should be called before or after the wrapped function.
     * @param type {String?null} Type of the wrapped function. One of "member",
     *     "static", "constructor", "destructor", "property" or "*". <code>null</code>
     *     is handled identical to "*".
     * @param name {String|RegExp?null} Each function, with a full name matching
     *     this pattern (using <code>fullName.match(name)</code>) will be
     *     wrapped.
     */
    addAdvice : function(fcn, position, type, name){

      this.__registry.push({
        fcn : fcn,
        pos : position === "before" ? -1 : 1,
        type : type,
        name : name
      });
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
 * This class is used to define interfaces (similar to Java interfaces).
 *
 * See the description of the {@link #define} method how an interface is
 * defined.
 *
 * @require(qx.lang.normalize.Array)
 */
qx.Bootstrap.define("qx.Interface", {
  statics : {
    /*
    ---------------------------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------------------------
    */
    /**
     * Define a new interface. Interface definitions look much like class definitions.
     *
     * The main difference is that the bodies of functions defined in <code>members</code>
     * and <code>statics</code> are called before the original function with the
     * same arguments. This can be used to check the passed arguments. If the
     * checks fail, an exception should be thrown. It is convenient to use the
     * method defined in {@link qx.core.MAssert} to check the arguments.
     *
     * In the <code>build</code> version the checks are omitted.
     *
     * For properties only the names are required so the value of the properties
     * can be empty maps.
     *
     * Example:
     * <pre class='javascript'>
     * qx.Interface.define("name",
     * {
     *   extend: [SuperInterfaces],
     *
     *   statics:
     *   {
     *     PI : 3.14
     *   },
     *
     *   properties: {"color": {}, "name": {} },
     *
     *   members:
     *   {
     *     meth1: function() {},
     *     meth2: function(a, b) { this.assertArgumentsCount(arguments, 2, 2); },
     *     meth3: function(c) { this.assertInterface(c.constructor, qx.some.Interface); }
     *   },
     *
     *   events :
     *   {
     *     keydown : "qx.event.type.KeySequence"
     *   }
     * });
     * </pre>
     *
     * @param name {String} name of the interface
     * @param config {Map ? null} Interface definition structure. The configuration map has the following keys:
     *   <table>
     *     <tr><th>Name</th><th>Type</th><th>Description</th></tr>
     *     <tr><th>extend</th><td>Interface |<br>Interface[]</td><td>Single interface or array of interfaces this interface inherits from.</td></tr>
     *     <tr><th>members</th><td>Map</td><td>Map of members of the interface.</td></tr>
     *     <tr><th>statics</th><td>Map</td><td>
     *         Map of statics of the interface. The statics will not get copied into the target class.
     *         This is the same behaviour as statics in mixins ({@link qx.Mixin#define}).
     *     </td></tr>
     *     <tr><th>properties</th><td>Map</td><td>Map of properties and their definitions.</td></tr>
     *     <tr><th>events</th><td>Map</td><td>Map of event names and the corresponding event class name.</td></tr>
     *   </table>
     *
     * @return {qx.Interface} The configured interface
     */
    define : function(name, config){

      if(config){

        // Normalize include
        if(config.extend && !(qx.Bootstrap.getClass(config.extend) === "Array")){

          config.extend = [config.extend];
        };
        {
        };
        // Create interface from statics
        var iface = config.statics ? config.statics : {
        };
        // Attach configuration
        if(config.extend){

          iface.$$extends = config.extend;
        };
        if(config.properties){

          iface.$$properties = config.properties;
        };
        if(config.members){

          iface.$$members = config.members;
        };
        if(config.events){

          iface.$$events = config.events;
        };
      } else {

        // Create empty interface
        var iface = {
        };
      };
      // Add Basics
      iface.$$type = "Interface";
      iface.name = name;
      // Attach toString
      iface.toString = this.genericToString;
      // Assign to namespace
      iface.basename = qx.Bootstrap.createNamespace(name, iface);
      // Add to registry
      qx.Interface.$$registry[name] = iface;
      // Return final interface
      return iface;
    },
    /**
     * Returns an interface by name
     *
     * @param name {String} class name to resolve
     * @return {Class} the class
     */
    getByName : function(name){

      return this.$$registry[name];
    },
    /**
     * Determine if interface exists
     *
     * @param name {String} Interface name to check
     * @return {Boolean} true if interface exists
     */
    isDefined : function(name){

      return this.getByName(name) !== undefined;
    },
    /**
     * Determine the number of interfaces which are defined
     *
     * @return {Number} the number of interfaces
     */
    getTotalNumber : function(){

      return qx.Bootstrap.objectGetLength(this.$$registry);
    },
    /**
     * Generates a list of all interfaces including their super interfaces
     * (resolved recursively)
     *
     * @param ifaces {Interface[] ? []} List of interfaces to be resolved
     * @return {Array} List of all interfaces
     */
    flatten : function(ifaces){

      if(!ifaces){

        return [];
      };
      // we need to create a copy and not to modify the existing array
      var list = ifaces.concat();
      for(var i = 0,l = ifaces.length;i < l;i++){

        if(ifaces[i].$$extends){

          list.push.apply(list, this.flatten(ifaces[i].$$extends));
        };
      };
      return list;
    },
    /**
     * Assert members
     *
     * @param object {qx.core.Object} The object, which contains the methods
     * @param clazz {Class} class of the object
     * @param iface {Interface} the interface to verify
     * @param wrap {Boolean ? false} wrap functions required by interface to
     *     check parameters etc.
     * @param shouldThrow {Boolean} if <code>false</code>, the method
     *   will return a boolean instead of throwing an exception
     * @return {Boolean} <code>true</code> if all members are supported
     */
    __checkMembers : function(object, clazz, iface, wrap, shouldThrow){

      // Validate members
      var members = iface.$$members;
      if(members){

        for(var key in members){

          if(qx.Bootstrap.isFunction(members[key])){

            var isPropertyMethod = this.__isPropertyMethod(clazz, key);
            var hasMemberFunction = isPropertyMethod || qx.Bootstrap.isFunction(object[key]);
            if(!hasMemberFunction){

              if(shouldThrow){

                throw new Error('Implementation of method "' + key + '" is missing in class "' + clazz.classname + '" required by interface "' + iface.name + '"');
              } else {

                return false;
              };
            };
            // Only wrap members if the interface was not been applied yet. This
            // can easily be checked by the recursive hasInterface method.
            var shouldWrapFunction = wrap === true && !isPropertyMethod && !qx.util.OOUtil.hasInterface(clazz, iface);
            if(shouldWrapFunction){

              object[key] = this.__wrapInterfaceMember(iface, object[key], key, members[key]);
            };
          } else {

            // Other members are not checked more detailed because of
            // JavaScript's loose type handling
            if(typeof object[key] === undefined){

              if(typeof object[key] !== "function"){

                if(shouldThrow){

                  throw new Error('Implementation of member "' + key + '" is missing in class "' + clazz.classname + '" required by interface "' + iface.name + '"');
                } else {

                  return false;
                };
              };
            };
          };
        };
      };
      if(!shouldThrow){

        return true;
      };
    },
    /**
     * Internal helper to detect if the method will be generated by the
     * property system.
     *
     * @param clazz {Class} The current class.
     * @param methodName {String} The name of the method.
     *
     * @return {Boolean} true, if the method will be generated by the property
     *   system.
     */
    __isPropertyMethod : function(clazz, methodName){

      var match = methodName.match(/^(is|toggle|get|set|reset)(.*)$/);
      if(!match){

        return false;
      };
      var propertyName = qx.Bootstrap.firstLow(match[2]);
      var isPropertyMethod = qx.util.OOUtil.getPropertyDefinition(clazz, propertyName);
      if(!isPropertyMethod){

        return false;
      };
      var isBoolean = match[0] == "is" || match[0] == "toggle";
      if(isBoolean){

        return qx.util.OOUtil.getPropertyDefinition(clazz, propertyName).check == "Boolean";
      };
      return true;
    },
    /**
     * Assert properties
     *
     * @param clazz {Class} class to check interface for
     * @param iface {Interface} the interface to verify
     * @param shouldThrow {Boolean} if <code>false</code>, the method
     *   will return a boolean instead of throwing an exception
     * @return {Boolean} <code>true</code> if all properties are supported
     */
    __checkProperties : function(clazz, iface, shouldThrow){

      if(iface.$$properties){

        for(var key in iface.$$properties){

          if(!qx.util.OOUtil.getPropertyDefinition(clazz, key)){

            if(shouldThrow){

              throw new Error('The property "' + key + '" is not supported by Class "' + clazz.classname + '"!');
            } else {

              return false;
            };
          };
        };
      };
      if(!shouldThrow){

        return true;
      };
    },
    /**
     * Assert events
     *
     * @param clazz {Class} class to check interface for
     * @param iface {Interface} the interface to verify
     * @param shouldThrow {Boolean} if <code>false</code>, the method
     *   will return a boolean instead of throwing an exception
     * @return {Boolean} <code>true</code> if all events are supported
     */
    __checkEvents : function(clazz, iface, shouldThrow){

      if(iface.$$events){

        for(var key in iface.$$events){

          if(!qx.util.OOUtil.supportsEvent(clazz, key)){

            if(shouldThrow){

              throw new Error('The event "' + key + '" is not supported by Class "' + clazz.classname + '"!');
            } else {

              return false;
            };
          };
        };
      };
      if(!shouldThrow){

        return true;
      };
    },
    /**
     * Asserts that the given object implements all the methods defined in the
     * interface. This method throws an exception if the object does not
     * implement the interface.
     *
     *  @param object {qx.core.Object} Object to check interface for
     *  @param iface {Interface} The interface to verify
     */
    assertObject : function(object, iface){

      var clazz = object.constructor;
      this.__checkMembers(object, clazz, iface, false, true);
      this.__checkProperties(clazz, iface, true);
      this.__checkEvents(clazz, iface, true);
      // Validate extends, recursive
      var extend = iface.$$extends;
      if(extend){

        for(var i = 0,l = extend.length;i < l;i++){

          this.assertObject(object, extend[i]);
        };
      };
    },
    /**
     * Checks if an interface is implemented by a class
     *
     * @param clazz {Class} class to check interface for
     * @param iface {Interface} the interface to verify
     * @param wrap {Boolean ? false} wrap functions required by interface to
     *     check parameters etc.
     */
    assert : function(clazz, iface, wrap){

      this.__checkMembers(clazz.prototype, clazz, iface, wrap, true);
      this.__checkProperties(clazz, iface, true);
      this.__checkEvents(clazz, iface, true);
      // Validate extends, recursive
      var extend = iface.$$extends;
      if(extend){

        for(var i = 0,l = extend.length;i < l;i++){

          this.assert(clazz, extend[i], wrap);
        };
      };
    },
    /**
     * Asserts that the given object implements all the methods defined in the
     * interface.
     *
     *  @param object {qx.core.Object} Object to check interface for
     *  @param iface {Interface} The interface to verify
     * @return {Boolean} <code>true</code> if the objects implements the interface
     */
    objectImplements : function(object, iface){

      var clazz = object.constructor;
      if(!this.__checkMembers(object, clazz, iface) || !this.__checkProperties(clazz, iface) || !this.__checkEvents(clazz, iface)){

        return false;
      };
      // Validate extends, recursive
      var extend = iface.$$extends;
      if(extend){

        for(var i = 0,l = extend.length;i < l;i++){

          if(!this.objectImplements(object, extend[i])){

            return false;
          };
        };
      };
      return true;
    },
    /**
     * Tests whether an interface is implemented by a class, without throwing an
     * exception when it doesn't.
     *
     * @param clazz {Class} class to check interface for
     * @param iface {Interface} the interface to verify
     * @return {Boolean} <code>true</code> if interface is implemented
     */
    classImplements : function(clazz, iface){

      if(!this.__checkMembers(clazz.prototype, clazz, iface) || !this.__checkProperties(clazz, iface) || !this.__checkEvents(clazz, iface)){

        return false;
      };
      // Validate extends, recursive
      var extend = iface.$$extends;
      if(extend){

        for(var i = 0,l = extend.length;i < l;i++){

          if(!this.has(clazz, extend[i])){

            return false;
          };
        };
      };
      return true;
    },
    /*
    ---------------------------------------------------------------------------
       PRIVATE/INTERNAL API
    ---------------------------------------------------------------------------
    */
    /**
     * This method will be attached to all interface to return
     * a nice identifier for them.
     *
     * @internal
     * @return {String} The interface identifier
     */
    genericToString : function(){

      return "[Interface " + this.name + "]";
    },
    /** Registry of all defined interfaces */
    $$registry : {
    },
    /**
     * Wrap a method with a precondition check.
     *
     * @signature function(iface, origFunction, functionName, preCondition)
     * @param iface {String} Name of the interface, where the pre condition
     *   was defined. (Used in error messages).
     * @param origFunction {Function} function to wrap.
     * @param functionName {String} name of the function. (Used in error messages).
     * @param preCondition {Function}. This function gets called with the arguments of the
     *   original function. If this function return true the original function is called.
     *   Otherwise an exception is thrown.
     * @return {Function} wrapped function
     */
    __wrapInterfaceMember : function(iface, origFunction, functionName, preCondition){
    },
    /** @type {Map} allowed keys in interface definition */
    __allowedKeys : null,
    /**
     * Validates incoming configuration and checks keys and values
     *
     * @signature function(name, config)
     * @param name {String} The name of the class
     * @param config {Map} Configuration map
     */
    __validateConfig : function(name, config){
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

************************************************************************ */
/**
 * Internal class for handling of dynamic properties. Should only be used
 * through the methods provided by {@link qx.Class}.
 *
 * For a complete documentation of properties take a look at
 * http://manual.qooxdoo.org/${qxversion}/pages/core.html#properties.
 *
 *
 * *Normal properties*
 *
 * The <code>properties</code> key in the class definition map of {@link qx.Class#define}
 * is used to generate the properties.
 *
 * Valid keys of a property definition are:
 *
 * <table>
 *   <tr><th>Name</th><th>Type</th><th>Description</th></tr>
 *   <tr><th>check</th><td>Array, String, Function</td><td>
 *     The check is used to check the type the incoming value of a property. This will only
 *     be executed in the source version. The build version will not contain the checks.
 *     The check can be:
 *     <ul>
 *       <li>a custom check function. The function takes the incoming value as a parameter and must
 *           return a boolean value to indicate whether the values is valid.
 *       </li>
 *       <li>inline check code as a string e.g. <code>"value &gt; 0 && value &lt; 100"</code></li>
 *       <li>a class name e.g. <code>qx.ui.form.Button</code></li>
 *       <li>a name of an interface the value must implement</li>
 *       <li>an array of all valid values</li>
 *       <li>one of the predefined checks: Boolean, String, Number, Integer, Float, Double,
 *           Object, Array, Map, Class, Mixin, Interface, Theme, Error, RegExp, Function,
 *           Date, Node, Element, Document, Window, Event
 *       </li>
 *     <ul>
 *   </td></tr>
 *   <tr><th>init</th><td>var</td><td>
 *     Sets the default/initial value of the property. If no property value is set or the property
 *     gets reset, the getter will return the <code>init</code> value.
 *   </td></tr>
 *   <tr><th>apply</th><td>String</td><td>
 *     On change of the property value the method of the specified name will be called. The signature of
 *     the method is <code>function(newValue, oldValue, propertyName)</code>. It is conventional to name
 *     the callback <code>_apply</code> + <i>PropertyName</i>, with the property name camel-cased (e.g.
 *     "<i>_applyFooBar</i>" for a property <i>fooBar</i>).
 *   </td></tr>
 *   <tr><th>event</th><td>String</td><td>
 *     On change of the property value an event with the given name will be dispatched. The event type is
 *     {@link qx.event.type.Data}.
 *   </td></tr>
 *   <tr><th>themeable</th><td>Boolean</td><td>
 *     Whether this property can be set using themes.
 *   </td></tr>
 *   <tr><th>inheritable</th><td>Boolean</td><td>
 *     Whether the property value should be inheritable. If the property does not have an user defined or an
 *     init value, the property will try to get the value from the parent of the current object.
 *   </td></tr>
 *   <tr><th>nullable</th><td>Boolean</td><td>
 *     Whether <code>null</code> is an allowed value of the property. This is complementary to the check
 *     defined using the <code>check</code> key.
 *   </td></tr>
 *   <tr><th>refine</th><td>Boolean</td><td>
 *     Whether the property definition is a refinement of a property in one of the super classes of the class.
 *     Only the <code>init</code> value can be changed using refine.
 *   </td></tr>
 *   <tr><th>transform</th><td>String</td><td>
 *     On setting of the property value the method of the specified name will
 *     be called. The signature of the method is <code>function(value)</code>.
 *     The parameter <code>value</code> is the value passed to the setter.
 *     The function must return the modified or unmodified value.
 *     Transformation occurs before the check function, so both may be
 *     specified if desired.  Alternatively, the transform function may throw
 *     an error if the value passed to it is invalid.
 *   </td></tr>
 *   <tr><th>validate</th><td>Function, String</td><td>
 *     On setting of the property value the method of the specified name will
 *     be called. The signature of the method is <code>function(value)</code>.
 *     The parameter <code>value</code> is the value passed to the setter.
 *     If the validation fails, an <code>qx.core.ValidationError</code> should
 *     be thrown by the validation function. Otherwise, just do nothing in the
 *     function.<br>
 *     If a string is given, the string should hold a reference to a member
 *     method.<br>
 *     <code>"<i>methodname</i>"</code> for example
 *     <code>"__validateProperty"</code><br>
 *     There are some default validators in the {@link qx.util.Validate} class.
 *     See this documentation for usage examples.
 *   </td></tr>
 *   <tr><th>dereference</th><td>Boolean</td><td>
 *     By default, the references to the values (current, init, ...) of the
 *     property will be stored as references on the object. When disposing
 *     this object, the references will not be deleted. Setting the
 *     dereference key to true tells the property system to delete all
 *     connections made by this property on dispose. This can be necessary for
 *     disconnecting DOM objects to allow the garbage collector to work
 *     properly.
 *   </td></tr>
 *   <tr><th>deferredInit</th><td>Boolean</td><td>
 *     Allow for a deferred initialization for reference types. Defaults to false.
 *   </td></tr>
 * </table>
 *
 * *Property groups*
 *
 * Property groups are defined in a similar way but support a different set of keys:
 *
 * <table>
 *   <tr><th>Name</th><th>Type</th><th>Description</th></tr>
 *   <tr><th>group</th><td>String[]</td><td>
 *     A list of property names which should be set using the property group.
 *   </td></tr>
 *   <tr><th>mode</th><td>String</td><td>
 *     If mode is set to <code>"shorthand"</code>, the properties can be set using a CSS like shorthand mode.
 *   </td></tr>
 *   <tr><th>themeable</th><td>Boolean</td><td>
 *     Whether this property can be set using themes.
 *   </td></tr>
 * </table>
 *
 * @internal
 * @ignore(qx.Interface)
 */
qx.Bootstrap.define("qx.core.Property", {
  statics : {
    /**
     * This is a method which does nothing than gethering dependencies for the
     * module system. Calling this method is useless because it does nothing.
     */
    __gatherDependency : function(){

      if(qx.core.Environment.get("module.events")){

        qx.event.type.Data;
        qx.event.dispatch.Direct;
      };
    },
    /**
     * Built-in checks
     * The keys could be used in the check of the properties
     */
    __checks : {
      "Boolean" : 'qx.core.Assert.assertBoolean(value, msg) || true',
      "String" : 'qx.core.Assert.assertString(value, msg) || true',
      "Number" : 'qx.core.Assert.assertNumber(value, msg) || true',
      "Integer" : 'qx.core.Assert.assertInteger(value, msg) || true',
      "PositiveNumber" : 'qx.core.Assert.assertPositiveNumber(value, msg) || true',
      "PositiveInteger" : 'qx.core.Assert.assertPositiveInteger(value, msg) || true',
      "Error" : 'qx.core.Assert.assertInstance(value, Error, msg) || true',
      "RegExp" : 'qx.core.Assert.assertInstance(value, RegExp, msg) || true',
      "Object" : 'qx.core.Assert.assertObject(value, msg) || true',
      "Array" : 'qx.core.Assert.assertArray(value, msg) || true',
      "Map" : 'qx.core.Assert.assertMap(value, msg) || true',
      "Function" : 'qx.core.Assert.assertFunction(value, msg) || true',
      "Date" : 'qx.core.Assert.assertInstance(value, Date, msg) || true',
      "Node" : 'value !== null && value.nodeType !== undefined',
      "Element" : 'value !== null && value.nodeType === 1 && value.attributes',
      "Document" : 'value !== null && value.nodeType === 9 && value.documentElement',
      "Window" : 'value !== null && value.document',
      "Event" : 'value !== null && value.type !== undefined',
      "Class" : 'value !== null && value.$$type === "Class"',
      "Mixin" : 'value !== null && value.$$type === "Mixin"',
      "Interface" : 'value !== null && value.$$type === "Interface"',
      "Theme" : 'value !== null && value.$$type === "Theme"',
      "Color" : 'qx.lang.Type.isString(value) && qx.util.ColorUtil.isValidPropertyValue(value)',
      "Decorator" : 'value !== null && qx.theme.manager.Decoration.getInstance().isValidPropertyValue(value)',
      "Font" : 'value !== null && qx.theme.manager.Font.getInstance().isDynamic(value)'
    },
    /**
     * Contains types from {@link #__checks} list which need to be dereferenced
     */
    __dereference : {
      "Node" : true,
      "Element" : true,
      "Document" : true,
      "Window" : true,
      "Event" : true
    },
    /**
     * Inherit value, used to override defaults etc. to force inheritance
     * even if property value is not undefined (through multi-values)
     *
     * @internal
     */
    $$inherit : "inherit",
    /**
     * Caching field names for each property created
     *
     * @internal
     */
    $$store : {
      runtime : {
      },
      user : {
      },
      theme : {
      },
      inherit : {
      },
      init : {
      },
      useinit : {
      }
    },
    /**
     * Caching function names for each property created
     *
     * @internal
     */
    $$method : {
      get : {
      },
      set : {
      },
      reset : {
      },
      init : {
      },
      refresh : {
      },
      setRuntime : {
      },
      resetRuntime : {
      },
      setThemed : {
      },
      resetThemed : {
      }
    },
    /**
     * Supported keys for property defintions
     *
     * @internal
     */
    $$allowedKeys : {
      name : "string",
      // String
      dereference : "boolean",
      // Boolean
      inheritable : "boolean",
      // Boolean
      nullable : "boolean",
      // Boolean
      themeable : "boolean",
      // Boolean
      refine : "boolean",
      // Boolean
      init : null,
      // var
      apply : "string",
      // String
      event : "string",
      // String
      check : null,
      // Array, String, Function
      transform : "string",
      // String
      deferredInit : "boolean",
      // Boolean
      validate : null
    },
    /**
     * Supported keys for property group definitions
     *
     * @internal
     */
    $$allowedGroupKeys : {
      name : "string",
      // String
      group : "object",
      // Array
      mode : "string",
      // String
      themeable : "boolean"
    },
    /** Contains names of inheritable properties, filled by {@link qx.Class.define} */
    $$inheritable : {
    },
    /**
     * Generate optimized refresh method and  attach it to the class' prototype
     *
     * @param clazz {Class} clazz to which the refresher should be added
     */
    __executeOptimizedRefresh : function(clazz){

      var inheritables = this.__getInheritablesOfClass(clazz);
      if(!inheritables.length){

        var refresher = function(){
        };
      } else {

        refresher = this.__createRefresher(inheritables);
      };
      clazz.prototype.$$refreshInheritables = refresher;
    },
    /**
     * Get the names of all inheritable properties of the given class
     *
     * @param clazz {Class} class to get the inheritable properties of
     * @return {String[]} List of property names
     */
    __getInheritablesOfClass : function(clazz){

      var inheritable = [];
      while(clazz){

        var properties = clazz.$$properties;
        if(properties){

          for(var name in this.$$inheritable){

            // Whether the property is available in this class
            // and whether it is inheritable in this class as well
            if(properties[name] && properties[name].inheritable){

              inheritable.push(name);
            };
          };
        };
        clazz = clazz.superclass;
      };
      return inheritable;
    },
    /**
     * Assemble the refresher code and return the generated function
     *
     * @param inheritables {String[]} list of inheritable properties
     * @return {Function} refresher function
     */
    __createRefresher : function(inheritables){

      var inherit = this.$$store.inherit;
      var init = this.$$store.init;
      var refresh = this.$$method.refresh;
      var code = ["var parent = this.getLayoutParent();", "if (!parent) return;"];
      for(var i = 0,l = inheritables.length;i < l;i++){

        var name = inheritables[i];
        code.push("var value = parent.", inherit[name], ";", "if (value===undefined) value = parent.", init[name], ";", "this.", refresh[name], "(value);");
      };
      return new Function(code.join(""));
    },
    /**
     * Attach $$refreshInheritables method stub to the given class
     *
     * @param clazz {Class} clazz to which the refresher should be added
     */
    attachRefreshInheritables : function(clazz){

      clazz.prototype.$$refreshInheritables = function(){

        qx.core.Property.__executeOptimizedRefresh(clazz);
        return this.$$refreshInheritables();
      };
    },
    /**
     * Attach one property to class
     *
     * @param clazz {Class} Class to attach properties to
     * @param name {String} Name of property
     * @param config {Map} Configuration map of property
     */
    attachMethods : function(clazz, name, config){

      // Divide groups from "normal" properties
      config.group ? this.__attachGroupMethods(clazz, config, name) : this.__attachPropertyMethods(clazz, config, name);
    },
    /**
     * Attach group methods
     *
     * @param clazz {Class} Class to attach properties to
     * @param config {Map} Property configuration
     * @param name {String} Name of the property
     */
    __attachGroupMethods : function(clazz, config, name){

      var upname = qx.Bootstrap.firstUp(name);
      var members = clazz.prototype;
      var themeable = config.themeable === true;
      {
      };
      var setter = [];
      var resetter = [];
      if(themeable){

        var styler = [];
        var unstyler = [];
      };
      var argHandler = "var a=arguments[0] instanceof Array?arguments[0]:arguments;";
      setter.push(argHandler);
      if(themeable){

        styler.push(argHandler);
      };
      if(config.mode == "shorthand"){

        var shorthand = "a=qx.lang.Array.fromShortHand(qx.lang.Array.fromArguments(a));";
        setter.push(shorthand);
        if(themeable){

          styler.push(shorthand);
        };
      };
      for(var i = 0,a = config.group,l = a.length;i < l;i++){

        {
        };
        setter.push("this.", this.$$method.set[a[i]], "(a[", i, "]);");
        resetter.push("this.", this.$$method.reset[a[i]], "();");
        if(themeable){

          {
          };
          styler.push("this.", this.$$method.setThemed[a[i]], "(a[", i, "]);");
          unstyler.push("this.", this.$$method.resetThemed[a[i]], "();");
        };
      };
      // Attach setter
      this.$$method.set[name] = "set" + upname;
      members[this.$$method.set[name]] = new Function(setter.join(""));
      // Attach resetter
      this.$$method.reset[name] = "reset" + upname;
      members[this.$$method.reset[name]] = new Function(resetter.join(""));
      if(themeable){

        // Attach styler
        this.$$method.setThemed[name] = "setThemed" + upname;
        members[this.$$method.setThemed[name]] = new Function(styler.join(""));
        // Attach unstyler
        this.$$method.resetThemed[name] = "resetThemed" + upname;
        members[this.$$method.resetThemed[name]] = new Function(unstyler.join(""));
      };
    },
    /**
     * Attach property methods
     *
     * @param clazz {Class} Class to attach properties to
     * @param config {Map} Property configuration
     * @param name {String} Name of the property
     */
    __attachPropertyMethods : function(clazz, config, name){

      var upname = qx.Bootstrap.firstUp(name);
      var members = clazz.prototype;
      {
      };
      // Fill dispose value
      if(config.dereference === undefined && typeof config.check === "string"){

        config.dereference = this.__shouldBeDereferenced(config.check);
      };
      var method = this.$$method;
      var store = this.$$store;
      store.runtime[name] = "$$runtime_" + name;
      store.user[name] = "$$user_" + name;
      store.theme[name] = "$$theme_" + name;
      store.init[name] = "$$init_" + name;
      store.inherit[name] = "$$inherit_" + name;
      store.useinit[name] = "$$useinit_" + name;
      method.get[name] = "get" + upname;
      members[method.get[name]] = function(){

        return qx.core.Property.executeOptimizedGetter(this, clazz, name, "get");
      };
      method.set[name] = "set" + upname;
      members[method.set[name]] = function(value){

        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "set", arguments);
      };
      method.reset[name] = "reset" + upname;
      members[method.reset[name]] = function(){

        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "reset");
      };
      if(config.inheritable || config.apply || config.event || config.deferredInit){

        method.init[name] = "init" + upname;
        members[method.init[name]] = function(value){

          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "init", arguments);
        };
        {
        };
      };
      if(config.inheritable){

        method.refresh[name] = "refresh" + upname;
        members[method.refresh[name]] = function(value){

          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "refresh", arguments);
        };
        {
        };
      };
      method.setRuntime[name] = "setRuntime" + upname;
      members[method.setRuntime[name]] = function(value){

        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "setRuntime", arguments);
      };
      method.resetRuntime[name] = "resetRuntime" + upname;
      members[method.resetRuntime[name]] = function(){

        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "resetRuntime");
      };
      if(config.themeable){

        method.setThemed[name] = "setThemed" + upname;
        members[method.setThemed[name]] = function(value){

          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "setThemed", arguments);
        };
        method.resetThemed[name] = "resetThemed" + upname;
        members[method.resetThemed[name]] = function(){

          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "resetThemed");
        };
        {
        };
      };
      if(config.check === "Boolean"){

        members["toggle" + upname] = new Function("return this." + method.set[name] + "(!this." + method.get[name] + "())");
        members["is" + upname] = new Function("return this." + method.get[name] + "()");
        {
        };
      };
      {
      };
    },
    /**
     * Returns if the reference for the given property check should be removed
     * on dispose.
     *
     * @param check {var} The check of the property definition.
     * @return {Boolean} If the dereference key should be set.
     */
    __shouldBeDereferenced : function(check){

      return !!this.__dereference[check];
    },
    /** @type {Map} Internal data field for error messages used by {@link #error} */
    __errors : {
      '0' : 'Could not change or apply init value after constructing phase!',
      '1' : 'Requires exactly one argument!',
      '2' : 'Undefined value is not allowed!',
      '3' : 'Does not allow any arguments!',
      '4' : 'Null value is not allowed!',
      '5' : 'Is invalid!'
    },
    /**
     * Error method used by the property system to report errors.
     *
     * @param obj {qx.core.Object} Any qooxdoo object
     * @param id {Integer} Numeric error identifier
     * @param property {String} Name of the property
     * @param variant {String} Name of the method variant e.g. "set", "reset", ...
     * @param value {var} Incoming value
     */
    error : function(obj, id, property, variant, value){

      var classname = obj.constructor.classname;
      var msg = "Error in property " + property + " of class " + classname + " in method " + this.$$method[variant][property] + " with incoming value '" + value + "': ";
      throw new Error(msg + (this.__errors[id] || "Unknown reason: " + id));
    },
    /**
     * Compiles a string builder object to a function, executes the function and
     * returns the return value.
     *
     * @param instance {Object} Instance which have called the original method
     * @param members {Object} Prototype members map where the new function should be stored
     * @param name {String} Name of the property
     * @param variant {String} Function variant e.g. get, set, reset, ...
     * @param code {Array} Array which contains the code
     * @param args {arguments} Incoming arguments of wrapper method
     * @return {var} Return value of the generated function
     */
    __unwrapFunctionFromCode : function(instance, members, name, variant, code, args){

      var store = this.$$method[variant][name];
      {

        members[store] = new Function("value", code.join(""));
      };
      // Enable profiling code
      if(qx.core.Environment.get("qx.aspects")){

        members[store] = qx.core.Aspect.wrap(instance.classname + "." + store, members[store], "property");
      };
      qx.Bootstrap.setDisplayName(members[store], instance.classname + ".prototype", store);
      // Executing new function
      if(args === undefined){

        return instance[store]();
      } else {

        return instance[store](args[0]);
      };
    },
    /**
     * Generates the optimized getter
     * Supported variants: get
     *
     * @param instance {Object} the instance which calls the method
     * @param clazz {Class} the class which originally defined the property
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @return {var} Execute return value of apply generated function, generally the incoming value
     */
    executeOptimizedGetter : function(instance, clazz, name, variant){

      var config = clazz.$$properties[name];
      var members = clazz.prototype;
      var code = [];
      var store = this.$$store;
      code.push('if(this.', store.runtime[name], '!==undefined)');
      code.push('return this.', store.runtime[name], ';');
      if(config.inheritable){

        code.push('else if(this.', store.inherit[name], '!==undefined)');
        code.push('return this.', store.inherit[name], ';');
        code.push('else ');
      };
      code.push('if(this.', store.user[name], '!==undefined)');
      code.push('return this.', store.user[name], ';');
      if(config.themeable){

        code.push('else if(this.', store.theme[name], '!==undefined)');
        code.push('return this.', store.theme[name], ';');
      };
      if(config.deferredInit && config.init === undefined){

        code.push('else if(this.', store.init[name], '!==undefined)');
        code.push('return this.', store.init[name], ';');
      };
      code.push('else ');
      if(config.init !== undefined){

        if(config.inheritable){

          code.push('var init=this.', store.init[name], ';');
          if(config.nullable){

            code.push('if(init==qx.core.Property.$$inherit)init=null;');
          } else if(config.init !== undefined){

            code.push('return this.', store.init[name], ';');
          } else {

            code.push('if(init==qx.core.Property.$$inherit)throw new Error("Inheritable property ', name, ' of an instance of ', clazz.classname, ' is not (yet) ready!");');
          };
          code.push('return init;');
        } else {

          code.push('return this.', store.init[name], ';');
        };
      } else if(config.inheritable || config.nullable){

        code.push('return null;');
      } else {

        code.push('throw new Error("Property ', name, ' of an instance of ', clazz.classname, ' is not (yet) ready!");');
      };
      return this.__unwrapFunctionFromCode(instance, members, name, variant, code);
    },
    /**
     * Generates the optimized setter
     * Supported variants: set, reset, init, refresh, style, unstyle
     *
     * @param instance {Object} the instance which calls the method
     * @param clazz {Class} the class which originally defined the property
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @param args {arguments} Incoming arguments of wrapper method
     * @return {var} Execute return value of apply generated function, generally the incoming value
     */
    executeOptimizedSetter : function(instance, clazz, name, variant, args){

      var config = clazz.$$properties[name];
      var members = clazz.prototype;
      var code = [];
      var incomingValue = variant === "set" || variant === "setThemed" || variant === "setRuntime" || (variant === "init" && config.init === undefined);
      var hasCallback = config.apply || config.event || config.inheritable;
      var store = this.__getStore(variant, name);
      this.__emitSetterPreConditions(code, config, name, variant, incomingValue);
      if(incomingValue){

        this.__emitIncomingValueTransformation(code, clazz, config, name);
      };
      if(hasCallback){

        this.__emitOldNewComparison(code, incomingValue, store, variant);
      };
      if(config.inheritable){

        code.push('var inherit=prop.$$inherit;');
      };
      {
      };
      if(!hasCallback){

        this.__emitStoreValue(code, name, variant, incomingValue);
      } else {

        this.__emitStoreComputedAndOldValue(code, config, name, variant, incomingValue);
      };
      if(config.inheritable){

        this.__emitStoreInheritedPropertyValue(code, config, name, variant);
      } else if(hasCallback){

        this.__emitNormalizeUndefinedValues(code, config, name, variant);
      };
      if(hasCallback){

        this.__emitCallCallback(code, config, name, variant);
        // Refresh children
        // Requires the parent/children interface
        if(config.inheritable && members._getChildren){

          this.__emitRefreshChildrenValue(code, name);
        };
      };
      // Return value
      if(incomingValue){

        code.push('return value;');
      };
      return this.__unwrapFunctionFromCode(instance, members, name, variant, code, args);
    },
    /**
     * Get the object to store the value for the given variant
     *
     * @param variant {String} Method variant.
     * @param name {String} name of the property
     *
     * @return {Object} the value store
     */
    __getStore : function(variant, name){

      if(variant === "setRuntime" || variant === "resetRuntime"){

        var store = this.$$store.runtime[name];
      } else if(variant === "setThemed" || variant === "resetThemed"){

        store = this.$$store.theme[name];
      } else if(variant === "init"){

        store = this.$$store.init[name];
      } else {

        store = this.$$store.user[name];
      };;
      return store;
    },
    /**
     * Emit code to check the arguments pre-conditions
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @param incomingValue {Boolean} Whether the setter has an incoming value
     */
    __emitSetterPreConditions : function(code, config, name, variant, incomingValue){

      {

        if(!config.nullable || config.check || config.inheritable){

          code.push('var prop=qx.core.Property;');
        };
        // Undefined check
        if(variant === "set"){

          code.push('if(value===undefined)prop.error(this,2,"', name, '","', variant, '",value);');
        };
      };
    },
    /**
     * Emit code to apply the "validate" and "transform" config keys.
     *
     * @param code {String[]} String array to append the code to
     * @param clazz {Class} the class which originally defined the property
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     */
    __emitIncomingValueTransformation : function(code, clazz, config, name){

      // Call user-provided transform method, if one is provided.  Transform
      // method should either throw an error or return the new value.
      if(config.transform){

        code.push('value=this.', config.transform, '(value);');
      };
      // Call user-provided validate method, if one is provided.  Validate
      // method should either throw an error or do nothing.
      if(config.validate){

        // if it is a string
        if(typeof config.validate === "string"){

          code.push('this.', config.validate, '(value);');
        } else if(config.validate instanceof Function){

          code.push(clazz.classname, '.$$properties.', name);
          code.push('.validate.call(this, value);');
        };
      };
    },
    /**
     * Emit code, which returns if the incoming value equals the current value.
     *
     * @param code {String[]} String array to append the code to
     * @param incomingValue {Boolean} Whether the setter has an incoming value
     * @param store {Object} The data store to use for the incoming value
     * @param variant {String} Method variant.
     */
    __emitOldNewComparison : function(code, incomingValue, store, variant){

      var resetValue = (variant === "reset" || variant === "resetThemed" || variant === "resetRuntime");
      if(incomingValue){

        code.push('if(this.', store, '===value)return value;');
      } else if(resetValue){

        code.push('if(this.', store, '===undefined)return;');
      };
    },
    /**
     * Emit code, which performs validation of the incoming value according to
     * the "nullable", "check" and "inheritable" config keys.
     *
     * @signature function(code, config, clazz, name, variant)
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param clazz {Class} the class which originally defined the property
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     */
    __emitIncomingValueValidation : undefined,
    /**
     * Emit code to store the incoming value
     *
     * @param code {String[]} String array to append the code to
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @param incomingValue {Boolean} Whether the setter has an incoming value
     */
    __emitStoreValue : function(code, name, variant, incomingValue){

      if(variant === "setRuntime"){

        code.push('this.', this.$$store.runtime[name], '=value;');
      } else if(variant === "resetRuntime"){

        code.push('if(this.', this.$$store.runtime[name], '!==undefined)');
        code.push('delete this.', this.$$store.runtime[name], ';');
      } else if(variant === "set"){

        code.push('this.', this.$$store.user[name], '=value;');
      } else if(variant === "reset"){

        code.push('if(this.', this.$$store.user[name], '!==undefined)');
        code.push('delete this.', this.$$store.user[name], ';');
      } else if(variant === "setThemed"){

        code.push('this.', this.$$store.theme[name], '=value;');
      } else if(variant === "resetThemed"){

        code.push('if(this.', this.$$store.theme[name], '!==undefined)');
        code.push('delete this.', this.$$store.theme[name], ';');
      } else if(variant === "init" && incomingValue){

        code.push('this.', this.$$store.init[name], '=value;');
      };;;;;;
    },
    /**
     * Emit code to store the incoming value and compute the "old" and "computed"
     * values.
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @param incomingValue {Boolean} Whether the setter has an incoming value
     */
    __emitStoreComputedAndOldValue : function(code, config, name, variant, incomingValue){

      if(config.inheritable){

        code.push('var computed, old=this.', this.$$store.inherit[name], ';');
      } else {

        code.push('var computed, old;');
      };
      // OLD = RUNTIME VALUE
      code.push('if(this.', this.$$store.runtime[name], '!==undefined){');
      if(variant === "setRuntime"){

        // Replace it with new value
        code.push('computed=this.', this.$$store.runtime[name], '=value;');
      } else if(variant === "resetRuntime"){

        // Delete field
        code.push('delete this.', this.$$store.runtime[name], ';');
        // Complex compution of new value
        code.push('if(this.', this.$$store.user[name], '!==undefined)');
        code.push('computed=this.', this.$$store.user[name], ';');
        code.push('else if(this.', this.$$store.theme[name], '!==undefined)');
        code.push('computed=this.', this.$$store.theme[name], ';');
        code.push('else if(this.', this.$$store.init[name], '!==undefined){');
        code.push('computed=this.', this.$$store.init[name], ';');
        code.push('this.', this.$$store.useinit[name], '=true;');
        code.push('}');
      } else {

        // Use runtime value as it has higher priority
        code.push('old=computed=this.', this.$$store.runtime[name], ';');
        // Store incoming value
        if(variant === "set"){

          code.push('this.', this.$$store.user[name], '=value;');
        } else if(variant === "reset"){

          code.push('delete this.', this.$$store.user[name], ';');
        } else if(variant === "setThemed"){

          code.push('this.', this.$$store.theme[name], '=value;');
        } else if(variant === "resetThemed"){

          code.push('delete this.', this.$$store.theme[name], ';');
        } else if(variant === "init" && incomingValue){

          code.push('this.', this.$$store.init[name], '=value;');
        };;;;
      };
      code.push('}');
      // OLD = USER VALUE
      code.push('else if(this.', this.$$store.user[name], '!==undefined){');
      if(variant === "set"){

        if(!config.inheritable){

          // Remember old value
          code.push('old=this.', this.$$store.user[name], ';');
        };
        // Replace it with new value
        code.push('computed=this.', this.$$store.user[name], '=value;');
      } else if(variant === "reset"){

        if(!config.inheritable){

          // Remember old value
          code.push('old=this.', this.$$store.user[name], ';');
        };
        // Delete field
        code.push('delete this.', this.$$store.user[name], ';');
        // Complex compution of new value
        code.push('if(this.', this.$$store.runtime[name], '!==undefined)');
        code.push('computed=this.', this.$$store.runtime[name], ';');
        code.push('if(this.', this.$$store.theme[name], '!==undefined)');
        code.push('computed=this.', this.$$store.theme[name], ';');
        code.push('else if(this.', this.$$store.init[name], '!==undefined){');
        code.push('computed=this.', this.$$store.init[name], ';');
        code.push('this.', this.$$store.useinit[name], '=true;');
        code.push('}');
      } else {

        if(variant === "setRuntime"){

          // Use runtime value where it has higher priority
          code.push('computed=this.', this.$$store.runtime[name], '=value;');
        } else if(config.inheritable){

          // Use user value where it has higher priority
          code.push('computed=this.', this.$$store.user[name], ';');
        } else {

          // Use user value where it has higher priority
          code.push('old=computed=this.', this.$$store.user[name], ';');
        };
        // Store incoming value
        if(variant === "setThemed"){

          code.push('this.', this.$$store.theme[name], '=value;');
        } else if(variant === "resetThemed"){

          code.push('delete this.', this.$$store.theme[name], ';');
        } else if(variant === "init" && incomingValue){

          code.push('this.', this.$$store.init[name], '=value;');
        };;
      };
      code.push('}');
      // OLD = THEMED VALUE
      if(config.themeable){

        code.push('else if(this.', this.$$store.theme[name], '!==undefined){');
        if(!config.inheritable){

          code.push('old=this.', this.$$store.theme[name], ';');
        };
        if(variant === "setRuntime"){

          code.push('computed=this.', this.$$store.runtime[name], '=value;');
        } else if(variant === "set"){

          code.push('computed=this.', this.$$store.user[name], '=value;');
        } else if(variant === "setThemed"){

          code.push('computed=this.', this.$$store.theme[name], '=value;');
        } else if(variant === "resetThemed"){

          // Delete entry
          code.push('delete this.', this.$$store.theme[name], ';');
          // Fallback to init value
          code.push('if(this.', this.$$store.init[name], '!==undefined){');
          code.push('computed=this.', this.$$store.init[name], ';');
          code.push('this.', this.$$store.useinit[name], '=true;');
          code.push('}');
        } else if(variant === "init"){

          if(incomingValue){

            code.push('this.', this.$$store.init[name], '=value;');
          };
          code.push('computed=this.', this.$$store.theme[name], ';');
        } else if(variant === "refresh"){

          code.push('computed=this.', this.$$store.theme[name], ';');
        };;;;;
        code.push('}');
      };
      // OLD = INIT VALUE
      code.push('else if(this.', this.$$store.useinit[name], '){');
      if(!config.inheritable){

        code.push('old=this.', this.$$store.init[name], ';');
      };
      if(variant === "init"){

        if(incomingValue){

          code.push('computed=this.', this.$$store.init[name], '=value;');
        } else {

          code.push('computed=this.', this.$$store.init[name], ';');
        };
      } else if(variant === "set" || variant === "setRuntime" || variant === "setThemed" || variant === "refresh"){

        code.push('delete this.', this.$$store.useinit[name], ';');
        if(variant === "setRuntime"){

          code.push('computed=this.', this.$$store.runtime[name], '=value;');
        } else if(variant === "set"){

          code.push('computed=this.', this.$$store.user[name], '=value;');
        } else if(variant === "setThemed"){

          code.push('computed=this.', this.$$store.theme[name], '=value;');
        } else if(variant === "refresh"){

          code.push('computed=this.', this.$$store.init[name], ';');
        };;;
      };
      code.push('}');
      // OLD = NONE
      // reset(), resetRuntime() and resetStyle() are impossible because otherwise there
      // is already an old value
      if(variant === "set" || variant === "setRuntime" || variant === "setThemed" || variant === "init"){

        code.push('else{');
        if(variant === "setRuntime"){

          code.push('computed=this.', this.$$store.runtime[name], '=value;');
        } else if(variant === "set"){

          code.push('computed=this.', this.$$store.user[name], '=value;');
        } else if(variant === "setThemed"){

          code.push('computed=this.', this.$$store.theme[name], '=value;');
        } else if(variant === "init"){

          if(incomingValue){

            code.push('computed=this.', this.$$store.init[name], '=value;');
          } else {

            code.push('computed=this.', this.$$store.init[name], ';');
          };
          code.push('this.', this.$$store.useinit[name], '=true;');
        };;;
        // refresh() will work with the undefined value, later
        code.push('}');
      };
    },
    /**
     * Emit code to store the value of an inheritable property
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     */
    __emitStoreInheritedPropertyValue : function(code, config, name, variant){

      code.push('if(computed===undefined||computed===inherit){');
      if(variant === "refresh"){

        code.push('computed=value;');
      } else {

        code.push('var pa=this.getLayoutParent();if(pa)computed=pa.', this.$$store.inherit[name], ';');
      };
      // Fallback to init value if inheritance was unsuccessful
      code.push('if((computed===undefined||computed===inherit)&&');
      code.push('this.', this.$$store.init[name], '!==undefined&&');
      code.push('this.', this.$$store.init[name], '!==inherit){');
      code.push('computed=this.', this.$$store.init[name], ';');
      code.push('this.', this.$$store.useinit[name], '=true;');
      code.push('}else{');
      code.push('delete this.', this.$$store.useinit[name], ';}');
      code.push('}');
      // Compare old/new computed value
      code.push('if(old===computed)return value;');
      // Note: At this point computed can be "inherit" or "undefined".
      // Normalize "inherit" to undefined and delete inherited value
      code.push('if(computed===inherit){');
      code.push('computed=undefined;delete this.', this.$$store.inherit[name], ';');
      code.push('}');
      // Only delete inherited value
      code.push('else if(computed===undefined)');
      code.push('delete this.', this.$$store.inherit[name], ';');
      // Store inherited value
      code.push('else this.', this.$$store.inherit[name], '=computed;');
      // Protect against normalization
      code.push('var backup=computed;');
      // After storage finally normalize computed and old value
      if(config.init !== undefined && variant !== "init"){

        code.push('if(old===undefined)old=this.', this.$$store.init[name], ";");
      } else {

        code.push('if(old===undefined)old=null;');
      };
      code.push('if(computed===undefined||computed==inherit)computed=null;');
    },
    /**
     * Emit code to normalize the old and incoming values from undefined to
     * <code>null</code>.
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     */
    __emitNormalizeUndefinedValues : function(code, config, name, variant){

      // Properties which are not inheritable have no possibility to get
      // undefined at this position. (Hint: set(), setRuntime() and setThemed() only allow non undefined values)
      if(variant !== "set" && variant !== "setRuntime" && variant !== "setThemed"){

        code.push('if(computed===undefined)computed=null;');
      };
      // Compare old/new computed value
      code.push('if(old===computed)return value;');
      // Normalize old value
      if(config.init !== undefined && variant !== "init"){

        code.push('if(old===undefined)old=this.', this.$$store.init[name], ";");
      } else {

        code.push('if(old===undefined)old=null;');
      };
    },
    /**
     * Emit code to call the apply method and fire the change event
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     * @param variant {String} variant of the method e.g. setThemed
     */
    __emitCallCallback : function(code, config, name, variant){

      // Execute user configured setter
      if(config.apply){

        code.push('this.', config.apply, '(computed, old, "', name, '", "', variant, '");');
      };
      // Fire event
      if(config.event){

        code.push("var reg=qx.event.Registration;", "if(reg.hasListener(this, '", config.event, "')){", "reg.fireEvent(this, '", config.event, "', qx.event.type.Data, [computed, old]", ")}");
      };
    },
    /**
     * Emit code to update the inherited values of child objects
     *
     * @param code {String[]} String array to append the code to
     * @param name {String} name of the property
     */
    __emitRefreshChildrenValue : function(code, name){

      code.push('var a=this._getChildren();if(a)for(var i=0,l=a.length;i<l;i++){');
      code.push('if(a[i].', this.$$method.refresh[name], ')a[i].', this.$$method.refresh[name], '(backup);');
      code.push('}');
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
 * This class is one of the most important parts of qooxdoo's
 * object-oriented features.
 *
 * Its {@link #define} method is used to create qooxdoo classes.
 *
 * Each instance of a class defined by {@link #define} has
 * the following keys attached to the constructor and the prototype:
 *
 * <table>
 * <tr><th><code>classname</code></th><td>The fully-qualified name of the class (e.g. <code>"qx.ui.core.Widget"</code>).</td></tr>
 * <tr><th><code>basename</code></th><td>The namespace part of the class name (e.g. <code>"qx.ui.core"</code>).</td></tr>
 * <tr><th><code>constructor</code></th><td>A reference to the constructor of the class.</td></tr>
 * <tr><th><code>superclass</code></th><td>A reference to the constructor of the super class.</td></tr>
 * </table>
 *
 * Each method may access static members of the same class by using
 * <code>this.self(arguments)</code> ({@link qx.core.Object#self}):
 * <pre class='javascript'>
 * statics : { FOO : "bar" },
 * members: {
 *   baz: function(x) {
 *     this.self(arguments).FOO;
 *     ...
 *   }
 * }
 * </pre>
 *
 * Each overriding method may call the overridden method by using
 * <code>this.base(arguments [, ...])</code> ({@link qx.core.Object#base}). This is also true for calling
 * the constructor of the superclass.
 * <pre class='javascript'>
 * members: {
 *   foo: function(x) {
 *     this.base(arguments, x);
 *     ...
 *   }
 * }
 * </pre>
 *
 * By using <code>qx.Class</code> within an app, the native JS data types are
 * conveniently polyfilled according to {@link qx.lang.normalize}.
 *
 * @require(qx.Interface)
 * @require(qx.Mixin)
 * @require(qx.lang.normalize.Array)
 * @require(qx.lang.normalize.Date)
 * @require(qx.lang.normalize.Error)
 * @require(qx.lang.normalize.Function)
 * @require(qx.lang.normalize.String)
 * @require(qx.lang.normalize.Object)
 */
qx.Bootstrap.define("qx.Class", {
  statics : {
    /**
     * A static reference to the property implementation in the case it
     * should be included.
     */
    __Property : qx.core.Environment.get("module.property") ? qx.core.Property : null,
    /*
    ---------------------------------------------------------------------------
       PUBLIC METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * Define a new class using the qooxdoo class system. This sets up the
     * namespace for the class and generates the class from the definition map.
     *
     * Example:
     * <pre class='javascript'>
     * qx.Class.define("name",
     * {
     *   extend : Object, // superclass
     *   implement : [Interfaces],
     *   include : [Mixins],
     *
     *   statics:
     *   {
     *     CONSTANT : 3.141,
     *
     *     publicMethod: function() {},
     *     _protectedMethod: function() {},
     *     __privateMethod: function() {}
     *   },
     *
     *   properties:
     *   {
     *     "tabIndex": { check: "Number", init : -1 }
     *   },
     *
     *   members:
     *   {
     *     publicField: "foo",
     *     publicMethod: function() {},
     *
     *     _protectedField: "bar",
     *     _protectedMethod: function() {},
     *
     *     __privateField: "baz",
     *     __privateMethod: function() {}
     *   }
     * });
     * </pre>
     *
     * @param name {String?null} Name of the class. If <code>null</code>, the class
     *   will not be added to any namespace which could be handy for testing.
     * @param config {Map ? null} Class definition structure. The configuration map has the following keys:
     *     <table>
     *       <tr><th>Name</th><th>Type</th><th>Description</th></tr>
     *       <tr><th>type</th><td>String</td><td>
     *           Type of the class. Valid types are "abstract", "static" and "singleton".
     *           If unset it defaults to a regular non-static class.
     *       </td></tr>
     *       <tr><th>extend</th><td>Class</td><td>The super class the current class inherits from.</td></tr>
     *       <tr><th>implement</th><td>Interface | Interface[]</td><td>Single interface or array of interfaces the class implements.</td></tr>
     *       <tr><th>include</th><td>Mixin | Mixin[]</td><td>Single mixin or array of mixins, which will be merged into the class.</td></tr>
     *       <tr><th>construct</th><td>Function</td><td>The constructor of the class.</td></tr>
     *       <tr><th>statics</th><td>Map</td><td>Map of static members of the class.</td></tr>
     *       <tr><th>properties</th><td>Map</td><td>Map of property definitions. For a description of the format of a property definition see
     *           {@link qx.core.Property}.</td></tr>
     *       <tr><th>members</th><td>Map</td><td>Map of instance members of the class.</td></tr>
     *       <tr><th>environment</th><td>Map</td><td>Map of environment settings for this class. For a description of the format of a setting see
     *           {@link qx.core.Environment}.</td></tr>
     *       <tr><th>events</th><td>Map</td><td>
     *           Map of events the class fires. The keys are the names of the events and the values are the
     *           corresponding event type class names.
     *       </td></tr>
     *       <tr><th>defer</th><td>Function</td><td>Function that is called at the end of processing the class declaration. It allows access to the declared statics, members and properties.</td></tr>
     *       <tr><th>destruct</th><td>Function</td><td>The destructor of the class.</td></tr>
     *     </table>
     * @return {Class} The defined class
     */
    define : function(name, config){

      if(!config){

        config = {
        };
      };
      // Normalize include to array
      if(config.include && !(qx.Bootstrap.getClass(config.include) === "Array")){

        config.include = [config.include];
      };
      // Normalize implement to array
      if(config.implement && !(qx.Bootstrap.getClass(config.implement) === "Array")){

        config.implement = [config.implement];
      };
      // Normalize type
      var implicitType = false;
      if(!config.hasOwnProperty("extend") && !config.type){

        config.type = "static";
        implicitType = true;
      };
      {
      };
      // Create the class
      var clazz = this.__createClass(name, config.type, config.extend, config.statics, config.construct, config.destruct, config.include);
      // Members, properties, events and mixins are only allowed for non-static classes
      if(config.extend){

        // Attach properties
        if(config.properties){

          this.__addProperties(clazz, config.properties, true);
        };
        // Attach members
        if(config.members){

          this.__addMembers(clazz, config.members, true, true, false);
        };
        // Process events
        if(config.events){

          this.__addEvents(clazz, config.events, true);
        };
        // Include mixins
        // Must be the last here to detect conflicts
        if(config.include){

          for(var i = 0,l = config.include.length;i < l;i++){

            this.__addMixin(clazz, config.include[i], false);
          };
        };
      } else if(config.hasOwnProperty('extend') && false){

        throw new Error('"extend" parameter is null or undefined');
      };
      // Process environment
      if(config.environment){

        for(var key in config.environment){

          qx.core.Environment.add(key, config.environment[key]);
        };
      };
      // Interface support for non-static classes
      if(config.implement){

        for(var i = 0,l = config.implement.length;i < l;i++){

          this.__addInterface(clazz, config.implement[i]);
        };
      };
      {
      };
      // Process defer
      if(config.defer){

        config.defer.self = clazz;
        config.defer(clazz, clazz.prototype, {
          add : function(name, config){

            // build pseudo properties map
            var properties = {
            };
            properties[name] = config;
            // execute generic property handler
            qx.Class.__addProperties(clazz, properties, true);
          }
        });
      };
      return clazz;
    },
    /**
     * Removes a class from qooxdoo defined by {@link #define}
     *
     * @param name {String} Name of the class
     */
    undefine : function(name){

      // first, delete the class from the registry
      delete this.$$registry[name];
      // delete the class reference from the namespaces and all empty namespaces
      var ns = name.split(".");
      // build up an array containing all namespace objects including window
      var objects = [window];
      for(var i = 0;i < ns.length;i++){

        objects.push(objects[i][ns[i]]);
      };
      // go through all objects and check for the constructor or empty namespaces
      for(var i = objects.length - 1;i >= 1;i--){

        var last = objects[i];
        var parent = objects[i - 1];
        if(qx.Bootstrap.isFunction(last) || qx.Bootstrap.objectGetLength(last) === 0){

          delete parent[ns[i - 1]];
        } else {

          break;
        };
      };
    },
    /**
     * Whether the given class exists
     *
     * @signature function(name)
     * @param name {String} class name to check
     * @return {Boolean} true if class exists
     */
    isDefined : qx.util.OOUtil.classIsDefined,
    /**
     * Determine the total number of classes
     *
     * @return {Number} the total number of classes
     */
    getTotalNumber : function(){

      return qx.Bootstrap.objectGetLength(this.$$registry);
    },
    /**
     * Find a class by its name
     *
     * @signature function(name)
     * @param name {String} class name to resolve
     * @return {Class} the class
     */
    getByName : qx.Bootstrap.getByName,
    /**
     * Include all features of the given mixin into the class. The mixin must
     * not include any methods or properties that are already available in the
     * class. This would only be possible using the {@link #patch} method.
     *
     * @param clazz {Class} An existing class which should be augmented by including a mixin.
     * @param mixin {Mixin} The mixin to be included.
     */
    include : function(clazz, mixin){

      {
      };
      qx.Class.__addMixin(clazz, mixin, false);
    },
    /**
     * Include all features of the given mixin into the class. The mixin may
     * include features, which are already defined in the target class. Existing
     * features of equal name will be overwritten.
     * Please keep in mind that this functionality is not intended for regular
     * use, but as a formalized way (and a last resort) in order to patch
     * existing classes.
     *
     * <b>WARNING</b>: You may break working classes and features.
     *
     * @param clazz {Class} An existing class which should be modified by including a mixin.
     * @param mixin {Mixin} The mixin to be included.
     */
    patch : function(clazz, mixin){

      {
      };
      qx.Class.__addMixin(clazz, mixin, true);
    },
    /**
     * Whether a class is a direct or indirect sub class of another class,
     * or both classes coincide.
     *
     * @param clazz {Class} the class to check.
     * @param superClass {Class} the potential super class
     * @return {Boolean} whether clazz is a sub class of superClass.
     */
    isSubClassOf : function(clazz, superClass){

      if(!clazz){

        return false;
      };
      if(clazz == superClass){

        return true;
      };
      if(clazz.prototype instanceof superClass){

        return true;
      };
      return false;
    },
    /**
     * Returns the definition of the given property. Returns null
     * if the property does not exist.
     *
     * @signature function(clazz, name)
     * @param clazz {Class} class to check
     * @param name {String} name of the class to check for
     * @return {Map|null} whether the object support the given event.
     */
    getPropertyDefinition : qx.util.OOUtil.getPropertyDefinition,
    /**
     * Returns a list of all properties supported by the given class
     *
     * @param clazz {Class} Class to query
     * @return {String[]} List of all property names
     */
    getProperties : function(clazz){

      var list = [];
      while(clazz){

        if(clazz.$$properties){

          list.push.apply(list, Object.keys(clazz.$$properties));
        };
        clazz = clazz.superclass;
      };
      return list;
    },
    /**
     * Returns the class or one of its superclasses which contains the
     * declaration for the given property in its class definition. Returns null
     * if the property is not specified anywhere.
     *
     * @param clazz {Class} class to look for the property
     * @param name {String} name of the property
     * @return {Class | null} The class which includes the property
     */
    getByProperty : function(clazz, name){

      while(clazz){

        if(clazz.$$properties && clazz.$$properties[name]){

          return clazz;
        };
        clazz = clazz.superclass;
      };
      return null;
    },
    /**
     * Whether a class has the given property
     *
     * @signature function(clazz, name)
     * @param clazz {Class} class to check
     * @param name {String} name of the property to check for
     * @return {Boolean} whether the class includes the given property.
     */
    hasProperty : qx.util.OOUtil.hasProperty,
    /**
     * Returns the event type of the given event. Returns null if
     * the event does not exist.
     *
     * @signature function(clazz, name)
     * @param clazz {Class} class to check
     * @param name {String} name of the event
     * @return {String|null} Event type of the given event.
     */
    getEventType : qx.util.OOUtil.getEventType,
    /**
     * Whether a class supports the given event type
     *
     * @signature function(clazz, name)
     * @param clazz {Class} class to check
     * @param name {String} name of the event to check for
     * @return {Boolean} whether the class supports the given event.
     */
    supportsEvent : qx.util.OOUtil.supportsEvent,
    /**
     * Whether a class directly includes a mixin.
     *
     * @param clazz {Class} class to check
     * @param mixin {Mixin} the mixin to check for
     * @return {Boolean} whether the class includes the mixin directly.
     */
    hasOwnMixin : function(clazz, mixin){

      return clazz.$$includes && clazz.$$includes.indexOf(mixin) !== -1;
    },
    /**
     * Returns the class or one of its superclasses which contains the
     * declaration for the given mixin. Returns null if the mixin is not
     * specified anywhere.
     *
     * @param clazz {Class} class to look for the mixin
     * @param mixin {Mixin} mixin to look for
     * @return {Class | null} The class which directly includes the given mixin
     */
    getByMixin : function(clazz, mixin){

      var list,i,l;
      while(clazz){

        if(clazz.$$includes){

          list = clazz.$$flatIncludes;
          for(i = 0,l = list.length;i < l;i++){

            if(list[i] === mixin){

              return clazz;
            };
          };
        };
        clazz = clazz.superclass;
      };
      return null;
    },
    /**
     * Returns a list of all mixins available in a given class.
     *
     * @signature function(clazz)
     * @param clazz {Class} class which should be inspected
     * @return {Mixin[]} array of mixins this class uses
     */
    getMixins : qx.util.OOUtil.getMixins,
    /**
     * Whether a given class or any of its superclasses includes a given mixin.
     *
     * @param clazz {Class} class to check
     * @param mixin {Mixin} the mixin to check for
     * @return {Boolean} whether the class includes the mixin.
     */
    hasMixin : function(clazz, mixin){

      return !!this.getByMixin(clazz, mixin);
    },
    /**
     * Whether a given class directly includes an interface.
     *
     * This function will only return "true" if the interface was defined
     * in the class declaration ({@link qx.Class#define}) using the "implement"
     * key.
     *
     * @param clazz {Class} class or instance to check
     * @param iface {Interface} the interface to check for
     * @return {Boolean} whether the class includes the mixin directly.
     */
    hasOwnInterface : function(clazz, iface){

      return clazz.$$implements && clazz.$$implements.indexOf(iface) !== -1;
    },
    /**
     * Returns the class or one of its super classes which contains the
     * declaration of the given interface. Returns null if the interface is not
     * specified anywhere.
     *
     * @signature function(clazz, iface)
     * @param clazz {Class} class to look for the interface
     * @param iface {Interface} interface to look for
     * @return {Class | null} the class which directly implements the given interface
     */
    getByInterface : qx.util.OOUtil.getByInterface,
    /**
     * Returns a list of all interfaces a given class has to implement.
     *
     * @param clazz {Class} class which should be inspected
     * @return {Interface[]} array of interfaces this class implements
     */
    getInterfaces : function(clazz){

      var list = [];
      while(clazz){

        if(clazz.$$implements){

          list.push.apply(list, clazz.$$flatImplements);
        };
        clazz = clazz.superclass;
      };
      return list;
    },
    /**
     * Whether a given class or any of its super classes includes a given interface.
     *
     * This function will return "true" if the interface was defined
     * in the class declaration ({@link qx.Class#define}) of the class
     * or any of its super classes using the "implement"
     * key.
     *
     * @signature function(clazz, iface)
     * @param clazz {Class} class to check
     * @param iface {Interface} the interface to check for
     * @return {Boolean} whether the class includes the interface.
     */
    hasInterface : qx.util.OOUtil.hasInterface,
    /**
     * Whether a given class complies to an interface.
     *
     * Checks whether all methods defined in the interface are
     * implemented. The class does not need to implement
     * the interface explicitly in the <code>extend</code> key.
     *
     * @param obj {Object} class to check
     * @param iface {Interface} the interface to check for
     * @return {Boolean} whether the class conforms to the interface.
     */
    implementsInterface : function(obj, iface){

      var clazz = obj.constructor;
      if(this.hasInterface(clazz, iface)){

        return true;
      };
      if(qx.Interface.objectImplements(obj, iface)){

        return true;
      };
      if(qx.Interface.classImplements(clazz, iface)){

        return true;
      };
      return false;
    },
    /**
     * Helper method to handle singletons
     *
     * @internal
     * @return {Object} The singleton instance
     */
    getInstance : function(){

      if(!this.$$instance){

        this.$$allowconstruct = true;
        this.$$instance = new this();
        delete this.$$allowconstruct;
      };
      return this.$$instance;
    },
    /*
    ---------------------------------------------------------------------------
       PRIVATE/INTERNAL BASICS
    ---------------------------------------------------------------------------
    */
    /**
     * This method will be attached to all classes to return
     * a nice identifier for them.
     *
     * @internal
     * @return {String} The class identifier
     */
    genericToString : function(){

      return "[Class " + this.classname + "]";
    },
    /** Stores all defined classes */
    $$registry : qx.Bootstrap.$$registry,
    /** @type {Map} allowed keys in non-static class definition */
    __allowedKeys : null,
    /** @type {Map} allowed keys in static class definition */
    __staticAllowedKeys : null,
    /**
     * Validates an incoming configuration and checks for proper keys and values
     *
     * @signature function(name, config)
     * @param name {String} The name of the class
     * @param config {Map} Configuration map
     */
    __validateConfig : function(name, config){
    },
    /**
     * Validates the interfaces required by abstract base classes
     *
     * @signature function(clazz)
     * @param clazz {Class} The configured class.
     */
    __validateAbstractInterfaces : function(clazz){
    },
    /**
     * Creates a class by type. Supports modern inheritance etc.
     *
     * @param name {String} Full name of the class
     * @param type {String} type of the class, i.e. "static", "abstract" or "singleton"
     * @param extend {Class} Superclass to inherit from
     * @param statics {Map} Static methods or fields
     * @param construct {Function} Constructor of the class
     * @param destruct {Function} Destructor of the class
     * @param mixins {Mixin[]} array of mixins of the class
     * @return {Class} The generated class
     */
    __createClass : function(name, type, extend, statics, construct, destruct, mixins){

      var clazz;
      if(!extend && qx.core.Environment.get("qx.aspects") == false){

        // Create empty/non-empty class
        clazz = statics || {
        };
        qx.Bootstrap.setDisplayNames(clazz, name);
      } else {

        clazz = {
        };
        if(extend){

          // Create default constructor
          if(!construct){

            construct = this.__createDefaultConstructor();
          };
          if(this.__needsConstructorWrapper(extend, mixins)){

            clazz = this.__wrapConstructor(construct, name, type);
          } else {

            clazz = construct;
          };
          // Add singleton getInstance()
          if(type === "singleton"){

            clazz.getInstance = this.getInstance;
          };
          qx.Bootstrap.setDisplayName(construct, name, "constructor");
        };
        // Copy statics
        if(statics){

          qx.Bootstrap.setDisplayNames(statics, name);
          var key;
          for(var i = 0,a = Object.keys(statics),l = a.length;i < l;i++){

            key = a[i];
            var staticValue = statics[key];
            if(qx.core.Environment.get("qx.aspects")){

              if(staticValue instanceof Function){

                staticValue = qx.core.Aspect.wrap(name + "." + key, staticValue, "static");
              };
              clazz[key] = staticValue;
            } else {

              clazz[key] = staticValue;
            };
          };
        };
      };
      // Create namespace
      var basename = name ? qx.Bootstrap.createNamespace(name, clazz) : "";
      // Store names in constructor/object
      clazz.name = clazz.classname = name;
      clazz.basename = basename;
      // Store type info
      clazz.$$type = "Class";
      if(type){

        clazz.$$classtype = type;
      };
      // Attach toString
      if(!clazz.hasOwnProperty("toString")){

        clazz.toString = this.genericToString;
      };
      if(extend){

        qx.Bootstrap.extendClass(clazz, construct, extend, name, basename);
        // Store destruct onto class
        if(destruct){

          if(qx.core.Environment.get("qx.aspects")){

            destruct = qx.core.Aspect.wrap(name, destruct, "destructor");
          };
          clazz.$$destructor = destruct;
          qx.Bootstrap.setDisplayName(destruct, name, "destruct");
        };
      };
      // Store class reference in global class registry
      this.$$registry[name] = clazz;
      // Return final class object
      return clazz;
    },
    /*
    ---------------------------------------------------------------------------
       PRIVATE ADD HELPERS
    ---------------------------------------------------------------------------
    */
    /**
     * Attach events to the class
     *
     * @param clazz {Class} class to add the events to
     * @param events {Map} map of event names the class fires.
     * @param patch {Boolean ? false} Enable redefinition of event type?
     */
    __addEvents : function(clazz, events, patch){

      {

        var key,key;
      };
      if(clazz.$$events){

        for(var key in events){

          clazz.$$events[key] = events[key];
        };
      } else {

        clazz.$$events = events;
      };
    },
    /**
     * Attach properties to classes
     *
     * @param clazz {Class} class to add the properties to
     * @param properties {Map} map of properties
     * @param patch {Boolean ? false} Overwrite property with the limitations of a property
               which means you are able to refine but not to replace (esp. for new properties)
     */
    __addProperties : function(clazz, properties, patch){

      // check for the property module
      if(!qx.core.Environment.get("module.property")){

        throw new Error("Property module disabled.");
      };
      var config;
      if(patch === undefined){

        patch = false;
      };
      var proto = clazz.prototype;
      for(var name in properties){

        config = properties[name];
        {
        };
        // Store name into configuration
        config.name = name;
        // Add config to local registry
        if(!config.refine){

          if(clazz.$$properties === undefined){

            clazz.$$properties = {
            };
          };
          clazz.$$properties[name] = config;
        };
        // Store init value to prototype. This makes it possible to
        // overwrite this value in derived classes.
        if(config.init !== undefined){

          clazz.prototype["$$init_" + name] = config.init;
        };
        // register event name
        if(config.event !== undefined){

          // break if no events layer loaded
          if(!qx.core.Environment.get("module.events")){

            throw new Error("Events module not enabled.");
          };
          var event = {
          };
          event[config.event] = "qx.event.type.Data";
          this.__addEvents(clazz, event, patch);
        };
        // Remember inheritable properties
        if(config.inheritable){

          this.__Property.$$inheritable[name] = true;
          if(!proto.$$refreshInheritables){

            this.__Property.attachRefreshInheritables(clazz);
          };
        };
        if(!config.refine){

          this.__Property.attachMethods(clazz, name, config);
        };
      };
    },
    /**
     * Validates the given property
     *
     * @signature function(clazz, name, config, patch)
     * @param clazz {Class} class to add property to
     * @param name {String} name of the property
     * @param config {Map} configuration map
     * @param patch {Boolean ? false} enable refine/patch?
     */
    __validateProperty : null,
    /**
     * Attach members to a class
     *
     * @param clazz {Class} clazz to add members to
     * @param members {Map} The map of members to attach
     * @param patch {Boolean ? false} Enable patching of
     * @param base {Boolean ? true} Attach base flag to mark function as members
     *     of this class
     * @param wrap {Boolean ? false} Whether the member method should be wrapped.
     *     this is needed to allow base calls in patched mixin members.
     */
    __addMembers : function(clazz, members, patch, base, wrap){

      var proto = clazz.prototype;
      var key,member;
      qx.Bootstrap.setDisplayNames(members, clazz.classname + ".prototype");
      for(var i = 0,a = Object.keys(members),l = a.length;i < l;i++){

        key = a[i];
        member = members[key];
        {
        };
        // Added helper stuff to functions
        // Hint: Could not use typeof function because RegExp objects are functions, too
        // Protect to apply base property and aspect support on special attributes e.g.
        // classes which are function like as well.
        if(base !== false && member instanceof Function && member.$$type == null){

          if(wrap == true){

            // wrap "patched" mixin member
            member = this.__mixinMemberWrapper(member, proto[key]);
          } else {

            // Configure extend (named base here)
            // Hint: proto[key] is not yet overwritten here
            if(proto[key]){

              member.base = proto[key];
            };
            member.self = clazz;
          };
          if(qx.core.Environment.get("qx.aspects")){

            member = qx.core.Aspect.wrap(clazz.classname + "." + key, member, "member");
          };
        };
        // Attach member
        proto[key] = member;
      };
    },
    /**
     * Wraps a member function of a mixin, which is included using "patch". This
     * allows "base" calls in the mixin member function.
     *
     * @param member {Function} The mixin method to wrap
     * @param base {Function} The overwritten method
     * @return {Function} the wrapped mixin member
     */
    __mixinMemberWrapper : function(member, base){

      if(base){

        return function(){

          var oldBase = member.base;
          member.base = base;
          var retval = member.apply(this, arguments);
          member.base = oldBase;
          return retval;
        };
      } else {

        return member;
      };
    },
    /**
     * Add a single interface to a class
     *
     * @param clazz {Class} class to add interface to
     * @param iface {Interface} the Interface to add
     */
    __addInterface : function(clazz, iface){

      {
      };
      // Store interface reference
      var list = qx.Interface.flatten([iface]);
      if(clazz.$$implements){

        clazz.$$implements.push(iface);
        clazz.$$flatImplements.push.apply(clazz.$$flatImplements, list);
      } else {

        clazz.$$implements = [iface];
        clazz.$$flatImplements = list;
      };
    },
    /**
     * Wrap the constructor of an already existing clazz. This function will
     * replace all references to the existing constructor with the new wrapped
     * constructor.
     *
     * @param clazz {Class} The class to wrap
     * @return {Class} The wrapped class
     */
    __retrospectWrapConstruct : function(clazz){

      var name = clazz.classname;
      var wrapper = this.__wrapConstructor(clazz, name, clazz.$$classtype);
      // copy all keys from the wrapped constructor to the wrapper
      for(var i = 0,a = Object.keys(clazz),l = a.length;i < l;i++){

        key = a[i];
        wrapper[key] = clazz[key];
      };
      // fix prototype
      wrapper.prototype = clazz.prototype;
      // fix self references in members
      var members = clazz.prototype;
      for(var i = 0,a = Object.keys(members),l = a.length;i < l;i++){

        key = a[i];
        var method = members[key];
        // check if method is available because null values can be stored as
        // init values on classes e.g. [BUG #3709]
        if(method && method.self == clazz){

          method.self = wrapper;
        };
      };
      // fix base and superclass references in all defined classes
      for(var key in this.$$registry){

        var construct = this.$$registry[key];
        if(!construct){

          continue;
        };
        if(construct.base == clazz){

          construct.base = wrapper;
        };
        if(construct.superclass == clazz){

          construct.superclass = wrapper;
        };
        if(construct.$$original){

          if(construct.$$original.base == clazz){

            construct.$$original.base = wrapper;
          };
          if(construct.$$original.superclass == clazz){

            construct.$$original.superclass = wrapper;
          };
        };
      };
      qx.Bootstrap.createNamespace(name, wrapper);
      this.$$registry[name] = wrapper;
      return wrapper;
    },
    /**
     * Include all features of the mixin into the given class, recursively.
     *
     * @param clazz {Class} The class onto which the mixin should be attached.
     * @param mixin {Mixin} Include all features of this mixin
     * @param patch {Boolean} Overwrite existing fields, functions and properties
     */
    __addMixin : function(clazz, mixin, patch){

      {
      };
      if(this.hasMixin(clazz, mixin)){

        return;
      };
      var isConstructorWrapped = clazz.$$original;
      if(mixin.$$constructor && !isConstructorWrapped){

        clazz = this.__retrospectWrapConstruct(clazz);
      };
      // Attach content
      var list = qx.Mixin.flatten([mixin]);
      var entry;
      for(var i = 0,l = list.length;i < l;i++){

        entry = list[i];
        // Attach events
        if(entry.$$events){

          this.__addEvents(clazz, entry.$$events, patch);
        };
        // Attach properties (Properties are already readonly themselves, no patch handling needed)
        if(entry.$$properties){

          this.__addProperties(clazz, entry.$$properties, patch);
        };
        // Attach members (Respect patch setting, but dont apply base variables)
        if(entry.$$members){

          this.__addMembers(clazz, entry.$$members, patch, patch, patch);
        };
      };
      // Store mixin reference
      if(clazz.$$includes){

        clazz.$$includes.push(mixin);
        clazz.$$flatIncludes.push.apply(clazz.$$flatIncludes, list);
      } else {

        clazz.$$includes = [mixin];
        clazz.$$flatIncludes = list;
      };
    },
    /*
    ---------------------------------------------------------------------------
       PRIVATE FUNCTION HELPERS
    ---------------------------------------------------------------------------
    */
    /**
     * Returns the default constructor.
     * This constructor just calls the constructor of the base class.
     *
     * @return {Function} The default constructor.
     */
    __createDefaultConstructor : function(){

      function defaultConstructor(){

        defaultConstructor.base.apply(this, arguments);
      };
      return defaultConstructor;
    },
    /**
     * Returns an empty function. This is needed to get an empty function with an empty closure.
     *
     * @return {Function} empty function
     */
    __createEmptyFunction : function(){

      return function(){
      };
    },
    /**
     * Checks if the constructor needs to be wrapped.
     *
     * @param base {Class} The base class.
     * @param mixins {Mixin[]} All mixins which should be included.
     * @return {Boolean} true, if the constructor needs to be wrapped.
     */
    __needsConstructorWrapper : function(base, mixins){

      {
      };
      // Check for base class mixin constructors
      if(base && base.$$includes){

        var baseMixins = base.$$flatIncludes;
        for(var i = 0,l = baseMixins.length;i < l;i++){

          if(baseMixins[i].$$constructor){

            return true;
          };
        };
      };
      // check for direct mixin constructors
      if(mixins){

        var flatMixins = qx.Mixin.flatten(mixins);
        for(var i = 0,l = flatMixins.length;i < l;i++){

          if(flatMixins[i].$$constructor){

            return true;
          };
        };
      };
      return false;
    },
    /**
     * Generate a wrapper of the original class constructor in order to enable
     * some of the advanced OO features (e.g. abstract class, singleton, mixins)
     *
     * @param construct {Function} the original constructor
     * @param name {String} name of the class
     * @param type {String} the user specified class type
     * @return {Function} The wrapped constructor
     */
    __wrapConstructor : function(construct, name, type){

      var wrapper = function(){

        var clazz = wrapper;
        {
        };
        // Execute default constructor
        var retval = clazz.$$original.apply(this, arguments);
        // Initialize local mixins
        if(clazz.$$includes){

          var mixins = clazz.$$flatIncludes;
          for(var i = 0,l = mixins.length;i < l;i++){

            if(mixins[i].$$constructor){

              mixins[i].$$constructor.apply(this, arguments);
            };
          };
        };
        {
        };
        // Return optional return value
        return retval;
      };
      if(qx.core.Environment.get("qx.aspects")){

        var aspectWrapper = qx.core.Aspect.wrap(name, wrapper, "constructor");
        wrapper.$$original = construct;
        wrapper.constructor = aspectWrapper;
        wrapper = aspectWrapper;
      };
      // Store original constructor
      wrapper.$$original = construct;
      // Store wrapper into constructor (needed for base calls etc.)
      construct.wrapper = wrapper;
      // Return generated wrapper
      return wrapper;
    }
  },
  defer : function(){

    // Binding of already loaded bootstrap classes
    if(qx.core.Environment.get("qx.aspects")){

      for(var classname in qx.Bootstrap.$$registry){

        var statics = qx.Bootstrap.$$registry[classname];
        for(var key in statics){

          // only functions, no regexps
          if(statics[key] instanceof Function){

            statics[key] = qx.core.Aspect.wrap(classname + "." + key, statics[key], "static");
          };
        };
      };
    };
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
 * This mixin is forwarding the static methods of
 * {@link qx.data.SingleValueBinding} to the instance including the mixin.
 * The source object will be <code>this</code>.
 */
qx.Mixin.define("qx.data.MBinding", {
  members : {
    /**
     * The bind method delegates the call to the
     * {@link qx.data.SingleValueBinding#bind} function. As source, the current
     * object (this) will be used.
     *
     * @param sourcePropertyChain {String} The property chain which represents
     *   the source property.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetProperty {String} The property name of the target object.
     * @param options {Map} A map containing the options. See
     *   {@link qx.data.SingleValueBinding#bind} for more
     *   information.
     *
     * @return {var} Returns the internal id for that binding. This can be used
     *   for referencing the binding e.g. for removing. This is not an atomic
     *   id so you can't you use it as a hash-map index.
     *
     * @throws {qx.core.AssertionError} If the event is no data event or
     *   there is no property definition for object and property (source and
     *   target).
     */
    bind : function(sourcePropertyChain, targetObject, targetProperty, options){

      return qx.data.SingleValueBinding.bind(this, sourcePropertyChain, targetObject, targetProperty, options);
    },
    /**
     * Removes the binding with the given id from the current object. The
     * id hast to be the id returned by any of the bind functions.
     *
     * @param id {var} The id of the binding.
     * @throws {Error} If the binding could not be found.
     */
    removeBinding : function(id){

      qx.data.SingleValueBinding.removeBindingFromObject(this, id);
    },
    /**
     * Removes all bindings from the object.
     *
     * @throws {qx.core.AssertionError} If the object is not in the internal
     *   registry of the bindings.
     * @throws {Error} If one of the bindings listed internally can not be
     *   removed.
     */
    removeAllBindings : function(){

      qx.data.SingleValueBinding.removeAllBindingsForObject(this);
    },
    /**
     * Returns an array which lists all bindings for the object.
     *
     * @return {Array} An array of binding informations. Every binding
     *   information is an array itself containing id, sourceObject, sourceEvent,
     *   targetObject and targetProperty in that order.
     */
    getBindings : function(){

      return qx.data.SingleValueBinding.getAllBindingsForObject(this);
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * The data binding package is still under development so there will be changes
 * to the API. This Features is for testing purpose only.
 */
qx.Class.define("qx.data.SingleValueBinding", {
  statics : {
    /** internal reference for all bindings */
    __bindings : {
    },
    /**
     * The function is responsible for binding a source objects property to
     * a target objects property. Both properties have to have the usual qooxdoo
     * getter and setter. The source property also needs to fire change-events
     * on every change of its value.
     * Please keep in mind, that this binding is unidirectional. If you need
     * a binding in both directions, you have to use two of this bindings.
     *
     * It's also possible to bind some kind of a hierarchy as a source. This
     * means that you can separate the source properties with a dot and bind
     * by that the object referenced to this property chain.
     * Example with an object 'a' which has object 'b' stored in its 'child'
     * property. Object b has a string property named abc:
     * <pre><code>
     * qx.data.SingleValueBinding.bind(a, "child.abc", textfield, "value");
     * </code></pre>
     * In that case, if the property abc of b changes, the textfield will
     * automatically contain the new value. Also if the child of a changes, the
     * new value (abc of the new child) will be in the textfield.
     *
     * There is also a possibility of binding an array. Therefor the array
     * {@link qx.data.IListData} is needed because this array has change events
     * which the native does not. Imagine a qooxdoo object a which has a
     * children property containing an array holding more of its own kind.
     * Every object has a name property as a string.
     * <pre>
     * var svb = qx.data.SingleValueBinding;
     * // bind the first childs name of 'a' to a textfield
     * svb.bind(a, "children[0].name", textfield, "value");
     * // bind the last childs name of 'a' to a textfield
     * svb.bind(a, "children[last].name", textfield2, "value");
     * // also deeper bindinds are possible
     * svb.bind(a, "children[0].children[0].name", textfield3, "value");
     * </pre>
     *
     * As you can see in this example, the abc property of a's b will be bound
     * to the textfield. If now the value of b changed or even the a will get a
     * new b, the binding still shows the right value.
     *
     * @param sourceObject {qx.core.Object} The source of the binding.
     * @param sourcePropertyChain {String} The property chain which represents
     *   the source property.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetPropertyChain {String} The property chain to the target
     *   object.
     * @param options {Map?null} A map containing the options.
     *   <li>converter: A converter function which takes four parameters
     *       and should return the converted value.
     *       <ol>
     *         <li>The data to convert</li>
     *         <li>The corresponding model object, which is only set in case of the use of an controller.</li>
     *         <li>The source object for the binding</li>
     *         <li>The target object.</li>
     *       </ol>
     *       If no conversion has been done, the given value should be returned.
     *       e.g. a number to boolean converter
     *       <code>function(data, model, source, target) {return data > 100;}</code>
     *   </li>
     *   <li>onUpdate: A callback function can be given here. This method will be
     *       called if the binding was updated successful. There will be
     *       three parameter you do get in that method call.
     *       <ol>
     *         <li>The source object</li>
     *         <li>The target object</li>
     *         <li>The data</li>
     *       </ol>
     *       Here is a sample: <code>onUpdate : function(source, target, data) {...}</code>
     *   </li>
     *   <li>onSetFail: A callback function can be given here. This method will
     *       be called if the set of the value fails.
     *   </li>
     *   <li>ignoreConverter: A string which will be matched using the current
     *       property chain. If it matches, the converter will not be called.
     *   </li>
     *
     * @return {var} Returns the internal id for that binding. This can be used
     *   for referencing the binding or e.g. for removing. This is not an atomic
     *   id so you can't you use it as a hash-map index.
     *
     * @throws {qx.core.AssertionError} If the event is no data event or
     *   there is no property definition for object and property (source and
     *   target).
     */
    bind : function(sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options){

      {
      };
      // set up the target binding
      var targetListenerMap = this.__setUpTargetBinding(sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options);
      // get the property names
      var propertyNames = sourcePropertyChain.split(".");
      // stuff that's needed to store for the listener function
      var arrayIndexValues = this.__checkForArrayInPropertyChain(propertyNames);
      var sources = [];
      var listeners = [];
      var listenerIds = [];
      var eventNames = [];
      var source = sourceObject;
      // add a try catch to make it possible to remove the listeners of the
      // chain in case the loop breaks after some listeners already added.
      try{

        // go through all property names
        for(var i = 0;i < propertyNames.length;i++){

          // check for the array
          if(arrayIndexValues[i] !== ""){

            // push the array change event
            eventNames.push("change");
          } else {

            eventNames.push(this.__getEventNameForProperty(source, propertyNames[i]));
          };
          // save the current source
          sources[i] = source;
          // check for the last property
          if(i == propertyNames.length - 1){

            // if it is an array, set the initial value and bind the event
            if(arrayIndexValues[i] !== ""){

              // getthe current value
              var itemIndex = arrayIndexValues[i] === "last" ? source.length - 1 : arrayIndexValues[i];
              var currentValue = source.getItem(itemIndex);
              // set the initial value
              this.__setInitialValue(currentValue, targetObject, targetPropertyChain, options, sourceObject);
              // bind the event
              listenerIds[i] = this.__bindEventToProperty(source, eventNames[i], targetObject, targetPropertyChain, options, arrayIndexValues[i]);
            } else {

              // try to set the initial value
              if(propertyNames[i] != null && source["get" + qx.lang.String.firstUp(propertyNames[i])] != null){

                var currentValue = source["get" + qx.lang.String.firstUp(propertyNames[i])]();
                this.__setInitialValue(currentValue, targetObject, targetPropertyChain, options, sourceObject);
              };
              // bind the property
              listenerIds[i] = this.__bindEventToProperty(source, eventNames[i], targetObject, targetPropertyChain, options);
            };
          } else {

            // create the context for the listener
            var context = {
              index : i,
              propertyNames : propertyNames,
              sources : sources,
              listenerIds : listenerIds,
              arrayIndexValues : arrayIndexValues,
              targetObject : targetObject,
              targetPropertyChain : targetPropertyChain,
              options : options,
              listeners : listeners
            };
            // create a listener
            var listener = qx.lang.Function.bind(this.__chainListener, this, context);
            // store the listener for further processing
            listeners.push(listener);
            // add the chaining listener
            listenerIds[i] = source.addListener(eventNames[i], listener);
          };
          // get and store the next source
          if(source["get" + qx.lang.String.firstUp(propertyNames[i])] == null){

            source = null;
          } else if(arrayIndexValues[i] !== ""){

            source = source["get" + qx.lang.String.firstUp(propertyNames[i])](arrayIndexValues[i]);
          } else {

            source = source["get" + qx.lang.String.firstUp(propertyNames[i])]();
          };
          if(!source){

            break;
          };
        };
      } catch(ex) {

        // remove the already added listener
        // go threw all added listeners (source)
        for(var i = 0;i < sources.length;i++){

          // check if a source is available
          if(sources[i] && listenerIds[i]){

            sources[i].removeListenerById(listenerIds[i]);
          };
        };
        var targets = targetListenerMap.targets;
        var targetIds = targetListenerMap.listenerIds;
        // go threw all added listeners (target)
        for(var i = 0;i < targets.length;i++){

          // check if a target is available
          if(targets[i] && targetIds[i]){

            targets[i].removeListenerById(targetIds[i]);
          };
        };
        throw ex;
      };
      // create the id map
      var id = {
        type : "deepBinding",
        listenerIds : listenerIds,
        sources : sources,
        targetListenerIds : targetListenerMap.listenerIds,
        targets : targetListenerMap.targets
      };
      // store the bindings
      this.__storeBinding(id, sourceObject, sourcePropertyChain, targetObject, targetPropertyChain);
      return id;
    },
    /**
     * Event listener for the chaining of the properties.
     *
     * @param context {Map} The current context for the listener.
     */
    __chainListener : function(context){

      // invoke the onUpdate method
      if(context.options && context.options.onUpdate){

        context.options.onUpdate(context.sources[context.index], context.targetObject);
      };
      // delete all listener after the current one
      for(var j = context.index + 1;j < context.propertyNames.length;j++){

        // remove the old sources
        var source = context.sources[j];
        context.sources[j] = null;
        if(!source){

          continue;
        };
        // remove the listeners
        source.removeListenerById(context.listenerIds[j]);
      };
      // get the current source
      var source = context.sources[context.index];
      // add new once after the current one
      for(var j = context.index + 1;j < context.propertyNames.length;j++){

        // get and store the new source
        if(context.arrayIndexValues[j - 1] !== ""){

          source = source["get" + qx.lang.String.firstUp(context.propertyNames[j - 1])](context.arrayIndexValues[j - 1]);
        } else {

          source = source["get" + qx.lang.String.firstUp(context.propertyNames[j - 1])]();
        };
        context.sources[j] = source;
        // reset the target object if no new source could be found
        if(!source){

          // use the converter if the property chain breaks [BUG# 6880]
          if(context.options && context.options.converter){

            var ignoreConverter = false;
            // take care of the ignore pattern used for the controller
            if(context.options.ignoreConverter){

              // the current property chain as string
              var currentSourceChain = context.propertyNames.slice(0, j).join(".");
              // match for the current patten given in the options
              var match = currentSourceChain.match(new RegExp("^" + context.options.ignoreConverter));
              ignoreConverter = match ? match.length > 0 : false;
            };
            var data = null;
            if(!ignoreConverter){

              data = context.options.converter();
            };
            this.__setTargetValue(context.targetObject, context.targetPropertyChain, data);
          } else {

            this.__resetTargetValue(context.targetObject, context.targetPropertyChain);
          };
          break;
        };
        // if its the last property
        if(j == context.propertyNames.length - 1){

          // if its an array
          if(qx.Class.implementsInterface(source, qx.data.IListData)){

            // set the inital value
            var itemIndex = context.arrayIndexValues[j] === "last" ? source.length - 1 : context.arrayIndexValues[j];
            var currentValue = source.getItem(itemIndex);
            this.__setInitialValue(currentValue, context.targetObject, context.targetPropertyChain, context.options, context.sources[context.index]);
            // bind the item event to the new target
            context.listenerIds[j] = this.__bindEventToProperty(source, "change", context.targetObject, context.targetPropertyChain, context.options, context.arrayIndexValues[j]);
          } else {

            if(context.propertyNames[j] != null && source["get" + qx.lang.String.firstUp(context.propertyNames[j])] != null){

              var currentValue = source["get" + qx.lang.String.firstUp(context.propertyNames[j])]();
              this.__setInitialValue(currentValue, context.targetObject, context.targetPropertyChain, context.options, context.sources[context.index]);
            };
            var eventName = this.__getEventNameForProperty(source, context.propertyNames[j]);
            // bind the last property to the new target
            context.listenerIds[j] = this.__bindEventToProperty(source, eventName, context.targetObject, context.targetPropertyChain, context.options);
          };
        } else {

          // check if a listener already created
          if(context.listeners[j] == null){

            var listener = qx.lang.Function.bind(this.__chainListener, this, context);
            // store the listener for further processing
            context.listeners.push(listener);
          };
          // add a new listener
          if(qx.Class.implementsInterface(source, qx.data.IListData)){

            var eventName = "change";
          } else {

            var eventName = this.__getEventNameForProperty(source, context.propertyNames[j]);
          };
          context.listenerIds[j] = source.addListener(eventName, context.listeners[j]);
        };
      };
    },
    /**
     * Internal helper for setting up the listening to the changes on the
     * target side of the binding. Only works if the target property is a
     * property chain
     *
     * @param sourceObject {qx.core.Object} The source of the binding.
     * @param sourcePropertyChain {String} The property chain which represents
     *   the source property.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetPropertyChain {String} The property name of the target
     *   object.
     * @param options {Map} The options map perhaps containing the user defined
     *   converter.
     * @return {var} A map containing the listener ids and the targets.
     */
    __setUpTargetBinding : function(sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options){

      // get the property names
      var propertyNames = targetPropertyChain.split(".");
      var arrayIndexValues = this.__checkForArrayInPropertyChain(propertyNames);
      var targets = [];
      var listeners = [];
      var listenerIds = [];
      var eventNames = [];
      var target = targetObject;
      // go through all property names
      for(var i = 0;i < propertyNames.length - 1;i++){

        // check for the array
        if(arrayIndexValues[i] !== ""){

          // push the array change event
          eventNames.push("change");
        } else {

          try{

            eventNames.push(this.__getEventNameForProperty(target, propertyNames[i]));
          } catch(e) {

            // if the event names could not be terminated,
            // just ignore the target chain listening
            break;
          };
        };
        // save the current source
        targets[i] = target;
        // create a listener
        var listener = function(){

          // delete all listener after the current one
          for(var j = i + 1;j < propertyNames.length - 1;j++){

            // remove the old sources
            var target = targets[j];
            targets[j] = null;
            if(!target){

              continue;
            };
            // remove the listeners
            target.removeListenerById(listenerIds[j]);
          };
          // get the current target
          var target = targets[i];
          // add new once after the current one
          for(var j = i + 1;j < propertyNames.length - 1;j++){

            var firstUpPropName = qx.lang.String.firstUp(propertyNames[j - 1]);
            // get and store the new target
            if(arrayIndexValues[j - 1] !== ""){

              var currentIndex = arrayIndexValues[j - 1] === "last" ? target.getLength() - 1 : arrayIndexValues[j - 1];
              target = target["get" + firstUpPropName](currentIndex);
            } else {

              target = target["get" + firstUpPropName]();
            };
            targets[j] = target;
            // check if a listener already created
            if(listeners[j] == null){

              // store the listener for further processing
              listeners.push(listener);
            };
            // add a new listener
            if(qx.Class.implementsInterface(target, qx.data.IListData)){

              var eventName = "change";
            } else {

              try{

                var eventName = qx.data.SingleValueBinding.__getEventNameForProperty(target, propertyNames[j]);
              } catch(e) {

                // if the event name could not be terminated,
                // ignore the rest
                break;
              };
            };
            listenerIds[j] = target.addListener(eventName, listeners[j]);
          };
          qx.data.SingleValueBinding.updateTarget(sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options);
        };
        // store the listener for further processing
        listeners.push(listener);
        // add the chaining listener
        listenerIds[i] = target.addListener(eventNames[i], listener);
        var firstUpPropName = qx.lang.String.firstUp(propertyNames[i]);
        // get and store the next target
        if(target["get" + firstUpPropName] == null){

          target = null;
        } else if(arrayIndexValues[i] !== ""){

          target = target["get" + firstUpPropName](arrayIndexValues[i]);
        } else {

          target = target["get" + firstUpPropName]();
        };
        if(!target){

          break;
        };
      };
      return {
        listenerIds : listenerIds,
        targets : targets
      };
    },
    /**
     * Helper for updating the target. Gets the current set data from the source
     * and set that on the target.
     *
     * @param sourceObject {qx.core.Object} The source of the binding.
     * @param sourcePropertyChain {String} The property chain which represents
     *   the source property.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetPropertyChain {String} The property name of the target
     *   object.
     * @param options {Map} The options map perhaps containing the user defined
     *   converter.
     *
     * @internal
     */
    updateTarget : function(sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options){

      var value = this.resolvePropertyChain(sourceObject, sourcePropertyChain);
      // convert the data before setting
      value = qx.data.SingleValueBinding.__convertValue(value, targetObject, targetPropertyChain, options, sourceObject);
      this.__setTargetValue(targetObject, targetPropertyChain, value);
    },
    /**
     * Internal helper for getting the current set value at the property chain.
     *
     * @param o {qx.core.Object} The source of the binding.
     * @param propertyChain {String} The property chain which represents
     *   the source property.
     * @return {var?undefined} Returns the set value if defined.
     */
    resolvePropertyChain : function(o, propertyChain){

      var source = this.__getTargetFromChain(o, propertyChain);
      var value;
      if(source != null){

        // geht the name of the last property
        var lastProperty = propertyChain.substring(propertyChain.lastIndexOf(".") + 1, propertyChain.length);
        // check for arrays
        if(lastProperty.charAt(lastProperty.length - 1) == "]"){

          // split up the chain into property and index
          var index = lastProperty.substring(lastProperty.lastIndexOf("[") + 1, lastProperty.length - 1);
          var prop = lastProperty.substring(0, lastProperty.lastIndexOf("["));
          // get the array
          var sourceArray = source["get" + qx.lang.String.firstUp(prop)]();
          if(index == "last"){

            index = sourceArray.length - 1;
          };
          if(sourceArray != null){

            value = sourceArray.getItem(index);
          };
        } else {

          // set the given value
          value = source["get" + qx.lang.String.firstUp(lastProperty)]();
        };
      };
      return value;
    },
    /**
     * Tries to return a fitting event name to the given source object and
     * property name. First, it assumes that the propertyname is a real property
     * and therefore it checks the property definition for the event. The second
     * possibility is to check if there is an event with the given name. The
     * third and last possibility checked is if there is an event which is named
     * change + propertyname. If this three possibilities fail, an error will be
     * thrown.
     *
     * @param source {qx.core.Object} The source where the property is stored.
     * @param propertyname {String} The name of the property.
     * @return {String} The name of the corresponding property.
     */
    __getEventNameForProperty : function(source, propertyname){

      // get the current event Name from the property definition
      var eventName = this.__getEventForProperty(source, propertyname);
      // if no event name could be found
      if(eventName == null){

        // check if the propertyname is the event name
        if(qx.Class.supportsEvent(source.constructor, propertyname)){

          eventName = propertyname;
        } else if(qx.Class.supportsEvent(source.constructor, "change" + qx.lang.String.firstUp(propertyname))){

          eventName = "change" + qx.lang.String.firstUp(propertyname);
        } else {

          throw new qx.core.AssertionError("Binding property " + propertyname + " of object " + source + " not possible: No event available. ");
        };
      };
      return eventName;
    },
    /**
     * Resets the value of the given target after resolving the target property
     * chain.
     *
     * @param targetObject {qx.core.Object} The object where the property chain
     *   starts.
     * @param targetPropertyChain {String} The names of the properties,
     *   separated with a dot.
     */
    __resetTargetValue : function(targetObject, targetPropertyChain){

      // get the last target object of the chain
      var target = this.__getTargetFromChain(targetObject, targetPropertyChain);
      if(target != null){

        // get the name of the last property
        var lastProperty = targetPropertyChain.substring(targetPropertyChain.lastIndexOf(".") + 1, targetPropertyChain.length);
        // check for an array and set the value to null
        if(lastProperty.charAt(lastProperty.length - 1) == "]"){

          this.__setTargetValue(targetObject, targetPropertyChain, null);
          return;
        };
        // try to reset the property
        if(target["reset" + qx.lang.String.firstUp(lastProperty)] != undefined){

          target["reset" + qx.lang.String.firstUp(lastProperty)]();
        } else {

          // fallback if no resetter is given (see bug #2456)
          target["set" + qx.lang.String.firstUp(lastProperty)](null);
        };
      };
    },
    /**
     * Sets the given value to the given target after resolving the
     * target property chain.
     *
     * @param targetObject {qx.core.Object} The object where the property chain
     *   starts.
     * @param targetPropertyChain {String} The names of the properties,
     *   separated with a dot.
     * @param value {var} The value to set.
     */
    __setTargetValue : function(targetObject, targetPropertyChain, value){

      // get the last target object of the chain
      var target = this.__getTargetFromChain(targetObject, targetPropertyChain);
      if(target != null){

        // geht the name of the last property
        var lastProperty = targetPropertyChain.substring(targetPropertyChain.lastIndexOf(".") + 1, targetPropertyChain.length);
        // check for arrays
        if(lastProperty.charAt(lastProperty.length - 1) == "]"){

          // split up the chain into property and index
          var index = lastProperty.substring(lastProperty.lastIndexOf("[") + 1, lastProperty.length - 1);
          var prop = lastProperty.substring(0, lastProperty.lastIndexOf("["));
          // get the array
          var targetArray = targetObject;
          if(!qx.Class.implementsInterface(targetArray, qx.data.IListData)){

            targetArray = target["get" + qx.lang.String.firstUp(prop)]();
          };
          if(index == "last"){

            index = targetArray.length - 1;
          };
          if(targetArray != null){

            targetArray.setItem(index, value);
          };
        } else {

          // set the given value
          target["set" + qx.lang.String.firstUp(lastProperty)](value);
        };
      };
    },
    /**
     * Helper-Function resolving the object on which the last property of the
     * chain should be set.
     *
     * @param targetObject {qx.core.Object} The object where the property chain
     *   starts.
     * @param targetPropertyChain {String} The names of the properties,
     *   separated with a dot.
     * @return {qx.core.Object | null} The object on which the last property
     *   should be set.
     */
    __getTargetFromChain : function(targetObject, targetPropertyChain){

      var properties = targetPropertyChain.split(".");
      var target = targetObject;
      // ignore the last property
      for(var i = 0;i < properties.length - 1;i++){

        try{

          var property = properties[i];
          // if there is an array notation
          if(property.indexOf("]") == property.length - 1){

            var index = property.substring(property.indexOf("[") + 1, property.length - 1);
            property = property.substring(0, property.indexOf("["));
          };
          // in case there is a property infront of the brackets
          if(property != ""){

            target = target["get" + qx.lang.String.firstUp(property)]();
          };
          // if there is an index, we can be sure its an array
          if(index != null){

            // check for the 'last' notation
            if(index == "last"){

              index = target.length - 1;
            };
            // get the array item
            target = target.getItem(index);
            index = null;
          };
        } catch(ex) {

          return null;
        };
      };
      return target;
    },
    /**
     * Set the given value to the target property. This method is used for
     * initially set the value.
     *
     * @param value {var} The value to set.
     * @param targetObject {qx.core.Object} The object which contains the target
     *   property.
     * @param targetPropertyChain {String} The name of the target property in the
     *   target object.
     * @param options {Map} The options map perhaps containing the user defined
     *   converter.
     * @param sourceObject {qx.core.Object} The source object of the binding (
     *   used for the onUpdate callback).
     */
    __setInitialValue : function(value, targetObject, targetPropertyChain, options, sourceObject){

      // first convert the initial value
      value = this.__convertValue(value, targetObject, targetPropertyChain, options, sourceObject);
      // check if the converted value is undefined
      if(value === undefined){

        this.__resetTargetValue(targetObject, targetPropertyChain);
      };
      // only set the initial value if one is given (may be null)
      if(value !== undefined){

        try{

          this.__setTargetValue(targetObject, targetPropertyChain, value);
          // tell the user that the setter was invoked probably
          if(options && options.onUpdate){

            options.onUpdate(sourceObject, targetObject, value);
          };
        } catch(e) {

          if(!(e instanceof qx.core.ValidationError)){

            throw e;
          };
          if(options && options.onSetFail){

            options.onSetFail(e);
          } else {

            qx.log.Logger.warn("Failed so set value " + value + " on " + targetObject + ". Error message: " + e);
          };
        };
      };
    },
    /**
     * Checks for an array element in the given property names and adapts the
     * arrays to fit the algorithm.
     *
     * @param propertyNames {Array} The array containing the property names.
     *   Attention, this method can chang this parameter!!!
     * @return {Array} An array containing the values of the array properties
     *   corresponding to the property names.
     */
    __checkForArrayInPropertyChain : function(propertyNames){

      // array for the values of the array properties
      var arrayIndexValues = [];
      // go through all properties and check for array notations
      for(var i = 0;i < propertyNames.length;i++){

        var name = propertyNames[i];
        // if its an array property in the chain
        if(qx.lang.String.endsWith(name, "]")){

          // get the inner value of the array notation
          var arrayIndex = name.substring(name.indexOf("[") + 1, name.indexOf("]"));
          // check the arrayIndex
          if(name.indexOf("]") != name.length - 1){

            throw new Error("Please use only one array at a time: " + name + " does not work.");
          };
          if(arrayIndex !== "last"){

            if(arrayIndex == "" || isNaN(parseInt(arrayIndex, 10))){

              throw new Error('No number or \'last\' value hast been given in an array binding: ' + name + " does not work.");
            };
          };
          // if a property is infront of the array notation
          if(name.indexOf("[") != 0){

            // store the property name without the array notation
            propertyNames[i] = name.substring(0, name.indexOf("["));
            // store the values in the array for the current iteration
            arrayIndexValues[i] = "";
            // store the properties for the next iteration (the item of the array)
            arrayIndexValues[i + 1] = arrayIndex;
            propertyNames.splice(i + 1, 0, "item");
            // skip the next iteration. its the array item and its already set
            i++;
          } else {

            // store the array index and override the entry in the property names
            arrayIndexValues[i] = arrayIndex;
            propertyNames.splice(i, 1, "item");
          };
        } else {

          arrayIndexValues[i] = "";
        };
      };
      return arrayIndexValues;
    },
    /**
     * Internal helper method which is actually doing all bindings. That means
     * that an event listener will be added to the source object which listens
     * to the given event and invokes an set on the target property on the
     * targetObject.
     * This method does not store the binding in the internal reference store
     * so it should NOT be used from outside this class. For an outside usage,
     * use {@link #bind}.
     *
     * @param sourceObject {qx.core.Object} The source of the binding.
     * @param sourceEvent {String} The event of the source object which could
     *   be the change event in common but has to be an
     *   {@link qx.event.type.Data} event.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetProperty {String} The property name of the target object.
     * @param options {Map} A map containing the options. See
     *   {@link #bind} for more information.
     * @param arrayIndex {String} The index of the given array if its an array
     *   to bind.
     *
     * @return {var} Returns the internal id for that binding. This can be used
     *   for referencing the binding or e.g. for removing. This is not an atomic
     *   id so you can't you use it as a hash-map index. It's the id which will
     *   be returned by the {@link qx.core.Object#addListener} method.
     * @throws {qx.core.AssertionError} If the event is no data event or
     *   there is no property definition for the target object and target
     *   property.
     */
    __bindEventToProperty : function(sourceObject, sourceEvent, targetObject, targetProperty, options, arrayIndex){

      {

        var eventType;
      };
      var bindListener = function(arrayIndex, e){

        // if an array value is given
        if(arrayIndex !== ""){

          //check if its the "last" value
          if(arrayIndex === "last"){

            arrayIndex = sourceObject.length - 1;
          };
          // get the data of the array
          var data = sourceObject.getItem(arrayIndex);
          // reset the target if the data is not set
          if(data === undefined){

            qx.data.SingleValueBinding.__resetTargetValue(targetObject, targetProperty);
          };
          // only do something if the curren array has been changed
          var start = e.getData().start;
          var end = e.getData().end;
          if(arrayIndex < start || arrayIndex > end){

            return;
          };
        } else {

          // get the data out of the event
          var data = e.getData();
        };
        {
        };
        // convert the data
        data = qx.data.SingleValueBinding.__convertValue(data, targetObject, targetProperty, options, sourceObject);
        {
        };
        // try to set the value
        try{

          if(data !== undefined){

            qx.data.SingleValueBinding.__setTargetValue(targetObject, targetProperty, data);
          } else {

            qx.data.SingleValueBinding.__resetTargetValue(targetObject, targetProperty);
          };
          // tell the user that the setter was invoked probably
          if(options && options.onUpdate){

            options.onUpdate(sourceObject, targetObject, data);
          };
        } catch(ex) {

          if(!(ex instanceof qx.core.ValidationError)){

            throw ex;
          };
          if(options && options.onSetFail){

            options.onSetFail(ex);
          } else {

            qx.log.Logger.warn("Failed so set value " + data + " on " + targetObject + ". Error message: " + ex);
          };
        };
      };
      // check if an array index is given
      if(!arrayIndex){

        // if not, signal it a s an empty string
        arrayIndex = "";
      };
      // bind the listener function (make the array index in the listener available)
      bindListener = qx.lang.Function.bind(bindListener, sourceObject, arrayIndex);
      // add the listener
      var id = sourceObject.addListener(sourceEvent, bindListener);
      return id;
    },
    /**
     * This method stores the given value as a binding in the internal structure
     * of all bindings.
     *
     * @param id {var} The listener id of the id for a deeper binding.
     * @param sourceObject {qx.core.Object} The source Object of the binding.
     * @param sourceEvent {String} The name of the source event.
     * @param targetObject {qx.core.Object} The target object.
     * @param targetProperty {String} The name of the property on the target
     *   object.
     */
    __storeBinding : function(id, sourceObject, sourceEvent, targetObject, targetProperty){

      // add the listener id to the internal registry
      if(this.__bindings[sourceObject.toHashCode()] === undefined){

        this.__bindings[sourceObject.toHashCode()] = [];
      };
      this.__bindings[sourceObject.toHashCode()].push([id, sourceObject, sourceEvent, targetObject, targetProperty]);
    },
    /**
     * This method takes the given value, checks if the user has given a
     * converter and converts the value to its target type. If no converter is
     * given by the user, the {@link #__defaultConversion} will try to convert
     * the value.
     *
     * @param value {var} The value which possibly should be converted.
     * @param targetObject {qx.core.Object} The target object.
     * @param targetPropertyChain {String} The property name of the target object.
     * @param options {Map} The options map which can includes the converter.
     *   For a detailed information on the map, take a look at
     *   {@link #bind}.
     * @param sourceObject {qx.core.Object} The source obejct for the binding.
     *
     * @return {var} The converted value. If no conversion has been done, the
     *   value property will be returned.
     * @throws {qx.core.AssertionError} If there is no property definition
     *   of the given target object and target property.
     */
    __convertValue : function(value, targetObject, targetPropertyChain, options, sourceObject){

      // do the conversion given by the user
      if(options && options.converter){

        var model;
        if(targetObject.getModel){

          model = targetObject.getModel();
        };
        return options.converter(value, model, sourceObject, targetObject);
      } else {

        var target = this.__getTargetFromChain(targetObject, targetPropertyChain);
        var lastProperty = targetPropertyChain.substring(targetPropertyChain.lastIndexOf(".") + 1, targetPropertyChain.length);
        // if no target is currently available, return the original value
        if(target == null){

          return value;
        };
        var propertieDefinition = qx.Class.getPropertyDefinition(target.constructor, lastProperty);
        var check = propertieDefinition == null ? "" : propertieDefinition.check;
        return this.__defaultConversion(value, check);
      };
    },
    /**
     * Helper method which tries to figure out if the given property on the
     * given object does have a change event and if returns the name of it.
     *
     * @param sourceObject {qx.core.Object} The object to check.
     * @param sourceProperty {String} The name of the property.
     *
     * @return {String} The name of the change event.
     * @throws {qx.core.AssertionError} If there is no property definition of
     *   the given object property pair.
     */
    __getEventForProperty : function(sourceObject, sourceProperty){

      // get the event name
      var propertieDefinition = qx.Class.getPropertyDefinition(sourceObject.constructor, sourceProperty);
      if(propertieDefinition == null){

        return null;
      };
      return propertieDefinition.event;
    },
    /**
     * Tries to convert the data to the type given in the targetCheck argument.
     *
     * @param data {var} The data to convert.
     * @param targetCheck {String} The value of the check property. That usually
     *   contains the target type.
     * @return {Integer|String|Float} The converted data
     */
    __defaultConversion : function(data, targetCheck){

      var dataType = qx.lang.Type.getClass(data);
      // to integer
      if((dataType == "Number" || dataType == "String") && (targetCheck == "Integer" || targetCheck == "PositiveInteger")){

        data = parseInt(data, 10);
      };
      // to string
      if((dataType == "Boolean" || dataType == "Number" || dataType == "Date") && targetCheck == "String"){

        data = data + "";
      };
      // to float
      if((dataType == "Number" || dataType == "String") && (targetCheck == "Number" || targetCheck == "PositiveNumber")){

        data = parseFloat(data);
      };
      return data;
    },
    /**
     * Removes the binding with the given id from the given sourceObject. The
     * id hast to be the id returned by any of the bind functions.
     *
     * @param sourceObject {qx.core.Object} The source object of the binding.
     * @param id {var} The id of the binding.
     * @throws {Error} If the binding could not be found.
     */
    removeBindingFromObject : function(sourceObject, id){

      // check for a deep binding
      if(id.type == "deepBinding"){

        // go threw all added listeners (source)
        for(var i = 0;i < id.sources.length;i++){

          // check if a source is available
          if(id.sources[i]){

            id.sources[i].removeListenerById(id.listenerIds[i]);
          };
        };
        // go threw all added listeners (target)
        for(var i = 0;i < id.targets.length;i++){

          // check if a target is available
          if(id.targets[i]){

            id.targets[i].removeListenerById(id.targetListenerIds[i]);
          };
        };
      } else {

        // remove the listener
        sourceObject.removeListenerById(id);
      };
      // remove the id from the internal reference system
      var bindings = this.__bindings[sourceObject.toHashCode()];
      // check if the binding exists
      if(bindings != undefined){

        for(var i = 0;i < bindings.length;i++){

          if(bindings[i][0] == id){

            qx.lang.Array.remove(bindings, bindings[i]);
            return;
          };
        };
      };
      throw new Error("Binding could not be found!");
    },
    /**
     * Removes all bindings for the given object.
     *
     * @param object {qx.core.Object} The object of which the bindings should be
     *   removed.
     * @throws {qx.core.AssertionError} If the object is not in the internal
     *   registry of the bindings.
     * @throws {Error} If one of the bindings listed internally can not be
     *   removed.
     */
    removeAllBindingsForObject : function(object){

      {
      };
      // get the bindings
      var bindings = this.__bindings[object.toHashCode()];
      if(bindings != undefined){

        // remove every binding with the removeBindingFromObject function
        for(var i = bindings.length - 1;i >= 0;i--){

          this.removeBindingFromObject(object, bindings[i][0]);
        };
      };
    },
    /**
     * Returns an array which lists all bindings.
     *
     * @param object {qx.core.Object} The object of which the bindings should
     *   be returned.
     *
     * @return {Array} An array of binding informations. Every binding
     *   information is an array itself containing id, sourceObject,
     *   sourceEvent, targetObject and targetProperty in that order.
     */
    getAllBindingsForObject : function(object){

      // create an empty array if no binding exists
      if(this.__bindings[object.toHashCode()] === undefined){

        this.__bindings[object.toHashCode()] = [];
      };
      return this.__bindings[object.toHashCode()];
    },
    /**
     * Removes all binding in the whole application. After that not a single
     * binding is left.
     */
    removeAllBindings : function(){

      // go threw all registerd objects
      for(var hash in this.__bindings){

        var object = qx.core.ObjectRegistry.fromHashCode(hash);
        // check for the object, perhaps its already deleted
        if(object == null){

          delete this.__bindings[hash];
          continue;
        };
        this.removeAllBindingsForObject(object);
      };
      // reset the bindings map
      this.__bindings = {
      };
    },
    /**
     * Returns a map containing for every bound object an array of data binding
     * information. The key of the map is the hashcode of the bound objects.
     * Every binding is represented by an array containing id, sourceObject,
     * sourceEvent, targetObject and targetProperty.
     *
     * @return {Map} Map containing all bindings.
     */
    getAllBindings : function(){

      return this.__bindings;
    },
    /**
     * Debug function which shows some valuable information about the given
     * binding in console. For that it uses {@link qx.log.Logger}.
     *
     * @param object {qx.core.Object} the source of the binding.
     * @param id {var} The id of the binding.
     */
    showBindingInLog : function(object, id){

      var binding;
      // go threw all bindings of the given object
      for(var i = 0;i < this.__bindings[object.toHashCode()].length;i++){

        // the first array item is the id
        if(this.__bindings[object.toHashCode()][i][0] == id){

          binding = this.__bindings[object.toHashCode()][i];
          break;
        };
      };
      if(binding === undefined){

        var message = "Binding does not exist!";
      } else {

        var message = "Binding from '" + binding[1] + "' (" + binding[2] + ") to the object '" + binding[3] + "' (" + binding[4] + ").";
      };
      qx.log.Logger.debug(message);
    },
    /**
     * Debug function which shows all bindings in the log console. To get only
     * one binding in the console use {@link #showBindingInLog}
     */
    showAllBindingsInLog : function(){

      // go threw all objects in the registry
      for(var hash in this.__bindings){

        var object = qx.core.ObjectRegistry.fromHashCode(hash);
        for(var i = 0;i < this.__bindings[hash].length;i++){

          this.showBindingInLog(object, this.__bindings[hash][i][0]);
        };
      };
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This interface defines a data structure compatible with the data binding
 * controllers.
 * It defines a minimum of functionality which the controller need to work.
 */
qx.Interface.define("qx.data.IListData", {
  events : {
    /**
     * The change event which will be fired if there is a change in the data
     * structure.The data should contain a map with three key value pairs:
     * <li>start: The start index of the change.</li>
     * <li>end: The end index of the change.</li>
     * <li>type: The type of the change as a String. This can be 'add',
     * 'remove' or 'order'</li>
     * <li>item: The item which has been changed.</li>
     */
    "change" : "qx.event.type.Data",
    /**
     * The changeLength event will be fired every time the length of the
     * data structure changes.
     */
    "changeLength" : "qx.event.type.Event"
  },
  members : {
    /**
     * Returns the item at the given index
     *
     * @param index {Number} The index requested of the data element.
     *
     * @return {var} The element at the given index.
     */
    getItem : function(index){
    },
    /**
     * Sets the given item at the given position in the data structure. A
     * change event has to be fired.
     *
     * @param index {Number} The index of the data element.
     * @param item {var} The new item to set.
     */
    setItem : function(index, item){
    },
    /**
     * Method to remove and add new element to the data. For every remove or
     * add a change event should be fired.
     *
     * @param startIndex {Integer} The index where the splice should start
     * @param amount {Integer} Defines number of element which will be removed
     *   at the given position.
     * @param varargs {var} All following parameters will be added at the given
     *   position to the array.
     * @return {qx.data.Array} An array containing the removed elements.
     */
    splice : function(startIndex, amount, varargs){
    },
    /**
     * Check if the given item is in the current data structure.
     *
     * @param item {var} The item which is possibly in the data structure.
     * @return {Boolean} true, if the array contains the given item.
     */
    contains : function(item){
    },
    /**
     * Returns the current length of the data structure.
     *
     * @return {Number} The current length of the data structure.
     */
    getLength : function(){
    },
    /**
     * Returns the list data as native array.
     *
     * @return {Array} The native array.
     */
    toArray : function(){
    }
  }
});

/* ************************************************************************

  qooxdoo - the new era of web development

  http://qooxdoo.org

  Copyright:
    2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

  License:
    LGPL: http://www.gnu.org/licenses/lgpl.html
    EPL: http://www.eclipse.org/org/documents/epl-v10.php
    See the LICENSE file in the project's top-level directory for details.

  Authors:
    * Fabian Jakobs (fjakobs)
    * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This class is the common super class for all error classes in qooxdoo.
 *
 * It has a comment and a fail message as members. The toString method returns
 * the comment and the fail message separated by a colon.
 */
qx.Class.define("qx.type.BaseError", {
  extend : Error,
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  /**
   * @param comment {String} Comment passed to the assertion call
   * @param failMessage {String} Fail message provided by the assertion
   */
  construct : function(comment, failMessage){

    var inst = Error.call(this, failMessage);
    // map stack trace properties since they're not added by Error's constructor
    if(inst.stack){

      this.stack = inst.stack;
    };
    if(inst.stacktrace){

      this.stacktrace = inst.stacktrace;
    };
    this.__comment = comment || "";
    // opera 10 crashes if the message is an empty string!!!?!?!
    this.message = failMessage || qx.type.BaseError.DEFAULTMESSAGE;
  },
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    DEFAULTMESSAGE : "error"
  },
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    __sTrace : null,
    __comment : null,
    /** @type {String} Fail message provided by the assertion */
    message : null,
    /**
     * Comment passed to the assertion call
     *
     * @return {String} The comment passed to the assertion call
     */
    getComment : function(){

      return this.__comment;
    },
    /**
     * Get the error message
     *
     * @return {String} The error message
     */
    toString : function(){

      return this.__comment + (this.message ? ": " + this.message : "");
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * Assertion errors are thrown if an assertion in {@link qx.core.Assert}
 * fails.
 */
qx.Class.define("qx.core.AssertionError", {
  extend : qx.type.BaseError,
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  /**
   * @param comment {String} Comment passed to the assertion call
   * @param failMessage {String} Fail message provided by the assertion
   */
  construct : function(comment, failMessage){

    qx.type.BaseError.call(this, comment, failMessage);
    this.__trace = qx.dev.StackTrace.getStackTrace();
  },
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    __trace : null,
    /**
     * Stack trace of the error
     *
     * @return {String[]} The stack trace of the location the exception was thrown
     */
    getStackTrace : function(){

      return this.__trace;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * Methods to get information about the JavaScript call stack.
 *
 * @require(qx.lang.normalize.String)
 * @ignore(qx.bom.client.EcmaScript.*)
 * @ignore(qx.Class.*)
 */
qx.Bootstrap.define("qx.dev.StackTrace", {
  statics : {
    /**
     * Optional user-defined function to convert source file names into readable
     * class names. Will be called with the source file name extracted from the
     * browser's stack trace information as the only argument. The returned
     * string is used in the output of {@link #getStackTraceFromError}
     */
    FILENAME_TO_CLASSNAME : null,
    /**
     * Optional user-defined formatting function for stack trace information.
     * Will be called by with an array of strings representing the calls in the
     * stack trace. {@link #getStackTraceFromError} will return the output of
     * this function. Must return an array of strings.
     */
    FORMAT_STACKTRACE : null,
    /**
     * Get a stack trace of the current position in the code.
     *
     * Browser compatibility:
     * <ul>
     *   <li>In new versions of Gecko, WebKit and Opera, the output of
     *   {@link #getStackTraceFromError} and {@link #getStackTraceFromCaller} is
     *   combined to generate the richest trace, including line numbers.</li>
     *   <li>For Internet Explorer (and other engines that do not provide stack
     *    traces), {@link #getStackTraceFromCaller} is used</li>
     * </ul>
     *
     * @return {String[]} Stack trace of the current position in the code. Each line in the array
     *     represents one call in the stack trace.
     */
    getStackTrace : function(){

      var trace = [];
      try{

        throw new Error();
      } catch(ex) {

        if(qx.dev.StackTrace.hasEnvironmentCheck && qx.core.Environment.get("ecmascript.error.stacktrace")){

          var errorTrace = qx.dev.StackTrace.getStackTraceFromError(ex);
          var callerTrace = qx.dev.StackTrace.getStackTraceFromCaller(arguments);
          qx.lang.Array.removeAt(errorTrace, 0);
          trace = callerTrace.length > errorTrace.length ? callerTrace : errorTrace;
          for(var i = 0;i < Math.min(callerTrace.length, errorTrace.length);i++){

            var callerCall = callerTrace[i];
            if(callerCall.indexOf("anonymous") >= 0){

              continue;
            };
            var methodName = null;
            var callerArr = callerCall.split(".");
            var mO = /(.*?)\(/.exec(callerArr[callerArr.length - 1]);
            if(mO && mO.length == 2){

              methodName = mO[1];
              callerArr.pop();
            };
            if(callerArr[callerArr.length - 1] == "prototype"){

              callerArr.pop();
            };
            var callerClassName = callerArr.join(".");
            var errorCall = errorTrace[i];
            var errorArr = errorCall.split(":");
            var errorClassName = errorArr[0];
            var lineNumber = errorArr[1];
            var columnNumber;
            if(errorArr[2]){

              columnNumber = errorArr[2];
            };
            var className = null;
            if(qx.Class && qx.Class.getByName(errorClassName)){

              className = errorClassName;
            } else {

              className = callerClassName;
            };
            var line = className;
            if(methodName){

              line += "." + methodName;
            };
            line += ":" + lineNumber;
            if(columnNumber){

              line += ":" + columnNumber;
            };
            trace[i] = line;
          };
        } else {

          trace = this.getStackTraceFromCaller(arguments);
        };
      };
      return trace;
    },
    /**
     * Get a stack trace from the arguments special variable using the
     * <code>caller</code> property.
     *
     * This methods returns class/mixin and function names of each step
     * in the call stack.
     *
     * Recursion is not supported.
     *
     * @param args {arguments} arguments variable.
     * @return {String[]} Stack trace of caller of the function the arguments variable belongs to.
     *     Each line in the array represents one call in the stack trace.
     * @signature function(args)
     */
    getStackTraceFromCaller : function(args){

      var trace = [];
      var fcn = qx.lang.Function.getCaller(args);
      var knownFunction = {
      };
      while(fcn){

        var fcnName = qx.lang.Function.getName(fcn);
        trace.push(fcnName);
        try{

          fcn = fcn.caller;
        } catch(ex) {

          break;
        };
        if(!fcn){

          break;
        };
        // avoid infinite recursion
        var hash = qx.core.ObjectRegistry.toHashCode(fcn);
        if(knownFunction[hash]){

          trace.push("...");
          break;
        };
        knownFunction[hash] = fcn;
      };
      return trace;
    },
    /**
     * Try to get a stack trace from an Error object. Mozilla sets the field
     * <code>stack</code> for Error objects thrown using <code>throw new Error()</code>.
     * From this field it is possible to get a stack trace from the position
     * the exception was thrown at.
     *
     * This will get the JavaScript file names and the line numbers of each call.
     * The file names are converted into qooxdoo class names if possible (customizable
     * via {@link #FILENAME_TO_CLASSNAME}).
     *
     * The stack trace can be custom formatted using {@link #FORMAT_STACKTRACE}.
     *
     * This works reliably in Gecko-based browsers. Later Opera versions and
     * Chrome also provide a useful stack trace. For Safari, only the class or
     * file name and line number where the error occurred are returned.
     * IE 6/7/8/9 does not attach any stack information to error objects so an
     * empty array is returned.
     *
     * @param error {Error} Error exception instance.
     * @return {String[]} Stack trace of the exception. Each line in the array
     *     represents one call in the stack trace.
     */
    getStackTraceFromError : function(error){

      var trace = [];
      var lineRe,hit,className,lineNumber,columnNumber,fileName,url;
      var traceProp = qx.dev.StackTrace.hasEnvironmentCheck ? qx.core.Environment.get("ecmascript.error.stacktrace") : null;
      if(traceProp === "stack"){

        if(!error.stack){

          return trace;
        };
        // Gecko style, e.g. "()@http://localhost:8080/webcomponent-test-SNAPSHOT/webcomponent/js/com/ptvag/webcomponent/common/log/Logger:253"
        lineRe = /@(.+):(\d+)$/gm;
        while((hit = lineRe.exec(error.stack)) != null){

          url = hit[1];
          lineNumber = hit[2];
          className = this.__fileNameToClassName(url);
          trace.push(className + ":" + lineNumber);
        };
        if(trace.length > 0){

          return this.__formatStackTrace(trace);
        };
        /*
         * Chrome trace info comes in two flavors:
         * at [jsObject].function (fileUrl:line:char)
         * at fileUrl:line:char
         */
        lineRe = /at (.*)/gm;
        var fileReParens = /\((.*?)(:[^\/].*)\)/;
        var fileRe = /(.*?)(:[^\/].*)/;
        while((hit = lineRe.exec(error.stack)) != null){

          var fileMatch = fileReParens.exec(hit[1]);
          if(!fileMatch){

            fileMatch = fileRe.exec(hit[1]);
          };
          if(fileMatch){

            className = this.__fileNameToClassName(fileMatch[1]);
            trace.push(className + fileMatch[2]);
          } else {

            trace.push(hit[1]);
          };
        };
      } else if(traceProp === "stacktrace"){

        // Opera
        var stacktrace = error.stacktrace;
        if(!stacktrace){

          return trace;
        };
        if(stacktrace.indexOf("Error created at") >= 0){

          stacktrace = stacktrace.split("Error created at")[0];
        };
        // new Opera style (10.6+)
        lineRe = /line\ (\d+?),\ column\ (\d+?)\ in\ (?:.*?)\ in\ (.*?):[^\/]/gm;
        while((hit = lineRe.exec(stacktrace)) != null){

          lineNumber = hit[1];
          columnNumber = hit[2];
          url = hit[3];
          className = this.__fileNameToClassName(url);
          trace.push(className + ":" + lineNumber + ":" + columnNumber);
        };
        if(trace.length > 0){

          return this.__formatStackTrace(trace);
        };
        // older Opera style
        lineRe = /Line\ (\d+?)\ of\ linked\ script\ (.*?)$/gm;
        while((hit = lineRe.exec(stacktrace)) != null){

          lineNumber = hit[1];
          url = hit[2];
          className = this.__fileNameToClassName(url);
          trace.push(className + ":" + lineNumber);
        };
      } else if(error.message && error.message.indexOf("Backtrace:") >= 0){

        // Some old Opera versions append the trace to the message property
        var traceString = error.message.split("Backtrace:")[1].trim();
        var lines = traceString.split("\n");
        for(var i = 0;i < lines.length;i++){

          var reResult = lines[i].match(/\s*Line ([0-9]+) of.* (\S.*)/);
          if(reResult && reResult.length >= 2){

            lineNumber = reResult[1];
            fileName = this.__fileNameToClassName(reResult[2]);
            trace.push(fileName + ":" + lineNumber);
          };
        };
      } else if(error.sourceURL && error.line){

        // Safari
        trace.push(this.__fileNameToClassName(error.sourceURL) + ":" + error.line);
      };;;
      return this.__formatStackTrace(trace);
    },
    /**
     * Converts the URL of a JavaScript file to a class name using either a
     * user-defined ({@link #FILENAME_TO_CLASSNAME}) or default
     * ({@link #__fileNameToClassNameDefault}) converter
     *
     * @param fileName {String} URL of the JavaScript file
     * @return {String} Result of the conversion
     */
    __fileNameToClassName : function(fileName){

      if(typeof qx.dev.StackTrace.FILENAME_TO_CLASSNAME == "function"){

        var convertedName = qx.dev.StackTrace.FILENAME_TO_CLASSNAME(fileName);
        {
        };
        return convertedName;
      };
      return qx.dev.StackTrace.__fileNameToClassNameDefault(fileName);
    },
    /**
     * Converts the URL of a JavaScript file to a class name if the file is
     * named using the qooxdoo naming conventions.
     *
     * @param fileName {String} URL of the JavaScript file
     * @return {String} class name of the file if conversion was possible.
     * Otherwise the fileName is returned unmodified.
     */
    __fileNameToClassNameDefault : function(fileName){

      var scriptDir = "/source/class/";
      var jsPos = fileName.indexOf(scriptDir);
      var paramPos = fileName.indexOf("?");
      if(paramPos >= 0){

        fileName = fileName.substring(0, paramPos);
      };
      var className = (jsPos == -1) ? fileName : fileName.substring(jsPos + scriptDir.length).replace(/\//g, ".").replace(/\.js$/, "");
      return className;
    },
    /**
     * Runs the given stack trace array through the formatter function
     * ({@link #FORMAT_STACKTRACE}) if available and returns it. Otherwise, the
     * original array is returned
     *
     * @param trace {String[]} Stack trace information
     * @return {String[]} Formatted stack trace info
     */
    __formatStackTrace : function(trace){

      if(typeof qx.dev.StackTrace.FORMAT_STACKTRACE == "function"){

        trace = qx.dev.StackTrace.FORMAT_STACKTRACE(trace);
        {
        };
      };
      return trace;
    }
  },
  defer : function(statics){

    // This is necessary to avoid an infinite loop when logging the absence
    // of the "ecmascript.error.stacktrace" environment key.
    statics.hasEnvironmentCheck = qx.bom.client.EcmaScript && qx.bom.client.EcmaScript.getStackTrace;
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */
/**
 * Registration for all instances of qooxdoo classes. Mainly
 * used to manage them for the final shutdown sequence and to
 * use weak references when connecting widgets to DOM nodes etc.
 *
 * @ignore(qx.dev, qx.dev.Debug.*)
 */
qx.Bootstrap.define("qx.core.ObjectRegistry", {
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /** @type {Boolean} Whether the application is in the shutdown phase */
    inShutDown : false,
    /** @type {Map} Internal data structure to store objects */
    __registry : {
    },
    /** @type {Integer} Next new hash code. */
    __nextHash : 0,
    /** @type {Array} List of all free hash codes */
    __freeHashes : [],
    /** @type {String} Post id for hash code creation. */
    __postId : "",
    /** @type {Map} Object hashes to stack traces (for dispose profiling only) */
    __stackTraces : {
    },
    /**
     * Registers an object into the database. This adds a hashcode
     * to the object (if not already done before) and stores it under
     * this hashcode. You can access this object later using the hashcode
     * by calling {@link #fromHashCode}.
     *
     * All registered objects are automatically disposed on application
     * shutdown. Each registered object must at least have a method
     * called <code>dispose</code>.
     *
     * @param obj {Object} Any object with a dispose() method
     */
    register : function(obj){

      var registry = this.__registry;
      if(!registry){

        return;
      };
      var hash = obj.$$hash;
      if(hash == null){

        // Create new hash code
        var cache = this.__freeHashes;
        if(cache.length > 0 && true){

          hash = cache.pop();
        } else {

          hash = (this.__nextHash++) + this.__postId;
        };
        // Store hash code
        obj.$$hash = hash;
        {
        };
      };
      {
      };
      registry[hash] = obj;
    },
    /**
     * Removes the given object from the database.
     *
     * @param obj {Object} Any previously registered object
     */
    unregister : function(obj){

      var hash = obj.$$hash;
      if(hash == null){

        return;
      };
      var registry = this.__registry;
      if(registry && registry[hash]){

        delete registry[hash];
        this.__freeHashes.push(hash);
      };
      // Delete the hash code
      try{

        delete obj.$$hash;
      } catch(ex) {

        // IE has trouble directly removing the hash
        // but it's ok with using removeAttribute
        if(obj.removeAttribute){

          obj.removeAttribute("$$hash");
        };
      };
    },
    /**
     * Returns an unique identifier for the given object. If such an identifier
     * does not yet exist, create it.
     *
     * @param obj {Object} the object to get the hashcode for
     * @return {String} unique identifier for the given object
     */
    toHashCode : function(obj){

      {
      };
      var hash = obj.$$hash;
      if(hash != null){

        return hash;
      };
      // Create new hash code
      var cache = this.__freeHashes;
      if(cache.length > 0){

        hash = cache.pop();
      } else {

        hash = (this.__nextHash++) + this.__postId;
      };
      // Store
      return obj.$$hash = hash;
    },
    /**
     * Clears the unique identifier on the given object.
     *
     * @param obj {Object} the object to clear the hashcode for
     */
    clearHashCode : function(obj){

      {
      };
      var hash = obj.$$hash;
      if(hash != null){

        this.__freeHashes.push(hash);
        // Delete the hash code
        try{

          delete obj.$$hash;
        } catch(ex) {

          // IE has trouble directly removing the hash
          // but it's ok with using removeAttribute
          if(obj.removeAttribute){

            obj.removeAttribute("$$hash");
          };
        };
      };
    },
    /**
     * Get an object instance by its hash code as returned by {@link #toHashCode}.
     * If the object is already disposed or the hashCode is invalid,
     * <code>null</code> is returned.
     *
     * @param hash {String} The object's hash code.
     * @return {qx.core.Object} The corresponding object or <code>null</code>.
     */
    fromHashCode : function(hash){

      return this.__registry[hash] || null;
    },
    /**
     * Disposing all registered object and cleaning up registry. This is
     * automatically executed at application shutdown.
     *
     */
    shutdown : function(){

      this.inShutDown = true;
      var registry = this.__registry;
      var hashes = [];
      for(var hash in registry){

        hashes.push(hash);
      };
      // sort the objects! Remove the objecs created at startup
      // as late as possible
      hashes.sort(function(a, b){

        return parseInt(b, 10) - parseInt(a, 10);
      });
      var obj,i = 0,l = hashes.length;
      while(true){

        try{

          for(;i < l;i++){

            hash = hashes[i];
            obj = registry[hash];
            if(obj && obj.dispose){

              obj.dispose();
            };
          };
        } catch(ex) {

          qx.Bootstrap.error(this, "Could not dispose object " + obj.toString() + ": " + ex, ex);
          if(i !== l){

            i++;
            continue;
          };
        };
        break;
      };
      qx.Bootstrap.debug(this, "Disposed " + l + " objects");
      delete this.__registry;
    },
    /**
     * Returns the object registry.
     *
     * @return {Object} The registry
     */
    getRegistry : function(){

      return this.__registry;
    },
    /**
     * Returns the next hash code that will be used
     *
     * @return {Integer} The next hash code
     * @internal
     */
    getNextHash : function(){

      return this.__nextHash;
    },
    /**
     * Returns the postfix that identifies the current iframe
     *
     * @return {Integer} The next hash code
     * @internal
     */
    getPostId : function(){

      return this.__postId;
    },
    /**
     * Returns the map of stack traces recorded when objects are registered
     * (for dispose profiling)
     * @return {Map} Map: object hash codes to stack traces
     * @internal
     */
    getStackTraces : function(){

      return this.__stackTraces;
    }
  },
  defer : function(statics){

    if(window && window.top){

      var frames = window.top.frames;
      for(var i = 0;i < frames.length;i++){

        if(frames[i] === window){

          statics.__postId = "-" + (i + 1);
          return;
        };
      };
    };
    statics.__postId = "-0";
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
 * A validation Error which should be thrown if a validation fails.
 */
qx.Class.define("qx.core.ValidationError", {
  extend : qx.type.BaseError
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 STZ-IDA, Germany, http://www.stz-ida.de
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Carsten Lergenmueller (carstenl)
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * An memory container which stores arbitrary data up to a maximum number of
 * entries. When new entries come in an the maximum is reached, the oldest
 * entries are deleted.
 *
 * A mark feature also exists which can be used to remember a point in time.
 * When retrieving entriues, it is possible to get only those entries
 * after the marked time. This is useful if data from the buffer is extracted
 * and processed. Whenever this happens, a mark() call can be used so that the
 * next extraction will only get new data.
 */
qx.Bootstrap.define("qx.util.RingBuffer", {
  extend : Object,
  /**
   * Constructor.
   *
   * @param maxEntries {Integer ? 50} Maximum number of entries in the buffer
   */
  construct : function(maxEntries){

    this.setMaxEntries(maxEntries || 50);
  },
  members : {
    //Next slot in ringbuffer to use
    __nextIndexToStoreTo : 0,
    //Number of elements in ring buffer
    __entriesStored : 0,
    //Was a mark set?
    __isMarkActive : false,
    //How many elements were stored since setting of mark?
    __entriesStoredSinceMark : 0,
    //ring buffer
    __entries : null,
    //Maximum number of messages to store. Could be converted to a qx property.
    __maxEntries : null,
    /**
     * Set the maximum number of messages to hold. If null the number of
     * messages is not limited.
     *
     * Warning: Changing this property will clear the events logged so far.
     *
     * @param maxEntries {Integer} the maximum number of messages to hold
     */
    setMaxEntries : function(maxEntries){

      this.__maxEntries = maxEntries;
      this.clear();
    },
    /**
     * Get the maximum number of entries to hold
     *
     * @return {Integer}
     */
    getMaxEntries : function(){

      return this.__maxEntries;
    },
    /**
     * Adds a single entry
     *
     * @param entry {var} The data to store
     */
    addEntry : function(entry){

      this.__entries[this.__nextIndexToStoreTo] = entry;
      this.__nextIndexToStoreTo = this.__addToIndex(this.__nextIndexToStoreTo, 1);
      //Count # of stored entries
      var max = this.getMaxEntries();
      if(this.__entriesStored < max){

        this.__entriesStored++;
      };
      //Count # of stored elements since last mark call
      if(this.__isMarkActive && (this.__entriesStoredSinceMark < max)){

        this.__entriesStoredSinceMark++;
      };
    },
    /**
     * Remembers the current position in the ring buffer
     *
     */
    mark : function(){

      this.__isMarkActive = true;
      this.__entriesStoredSinceMark = 0;
    },
    /**
     * Removes the current mark position
     */
    clearMark : function(){

      this.__isMarkActive = false;
    },
    /**
     * Returns all stored entries. Mark is ignored.
     *
     * @return {Array} array of stored entries
     */
    getAllEntries : function(){

      return this.getEntries(this.getMaxEntries(), false);
    },
    /**
     * Returns entries which have been added previously.
     *
     * @param count {Integer} The number of entries to retrieve. If there are
     *    more entries than the given count, the oldest ones will not be returned.
     *
     * @param startingFromMark {Boolean ? false} If true, only entries since
     *   the last call to mark() will be returned
     * @return {Array} array of stored entries
     */
    getEntries : function(count, startingFromMark){

      //Trim count so it does not exceed ringbuffer size
      if(count > this.__entriesStored){

        count = this.__entriesStored;
      };
      // Trim count so it does not exceed last call to mark (if mark was called
      // and startingFromMark was true)
      if(startingFromMark && this.__isMarkActive && (count > this.__entriesStoredSinceMark)){

        count = this.__entriesStoredSinceMark;
      };
      if(count > 0){

        var indexOfYoungestElementInHistory = this.__addToIndex(this.__nextIndexToStoreTo, -1);
        var startIndex = this.__addToIndex(indexOfYoungestElementInHistory, -count + 1);
        var result;
        if(startIndex <= indexOfYoungestElementInHistory){

          //Requested segment not wrapping around ringbuffer boundary, get in one run
          result = this.__entries.slice(startIndex, indexOfYoungestElementInHistory + 1);
        } else {

          //Requested segment wrapping around ringbuffer boundary, get two parts & concat
          result = this.__entries.slice(startIndex, this.__entriesStored).concat(this.__entries.slice(0, indexOfYoungestElementInHistory + 1));
        };
      } else {

        result = [];
      };
      return result;
    },
    /**
     * Clears all entries
     */
    clear : function(){

      this.__entries = new Array(this.getMaxEntries());
      this.__entriesStored = 0;
      this.__entriesStoredSinceMark = 0;
      this.__nextIndexToStoreTo = 0;
    },
    /**
     * Adds a number to an ringbuffer index. Does a modulus calculation,
     * i. e. if the index leaves the ringbuffer space it will wrap around to
     * the other end of the ringbuffer.
     *
     * @param idx {Number} The current index.
     * @param addMe {Number} The number to add.
     * @return {Number} The new index
     */
    __addToIndex : function(idx, addMe){

      var max = this.getMaxEntries();
      var result = (idx + addMe) % max;
      //If negative, wrap up into the ringbuffer space
      if(result < 0){

        result += max;
      };
      return result;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 STZ-IDA, Germany, http://www.stz-ida.de
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Carsten Lergenmueller (carstenl)
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * An appender that writes all messages to a memory container. The messages
 * can be retrieved later, f. i. when an error dialog pops up and the question
 * arises what actions have caused the error.
 *
 * A mark feature also exists which can be used to remember a point in time.
 * When retrieving log events, it is possible to get only those events
 * after the marked time. This is useful if data from the buffer is extracted
 * and f. i. sent to a logging system. Whenever this happens, a mark() call
 * can be used so that the next extraction will only get new data.
 */
qx.Bootstrap.define("qx.log.appender.RingBuffer", {
  extend : qx.util.RingBuffer,
  /**
   * @param maxMessages {Integer?50} Maximum number of messages in the buffer
   */
  construct : function(maxMessages){

    this.setMaxMessages(maxMessages || 50);
  },
  members : {
    /**
     * Set the maximum number of messages to hold. If null the number of
     * messages is not limited.
     *
     * Warning: Changing this property will clear the events logged so far.
     *
     * @param maxMessages {Integer} the maximum number of messages to hold
     */
    setMaxMessages : function(maxMessages){

      this.setMaxEntries(maxMessages);
    },
    /**
     * Get the maximum number of messages to hold
     *
     * @return {Integer} the maximum number of messages
     */
    getMaxMessages : function(){

      return this.getMaxEntries();
    },
    /**
     * Processes a single log entry
     *
     * @param entry {Map} The entry to process
     */
    process : function(entry){

      this.addEntry(entry);
    },
    /**
     * Returns all stored log events
     *
     * @return {Array} array of stored log events
     */
    getAllLogEvents : function(){

      return this.getAllEntries();
    },
    /**
     * Returns log events which have been logged previously.
     *
     * @param count {Integer} The number of events to retrieve. If there are
     *    more events than the given count, the oldest ones will not be returned.
     *
     * @param startingFromMark {Boolean ? false} If true, only entries since the last call to mark()
     *                                           will be returned
     * @return {Array} array of stored log events
     */
    retrieveLogEvents : function(count, startingFromMark){

      return this.getEntries(count, startingFromMark);
    },
    /**
     * Clears the log history
     */
    clearHistory : function(){

      this.clear();
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

************************************************************************ */
/**
 * Main qooxdoo logging class.
 *
 * Used as central logging feature by qx.core.Object.
 *
 * Extremely modular and lightweight to support logging at bootstrap and
 * at shutdown as well.
 *
 * * Supports dynamic appenders to push the output to the user
 * * Supports buffering of the last 50 messages (configurable)
 * * Supports different debug levels ("debug", "info", "warn" or "error")
 * * Simple data serialization for incoming messages
 *
 * @require(qx.dev.StackTrace)
 */
qx.Bootstrap.define("qx.log.Logger", {
  statics : {
    /*
    ---------------------------------------------------------------------------
      CONFIGURATION
    ---------------------------------------------------------------------------
    */
    __level : "debug",
    /**
     * Configures the minimum log level required for new messages.
     *
     * @param value {String} One of "debug", "info", "warn" or "error".
     */
    setLevel : function(value){

      this.__level = value;
    },
    /**
     * Returns the currently configured minimum log level required for new
     * messages.
     *
     * @return {Integer} Debug level
     */
    getLevel : function(){

      return this.__level;
    },
    /**
     * Configures the number of messages to be kept in the buffer.
     *
     * @param value {Integer} Any positive integer
     */
    setTreshold : function(value){

      this.__buffer.setMaxMessages(value);
    },
    /**
     * Returns the currently configured number of messages to be kept in the
     * buffer.
     *
     * @return {Integer} Treshold value
     */
    getTreshold : function(){

      return this.__buffer.getMaxMessages();
    },
    /*
    ---------------------------------------------------------------------------
      APPENDER MANAGEMENT
    ---------------------------------------------------------------------------
    */
    /** @type {Map} Map of all known appenders by ID */
    __appender : {
    },
    /** @type {Integer} Last free appender ID */
    __id : 0,
    /**
     * Registers the given appender and inserts the last cached messages.
     *
     * @param appender {Class} A static appender class supporting at
     *   least a <code>process()</code> method to handle incoming messages.
     */
    register : function(appender){

      if(appender.$$id){

        return;
      };
      // Register appender
      var id = this.__id++;
      this.__appender[id] = appender;
      appender.$$id = id;
      var levels = this.__levels;
      // Insert previous messages
      var entries = this.__buffer.getAllLogEvents();
      for(var i = 0,l = entries.length;i < l;i++){

        if(levels[entries[i].level] >= levels[this.__level]){

          appender.process(entries[i]);
        };
      };
    },
    /**
     * Unregisters the given appender
     *
     * @param appender {Class} A static appender class
     */
    unregister : function(appender){

      var id = appender.$$id;
      if(id == null){

        return;
      };
      delete this.__appender[id];
      delete appender.$$id;
    },
    /*
    ---------------------------------------------------------------------------
      USER METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * Sending a message at level "debug" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     */
    debug : function(object, message){

      qx.log.Logger.__log("debug", arguments);
    },
    /**
     * Sending a message at level "info" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     */
    info : function(object, message){

      qx.log.Logger.__log("info", arguments);
    },
    /**
     * Sending a message at level "warn" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     */
    warn : function(object, message){

      qx.log.Logger.__log("warn", arguments);
    },
    /**
     * Sending a message at level "error" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     */
    error : function(object, message){

      qx.log.Logger.__log("error", arguments);
    },
    /**
     * Prints the current stack trace at level "info"
     *
     * @param object {Object?} Contextual object (either instance or static class)
     */
    trace : function(object){

      var trace = qx.dev.StackTrace.getStackTrace();
      qx.log.Logger.__log("info", [(typeof object !== "undefined" ? [object].concat(trace) : trace).join("\n")]);
    },
    /**
     * Prints a method deprecation warning and a stack trace if the setting
     * <code>qx.debug</code> is set to <code>true</code>.
     *
     * @param fcn {Function} reference to the deprecated function. This is
     *     arguments.callee if the calling method is to be deprecated.
     * @param msg {String?} Optional message to be printed.
     */
    deprecatedMethodWarning : function(fcn, msg){

      {

        var functionName;
      };
    },
    /**
     * Prints a class deprecation warning and a stack trace if the setting
     * <code>qx.debug</code> is set to <code>true</code>.
     *
     * @param clazz {Class} reference to the deprecated class.
     * @param msg {String?} Optional message to be printed.
     */
    deprecatedClassWarning : function(clazz, msg){

      {

        var className;
      };
    },
    /**
     * Prints an event deprecation warning and a stack trace if the setting
     * <code>qx.debug</code> is set to <code>true</code>.
     *
     * @param clazz {Class} reference to the deprecated class.
     * @param event {String} deprecated event name.
     * @param msg {String?} Optional message to be printed.
     */
    deprecatedEventWarning : function(clazz, event, msg){

      {

        var className;
      };
    },
    /**
     * Prints a mixin deprecation warning and a stack trace if the setting
     * <code>qx.debug</code> is set to <code>true</code>.
     *
     * @param clazz {Class} reference to the deprecated mixin.
     * @param msg {String?} Optional message to be printed.
     */
    deprecatedMixinWarning : function(clazz, msg){

      {

        var mixinName;
      };
    },
    /**
     * Prints a constant deprecation warning and a stacktrace if the setting
     * <code>qx.debug</code> is set to <code>true</code> AND the browser supports
     * __defineGetter__!
     *
     * @param clazz {Class} The class the constant is attached to.
     * @param constant {String} The name of the constant as string.
     * @param msg {String} Optional message to be printed.
     */
    deprecatedConstantWarning : function(clazz, constant, msg){

      {

        var self,constantValue;
      };
    },
    /**
     * Prints a deprecation waring and a stacktrace when a subclass overrides
     * the passed method name. The deprecation is only printed if the setting
     * <code>qx.debug</code> is set to <code>true</code>.
     *
     *
     * @param object {qx.core.Object} Instance to check for overriding.
     * @param baseclass {Class} The baseclass as starting point.
     * @param methodName {String} The method name which is deprecated for overriding.
     * @param msg {String?} Optional message to be printed.
     */
    deprecateMethodOverriding : function(object, baseclass, methodName, msg){

      {

        var clazz;
      };
    },
    /**
     * Deletes the current buffer. Does not influence message handling of the
     * connected appenders.
     *
     */
    clear : function(){

      this.__buffer.clearHistory();
    },
    /*
    ---------------------------------------------------------------------------
      INTERNAL LOGGING IMPLEMENTATION
    ---------------------------------------------------------------------------
    */
    /** @type {qx.log.appender.RingBuffer} Message buffer of previously fired messages. */
    __buffer : new qx.log.appender.RingBuffer(50),
    /** @type {Map} Numeric translation of log levels */
    __levels : {
      debug : 0,
      info : 1,
      warn : 2,
      error : 3
    },
    /**
     * Internal logging main routine.
     *
     * @param level {String} One of "debug", "info", "warn" or "error"
     * @param args {Array} List of other arguments, where the first is
     *   taken as the context object.
     */
    __log : function(level, args){

      // Filter according to level
      var levels = this.__levels;
      if(levels[level] < levels[this.__level]){

        return;
      };
      // Serialize and cache
      var object = args.length < 2 ? null : args[0];
      var start = object ? 1 : 0;
      var items = [];
      for(var i = start,l = args.length;i < l;i++){

        items.push(this.__serialize(args[i], true));
      };
      // Build entry
      var time = new Date;
      var entry = {
        time : time,
        offset : time - qx.Bootstrap.LOADSTART,
        level : level,
        items : items,
        // store window to allow cross frame logging
        win : window
      };
      // Add relation fields
      if(object){

        // Do not explicitly check for instanceof qx.core.Object, in order not
        // to introduce an unwanted load-time dependency
        if(object.$$hash !== undefined){

          entry.object = object.$$hash;
        } else if(object.$$type){

          entry.clazz = object;
        } else if(object.constructor){

          entry.clazz = object.constructor;
        };;
      };
      this.__buffer.process(entry);
      // Send to appenders
      var appender = this.__appender;
      for(var id in appender){

        appender[id].process(entry);
      };
    },
    /**
     * Detects the type of the variable given.
     *
     * @param value {var} Incoming value
     * @return {String} Type of the incoming value. Possible values:
     *   "undefined", "null", "boolean", "number", "string",
     *   "function", "array", "error", "map",
     *   "class", "instance", "node", "stringify", "unknown"
     */
    __detect : function(value){

      if(value === undefined){

        return "undefined";
      } else if(value === null){

        return "null";
      };
      if(value.$$type){

        return "class";
      };
      var type = typeof value;
      if(type === "function" || type == "string" || type === "number" || type === "boolean"){

        return type;
      } else if(type === "object"){

        if(value.nodeType){

          return "node";
        } else if(value instanceof Error || (value.name && value.message)){

          return "error";
        } else if(value.classname){

          return "instance";
        } else if(value instanceof Array){

          return "array";
        } else if(value instanceof Date){

          return "date";
        } else {

          return "map";
        };;;;
      };
      if(value.toString){

        return "stringify";
      };
      return "unknown";
    },
    /**
     * Serializes the incoming value. If it is a singular value, the result is
     * a simple string. For an array or a map the result can also be a
     * serialized string of a limited number of individual items.
     *
     * @param value {var} Incoming value
     * @param deep {Boolean?false} Whether arrays and maps should be
     *    serialized for a limited number of items
     * @return {Map} Contains the keys <code>type</code>, <code>text</code> and
     * <code>trace</code>.
     */
    __serialize : function(value, deep){

      var type = this.__detect(value);
      var text = "unknown";
      var trace = [];
      switch(type){case "null":case "undefined":
      text = type;
      break;case "string":case "number":case "boolean":case "date":
      text = value;
      break;case "node":
      if(value.nodeType === 9){

        text = "document";
      } else if(value.nodeType === 3){

        text = "text[" + value.nodeValue + "]";
      } else if(value.nodeType === 1){

        text = value.nodeName.toLowerCase();
        if(value.id){

          text += "#" + value.id;
        };
      } else {

        text = "node";
      };;
      break;case "function":
      text = qx.lang.Function.getName(value) || type;
      break;case "instance":
      text = value.basename + "[" + value.$$hash + "]";
      break;case "class":case "stringify":
      text = value.toString();
      break;case "error":
      trace = qx.dev.StackTrace.getStackTraceFromError(value);
      text = (value.basename ? value.basename + ": " : "") + value.toString();
      break;case "array":
      if(deep){

        text = [];
        for(var i = 0,l = value.length;i < l;i++){

          if(text.length > 20){

            text.push("...(+" + (l - i) + ")");
            break;
          };
          text.push(this.__serialize(value[i], false));
        };
      } else {

        text = "[...(" + value.length + ")]";
      };
      break;case "map":
      if(deep){

        var temp;
        // Produce sorted key list
        var sorted = [];
        for(var key in value){

          sorted.push(key);
        };
        sorted.sort();
        // Temporary text list
        text = [];
        for(var i = 0,l = sorted.length;i < l;i++){

          if(text.length > 20){

            text.push("...(+" + (l - i) + ")");
            break;
          };
          // Additional storage of hash-key
          key = sorted[i];
          temp = this.__serialize(value[key], false);
          temp.key = key;
          text.push(temp);
        };
      } else {

        var number = 0;
        for(var key in value){

          number++;
        };
        text = "{...(" + number + ")}";
      };
      break;};
      return {
        type : type,
        text : text,
        trace : trace
      };
    }
  },
  defer : function(statics){

    var logs = qx.Bootstrap.$$logs;
    for(var i = 0;i < logs.length;i++){

      statics.__log(logs[i][0], logs[i][1]);
    };
    qx.Bootstrap.debug = statics.debug;
    qx.Bootstrap.info = statics.info;
    qx.Bootstrap.warn = statics.warn;
    qx.Bootstrap.error = statics.error;
    qx.Bootstrap.trace = statics.trace;
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This mixin offers the bacis property features which include generic
 * setter, getter and resetter.
 */
qx.Mixin.define("qx.core.MProperty", {
  members : {
    /**
     * Sets multiple properties at once by using a property list or
     * sets one property and its value by the first and second argument.
     * As a fallback, if no generated property setter could be found, a
     * handwritten setter will be searched and invoked if available.
     *
     * @param data {Map | String} a map of property values. The key is the name of the property.
     * @param value {var?} the value, only used when <code>data</code> is a string.
     * @return {Object} this instance.
     * @throws {Error} if a property defined does not exist
     */
    set : function(data, value){

      var setter = qx.core.Property.$$method.set;
      if(qx.Bootstrap.isString(data)){

        if(!this[setter[data]]){

          if(this["set" + qx.Bootstrap.firstUp(data)] != undefined){

            this["set" + qx.Bootstrap.firstUp(data)](value);
            return this;
          };
          throw new Error("No such property: " + data);
        };
        return this[setter[data]](value);
      } else {

        for(var prop in data){

          if(!this[setter[prop]]){

            if(this["set" + qx.Bootstrap.firstUp(prop)] != undefined){

              this["set" + qx.Bootstrap.firstUp(prop)](data[prop]);
              continue;
            };
            throw new Error("No such property: " + prop);
          };
          this[setter[prop]](data[prop]);
        };
        return this;
      };
    },
    /**
     * Returns the value of the given property. If no generated getter could be
     * found, a fallback tries to access a handwritten getter.
     *
     * @param prop {String} Name of the property.
     * @return {var} The value of the value
     * @throws {Error} if a property defined does not exist
     */
    get : function(prop){

      var getter = qx.core.Property.$$method.get;
      if(!this[getter[prop]]){

        if(this["get" + qx.Bootstrap.firstUp(prop)] != undefined){

          return this["get" + qx.Bootstrap.firstUp(prop)]();
        };
        throw new Error("No such property: " + prop);
      };
      return this[getter[prop]]();
    },
    /**
     * Resets the value of the given property. If no generated resetter could be
     * found, a handwritten resetter will be invoked, if available.
     *
     * @param prop {String} Name of the property.
     * @throws {Error} if a property defined does not exist
     */
    reset : function(prop){

      var resetter = qx.core.Property.$$method.reset;
      if(!this[resetter[prop]]){

        if(this["reset" + qx.Bootstrap.firstUp(prop)] != undefined){

          this["reset" + qx.Bootstrap.firstUp(prop)]();
          return;
        };
        throw new Error("No such property: " + prop);
      };
      this[resetter[prop]]();
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This mixin offers the basic logging features offered by {@link qx.log.Logger}.
 */
qx.Mixin.define("qx.core.MLogging", {
  members : {
    /** @type {Class} Pointer to the regular logger class */
    __Logger : qx.log.Logger,
    /**
     * Logs a debug message.
     *
     * @param varargs {var} The item(s) to log. Any number of arguments is
     * supported. If an argument is not a string, the object dump will be
     * logged.
     */
    debug : function(varargs){

      this.__logMessage("debug", arguments);
    },
    /**
     * Logs an info message.
     *
     * @param varargs {var} The item(s) to log. Any number of arguments is
     * supported. If an argument is not a string, the object dump will be
     * logged.
     */
    info : function(varargs){

      this.__logMessage("info", arguments);
    },
    /**
     * Logs a warning message.
     *
     * @param varargs {var} The item(s) to log. Any number of arguments is
     * supported. If an argument is not a string, the object dump will be
     * logged.
     */
    warn : function(varargs){

      this.__logMessage("warn", arguments);
    },
    /**
     * Logs an error message.
     *
     * @param varargs {var} The item(s) to log. Any number of arguments is
     * supported. If an argument is not a string, the object dump will be
     * logged.
     */
    error : function(varargs){

      this.__logMessage("error", arguments);
    },
    /**
     * Prints the current stack trace
     *
     */
    trace : function(){

      this.__Logger.trace(this);
    },
    /**
     * Helper that calls the appropriate logger function with the current object
     * and any number of items.
     *
     * @param level {String} The log level of the message
     * @param varargs {arguments} Arguments list to be logged
     */
    __logMessage : function(level, varargs){

      var argumentsArray = qx.lang.Array.fromArguments(varargs);
      argumentsArray.unshift(this);
      this.__Logger[level].apply(this.__Logger, argumentsArray);
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */
/**
 * Wrapper for browser DOM event handling for each browser window/frame.
 *
 * @require(qx.bom.Event)
 */
qx.Class.define("qx.event.Manager", {
  extend : Object,
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  /**
   * Creates a new instance of the event handler.
   *
   * @param win {Window} The DOM window this manager handles the events for
   * @param registration {qx.event.Registration} The event registration to use
   */
  construct : function(win, registration){

    // Assign window object
    this.__window = win;
    this.__windowId = qx.core.ObjectRegistry.toHashCode(win);
    this.__registration = registration;
    // Register to the page unload event.
    // Only for iframes and other secondary documents.
    if(win.qx !== qx){

      var self = this;
      qx.bom.Event.addNativeListener(win, "unload", qx.event.GlobalError.observeMethod(function(){

        qx.bom.Event.removeNativeListener(win, "unload", arguments.callee);
        self.dispose();
      }));
    };
    // Registry for event listeners
    this.__listeners = {
    };
    // The handler and dispatcher instances
    this.__handlers = {
    };
    this.__dispatchers = {
    };
    this.__handlerCache = {
    };
  },
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /** @type {Integer} Last used ID for an event */
    __lastUnique : 0,
    /**
     * Returns an unique ID which may be used in combination with a target and
     * a type to identify an event entry.
     *
     * @return {String} The next free identifier (auto-incremented)
     */
    getNextUniqueId : function(){

      return (this.__lastUnique++) + "";
    }
  },
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    __registration : null,
    __listeners : null,
    __dispatchers : null,
    __disposeWrapper : null,
    __handlers : null,
    __handlerCache : null,
    __window : null,
    __windowId : null,
    /*
    ---------------------------------------------------------------------------
      HELPERS
    ---------------------------------------------------------------------------
    */
    /**
     * Get the window instance the event manager is responsible for
     *
     * @return {Window} DOM window instance
     */
    getWindow : function(){

      return this.__window;
    },
    /**
     * Get the hashcode of the manager's window
     *
     * @return {String} The window's hashcode
     */
    getWindowId : function(){

      return this.__windowId;
    },
    /**
     * Returns an instance of the given handler class for this manager(window).
     *
     * @param clazz {Class} Any class which implements {@link qx.event.IEventHandler}
     * @return {Object} The instance used by this manager
     */
    getHandler : function(clazz){

      var handler = this.__handlers[clazz.classname];
      if(handler){

        return handler;
      };
      return this.__handlers[clazz.classname] = new clazz(this);
    },
    /**
     * Returns an instance of the given dispatcher class for this manager(window).
     *
     * @param clazz {Class} Any class which implements {@link qx.event.IEventHandler}
     * @return {Object} The instance used by this manager
     */
    getDispatcher : function(clazz){

      var dispatcher = this.__dispatchers[clazz.classname];
      if(dispatcher){

        return dispatcher;
      };
      return this.__dispatchers[clazz.classname] = new clazz(this, this.__registration);
    },
    /*
    ---------------------------------------------------------------------------
      EVENT LISTENER MANAGEMENT
    ---------------------------------------------------------------------------
    */
    /**
     * Get a copy of all event listeners for the given combination
     * of target, event type and phase.
     *
     * This method is especially useful and for event handlers to
     * to query the listeners registered in the manager.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Event type
     * @param capture {Boolean ? false} Whether the listener is for the
     *       capturing phase of the bubbling phase.
     * @return {Array | null} Array of registered event handlers. May return
     *       null when no listener were found.
     */
    getListeners : function(target, type, capture){

      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      if(!targetMap){

        return null;
      };
      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];
      return entryList ? entryList.concat() : null;
    },
    /**
     * Returns all registered listeners.
     *
     * @internal
     *
     * @return {Map} All registered listeners. The key is the hash code form an object.
     */
    getAllListeners : function(){

      return this.__listeners;
    },
    /**
     * Returns a serialized array of all events attached on the given target.
     *
     * @param target {Object} Any valid event target
     * @return {Map[]} Array of maps where everyone contains the keys:
     *   <code>handler</code>, <code>self</code>, <code>type</code> and <code>capture</code>.
     */
    serializeListeners : function(target){

      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      var result = [];
      if(targetMap){

        var indexOf,type,capture,entryList,entry;
        for(var entryKey in targetMap){

          indexOf = entryKey.indexOf("|");
          type = entryKey.substring(0, indexOf);
          capture = entryKey.charAt(indexOf + 1) == "c";
          entryList = targetMap[entryKey];
          for(var i = 0,l = entryList.length;i < l;i++){

            entry = entryList[i];
            result.push({
              self : entry.context,
              handler : entry.handler,
              type : type,
              capture : capture
            });
          };
        };
      };
      return result;
    },
    /**
     * This method might be used to temporally remove all events
     * directly attached to the given target. This do not work
     * have any effect on bubbling events normally.
     *
     * This is mainly thought for detaching events in IE, before
     * cloning them. It also removes all leak scenarios
     * when unloading a document and may be used here as well.
     *
     * @internal
     * @param target {Object} Any valid event target
     * @param enable {Boolean} Whether to enable or disable the events
     */
    toggleAttachedEvents : function(target, enable){

      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      if(targetMap){

        var indexOf,type,capture,entryList;
        for(var entryKey in targetMap){

          indexOf = entryKey.indexOf("|");
          type = entryKey.substring(0, indexOf);
          capture = entryKey.charCodeAt(indexOf + 1) === 99;
          // checking for character "c".
          entryList = targetMap[entryKey];
          if(enable){

            this.__registerAtHandler(target, type, capture);
          } else {

            this.__unregisterAtHandler(target, type, capture);
          };
        };
      };
    },
    /**
     * Check whether there are one or more listeners for an event type
     * registered at the target.
     *
     * @param target {Object} Any valid event target
     * @param type {String} The event type
     * @param capture {Boolean ? false} Whether to check for listeners of
     *         the bubbling or of the capturing phase.
     * @return {Boolean} Whether the target has event listeners of the given type.
     */
    hasListener : function(target, type, capture){

      {
      };
      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      if(!targetMap){

        return false;
      };
      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];
      return !!(entryList && entryList.length > 0);
    },
    /**
     * Imports a list of event listeners at once. This only
     * works for newly created elements as it replaces
     * all existing data structures.
     *
     * Works with a map of data. Each entry in this map should be a
     * map again with the keys <code>type</code>, <code>listener</code>,
     * <code>self</code>, <code>capture</code> and an optional <code>unique</code>.
     *
     * The values are identical to the parameters of {@link #addListener}.
     * For details please have a look there.
     *
     * @param target {Object} Any valid event target
     * @param list {Map} A map where every listener has an unique key.
     */
    importListeners : function(target, list){

      {
      };
      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey] = {
      };
      var clazz = qx.event.Manager;
      for(var listKey in list){

        var item = list[listKey];
        var entryKey = item.type + (item.capture ? "|capture" : "|bubble");
        var entryList = targetMap[entryKey];
        if(!entryList){

          entryList = targetMap[entryKey] = [];
          // This is the first event listener for this type and target
          // Inform the event handler about the new event
          // they perform the event registration at DOM level if needed
          this.__registerAtHandler(target, item.type, item.capture);
        };
        // Append listener to list
        entryList.push({
          handler : item.listener,
          context : item.self,
          unique : item.unique || (clazz.__lastUnique++) + ""
        });
      };
    },
    /**
     * Add an event listener to any valid target. The event listener is passed an
     * instance of {@link qx.event.type.Event} containing all relevant information
     * about the event as parameter.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Name of the event e.g. "click", "keydown", ...
     * @param listener {Function} Event listener function
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener. When not given, the corresponding dispatcher
     *         usually falls back to a default, which is the target
     *         by convention. Note this is not a strict requirement, i.e.
     *         custom dispatchers can follow a different strategy.
     * @param capture {Boolean ? false} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event. The default is
     *         to attach the event handler to the bubbling phase.
     * @return {String} An opaque ID, which can be used to remove the event listener
     *         using the {@link #removeListenerById} method.
     * @throws {Error} if the parameters are wrong
     */
    addListener : function(target, type, listener, self, capture){

      {

        var msg;
      };
      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      if(!targetMap){

        targetMap = this.__listeners[targetKey] = {
        };
      };
      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];
      if(!entryList){

        entryList = targetMap[entryKey] = [];
      };
      // This is the first event listener for this type and target
      // Inform the event handler about the new event
      // they perform the event registration at DOM level if needed
      if(entryList.length === 0){

        this.__registerAtHandler(target, type, capture);
      };
      // Append listener to list
      var unique = (qx.event.Manager.__lastUnique++) + "";
      var entry = {
        handler : listener,
        context : self,
        unique : unique
      };
      entryList.push(entry);
      return entryKey + "|" + unique;
    },
    /**
     * Get the event handler class matching the given event target and type
     *
     * @param target {var} The event target
     * @param type {String} The event type
     * @return {qx.event.IEventHandler|null} The best matching event handler or
     *     <code>null</code>.
     */
    findHandler : function(target, type){

      var isDomNode = false,isWindow = false,isObject = false,isDocument = false;
      var key;
      if(target.nodeType === 1){

        isDomNode = true;
        key = "DOM_" + target.tagName.toLowerCase() + "_" + type;
      } else if(target.nodeType === 9){

        isDocument = true;
        key = "DOCUMENT_" + type;
      } else if(target == this.__window){

        isWindow = true;
        key = "WIN_" + type;
      } else if(target.classname){

        isObject = true;
        key = "QX_" + target.classname + "_" + type;
      } else {

        key = "UNKNOWN_" + target + "_" + type;
      };;;
      var cache = this.__handlerCache;
      if(cache[key]){

        return cache[key];
      };
      var classes = this.__registration.getHandlers();
      var IEventHandler = qx.event.IEventHandler;
      var clazz,instance,supportedTypes,targetCheck;
      for(var i = 0,l = classes.length;i < l;i++){

        clazz = classes[i];
        // shortcut type check
        supportedTypes = clazz.SUPPORTED_TYPES;
        if(supportedTypes && !supportedTypes[type]){

          continue;
        };
        // shortcut target check
        targetCheck = clazz.TARGET_CHECK;
        if(targetCheck){

          // use bitwise & to compare for the bitmask!
          var found = false;
          if(isDomNode && ((targetCheck & IEventHandler.TARGET_DOMNODE) != 0)){

            found = true;
          } else if(isWindow && ((targetCheck & IEventHandler.TARGET_WINDOW) != 0)){

            found = true;
          } else if(isObject && ((targetCheck & IEventHandler.TARGET_OBJECT) != 0)){

            found = true;
          } else if(isDocument && ((targetCheck & IEventHandler.TARGET_DOCUMENT) != 0)){

            found = true;
          };;;
          if(!found){

            continue;
          };
        };
        instance = this.getHandler(classes[i]);
        if(clazz.IGNORE_CAN_HANDLE || instance.canHandleEvent(target, type)){

          cache[key] = instance;
          return instance;
        };
      };
      return null;
    },
    /**
     * This method is called each time an event listener for one of the
     * supported events is added using {qx.event.Manager#addListener}.
     *
     * @param target {Object} Any valid event target
     * @param type {String} event type
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event.
     * @throws {Error} if there is no handler for the event
     */
    __registerAtHandler : function(target, type, capture){

      var handler = this.findHandler(target, type);
      if(handler){

        handler.registerEvent(target, type, capture);
        return;
      };
      {
      };
    },
    /**
     * Remove an event listener from an event target.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Name of the event
     * @param listener {Function} The pointer to the event listener
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener.
     * @param capture {Boolean ? false} Whether to remove the event listener of
     *         the bubbling or of the capturing phase.
     * @return {Boolean} Whether the event was removed successfully (was existend)
     * @throws {Error} if the parameters are wrong
     */
    removeListener : function(target, type, listener, self, capture){

      {

        var msg;
      };
      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      if(!targetMap){

        return false;
      };
      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];
      if(!entryList){

        return false;
      };
      var entry;
      for(var i = 0,l = entryList.length;i < l;i++){

        entry = entryList[i];
        if(entry.handler === listener && entry.context === self){

          qx.lang.Array.removeAt(entryList, i);
          if(entryList.length == 0){

            this.__unregisterAtHandler(target, type, capture);
          };
          return true;
        };
      };
      return false;
    },
    /**
     * Removes an event listener from an event target by an ID returned by
     * {@link #addListener}.
     *
     * @param target {Object} The event target
     * @param id {String} The ID returned by {@link #addListener}
     * @return {Boolean} <code>true</code> if the handler was removed
     */
    removeListenerById : function(target, id){

      {

        var msg;
      };
      var split = id.split("|");
      var type = split[0];
      var capture = split[1].charCodeAt(0) == 99;
      // detect leading "c"
      var unique = split[2];
      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      if(!targetMap){

        return false;
      };
      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];
      if(!entryList){

        return false;
      };
      var entry;
      for(var i = 0,l = entryList.length;i < l;i++){

        entry = entryList[i];
        if(entry.unique === unique){

          qx.lang.Array.removeAt(entryList, i);
          if(entryList.length == 0){

            this.__unregisterAtHandler(target, type, capture);
          };
          return true;
        };
      };
      return false;
    },
    /**
     * Remove all event listeners, which are attached to the given event target.
     *
     * @param target {Object} The event target to remove all event listeners from.
     * @return {Boolean} Whether the events were existend and were removed successfully.
     */
    removeAllListeners : function(target){

      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      if(!targetMap){

        return false;
      };
      // Deregister from event handlers
      var split,type,capture;
      for(var entryKey in targetMap){

        if(targetMap[entryKey].length > 0){

          // This is quite expensive, see bug #1283
          split = entryKey.split("|");
          type = split[0];
          capture = split[1] === "capture";
          this.__unregisterAtHandler(target, type, capture);
        };
      };
      delete this.__listeners[targetKey];
      return true;
    },
    /**
     * Internal helper for deleting the internal listener  data structure for
     * the given targetKey.
     *
     * @param targetKey {String} Hash code for the object to delete its
     *   listeners.
     *
     * @internal
     */
    deleteAllListeners : function(targetKey){

      delete this.__listeners[targetKey];
    },
    /**
     * This method is called each time the an event listener for one of the
     * supported events is removed by using {qx.event.Manager#removeListener}
     * and no other event listener is listening on this type.
     *
     * @param target {Object} Any valid event target
     * @param type {String} event type
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event.
     * @throws {Error} if there is no handler for the event
     */
    __unregisterAtHandler : function(target, type, capture){

      var handler = this.findHandler(target, type);
      if(handler){

        handler.unregisterEvent(target, type, capture);
        return;
      };
      {
      };
    },
    /*
    ---------------------------------------------------------------------------
      EVENT DISPATCH
    ---------------------------------------------------------------------------
    */
    /**
     * Dispatches an event object using the qooxdoo event handler system. The
     * event will only be visible in event listeners attached using
     * {@link #addListener}. After dispatching the event object will be pooled
     * for later reuse or disposed.
     *
     * @param target {Object} Any valid event target
     * @param event {qx.event.type.Event} The event object to dispatch. The event
     *     object must be obtained using {@link qx.event.Registration#createEvent}
     *     and initialized using {@link qx.event.type.Event#init}.
     * @return {Boolean} whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     * @throws {Error} if there is no dispatcher for the event
     */
    dispatchEvent : function(target, event){

      {

        var msg;
      };
      // Preparations
      var type = event.getType();
      if(!event.getBubbles() && !this.hasListener(target, type)){

        qx.event.Pool.getInstance().poolObject(event);
        return true;
      };
      if(!event.getTarget()){

        event.setTarget(target);
      };
      // Interation data
      var classes = this.__registration.getDispatchers();
      var instance;
      // Loop through the dispatchers
      var dispatched = false;
      for(var i = 0,l = classes.length;i < l;i++){

        instance = this.getDispatcher(classes[i]);
        // Ask if the dispatcher can handle this event
        if(instance.canDispatchEvent(target, event, type)){

          instance.dispatchEvent(target, event, type);
          dispatched = true;
          break;
        };
      };
      if(!dispatched){

        {
        };
        return true;
      };
      // check whether "preventDefault" has been called
      var preventDefault = event.getDefaultPrevented();
      // Release the event instance to the event pool
      qx.event.Pool.getInstance().poolObject(event);
      return !preventDefault;
    },
    /**
     * Dispose the event manager
     */
    dispose : function(){

      // Remove from manager list
      this.__registration.removeManager(this);
      qx.util.DisposeUtil.disposeMap(this, "__handlers");
      qx.util.DisposeUtil.disposeMap(this, "__dispatchers");
      // Dispose data fields
      this.__listeners = this.__window = this.__disposeWrapper = null;
      this.__registration = this.__handlerCache = null;
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
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * The GlobalError class stores a reference to a global error handler function.
 *
 *  This function is called for each uncatched JavaScript exception. To enable
 *  global error handling the setting <code>qx.globalErrorHandling</code> must
 *  be enabled and an error handler must be registered.
 *  Further each JavaScript "entry point" must be wrapped with a call to
 *  {@link qx.event.GlobalError#observeMethod}.
 *
 * @ignore(qx.core, qx.core.Environment)
 */
qx.Bootstrap.define("qx.event.GlobalError", {
  statics : {
    __callback : null,
    __originalOnError : null,
    __context : null,
    /**
     * Little helper to check if the global error handling is enabled.
     * @return {Boolean} <code>true</code>, if it is enabled.
     */
    __isGlobaErrorHandlingEnabled : function(){

      if(qx.core && qx.core.Environment){

        return false;
      } else {

        return !!qx.Bootstrap.getEnvironmentSetting("qx.globalErrorHandling");
      };
    },
    /**
     * Set the global fallback error handler
     *
     * @param callback {Function} The error handler. The first argument is the
     *    exception, which caused the error
     * @param context {Object} The "this" context of the callback function
     */
    setErrorHandler : function(callback, context){

      this.__callback = callback || null;
      this.__context = context || window;
      if(this.__isGlobaErrorHandlingEnabled()){

        // wrap the original onerror
        if(callback && window.onerror){

          var wrappedHandler = qx.Bootstrap.bind(this.__onErrorWindow, this);
          if(this.__originalOnError == null){

            this.__originalOnError = window.onerror;
          };
          var self = this;
          window.onerror = function(msg, uri, lineNumber){

            self.__originalOnError(msg, uri, lineNumber);
            wrappedHandler(msg, uri, lineNumber);
          };
        };
        if(callback && !window.onerror){

          window.onerror = qx.Bootstrap.bind(this.__onErrorWindow, this);
        };
        // reset
        if(this.__callback == null){

          if(this.__originalOnError != null){

            window.onerror = this.__originalOnError;
            this.__originalOnError = null;
          } else {

            window.onerror = null;
          };
        };
      };
    },
    /**
     * Catches all errors of the <code>window.onerror</code> handler
     * and passes an {@link qx.core.WindowError} object to the error
     * handling.
     *
     * @param msg {String} browser error message
     * @param uri {String} uri to errornous script
     * @param lineNumber {Integer} line number of error
     */
    __onErrorWindow : function(msg, uri, lineNumber){

      if(this.__callback){

        this.handleError(new qx.core.WindowError(msg, uri, lineNumber));
      };
    },
    /**
     * Wraps a method with error handling code. Only methods, which are called
     * directly by the browser (e.g. event handler) should be wrapped.
     *
     * @param method {Function} method to wrap
     * @return {Function} The function wrapped with error handling code
     */
    observeMethod : function(method){

      if(this.__isGlobaErrorHandlingEnabled()){

        var self = this;
        return function(){

          if(!self.__callback){

            return method.apply(this, arguments);
          };
          try{

            return method.apply(this, arguments);
          } catch(ex) {

            self.handleError(new qx.core.GlobalError(ex, arguments));
          };
        };
      } else {

        return method;
      };
    },
    /**
     * Delegates every given exception to the registered error handler
     *
     * @param ex {qx.core.WindowError|Error} Exception to delegate
     */
    handleError : function(ex){

      if(this.__callback){

        this.__callback.call(this.__context, ex);
      };
    }
  },
  defer : function(statics){

    // only use the environment class if already loaded
    if(qx.core && qx.core.Environment){

      qx.core.Environment.add("qx.globalErrorHandling", true);
    } else {

      qx.Bootstrap.setEnvironmentSetting("qx.globalErrorHandling", true);
    };
    statics.setErrorHandler(null, null);
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * This exception is thrown by the {@link qx.event.GlobalError} handler if a
 * <code>window.onerror</code> event occurs in the browser.
 */
qx.Bootstrap.define("qx.core.WindowError", {
  extend : Error,
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  /**
   * @param failMessage {String} The error message
   * @param uri {String} URI where error was raised
   * @param lineNumber {Integer} The line number where the error was raised
   */
  construct : function(failMessage, uri, lineNumber){

    var inst = Error.call(this, failMessage);
    // map stack trace properties since they're not added by Error's constructor
    if(inst.stack){

      this.stack = inst.stack;
    };
    if(inst.stacktrace){

      this.stacktrace = inst.stacktrace;
    };
    this.__failMessage = failMessage;
    this.__uri = uri || "";
    this.__lineNumber = lineNumber === undefined ? -1 : lineNumber;
  },
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    __failMessage : null,
    __uri : null,
    __lineNumber : null,
    /**
     * Returns the error message.
     *
     * @return {String} error message
     */
    toString : function(){

      return this.__failMessage;
    },
    /**
     * Get the URI where error was raised
     *
     * @return {String} URI where error was raised
     */
    getUri : function(){

      return this.__uri;
    },
    /**
     * Get the line number where the error was raised
     *
     * @return {Integer} The line number where the error was raised
     */
    getLineNumber : function(){

      return this.__lineNumber;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Michael Haitz (mhaitz)

************************************************************************ */
/**
 * This exception is thrown by the {@link qx.event.GlobalError} handler if a
 * observed method throws an exception.
 */
qx.Bootstrap.define("qx.core.GlobalError", {
  extend : Error,
  /**
   * @param exc {Error} source exception
   * @param args {Array} arguments
   */
  construct : function(exc, args){

    // Do not use the Environment class to keep the minimal
    // package size small [BUG #5068]
    if(qx.Bootstrap.DEBUG){

      qx.core.Assert.assertNotUndefined(exc);
    };
    this.__failMessage = "GlobalError: " + (exc && exc.message ? exc.message : exc);
    var inst = Error.call(this, this.__failMessage);
    // map stack trace properties since they're not added by Error's constructor
    if(inst.stack){

      this.stack = inst.stack;
    };
    if(inst.stacktrace){

      this.stacktrace = inst.stacktrace;
    };
    this.__arguments = args;
    this.__exc = exc;
  },
  members : {
    __exc : null,
    __arguments : null,
    __failMessage : null,
    /**
     * Returns the error message.
     *
     * @return {String} error message
     */
    toString : function(){

      return this.__failMessage;
    },
    /**
     * Returns the arguments which are
     *
     * @return {Object} arguments
     */
    getArguments : function(){

      return this.__arguments;
    },
    /**
     * Get the source exception
     *
     * @return {Error} source exception
     */
    getSourceException : function(){

      return this.__exc;
    }
  },
  destruct : function(){

    this.__exc = null;
    this.__arguments = null;
    this.__failMessage = null;
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * A collection of assertions.
 *
 * These methods can be used to assert incoming parameters, return values, ...
 * If an assertion fails an {@link AssertionError} is thrown.
 *
 * Assertions are used in unit tests as well.
 *
 * @require(qx.lang.Type)
 */
qx.Class.define("qx.core.Assert", {
  statics : {
    __logError : true,
    /**
     * Assert that the condition evaluates to <code>true</code>. An
     * {@link AssertionError} is thrown if otherwise.
     *
     * @param comment {String} Message to be shown if the assertion fails. This
     *    message is provided by the user.
     * @param msgvarargs {var} any number of parts of a message to show if assertion
     *                         triggers. Each will be converted to a string and all
     *                         parts will be concatenated. E. g. instead of
     *                         "Got invalid value " + this.__toString(val) + "!!!!!"
     *                         use
     *                         "Got invalid value ", val, "!!!!!"
     *                         (much better performance)
     *
     */
    __fail : function(comment, msgvarargs){

      // Build up message from message varargs. It's not really important
      // how long this takes as it is done only when assertion is triggered
      var msg = "";
      for(var i = 1,l = arguments.length;i < l;i++){

        msg = msg + this.__toString(arguments[i] === undefined ? "'undefined'" : arguments[i]);
      };
      var fullComment = "";
      if(msg){

        fullComment = comment + ": " + msg;
      } else {

        fullComment = comment;
      };
      var errorMsg = "Assertion error! " + fullComment;
      if(qx.Class.isDefined("qx.core.AssertionError")){

        var err = new qx.core.AssertionError(comment, msg);
        if(this.__logError){

          qx.Bootstrap.error(errorMsg + "\n Stack trace: \n" + err.getStackTrace());
        };
        throw err;
      } else {

        if(this.__logError){

          qx.Bootstrap.error(errorMsg);
        };
        throw new Error(errorMsg);
      };
    },
    /**
     * Convert an unknown value to a string to display in error messages
     *
     * @param value {var} any value
     * @return {String} a string representation of the value
     */
    __toString : function(value){

      var stringValue;
      if(value === null){

        stringValue = "null";
      } else if(qx.lang.Type.isArray(value) && value.length > 10){

        stringValue = "Array[" + value.length + "]";
      } else if((value instanceof Object) && (value.toString == null)){

        stringValue = qx.lang.Json.stringify(value, null, 2);
      } else {

        try{

          stringValue = value.toString();
        } catch(e) {

          stringValue = "";
        };
      };;
      return stringValue;
    },
    /**
     * Assert that the condition evaluates to <code>true</code>.
     *
     * @param condition {var} Condition to check for. Must evaluate to
     *    <code>true</code>.
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assert : function(condition, msg){

      condition == true || this.__fail(msg || "", "Called assert with 'false'");
    },
    /**
     * Raise an {@link AssertionError}.
     *
     * @param msg {String} Message to be shown if the assertion fails.
     * @param compact {Boolean} Show less verbose message. Default: false.
     */
    fail : function(msg, compact){

      var msgvarargs = compact ? "" : "Called fail().";
      this.__fail(msg || "", msgvarargs);
    },
    /**
     * Assert that the value is <code>true</code> (Identity check).
     *
     * @param value {Boolean} Condition to check for. Must be identical to
     *    <code>true</code>.
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertTrue : function(value, msg){

      (value === true) || this.__fail(msg || "", "Called assertTrue with '", value, "'");
    },
    /**
     * Assert that the value is <code>false</code> (Identity check).
     *
     * @param value {Boolean} Condition to check for. Must be identical to
     *    <code>false</code>.
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertFalse : function(value, msg){

      (value === false) || this.__fail(msg || "", "Called assertFalse with '", value, "'");
    },
    /**
     * Assert that both values are equal. (Uses the equality operator
     * <code>==</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertEquals : function(expected, found, msg){

      expected == found || this.__fail(msg || "", "Expected '", expected, "' but found '", found, "'!");
    },
    /**
     * Assert that both values are not equal. (Uses the not equality operator
     * <code>!=</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotEquals : function(expected, found, msg){

      expected != found || this.__fail(msg || "", "Expected '", expected, "' to be not equal with '", found, "'!");
    },
    /**
     * Assert that both values are identical. (Uses the identity operator
     * <code>===</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertIdentical : function(expected, found, msg){

      expected === found || this.__fail(msg || "", "Expected '", expected, "' (identical) but found '", found, "'!");
    },
    /**
     * Assert that both values are not identical. (Uses the not identity operator
     * <code>!==</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotIdentical : function(expected, found, msg){

      expected !== found || this.__fail(msg || "", "Expected '", expected, "' to be not identical with '", found, "'!");
    },
    /**
     * Assert that the value is not <code>undefined</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotUndefined : function(value, msg){

      value !== undefined || this.__fail(msg || "", "Expected value not to be undefined but found undefined!");
    },
    /**
     * Assert that the value is <code>undefined</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertUndefined : function(value, msg){

      value === undefined || this.__fail(msg || "", "Expected value to be undefined but found ", value, "!");
    },
    /**
     * Assert that the value is not <code>null</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotNull : function(value, msg){

      value !== null || this.__fail(msg || "", "Expected value not to be null but found null!");
    },
    /**
     * Assert that the value is <code>null</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNull : function(value, msg){

      value === null || this.__fail(msg || "", "Expected value to be null but found ", value, "!");
    },
    /**
     * Assert that the first two arguments are equal, when serialized into
     * JSON.
     *
     * @param expected {var} The the expected value
     * @param found {var} The found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertJsonEquals : function(expected, found, msg){

      this.assertEquals(qx.lang.Json.stringify(expected), qx.lang.Json.stringify(found), msg);
    },
    /**
     * Assert that the given string matches the regular expression
     *
     * @param str {String} String, which should match the regular expression
     * @param re {String|RegExp} Regular expression to match
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertMatch : function(str, re, msg){

      this.assertString(str);
      this.assert(qx.lang.Type.isRegExp(re) || qx.lang.Type.isString(re), "The parameter 're' must be a string or a regular expression.");
      str.search(re) >= 0 || this.__fail(msg || "", "The String '", str, "' does not match the regular expression '", re.toString(), "'!");
    },
    /**
     * Assert that the number of arguments is within the given range
     *
     * @param args {arguments} The <code>arguments<code> variable of a function
     * @param minCount {Integer} Minimal number of arguments
     * @param maxCount {Integer} Maximum number of arguments
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertArgumentsCount : function(args, minCount, maxCount, msg){

      var argCount = args.length;
      (argCount >= minCount && argCount <= maxCount) || this.__fail(msg || "", "Wrong number of arguments given. Expected '", minCount, "' to '", maxCount, "' arguments but found '", argCount, "' arguments.");
    },
    /**
     * Assert that an event is fired.
     *
     * @param obj {Object} The object on which the event should be fired.
     * @param event {String} The event which should be fired.
     * @param invokeFunc {Function} The function which will be invoked and which
     *   fires the event.
     * @param listenerFunc {Function?null} The function which will be invoked in the
     *   listener. The function receives one parameter which is the event.
     * @param msg {String?""} Message to be shows if the assertion fails.
     */
    assertEventFired : function(obj, event, invokeFunc, listenerFunc, msg){

      var called = false;
      var listener = function(e){

        if(listenerFunc){

          listenerFunc.call(obj, e);
        };
        called = true;
      };
      var id;
      try{

        id = obj.addListener(event, listener, obj);
        invokeFunc.call(obj);
      } catch(ex) {

        throw ex;
      }finally{

        try{

          obj.removeListenerById(id);
        } catch(ex) {
        };
      };
      called === true || this.__fail(msg || "", "Event (", event, ") not fired.");
    },
    /**
     * Assert that an event is not fired.
     *
     * @param obj {Object} The object on which the event should be fired.
     * @param event {String} The event which should be fired.
     * @param invokeFunc {Function} The function which will be invoked and which
     *   should not fire the event.
     * @param msg {String} Message to be shows if the assertion fails.
     */
    assertEventNotFired : function(obj, event, invokeFunc, msg){

      var called = false;
      var listener = function(e){

        called = true;
      };
      var id = obj.addListener(event, listener, obj);
      invokeFunc.call();
      called === false || this.__fail(msg || "", "Event (", event, ") was fired.");
      obj.removeListenerById(id);
    },
    /**
     * Asserts that the callback raises a matching exception.
     *
     * @param callback {Function} function to check
     * @param exception {Error?Error} Expected constructor of the exception.
     *   The assertion fails if the raised exception is not an instance of the
     *   parameter.
     * @param re {String|RegExp} The assertion fails if the error message does
     *   not match this parameter
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertException : function(callback, exception, re, msg){

      var exception = exception || Error;
      var error;
      try{

        this.__logError = false;
        callback();
      } catch(ex) {

        error = ex;
      }finally{

        this.__logError = true;
      };
      if(error == null){

        this.__fail(msg || "", "The function did not raise an exception!");
      };
      error instanceof exception || this.__fail(msg || "", "The raised exception does not have the expected type! ", exception, " != ", error);
      if(re){

        this.assertMatch(error.toString(), re, msg);
      };
    },
    /**
     * Assert that the value is an item in the given array.
     *
     * @param value {var} Value to check
     * @param array {Array} List of valid values
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInArray : function(value, array, msg){

      array.indexOf(value) !== -1 || this.__fail(msg || "", "The value '", value, "' must have any of the values defined in the array '", array, "'");
    },
    /**
     * Assert that both array have identical array items.
     *
     * @param expected {Array} The expected array
     * @param found {Array} The found array
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertArrayEquals : function(expected, found, msg){

      this.assertArray(expected, msg);
      this.assertArray(found, msg);
      msg = msg || "Expected [" + expected.join(", ") + "], but found [" + found.join(", ") + "]";
      if(expected.length !== found.length){

        this.fail(msg, true);
      };
      for(var i = 0;i < expected.length;i++){

        if(expected[i] !== found[i]){

          this.fail(msg, true);
        };
      };
    },
    /**
     * Assert that the value is a key in the given map.
     *
     * @param value {var} Value to check
     * @param map {Map} Map, where the keys represent the valid values
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertKeyInMap : function(value, map, msg){

      map[value] !== undefined || this.__fail(msg || "", "The value '", value, "' must must be a key of the map '", map, "'");
    },
    /**
     * Assert that the value is a function.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertFunction : function(value, msg){

      qx.lang.Type.isFunction(value) || this.__fail(msg || "", "Expected value to be typeof function but found ", value, "!");
    },
    /**
     * Assert that the value is a string.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertString : function(value, msg){

      qx.lang.Type.isString(value) || this.__fail(msg || "", "Expected value to be a string but found ", value, "!");
    },
    /**
     * Assert that the value is a boolean.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertBoolean : function(value, msg){

      qx.lang.Type.isBoolean(value) || this.__fail(msg || "", "Expected value to be a boolean but found ", value, "!");
    },
    /**
     * Assert that the value is a number.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNumber : function(value, msg){

      (qx.lang.Type.isNumber(value) && isFinite(value)) || this.__fail(msg || "", "Expected value to be a number but found ", value, "!");
    },
    /**
     * Assert that the value is a number >= 0.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertPositiveNumber : function(value, msg){

      (qx.lang.Type.isNumber(value) && isFinite(value) && value >= 0) || this.__fail(msg || "", "Expected value to be a number >= 0 but found ", value, "!");
    },
    /**
     * Assert that the value is an integer.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInteger : function(value, msg){

      (qx.lang.Type.isNumber(value) && isFinite(value) && value % 1 === 0) || this.__fail(msg || "", "Expected value to be an integer but found ", value, "!");
    },
    /**
     * Assert that the value is an integer >= 0.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertPositiveInteger : function(value, msg){

      var condition = (qx.lang.Type.isNumber(value) && isFinite(value) && value % 1 === 0 && value >= 0);
      condition || this.__fail(msg || "", "Expected value to be an integer >= 0 but found ", value, "!");
    },
    /**
     * Assert that the value is inside the given range.
     *
     * @param value {var} Value to check
     * @param min {Number} lower bound
     * @param max {Number} upper bound
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInRange : function(value, min, max, msg){

      (value >= min && value <= max) || this.__fail(msg || "", qx.lang.String.format("Expected value '%1' to be in the range '%2'..'%3'!", [value, min, max]));
    },
    /**
     * Assert that the value is an object.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertObject : function(value, msg){

      var condition = value !== null && (qx.lang.Type.isObject(value) || typeof value === "object");
      condition || this.__fail(msg || "", "Expected value to be typeof object but found ", (value), "!");
    },
    /**
     * Assert that the value is an array.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertArray : function(value, msg){

      qx.lang.Type.isArray(value) || this.__fail(msg || "", "Expected value to be an array but found ", value, "!");
    },
    /**
     * Assert that the value is a map either created using <code>new Object</code>
     * or by using the object literal notation <code>{ ... }</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertMap : function(value, msg){

      qx.lang.Type.isObject(value) || this.__fail(msg || "", "Expected value to be a map but found ", value, "!");
    },
    /**
    * Assert that the value is a regular expression.
    *
    * @param value {var} Value to check
    * @param msg {String} Message to be shown if the assertion fails.
    */
    assertRegExp : function(value, msg){

      qx.lang.Type.isRegExp(value) || this.__fail(msg || "", "Expected value to be a regular expression but found ", value, "!");
    },
    /**
     * Assert that the value has the given type using the <code>typeof</code>
     * operator. Because the type is not always what it is supposed to be it is
     * better to use more explicit checks like {@link #assertString} or
     * {@link #assertArray}.
     *
     * @param value {var} Value to check
     * @param type {String} expected type of the value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertType : function(value, type, msg){

      this.assertString(type, "Invalid argument 'type'");
      typeof (value) === type || this.__fail(msg || "", "Expected value to be typeof '", type, "' but found ", value, "!");
    },
    /**
     * Assert that the value is an instance of the given class.
     *
     * @param value {var} Value to check
     * @param clazz {Class} The value must be an instance of this class
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInstance : function(value, clazz, msg){

      var className = clazz.classname || clazz + "";
      value instanceof clazz || this.__fail(msg || "", "Expected value to be instanceof '", className, "' but found ", value, "!");
    },
    /**
     * Assert that the value implements the given interface.
     *
     * @param value {var} Value to check
     * @param iface {Class} The value must implement this interface
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInterface : function(value, iface, msg){

      qx.Class.implementsInterface(value, iface) || this.__fail(msg || "", "Expected object '", value, "' to implement the interface '", iface, "'!");
    },
    /**
     * Assert that the value represents the given CSS color value. This method
     * parses the color strings and compares the RGB values. It is able to
     * parse values supported by {@link qx.util.ColorUtil#stringToRgb}.
     *
     *  @param expected {String} The expected color
     *  @param value {String} The value to check
     *  @param msg {String} Message to be shown if the assertion fails.
     */
    assertCssColor : function(expected, value, msg){

      var ColorUtil = qx.Class.getByName("qx.util.ColorUtil");
      if(!ColorUtil){

        throw new Error("qx.util.ColorUtil not available! Your code must have a dependency on 'qx.util.ColorUtil'");
      };
      var expectedRgb = ColorUtil.stringToRgb(expected);
      try{

        var valueRgb = ColorUtil.stringToRgb(value);
      } catch(ex) {

        this.__fail(msg || "", "Expected value to be the CSS color '", expected, "' (rgb(", expectedRgb.join(","), ")), but found value '", value, "', which cannot be converted to a CSS color!");
      };
      var condition = expectedRgb[0] == valueRgb[0] && expectedRgb[1] == valueRgb[1] && expectedRgb[2] == valueRgb[2];
      condition || this.__fail(msg || "", "Expected value to be the CSS color '", expectedRgb, "' (rgb(", expectedRgb.join(","), ")), but found value '", value, "' (rgb(", valueRgb.join(","), "))!");
    },
    /**
     * Assert that the value is a DOM element.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertElement : function(value, msg){

      // see qx.dom.Node.isElement
      !!(value && value.nodeType === 1) || this.__fail(msg || "", "Expected value to be a DOM element but found  '", value, "'!");
    },
    /**
     * Assert that the value is an instance of {@link qx.core.Object}.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertQxObject : function(value, msg){

      this.__isQxInstance(value, "qx.core.Object") || this.__fail(msg || "", "Expected value to be a qooxdoo object but found ", value, "!");
    },
    /**
     * Assert that the value is an instance of {@link qx.ui.core.Widget}.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertQxWidget : function(value, msg){

      this.__isQxInstance(value, "qx.ui.core.Widget") || this.__fail(msg || "", "Expected value to be a qooxdoo widget but found ", value, "!");
    },
    /**
     * Internal helper for checking the instance of a qooxdoo object using the
     * classname.
     *
     * @param object {var} The object to check.
     * @param classname {String} The classname of the class as string.
     * @return {Boolean} <code>true</code> if the object is an instance of the
     * class
     */
    __isQxInstance : function(object, classname){

      if(!object){

        return false;
      };
      var clazz = object.constructor;
      while(clazz){

        if(clazz.classname === classname){

          return true;
        };
        clazz = clazz.superclass;
      };
      return false;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Richard Sternagel (rsternagel)

   ======================================================================

   This class contains code from:

   * JSON 3 (v3.2.5)

     Code:
       https://github.com/bestiejs/json3

     Copyright:
       (c) 2012-2013, Kit Cambridge

     License:
       MIT: https://raw.github.com/bestiejs/json3/gh-pages/LICENSE

   ----------------------------------------------------------------------

    Copyright (c) 2012-2013 Kit Cambridge.
    http://kitcambridge.be/

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
    of the Software, and to permit persons to whom the Software is furnished to do
    so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

************************************************************************ */
/**
 * Exposes (potentially polyfilled or patched) window.JSON to qooxdoo
 * (enabled by <a href="https://github.com/bestiejs/json3">JSON 3</a>).
 */
qx.Bootstrap.define("qx.lang.Json", {
  statics : {
    /**
     * This method produces a JSON text from a JavaScript value.
     *
     * When an object value is found, if the object contains a toJSON
     * method, its toJSON method will be called and the result will be
     * stringified. A toJSON method does not serialize: it returns the
     * value represented by the name/value pair that should be serialized,
     * or undefined if nothing should be serialized. The toJSON method
     * will be passed the key associated with the value, and this will be
     * bound to the object holding the key.
     *
     * For example, this would serialize Dates as ISO strings.
     *
     * <pre class="javascript">
     *     Date.prototype.toJSON = function (key) {
     *         function f(n) {
     *             // Format integers to have at least two digits.
     *             return n < 10 ? '0' + n : n;
     *         }
     *
     *         return this.getUTCFullYear()   + '-' +
     *              f(this.getUTCMonth() + 1) + '-' +
     *              f(this.getUTCDate())      + 'T' +
     *              f(this.getUTCHours())     + ':' +
     *              f(this.getUTCMinutes())   + ':' +
     *              f(this.getUTCSeconds())   + 'Z';
     *     };
     * </pre>
     *
     * You can provide an optional replacer method. It will be passed the
     * key and value of each member, with this bound to the containing
     * object. The value that is returned from your method will be
     * serialized. If your method returns undefined, then the member will
     * be excluded from the serialization.
     *
     * If the replacer parameter is an array of strings, then it will be
     * used to select the members to be serialized. It filters the results
     * such that only members with keys listed in the replacer array are
     * stringified.
     *
     * Values that do not have JSON representations, such as undefined or
     * functions, will not be serialized. Such values in objects will be
     * dropped; in arrays they will be replaced with null. You can use
     * a replacer function to replace those with JSON values.
     * JSON.stringify(undefined) returns undefined.
     *
     * The optional space parameter produces a stringification of the
     * value that is filled with line breaks and indentation to make it
     * easier to read.
     *
     * If the space parameter is a non-empty string, then that string will
     * be used for indentation. If the space parameter is a number, then
     * the indentation will be that many spaces.
     *
     * Example:
     *
     * <pre class="javascript">
     * text = JSON.stringify(['e', {pluribus: 'unum'}]);
     * // text is '["e",{"pluribus":"unum"}]'
     *
     *
     * text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
     * // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'
     *
     * text = JSON.stringify([new Date()], function (key, value) {
     *     return this[key] instanceof Date ?
     *         'Date(' + this[key] + ')' : value;
     * });
     * // text is '["Date(---current time---)"]'
     * </pre>
     *
     * @signature function(value, replacer, space)
     *
     * @param value {var} any JavaScript value, usually an object or array.
     *
     * @param replacer {Function?} an optional parameter that determines how
     *    object values are stringified for objects. It can be a function or an
     *    array of strings.
     *
     * @param space {String?} an optional parameter that specifies the
     *    indentation of nested structures. If it is omitted, the text will
     *    be packed without extra whitespace. If it is a number, it will specify
     *    the number of spaces to indent at each level. If it is a string
     *    (such as '\t' or '&nbsp;'), it contains the characters used to indent
     *    at each level.
     *
     * @return {String} The JSON string of the value
     */
    stringify : null,
    // will be set after the polyfill
    /**
     * This method parses a JSON text to produce an object or array.
     * It can throw a SyntaxError exception.
     *
     * The optional reviver parameter is a function that can filter and
     * transform the results. It receives each of the keys and values,
     * and its return value is used instead of the original value.
     * If it returns what it received, then the structure is not modified.
     * If it returns undefined then the member is deleted.
     *
     * Example:
     *
     * <pre class="javascript">
     * // Parse the text. Values that look like ISO date strings will
     * // be converted to Date objects.
     *
     * myData = JSON.parse(text, function (key, value)
     * {
     *   if (typeof value === 'string')
     *   {
     *     var a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
     *     if (a) {
     *       return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
     *     }
     *   }
     *   return value;
     * });
     *
     * myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
     *     var d;
     *     if (typeof value === 'string' &&
     *             value.slice(0, 5) === 'Date(' &&
     *             value.slice(-1) === ')') {
     *         d = new Date(value.slice(5, -1));
     *         if (d) {
     *             return d;
     *         }
     *     }
     *     return value;
     * });
     * </pre>
     *
     * @signature function(text, reviver)
     *
     * @param text {String} JSON string to parse
     *
     * @param reviver {Function?} Optional reviver function to filter and
     *    transform the results
     *
     * @return {Object} The parsed JSON object
     */
    parse : null
  }
});
/*! JSON v3.2.5 | http://bestiejs.github.io/json3 | Copyright 2012-2013, Kit Cambridge | http://kit.mit-license.org */
/**
 * @ignore(define.*, exports)
 * @lint ignoreNoLoopBlock()
 */
(function(window){

  // Convenience aliases.
  var getClass = {
  }.toString,isProperty,forEach,undef;
  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd,JSON3 = typeof exports == "object" && exports;
  if(JSON3 || isLoader){

    if(typeof JSON == "object" && JSON){

      // Delegate to the native `stringify` and `parse` implementations in
      // asynchronous module loaders and CommonJS environments.
      if(JSON3){

        JSON3.stringify = JSON.stringify;
        JSON3.parse = JSON.parse;
      } else {

        JSON3 = JSON;
      };
    } else if(isLoader){

      JSON3 = window.JSON = {
      };
    };
  } else {

    // Export for web browsers and JavaScript engines.
    JSON3 = window.JSON || (window.JSON = {
    });
  };
  // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
  var isExtended = new Date(-3509827334573292);
  try{

    // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
    // results for certain dates in Opera >= 10.53.
    isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 && // Safari < 2.0.2 stores the internal millisecond time value correctly,
    // but clips the values returned by the date methods to the range of
    // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
    isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
  } catch(exception) {
  };
  // Internal: Determines whether the native `JSON.stringify` and `parse`
  // implementations are spec-compliant. Based on work by Ken Snyder.
  function has(name){

    if(name == "bug-string-char-index"){

      // IE <= 7 doesn't support accessing string characters using square
      // bracket notation. IE 8 only supports this for primitives.
      return "a"[0] != "a";
    };
    var value,serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}',isAll = name == "json";
    if(isAll || name == "json-stringify" || name == "json-parse"){

      // Test `JSON.stringify`.
      if(name == "json-stringify" || isAll){

        var stringify = JSON3.stringify,stringifySupported = typeof stringify == "function" && isExtended;
        if(stringifySupported){

          // A test function object with a custom `toJSON` method.
          (value = function(){

            return 1;
          }).toJSON = value;
          try{

            stringifySupported = // Firefox 3.1b1 and b2 serialize string, number, and boolean
            // primitives as object literals.
            stringify(0) === "0" && // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
            // literals.
            stringify(new Number()) === "0" && stringify(new String()) == '""' && // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
            // does not define a canonical JSON representation (this applies to
            // objects with `toJSON` properties as well, *unless* they are nested
            // within an object or array).
            stringify(getClass) === undef && // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
            // FF 3.1b3 pass this test.
            stringify(undef) === undef && // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
            // respectively, if the value is omitted entirely.
            stringify() === undef && // FF 3.1b1, 2 throw an error if the given value is not a number,
            // string, array, object, Boolean, or `null` literal. This applies to
            // objects with custom `toJSON` methods as well, unless they are nested
            // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
            // methods entirely.
            stringify(value) === "1" && stringify([value]) == "[1]" && // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
            // `"[null]"`.
            stringify([undef]) == "[null]" && // YUI 3.0.0b1 fails to serialize `null` literals.
            stringify(null) == "null" && // FF 3.1b1, 2 halts serialization if an array contains a function:
            // `[1, true, getClass, 1]` serializes as "[1,true,],". These versions
            // of Firefox also allow trailing commas in JSON objects and arrays.
            // FF 3.1b3 elides non-JSON values from objects and arrays, unless they
            // define custom `toJSON` methods.
            stringify([undef, getClass, null]) == "[null,null,null]" && // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
            // where character escape codes are expected (e.g., `\b` => `\u0008`).
            stringify({
              "a" : [value, true, false, null, "\x00\b\n\f\r\t"]
            }) == serialized && // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
            stringify(null, value) === "1" && stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" && // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
            // serialize extended years.
            stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' && // The milliseconds are optional in ES 5, but required in 5.1.
            stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' && // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
            // four-digit years instead of six-digit years. Credits: @Yaffle.
            stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' && // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
            // values less than 1000. Credits: @Yaffle.
            stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
          } catch(exception) {

            stringifySupported = false;
          };
        };
        if(!isAll){

          return stringifySupported;
        };
      };
      // Test `JSON.parse`.
      if(name == "json-parse" || isAll){

        var parse = JSON3.parse;
        if(typeof parse == "function"){

          try{

            // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
            // Conforming implementations should also coerce the initial argument to
            // a string prior to parsing.
            if(parse("0") === 0 && !parse(false)){

              // Simple parsing test.
              value = parse(serialized);
              var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
              if(parseSupported){

                try{

                  // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                  parseSupported = !parse('"\t"');
                } catch(exception) {
                };
                if(parseSupported){

                  try{

                    // FF 4.0 and 4.0.1 allow leading `+` signs, and leading and
                    // trailing decimal points. FF 4.0, 4.0.1, and IE 9-10 also
                    // allow certain octal literals.
                    parseSupported = parse("01") !== 1;
                  } catch(exception) {
                  };
                };
              };
            };
          } catch(exception) {

            parseSupported = false;
          };
        };
        if(!isAll){

          return parseSupported;
        };
      };
      return stringifySupported && parseSupported;
    };
  };
  if(!has("json")){

    // Common `[[Class]]` name aliases.
    var functionClass = "[object Function]";
    var dateClass = "[object Date]";
    var numberClass = "[object Number]";
    var stringClass = "[object String]";
    var arrayClass = "[object Array]";
    var booleanClass = "[object Boolean]";
    // Detect incomplete support for accessing string characters by index.
    var charIndexBuggy = has("bug-string-char-index");
    // Define additional utility methods if the `Date` methods are buggy.
    if(!isExtended){

      var floor = Math.floor;
      // A mapping between the months of the year and the number of days between
      // January 1st and the first of the respective month.
      var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
      // Internal: Calculates the number of days between the Unix epoch and the
      // first day of the given month.
      var getDay = function(year, month){

        return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
      };
    };
    // Internal: Determines if a property is a direct property of the given
    // object. Delegates to the native `Object#hasOwnProperty` method.
    if(!(isProperty = {
    }.hasOwnProperty)){

      isProperty = function(property){

        var members = {
        },constructor;
        if((members.__proto__ = null, members.__proto__ = {
          // The *proto* property cannot be set multiple times in recent
          // versions of Firefox and SeaMonkey.
          "toString" : 1
        }, members).toString != getClass){

          // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
          // supports the mutable *proto* property.
          isProperty = function(property){

            // Capture and break the object's prototype chain (see section 8.6.2
            // of the ES 5.1 spec). The parenthesized expression prevents an
            // unsafe transformation by the Closure Compiler.
            var original = this.__proto__,result = property in (this.__proto__ = null, this);
            // Restore the original prototype chain.
            this.__proto__ = original;
            return result;
          };
        } else {

          // Capture a reference to the top-level `Object` constructor.
          constructor = members.constructor;
          // Use the `constructor` property to simulate `Object#hasOwnProperty` in
          // other environments.
          isProperty = function(property){

            var parent = (this.constructor || constructor).prototype;
            return property in this && !(property in parent && this[property] === parent[property]);
          };
        };
        members = null;
        return isProperty.call(this, property);
      };
    };
    // Internal: A set of primitive types used by `isHostType`.
    var PrimitiveTypes = {
      'boolean' : 1,
      'number' : 1,
      'string' : 1,
      'undefined' : 1
    };
    // Internal: Determines if the given object `property` value is a
    // non-primitive.
    var isHostType = function(object, property){

      var type = typeof object[property];
      return type == 'object' ? !!object[property] : !PrimitiveTypes[type];
    };
    // Internal: Normalizes the `for...in` iteration algorithm across
    // environments. Each enumerated key is yielded to a `callback` function.
    forEach = function(object, callback){

      var size = 0,Properties,members,property,forEach;
      // Tests for bugs in the current environment's `for...in` algorithm. The
      // `valueOf` property inherits the non-enumerable flag from
      // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
      (Properties = function(){

        this.valueOf = 0;
      }).prototype.valueOf = 0;
      // Iterate over a new instance of the `Properties` class.
      members = new Properties();
      for(property in members){

        // Ignore all properties inherited from `Object.prototype`.
        if(isProperty.call(members, property)){

          size++;
        };
      };
      Properties = members = null;
      // Normalize the iteration algorithm.
      if(!size){

        // A list of non-enumerable properties inherited from `Object.prototype`.
        members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
        // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
        // properties.
        forEach = function(object, callback){

          var isFunction = getClass.call(object) == functionClass,property,length;
          var hasProperty = !isFunction && typeof object.constructor != 'function' && isHostType(object, 'hasOwnProperty') ? object.hasOwnProperty : isProperty;
          for(property in object){

            // Gecko <= 1.0 enumerates the `prototype` property of functions under
            // certain conditions; IE does not.
            if(!(isFunction && property == "prototype") && hasProperty.call(object, property)){

              callback(property);
            };
          };
          // Manually invoke the callback for each non-enumerable property.
          for(length = members.length;property = members[--length];hasProperty.call(object, property) && callback(property));
        };
      } else if(size == 2){

        // Safari <= 2.0.4 enumerates shadowed properties twice.
        forEach = function(object, callback){

          // Create a set of iterated properties.
          var members = {
          },isFunction = getClass.call(object) == functionClass,property;
          for(property in object){

            // Store each property name to prevent double enumeration. The
            // `prototype` property of functions is not enumerated due to cross-
            // environment inconsistencies.
            if(!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)){

              callback(property);
            };
          };
        };
      } else {

        // No bugs detected; use the standard `for...in` algorithm.
        forEach = function(object, callback){

          var isFunction = getClass.call(object) == functionClass,property,isConstructor;
          for(property in object){

            if(!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")){

              callback(property);
            };
          };
          // Manually invoke the callback for the `constructor` property due to
          // cross-environment inconsistencies.
          if(isConstructor || isProperty.call(object, (property = "constructor"))){

            callback(property);
          };
        };
      };
      return forEach(object, callback);
    };
    // Public: Serializes a JavaScript `value` as a JSON string. The optional
    // `filter` argument may specify either a function that alters how object and
    // array members are serialized, or an array of strings and numbers that
    // indicates which properties should be serialized. The optional `width`
    // argument may be either a string or number that specifies the indentation
    // level of the output.
    if(!has("json-stringify")){

      // Internal: A map of control characters and their escaped equivalents.
      var Escapes = {
        '92' : "\\\\",
        '34' : '\\"',
        '8' : "\\b",
        '12' : "\\f",
        '10' : "\\n",
        '13' : "\\r",
        '9' : "\\t"
      };
      // Internal: Converts `value` into a zero-padded string such that its
      // length is at least equal to `width`. The `width` must be <= 6.
      var leadingZeroes = "000000";
      var toPaddedString = function(width, value){

        // The `|| 0` expression is necessary to work around a bug in
        // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
        return (leadingZeroes + (value || 0)).slice(-width);
      };
      // Internal: Double-quotes a string `value`, replacing all ASCII control
      // characters (characters with code unit values between 0 and 31) with
      // their escaped equivalents. This is an implementation of the
      // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
      var unicodePrefix = "\\u00";
      var quote = function(value){

        var result = '"',index = 0,length = value.length,isLarge = length > 10 && charIndexBuggy,symbols;
        if(isLarge){

          symbols = value.split("");
        };
        for(;index < length;index++){

          var charCode = value.charCodeAt(index);
          // If the character is a control character, append its Unicode or
          // shorthand escape sequence; otherwise, append the character as-is.
          switch(charCode){case 8:case 9:case 10:case 12:case 13:case 34:case 92:
          result += Escapes[charCode];
          break;default:
          if(charCode < 32){

            result += unicodePrefix + toPaddedString(2, charCode.toString(16));
            break;
          };
          result += isLarge ? symbols[index] : charIndexBuggy ? value.charAt(index) : value[index];};
        };
        return result + '"';
      };
      // Internal: Recursively serializes an object. Implements the
      // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
      var serialize = function(property, object, callback, properties, whitespace, indentation, stack){

        var value = object[property],className,year,month,date,time,hours,minutes,seconds,milliseconds,results,element,index,length,prefix,hasMembers,result;
        try{

          // Necessary for host object support.
          value = object[property];
        } catch(exception) {
        };
        if(typeof value == "object" && value){

          className = getClass.call(value);
          if(className == dateClass && !isProperty.call(value, "toJSON")){

            if(value > -1 / 0 && value < 1 / 0){

              // Dates are serialized according to the `Date#toJSON` method
              // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
              // for the ISO 8601 date time string format.
              if(getDay){

                // Manually compute the year, month, date, hours, minutes,
                // seconds, and milliseconds if the `getUTC*` methods are
                // buggy. Adapted from @Yaffle's `date-shim` project.
                date = floor(value / 864e5);
                for(year = floor(date / 365.2425) + 1970 - 1;getDay(year + 1, 0) <= date;year++);
                for(month = floor((date - getDay(year, 0)) / 30.42);getDay(year, month + 1) <= date;month++);
                date = 1 + date - getDay(year, month);
                // The `time` value specifies the time within the day (see ES
                // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                // to compute `A modulo B`, as the `%` operator does not
                // correspond to the `modulo` operation for negative numbers.
                time = (value % 864e5 + 864e5) % 864e5;
                // The hours, minutes, seconds, and milliseconds are obtained by
                // decomposing the time within the day. See section 15.9.1.10.
                hours = floor(time / 36e5) % 24;
                minutes = floor(time / 6e4) % 60;
                seconds = floor(time / 1e3) % 60;
                milliseconds = time % 1e3;
              } else {

                year = value.getUTCFullYear();
                month = value.getUTCMonth();
                date = value.getUTCDate();
                hours = value.getUTCHours();
                minutes = value.getUTCMinutes();
                seconds = value.getUTCSeconds();
                milliseconds = value.getUTCMilliseconds();
              };
              // Serialize extended years correctly.
              value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) + "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) + // Months, dates, hours, minutes, and seconds should have two
              // digits; milliseconds should have three.
              "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) + // Milliseconds are optional in ES 5.0, but required in 5.1.
              "." + toPaddedString(3, milliseconds) + "Z";
            } else {

              value = null;
            };
          } else if(typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))){

            // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
            // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
            // ignores all `toJSON` methods on these objects unless they are
            // defined directly on an instance.
            value = value.toJSON(property);
          };
        };
        if(callback){

          // If a replacement function was provided, call it to obtain the value
          // for serialization.
          value = callback.call(object, property, value);
        };
        if(value === null){

          return "null";
        };
        className = getClass.call(value);
        if(className == booleanClass){

          // Booleans are represented literally.
          return "" + value;
        } else if(className == numberClass){

          // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
          // `"null"`.
          return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
        } else if(className == stringClass){

          // Strings are double-quoted and escaped.
          return quote("" + value);
        };;
        // Recursively serialize objects and arrays.
        if(typeof value == "object"){

          // Check for cyclic structures. This is a linear search; performance
          // is inversely proportional to the number of unique nested objects.
          for(length = stack.length;length--;){

            if(stack[length] === value){

              // Cyclic structures cannot be serialized by `JSON.stringify`.
              throw TypeError();
            };
          };
          // Add the object to the stack of traversed objects.
          stack.push(value);
          results = [];
          // Save the current indentation level and indent one additional level.
          prefix = indentation;
          indentation += whitespace;
          if(className == arrayClass){

            // Recursively serialize array elements.
            for(index = 0,length = value.length;index < length;hasMembers || (hasMembers = true),index++){

              element = serialize(index, value, callback, properties, whitespace, indentation, stack);
              results.push(element === undef ? "null" : element);
            };
            result = hasMembers ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
          } else {

            // Recursively serialize object members. Members are selected from
            // either a user-specified list of property names, or the object
            // itself.
            forEach(properties || value, function(property){

              var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
              if(element !== undef){

                // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                // is not the empty string, let `member` {quote(property) + ":"}
                // be the concatenation of `member` and the `space` character."
                // The "`space` character" refers to the literal space
                // character, not the `space` {width} argument provided to
                // `JSON.stringify`.
                results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
              };
              hasMembers || (hasMembers = true);
            });
            result = hasMembers ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
          };
          // Remove the object from the traversed object stack.
          stack.pop();
          return result;
        };
      };
      // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
      JSON3.stringify = function(source, filter, width){

        var whitespace,callback,properties;
        if(typeof filter == "function" || typeof filter == "object" && filter){

          if(getClass.call(filter) == functionClass){

            callback = filter;
          } else if(getClass.call(filter) == arrayClass){

            // Convert the property names array into a makeshift set.
            properties = {
            };
            for(var index = 0,length = filter.length,value;index < length;value = filter[index++],((getClass.call(value) == stringClass || getClass.call(value) == numberClass) && (properties[value] = 1)));
          };
        };
        if(width){

          if(getClass.call(width) == numberClass){

            // Convert the `width` to an integer and create a string containing
            // `width` number of space characters.
            if((width -= width % 1) > 0){

              for(whitespace = "",width > 10 && (width = 10);whitespace.length < width;whitespace += " ");
            };
          } else if(getClass.call(width) == stringClass){

            whitespace = width.length <= 10 ? width : width.slice(0, 10);
          };
        };
        // Opera <= 7.54u2 discards the values associated with empty string keys
        // (`""`) only if they are used directly within an object member list
        // (e.g., `!("" in { "": 1})`).
        return serialize("", (value = {
        }, value[""] = source, value), callback, properties, whitespace, "", []);
      };
    };
    // Public: Parses a JSON source string.
    if(!has("json-parse")){

      var fromCharCode = String.fromCharCode;
      // Internal: A map of escaped control characters and their unescaped
      // equivalents.
      var Unescapes = {
        '92' : "\\",
        '34' : '"',
        '47' : "/",
        '98' : "\b",
        '116' : "\t",
        '110' : "\n",
        '102' : "\f",
        '114' : "\r"
      };
      // Internal: Stores the parser state.
      var Index,Source;
      // Internal: Resets the parser state and throws a `SyntaxError`.
      var abort = function(){

        Index = Source = null;
        throw SyntaxError();
      };
      // Internal: Returns the next token, or `"$"` if the parser has reached
      // the end of the source string. A token may be a string, number, `null`
      // literal, or Boolean literal.
      var lex = function(){

        var source = Source,length = source.length,value,begin,position,isSigned,charCode;
        while(Index < length){

          charCode = source.charCodeAt(Index);
          switch(charCode){case 9:case 10:case 13:case 32:
          // Skip whitespace tokens, including tabs, carriage returns, line
          // feeds, and space characters.
          Index++;
          break;case 123:case 125:case 91:case 93:case 58:case 44:
          // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
          // the current position.
          value = charIndexBuggy ? source.charAt(Index) : source[Index];
          Index++;
          return value;case 34:
          // `"` delimits a JSON string; advance to the next character and
          // begin parsing the string. String tokens are prefixed with the
          // sentinel `@` character to distinguish them from punctuators and
          // end-of-string tokens.
          for(value = "@",Index++;Index < length;){

            charCode = source.charCodeAt(Index);
            if(charCode < 32){

              // Unescaped ASCII control characters (those with a code unit
              // less than the space character) are not permitted.
              abort();
            } else if(charCode == 92){

              // A reverse solidus (`\`) marks the beginning of an escaped
              // control character (including `"`, `\`, and `/`) or Unicode
              // escape sequence.
              charCode = source.charCodeAt(++Index);
              switch(charCode){case 92:case 34:case 47:case 98:case 116:case 110:case 102:case 114:
              // Revive escaped control characters.
              value += Unescapes[charCode];
              Index++;
              break;case 117:
              // `\u` marks the beginning of a Unicode escape sequence.
              // Advance to the first character and validate the
              // four-digit code point.
              begin = ++Index;
              for(position = Index + 4;Index < position;Index++){

                charCode = source.charCodeAt(Index);
                // A valid sequence comprises four hexdigits (case-
                // insensitive) that form a single hexadecimal value.
                if(!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)){

                  // Invalid Unicode escape sequence.
                  abort();
                };
              };
              // Revive the escaped character.
              value += fromCharCode("0x" + source.slice(begin, Index));
              break;default:
              // Invalid escape sequence.
              abort();};
            } else {

              if(charCode == 34){

                // An unescaped double-quote character marks the end of the
                // string.
                break;
              };
              charCode = source.charCodeAt(Index);
              begin = Index;
              // Optimize for the common case where a string is valid.
              while(charCode >= 32 && charCode != 92 && charCode != 34){

                charCode = source.charCodeAt(++Index);
              };
              // Append the string as-is.
              value += source.slice(begin, Index);
            };
          };
          if(source.charCodeAt(Index) == 34){

            // Advance to the next character and return the revived string.
            Index++;
            return value;
          };
          // Unterminated string.
          abort();default:
          // Parse numbers and literals.
          begin = Index;
          // Advance past the negative sign, if one is specified.
          if(charCode == 45){

            isSigned = true;
            charCode = source.charCodeAt(++Index);
          };
          // Parse an integer or floating-point value.
          if(charCode >= 48 && charCode <= 57){

            // Leading zeroes are interpreted as octal literals.
            if(charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)){

              // Illegal octal literal.
              abort();
            };
            isSigned = false;
            // Parse the integer component.
            for(;Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57);Index++);
            // Floats cannot contain a leading decimal point; however, this
            // case is already accounted for by the parser.
            if(source.charCodeAt(Index) == 46){

              position = ++Index;
              // Parse the decimal component.
              for(;position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57);position++);
              if(position == Index){

                // Illegal trailing decimal.
                abort();
              };
              Index = position;
            };
            // Parse exponents. The `e` denoting the exponent is
            // case-insensitive.
            charCode = source.charCodeAt(Index);
            if(charCode == 101 || charCode == 69){

              charCode = source.charCodeAt(++Index);
              // Skip past the sign following the exponent, if one is
              // specified.
              if(charCode == 43 || charCode == 45){

                Index++;
              };
              // Parse the exponential component.
              for(position = Index;position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57);position++);
              if(position == Index){

                // Illegal empty exponent.
                abort();
              };
              Index = position;
            };
            // Coerce the parsed value to a JavaScript number.
            return +source.slice(begin, Index);
          };
          // A negative sign may only precede numbers.
          if(isSigned){

            abort();
          };
          // `true`, `false`, and `null` literals.
          if(source.slice(Index, Index + 4) == "true"){

            Index += 4;
            return true;
          } else if(source.slice(Index, Index + 5) == "false"){

            Index += 5;
            return false;
          } else if(source.slice(Index, Index + 4) == "null"){

            Index += 4;
            return null;
          };;
          // Unrecognized token.
          abort();};
        };
        // Return the sentinel `$` character if the parser has reached the end
        // of the source string.
        return "$";
      };
      // Internal: Parses a JSON `value` token.
      var get = function(value){

        var results,hasMembers;
        if(value == "$"){

          // Unexpected end of input.
          abort();
        };
        if(typeof value == "string"){

          if((charIndexBuggy ? value.charAt(0) : value[0]) == "@"){

            // Remove the sentinel `@` character.
            return value.slice(1);
          };
          // Parse object and array literals.
          if(value == "["){

            // Parses a JSON array, returning a new JavaScript array.
            results = [];
            for(;;hasMembers || (hasMembers = true)){

              value = lex();
              // A closing square bracket marks the end of the array literal.
              if(value == "]"){

                break;
              };
              // If the array literal contains elements, the current token
              // should be a comma separating the previous element from the
              // next.
              if(hasMembers){

                if(value == ","){

                  value = lex();
                  if(value == "]"){

                    // Unexpected trailing `,` in array literal.
                    abort();
                  };
                } else {

                  // A `,` must separate each array element.
                  abort();
                };
              };
              // Elisions and leading commas are not permitted.
              if(value == ","){

                abort();
              };
              results.push(get(value));
            };
            return results;
          } else if(value == "{"){

            // Parses a JSON object, returning a new JavaScript object.
            results = {
            };
            for(;;hasMembers || (hasMembers = true)){

              value = lex();
              // A closing curly brace marks the end of the object literal.
              if(value == "}"){

                break;
              };
              // If the object literal contains members, the current token
              // should be a comma separator.
              if(hasMembers){

                if(value == ","){

                  value = lex();
                  if(value == "}"){

                    // Unexpected trailing `,` in object literal.
                    abort();
                  };
                } else {

                  // A `,` must separate each object member.
                  abort();
                };
              };
              // Leading commas are not permitted, object property names must be
              // double-quoted strings, and a `:` must separate each property
              // name and value.
              if(value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":"){

                abort();
              };
              results[value.slice(1)] = get(lex());
            };
            return results;
          };
          // Unexpected token encountered.
          abort();
        };
        return value;
      };
      // Internal: Updates a traversed object member.
      var update = function(source, property, callback){

        var element = walk(source, property, callback);
        if(element === undef){

          delete source[property];
        } else {

          source[property] = element;
        };
      };
      // Internal: Recursively traverses a parsed JSON object, invoking the
      // `callback` function for each value. This is an implementation of the
      // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
      var walk = function(source, property, callback){

        var value = source[property],length;
        if(typeof value == "object" && value){

          // `forEach` can't be used to traverse an array in Opera <= 8.54
          // because its `Object#hasOwnProperty` implementation returns `false`
          // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
          if(getClass.call(value) == arrayClass){

            for(length = value.length;length--;){

              update(value, length, callback);
            };
          } else {

            forEach(value, function(property){

              update(value, property, callback);
            });
          };
        };
        return callback.call(source, property, value);
      };
      // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
      JSON3.parse = function(source, callback){

        var result,value;
        Index = 0;
        Source = "" + source;
        result = get(lex());
        // If a JSON string contains multiple tokens, it is invalid.
        if(lex() != "$"){

          abort();
        };
        // Reset the parser state.
        Index = Source = null;
        return callback && getClass.call(callback) == functionClass ? walk((value = {
        }, value[""] = result, value), "", callback) : result;
      };
    };
  };
  // Export for asynchronous module loaders.
  if(isLoader){

    define(function(){

      return JSON3;
    });
  };
}(this));
// End of original code.
// Finally expose (polyfilled) window.JSON as qx.lang.Json.JSON
qx.lang.Json.stringify = window.JSON.stringify;
qx.lang.Json.parse = window.JSON.parse;

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
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * Event handler Interface.
 *
 * All custom event handler like mouse or keyboard event handler must implement
 * this interface.
 */
qx.Interface.define("qx.event.IEventHandler", {
  statics : {
    /** @type {Integer} The event target must be a dom node */
    TARGET_DOMNODE : 1,
    /** @type {Integer} The event target must be a window object */
    TARGET_WINDOW : 2,
    /** @type {Integer} The event target must be a qooxdoo object */
    TARGET_OBJECT : 4,
    /** @type {Integer} The event target must be a document node */
    TARGET_DOCUMENT : 8
  },
  members : {
    /**
     * Whether the event handler can handle events of the given type. If the
     * event handler class has a static variable called <code>IGNORE_CAN_HANDLE</code>
     * with the value <code>true</code> this function is not called. Whether the
     * handler can handle the event is them only determined by the static variables
     * <code>SUPPORTED_TYPES</code> and <code>TARGET_CHECK</code>.
     *
     * @param target {var} The target to, which the event handler should
     *     be attached
     * @param type {String} event type
     * @return {Boolean} Whether the event handler can handle events of the
     *     given type.
     */
    canHandleEvent : function(target, type){
    },
    /**
     * This method is called each time an event listener, for one of the
     * supported events, is added using {@link qx.event.Manager#addListener}.
     *
     * @param target {var} The target to, which the event handler should
     *     be attached
     * @param type {String} event type
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event.
     */
    registerEvent : function(target, type, capture){
    },
    /**
     * This method is called each time an event listener, for one of the
     * supported events, is removed by using {@link qx.event.Manager#removeListener}
     * and no other event listener is listening on this type.
     *
     * @param target {var} The target from, which the event handler should
     *     be removed
     * @param type {String} event type
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event.
     */
    unregisterEvent : function(target, type, capture){
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */
/**
 * Wrapper for browser generic event handling.
 *
 * Supported events differ from target to target. Generally the handlers
 * in {@link qx.event.handler} defines the available features.
 *
 * @require(qx.event.Manager)
 * @require(qx.dom.Node)
 * @require(qx.lang.Function)
 */
qx.Class.define("qx.event.Registration", {
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /**
     * Static list of all instantiated event managers. The key is the qooxdoo
     * hash value of the corresponding window
     */
    __managers : {
    },
    /**
     * Get an instance of the event manager, which can handle events for the
     * given target.
     *
     * @param target {Object} Any valid event target
     * @return {qx.event.Manager} The event manger for the target.
     */
    getManager : function(target){

      if(target == null){

        {
        };
        target = window;
      } else if(target.nodeType){

        target = qx.dom.Node.getWindow(target);
      } else if(!qx.dom.Node.isWindow(target)){

        target = window;
      };;
      var hash = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var manager = this.__managers[hash];
      if(!manager){

        manager = new qx.event.Manager(target, this);
        this.__managers[hash] = manager;
      };
      return manager;
    },
    /**
     * Removes a manager for a specific window from the list.
     *
     * Normally only used when the manager gets disposed through
     * an unload event of the attached window.
     *
     * @param mgr {qx.event.Manager} The manager to remove
     */
    removeManager : function(mgr){

      var id = mgr.getWindowId();
      delete this.__managers[id];
    },
    /**
     * Add an event listener to a DOM target. The event listener is passed an
     * instance of {@link qx.event.type.Event} containing all relevant information
     * about the event as parameter.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Name of the event e.g. "click", "keydown", ...
     * @param listener {Function} Event listener function
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener. When not given, the corresponding dispatcher
     *         usually falls back to a default, which is the target
     *         by convention. Note this is not a strict requirement, i.e.
     *         custom dispatchers can follow a different strategy.
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event. The default is
     *         to attach the event handler to the bubbling phase.
     * @return {var} An opaque id, which can be used to remove the event listener
     *         using the {@link #removeListenerById} method.
     */
    addListener : function(target, type, listener, self, capture){

      return this.getManager(target).addListener(target, type, listener, self, capture);
    },
    /**
     * Remove an event listener from an event target.
     *
     * Note: All registered event listeners will automatically at page unload
     *   so it is not necessary to detach events in the destructor.
     *
     * @param target {Object} The event target
     * @param type {String} Name of the event
     * @param listener {Function} The pointer to the event listener
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener.
     * @param capture {Boolean} Whether to remove the event listener of
     *    the bubbling or of the capturing phase.
     * @return {Boolean} Whether the event was removed. Return <code>false</code> if
     *    the event was already removed before.
     */
    removeListener : function(target, type, listener, self, capture){

      return this.getManager(target).removeListener(target, type, listener, self, capture);
    },
    /**
     * Removes an event listener from an event target by an id returned by
     * {@link #addListener}
     *
     * @param target {Object} The event target
     * @param id {var} The id returned by {@link #addListener}
     * @return {Boolean} Whether the event was removed. Return <code>false</code> if
     *    the event was already removed before.
     */
    removeListenerById : function(target, id){

      return this.getManager(target).removeListenerById(target, id);
    },
    /**
     * Remove all event listeners, which are attached to the given event target.
     *
     * @param target {Object} The event target to remove all event listeners from.
     * @return {Boolean} Whether the events were existend and were removed successfully.
     */
    removeAllListeners : function(target){

      return this.getManager(target).removeAllListeners(target);
    },
    /**
     * Internal helper for deleting the listeners map used during shutdown.
     *
     * @param target {Object} The event target to delete the internal map for
     *    all event listeners.
     *
     * @internal
     */
    deleteAllListeners : function(target){

      var targetKey = target.$$hash;
      if(targetKey){

        this.getManager(target).deleteAllListeners(targetKey);
      };
    },
    /**
     * Check whether there are one or more listeners for an event type
     * registered at the target.
     *
     * @param target {Object} Any valid event target
     * @param type {String} The event type
     * @param capture {Boolean ? false} Whether to check for listeners of
     *         the bubbling or of the capturing phase.
     * @return {Boolean} Whether the target has event listeners of the given type.
     */
    hasListener : function(target, type, capture){

      return this.getManager(target).hasListener(target, type, capture);
    },
    /**
     * Returns a serialized array of all events attached on the given target.
     *
     * @param target {Object} Any valid event target
     * @return {Map[]} Array of maps where everyone contains the keys:
     *   <code>handler</code>, <code>self</code>, <code>type</code> and <code>capture</code>.
     */
    serializeListeners : function(target){

      return this.getManager(target).serializeListeners(target);
    },
    /**
     * Get an event instance of the given class, which can be dispatched using
     * an event manager. The created events must be initialized using
     * {@link qx.event.type.Event#init}.
     *
     * @param type {String} The type of the event to create
     * @param clazz {Object?qx.event.type.Event} The event class to use
     * @param args {Array?null} Array which will be passed to
     *       the event's init method.
     * @return {qx.event.type.Event} An instance of the given class.
     */
    createEvent : function(type, clazz, args){

      {
      };
      // Fallback to default
      if(clazz == null){

        clazz = qx.event.type.Event;
      };
      var obj = qx.event.Pool.getInstance().getObject(clazz);
      // Initialize with given arguments
      args ? obj.init.apply(obj, args) : obj.init();
      // Setup the type
      // Note: Native event may setup this later or using init() above
      // using the native information.
      if(type){

        obj.setType(type);
      };
      return obj;
    },
    /**
     * Dispatch an event object on the given target.
     *
     * It is normally better to use {@link #fireEvent} because it uses
     * the event pooling and is quite handy otherwise as well. After dispatching
     * the event object will be pooled for later reuse or disposed.
     *
     * @param target {Object} Any valid event target
     * @param event {qx.event.type.Event} The event object to dispatch. The event
     *       object must be obtained using {@link #createEvent} and initialized
     *       using {@link qx.event.type.Event#init}.
     * @return {Boolean} whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    dispatchEvent : function(target, event){

      return this.getManager(target).dispatchEvent(target, event);
    },
    /**
     * Create an event object and dispatch it on the given target.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Event type to fire
     * @param clazz {Class?qx.event.type.Event} The event class
     * @param args {Array?null} Arguments, which will be passed to
     *       the event's init method.
     * @return {Boolean} whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     * @see #createEvent
     */
    fireEvent : function(target, type, clazz, args){

      {

        var msg;
      };
      var evt = this.createEvent(type, clazz || null, args);
      return this.getManager(target).dispatchEvent(target, evt);
    },
    /**
     * Create an event object and dispatch it on the given target.
     * The event dispatched with this method does never bubble! Use only if you
     * are sure that bubbling is not required.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Event type to fire
     * @param clazz {Class?qx.event.type.Event} The event class
     * @param args {Array?null} Arguments, which will be passed to
     *       the event's init method.
     * @return {Boolean} whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     * @see #createEvent
     */
    fireNonBubblingEvent : function(target, type, clazz, args){

      {
      };
      var mgr = this.getManager(target);
      if(!mgr.hasListener(target, type, false)){

        return true;
      };
      var evt = this.createEvent(type, clazz || null, args);
      return mgr.dispatchEvent(target, evt);
    },
    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER/DISPATCHER PRIORITY
    ---------------------------------------------------------------------------
    */
    /** @type {Integer} Highest priority. Used by handlers and dispatchers. */
    PRIORITY_FIRST : -32000,
    /** @type {Integer} Default priority. Used by handlers and dispatchers. */
    PRIORITY_NORMAL : 0,
    /** @type {Integer} Lowest priority. Used by handlers and dispatchers. */
    PRIORITY_LAST : 32000,
    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER REGISTRATION
    ---------------------------------------------------------------------------
    */
    /** @type {Array} Contains all known event handlers */
    __handlers : [],
    /**
     * Register an event handler.
     *
     * @param handler {qx.event.IEventHandler} Event handler to add
     * @throws {Error} if the handler does not have the IEventHandler interface.
     */
    addHandler : function(handler){

      {
      };
      // Append to list
      this.__handlers.push(handler);
      // Re-sort list
      this.__handlers.sort(function(a, b){

        return a.PRIORITY - b.PRIORITY;
      });
    },
    /**
     * Get a list of registered event handlers.
     *
     * @return {qx.event.IEventHandler[]} registered event handlers
     */
    getHandlers : function(){

      return this.__handlers;
    },
    /*
    ---------------------------------------------------------------------------
      EVENT DISPATCHER REGISTRATION
    ---------------------------------------------------------------------------
    */
    /** @type {Array} Contains all known event dispatchers */
    __dispatchers : [],
    /**
     * Register an event dispatcher.
     *
     * @param dispatcher {qx.event.IEventDispatcher} Event dispatcher to add
     * @param priority {Integer} One of
     * {@link qx.event.Registration#PRIORITY_FIRST},
     * {@link qx.event.Registration#PRIORITY_NORMAL}
     *       or {@link qx.event.Registration#PRIORITY_LAST}.
     * @throws {Error} if the dispatcher does not have the IEventHandler interface.
     */
    addDispatcher : function(dispatcher, priority){

      {
      };
      // Append to list
      this.__dispatchers.push(dispatcher);
      // Re-sort list
      this.__dispatchers.sort(function(a, b){

        return a.PRIORITY - b.PRIORITY;
      });
    },
    /**
     * Get a list of registered event dispatchers.
     *
     * @return {qx.event.IEventDispatcher[]} all registered event dispatcher
     */
    getDispatchers : function(){

      return this.__dispatchers;
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This mixin offers basic event handling capabilities. It includes the
 * commonly known methods for managing event listeners and firing events.
 *
 * @use(qx.event.dispatch.Direct)
 * @use(qx.event.handler.Object)
 */
qx.Mixin.define("qx.core.MEvent", {
  members : {
    /** @type {Class} Pointer to the regular event registration class */
    __Registration : qx.event.Registration,
    /**
     * Add event listener to this object.
     *
     * @param type {String} name of the event type
     * @param listener {Function} event callback function
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener. When not given, the corresponding dispatcher
     *         usually falls back to a default, which is the target
     *         by convention. Note this is not a strict requirement, i.e.
     *         custom dispatchers can follow a different strategy.
     * @param capture {Boolean ? false} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event. The default is
     *         to attach the event handler to the bubbling phase.
     * @return {String} An opaque id, which can be used to remove the event listener
     *         using the {@link #removeListenerById} method.
     */
    addListener : function(type, listener, self, capture){

      if(!this.$$disposed){

        return this.__Registration.addListener(this, type, listener, self, capture);
      };
      return null;
    },
    /**
     * Add event listener to this object, which is only called once. After the
     * listener is called the event listener gets removed.
     *
     * @param type {String} name of the event type
     * @param listener {Function} event callback function
     * @param self {Object ? window} reference to the 'this' variable inside the callback
     * @param capture {Boolean ? false} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event. The default is
     *         to attach the event handler to the bubbling phase.
     * @return {String} An opaque id, which can be used to remove the event listener
     *         using the {@link #removeListenerById} method.
     */
    addListenerOnce : function(type, listener, self, capture){

      var callback = function(e){

        this.removeListener(type, listener, this, capture);
        listener.call(self || this, e);
      };
      listener.$$wrapped_callback = callback;
      return this.addListener(type, callback, this, capture);
    },
    /**
     * Remove event listener from this object
     *
     * @param type {String} name of the event type
     * @param listener {Function} event callback function
     * @param self {Object ? null} reference to the 'this' variable inside the callback
     * @param capture {Boolean} Whether to remove the event listener of
     *   the bubbling or of the capturing phase.
     * @return {Boolean} Whether the event was removed successfully (has existed)
     */
    removeListener : function(type, listener, self, capture){

      if(!this.$$disposed){

        // special handling for wrapped once listener
        if(listener.$$wrapped_callback){

          var callback = listener.$$wrapped_callback;
          delete listener.$$wrapped_callback;
          listener = callback;
        };
        return this.__Registration.removeListener(this, type, listener, self, capture);
      };
      return false;
    },
    /**
     * Removes an event listener from an event target by an id returned by
     * {@link #addListener}
     *
     * @param id {String} The id returned by {@link #addListener}
     * @return {Boolean} Whether the event was removed successfully (has existed)
     */
    removeListenerById : function(id){

      if(!this.$$disposed){

        return this.__Registration.removeListenerById(this, id);
      };
      return false;
    },
    /**
     * Check if there are one or more listeners for an event type.
     *
     * @param type {String} name of the event type
     * @param capture {Boolean ? false} Whether to check for listeners of
     *         the bubbling or of the capturing phase.
     * @return {Boolean} Whether the object has a listener of the given type.
     */
    hasListener : function(type, capture){

      return this.__Registration.hasListener(this, type, capture);
    },
    /**
     * Dispatch an event on this object
     *
     * @param evt {qx.event.type.Event} event to dispatch
     * @return {Boolean} Whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    dispatchEvent : function(evt){

      if(!this.$$disposed){

        return this.__Registration.dispatchEvent(this, evt);
      };
      return true;
    },
    /**
     * Creates and dispatches an event on this object.
     *
     * @param type {String} Event type to fire
     * @param clazz {Class?qx.event.type.Event} The event class
     * @param args {Array?null} Arguments, which will be passed to
     *       the event's init method.
     * @return {Boolean} Whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    fireEvent : function(type, clazz, args){

      if(!this.$$disposed){

        return this.__Registration.fireEvent(this, type, clazz, args);
      };
      return true;
    },
    /**
     * Create an event object and dispatch it on this object.
     * The event dispatched with this method does never bubble! Use only if you
     * are sure that bubbling is not required.
     *
     * @param type {String} Event type to fire
     * @param clazz {Class?qx.event.type.Event} The event class
     * @param args {Array?null} Arguments, which will be passed to
     *       the event's init method.
     * @return {Boolean} Whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    fireNonBubblingEvent : function(type, clazz, args){

      if(!this.$$disposed){

        return this.__Registration.fireNonBubblingEvent(this, type, clazz, args);
      };
      return true;
    },
    /**
     * Creates and dispatches an non-bubbling data event on this object.
     *
     * @param type {String} Event type to fire
     * @param data {var} User defined data attached to the event object
     * @param oldData {var?null} The event's old data (optional)
     * @param cancelable {Boolean?false} Whether or not an event can have its default
     *     action prevented. The default action can either be the browser's
     *     default action of a native event (e.g. open the context menu on a
     *     right click) or the default action of a qooxdoo class (e.g. close
     *     the window widget). The default action can be prevented by calling
     *     {@link qx.event.type.Event#preventDefault}
     * @return {Boolean} Whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    fireDataEvent : function(type, data, oldData, cancelable){

      if(!this.$$disposed){

        if(oldData === undefined){

          oldData = null;
        };
        return this.__Registration.fireNonBubblingEvent(this, type, qx.event.type.Data, [data, oldData, !!cancelable]);
      };
      return true;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * All event dispatchers must implement this interface. Event dispatchers must
 * register themselves at the event Manager using
 * {@link qx.event.Registration#addDispatcher}.
 */
qx.Interface.define("qx.event.IEventDispatcher", {
  members : {
    /**
     * Whether the dispatcher is responsible for the this event.
     *
     * @param target {Element|Event} The event dispatch target
     * @param event {qx.event.type.Event} The event object
     * @param type {String} the event type
     * @return {Boolean} Whether the event dispatcher is responsible for the this event
     */
    canDispatchEvent : function(target, event, type){

      this.assertInstance(event, qx.event.type.Event);
      this.assertString(type);
    },
    /**
     * This function dispatches the event to the event listeners.
     *
     * @param target {Element|Event} The event dispatch target
     * @param event {qx.event.type.Event} event object to dispatch
     * @param type {String} the event type
     */
    dispatchEvent : function(target, event, type){

      this.assertInstance(event, qx.event.type.Event);
      this.assertString(type);
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * The qooxdoo root class. All other classes are direct or indirect subclasses of this one.
 *
 * This class contains methods for:
 *
 * * object management (creation and destruction)
 * * interfaces for event system
 * * generic setter/getter support
 * * interfaces for logging console
 * * user friendly OO interfaces like {@link #self} or {@link #base}
 *
 * @require(qx.core.ObjectRegistry)
 */
qx.Class.define("qx.core.Object", {
  extend : Object,
  include : qx.core.Environment.filter({
    "module.databinding" : qx.data.MBinding,
    "module.logger" : qx.core.MLogging,
    "module.events" : qx.core.MEvent,
    "module.property" : qx.core.MProperty
  }),
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  /**
   * Create a new instance
   */
  construct : function(){

    qx.core.ObjectRegistry.register(this);
  },
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /** Internal type */
    $$type : "Object"
  },
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    __Property : qx.core.Environment.get("module.property") ? qx.core.Property : null,
    /*
    ---------------------------------------------------------------------------
      BASICS
    ---------------------------------------------------------------------------
    */
    /**
     * Return unique hash code of object
     *
     * @return {Integer} unique hash code of the object
     */
    toHashCode : function(){

      return this.$$hash;
    },
    /**
     * Returns a string representation of the qooxdoo object.
     *
     * @return {String} string representation of the object
     */
    toString : function(){

      return this.classname + "[" + this.$$hash + "]";
    },
    /**
     * Call the same method of the super class.
     *
     * @param args {arguments} the arguments variable of the calling method
     * @param varargs {var} variable number of arguments passed to the overwritten function
     * @return {var} the return value of the method of the base class.
     */
    base : function(args, varargs){

      {
      };
      if(arguments.length === 1){

        return args.callee.base.call(this);
      } else {

        return args.callee.base.apply(this, Array.prototype.slice.call(arguments, 1));
      };
    },
    /**
     * Returns the static class (to access static members of this class)
     *
     * @param args {arguments} the arguments variable of the calling method
     * @return {var} the return value of the method of the base class.
     */
    self : function(args){

      return args.callee.self;
    },
    /*
    ---------------------------------------------------------------------------
      CLONE SUPPORT
    ---------------------------------------------------------------------------
    */
    /**
     * EXPERIMENTAL - NOT READY FOR PRODUCTION
     *
     * Returns a clone of this object. Copies over all user configured
     * property values. Do not configure a parent nor apply the appearance
     * styles directly.
     *
     * @return {qx.core.Object} The clone
     */
    clone : function(){

      if(!qx.core.Environment.get("module.property")){

        throw new Error("Cloning only possible with properties.");
      };
      var clazz = this.constructor;
      var clone = new clazz;
      var props = qx.Class.getProperties(clazz);
      var user = this.__Property.$$store.user;
      var setter = this.__Property.$$method.set;
      var name;
      // Iterate through properties
      for(var i = 0,l = props.length;i < l;i++){

        name = props[i];
        if(this.hasOwnProperty(user[name])){

          clone[setter[name]](this[user[name]]);
        };
      };
      // Return clone
      return clone;
    },
    /*
    ---------------------------------------------------------------------------
      USER DATA
    ---------------------------------------------------------------------------
    */
    /** @type {Map} stored user data */
    __userData : null,
    /**
     * Store user defined data inside the object.
     *
     * @param key {String} the key
     * @param value {Object} the value of the user data
     */
    setUserData : function(key, value){

      if(!this.__userData){

        this.__userData = {
        };
      };
      this.__userData[key] = value;
    },
    /**
     * Load user defined data from the object
     *
     * @param key {String} the key
     * @return {Object} the user data
     */
    getUserData : function(key){

      if(!this.__userData){

        return null;
      };
      var data = this.__userData[key];
      return data === undefined ? null : data;
    },
    /*
    ---------------------------------------------------------------------------
      DISPOSER
    ---------------------------------------------------------------------------
    */
    /**
     * Returns true if the object is disposed.
     *
     * @return {Boolean} Whether the object has been disposed
     */
    isDisposed : function(){

      return this.$$disposed || false;
    },
    /**
     * Dispose this object
     *
     */
    dispose : function(){

      // Check first
      if(this.$$disposed){

        return;
      };
      // Mark as disposed (directly, not at end, to omit recursions)
      this.$$disposed = true;
      this.$$instance = null;
      this.$$allowconstruct = null;
      {
      };
      // Deconstructor support for classes
      var clazz = this.constructor;
      var mixins;
      while(clazz.superclass){

        // Processing this class...
        if(clazz.$$destructor){

          clazz.$$destructor.call(this);
        };
        // Destructor support for mixins
        if(clazz.$$includes){

          mixins = clazz.$$flatIncludes;
          for(var i = 0,l = mixins.length;i < l;i++){

            if(mixins[i].$$destructor){

              mixins[i].$$destructor.call(this);
            };
          };
        };
        // Jump up to next super class
        clazz = clazz.superclass;
      };
      {

        var key,value;
      };
    },
    /*
    ---------------------------------------------------------------------------
      DISPOSER UTILITIES
    ---------------------------------------------------------------------------
    */
    /**
     * Disconnects and disposes given objects from instance.
     * Only works with qx.core.Object based objects e.g. Widgets.
     *
     * @param varargs {arguments} Names of fields (which store objects) to dispose
     */
    _disposeObjects : function(varargs){

      qx.util.DisposeUtil.disposeObjects(this, arguments);
    },
    /**
     * Disconnects and disposes given singleton objects from instance.
     * Only works with qx.core.Object based objects e.g. Widgets.
     *
     * @param varargs {arguments} Names of fields (which store objects) to dispose
     */
    _disposeSingletonObjects : function(varargs){

      qx.util.DisposeUtil.disposeObjects(this, arguments, true);
    },
    /**
     * Disposes all members of the given array and deletes
     * the field which refers to the array afterwards.
     *
     * @param field {String} Name of the field which refers to the array
     */
    _disposeArray : function(field){

      qx.util.DisposeUtil.disposeArray(this, field);
    },
    /**
     * Disposes all members of the given map and deletes
     * the field which refers to the map afterwards.
     *
     * @param field {String} Name of the field which refers to the map
     */
    _disposeMap : function(field){

      qx.util.DisposeUtil.disposeMap(this, field);
    }
  },
  /*
  *****************************************************************************
     ENVIRONMENT SETTINGS
  *****************************************************************************
  */
  environment : {
    "qx.debug.dispose.level" : 0
  },
  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function(){

    if(qx.core.Environment.get("module.events")){

      if(!qx.core.ObjectRegistry.inShutDown){

        // Cleanup event listeners
        qx.event.Registration.removeAllListeners(this);
      } else {

        // on shutdown, just clear the internal listener map
        qx.event.Registration.deleteAllListeners(this);
      };
    };
    // Cleanup object registry
    qx.core.ObjectRegistry.unregister(this);
    // Cleanup user data
    this.__userData = null;
    // only of properties are available
    if(qx.core.Environment.get("module.property")){

      // Cleanup properties
      var clazz = this.constructor;
      var properties;
      var store = this.__Property.$$store;
      var storeUser = store.user;
      var storeTheme = store.theme;
      var storeInherit = store.inherit;
      var storeUseinit = store.useinit;
      var storeInit = store.init;
      while(clazz){

        properties = clazz.$$properties;
        if(properties){

          for(var name in properties){

            if(properties[name].dereference){

              this[storeUser[name]] = this[storeTheme[name]] = this[storeInherit[name]] = this[storeUseinit[name]] = this[storeInit[name]] = undefined;
            };
          };
        };
        clazz = clazz.superclass;
      };
    };
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

************************************************************************ */
/**
 * Methods to cleanup fields from maps/objects.
 *
 * @ignore(qx.log.Logger)
 * @ignore(qx.log)
 * @ignore(qx.ui.container.Composite)
 * @ignore(qx.ui.container.Scroll)
 * @ignore(qx.ui.container.SlideBar)
 * @ignore(qx.ui.container.Stack)
 */
qx.Class.define("qx.util.DisposeUtil", {
  statics : {
    /**
     * Disconnects and disposes given objects from instance.
     * Only works with qx.core.Object based objects e.g. Widgets.
     *
     * @param obj {Object} Object which contains the fields
     * @param arr {Array} List of fields (which store objects) to dispose
     * @param disposeSingletons {Boolean?} true, if singletons should be disposed
     */
    disposeObjects : function(obj, arr, disposeSingletons){

      var name;
      for(var i = 0,l = arr.length;i < l;i++){

        name = arr[i];
        if(obj[name] == null || !obj.hasOwnProperty(name)){

          continue;
        };
        if(!qx.core.ObjectRegistry.inShutDown){

          if(obj[name].dispose){

            // singletons
            if(!disposeSingletons && obj[name].constructor.$$instance){

              throw new Error("The object stored in key " + name + " is a singleton! Please use disposeSingleton instead.");
            } else {

              obj[name].dispose();
            };
          } else {

            throw new Error("Has no disposable object under key: " + name + "!");
          };
        };
        obj[name] = null;
      };
    },
    /**
     * Disposes all members of the given array and deletes
     * the field which refers to the array afterwards.
     *
     * @param obj {Object} Object which contains the field
     * @param field {String} Name of the field which refers to the array
     */
    disposeArray : function(obj, field){

      var data = obj[field];
      if(!data){

        return;
      };
      // Fast path for application shutdown
      if(qx.core.ObjectRegistry.inShutDown){

        obj[field] = null;
        return;
      };
      // Dispose all content
      try{

        var entry;
        for(var i = data.length - 1;i >= 0;i--){

          entry = data[i];
          if(entry){

            entry.dispose();
          };
        };
      } catch(ex) {

        throw new Error("The array field: " + field + " of object: " + obj + " has non disposable entries: " + ex);
      };
      // Reduce array size to zero
      data.length = 0;
      // Finally remove field
      obj[field] = null;
    },
    /**
     * Disposes all members of the given map and deletes
     * the field which refers to the map afterwards.
     *
     * @param obj {Object} Object which contains the field
     * @param field {String} Name of the field which refers to the array
     */
    disposeMap : function(obj, field){

      var data = obj[field];
      if(!data){

        return;
      };
      // Fast path for application shutdown
      if(qx.core.ObjectRegistry.inShutDown){

        obj[field] = null;
        return;
      };
      // Dispose all content
      try{

        var entry;
        for(var key in data){

          entry = data[key];
          if(data.hasOwnProperty(key) && entry){

            entry.dispose();
          };
        };
      } catch(ex) {

        throw new Error("The map field: " + field + " of object: " + obj + " has non disposable entries: " + ex);
      };
      // Finally remove field
      obj[field] = null;
    },
    /**
     * Disposes a given object when another object is disposed
     *
     * @param disposeMe {Object} Object to dispose when other object is disposed
     * @param trigger {Object} Other object
     *
     */
    disposeTriggeredBy : function(disposeMe, trigger){

      var triggerDispose = trigger.dispose;
      trigger.dispose = function(){

        triggerDispose.call(trigger);
        disposeMe.dispose();
      };
    },
    /**
     * Destroys a container and all of its children recursivly.
     * @param container {qx.ui.container.Composite | qx.ui.container.Scroll |
     *   qx.ui.container.SlideBar | qx.ui.container.Stack} Container to be destroyed
     */
    destroyContainer : function(container){

      {
      };
      var arr = [];
      this._collectContainerChildren(container, arr);
      var len = arr.length;
      for(var i = len - 1;i >= 0;i--){

        arr[i].destroy();
      };
      container.destroy();
    },
    /**
     * Helper function to collect all children widgets of an container recursivly.
     * @param container {qx.ui.container.Composite | qx.ui.container.Scroll | qx.ui.container.SlideBar | qx.ui.container.Stack} Container to be destroyed
     * @param arr {Array} Array wich holds all children widgets
     */
    _collectContainerChildren : function(container, arr){

      var children = container.getChildren();
      for(var i = 0;i < children.length;i++){

        var item = children[i];
        arr.push(item);
        if(this.__isChildrenContainer(item)){

          this._collectContainerChildren(item, arr);
        };
      };
    },
    /**
     * Checks if the given object is a qx container widget
     *
     * @param obj {Object} The object to check
     * @return {Boolean} <code>true</code> if the object is a container for
     * child widgets
     */
    __isChildrenContainer : function(obj){

      var classes = [qx.ui.container.Composite, qx.ui.container.Scroll, qx.ui.container.SlideBar, qx.ui.container.Stack];
      for(var i = 0,l = classes.length;i < l;i++){

        if(typeof classes[i] !== "undefined" && qx.Class.isSubClassOf(obj.constructor, classes[i])){

          return true;
        };
      };
      return false;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * Basic event object.
 *
 * Please note:
 * Event objects are only valid during the event dispatch. After the dispatch
 * event objects are pooled or disposed. If you want to safe a reference to an
 * event instance use the {@link #clone} method.
 *
 * The interface is modeled after the DOM level 2 event interface:
 * http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-interface
 *
 * @use(qx.event.Registration)
 */
qx.Class.define("qx.event.type.Event", {
  extend : qx.core.Object,
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /** The current event phase is the capturing phase. */
    CAPTURING_PHASE : 1,
    /** The event is currently being evaluated at the target */
    AT_TARGET : 2,
    /** The current event phase is the bubbling phase. */
    BUBBLING_PHASE : 3
  },
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    /**
     * Initialize the fields of the event. The event must be initialized before
     * it can be dispatched.
     *
     * @param canBubble {Boolean?false} Whether or not the event is a bubbling event.
     *     If the event is bubbling, the bubbling can be stopped using
     *     {@link #stopPropagation}
     * @param cancelable {Boolean?false} Whether or not an event can have its default
     *     action prevented. The default action can either be the browser's
     *     default action of a native event (e.g. open the context menu on a
     *     right click) or the default action of a qooxdoo class (e.g. close
     *     the window widget). The default action can be prevented by calling
     *     {@link #preventDefault}
     * @return {qx.event.type.Event} The initialized event instance
     */
    init : function(canBubble, cancelable){

      {
      };
      this._type = null;
      this._target = null;
      this._currentTarget = null;
      this._relatedTarget = null;
      this._originalTarget = null;
      this._stopPropagation = false;
      this._preventDefault = false;
      this._bubbles = !!canBubble;
      this._cancelable = !!cancelable;
      this._timeStamp = (new Date()).getTime();
      this._eventPhase = null;
      return this;
    },
    /**
     * Create a clone of the event object, which is not automatically disposed
     * or pooled after an event dispatch.
     *
     * @param embryo {qx.event.type.Event?null} Optional event class, which will
     *     be configured using the data of this event instance. The event must be
     *     an instance of this event class. If the value is <code>null</code>,
     *     a new pooled instance is created.
     * @return {qx.event.type.Event} a clone of this class.
     */
    clone : function(embryo){

      if(embryo){

        var clone = embryo;
      } else {

        var clone = qx.event.Pool.getInstance().getObject(this.constructor);
      };
      clone._type = this._type;
      clone._target = this._target;
      clone._currentTarget = this._currentTarget;
      clone._relatedTarget = this._relatedTarget;
      clone._originalTarget = this._originalTarget;
      clone._stopPropagation = this._stopPropagation;
      clone._bubbles = this._bubbles;
      clone._preventDefault = this._preventDefault;
      clone._cancelable = this._cancelable;
      return clone;
    },
    /**
     * Stops event from all further processing. Execute this when the
     * current handler should have "exclusive rights" to the event
     * and no further reaction by anyone else should happen.
     */
    stop : function(){

      if(this._bubbles){

        this.stopPropagation();
      };
      if(this._cancelable){

        this.preventDefault();
      };
    },
    /**
     * This method is used to prevent further propagation of an event during event
     * flow. If this method is called by any event listener the event will cease
     * propagating through the tree. The event will complete dispatch to all listeners
     * on the current event target before event flow stops.
     *
     */
    stopPropagation : function(){

      {
      };
      this._stopPropagation = true;
    },
    /**
     * Get whether further event propagation has been stopped.
     *
     * @return {Boolean} Whether further propagation has been stopped.
     */
    getPropagationStopped : function(){

      return !!this._stopPropagation;
    },
    /**
     * Prevent the default action of cancelable events, e.g. opening the context
     * menu, ...
     *
     */
    preventDefault : function(){

      {
      };
      this._preventDefault = true;
    },
    /**
     * Get whether the default action has been prevented
     *
     * @return {Boolean} Whether the default action has been prevented
     */
    getDefaultPrevented : function(){

      return !!this._preventDefault;
    },
    /**
     * The name of the event
     *
     * @return {String} name of the event
     */
    getType : function(){

      return this._type;
    },
    /**
     * Override the event type
     *
     * @param type {String} new event type
     */
    setType : function(type){

      this._type = type;
    },
    /**
     * Used to indicate which phase of event flow is currently being evaluated.
     *
     * @return {Integer} The current event phase. Possible values are
     *         {@link #CAPTURING_PHASE}, {@link #AT_TARGET} and {@link #BUBBLING_PHASE}.
     */
    getEventPhase : function(){

      return this._eventPhase;
    },
    /**
     * Override the event phase
     *
     * @param eventPhase {Integer} new event phase
     */
    setEventPhase : function(eventPhase){

      this._eventPhase = eventPhase;
    },
    /**
     * The time (in milliseconds relative to the epoch) at which the event was created.
     *
     * @return {Integer} the timestamp the event was created.
     */
    getTimeStamp : function(){

      return this._timeStamp;
    },
    /**
     * Returns the event target to which the event was originally
     * dispatched.
     *
     * @return {Element} target to which the event was originally
     *       dispatched.
     */
    getTarget : function(){

      return this._target;
    },
    /**
     * Override event target.
     *
     * @param target {Element} new event target
     */
    setTarget : function(target){

      this._target = target;
    },
    /**
     * Get the event target node whose event listeners are currently being
     * processed. This is particularly useful during event capturing and
     * bubbling.
     *
     * @return {Element} The target the event listener is currently
     *       dispatched on.
     */
    getCurrentTarget : function(){

      return this._currentTarget || this._target;
    },
    /**
     * Override current target.
     *
     * @param currentTarget {Element} new current target
     */
    setCurrentTarget : function(currentTarget){

      this._currentTarget = currentTarget;
    },
    /**
     * Get the related event target. This is only configured for
     * events which also had an influences on another element e.g.
     * mouseover/mouseout, focus/blur, ...
     *
     * @return {Element} The related target
     */
    getRelatedTarget : function(){

      return this._relatedTarget;
    },
    /**
     * Override related target.
     *
     * @param relatedTarget {Element} new related target
     */
    setRelatedTarget : function(relatedTarget){

      this._relatedTarget = relatedTarget;
    },
    /**
     * Get the original event target. This is only configured
     * for events which are fired by another event (often when
     * the target should be reconfigured for another view) e.g.
     * low-level DOM event to widget event.
     *
     * @return {Element} The original target
     */
    getOriginalTarget : function(){

      return this._originalTarget;
    },
    /**
     * Override original target.
     *
     * @param originalTarget {Element} new original target
     */
    setOriginalTarget : function(originalTarget){

      this._originalTarget = originalTarget;
    },
    /**
     * Check whether or not the event is a bubbling event. If the event can
     * bubble the value is true, else the value is false.
     *
     * @return {Boolean} Whether the event bubbles
     */
    getBubbles : function(){

      return this._bubbles;
    },
    /**
     * Set whether the event bubbles.
     *
     * @param bubbles {Boolean} Whether the event bubbles
     */
    setBubbles : function(bubbles){

      this._bubbles = bubbles;
    },
    /**
     * Get whether the event is cancelable
     *
     * @return {Boolean} Whether the event is cancelable
     */
    isCancelable : function(){

      return this._cancelable;
    },
    /**
     * Set whether the event is cancelable
     *
     * @param cancelable {Boolean} Whether the event is cancelable
     */
    setCancelable : function(cancelable){

      this._cancelable = cancelable;
    }
  },
  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function(){

    this._target = this._currentTarget = this._relatedTarget = this._originalTarget = null;
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     Simon Bull

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Simon Bull (sbull)
     * Sebastian Werner (wpbasti)

************************************************************************ */
/**
 * This class manages pooled Object instances.
 *
 * It exists mainly to minimise the amount of browser memory usage by reusing
 * window instances after they have been closed.  However, it could equally be
 * used to pool instances of any type of Object (expect singletons).
 *
 * It is the client's responsibility to ensure that pooled objects are not
 * referenced or used from anywhere else in the application.
 */
qx.Class.define("qx.util.ObjectPool", {
  extend : qx.core.Object,
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  /**
   * @param size {Integer} Size of each class pool
   */
  construct : function(size){

    this.base(arguments);
    this.__pool = {
    };
    if(size != null){

      this.setSize(size);
    };
  },
  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties : {
    /*
    ---------------------------------------------------------------------------
      PROPERTIES
    ---------------------------------------------------------------------------
    */
    /**
     * Number of objects of each class, which are pooled.
     *
     * A size of "null" represents an unlimited pool.
     */
    size : {
      check : "Integer",
      init : Infinity
    }
  },
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    /** @type {Map} Stores arrays of instances for all managed classes */
    __pool : null,
    /*
    ---------------------------------------------------------------------------
      IMPL
    ---------------------------------------------------------------------------
    */
    /**
     * This method finds and returns an instance of a requested type in the pool,
     * if there is one.  Note that the pool determines which instance (if any) to
     * return to the client.  The client cannot get a specific instance from the
     * pool.
     *
     * @param clazz {Class} A reference to a class from which an instance should be created.
     * @return {Object} An instance of the requested type. If non existed in the pool a new
     *   one is transparently created and returned.
     */
    getObject : function(clazz){

      if(this.$$disposed){

        return new clazz;
      };
      if(!clazz){

        throw new Error("Class needs to be defined!");
      };
      var obj = null;
      var pool = this.__pool[clazz.classname];
      if(pool){

        obj = pool.pop();
      };
      if(obj){

        obj.$$pooled = false;
      } else {

        obj = new clazz;
      };
      return obj;
    },
    /**
     * This method places an Object in a pool of Objects of its type. Note that
     * once an instance has been pooled, there is no means to get that exact
     * instance back. The instance may be discarded for garbage collection if
     * the pool of its type is already full.
     *
     * It is assumed that no other references exist to this Object, and that it will
     * not be used at all while it is pooled.
     *
     * @param obj {Object} An Object instance to pool.
     */
    poolObject : function(obj){

      // Dispose check
      if(!this.__pool){

        return;
      };
      var classname = obj.classname;
      var pool = this.__pool[classname];
      if(obj.$$pooled){

        throw new Error("Object is already pooled: " + obj);
      };
      if(!pool){

        this.__pool[classname] = pool = [];
      };
      // Check to see whether the pool for this type is already full
      if(pool.length > this.getSize()){

        // Use enhanced destroy() method instead of simple dispose
        // when available to work together with queues etc.
        if(obj.destroy){

          obj.destroy();
        } else {

          obj.dispose();
        };
        return;
      };
      obj.$$pooled = true;
      pool.push(obj);
    }
  },
  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function(){

    var pool = this.__pool;
    var classname,list,i,l;
    for(classname in pool){

      list = pool[classname];
      for(i = 0,l = list.length;i < l;i++){

        list[i].dispose();
      };
    };
    delete this.__pool;
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */
/**
 * Central instance pool for event objects. All event objects dispatched by the
 * event loader are pooled using this class.
 */
qx.Class.define("qx.event.Pool", {
  extend : qx.util.ObjectPool,
  type : "singleton",
  // Even though this class contains almost no code it is required because the
  // legacy code needs a place to patch the event pooling behavior.
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct : function(){

    this.base(arguments, 30);
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * Dispatches events directly on the event target (no bubbling nor capturing).
 */
qx.Class.define("qx.event.dispatch.Direct", {
  extend : qx.core.Object,
  implement : qx.event.IEventDispatcher,
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  /**
   * Create a new instance
   *
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager){

    this._manager = manager;
  },
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /** @type {Integer} Priority of this dispatcher */
    PRIORITY : qx.event.Registration.PRIORITY_LAST
  },
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    /*
    ---------------------------------------------------------------------------
      EVENT DISPATCHER INTERFACE
    ---------------------------------------------------------------------------
    */
    // interface implementation
    canDispatchEvent : function(target, event, type){

      return !event.getBubbles();
    },
    // interface implementation
    dispatchEvent : function(target, event, type){

      {

        var expectedEventClassName,expectedEventClass;
      };
      event.setEventPhase(qx.event.type.Event.AT_TARGET);
      var listeners = this._manager.getListeners(target, type, false);
      if(listeners){

        for(var i = 0,l = listeners.length;i < l;i++){

          var context = listeners[i].context || target;
          {
          };
          listeners[i].handler.call(context, event);
        };
      };
    }
  },
  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */
  defer : function(statics){

    qx.event.Registration.addDispatcher(statics);
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */
/**
 * This class provides qooxdoo object event support.
 */
qx.Class.define("qx.event.handler.Object", {
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_LAST,
    /** @type {Map} Supported event types */
    SUPPORTED_TYPES : null,
    /** @type {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_OBJECT,
    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : false
  },
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */
    // interface implementation
    canHandleEvent : function(target, type){

      return qx.Class.supportsEvent(target.constructor, type);
    },
    // interface implementation
    registerEvent : function(target, type, capture){
    },
    // interface implementation
    unregisterEvent : function(target, type, capture){
    }
  },
  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */
  defer : function(statics){

    qx.event.Registration.addHandler(statics);
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
 * Event object for data holding event or data changes.
 */
qx.Class.define("qx.event.type.Data", {
  extend : qx.event.type.Event,
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    __data : null,
    __old : null,
    /**
     * Initializes an event object.
     *
     * @param data {var} The event's new data
     * @param old {var?null} The event's old data (optional)
     * @param cancelable {Boolean?false} Whether or not an event can have its default
     *     action prevented. The default action can either be the browser's
     *     default action of a native event (e.g. open the context menu on a
     *     right click) or the default action of a qooxdoo class (e.g. close
     *     the window widget). The default action can be prevented by calling
     *     {@link qx.event.type.Event#preventDefault}
     * @return {qx.event.type.Data} the initialized instance.
     */
    init : function(data, old, cancelable){

      this.base(arguments, false, cancelable);
      this.__data = data;
      this.__old = old;
      return this;
    },
    /**
     * Get a copy of this object
     *
     * @param embryo {qx.event.type.Data?null} Optional event class, which will
     *     be configured using the data of this event instance. The event must be
     *     an instance of this event class. If the data is <code>null</code>,
     *     a new pooled instance is created.
     * @return {qx.event.type.Data} a copy of this object
     */
    clone : function(embryo){

      var clone = this.base(arguments, embryo);
      clone.__data = this.__data;
      clone.__old = this.__old;
      return clone;
    },
    /**
     * The new data of the event sending this data event.
     * The return data type is the same as the event data type.
     *
     * @return {var} The new data of the event
     */
    getData : function(){

      return this.__data;
    },
    /**
     * The old data of the event sending this data event.
     * The return data type is the same as the event data type.
     *
     * @return {var} The old data of the event
     */
    getOldData : function(){

      return this.__old;
    }
  },
  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function(){

    this.__data = this.__old = null;
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * A Collection of utility functions to escape and unescape strings.
 */
qx.Bootstrap.define("qx.bom.String", {
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /** Mapping of HTML entity names to the corresponding char code */
    TO_CHARCODE : {
      "quot" : 34,
      // " - double-quote
      "amp" : 38,
      // &
      "lt" : 60,
      // <
      "gt" : 62,
      // >
      // http://www.w3.org/TR/REC-html40/sgml/entities.html
      // ISO 8859-1 characters
      "nbsp" : 160,
      // no-break space
      "iexcl" : 161,
      // inverted exclamation mark
      "cent" : 162,
      // cent sign
      "pound" : 163,
      // pound sterling sign
      "curren" : 164,
      // general currency sign
      "yen" : 165,
      // yen sign
      "brvbar" : 166,
      // broken (vertical) bar
      "sect" : 167,
      // section sign
      "uml" : 168,
      // umlaut (dieresis)
      "copy" : 169,
      // copyright sign
      "ordf" : 170,
      // ordinal indicator, feminine
      "laquo" : 171,
      // angle quotation mark, left
      "not" : 172,
      // not sign
      "shy" : 173,
      // soft hyphen
      "reg" : 174,
      // registered sign
      "macr" : 175,
      // macron
      "deg" : 176,
      // degree sign
      "plusmn" : 177,
      // plus-or-minus sign
      "sup2" : 178,
      // superscript two
      "sup3" : 179,
      // superscript three
      "acute" : 180,
      // acute accent
      "micro" : 181,
      // micro sign
      "para" : 182,
      // pilcrow (paragraph sign)
      "middot" : 183,
      // middle dot
      "cedil" : 184,
      // cedilla
      "sup1" : 185,
      // superscript one
      "ordm" : 186,
      // ordinal indicator, masculine
      "raquo" : 187,
      // angle quotation mark, right
      "frac14" : 188,
      // fraction one-quarter
      "frac12" : 189,
      // fraction one-half
      "frac34" : 190,
      // fraction three-quarters
      "iquest" : 191,
      // inverted question mark
      "Agrave" : 192,
      // capital A, grave accent
      "Aacute" : 193,
      // capital A, acute accent
      "Acirc" : 194,
      // capital A, circumflex accent
      "Atilde" : 195,
      // capital A, tilde
      "Auml" : 196,
      // capital A, dieresis or umlaut mark
      "Aring" : 197,
      // capital A, ring
      "AElig" : 198,
      // capital AE diphthong (ligature)
      "Ccedil" : 199,
      // capital C, cedilla
      "Egrave" : 200,
      // capital E, grave accent
      "Eacute" : 201,
      // capital E, acute accent
      "Ecirc" : 202,
      // capital E, circumflex accent
      "Euml" : 203,
      // capital E, dieresis or umlaut mark
      "Igrave" : 204,
      // capital I, grave accent
      "Iacute" : 205,
      // capital I, acute accent
      "Icirc" : 206,
      // capital I, circumflex accent
      "Iuml" : 207,
      // capital I, dieresis or umlaut mark
      "ETH" : 208,
      // capital Eth, Icelandic
      "Ntilde" : 209,
      // capital N, tilde
      "Ograve" : 210,
      // capital O, grave accent
      "Oacute" : 211,
      // capital O, acute accent
      "Ocirc" : 212,
      // capital O, circumflex accent
      "Otilde" : 213,
      // capital O, tilde
      "Ouml" : 214,
      // capital O, dieresis or umlaut mark
      "times" : 215,
      // multiply sign
      "Oslash" : 216,
      // capital O, slash
      "Ugrave" : 217,
      // capital U, grave accent
      "Uacute" : 218,
      // capital U, acute accent
      "Ucirc" : 219,
      // capital U, circumflex accent
      "Uuml" : 220,
      // capital U, dieresis or umlaut mark
      "Yacute" : 221,
      // capital Y, acute accent
      "THORN" : 222,
      // capital THORN, Icelandic
      "szlig" : 223,
      // small sharp s, German (sz ligature)
      "agrave" : 224,
      // small a, grave accent
      "aacute" : 225,
      // small a, acute accent
      "acirc" : 226,
      // small a, circumflex accent
      "atilde" : 227,
      // small a, tilde
      "auml" : 228,
      // small a, dieresis or umlaut mark
      "aring" : 229,
      // small a, ring
      "aelig" : 230,
      // small ae diphthong (ligature)
      "ccedil" : 231,
      // small c, cedilla
      "egrave" : 232,
      // small e, grave accent
      "eacute" : 233,
      // small e, acute accent
      "ecirc" : 234,
      // small e, circumflex accent
      "euml" : 235,
      // small e, dieresis or umlaut mark
      "igrave" : 236,
      // small i, grave accent
      "iacute" : 237,
      // small i, acute accent
      "icirc" : 238,
      // small i, circumflex accent
      "iuml" : 239,
      // small i, dieresis or umlaut mark
      "eth" : 240,
      // small eth, Icelandic
      "ntilde" : 241,
      // small n, tilde
      "ograve" : 242,
      // small o, grave accent
      "oacute" : 243,
      // small o, acute accent
      "ocirc" : 244,
      // small o, circumflex accent
      "otilde" : 245,
      // small o, tilde
      "ouml" : 246,
      // small o, dieresis or umlaut mark
      "divide" : 247,
      // divide sign
      "oslash" : 248,
      // small o, slash
      "ugrave" : 249,
      // small u, grave accent
      "uacute" : 250,
      // small u, acute accent
      "ucirc" : 251,
      // small u, circumflex accent
      "uuml" : 252,
      // small u, dieresis or umlaut mark
      "yacute" : 253,
      // small y, acute accent
      "thorn" : 254,
      // small thorn, Icelandic
      "yuml" : 255,
      // small y, dieresis or umlaut mark
      // Latin Extended-B
      "fnof" : 402,
      // latin small f with hook = function= florin, U+0192 ISOtech
      // Greek
      "Alpha" : 913,
      // greek capital letter alpha, U+0391
      "Beta" : 914,
      // greek capital letter beta, U+0392
      "Gamma" : 915,
      // greek capital letter gamma,U+0393 ISOgrk3
      "Delta" : 916,
      // greek capital letter delta,U+0394 ISOgrk3
      "Epsilon" : 917,
      // greek capital letter epsilon, U+0395
      "Zeta" : 918,
      // greek capital letter zeta, U+0396
      "Eta" : 919,
      // greek capital letter eta, U+0397
      "Theta" : 920,
      // greek capital letter theta,U+0398 ISOgrk3
      "Iota" : 921,
      // greek capital letter iota, U+0399
      "Kappa" : 922,
      // greek capital letter kappa, U+039A
      "Lambda" : 923,
      // greek capital letter lambda,U+039B ISOgrk3
      "Mu" : 924,
      // greek capital letter mu, U+039C
      "Nu" : 925,
      // greek capital letter nu, U+039D
      "Xi" : 926,
      // greek capital letter xi, U+039E ISOgrk3
      "Omicron" : 927,
      // greek capital letter omicron, U+039F
      "Pi" : 928,
      // greek capital letter pi, U+03A0 ISOgrk3
      "Rho" : 929,
      // greek capital letter rho, U+03A1
      // there is no Sigmaf, and no U+03A2 character either
      "Sigma" : 931,
      // greek capital letter sigma,U+03A3 ISOgrk3
      "Tau" : 932,
      // greek capital letter tau, U+03A4
      "Upsilon" : 933,
      // greek capital letter upsilon,U+03A5 ISOgrk3
      "Phi" : 934,
      // greek capital letter phi,U+03A6 ISOgrk3
      "Chi" : 935,
      // greek capital letter chi, U+03A7
      "Psi" : 936,
      // greek capital letter psi,U+03A8 ISOgrk3
      "Omega" : 937,
      // greek capital letter omega,U+03A9 ISOgrk3
      "alpha" : 945,
      // greek small letter alpha,U+03B1 ISOgrk3
      "beta" : 946,
      // greek small letter beta, U+03B2 ISOgrk3
      "gamma" : 947,
      // greek small letter gamma,U+03B3 ISOgrk3
      "delta" : 948,
      // greek small letter delta,U+03B4 ISOgrk3
      "epsilon" : 949,
      // greek small letter epsilon,U+03B5 ISOgrk3
      "zeta" : 950,
      // greek small letter zeta, U+03B6 ISOgrk3
      "eta" : 951,
      // greek small letter eta, U+03B7 ISOgrk3
      "theta" : 952,
      // greek small letter theta,U+03B8 ISOgrk3
      "iota" : 953,
      // greek small letter iota, U+03B9 ISOgrk3
      "kappa" : 954,
      // greek small letter kappa,U+03BA ISOgrk3
      "lambda" : 955,
      // greek small letter lambda,U+03BB ISOgrk3
      "mu" : 956,
      // greek small letter mu, U+03BC ISOgrk3
      "nu" : 957,
      // greek small letter nu, U+03BD ISOgrk3
      "xi" : 958,
      // greek small letter xi, U+03BE ISOgrk3
      "omicron" : 959,
      // greek small letter omicron, U+03BF NEW
      "pi" : 960,
      // greek small letter pi, U+03C0 ISOgrk3
      "rho" : 961,
      // greek small letter rho, U+03C1 ISOgrk3
      "sigmaf" : 962,
      // greek small letter final sigma,U+03C2 ISOgrk3
      "sigma" : 963,
      // greek small letter sigma,U+03C3 ISOgrk3
      "tau" : 964,
      // greek small letter tau, U+03C4 ISOgrk3
      "upsilon" : 965,
      // greek small letter upsilon,U+03C5 ISOgrk3
      "phi" : 966,
      // greek small letter phi, U+03C6 ISOgrk3
      "chi" : 967,
      // greek small letter chi, U+03C7 ISOgrk3
      "psi" : 968,
      // greek small letter psi, U+03C8 ISOgrk3
      "omega" : 969,
      // greek small letter omega,U+03C9 ISOgrk3
      "thetasym" : 977,
      // greek small letter theta symbol,U+03D1 NEW
      "upsih" : 978,
      // greek upsilon with hook symbol,U+03D2 NEW
      "piv" : 982,
      // greek pi symbol, U+03D6 ISOgrk3
      // General Punctuation
      "bull" : 8226,
      // bullet = black small circle,U+2022 ISOpub
      // bullet is NOT the same as bullet operator, U+2219
      "hellip" : 8230,
      // horizontal ellipsis = three dot leader,U+2026 ISOpub
      "prime" : 8242,
      // prime = minutes = feet, U+2032 ISOtech
      "Prime" : 8243,
      // double prime = seconds = inches,U+2033 ISOtech
      "oline" : 8254,
      // overline = spacing overscore,U+203E NEW
      "frasl" : 8260,
      // fraction slash, U+2044 NEW
      // Letterlike Symbols
      "weierp" : 8472,
      // script capital P = power set= Weierstrass p, U+2118 ISOamso
      "image" : 8465,
      // blackletter capital I = imaginary part,U+2111 ISOamso
      "real" : 8476,
      // blackletter capital R = real part symbol,U+211C ISOamso
      "trade" : 8482,
      // trade mark sign, U+2122 ISOnum
      "alefsym" : 8501,
      // alef symbol = first transfinite cardinal,U+2135 NEW
      // alef symbol is NOT the same as hebrew letter alef,U+05D0 although the same glyph could be used to depict both characters
      // Arrows
      "larr" : 8592,
      // leftwards arrow, U+2190 ISOnum
      "uarr" : 8593,
      // upwards arrow, U+2191 ISOnum-->
      "rarr" : 8594,
      // rightwards arrow, U+2192 ISOnum
      "darr" : 8595,
      // downwards arrow, U+2193 ISOnum
      "harr" : 8596,
      // left right arrow, U+2194 ISOamsa
      "crarr" : 8629,
      // downwards arrow with corner leftwards= carriage return, U+21B5 NEW
      "lArr" : 8656,
      // leftwards double arrow, U+21D0 ISOtech
      // ISO 10646 does not say that lArr is the same as the 'is implied by' arrowbut also does not have any other character for that function. So ? lArr canbe used for 'is implied by' as ISOtech suggests
      "uArr" : 8657,
      // upwards double arrow, U+21D1 ISOamsa
      "rArr" : 8658,
      // rightwards double arrow,U+21D2 ISOtech
      // ISO 10646 does not say this is the 'implies' character but does not have another character with this function so ?rArr can be used for 'implies' as ISOtech suggests
      "dArr" : 8659,
      // downwards double arrow, U+21D3 ISOamsa
      "hArr" : 8660,
      // left right double arrow,U+21D4 ISOamsa
      // Mathematical Operators
      "forall" : 8704,
      // for all, U+2200 ISOtech
      "part" : 8706,
      // partial differential, U+2202 ISOtech
      "exist" : 8707,
      // there exists, U+2203 ISOtech
      "empty" : 8709,
      // empty set = null set = diameter,U+2205 ISOamso
      "nabla" : 8711,
      // nabla = backward difference,U+2207 ISOtech
      "isin" : 8712,
      // element of, U+2208 ISOtech
      "notin" : 8713,
      // not an element of, U+2209 ISOtech
      "ni" : 8715,
      // contains as member, U+220B ISOtech
      // should there be a more memorable name than 'ni'?
      "prod" : 8719,
      // n-ary product = product sign,U+220F ISOamsb
      // prod is NOT the same character as U+03A0 'greek capital letter pi' though the same glyph might be used for both
      "sum" : 8721,
      // n-ary summation, U+2211 ISOamsb
      // sum is NOT the same character as U+03A3 'greek capital letter sigma' though the same glyph might be used for both
      "minus" : 8722,
      // minus sign, U+2212 ISOtech
      "lowast" : 8727,
      // asterisk operator, U+2217 ISOtech
      "radic" : 8730,
      // square root = radical sign,U+221A ISOtech
      "prop" : 8733,
      // proportional to, U+221D ISOtech
      "infin" : 8734,
      // infinity, U+221E ISOtech
      "ang" : 8736,
      // angle, U+2220 ISOamso
      "and" : 8743,
      // logical and = wedge, U+2227 ISOtech
      "or" : 8744,
      // logical or = vee, U+2228 ISOtech
      "cap" : 8745,
      // intersection = cap, U+2229 ISOtech
      "cup" : 8746,
      // union = cup, U+222A ISOtech
      "int" : 8747,
      // integral, U+222B ISOtech
      "there4" : 8756,
      // therefore, U+2234 ISOtech
      "sim" : 8764,
      // tilde operator = varies with = similar to,U+223C ISOtech
      // tilde operator is NOT the same character as the tilde, U+007E,although the same glyph might be used to represent both
      "cong" : 8773,
      // approximately equal to, U+2245 ISOtech
      "asymp" : 8776,
      // almost equal to = asymptotic to,U+2248 ISOamsr
      "ne" : 8800,
      // not equal to, U+2260 ISOtech
      "equiv" : 8801,
      // identical to, U+2261 ISOtech
      "le" : 8804,
      // less-than or equal to, U+2264 ISOtech
      "ge" : 8805,
      // greater-than or equal to,U+2265 ISOtech
      "sub" : 8834,
      // subset of, U+2282 ISOtech
      "sup" : 8835,
      // superset of, U+2283 ISOtech
      // note that nsup, 'not a superset of, U+2283' is not covered by the Symbol font encoding and is not included. Should it be, for symmetry?It is in ISOamsn  --> <!ENTITY nsub": 8836,  //not a subset of, U+2284 ISOamsn
      "sube" : 8838,
      // subset of or equal to, U+2286 ISOtech
      "supe" : 8839,
      // superset of or equal to,U+2287 ISOtech
      "oplus" : 8853,
      // circled plus = direct sum,U+2295 ISOamsb
      "otimes" : 8855,
      // circled times = vector product,U+2297 ISOamsb
      "perp" : 8869,
      // up tack = orthogonal to = perpendicular,U+22A5 ISOtech
      "sdot" : 8901,
      // dot operator, U+22C5 ISOamsb
      // dot operator is NOT the same character as U+00B7 middle dot
      // Miscellaneous Technical
      "lceil" : 8968,
      // left ceiling = apl upstile,U+2308 ISOamsc
      "rceil" : 8969,
      // right ceiling, U+2309 ISOamsc
      "lfloor" : 8970,
      // left floor = apl downstile,U+230A ISOamsc
      "rfloor" : 8971,
      // right floor, U+230B ISOamsc
      "lang" : 9001,
      // left-pointing angle bracket = bra,U+2329 ISOtech
      // lang is NOT the same character as U+003C 'less than' or U+2039 'single left-pointing angle quotation mark'
      "rang" : 9002,
      // right-pointing angle bracket = ket,U+232A ISOtech
      // rang is NOT the same character as U+003E 'greater than' or U+203A 'single right-pointing angle quotation mark'
      // Geometric Shapes
      "loz" : 9674,
      // lozenge, U+25CA ISOpub
      // Miscellaneous Symbols
      "spades" : 9824,
      // black spade suit, U+2660 ISOpub
      // black here seems to mean filled as opposed to hollow
      "clubs" : 9827,
      // black club suit = shamrock,U+2663 ISOpub
      "hearts" : 9829,
      // black heart suit = valentine,U+2665 ISOpub
      "diams" : 9830,
      // black diamond suit, U+2666 ISOpub
      // Latin Extended-A
      "OElig" : 338,
      //  -- latin capital ligature OE,U+0152 ISOlat2
      "oelig" : 339,
      //  -- latin small ligature oe, U+0153 ISOlat2
      // ligature is a misnomer, this is a separate character in some languages
      "Scaron" : 352,
      //  -- latin capital letter S with caron,U+0160 ISOlat2
      "scaron" : 353,
      //  -- latin small letter s with caron,U+0161 ISOlat2
      "Yuml" : 376,
      //  -- latin capital letter Y with diaeresis,U+0178 ISOlat2
      // Spacing Modifier Letters
      "circ" : 710,
      //  -- modifier letter circumflex accent,U+02C6 ISOpub
      "tilde" : 732,
      // small tilde, U+02DC ISOdia
      // General Punctuation
      "ensp" : 8194,
      // en space, U+2002 ISOpub
      "emsp" : 8195,
      // em space, U+2003 ISOpub
      "thinsp" : 8201,
      // thin space, U+2009 ISOpub
      "zwnj" : 8204,
      // zero width non-joiner,U+200C NEW RFC 2070
      "zwj" : 8205,
      // zero width joiner, U+200D NEW RFC 2070
      "lrm" : 8206,
      // left-to-right mark, U+200E NEW RFC 2070
      "rlm" : 8207,
      // right-to-left mark, U+200F NEW RFC 2070
      "ndash" : 8211,
      // en dash, U+2013 ISOpub
      "mdash" : 8212,
      // em dash, U+2014 ISOpub
      "lsquo" : 8216,
      // left single quotation mark,U+2018 ISOnum
      "rsquo" : 8217,
      // right single quotation mark,U+2019 ISOnum
      "sbquo" : 8218,
      // single low-9 quotation mark, U+201A NEW
      "ldquo" : 8220,
      // left double quotation mark,U+201C ISOnum
      "rdquo" : 8221,
      // right double quotation mark,U+201D ISOnum
      "bdquo" : 8222,
      // double low-9 quotation mark, U+201E NEW
      "dagger" : 8224,
      // dagger, U+2020 ISOpub
      "Dagger" : 8225,
      // double dagger, U+2021 ISOpub
      "permil" : 8240,
      // per mille sign, U+2030 ISOtech
      "lsaquo" : 8249,
      // single left-pointing angle quotation mark,U+2039 ISO proposed
      // lsaquo is proposed but not yet ISO standardized
      "rsaquo" : 8250,
      // single right-pointing angle quotation mark,U+203A ISO proposed
      // rsaquo is proposed but not yet ISO standardized
      "euro" : 8364
    },
    /**
     * Escapes the characters in a <code>String</code> using HTML entities.
     *
     * For example: <tt>"bread" & "butter"</tt> => <tt>&amp;quot;bread&amp;quot; &amp;amp; &amp;quot;butter&amp;quot;</tt>.
     * Supports all known HTML 4.0 entities, including funky accents.
     *
     * * <a href="http://www.w3.org/TR/REC-html32#latin1">HTML 3.2 Character Entities for ISO Latin-1</a>
     * * <a href="http://www.w3.org/TR/REC-html40/sgml/entities.html">HTML 4.0 Character entity references</a>
     * * <a href="http://www.w3.org/TR/html401/charset.html#h-5.3">HTML 4.01 Character References</a>
     * * <a href="http://www.w3.org/TR/html401/charset.html#code-position">HTML 4.01 Code positions</a>
     *
     * @param str {String} the String to escape
     * @return {String} a new escaped String
     * @see #unescape
     */
    escape : function(str){

      return qx.util.StringEscape.escape(str, qx.bom.String.FROM_CHARCODE);
    },
    /**
     * Unescapes a string containing entity escapes to a string
     * containing the actual Unicode characters corresponding to the
     * escapes. Supports HTML 4.0 entities.
     *
     * For example, the string "&amp;lt;Fran&amp;ccedil;ais&amp;gt;"
     * will become "&lt;Fran&ccedil;ais&gt;"
     *
     * If an entity is unrecognized, it is left alone, and inserted
     * verbatim into the result string. e.g. "&amp;gt;&amp;zzzz;x" will
     * become "&gt;&amp;zzzz;x".
     *
     * @param str {String} the String to unescape, may be null
     * @return {var} a new unescaped String
     * @see #escape
     */
    unescape : function(str){

      return qx.util.StringEscape.unescape(str, qx.bom.String.TO_CHARCODE);
    },
    /**
     * Converts a plain text string into HTML.
     * This is similar to {@link #escape} but converts new lines to
     * <tt>&lt:br&gt:</tt> and preserves whitespaces.
     *
     * @param str {String} the String to convert
     * @return {String} a new converted String
     * @see #escape
     */
    fromText : function(str){

      return qx.bom.String.escape(str).replace(/(  |\n)/g, function(chr){

        var map = {
          "  " : " &nbsp;",
          "\n" : "<br>"
        };
        return map[chr] || chr;
      });
    },
    /**
     * Converts HTML to plain text.
     *
     * * Strips all HTML tags
     * * converts <tt>&lt:br&gt:</tt> to new line
     * * unescapes HTML entities
     *
     * @param str {String} HTML string to converts
     * @return {String} plain text representation of the HTML string
     */
    toText : function(str){

      return qx.bom.String.unescape(str.replace(/\s+|<([^>])+>/gi, function(chr)//return qx.bom.String.unescape(str.replace(/<\/?[^>]+(>|$)/gi, function(chr)
      //return qx.bom.String.unescape(str.replace(/<\/?[^>]+(>|$)/gi, function(chr)
      {

        if(chr.indexOf("<br") === 0){

          return "\n";
        } else if(chr.length > 0 && chr.replace(/^\s*/, "").replace(/\s*$/, "") == ""){

          return " ";
        } else {

          return "";
        };
      }));
    }
  },
  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */
  defer : function(statics){

    /** Mapping of char codes to HTML entity names */
    statics.FROM_CHARCODE = qx.lang.Object.invert(statics.TO_CHARCODE);
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */
/**
 * Generic escaping and unescaping of DOM strings.
 *
 * {@link qx.bom.String} for (un)escaping of HTML strings.
 * {@link qx.xml.String} for (un)escaping of XML strings.
 */
qx.Bootstrap.define("qx.util.StringEscape", {
  statics : {
    /**
     * generic escaping method
     *
     * @param str {String} string to escape
     * @param charCodeToEntities {Map} entity to charcode map
     * @return {String} escaped string
     * @signature function(str, charCodeToEntities)
     */
    escape : function(str, charCodeToEntities){

      var entity,result = "";
      for(var i = 0,l = str.length;i < l;i++){

        var chr = str.charAt(i);
        var code = chr.charCodeAt(0);
        if(charCodeToEntities[code]){

          entity = "&" + charCodeToEntities[code] + ";";
        } else {

          if(code > 0x7F){

            entity = "&#" + code + ";";
          } else {

            entity = chr;
          };
        };
        result += entity;
      };
      return result;
    },
    /**
     * generic unescaping method
     *
     * @param str {String} string to unescape
     * @param entitiesToCharCode {Map} charcode to entity map
     * @return {String} unescaped string
     */
    unescape : function(str, entitiesToCharCode){

      return str.replace(/&[#\w]+;/gi, function(entity){

        var chr = entity;
        var entity = entity.substring(1, entity.length - 1);
        var code = entitiesToCharCode[entity];
        if(code){

          chr = String.fromCharCode(code);
        } else {

          if(entity.charAt(0) == '#'){

            if(entity.charAt(1).toUpperCase() == 'X'){

              code = entity.substring(2);
              // match hex number
              if(code.match(/^[0-9A-Fa-f]+$/gi)){

                chr = String.fromCharCode(parseInt(code, 16));
              };
            } else {

              code = entity.substring(1);
              // match integer
              if(code.match(/^\d+$/gi)){

                chr = String.fromCharCode(parseInt(code, 10));
              };
            };
          };
        };
        return chr;
      });
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * Utility module to give some support to work with strings.
 *
 * *Info:* The <pre class='javascript'>trim</pre> method is available as <a href="#String">Polyfill</a>.
 *
 * @group (Utilities)
 */
qx.Bootstrap.define("qx.module.util.String", {
  statics : {
    /**
     * Converts a hyphenated string (separated by '-') to camel case.
     *
     * Example:
     * <pre class='javascript'>q.string.camelCase("I-like-cookies"); //returns "ILikeCookies"</pre>
     *
     * @attachStatic {qxWeb, string.camelCase}
     * @param str {String} hyphenated string
     * @return {String} camelcase string
     */
    camelCase : function(str){

      return qx.lang.String.camelCase.call(qx.lang.String, str);
    },
    /**
     * Converts a camelcased string to a hyphenated (separated by '-') string.
     *
     * Example:
     * <pre class='javascript'>q.string.hyphenate("weLikeCookies"); //returns "we-like-cookies"</pre>
     *
     * @attachStatic {qxWeb, string.hyphenate}
     * @param str {String} camelcased string
     * @return {String} hyphenated string
     */
    hyphenate : function(str){

      return qx.lang.String.hyphenate.call(qx.lang.String, str);
    },
    /**
     * Convert the first character of the string to upper case.
     *
     * @attachStatic {qxWeb, string.firstUp}
     * @signature function(str)
     * @param str {String} the string
     * @return {String} the string with an upper case first character
     */
    firstUp : qx.lang.String.firstUp,
    /**
     * Convert the first character of the string to lower case.
     *
     * @attachStatic {qxWeb, string.firstLow}
     * @signature function(str)
     * @param str {String} the string
     * @return {String} the string with a lower case first character
     */
    firstLow : qx.lang.String.firstLow,
    /**
     * Check whether the string starts with the given substring.
     *
     * @attachStatic {qxWeb, string.startsWith}
     * @signature function(fullstr, substr)
     * @param fullstr {String} the string to search in
     * @param substr {String} the substring to look for
     * @return {Boolean} whether the string starts with the given substring
     */
    startsWith : qx.lang.String.startsWith,
    /**
     * Check whether the string ends with the given substring.
     *
     * @attachStatic {qxWeb, string.endsWith}
     * @signature function(fullstr, substr)
     * @param fullstr {String} the string to search in
     * @param substr {String} the substring to look for
     * @return {Boolean} whether the string ends with the given substring
     */
    endsWith : qx.lang.String.endsWith,
    /**
     * Escapes all chars that have a special meaning in regular expressions.
     *
     * @attachStatic {qxWeb, string.escapeRegexpChars}
     * @signature function(str)
     * @param str {String} the string where to escape the chars.
     * @return {String} the string with the escaped chars.
     */
    escapeRegexpChars : qx.lang.String.escapeRegexpChars,
    /**
     * Escapes the characters in a <code>String</code> using HTML entities.
     *
     * For example: <tt>"bread" & "butter"</tt> => <tt>&amp;quot;bread&amp;quot; &amp;amp; &amp;quot;butter&amp;quot;</tt>.
     * Supports all known HTML 4.0 entities, including funky accents.
     *
     * @attachStatic {qxWeb, string.escapeHtml}
     * @signature function(str)
     * @param str {String} the String to escape
     * @return {String} a new escaped String
     */
    escapeHtml : qx.bom.String.escape
  },
  defer : function(statics){

    qxWeb.$attachStatic({
      string : {
        camelCase : statics.camelCase,
        hyphenate : statics.hyphenate,
        firstUp : statics.firstUp,
        firstLow : statics.firstLow,
        startsWith : statics.startsWith,
        endsWith : statics.endsWith,
        escapeRegexpChars : statics.escapeRegexpChars,
        escapeHtml : statics.escapeHtml
      }
    });
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Romeo Kenfack (rkenfack)

************************************************************************ */
/**
 * Module for handling of HTML5 data-* attributes
 */
qx.Bootstrap.define("qx.module.Dataset", {
  statics : {
    /**
     * Sets an HTML "data-*" attribute on each item in the collection
     *
     * @attach {qxWeb}
     * @param name {String} Name of the attribute [CamelCase variant]
     * @param value {var} New value of the attribute
     * @return {qxWeb} The collection for chaining
     */
    setData : function(name, value){

      this._forEachElement(function(item){

        qx.bom.element.Dataset.set(item, name, value);
      });
      return this;
    },
    /**
     *
     * Returns the value of the given HTML "data-*" attribute for the first item in the collection
     *
     * @attach {qxWeb}
     * @param name {String} Name of the attribute [CamelCase variant]
     * @return {var} The value of the attribute
     *
     */
    getData : function(name){

      if(this[0] && this[0].nodeType === 1){

        return qx.bom.element.Dataset.get(this[0], name);
      };
    },
    /**
     * Returns a map containing all the HTML "data-*" attributes of the specified element
     *
     * @attach {qxWeb}
     * @return {Map} The map containing the "data-*" attributes
     *
     */
    getAllData : function(){

      if(this[0] && this[0].nodeType === 1){

        return qx.bom.element.Dataset.getAll(this[0]);
      };
      return {
      };
    },
    /**
     * Remove an HTML "data-*" attribute from the given DOM element
     *
     * @attach {qxWeb}
     * @param name {String} Name of the attribute
     * @return {qxWeb} The collection for chaining
     */
    removeData : function(name){

      if(this[0] && this[0].nodeType === 1){

        qx.bom.element.Dataset.remove(this[0], name);
      };
      return this;
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      "getData" : statics.getData,
      "setData" : statics.setData,
      "removeData" : statics.removeData,
      "getAllData" : statics.getAllData
    });
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

   Author:
     * Gabriel Munteanu (gabios)

************************************************************************ */
/**
 * Data-* attribute handling for DOM HTML elements.
 *
 * This feature set is supported cross-browser
 * through one common interface and is independent of the differences between
 * the multiple implementations.
 *
 */
qx.Bootstrap.define("qx.bom.element.Dataset", {
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /**
     * Sets a data attribute on the given DOM element.
     *
     * @param element {Element} The DOM element to modify
     * @param name {String} Name of the attribute [CamelCase variant]
     * @param value {var} New value of the attribute
     */
    set : function(element, name, value){

      if(element.dataset){

        name = qx.lang.String.camelCase(name);
        if(value == null){

          delete element.dataset[name];
        } else {

          element.dataset[name] = value;
        };
      } else {

        if(value === undefined){

          value = null;
        };
        qx.bom.element.Attribute.set(element, "data-" + qx.lang.String.hyphenate(name), value);
      };
    },
    /**
     * Returns the value of the given HTML "data-*" attribute
     *
     * @param element {Element} The DOM element to query
     * @param name {String} Name of the attribute [CamelCase variant]
     * @return {var} The value of the attribute
     *
     */
    get : function(element, name){

      if(element.dataset){

        name = qx.lang.String.camelCase(name);
        return element.dataset[name];
      } else {

        var attrName = "data-" + qx.lang.String.hyphenate(name);
        return element.hasAttribute(attrName) ? qx.bom.element.Attribute.get(element, attrName) : undefined;
      };
    },
    /**
     * Returns a map containing all the HTML "data-*" attributes of the specified element
     *
     * @param element {Element} The DOM element to query
     * @return {Map} The map containing all the "data-*" attributes
     */
    getAll : function(element){

      if(element.dataset){

        return element.dataset;
      } else {

        var res = {
        },attr = element.attributes;
        for(var i = 0;i < attr.length;i++){

          if(attr[i].name.match(RegExp("^data-(.*)"))){

            var key = RegExp.$1;
            res[qx.lang.String.camelCase(key)] = element.getAttribute(attr[i].name);
          };
        };
        return res;
      };
    },
    /**
     * Remove an HTML "data-*" attribute from the given DOM element
     *
     * @param element {Element} The DOM element to modify
     * @param name {String} Name of the attribute
     */
    remove : function(element, name){

      this.set(element, name, undefined);
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * Common normalizations for native events
 *
 * @require(qx.module.Event)
 * @require(qx.bom.Event#getTarget)
 * @require(qx.bom.Event#getRelatedTarget)
 *
 * @group (Event_Normalization)
 */
qx.Bootstrap.define("qx.module.event.Native", {
  statics : {
    /**
     * List of event types to be normalized
     */
    TYPES : ["*"],
    /**
     * List of qx.bom.Event methods to be attached to native event objects
     * @internal
     */
    FORWARD_METHODS : ["getTarget", "getRelatedTarget"],
    /**
     * List of qx.module.event.Native methods to be attached to native event objects
     * @internal
     */
    BIND_METHODS : ["preventDefault", "stopPropagation", "getType"],
    /**
     * Prevent the native default behavior of the event.
     */
    preventDefault : function(){

      try{

        // this allows us to prevent some key press events in IE.
        // See bug #1049
        this.keyCode = 0;
      } catch(ex) {
      };
      this.returnValue = false;
    },
    /**
     * Stops the event's propagation to the element's parent
     */
    stopPropagation : function(){

      this.cancelBubble = true;
    },
    /**
     * Returns the event's type
     *
     * @return {String} event type
     */
    getType : function(){

      return this._type || this.type;
    },
    /**
     * Returns the target of the event.
     * Example:
     * <pre class="javascript">
     *   var collection = q("div.inline");
     *   collection.on("click", function(e) {
     *     var clickedElement = e.getTarget();
     *   });
     * </pre>
     *
     * @signature function ()
     * @return {Object} Any valid native event target
     */
    getTarget : function(){
    },
    /**
     * Computes the related target from the native DOM event
     *
     * Example:
     * <pre class="javascript">
     *   var collection = q("div.inline");
     *   collection.on("mouseout", function(e) {
     *     // when using 'mouseout' events the 'relatedTarget' is pointing to the DOM element
     *     //  the device exited to.
     *     // Useful for scenarios you only interested if e.g. the user moved away from a
     *     // section at the website
     *     var exitTarget = e.getRelatedTarget();
     *   });
     *
     *   collection.on("mouseover", function(e){
     *      // when using 'mouseover' events the 'relatedTarget' is pointing to the DOM element
     *      // the device entered from.
     *      var earlierElement = e.getRelatedTarget();
     *   });
     * </pre>
     *
     * @signature function ()
     * @return {Element} The related target
     */
    getRelatedTarget : function(){
    },
    /**
     * Computes the current target from the native DOM event. Emulates the current target
     * for all browsers without native support (like older IEs).
     *
     * Example:
     * <pre class="javascript">
     *   var collection = q("div.inline");
     *   collection.on("mouseout", function(e) {
     *     var current = e.getCurrentTarget();
     *   });
     * </pre>
     *
     * @signature function ()
     * @return {Element} The current target
     */
    getCurrentTarget : function(){
    },
    /**
     * Manipulates the native event object, adding methods if they're not
     * already present
     *
     * @param event {Event} Native event object
     * @param element {Element} DOM element the listener was attached to
     * @return {Event} Normalized event object
     * @internal
     */
    normalize : function(event, element){

      if(!event){

        return event;
      };
      var fwdMethods = qx.module.event.Native.FORWARD_METHODS;
      for(var i = 0,l = fwdMethods.length;i < l;i++){

        event[fwdMethods[i]] = qx.bom.Event[fwdMethods[i]].bind(null, event);
      };
      var bindMethods = qx.module.event.Native.BIND_METHODS;
      for(var i = 0,l = bindMethods.length;i < l;i++){

        if(typeof event[bindMethods[i]] != "function"){

          event[bindMethods[i]] = qx.module.event.Native[bindMethods[i]].bind(event);
        };
      };
      event.getCurrentTarget = function(){

        return event.currentTarget || element;
      };
      return event;
    }
  },
  defer : function(statics){

    qxWeb.$registerEventNormalization(statics.TYPES, statics.normalize);
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
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * This is the base collection for all widgets and offers a good foundation
 * for all widgets including enabled state handling, config and template storage
 * and event handling to name a few key features.
 *
 * @require(qx.module.Dataset)
 * @require(qx.module.util.String)
 * @require(qx.module.event.Native)
 *
 * @group (Widget)
 */
qx.Bootstrap.define("qx.ui.website.Widget", {
  extend : qxWeb,
  statics : {
    /**
     * Factory method for the widget which converts a standard
     * collection into a collection of widgets.
     *
     * @return {qx.ui.website.Widget} A collection of widgets.
     *
     * @attach {qxWeb}
     */
    widget : function(){

      var widgets = new qx.ui.website.Widget(this);
      widgets.init();
      return widgets;
    },
    /**
     * Creates a new collection from the given argument. This can either be an
     * HTML string, a single DOM element or an array of elements
     *
     * @param html {String|Element[]} HTML string or DOM element(s)
     * @return {qxWeb} Collection of elements
     */
    create : function(html){

      return new qx.ui.website.Widget(qxWeb.create(html));
    },
    /**
     * TODOC
     *
     * @attach {qxWeb}
     * @param type {String} Type of the event to listen for
     * @param listener {Function} Listener callback
     * @param ctx {Object?} Context the callback function will be executed in.
     * Default: The element on which the listener was registered
     * @param useCapture {Boolean?} Attach the listener to the capturing
     * phase if true.
     * @return {qxWeb} The collection for chaining
     */
    onWidget : function(type, listener, ctx, useCapture){

      var propertyName = this.classname.replace(/\./g, "-") + "-context";
      if(!this.getProperty(propertyName)){

        this.setProperty(propertyName, ctx);
      };
      var originalCtx = this.getProperty(propertyName);
      if(!this.hasListener(type, listener, originalCtx)){

        this.on(type, listener, originalCtx, useCapture);
      };
      return this;
    },
    /**
     * TODOC
     *
     * @attach {qxWeb}
     * @param type {String} Type of the event to listen for
     * @param listener {Function} Listener callback
     * @param ctx {Object?} Context the callback function will be executed in.
     * Default: The element on which the listener was registered
     * @param useCapture {Boolean?} Attach the listener to the capturing
     * phase if true.
     * @return {qxWeb} The collection for chaining
     */
    offWidget : function(type, listener, ctx, useCapture){

      var propertyName = this.classname.replace(/\./g, "-") + "-context";
      this._forEachElementWrapped(function(item){

        var originalCtx = item.getProperty(propertyName);
        item.off(type, listener, originalCtx, useCapture);
      });
      return this;
    },
    /**
     * Fetches all elements having a data-attribute named <code>data-qx-class</code>
     * containing the class name of the desired widget and initialized the widgets.
     *
     * @attachStatic {qxWeb}
     */
    initWidgets : function(){

      qxWeb("*[data-qx-class]")._forEachElementWrapped(function(widget){

        widget.init();
      });
    }
  },
  construct : function(selector, context){

    var col = this.base(arguments, selector, context);
    Array.prototype.push.apply(this, Array.prototype.slice.call(col, 0, col.length));
  },
  members : {
    __cssPrefix : null,
    /**
     * Responsible for initializing of the widget. This checks for the data attribute
     * named <code>data-qx-class</code> and initializes the widget if necessary.
     * @return {Boolean} <code>true</code> if the widget has been initialized
     */
    init : function(){

      if(this.getProperty("$$qx-widget-initialized")){

        return false;
      };
      this.setAttribute("data-qx-class", this.classname);
      this.addClass("qx-widget");
      this.addClass(this.getCssPrefix());
      this.setProperty("$$qx-widget-initialized", true);
      return true;
    },
    /**
     * Return the proper CSS prefix for the current widget. This prefix is
     * based on the current classname.
     *
     * @return {String} The CSS prefix for the current object.
     */
    getCssPrefix : function(){

      if(!this.__cssPrefix){

        var split = this.classname.split(".");
        this.__cssPrefix = "qx-" + split[split.length - 1].toLowerCase();
      };
      return this.__cssPrefix;
    },
    /**
     * Changes the enabled state of the current collection, which means all
     * widgets in the collection. This sets the disabled attribute on the
     * elements and all its children.
     *
     * @param value {Boolean} The enabled value.
     * @return {qx.ui.website.Widget} The collection for chaining
     */
    setEnabled : function(value){

      this.setAttribute("disabled", !value);
      this.find("*").setAttribute("disabled", !value);
      return this;
    },
    /**
     * Returns weather the first widget in the collection is enabled or not.
     *
     * @return {Boolean} The enabled state of the collection.
     */
    getEnabled : function(){

      return !this.getProperty("disabled");
    },
    /**
     * Setter for the widget-specific templates. The available templates can
     * be found in the documentation of the corresponding widget. The templates
     * will be rendered using
     * <a href='https://github.com/janl/mustache.js/'>mustache.js</a>.
     *
     * Please keep in mind to call {@link #render} after you change any
     * template or config setting.
     *
     * @param name {String} The name of the template.
     * @param template {String} The template string.
     *
     * @return {qx.ui.website.Widget} The widget instance for chaining.
     */
    setTemplate : function(name, template){

      return this._setData("templates", name, template);
    },
    /**
     * Setter for the widget-specific config. The available config settings can
     * be found in the documentation of the corresponding widget. Each config
     * setting can be set in the markup as data-attribute, prefixed with
     * <code>data-qx</code> e.g. <code>data-qx-length="5"</code>.
     *
     * Please keep in mind to call {@link #render} after you change any
     * template or config setting.
     *
     * @param name {String} The name of the config setting.
     * @param config {var} The value of the config setting.
     * @return {qx.ui.website.Widget} The widget instance for chaining.
     */
    setConfig : function(name, config){

      return this._setData("config", name, config);
    },
    /**
     * Helper to set either config or template values.
     *
     * @param type {String} Either <code>templates</code> or <code>config</code>.
     * @param name {String} The name for the value to store.
     * @param data {var} The data to store.
     * @return {qx.ui.website.Widget} The widget instance for chaining.
     */
    _setData : function(type, name, data){

      this.forEach(function(item){

        if(!item[type]){

          item[type] = {
          };
        };
        item[type][name] = data;
      });
      return this;
    },
    /**
     * Returns the used template. This includes custom templates
     * as the default templates defined by the widgets.
     *
     * @param name {String} The name of the template.
     * @return {String} The template string or <code>undefined</code>.
     */
    getTemplate : function(name){

      return this._getData("templates", name);
    },
    /**
     * Returns the config setting currently in use for the given widget.
     * This can either be the user set config value, the value set in
     * the markup via data-attribute, the widgets default config value or
     * <code>undefined</code>, if non is set.
     *
     * @param name {String} The name of the config.
     * @return {var} The value of the config or <code>undefined</code>.
     */
    getConfig : function(name){

      return this._getData("config", name);
    },
    /**
     * Internal helper for querying the values for templates and configs. In the
     * case of a config value, the method also reads the corresponding data-attribute
     * for possible values.
     *
     * @param type {String} Either <code>templates</code> or <code>config</code>.
     * @param name {String} The name for the value to fetch.
     * @return {var} The value store for the given arguments.
     */
    _getData : function(type, name){

      var storage = this.getProperty(type);
      var item;
      if(storage){

        item = storage[name];
      };
      if(item === undefined && type == "config"){

        var attribName = "qx" + qxWeb.string.firstUp(type) + qxWeb.string.firstUp(name);
        item = this.getData(attribName);
        // not defined HTML attributes result in 'null' values
        if(!this[0] || (!this[0].dataset && item === null)){

          item = undefined;
        };
        try{

          item = JSON.parse(item);
        } catch(e) {
        };
      };
      if(item === undefined && this.constructor["_" + type]){

        return this.constructor["_" + type][name];
      };
      return item;
    },
    /**
     * The render method is responsible for applying changed config
     * and template settings. This method is usually overridden and specified
     * by the subclassing widgets like the slider or tabs.
     *
     * @return {qx.ui.website.Widget} The widget collection for chaining.
     */
    render : function(){

      // empty method
      return this;
    },
    /**
     * Dispose the widget, making sure all objects are ready for
     * garbage collection. This mainly means deleting connections to the
     * DOM including event listeners.
     * @return {qxWeb} Plain qxWeb collection
     */
    dispose : function(){

      this.removeAttribute("data-qx-class");
      this.setProperty("config", undefined);
      this.setProperty("templates", undefined);
      var contextProperty = this.classname.replace(/\./g, "-") + "-context";
      this.setProperty(contextProperty, undefined);
      this.setProperty("$$qx-widget-initialized", undefined);
      this.removeClass("qx-widget");
      this.removeClass(this.getCssPrefix());
      for(var name in this.constructor.$$events){

        this.allOff(name);
      };
      return qxWeb.$init(this, qxWeb);
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      onWidget : statics.onWidget,
      offWidget : statics.offWidget,
      widget : statics.widget
    });
    qxWeb.$attachStatic({
      initWidgets : statics.initWidgets
    });
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * Cross browser animation layer. It uses feature detection to check if CSS
 * animations are available and ready to use. If not, a JavaScript-based
 * fallback will be used.
 *
 * @require(qx.module.Css)
 * @require(qx.module.Event)
 */
qx.Bootstrap.define("qx.module.Animation", {
  events : {
    /** Fired when an animation starts. */
    "animationStart" : undefined,
    /** Fired when an animation has ended one iteration. */
    "animationIteration" : undefined,
    /** Fired when an animation has ended. */
    "animationEnd" : undefined
  },
  statics : {
    /**
     * Returns the stored animation handles. The handles are only
     * available while an animation is running.
     *
     * @internal
     * @return {Array} An array of animation handles.
     */
    getAnimationHandles : function(){

      var animationHandles = [];
      for(var i = 0;i < this.length;i++){

        animationHandles[i] = this[i].$$animation;
      };
      return animationHandles;
    },
    /**
     * Animation description used in {@link #fadeOut}.
     */
    _fadeOut : {
      duration : 700,
      timing : "ease-out",
      keep : 100,
      keyFrames : {
        '0' : {
          opacity : 1
        },
        '100' : {
          opacity : 0,
          display : "none"
        }
      }
    },
    /**
     * Animation description used in {@link #fadeIn}.
     */
    _fadeIn : {
      duration : 700,
      timing : "ease-in",
      keep : 100,
      keyFrames : {
        '0' : {
          opacity : 0
        },
        '100' : {
          opacity : 1
        }
      }
    },
    /**
     * Starts the animation with the given description.
     * The description should be a map, which could look like this:
     *
     * <pre class="javascript">
     * {
     *   "duration": 1000,
     *   "keep": 100,
     *   "keyFrames": {
     *     0 : {"opacity": 1, "scale": 1},
     *     100 : {"opacity": 0, "scale": 0}
     *   },
     *   "origin": "50% 50%",
     *   "repeat": 1,
     *   "timing": "ease-out",
     *   "alternate": false,
     *   "delay": 2000
     * }
     * </pre>
     *
     * *duration* is the time in milliseconds one animation cycle should take.
     *
     * *keep* is the key frame to apply at the end of the animation. (optional)
     *
     * *keyFrames* is a map of separate frames. Each frame is defined by a
     *   number which is the percentage value of time in the animation. The value
     *   is a map itself which holds css properties or transforms
     *   (Transforms only for CSS Animations).
     *
     * *origin* maps to the <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin">transform origin</a>
     * (Only for CSS animations).
     *
     * *repeat* is the amount of time the animation should be run in
     *   sequence. You can also use "infinite".
     *
     * *timing* takes one of these predefined values:
     *   <code>ease</code> | <code>linear</code> | <code>ease-in</code>
     *   | <code>ease-out</code> | <code>ease-in-out</code> |
     *   <code>cubic-bezier(&lt;number&gt;, &lt;number&gt;, &lt;number&gt;, &lt;number&gt;)</code>
     *   (cubic-bezier only available for CSS animations)
     *
     * *alternate* defines if every other animation should be run in reverse order.
     *
     * *delay* is the time in milliseconds the animation should wait before start.
     *
     * @attach {qxWeb}
     * @param desc {Map} The animation's description.
     * @param duration {Number?} The duration in milliseconds of the animation,
     *   which will override the duration given in the description.
     * @return {qxWeb} The collection for chaining.
     */
    animate : function(desc, duration){

      qx.module.Animation._animate.bind(this)(desc, duration, false);
      return this;
    },
    /**
     * Starts an animation in reversed order. For further details, take a look at
     * the {@link #animate} method.
     * @attach {qxWeb}
     * @param desc {Map} The animation's description.
     * @param duration {Number?} The duration in milliseconds of the animation,
     *   which will override the duration given in the description.
     * @return {qxWeb} The collection for chaining.
     */
    animateReverse : function(desc, duration){

      qx.module.Animation._animate.bind(this)(desc, duration, true);
      return this;
    },
    /**
     * Animation execute either regular or reversed direction.
     * @param desc {Map} The animation's description.
     * @param duration {Number?} The duration in milliseconds of the animation,
     *   which will override the duration given in the description.
     * @param reverse {Boolean} <code>true</code>, if the animation should be reversed
     */
    _animate : function(desc, duration, reverse){

      this._forEachElement(function(el, i){

        // stop all running animations
        if(el.$$animation){

          el.$$animation.stop();
        };
        var handle;
        if(reverse){

          handle = qx.bom.element.Animation.animateReverse(el, desc, duration);
        } else {

          handle = qx.bom.element.Animation.animate(el, desc, duration);
        };
        var self = this;
        // only register for the first element
        if(i == 0){

          handle.on("start", function(){

            self.emit("animationStart");
          }, handle);
          handle.on("iteration", function(){

            self.emit("animationIteration");
          }, handle);
        };
        handle.on("end", function(){

          for(var i = 0;i < self.length;i++){

            if(self[i].$$animation){

              return;
            };
          };
          self.emit("animationEnd");
        }, el);
      });
    },
    /**
     * Manipulates the play state of the animation.
     * This can be used to continue an animation when paused.
     * @attach {qxWeb}
     * @return {qxWeb} The collection for chaining.
     */
    play : function(){

      for(var i = 0;i < this.length;i++){

        var handle = this[i].$$animation;
        if(handle){

          handle.play();
        };
      };
      return this;
    },
    /**
     * Manipulates the play state of the animation.
     * This can be used to pause an animation when running.
     * @attach {qxWeb}
     * @return {qxWeb} The collection for chaining.
     */
    pause : function(){

      for(var i = 0;i < this.length;i++){

        var handle = this[i].$$animation;
        if(handle){

          handle.pause();
        };
      };
      return this;
    },
    /**
     * Stops a running animation.
     * @attach {qxWeb}
     * @return {qxWeb} The collection for chaining.
     */
    stop : function(){

      for(var i = 0;i < this.length;i++){

        var handle = this[i].$$animation;
        if(handle){

          handle.stop();
        };
      };
      return this;
    },
    /**
     * Returns whether an animation is running or not.
     * @attach {qxWeb}
     * @return {Boolean} <code>true</code>, if an animation is running.
     */
    isPlaying : function(){

      for(var i = 0;i < this.length;i++){

        var handle = this[i].$$animation;
        if(handle && handle.isPlaying()){

          return true;
        };
      };
      return false;
    },
    /**
     * Returns whether an animation has ended or not.
     * @attach {qxWeb}
     * @return {Boolean} <code>true</code>, if an animation has ended.
     */
    isEnded : function(){

      for(var i = 0;i < this.length;i++){

        var handle = this[i].$$animation;
        if(handle && !handle.isEnded()){

          return false;
        };
      };
      return true;
    },
    /**
     * Fades in all elements in the collection.
     * @attach {qxWeb}
     * @param duration {Number?} The duration in milliseconds.
     * @return {qxWeb} The collection for chaining.
     */
    fadeIn : function(duration){

      // remove 'display: none' style
      this.setStyle("display", "");
      return this.animate(qx.module.Animation._fadeIn, duration);
    },
    /**
     * Fades out all elements in the collection.
     * @attach {qxWeb}
     * @param duration {Number?} The duration in milliseconds.
     * @return {qxWeb} The collection for chaining.
     */
    fadeOut : function(duration){

      return this.animate(qx.module.Animation._fadeOut, duration);
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      "animate" : statics.animate,
      "animateReverse" : statics.animateReverse,
      "fadeIn" : statics.fadeIn,
      "fadeOut" : statics.fadeOut,
      "play" : statics.play,
      "pause" : statics.pause,
      "stop" : statics.stop,
      "isEnded" : statics.isEnded,
      "isPlaying" : statics.isPlaying,
      "getAnimationHandles" : statics.getAnimationHandles
    });
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Wrapper for {@link qx.bom.element.AnimationCss} and
 * {@link qx.bom.element.AnimationJs}. It offers the pubilc API and decides using
 * feature checks either to use CSS animations or JS animations.
 *
 * If you use this class, the restrictions of the JavaScript animations apply.
 * This means that you can not use transforms and custom bezier timing functions.
 */
qx.Bootstrap.define("qx.bom.element.Animation", {
  statics : {
    /**
     * This function takes care of the feature check and starts the animation.
     * It takes a DOM element to apply the animation to, and a description.
     * The description should be a map, which could look like this:
     *
     * <pre class="javascript">
     * {
     *   "duration": 1000,
     *   "keep": 100,
     *   "keyFrames": {
     *     0 : {"opacity": 1, "scale": 1},
     *     100 : {"opacity": 0, "scale": 0}
     *   },
     *   "origin": "50% 50%",
     *   "repeat": 1,
     *   "timing": "ease-out",
     *   "alternate": false,
     *   "delay" : 2000
     * }
     * </pre>
     *
     * *duration* is the time in milliseconds one animation cycle should take.
     *
     * *keep* is the key frame to apply at the end of the animation. (optional)
     *   Keep in mind that the keep key is reversed in case you use an reverse
     *   animation or set the alternate key and a even repeat count.
     *
     * *keyFrames* is a map of separate frames. Each frame is defined by a
     *   number which is the percentage value of time in the animation. The value
     *   is a map itself which holds css properties or transforms
     *   {@link qx.bom.element.Transform} (Transforms only for CSS Animations).
     *
     * *origin* maps to the transform origin {@link qx.bom.element.Transform#setOrigin}
     *   (Only for CSS animations).
     *
     * *repeat* is the amount of time the animation should be run in
     *   sequence. You can also use "infinite".
     *
     * *timing* takes one of the predefined value:
     *   <code>ease</code> | <code>linear</code> | <code>ease-in</code>
     *   | <code>ease-out</code> | <code>ease-in-out</code> |
     *   <code>cubic-bezier(&lt;number&gt;, &lt;number&gt;, &lt;number&gt;, &lt;number&gt;)</code>
     *   (cubic-bezier only available for CSS animations)
     *
     * *alternate* defines if every other animation should be run in reverse order.
     *
     * *delay* is the time in milliseconds the animation should wait before start.
     *
     * @param el {Element} The element to animate.
     * @param desc {Map} The animations description.
     * @param duration {Integer?} The duration in milliseconds of the animation
     *   which will override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} AnimationHandle instance to control
     *   the animation.
     */
    animate : function(el, desc, duration){

      var onlyCssKeys = qx.bom.element.Animation.__hasOnlyCssKeys(el, desc.keyFrames);
      if(qx.core.Environment.get("css.animation") && onlyCssKeys){

        return qx.bom.element.AnimationCss.animate(el, desc, duration);
      } else {

        return qx.bom.element.AnimationJs.animate(el, desc, duration);
      };
    },
    /**
     * Starts an animation in reversed order. For further details, take a look at
     * the {@link #animate} method.
     * @param el {Element} The element to animate.
     * @param desc {Map} The animations description.
     * @param duration {Integer?} The duration in milliseconds of the animation
     *   which will override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} AnimationHandle instance to control
     *   the animation.
     */
    animateReverse : function(el, desc, duration){

      var onlyCssKeys = qx.bom.element.Animation.__hasOnlyCssKeys(el, desc.keyFrames);
      if(qx.core.Environment.get("css.animation") && onlyCssKeys){

        return qx.bom.element.AnimationCss.animateReverse(el, desc, duration);
      } else {

        return qx.bom.element.AnimationJs.animateReverse(el, desc, duration);
      };
    },
    /**
     * Detection helper which detects if only CSS keys are in
     * the animations key frames.
     * @param el {Element} The element to check for the styles.
     * @param keyFrames {Map} The keyFrames of the animation.
     * @return {Boolean} <code>true</code> if only css properties are included.
     */
    __hasOnlyCssKeys : function(el, keyFrames){

      var keys = [];
      for(var nr in keyFrames){

        var frame = keyFrames[nr];
        for(var key in frame){

          if(keys.indexOf(key) == -1){

            keys.push(key);
          };
        };
      };
      var transformKeys = ["scale", "rotate", "skew", "translate"];
      for(var i = 0;i < keys.length;i++){

        var key = qx.lang.String.camelCase(keys[i]);
        if(!(key in el.style)){

          // check for transform keys
          if(transformKeys.indexOf(keys[i]) != -1){

            continue;
          };
          // check for prefixed keys
          if(qx.bom.Style.getPropertyName(key)){

            continue;
          };
          return false;
        };
      };
      return true;
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
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * Responsible for checking all relevant animation properties.
 *
 * Spec: http://www.w3.org/TR/css3-animations/
 *
 * @require(qx.bom.Stylesheet)
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.CssAnimation", {
  statics : {
    /**
     * Main check method which returns an object if CSS animations are
     * supported. This object contains all necessary keys to work with CSS
     * animations.
     * <ul>
     *  <li><code>name</code> The name of the css animation style</li>
     *  <li><code>play-state</code> The name of the play-state style</li>
     *  <li><code>start-event</code> The name of the start event</li>
     *  <li><code>iternation-event</code> The name of the iternation event</li>
     *  <li><code>end-event</code> The name of the end event</li>
     *  <li><code>fill-mode</code> The fill-mode style</li>
     *  <li><code>keyframes</code> The name of the keyframes selector.</li>
     * </ul>
     *
     * @internal
     * @return {Object|null} The described object or null, if animations are
     *   not supported.
     */
    getSupport : function(){

      var name = qx.bom.client.CssAnimation.getName();
      if(name != null){

        return {
          "name" : name,
          "play-state" : qx.bom.client.CssAnimation.getPlayState(),
          "start-event" : qx.bom.client.CssAnimation.getAnimationStart(),
          "iteration-event" : qx.bom.client.CssAnimation.getAnimationIteration(),
          "end-event" : qx.bom.client.CssAnimation.getAnimationEnd(),
          "fill-mode" : qx.bom.client.CssAnimation.getFillMode(),
          "keyframes" : qx.bom.client.CssAnimation.getKeyFrames()
        };
      };
      return null;
    },
    /**
     * Checks for the 'animation-fill-mode' CSS style.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getFillMode : function(){

      return qx.bom.Style.getPropertyName("AnimationFillMode");
    },
    /**
     * Checks for the 'animation-play-state' CSS style.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getPlayState : function(){

      return qx.bom.Style.getPropertyName("AnimationPlayState");
    },
    /**
     * Checks for the style name used for animations.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getName : function(){

      return qx.bom.Style.getPropertyName("animation");
    },
    /**
     * Checks for the event name of animation start.
     * @internal
     * @return {String} The name of the event.
     */
    getAnimationStart : function(){

      var mapping = {
        "msAnimation" : "MSAnimationStart",
        "WebkitAnimation" : "webkitAnimationStart",
        "MozAnimation" : "animationstart",
        "OAnimation" : "oAnimationStart",
        "animation" : "animationstart"
      };
      return mapping[this.getName()];
    },
    /**
     * Checks for the event name of animation end.
     * @internal
     * @return {String} The name of the event.
     */
    getAnimationIteration : function(){

      var mapping = {
        "msAnimation" : "MSAnimationIteration",
        "WebkitAnimation" : "webkitAnimationIteration",
        "MozAnimation" : "animationiteration",
        "OAnimation" : "oAnimationIteration",
        "animation" : "animationiteration"
      };
      return mapping[this.getName()];
    },
    /**
     * Checks for the event name of animation end.
     * @internal
     * @return {String} The name of the event.
     */
    getAnimationEnd : function(){

      var mapping = {
        "msAnimation" : "MSAnimationEnd",
        "WebkitAnimation" : "webkitAnimationEnd",
        "MozAnimation" : "animationend",
        "OAnimation" : "oAnimationEnd",
        "animation" : "animationend"
      };
      return mapping[this.getName()];
    },
    /**
     * Checks what selector should be used to add keyframes to stylesheets.
     * @internal
     * @return {String|null} The name of the selector or null, if the selector
     *   is not supported.
     */
    getKeyFrames : function(){

      var prefixes = qx.bom.Style.VENDOR_PREFIXES;
      var keyFrames = [];
      for(var i = 0;i < prefixes.length;i++){

        var key = "@" + qx.bom.Style.getCssName(prefixes[i]) + "-keyframes";
        keyFrames.push(key);
      };
      keyFrames.unshift("@keyframes");
      var sheet = qx.bom.Stylesheet.createElement();
      for(var i = 0;i < keyFrames.length;i++){

        try{

          qx.bom.Stylesheet.addRule(sheet, keyFrames[i] + " name", "");
          return keyFrames[i];
        } catch(e) {
        };
      };
      return null;
    },
    /**
     * Checks for the requestAnimationFrame method and return the prefixed name.
     * @internal
     * @return {String|null} A string the method name or null, if the method
     *   is not supported.
     */
    getRequestAnimationFrame : function(){

      var choices = ["requestAnimationFrame", "msRequestAnimationFrame", "webkitRequestAnimationFrame", "mozRequestAnimationFrame", "oRequestAnimationFrame"];
      for(var i = 0;i < choices.length;i++){

        if(window[choices[i]] != undefined){

          return choices[i];
        };
      };
      return null;
    }
  },
  defer : function(statics){

    qx.core.Environment.add("css.animation", statics.getSupport);
    qx.core.Environment.add("css.animation.requestframe", statics.getRequestAnimationFrame);
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This class is responsible for applying CSS3 animations to plain DOM elements.
 *
 * The implementation is mostly a cross-browser wrapper for applying the
 * animations, including transforms. If the browser does not support
 * CSS animations, but you have set a keep frame, the keep frame will be applied
 * immediately, thus making the animations optional.
 *
 * The API aligns closely to the spec wherever possible.
 *
 * http://www.w3.org/TR/css3-animations/
 *
 * {@link qx.bom.element.Animation} is the class, which takes care of the
 * feature detection for CSS animations and decides which implementation
 * (CSS or JavaScript) should be used. Most likely, this implementation should
 * be the one to use.
 */
qx.Bootstrap.define("qx.bom.element.AnimationCss", {
  statics : {
    // initialization
    __sheet : null,
    __rulePrefix : "Anni",
    __id : 0,
    /** Static map of rules */
    __rules : {
    },
    /** The used keys for transforms. */
    __transitionKeys : {
      "scale" : true,
      "rotate" : true,
      "skew" : true,
      "translate" : true
    },
    /** Map of cross browser CSS keys. */
    __cssAnimationKeys : qx.core.Environment.get("css.animation"),
    /**
     * This is the main function to start the animation in reverse mode.
     * For further details, take a look at the documentation of the wrapper
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    animateReverse : function(el, desc, duration){

      return this._animate(el, desc, duration, true);
    },
    /**
     * This is the main function to start the animation. For further details,
     * take a look at the documentation of the wrapper
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    animate : function(el, desc, duration){

      return this._animate(el, desc, duration, false);
    },
    /**
     * Internal method to start an animation either reverse or not.
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @param reverse {Boolean} <code>true</code>, if the animation should be
     *   reversed.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    _animate : function(el, desc, duration, reverse){

      this.__normalizeDesc(desc);
      {
      };
      // reverse the keep property if the animation is reverse as well
      var keep = desc.keep;
      if(keep != null && (reverse || (desc.alternate && desc.repeat % 2 == 0))){

        keep = 100 - keep;
      };
      if(!this.__sheet){

        this.__sheet = qx.bom.Stylesheet.createElement();
      };
      var keyFrames = desc.keyFrames;
      if(duration == undefined){

        duration = desc.duration;
      };
      // if animations are supported
      if(this.__cssAnimationKeys != null){

        var name = this.__addKeyFrames(keyFrames, reverse);
        var style = name + " " + duration + "ms " + desc.repeat + " " + desc.timing + " " + (desc.delay ? desc.delay + "ms " : "") + (desc.alternate ? "alternate" : "");
        qx.bom.Event.addNativeListener(el, this.__cssAnimationKeys["start-event"], this.__onAnimationStart);
        qx.bom.Event.addNativeListener(el, this.__cssAnimationKeys["iteration-event"], this.__onAnimationIteration);
        qx.bom.Event.addNativeListener(el, this.__cssAnimationKeys["end-event"], this.__onAnimationEnd);
        {
        };
        el.style[qx.lang.String.camelCase(this.__cssAnimationKeys["name"])] = style;
        // use the fill mode property if available and suitable
        if(keep && keep == 100 && this.__cssAnimationKeys["fill-mode"]){

          el.style[this.__cssAnimationKeys["fill-mode"]] = "forwards";
        };
      };
      var animation = new qx.bom.element.AnimationHandle();
      animation.desc = desc;
      animation.el = el;
      animation.keep = keep;
      el.$$animation = animation;
      // additional transform keys
      if(desc.origin != null){

        qx.bom.element.Transform.setOrigin(el, desc.origin);
      };
      // fallback for browsers not supporting animations
      if(this.__cssAnimationKeys == null){

        window.setTimeout(function(){

          qx.bom.element.AnimationCss.__onAnimationEnd({
            target : el
          });
        }, 0);
      };
      return animation;
    },
    /**
     * Handler for the animation start.
     * @param e {Event} The native event from the browser.
     */
    __onAnimationStart : function(e){

      e.target.$$animation.emit("start", e.target);
    },
    /**
     * Handler for the animation iteration.
     * @param e {Event} The native event from the browser.
     */
    __onAnimationIteration : function(e){

      // It could happen that an animation end event is fired before an
      // animation iteration appears [BUG #6928]
      if(e.target != null && e.target.$$animation != null){

        e.target.$$animation.emit("iteration", e.target);
      };
    },
    /**
     * Handler for the animation end.
     * @param e {Event} The native event from the browser.
     */
    __onAnimationEnd : function(e){

      var el = e.target;
      var animation = el.$$animation;
      // ignore events when already cleaned up
      if(!animation){

        return;
      };
      var desc = animation.desc;
      if(qx.bom.element.AnimationCss.__cssAnimationKeys != null){

        // reset the styling
        var key = qx.lang.String.camelCase(qx.bom.element.AnimationCss.__cssAnimationKeys["name"]);
        el.style[key] = "";
        qx.bom.Event.removeNativeListener(el, qx.bom.element.AnimationCss.__cssAnimationKeys["name"], qx.bom.element.AnimationCss.__onAnimationEnd);
      };
      if(desc.origin != null){

        qx.bom.element.Transform.setOrigin(el, "");
      };
      qx.bom.element.AnimationCss.__keepFrame(el, desc.keyFrames[animation.keep]);
      el.$$animation = null;
      animation.el = null;
      animation.ended = true;
      animation.emit("end", el);
    },
    /**
     * Helper method which takes an element and a key frame description and
     * applies the properties defined in the given frame to the element. This
     * method is used to keep the state of the animation.
     * @param el {Element} The element to apply the frame to.
     * @param endFrame {Map} The description of the end frame, which is basically
     *   a map containing CSS properties and values including transforms.
     */
    __keepFrame : function(el, endFrame){

      // keep the element at this animation step
      var transforms;
      for(var style in endFrame){

        if(style in qx.bom.element.AnimationCss.__transitionKeys){

          if(!transforms){

            transforms = {
            };
          };
          transforms[style] = endFrame[style];
        } else {

          el.style[qx.lang.String.camelCase(style)] = endFrame[style];
        };
      };
      // transform keeping
      if(transforms){

        qx.bom.element.Transform.transform(el, transforms);
      };
    },
    /**
     * Preprocessing of the description to make sure every necessary key is
     * set to its default.
     * @param desc {Map} The description of the animation.
     */
    __normalizeDesc : function(desc){

      if(!desc.hasOwnProperty("alternate")){

        desc.alternate = false;
      };
      if(!desc.hasOwnProperty("keep")){

        desc.keep = null;
      };
      if(!desc.hasOwnProperty("repeat")){

        desc.repeat = 1;
      };
      if(!desc.hasOwnProperty("timing")){

        desc.timing = "linear";
      };
      if(!desc.hasOwnProperty("origin")){

        desc.origin = null;
      };
    },
    /**
     * Debugging helper to validate the description.
     * @signature function(desc)
     * @param desc {Map} The description of the animation.
     */
    __validateDesc : null,
    /**
     * Helper to add the given frames to an internal CSS stylesheet. It parses
     * the description and adds the key frames to the sheet.
     * @param frames {Map} A map of key frames that describe the animation.
     * @param reverse {Boolean} <code>true</code>, if the key frames should
     *   be added in reverse order.
     * @return {String} The generated name of the keyframes rule.
     */
    __addKeyFrames : function(frames, reverse){

      var rule = "";
      // for each key frame
      for(var position in frames){

        rule += (reverse ? -(position - 100) : position) + "% {";
        var frame = frames[position];
        var transforms;
        // each style
        for(var style in frame){

          if(style in this.__transitionKeys){

            if(!transforms){

              transforms = {
              };
            };
            transforms[style] = frame[style];
          } else {

            var propName = qx.bom.Style.getPropertyName(style);
            var prefixed = (propName !== null) ? qx.bom.Style.getCssName(propName) : "";
            rule += (prefixed || style) + ":" + frame[style] + ";";
          };
        };
        // transform handling
        if(transforms){

          rule += qx.bom.element.Transform.getCss(transforms);
        };
        rule += "} ";
      };
      // cached shorthand
      if(this.__rules[rule]){

        return this.__rules[rule];
      };
      var name = this.__rulePrefix + this.__id++;
      var selector = this.__cssAnimationKeys["keyframes"] + " " + name;
      qx.bom.Stylesheet.addRule(this.__sheet, selector, rule);
      this.__rules[rule] = name;
      return name;
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
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * This is a simple handle, which will be returned when an animation is
 * started using the {@link qx.bom.element.Animation#animate} method. It
 * basically controls the animation.
 *
 * @ignore(qx.bom.element.AnimationJs)
 */
qx.Bootstrap.define("qx.bom.element.AnimationHandle", {
  extend : qx.event.Emitter,
  construct : function(){

    var css = qx.core.Environment.get("css.animation");
    this.__playState = css && css["play-state"];
    this.__playing = true;
  },
  events : {
    /** Fired when the animation started via {@link qx.bom.element.Animation}. */
    "start" : "Element",
    /**
     * Fired when the animation started via {@link qx.bom.element.Animation} has
     * ended.
     */
    "end" : "Element",
    /** Fired on every iteration of the animation. */
    "iteration" : "Element"
  },
  members : {
    __playState : null,
    __playing : false,
    __ended : false,
    /**
     * Accessor of the playing state.
     * @return {Boolean} <code>true</code>, if the animations is playing.
     */
    isPlaying : function(){

      return this.__playing;
    },
    /**
     * Accessor of the ended state.
     * @return {Boolean} <code>true</code>, if the animations has ended.
     */
    isEnded : function(){

      return this.__ended;
    },
    /**
     * Accessor of the paused state.
     * @return {Boolean} <code>true</code>, if the animations is paused.
     */
    isPaused : function(){

      return this.el.style[this.__playState] == "paused";
    },
    /**
     * Pauses the animation, if running. If not running, it will be ignored.
     */
    pause : function(){

      if(this.el){

        this.el.style[this.__playState] = "paused";
        this.el.$$animation.__playing = false;
        // in case the animation is based on JS
        if(this.animationId && qx.bom.element.AnimationJs){

          qx.bom.element.AnimationJs.pause(this);
        };
      };
    },
    /**
     * Resumes an animation. This does not start the animation once it has ended.
     * In this case you need to start a new Animation.
     */
    play : function(){

      if(this.el){

        this.el.style[this.__playState] = "running";
        this.el.$$animation.__playing = true;
        // in case the animation is based on JS
        if(this.i != undefined && qx.bom.element.AnimationJs){

          qx.bom.element.AnimationJs.play(this);
        };
      };
    },
    /**
     * Stops the animation if running.
     */
    stop : function(){

      if(this.el && qx.core.Environment.get("css.animation") && !this.jsAnimation){

        this.el.style[this.__playState] = "";
        this.el.style[qx.core.Environment.get("css.animation").name] = "";
        this.el.$$animation.__playing = false;
        this.el.$$animation.__ended = true;
      } else if(this.jsAnimation){

        this.stopped = true;
        qx.bom.element.AnimationJs.stop(this);
      };
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
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * This class offers the same API as the CSS3 animation layer in
 * {@link qx.bom.element.AnimationCss} but uses JavaScript to fake the behavior.
 *
 * {@link qx.bom.element.Animation} is the class, which takes care of the
 * feature detection for CSS animations and decides which implementation
 * (CSS or JavaScript) should be used. Most likely, this implementation should
 * be the one to use.
 *
 * @ignore(qx.bom.element.Style.*)
 * @use(qx.bom.element.AnimationJs#play)
 */
qx.Bootstrap.define("qx.bom.element.AnimationJs", {
  statics : {
    /**
     * The maximal time a frame should take.
     */
    __maxStepTime : 30,
    /**
     * The supported CSS units.
     */
    __units : ["%", "in", "cm", "mm", "em", "ex", "pt", "pc", "px"],
    /** The used keys for transforms. */
    __transitionKeys : {
      "scale" : true,
      "rotate" : true,
      "skew" : true,
      "translate" : true
    },
    /**
     * This is the main function to start the animation. For further details,
     * take a look at the documentation of the wrapper
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    animate : function(el, desc, duration){

      return this._animate(el, desc, duration, false);
    },
    /**
     * This is the main function to start the animation in reversed mode.
     * For further details, take a look at the documentation of the wrapper
     * {@link qx.bom.element.Animation}.
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    animateReverse : function(el, desc, duration){

      return this._animate(el, desc, duration, true);
    },
    /**
     * Helper to start the animation, either in reversed order or not.
     *
     * @param el {Element} The element to animate.
     * @param desc {Map} Animation description.
     * @param duration {Integer?} The duration of the animation which will
     *   override the duration given in the description.
     * @param reverse {Boolean} <code>true</code>, if the animation should be
     *   reversed.
     * @return {qx.bom.element.AnimationHandle} The handle.
     */
    _animate : function(el, desc, duration, reverse){

      // stop if an animation is already running
      if(el.$$animation){

        return el.$$animation;
      };
      desc = qx.lang.Object.clone(desc, true);
      if(duration == undefined){

        duration = desc.duration;
      };
      var keyFrames = desc.keyFrames;
      var keys = this.__getOrderedKeys(keyFrames);
      var stepTime = this.__getStepTime(duration, keys);
      var steps = parseInt(duration / stepTime, 10);
      this.__normalizeKeyFrames(keyFrames, el);
      var delta = this.__calculateDelta(steps, stepTime, keys, keyFrames, duration, desc.timing);
      var handle = new qx.bom.element.AnimationHandle();
      handle.jsAnimation = true;
      if(reverse){

        delta.reverse();
        handle.reverse = true;
      };
      handle.desc = desc;
      handle.el = el;
      handle.delta = delta;
      handle.stepTime = stepTime;
      handle.steps = steps;
      el.$$animation = handle;
      handle.i = 0;
      handle.initValues = {
      };
      handle.repeatSteps = this.__applyRepeat(steps, desc.repeat);
      var delay = desc.delay || 0;
      var self = this;
      handle.delayId = window.setTimeout(function(){

        handle.delayId = null;
        self.play(handle);
      }, delay);
      return handle;
    },
    /**
     * Try to normalize the keyFrames by adding the default / set values of the
     * element.
     * @param keyFrames {Map} The map of key frames.
     * @param el {Element} The element to animate.
     */
    __normalizeKeyFrames : function(keyFrames, el){

      // collect all possible keys and its units
      var units = {
      };
      for(var percent in keyFrames){

        for(var name in keyFrames[percent]){

          // prefixed key calculation
          var prefixed = qx.bom.Style.getPropertyName(name);
          if(prefixed && prefixed != name){

            var prefixedName = qx.bom.Style.getCssName(prefixed);
            keyFrames[percent][prefixedName] = keyFrames[percent][name];
            delete keyFrames[percent][name];
            name = prefixedName;
          };
          // check for the available units
          if(units[name] == undefined){

            var item = keyFrames[percent][name];
            if(typeof item == "string"){

              units[name] = this.__getUnit(item);
            } else {

              units[name] = "";
            };
          };
        };
      };
      // add all missing keys
      for(var percent in keyFrames){

        var frame = keyFrames[percent];
        for(var name in units){

          if(frame[name] == undefined){

            if(name in el.style){

              // get the computed style if possible
              if(window.getComputedStyle){

                frame[name] = getComputedStyle(el, null)[name];
              } else {

                frame[name] = el.style[name];
              };
            } else {

              frame[name] = el[name];
            };
            // if its a unit we know, set 0 as fallback
            if(frame[name] === "" && this.__units.indexOf(units[name]) != -1){

              frame[name] = "0" + units[name];
            };
          };
        };
      };
    },
    /**
     * Checks for transform keys and returns a cloned frame
     * with the right transform style set.
     * @param frame {Map} A single key frame of the description.
     * @return {Map} A modified clone of the given frame.
     */
    __normalizeKeyFrameTransforms : function(frame){

      frame = qx.lang.Object.clone(frame);
      var transforms;
      for(var name in frame){

        if(name in this.__transitionKeys){

          if(!transforms){

            transforms = {
            };
          };
          transforms[name] = frame[name];
          delete frame[name];
        };
      };
      if(transforms){

        var transformStyle = qx.bom.element.Transform.getCss(transforms).split(":");
        if(transformStyle.length > 1){

          frame[transformStyle[0]] = transformStyle[1].replace(";", "");
        };
      };
      return frame;
    },
    /**
     * Precalculation of the delta which will be applied during the animation.
     * The whole deltas will be calculated prior to the animation and stored
     * in a single array. This method takes care of that calculation.
     *
     * @param steps {Integer} The amount of steps to take to the end of the
     *   animation.
     * @param stepTime {Integer} The amount of milliseconds each step takes.
     * @param keys {Array} Ordered list of keys in the key frames map.
     * @param keyFrames {Map} The map of key frames.
     * @param duration {Integer} Time in milliseconds the animation should take.
     * @param timing {String} The given timing function.
     * @return {Array} An array containing the animation deltas.
     */
    __calculateDelta : function(steps, stepTime, keys, keyFrames, duration, timing){

      var delta = new Array(steps);
      var keyIndex = 1;
      delta[0] = this.__normalizeKeyFrameTransforms(keyFrames[0]);
      var last = keyFrames[0];
      var next = keyFrames[keys[keyIndex]];
      var stepsToNext = Math.floor(keys[keyIndex] / (stepTime / duration * 100));
      var calculationIndex = 1;
      // is used as counter for the timing calculation
      // for every step
      for(var i = 1;i < delta.length;i++){

        // switch key frames if we crossed a percent border
        if(i * stepTime / duration * 100 > keys[keyIndex]){

          last = next;
          keyIndex++;
          next = keyFrames[keys[keyIndex]];
          stepsToNext = Math.floor(keys[keyIndex] / (stepTime / duration * 100)) - stepsToNext;
          calculationIndex = 1;
        };
        delta[i] = {
        };
        var transforms;
        // for every property
        for(var name in next){

          var nItem = next[name] + "";
          // transform values
          if(name in this.__transitionKeys){

            if(!transforms){

              transforms = {
              };
            };
            if(qx.Bootstrap.isArray(last[name])){

              if(!qx.Bootstrap.isArray(next[name])){

                next[name] = [next[name]];
              };
              transforms[name] = [];
              for(var j = 0;j < next[name].length;j++){

                var item = next[name][j] + "";
                var x = calculationIndex / stepsToNext;
                transforms[name][j] = this.__getNextValue(item, last[name], timing, x);
              };
            } else {

              var x = calculationIndex / stepsToNext;
              transforms[name] = this.__getNextValue(nItem, last[name], timing, x);
            };
          } else if(nItem.charAt(0) == "#"){

            // get the two values from the frames as RGB arrays
            var value0 = qx.util.ColorUtil.cssStringToRgb(last[name]);
            var value1 = qx.util.ColorUtil.cssStringToRgb(nItem);
            var stepValue = [];
            // calculate every color chanel
            for(var j = 0;j < value0.length;j++){

              var range = value0[j] - value1[j];
              var x = calculationIndex / stepsToNext;
              var timingX = qx.bom.AnimationFrame.calculateTiming(timing, x);
              stepValue[j] = parseInt(value0[j] - range * timingX, 10);
            };
            delta[i][name] = qx.util.ColorUtil.rgbToHexString(stepValue);
          } else if(!isNaN(parseFloat(nItem))){

            var x = calculationIndex / stepsToNext;
            delta[i][name] = this.__getNextValue(nItem, last[name], timing, x);
          } else {

            delta[i][name] = last[name] + "";
          };;
        };
        // save all transformations in the delta values
        if(transforms){

          var transformStyle = qx.bom.element.Transform.getCss(transforms).split(":");
          if(transformStyle.length > 1){

            delta[i][transformStyle[0]] = transformStyle[1].replace(";", "");
          };
        };
        calculationIndex++;
      };
      // make sure the last key frame is right
      delta[delta.length - 1] = this.__normalizeKeyFrameTransforms(keyFrames[100]);
      return delta;
    },
    /**
     * Ties to parse out the unit of the given value.
     *
     * @param item {String} A CSS value including its unit.
     * @return {String} The unit of the given value.
     */
    __getUnit : function(item){

      return item.substring((parseFloat(item) + "").length, item.length);
    },
    /**
     * Returns the next value based on the given arguments.
     *
     * @param nextItem {String} The CSS value of the next frame
     * @param lastItem {String} The CSS value of the last frame
     * @param timing {String} The timing used for the calculation
     * @param x {Number} The x position of the animation on the time axis
     * @return {String} The calculated value including its unit.
     */
    __getNextValue : function(nextItem, lastItem, timing, x){

      var range = parseFloat(nextItem) - parseFloat(lastItem);
      return (parseFloat(lastItem) + range * qx.bom.AnimationFrame.calculateTiming(timing, x)) + this.__getUnit(nextItem);
    },
    /**
     * Internal helper for the {@link qx.bom.element.AnimationHandle} to play
     * the animation.
     * @internal
     * @param handle {qx.bom.element.AnimationHandle} The hand which
     *   represents the animation.
     * @return {qx.bom.element.AnimationHandle} The handle for chaining.
     */
    play : function(handle){

      handle.emit("start", handle.el);
      var id = window.setInterval(function(){

        handle.repeatSteps--;
        var values = handle.delta[handle.i % handle.steps];
        // save the init values
        if(handle.i === 0){

          for(var name in values){

            if(handle.initValues[name] === undefined){

              // animate element property
              if(handle.el[name] !== undefined){

                handle.initValues[name] = handle.el[name];
              } else if(qx.bom.element.Style){

                handle.initValues[name] = qx.bom.element.Style.get(handle.el, qx.lang.String.camelCase(name));
              } else {

                handle.initValues[name] = handle.el.style[qx.lang.String.camelCase(name)];
              };
            };
          };
        };
        qx.bom.element.AnimationJs.__applyStyles(handle.el, values);
        handle.i++;
        // iteration condition
        if(handle.i % handle.steps == 0){

          handle.emit("iteration", handle.el);
          if(handle.desc.alternate){

            handle.delta.reverse();
          };
        };
        // end condition
        if(handle.repeatSteps < 0){

          qx.bom.element.AnimationJs.stop(handle);
        };
      }, handle.stepTime);
      handle.animationId = id;
      return handle;
    },
    /**
     * Internal helper for the {@link qx.bom.element.AnimationHandle} to pause
     * the animation.
     * @internal
     * @param handle {qx.bom.element.AnimationHandle} The hand which
     *   represents the animation.
     * @return {qx.bom.element.AnimationHandle} The handle for chaining.
     */
    pause : function(handle){

      // stop the interval
      window.clearInterval(handle.animationId);
      handle.animationId = null;
      return handle;
    },
    /**
     * Internal helper for the {@link qx.bom.element.AnimationHandle} to stop
     * the animation.
     * @internal
     * @param handle {qx.bom.element.AnimationHandle} The hand which
     *   represents the animation.
     * @return {qx.bom.element.AnimationHandle} The handle for chaining.
     */
    stop : function(handle){

      var desc = handle.desc;
      var el = handle.el;
      var initValues = handle.initValues;
      if(handle.animationId){

        window.clearInterval(handle.animationId);
      };
      // clear the delay if the animation has not been started
      if(handle.delayId){

        window.clearTimeout(handle.delayId);
      };
      // check if animation is already stopped
      if(el == undefined){

        return handle;
      };
      // if we should keep a frame
      var keep = desc.keep;
      if(keep != undefined && !handle.stopped){

        if(handle.reverse || (desc.alternate && desc.repeat && desc.repeat % 2 == 0)){

          keep = 100 - keep;
        };
        this.__applyStyles(el, desc.keyFrames[keep]);
      } else {

        this.__applyStyles(el, initValues);
      };
      el.$$animation = null;
      handle.el = null;
      handle.ended = true;
      handle.animationId = null;
      handle.emit("end", el);
      return handle;
    },
    /**
     * Takes care of the repeat key of the description.
     * @param steps {Integer} The number of steps one iteration would take.
     * @param repeat {Integer|String} It can be either a number how often the
     * animation should be repeated or the string 'infinite'.
     * @return {Integer} The number of steps to animate.
     */
    __applyRepeat : function(steps, repeat){

      if(repeat == undefined){

        return steps;
      };
      if(repeat == "infinite"){

        return Number.MAX_VALUE;
      };
      return steps * repeat;
    },
    /**
     * Central method to apply css styles and element properties.
     * @param el {Element} The DOM element to apply the styles.
     * @param styles {Map} A map containing styles and values.
     */
    __applyStyles : function(el, styles){

      for(var key in styles){

        // ignore undefined values (might be a bad detection)
        if(styles[key] === undefined){

          continue;
        };
        // apply element property value - only if a CSS property
        // is *not* available
        if(typeof el.style[key] === "undefined" && key in el){

          el[key] = styles[key];
          continue;
        };
        var name = qx.bom.Style.getPropertyName(key) || key;
        if(qx.bom.element.Style){

          qx.bom.element.Style.set(el, name, styles[key]);
        } else {

          el.style[name] = styles[key];
        };
      };
    },
    /**
     * Dynamic calculation of the steps time considering a max step time.
     * @param duration {Number} The duration of the animation.
     * @param keys {Array} An array containing the orderd set of key frame keys.
     * @return {Integer} The best suited step time.
     */
    __getStepTime : function(duration, keys){

      // get min difference
      var minDiff = 100;
      for(var i = 0;i < keys.length - 1;i++){

        minDiff = Math.min(minDiff, keys[i + 1] - keys[i]);
      };
      var stepTime = duration * minDiff / 100;
      while(stepTime > this.__maxStepTime){

        stepTime = stepTime / 2;
      };
      return Math.round(stepTime);
    },
    /**
     * Helper which returns the orderd keys of the key frame map.
     * @param keyFrames {Map} The map of key frames.
     * @return {Array} An orderd list of kyes.
     */
    __getOrderedKeys : function(keyFrames){

      var keys = Object.keys(keyFrames);
      for(var i = 0;i < keys.length;i++){

        keys[i] = parseInt(keys[i], 10);
      };
      keys.sort(function(a, b){

        return a - b;
      });
      return keys;
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
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * Responsible for checking all relevant CSS transform properties.
 *
 * Specs:
 * http://www.w3.org/TR/css3-2d-transforms/
 * http://www.w3.org/TR/css3-3d-transforms/
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.CssTransform", {
  statics : {
    /**
     * Main check method which returns an object if CSS animations are
     * supported. This object contains all necessary keys to work with CSS
     * animations.
     * <ul>
     *  <li><code>name</code> The name of the css transform style</li>
     *  <li><code>style</code> The name of the css transform-style style</li>
     *  <li><code>origin</code> The name of the transform-origin style</li>
     *  <li><code>3d</code> Whether 3d transforms are supported</li>
     *  <li><code>perspective</code> The name of the perspective style</li>
     *  <li><code>perspective-origin</code> The name of the perspective-origin style</li>
     *  <li><code>backface-visibility</code> The name of the backface-visibility style</li>
     * </ul>
     *
     * @internal
     * @return {Object|null} The described object or null, if animations are
     *   not supported.
     */
    getSupport : function(){

      var name = qx.bom.client.CssTransform.getName();
      if(name != null){

        return {
          "name" : name,
          "style" : qx.bom.client.CssTransform.getStyle(),
          "origin" : qx.bom.client.CssTransform.getOrigin(),
          "3d" : qx.bom.client.CssTransform.get3D(),
          "perspective" : qx.bom.client.CssTransform.getPerspective(),
          "perspective-origin" : qx.bom.client.CssTransform.getPerspectiveOrigin(),
          "backface-visibility" : qx.bom.client.CssTransform.getBackFaceVisibility()
        };
      };
      return null;
    },
    /**
     * Checks for the style name used to set the transform origin.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getStyle : function(){

      return qx.bom.Style.getPropertyName("transformStyle");
    },
    /**
     * Checks for the style name used to set the transform origin.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getPerspective : function(){

      return qx.bom.Style.getPropertyName("perspective");
    },
    /**
     * Checks for the style name used to set the perspective origin.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getPerspectiveOrigin : function(){

      return qx.bom.Style.getPropertyName("perspectiveOrigin");
    },
    /**
     * Checks for the style name used to set the backface visibility.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getBackFaceVisibility : function(){

      return qx.bom.Style.getPropertyName("backfaceVisibility");
    },
    /**
     * Checks for the style name used to set the transform origin.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getOrigin : function(){

      return qx.bom.Style.getPropertyName("transformOrigin");
    },
    /**
     * Checks for the style name used for transforms.
     * @internal
     * @return {String|null} The name of the style or null, if the style is
     *   not supported.
     */
    getName : function(){

      return qx.bom.Style.getPropertyName("transform");
    },
    /**
     * Checks if 3D transforms are supported.
     * @internal
     * @return {Boolean} <code>true</code>, if 3D transformations are supported
     */
    get3D : function(){

      return qx.bom.client.CssTransform.getPerspective() != null;
    }
  },
  defer : function(statics){

    qx.core.Environment.add("css.transform", statics.getSupport);
    qx.core.Environment.add("css.transform.3d", statics.get3D);
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
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * This class is responsible for applying CSS3 transforms to plain DOM elements.
 * The implementation is mostly a cross browser wrapper for applying the
 * transforms.
 * The API is keep to the spec as close as possible.
 *
 * http://www.w3.org/TR/css3-3d-transforms/
 */
qx.Bootstrap.define("qx.bom.element.Transform", {
  statics : {
    /** The dimensions of the transforms */
    __dimensions : ["X", "Y", "Z"],
    /** Internal storage of the CSS names */
    __cssKeys : qx.core.Environment.get("css.transform"),
    /**
     * Method to apply multiple transforms at once to the given element. It
     * takes a map containing the transforms you want to apply plus the values
     * e.g.<code>{scale: 2, rotate: "5deg"}</code>.
     * The values can be either singular, which means a single value will
     * be added to the CSS. If you give an array, the values will be split up
     * and each array entry will be used for the X, Y or Z dimension in that
     * order e.g. <code>{scale: [2, 0.5]}</code> will result in a element
     * double the size in X direction and half the size in Y direction.
     * Make sure your browser supports all transformations you apply.
     * @param el {Element} The element to apply the transformation.
     * @param transforms {Map} The map containing the transforms and value.
     */
    transform : function(el, transforms){

      var transformCss = this.__mapToCss(transforms);
      if(this.__cssKeys != null){

        var style = this.__cssKeys["name"];
        el.style[style] = transformCss;
      };
    },
    /**
     * Translates the given element by the given value. For further details, take
     * a look at the {@link #transform} method.
     * @param el {Element} The element to apply the transformation.
     * @param value {String|Array} The value to translate e.g. <code>"10px"</code>.
     */
    translate : function(el, value){

      this.transform(el, {
        translate : value
      });
    },
    /**
     * Scales the given element by the given value. For further details, take
     * a look at the {@link #transform} method.
     * @param el {Element} The element to apply the transformation.
     * @param value {Number|Array} The value to scale.
     */
    scale : function(el, value){

      this.transform(el, {
        scale : value
      });
    },
    /**
     * Rotates the given element by the given value. For further details, take
     * a look at the {@link #transform} method.
     * @param el {Element} The element to apply the transformation.
     * @param value {String|Array} The value to rotate e.g. <code>"90deg"</code>.
     */
    rotate : function(el, value){

      this.transform(el, {
        rotate : value
      });
    },
    /**
     * Skews the given element by the given value. For further details, take
     * a look at the {@link #transform} method.
     * @param el {Element} The element to apply the transformation.
     * @param value {String|Array} The value to skew e.g. <code>"90deg"</code>.
     */
    skew : function(el, value){

      this.transform(el, {
        skew : value
      });
    },
    /**
     * Converts the given map to a string which could be added to a css
     * stylesheet.
     * @param transforms {Map} The transforms map. For a detailed description,
     * take a look at the {@link #transform} method.
     * @return {String} The CSS value.
     */
    getCss : function(transforms){

      var transformCss = this.__mapToCss(transforms);
      if(this.__cssKeys != null){

        var style = this.__cssKeys["name"];
        return qx.bom.Style.getCssName(style) + ":" + transformCss + ";";
      };
      return "";
    },
    /**
     * Sets the transform-origin property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-origin-property
     * @param el {Element} The dom element to set the property.
     * @param value {String} CSS position values like <code>50% 50%</code> or
     *   <code>left top</code>.
     */
    setOrigin : function(el, value){

      if(this.__cssKeys != null){

        el.style[this.__cssKeys["origin"]] = value;
      };
    },
    /**
     * Returns the transform-origin property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-origin-property
     * @param el {Element} The dom element to read the property.
     * @return {String} The set property, e.g. <code>50% 50%</code>
     */
    getOrigin : function(el){

      if(this.__cssKeys != null){

        return el.style[this.__cssKeys["origin"]];
      };
      return "";
    },
    /**
     * Sets the transform-style property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-style-property
     * @param el {Element} The dom element to set the property.
     * @param value {String} Either <code>flat</code> or <code>preserve-3d</code>.
     */
    setStyle : function(el, value){

      if(this.__cssKeys != null){

        el.style[this.__cssKeys["style"]] = value;
      };
    },
    /**
     * Returns the transform-style property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-style-property
     * @param el {Element} The dom element to read the property.
     * @return {String} The set property, either <code>flat</code> or
     *   <code>preserve-3d</code>.
     */
    getStyle : function(el){

      if(this.__cssKeys != null){

        return el.style[this.__cssKeys["style"]];
      };
      return "";
    },
    /**
     * Sets the perspective property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-property
     * @param el {Element} The dom element to set the property.
     * @param value {Number} The perspective layer. Numbers between 100
     *   and 5000 give the best results.
     */
    setPerspective : function(el, value){

      if(this.__cssKeys != null){

        el.style[this.__cssKeys["perspective"]] = value + "px";
      };
    },
    /**
     * Returns the perspective property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-property
     * @param el {Element} The dom element to read the property.
     * @return {String} The set property, e.g. <code>500</code>
     */
    getPerspective : function(el){

      if(this.__cssKeys != null){

        return el.style[this.__cssKeys["perspective"]];
      };
      return "";
    },
    /**
     * Sets the perspective-origin property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-origin-property
     * @param el {Element} The dom element to set the property.
     * @param value {String} CSS position values like <code>50% 50%</code> or
     *   <code>left top</code>.
     */
    setPerspectiveOrigin : function(el, value){

      if(this.__cssKeys != null){

        el.style[this.__cssKeys["perspective-origin"]] = value;
      };
    },
    /**
     * Returns the perspective-origin property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-origin-property
     * @param el {Element} The dom element to read the property.
     * @return {String} The set property, e.g. <code>50% 50%</code>
     */
    getPerspectiveOrigin : function(el){

      if(this.__cssKeys != null){

        var value = el.style[this.__cssKeys["perspective-origin"]];
        if(value != ""){

          return value;
        } else {

          var valueX = el.style[this.__cssKeys["perspective-origin"] + "X"];
          var valueY = el.style[this.__cssKeys["perspective-origin"] + "Y"];
          if(valueX != ""){

            return valueX + " " + valueY;
          };
        };
      };
      return "";
    },
    /**
     * Sets the backface-visibility property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#backface-visibility-property
     * @param el {Element} The dom element to set the property.
     * @param value {Boolean} <code>true</code> if the backface should be visible.
     */
    setBackfaceVisibility : function(el, value){

      if(this.__cssKeys != null){

        el.style[this.__cssKeys["backface-visibility"]] = value ? "visible" : "hidden";
      };
    },
    /**
     * Returns the backface-visibility property of the given element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#backface-visibility-property
     * @param el {Element} The dom element to read the property.
     * @return {Boolean} <code>true</code>, if the backface is visible.
     */
    getBackfaceVisibility : function(el){

      if(this.__cssKeys != null){

        return el.style[this.__cssKeys["backface-visibility"]] == "visible";
      };
      return true;
    },
    /**
     * Internal helper which converts the given transforms map to a valid CSS
     * string.
     * @param transforms {Map} A map containing the transforms.
     * @return {String} The CSS transforms.
     */
    __mapToCss : function(transforms){

      var value = "";
      for(var func in transforms){

        var params = transforms[func];
        // if an array is given
        if(qx.Bootstrap.isArray(params)){

          for(var i = 0;i < params.length;i++){

            if(params[i] == undefined || (i == 2 && !qx.core.Environment.get("css.transform.3d"))){

              continue;
            };
            value += func + this.__dimensions[i] + "(";
            value += params[i];
            value += ") ";
          };
        } else {

          // single value case
          value += func + "(" + transforms[func] + ") ";
        };
      };
      return value;
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
     * Christian Hagendorn (cs)

************************************************************************ */
/**
 * Methods to convert colors between different color spaces.
 *
 * @ignore(qx.theme.*)
 * @ignore(qx.Class)
 * @ignore(qx.Class.*)
 */
qx.Bootstrap.define("qx.util.ColorUtil", {
  statics : {
    /**
     * Regular expressions for color strings
     */
    REGEXP : {
      hex3 : /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
      hex6 : /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
      rgb : /^rgb\(\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*\)$/,
      rgba : /^rgba\(\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*\)$/
    },
    /**
     * CSS3 system color names.
     */
    SYSTEM : {
      activeborder : true,
      activecaption : true,
      appworkspace : true,
      background : true,
      buttonface : true,
      buttonhighlight : true,
      buttonshadow : true,
      buttontext : true,
      captiontext : true,
      graytext : true,
      highlight : true,
      highlighttext : true,
      inactiveborder : true,
      inactivecaption : true,
      inactivecaptiontext : true,
      infobackground : true,
      infotext : true,
      menu : true,
      menutext : true,
      scrollbar : true,
      threeddarkshadow : true,
      threedface : true,
      threedhighlight : true,
      threedlightshadow : true,
      threedshadow : true,
      window : true,
      windowframe : true,
      windowtext : true
    },
    /**
     * Named colors, only the 16 basic colors plus the following ones:
     * transparent, grey, magenta, orange and brown
     */
    NAMED : {
      black : [0, 0, 0],
      silver : [192, 192, 192],
      gray : [128, 128, 128],
      white : [255, 255, 255],
      maroon : [128, 0, 0],
      red : [255, 0, 0],
      purple : [128, 0, 128],
      fuchsia : [255, 0, 255],
      green : [0, 128, 0],
      lime : [0, 255, 0],
      olive : [128, 128, 0],
      yellow : [255, 255, 0],
      navy : [0, 0, 128],
      blue : [0, 0, 255],
      teal : [0, 128, 128],
      aqua : [0, 255, 255],
      // Additional values
      transparent : [-1, -1, -1],
      magenta : [255, 0, 255],
      // alias for fuchsia
      orange : [255, 165, 0],
      brown : [165, 42, 42]
    },
    /**
     * Whether the incoming value is a named color.
     *
     * @param value {String} the color value to test
     * @return {Boolean} true if the color is a named color
     */
    isNamedColor : function(value){

      return this.NAMED[value] !== undefined;
    },
    /**
     * Whether the incoming value is a system color.
     *
     * @param value {String} the color value to test
     * @return {Boolean} true if the color is a system color
     */
    isSystemColor : function(value){

      return this.SYSTEM[value] !== undefined;
    },
    /**
     * Whether the color theme manager is loaded. Generally
     * part of the GUI of qooxdoo.
     *
     * @return {Boolean} <code>true</code> when color theme support is ready.
     **/
    supportsThemes : function(){

      if(qx.Class){

        return qx.Class.isDefined("qx.theme.manager.Color");
      };
      return false;
    },
    /**
     * Whether the incoming value is a themed color.
     *
     * @param value {String} the color value to test
     * @return {Boolean} true if the color is a themed color
     */
    isThemedColor : function(value){

      if(!this.supportsThemes()){

        return false;
      };
      if(qx.theme && qx.theme.manager && qx.theme.manager.Color){

        return qx.theme.manager.Color.getInstance().isDynamic(value);
      };
      return false;
    },
    /**
     * Try to convert an incoming string to an RGB array.
     * Supports themed, named and system colors, but also RGB strings,
     * hex3 and hex6 values.
     *
     * @param str {String} any string
     * @return {Array} returns an array of red, green, blue on a successful transformation
     * @throws {Error} if the string could not be parsed
     */
    stringToRgb : function(str){

      if(this.supportsThemes() && this.isThemedColor(str)){

        str = qx.theme.manager.Color.getInstance().resolveDynamic(str);
      };
      if(this.isNamedColor(str)){

        return this.NAMED[str].concat();
      } else if(this.isSystemColor(str)){

        throw new Error("Could not convert system colors to RGB: " + str);
      } else if(this.isRgbaString(str)){

        return this.__rgbaStringToRgb(str);
      } else if(this.isRgbString(str)){

        return this.__rgbStringToRgb();
      } else if(this.isHex3String(str)){

        return this.__hex3StringToRgb();
      } else if(this.isHex6String(str)){

        return this.__hex6StringToRgb();
      };;;;;
      throw new Error("Could not parse color: " + str);
    },
    /**
     * Try to convert an incoming string to an RGB array.
     * Support named colors, RGB strings, hex3 and hex6 values.
     *
     * @param str {String} any string
     * @return {Array} returns an array of red, green, blue on a successful transformation
     * @throws {Error} if the string could not be parsed
     */
    cssStringToRgb : function(str){

      if(this.isNamedColor(str)){

        return this.NAMED[str];
      } else if(this.isSystemColor(str)){

        throw new Error("Could not convert system colors to RGB: " + str);
      } else if(this.isRgbString(str)){

        return this.__rgbStringToRgb();
      } else if(this.isRgbaString(str)){

        return this.__rgbaStringToRgb();
      } else if(this.isHex3String(str)){

        return this.__hex3StringToRgb();
      } else if(this.isHex6String(str)){

        return this.__hex6StringToRgb();
      };;;;;
      throw new Error("Could not parse color: " + str);
    },
    /**
     * Try to convert an incoming string to an RGB string, which can be used
     * for all color properties.
     * Supports themed, named and system colors, but also RGB strings,
     * hex3 and hex6 values.
     *
     * @param str {String} any string
     * @return {String} a RGB string
     * @throws {Error} if the string could not be parsed
     */
    stringToRgbString : function(str){

      return this.rgbToRgbString(this.stringToRgb(str));
    },
    /**
     * Converts a RGB array to an RGB string
     *
     * @param rgb {Array} an array with red, green and blue values and optionally
     * an alpha value
     * @return {String} an RGB string
     */
    rgbToRgbString : function(rgb){

      return "rgb" + (rgb[3] ? "a" : "") + "(" + rgb.join(",") + ")";
    },
    /**
     * Converts a RGB array to an hex6 string
     *
     * @param rgb {Array} an array with red, green and blue
     * @return {String} a hex6 string (#xxxxxx)
     */
    rgbToHexString : function(rgb){

      return ("#" + qx.lang.String.pad(rgb[0].toString(16).toUpperCase(), 2) + qx.lang.String.pad(rgb[1].toString(16).toUpperCase(), 2) + qx.lang.String.pad(rgb[2].toString(16).toUpperCase(), 2));
    },
    /**
     * Detects if a string is a valid qooxdoo color
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid qooxdoo color
     */
    isValidPropertyValue : function(str){

      return (this.isThemedColor(str) || this.isNamedColor(str) || this.isHex3String(str) || this.isHex6String(str) || this.isRgbString(str) || this.isRgbaString(str));
    },
    /**
     * Detects if a string is a valid CSS color string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid CSS color string
     */
    isCssString : function(str){

      return (this.isSystemColor(str) || this.isNamedColor(str) || this.isHex3String(str) || this.isHex6String(str) || this.isRgbString(str) || this.isRgbaString(str));
    },
    /**
     * Detects if a string is a valid hex3 string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid hex3 string
     */
    isHex3String : function(str){

      return this.REGEXP.hex3.test(str);
    },
    /**
     * Detects if a string is a valid hex6 string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid hex6 string
     */
    isHex6String : function(str){

      return this.REGEXP.hex6.test(str);
    },
    /**
     * Detects if a string is a valid RGB string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid RGB string
     */
    isRgbString : function(str){

      return this.REGEXP.rgb.test(str);
    },
    /**
     * Detects if a string is a valid RGBA string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid RGBA string
     */
    isRgbaString : function(str){

      return this.REGEXP.rgba.test(str);
    },
    /**
     * Converts a regexp object match of a rgb string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __rgbStringToRgb : function(){

      var red = parseInt(RegExp.$1, 10);
      var green = parseInt(RegExp.$2, 10);
      var blue = parseInt(RegExp.$3, 10);
      return [red, green, blue];
    },
    /**
     * Converts a regexp object match of a rgba string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __rgbaStringToRgb : function(){

      var red = parseInt(RegExp.$1, 10);
      var green = parseInt(RegExp.$2, 10);
      var blue = parseInt(RegExp.$3, 10);
      var alpha = parseInt(RegExp.$4, 10);
      if(red === 0 && green === 0 & blue === 0 && alpha === 0){

        return [-1, -1, -1];
      };
      return [red, green, blue];
    },
    /**
     * Converts a regexp object match of a hex3 string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __hex3StringToRgb : function(){

      var red = parseInt(RegExp.$1, 16) * 17;
      var green = parseInt(RegExp.$2, 16) * 17;
      var blue = parseInt(RegExp.$3, 16) * 17;
      return [red, green, blue];
    },
    /**
     * Converts a regexp object match of a hex6 string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __hex6StringToRgb : function(){

      var red = (parseInt(RegExp.$1, 16) * 16) + parseInt(RegExp.$2, 16);
      var green = (parseInt(RegExp.$3, 16) * 16) + parseInt(RegExp.$4, 16);
      var blue = (parseInt(RegExp.$5, 16) * 16) + parseInt(RegExp.$6, 16);
      return [red, green, blue];
    },
    /**
     * Converts a hex3 string to an RGB array
     *
     * @param value {String} a hex3 (#xxx) string
     * @return {Array} an array with red, green, blue
     */
    hex3StringToRgb : function(value){

      if(this.isHex3String(value)){

        return this.__hex3StringToRgb(value);
      };
      throw new Error("Invalid hex3 value: " + value);
    },
    /**
     * Converts a hex3 (#xxx) string to a hex6 (#xxxxxx) string.
     *
     * @param value {String} a hex3 (#xxx) string
     * @return {String} The hex6 (#xxxxxx) string or the passed value when the
     *   passed value is not an hex3 (#xxx) value.
     */
    hex3StringToHex6String : function(value){

      if(this.isHex3String(value)){

        return this.rgbToHexString(this.hex3StringToRgb(value));
      };
      return value;
    },
    /**
     * Converts a hex6 string to an RGB array
     *
     * @param value {String} a hex6 (#xxxxxx) string
     * @return {Array} an array with red, green, blue
     */
    hex6StringToRgb : function(value){

      if(this.isHex6String(value)){

        return this.__hex6StringToRgb(value);
      };
      throw new Error("Invalid hex6 value: " + value);
    },
    /**
     * Converts a hex string to an RGB array
     *
     * @param value {String} a hex3 (#xxx) or hex6 (#xxxxxx) string
     * @return {Array} an array with red, green, blue
     */
    hexStringToRgb : function(value){

      if(this.isHex3String(value)){

        return this.__hex3StringToRgb(value);
      };
      if(this.isHex6String(value)){

        return this.__hex6StringToRgb(value);
      };
      throw new Error("Invalid hex value: " + value);
    },
    /**
     * Convert RGB colors to HSB
     *
     * @param rgb {Number[]} red, blue and green as array
     * @return {Array} an array with hue, saturation and brightness
     */
    rgbToHsb : function(rgb){

      var hue,saturation,brightness;
      var red = rgb[0];
      var green = rgb[1];
      var blue = rgb[2];
      var cmax = (red > green) ? red : green;
      if(blue > cmax){

        cmax = blue;
      };
      var cmin = (red < green) ? red : green;
      if(blue < cmin){

        cmin = blue;
      };
      brightness = cmax / 255.0;
      if(cmax != 0){

        saturation = (cmax - cmin) / cmax;
      } else {

        saturation = 0;
      };
      if(saturation == 0){

        hue = 0;
      } else {

        var redc = (cmax - red) / (cmax - cmin);
        var greenc = (cmax - green) / (cmax - cmin);
        var bluec = (cmax - blue) / (cmax - cmin);
        if(red == cmax){

          hue = bluec - greenc;
        } else if(green == cmax){

          hue = 2.0 + redc - bluec;
        } else {

          hue = 4.0 + greenc - redc;
        };
        hue = hue / 6.0;
        if(hue < 0){

          hue = hue + 1.0;
        };
      };
      return [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100)];
    },
    /**
     * Convert HSB colors to RGB
     *
     * @param hsb {Number[]} an array with hue, saturation and brightness
     * @return {Integer[]} an array with red, green, blue
     */
    hsbToRgb : function(hsb){

      var i,f,p,r,t;
      var hue = hsb[0] / 360;
      var saturation = hsb[1] / 100;
      var brightness = hsb[2] / 100;
      if(hue >= 1.0){

        hue %= 1.0;
      };
      if(saturation > 1.0){

        saturation = 1.0;
      };
      if(brightness > 1.0){

        brightness = 1.0;
      };
      var tov = Math.floor(255 * brightness);
      var rgb = {
      };
      if(saturation == 0.0){

        rgb.red = rgb.green = rgb.blue = tov;
      } else {

        hue *= 6.0;
        i = Math.floor(hue);
        f = hue - i;
        p = Math.floor(tov * (1.0 - saturation));
        r = Math.floor(tov * (1.0 - (saturation * f)));
        t = Math.floor(tov * (1.0 - (saturation * (1.0 - f))));
        switch(i){case 0:
        rgb.red = tov;
        rgb.green = t;
        rgb.blue = p;
        break;case 1:
        rgb.red = r;
        rgb.green = tov;
        rgb.blue = p;
        break;case 2:
        rgb.red = p;
        rgb.green = tov;
        rgb.blue = t;
        break;case 3:
        rgb.red = p;
        rgb.green = r;
        rgb.blue = tov;
        break;case 4:
        rgb.red = t;
        rgb.green = p;
        rgb.blue = tov;
        break;case 5:
        rgb.red = tov;
        rgb.green = p;
        rgb.blue = r;
        break;};
      };
      return [rgb.red, rgb.green, rgb.blue];
    },
    /**
     * Creates a random color.
     *
     * @return {String} a valid qooxdoo/CSS rgb color string.
     */
    randomColor : function(){

      var r = Math.round(Math.random() * 255);
      var g = Math.round(Math.random() * 255);
      var b = Math.round(Math.random() * 255);
      return this.rgbToRgbString([r, g, b]);
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
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * This is a cross browser wrapper for requestAnimationFrame. For further
 * information about the feature, take a look at spec:
 * http://www.w3.org/TR/animation-timing/
 *
 * This class offers two ways of using this feature. First, the plain
 * API the spec describes.
 *
 * Here is a sample usage:
 * <pre class='javascript'>var start = +(new Date());
 * var clb = function(time) {
 *   if (time >= start + duration) {
 *     // ... do some last tasks
 *   } else {
 *     var timePassed = time - start;
 *     // ... calculate the current step and apply it
 *     qx.bom.AnimationFrame.request(clb, this);
 *   }
 * };
 * qx.bom.AnimationFrame.request(clb, this);
 * </pre>
 *
 * Another way of using it is to use it as an instance emitting events.
 *
 * Here is a sample usage of that API:
 * <pre class='javascript'>var frame = new qx.bom.AnimationFrame();
 * frame.on("end", function() {
 *   // ... do some last tasks
 * }, this);
 * frame.on("frame", function(timePassed) {
 *   // ... calculate the current step and apply it
 * }, this);
 * frame.startSequence(duration);
 * </pre>
 *
 * @require(qx.lang.normalize.Date)
 */
qx.Bootstrap.define("qx.bom.AnimationFrame", {
  extend : qx.event.Emitter,
  events : {
    /** Fired as soon as the animation has ended. */
    "end" : undefined,
    /**
     * Fired on every frame having the passed time as value
     * (might be a float for higher precision).
     */
    "frame" : "Number"
  },
  members : {
    __canceled : false,
    /**
     * Method used to start a series of animation frames. The series will end as
     * soon as the given duration is over.
     *
     * @param duration {Number} The duration the sequence should take.
     */
    startSequence : function(duration){

      this.__canceled = false;
      var start = +(new Date());
      var clb = function(time){

        if(this.__canceled){

          this.id = null;
          return;
        };
        // final call
        if(time >= start + duration){

          this.emit("end");
          this.id = null;
        } else {

          var timePassed = Math.max(time - start, 0);
          this.emit("frame", timePassed);
          this.id = qx.bom.AnimationFrame.request(clb, this);
        };
      };
      this.id = qx.bom.AnimationFrame.request(clb, this);
    },
    /**
     * Cancels a started sequence of frames. It will do nothing if no
     * sequence is running.
     */
    cancelSequence : function(){

      this.__canceled = true;
    }
  },
  statics : {
    /**
     * The default time in ms the timeout fallback implementation uses.
     */
    TIMEOUT : 30,
    /**
     * Calculation of the predefined timing functions. Approximation of the real
     * bezier curves has been used for easier calculation. This is good and close
     * enough for the predefined functions like <code>ease</code> or
     * <code>linear</code>.
     *
     * @param func {String} The defined timing function. One of the following values:
     *   <code>"ease-in"</code>, <code>"ease-out"</code>, <code>"linear"</code>,
     *   <code>"ease-in-out"</code>, <code>"ease"</code>.
     * @param x {Integer} The percent value of the function.
     * @return {Integer} The calculated value
     */
    calculateTiming : function(func, x){

      if(func == "ease-in"){

        var a = [3.1223e-7, 0.0757, 1.2646, -0.167, -0.4387, 0.2654];
      } else if(func == "ease-out"){

        var a = [-7.0198e-8, 1.652, -0.551, -0.0458, 0.1255, -0.1807];
      } else if(func == "linear"){

        return x;
      } else if(func == "ease-in-out"){

        var a = [2.482e-7, -0.2289, 3.3466, -1.0857, -1.7354, 0.7034];
      } else {

        // default is 'ease'
        var a = [-0.0021, 0.2472, 9.8054, -21.6869, 17.7611, -5.1226];
      };;;
      // A 6th grade polynomial has been used as approximation of the original
      // bezier curves  described in the transition spec
      // http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag
      // (the same is used for animations as well)
      var y = 0;
      for(var i = 0;i < a.length;i++){

        y += a[i] * Math.pow(x, i);
      };
      return y;
    },
    /**
     * Request for an animation frame. If the native <code>requestAnimationFrame</code>
     * method is supported, it will be used. Otherwise, we use timeouts with a
     * 30ms delay. The HighResolutionTime will be used if supported but the time given
     * to the callback will still be a timestamp starting at 1 January 1970 00:00:00 UTC.
     *
     * @param callback {Function} The callback function which will get the current
     *   time as argument (which could be a float for higher precision).
     * @param context {var} The context of the callback.
     * @return {Number} The id of the request.
     */
    request : function(callback, context){

      var req = qx.core.Environment.get("css.animation.requestframe");
      var clb = function(time){

        // check for high resolution time
        if(time < 1e10){

          time = this.__start + time;
        };
        time = time || +(new Date());
        callback.call(context, time);
      };
      if(req){

        return window[req](clb);
      } else {

        // make sure to use an indirection because setTimeout passes a
        // number as first argument as well
        return window.setTimeout(function(){

          clb();
        }, qx.bom.AnimationFrame.TIMEOUT);
      };
    }
  },
  /**
   * @ignore(performance.timing.*)
   */
  defer : function(statics){

    // check and use the high resolution start time if available
    statics.__start = window.performance && performance.timing && performance.timing.navigationStart;
    // if not, simply use the current time
    if(!statics.__start){

      statics.__start = Date.now();
    };
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * HTML templating module. This is a wrapper for mustache.js which is a
 * "framework-agnostic way to render logic-free views".
 *
 * Here is a basic example how to use it:
 * <pre class="javascript">
 * var template = "Hi, my name is {{name}}!";
 * var view = {name: "qooxdoo"};
 * q.template.render(template, view);
 *   // return "Hi, my name is qooxdoo!"
 * </pre>
 *
 * For further details, please visit the mustache.js documentation here:
 *   https://github.com/janl/mustache.js/blob/master/README.md
 */
qx.Bootstrap.define("qx.module.Template", {
  statics : {
    /**
     * Helper method which provides direct access to templates stored as HTML in
     * the DOM. The DOM node with the given ID will be treated as a template,
     * parsed and a new DOM element will be returned containing the parsed data.
     * Keep in mind that templates can only have one root element.
     * Additionally, you should not put the template into a regular, hidden
     * DOM element because the template may not be valid HTML due to the containing
     * mustache tags. We suggest to put it into a script tag with the type
     * <code>text/template</code>.
     *
     * @attachStatic{qxWeb, template.get}
     * @param id {String} The id of the HTML template in the DOM.
     * @param view {Object} The object holding the data to render.
     * @param partials {Object} Object holding parts of a template.
     * @return {qxWeb} Collection containing a single DOM element with the parsed
     * template data.
     */
    get : function(id, view, partials){

      var el = qx.bom.Template.get(id, view, partials);
      el = qx.module.Template.__wrap(el);
      return qxWeb.$init([el], qxWeb);
    },
    /**
     * Original and only template method of mustache.js. For further
     * documentation, please visit <a href="https://github.com/janl/mustache.js">mustache.js</a>.
     *
     * @attachStatic{qxWeb, template.render}
     * @param template {String} The String containing the template.
     * @param view {Object} The object holding the data to render.
     * @param partials {Object} Object holding parts of a template.
     * @return {String} The parsed template.
     */
    render : function(template, view, partials){

      return qx.bom.Template.render(template, view, partials);
    },
    /**
     * Combines {@link #render} and {@link #get}. Input is equal to {@link #render}
     * and output is equal to {@link #get}. The advantage over {@link #get}
     * is that you don't need a HTML template but can use a template
     * string and still get a collection. Keep in mind that templates
     * can only have one root element.
     *
     * @attachStatic{qxWeb, template.renderToNode}
     * @param template {String} The String containing the template.
     * @param view {Object} The object holding the data to render.
     * @param partials {Object} Object holding parts of a template.
     * @return {qxWeb} Collection containing a single DOM element with the parsed
     * template data.
     */
    renderToNode : function(template, view, partials){

      var el = qx.bom.Template.renderToNode(template, view, partials);
      el = qx.module.Template.__wrap(el);
      return qxWeb.$init([el], qxWeb);
    },
    /**
     * If the given node is a DOM text node, wrap it in a span element and return
     * the wrapper.
     * @param el {Node} a DOM node
     * @return {Element} Original element or wrapper
     */
    __wrap : function(el){

      if(qxWeb.isTextNode(el)){

        var wrapper = document.createElement("span");
        wrapper.appendChild(el);
        el = wrapper;
      };
      return el;
    }
  },
  defer : function(statics){

    qxWeb.$attachStatic({
      "template" : {
        get : statics.get,
        render : statics.render,
        renderToNode : statics.renderToNode
      }
    });
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

   ======================================================================

   This class contains code based on the following work:

   * Mustache.js version 0.7.3

     Code:
       https://github.com/janl/mustache.js

     Copyright:
       (c) 2009 Chris Wanstrath (Ruby)
       (c) 2010 Jan Lehnardt (JavaScript)

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

   ----------------------------------------------------------------------

   Copyright (c) 2009 Chris Wanstrath (Ruby)
   Copyright (c) 2010 Jan Lehnardt (JavaScript)

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   "Software"), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
   LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
   OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
   WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

************************************************************************ */
/**
 * The is a template class which can be used for HTML templating. In fact,
 * this is a wrapper for mustache.js which is a "framework-agnostic way to
 * render logic-free views".
 *
 * Here is a basic example how to use it:
 * Template:
 * <pre class="javascript">
 * var template = "Hi, my name is {{name}}!";
 * var view = {name: "qooxdoo"};
 * qx.bom.Template.render(template, view);
 * // return "Hi, my name is qooxdoo!"
 * </pre>
 *
 * For further details, please visit the mustache.js documentation here:
 *   https://github.com/janl/mustache.js/blob/master/README.md
 *
 * @ignore(module)
 */
qx.Bootstrap.define("qx.bom.Template", {
  statics : {
    /** Contains the mustache.js version. */
    version : null,
    /**
     * Original and only template method of mustache.js. For further
     * documentation, please visit https://github.com/janl/mustache.js
     *
     * @signature function(template, view, partials)
     * @param template {String} The String containing the template.
     * @param view {Object} The object holding the data to render.
     * @param partials {Object} Object holding parts of a template.
     * @return {String} The parsed template.
     */
    render : null,
    /**
     * Combines {@link #render} and {@link #get}. Input is equal to {@link #render}
     * and output is equal to {@link #get}. The advantage over {@link #get}
     * is that you don't need a HTML template but can use a template
     * string and still get a DOM element. Keep in mind that templates
     * can only have one root element.
     *
     * @param template {String} The String containing the template.
     * @param view {Object} The object holding the data to render.
     * @param partials {Object} Object holding parts of a template.
     * @return {Element} A DOM element holding the parsed template data.
     */
    renderToNode : function(template, view, partials){

      var renderedTmpl = this.render(template, view, partials);
      return this._createNodeFromTemplate(renderedTmpl);
    },
    /**
     * Helper method which provides you with a direct access to templates
     * stored as HTML in the DOM. The DOM node with the given ID will be used
     * as a template, parsed and a new DOM node will be returned containing the
     * parsed data. Keep in mind to have only one root DOM element in the the
     * template.
     * Additionally, you should not put the template into a regular, hidden
     * DOM element because the template may not be valid HTML due to the containing
     * mustache tags. We suggest to put it into a script tag with the type
     * <code>text/template</code>.
     *
     * @param id {String} The id of the HTML template in the DOM.
     * @param view {Object} The object holding the data to render.
     * @param partials {Object} Object holding parts of a template.
     * @return {Element} A DOM element holding the parsed template data.
     */
    get : function(id, view, partials){

      // get the content stored in the DOM
      var template = document.getElementById(id);
      return this.renderToNode(template.innerHTML, view, partials);
    },
    /**
     * Accepts a parsed template and returns a (potentially nested) node.
     *
     * @param template {String} The String containing the template.
     * @return {Element} A DOM element holding the parsed template data.
     */
    _createNodeFromTemplate : function(template){

      // template is text only (no html elems) so use text node
      if(template.search(/<|>/) === -1){

        return document.createTextNode(template);
      };
      // template has html elems so convert string into DOM nodes
      var helper = qx.dom.Element.create("div");
      helper.innerHTML = template;
      return helper.children[0];
    }
  }
});
(function(){

  /**
   * Below is the original mustache.js code. Snapshot date is mentioned in
   * the head of this file.
   * @ignore(exports)
   * @ignore(define.*)
   * @ignore(module.*)
   * @lint ignoreNoLoopBlock()
   */
  /*!
   * mustache.js - Logic-less {{mustache}} templates with JavaScript
   * http://github.com/janl/mustache.js
   */
  /*global define: false*/
  (function(root, factory){

    if(typeof exports === "object" && exports){

      factory(exports);
    } else {

      var mustache = {
      };
      factory(mustache);
      if(typeof define === "function" && define.amd){

        define(mustache);
      } else {

        root.Mustache = mustache;
      };
    };
  }(this, function(mustache){

    var whiteRe = /\s*/;
    var spaceRe = /\s+/;
    var nonSpaceRe = /\S/;
    var eqRe = /\s*=/;
    var curlyRe = /\s*\}/;
    var tagRe = /#|\^|\/|>|\{|&|=|!/;
    // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
    // See https://github.com/janl/mustache.js/issues/189
    var RegExp_test = RegExp.prototype.test;
    function testRegExp(re, string){

      return RegExp_test.call(re, string);
    };
    function isWhitespace(string){

      return !testRegExp(nonSpaceRe, string);
    };
    var Object_toString = Object.prototype.toString;
    var isArray = Array.isArray || function(object){

      return Object_toString.call(object) === '[object Array]';
    };
    function isFunction(object){

      return typeof object === 'function';
    };
    function escapeRegExp(string){

      return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
    };
    var entityMap = {
      "&" : "&amp;",
      "<" : "&lt;",
      ">" : "&gt;",
      '"' : '&quot;',
      "'" : '&#39;',
      "/" : '&#x2F;'
    };
    function escapeHtml(string){

      return String(string).replace(/[&<>"'\/]/g, function(s){

        return entityMap[s];
      });
    };
    function Scanner(string){

      this.string = string;
      this.tail = string;
      this.pos = 0;
    };
    /**
     * Returns `true` if the tail is empty (end of string).
     */
    Scanner.prototype.eos = function(){

      return this.tail === "";
    };
    /**
     * Tries to match the given regular expression at the current position.
     * Returns the matched text if it can match, the empty string otherwise.
     */
    Scanner.prototype.scan = function(re){

      var match = this.tail.match(re);
      if(match && match.index === 0){

        var string = match[0];
        this.tail = this.tail.substring(string.length);
        this.pos += string.length;
        return string;
      };
      return "";
    };
    /**
     * Skips all text until the given regular expression can be matched. Returns
     * the skipped string, which is the entire tail if no match can be made.
     */
    Scanner.prototype.scanUntil = function(re){

      var index = this.tail.search(re),match;
      switch(index){case -1:
      match = this.tail;
      this.tail = "";
      break;case 0:
      match = "";
      break;default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);};
      this.pos += match.length;
      return match;
    };
    function Context(view, parent){

      this.view = view == null ? {
      } : view;
      this.parent = parent;
      this._cache = {
        '.' : this.view
      };
    };
    Context.make = function(view){

      return (view instanceof Context) ? view : new Context(view);
    };
    Context.prototype.push = function(view){

      return new Context(view, this);
    };
    Context.prototype.lookup = function(name){

      var value;
      if(name in this._cache){

        value = this._cache[name];
      } else {

        var context = this;
        while(context){

          if(name.indexOf('.') > 0){

            value = context.view;
            var names = name.split('.'),i = 0;
            while(value != null && i < names.length){

              value = value[names[i++]];
            };
          } else {

            value = context.view[name];
          };
          if(value != null)break;
          context = context.parent;
        };
        this._cache[name] = value;
      };
      if(isFunction(value)){

        value = value.call(this.view);
      };
      return value;
    };
    function Writer(){

      this.clearCache();
    };
    Writer.prototype.clearCache = function(){

      this._cache = {
      };
      this._partialCache = {
      };
    };
    Writer.prototype.compile = function(template, tags){

      var fn = this._cache[template];
      if(!fn){

        var tokens = mustache.parse(template, tags);
        fn = this._cache[template] = this.compileTokens(tokens, template);
      };
      return fn;
    };
    Writer.prototype.compilePartial = function(name, template, tags){

      var fn = this.compile(template, tags);
      this._partialCache[name] = fn;
      return fn;
    };
    Writer.prototype.getPartial = function(name){

      if(!(name in this._partialCache) && this._loadPartial){

        this.compilePartial(name, this._loadPartial(name));
      };
      return this._partialCache[name];
    };
    Writer.prototype.compileTokens = function(tokens, template){

      var self = this;
      return function(view, partials){

        if(partials){

          if(isFunction(partials)){

            self._loadPartial = partials;
          } else {

            for(var name in partials){

              self.compilePartial(name, partials[name]);
            };
          };
        };
        return renderTokens(tokens, self, Context.make(view), template);
      };
    };
    Writer.prototype.render = function(template, view, partials){

      return this.compile(template)(view, partials);
    };
    /**
     * Low-level function that renders the given `tokens` using the given `writer`
     * and `context`. The `template` string is only needed for templates that use
     * higher-order sections to extract the portion of the original template that
     * was contained in that section.
     */
    function renderTokens(tokens, writer, context, template){

      var buffer = '';
      // This function is used to render an artbitrary template
      // in the current context by higher-order functions.
      function subRender(template){

        return writer.render(template, context);
      };
      var token,tokenValue,value;
      for(var i = 0,len = tokens.length;i < len;++i){

        token = tokens[i];
        tokenValue = token[1];
        switch(token[0]){case '#':
        value = context.lookup(tokenValue);
        if(typeof value === 'object' || typeof value === 'string'){

          if(isArray(value)){

            for(var j = 0,jlen = value.length;j < jlen;++j){

              buffer += renderTokens(token[4], writer, context.push(value[j]), template);
            };
          } else if(value){

            buffer += renderTokens(token[4], writer, context.push(value), template);
          };
        } else if(isFunction(value)){

          var text = template == null ? null : template.slice(token[3], token[5]);
          value = value.call(context.view, text, subRender);
          if(value != null)buffer += value;
        } else if(value){

          buffer += renderTokens(token[4], writer, context, template);
        };;
        break;case '^':
        value = context.lookup(tokenValue);
        // Use JavaScript's definition of falsy. Include empty arrays.
        // See https://github.com/janl/mustache.js/issues/186
        if(!value || (isArray(value) && value.length === 0)){

          buffer += renderTokens(token[4], writer, context, template);
        };
        break;case '>':
        value = writer.getPartial(tokenValue);
        if(isFunction(value))buffer += value(context);
        break;case '&':
        value = context.lookup(tokenValue);
        if(value != null)buffer += value;
        break;case 'name':
        value = context.lookup(tokenValue);
        if(value != null)buffer += mustache.escape(value);
        break;case 'text':
        buffer += tokenValue;
        break;};
      };
      return buffer;
    };
    /**
     * Forms the given array of `tokens` into a nested tree structure where
     * tokens that represent a section have two additional items: 1) an array of
     * all tokens that appear in that section and 2) the index in the original
     * template that represents the end of that section.
     */
    function nestTokens(tokens){

      var tree = [];
      var collector = tree;
      var sections = [];
      var token;
      for(var i = 0,len = tokens.length;i < len;++i){

        token = tokens[i];
        switch(token[0]){case '#':case '^':
        sections.push(token);
        collector.push(token);
        collector = token[4] = [];
        break;case '/':
        var section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : tree;
        break;default:
        collector.push(token);};
      };
      return tree;
    };
    /**
     * Combines the values of consecutive text tokens in the given `tokens` array
     * to a single token.
     */
    function squashTokens(tokens){

      var squashedTokens = [];
      var token,lastToken;
      for(var i = 0,len = tokens.length;i < len;++i){

        token = tokens[i];
        if(token){

          if(token[0] === 'text' && lastToken && lastToken[0] === 'text'){

            lastToken[1] += token[1];
            lastToken[3] = token[3];
          } else {

            lastToken = token;
            squashedTokens.push(token);
          };
        };
      };
      return squashedTokens;
    };
    function escapeTags(tags){

      return [new RegExp(escapeRegExp(tags[0]) + "\\s*"), new RegExp("\\s*" + escapeRegExp(tags[1]))];
    };
    /**
     * Breaks up the given `template` string into a tree of token objects. If
     * `tags` is given here it must be an array with two string values: the
     * opening and closing tags used in the template (e.g. ["<%", "%>"]). Of
     * course, the default is to use mustaches (i.e. Mustache.tags).
     */
    function parseTemplate(template, tags){

      template = template || '';
      tags = tags || mustache.tags;
      if(typeof tags === 'string')tags = tags.split(spaceRe);
      if(tags.length !== 2)throw new Error('Invalid tags: ' + tags.join(', '));
      var tagRes = escapeTags(tags);
      var scanner = new Scanner(template);
      var sections = [];
      // Stack to hold section tokens
      var tokens = [];
      // Buffer to hold the tokens
      var spaces = [];
      // Indices of whitespace tokens on the current line
      var hasTag = false;
      // Is there a {{tag}} on the current line?
      var nonSpace = false;
      // Is there a non-space char on the current line?
      // Strips all whitespace tokens array for the current line
      // if there was a {{#tag}} on it and otherwise only space.
      function stripSpace(){

        if(hasTag && !nonSpace){

          while(spaces.length){

            delete tokens[spaces.pop()];
          };
        } else {

          spaces = [];
        };
        hasTag = false;
        nonSpace = false;
      };
      var start,type,value,chr,token,openSection;
      while(!scanner.eos()){

        start = scanner.pos;
        // Match any text between tags.
        value = scanner.scanUntil(tagRes[0]);
        if(value){

          for(var i = 0,len = value.length;i < len;++i){

            chr = value.charAt(i);
            if(isWhitespace(chr)){

              spaces.push(tokens.length);
            } else {

              nonSpace = true;
            };
            tokens.push(['text', chr, start, start + 1]);
            start += 1;
            // Check for whitespace on the current line.
            if(chr == '\n')stripSpace();
          };
        };
        // Match the opening tag.
        if(!scanner.scan(tagRes[0]))break;
        hasTag = true;
        // Get the tag type.
        type = scanner.scan(tagRe) || 'name';
        scanner.scan(whiteRe);
        // Get the tag value.
        if(type === '='){

          value = scanner.scanUntil(eqRe);
          scanner.scan(eqRe);
          scanner.scanUntil(tagRes[1]);
        } else if(type === '{'){

          value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
          scanner.scan(curlyRe);
          scanner.scanUntil(tagRes[1]);
          type = '&';
        } else {

          value = scanner.scanUntil(tagRes[1]);
        };
        // Match the closing tag.
        if(!scanner.scan(tagRes[1]))throw new Error('Unclosed tag at ' + scanner.pos);
        token = [type, value, start, scanner.pos];
        tokens.push(token);
        if(type === '#' || type === '^'){

          sections.push(token);
        } else if(type === '/'){

          // Check section nesting.
          openSection = sections.pop();
          if(!openSection){

            throw new Error('Unopened section "' + value + '" at ' + start);
          };
          if(openSection[1] !== value){

            throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
          };
        } else if(type === 'name' || type === '{' || type === '&'){

          nonSpace = true;
        } else if(type === '='){

          // Set the tags for the next time around.
          tags = value.split(spaceRe);
          if(tags.length !== 2){

            throw new Error('Invalid tags at ' + start + ': ' + tags.join(', '));
          };
          tagRes = escapeTags(tags);
        };;;
      };
      // Make sure there are no open sections when we're done.
      openSection = sections.pop();
      if(openSection){

        throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
      };
      return nestTokens(squashTokens(tokens));
    };
    mustache.name = "mustache.js";
    mustache.version = "0.7.3";
    mustache.tags = ["{{", "}}"];
    mustache.Scanner = Scanner;
    mustache.Context = Context;
    mustache.Writer = Writer;
    mustache.parse = parseTemplate;
    // Export the escaping function so that the user may override it.
    // See https://github.com/janl/mustache.js/issues/244
    mustache.escape = escapeHtml;
    // All Mustache.* functions use this writer.
    var defaultWriter = new Writer();
    /**
     * Clears all cached templates and partials in the default writer.
     */
    mustache.clearCache = function(){

      return defaultWriter.clearCache();
    };
    /**
     * Compiles the given `template` to a reusable function using the default
     * writer.
     */
    mustache.compile = function(template, tags){

      return defaultWriter.compile(template, tags);
    };
    /**
     * Compiles the partial with the given `name` and `template` to a reusable
     * function using the default writer.
     */
    mustache.compilePartial = function(name, template, tags){

      return defaultWriter.compilePartial(name, template, tags);
    };
    /**
     * Compiles the given array of tokens (the output of a parse) to a reusable
     * function using the default writer.
     */
    mustache.compileTokens = function(tokens, template){

      return defaultWriter.compileTokens(tokens, template);
    };
    /**
     * Renders the `template` with the given `view` and `partials` using the
     * default writer.
     */
    mustache.render = function(template, view, partials){

      return defaultWriter.render(template, view, partials);
    };
    // This is here for backwards compatibility with 0.4.x.
    mustache.to_html = function(template, view, partials, send){

      var result = mustache.render(template, view, partials);
      if(isFunction(send)){

        send(result);
      } else {

        return result;
      };
    };
  }));
  /**
   * Above is the original mustache code.
   */
  // EXPOSE qooxdoo variant
  qx.bom.Template.version = this.Mustache.version;
  qx.bom.Template.render = this.Mustache.render;
}).call({
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
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * A row of buttons used to switch between connected pages. The buttons can be
 * right- or left-aligned, or they can be justified, i.e. they will be stretched
 * to fill the available width.
 *
 * <h2>Markup</h2>
 * Each Tabs widget contains an unordered list element (<code>ul</code>), which
 * will be created if not already present.
 * The tabs are list items (<code>li</code>). Each tab can contain
 * a button with a <code>tabsPage</code> data attribute where the value is a
 * CSS selector string identifying the corresponding page. Headers and pages
 * will not be created automatically. They can be predefined in the DOM before
 * the <code>q().tabs()</code> factory method is called, or added programmatically.
 *
 * <h2>CSS Classes</h2>
 * <table>
 *   <thead>
 *     <tr>
 *       <td>Class Name</td>
 *       <td>Applied to</td>
 *       <td>Description</td>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td><code>qx-tabs</code></td>
 *       <td>Container element</td>
 *       <td>Identifies the Tabs widget</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-tabs-justify</code></td>
 *       <td>Container element</td>
 *       <td>Styles the tab buttons when they are stretched to fill out the available width</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-tabs-right</code></td>
 *       <td>Container element</td>
 *       <td>Styles the tab buttons when they are right-aligned</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-tabs-button</code></td>
 *       <td>Tab (<code>li</code>)</td>
 *       <td>Identifies and styles the tabs</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-tabs-button-active</code></td>
 *       <td>Tab (<code>li</code>)</td>
 *       <td>Identifies and styles the currently selected tab. Applied in addition to <code>qx-tabs-button</code></td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 * <h2 class="widget-markup">Generated DOM Structure</h2>
 *
 * @require(qx.module.Template)
 * @require(qx.module.Animation)
 *
 * @group (Widget)
 */
qx.Bootstrap.define("qx.ui.website.Tabs", {
  extend : qx.ui.website.Widget,
  statics : {
    /**
     * Factory method which converts the current collection into a collection of
     * tabs widgets.
     *
     * @attach{qxWeb}
     * @param align {String?} Tab button alignment. Default: <code>left</code>
     * @param preselected {Integer?} The (zero-based) index of the tab that
     * should initially be selected. Default: <code>0</code>
     * @return {qx.ui.website.Tabs}
     */
    tabs : function(align, preselected){

      var tabs = new qx.ui.website.Tabs(this);
      if(typeof preselected == "number"){

        tabs.setConfig("preselected", preselected);
      };
      tabs.init();
      if(align){

        tabs.setConfig("align", align);
        tabs.render();
      };
      return tabs;
    },
    /**
     * *button*
     *
     * Template used by {@link #addButton} to create a new button.
     *
     * Default value: <pre><li><button>{{{content}}}</button></li></pre>
     */
    _templates : {
      button : "<li><button>{{{content}}}</button></li>"
    },
    /**
     * *preselected*
     * The index of the page that should be opened after initial
     * rendering, or <code>nullcode> if no page should be opened.
     *
     * Default value: <pre>0</pre>
     *
     * *align*
     *
     * Configuration for the alignment of the tab buttons. This possible
     * values are <code>left</code>, <code>justify</code> and
     * <code>right</code>
     *
     * Default value: <pre>left</pre>
     *
     *
     * *animationTiming*
     *
     * Controls the page switching animation sequence:
     * "sequential" means the animation to show the new page will
     * only start after the animation to hide the old page is
     * finished. "parallel" means the animations will be started
     * (almost) simultaneously.
     *
     * Default value: <pre>parallel</pre>
     *
     *
     * *hideAnimation*
     *
     * The animation used to hide the previous page when
     * a new one is selected
     *
     * Default value: <pre>null</pre>
     *
     *
     * *showAnimation*
     *
     * The animation used to show a newly selected page.
     *
     * Default value: <pre>null</pre>
     */
    _config : {
      preselected : 0,
      align : "left",
      animationTiming : "sequential",
      showAnimation : null,
      hideAnimation : null
    }
  },
  construct : function(selector, context){

    this.base(arguments, selector, context);
  },
  events : {
    /**
     * Fired when the selected page has changed. The value is
     * the newly selected page's index
     */
    "changeSelected" : "Number"
  },
  members : {
    init : function(){

      if(!this.base(arguments)){

        return false;
      };
      this._forEachElementWrapped(function(tabs){

        var cssPrefix = this.getCssPrefix();
        if(tabs.getChildren("ul").length === 0){

          var list = qxWeb.create("<ul/>");
          var content = tabs.getChildren();
          if(content.length > 0){

            list.insertBefore(content.eq(0));
          } else {

            tabs.append(list);
          };
        };
        tabs.find("> ul").removeClasses([cssPrefix + "-justify", cssPrefix + "-right"]);
        var align = tabs.getConfig("align");
        if(align == "justify"){

          tabs.find("> ul").addClass(cssPrefix + "-justify");
        } else if(align == "right"){

          tabs.find("> ul").addClass(cssPrefix + "-right");
        };
        var buttons = tabs.getChildren("ul").getFirst().getChildren("li").not("." + cssPrefix + "-page");
        buttons._forEachElementWrapped(function(button){

          var pageSelector = button.getData(cssPrefix + "-page");
          if(!pageSelector){

            return;
          };
          button.addClass(cssPrefix + "-button").onWidget("click", this._onClick, tabs);
          var page = tabs._getPage(button);
          if(page.length > 0){

            page.hide().addClass(cssPrefix + "-page");
          };
        }.bind(this));
        // ignore pageless buttons
        buttons = buttons.filter("." + cssPrefix + "-button");
        if(align == "right"){

          buttons.remove();
          for(var i = buttons.length - 1;i >= 0;i--){

            tabs.find("> ul").append(buttons[i]);
          };
        };
        var active = buttons.filter("." + cssPrefix + "-button-active");
        var preselected = this.getConfig("preselected");
        if(active.length === 0 && typeof preselected == "number"){

          buttons.eq(preselected).addClass(cssPrefix + "-button-active");
        };
        this._getPage(buttons.filter("." + cssPrefix + "-button-active")).show();
        tabs.getChildren("ul").getFirst().onWidget("keydown", this._onKeyDown, this);
      }.bind(this));
      return true;
    },
    render : function(){

      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(tabs){

        var content = [];
        var pages = [];
        var selected;
        tabs.find("> ul > ." + cssPrefix + "-button")._forEachElementWrapped(function(li){

          li.offWidget("click", tabs._onClick, tabs);
          pages.push(li.getData(cssPrefix + "-page"));
          content.push(li.find("> button").getHtml());
          if(li.hasClass(cssPrefix + "-button-active")){

            selected = content.length - 1;
          };
        });
        tabs.find("> ul").setHtml("");
        var toRight = this.getConfig("align") == "right" && !tabs.find("> ul").hasClass(cssPrefix + "-right");
        var fromRight = this.getConfig("align") != "right" && tabs.find("> ul").hasClass(cssPrefix + "-right");
        if(toRight || fromRight){

          content.reverse();
          pages.reverse();
          selected = content.length - 1 - selected;
        };
        tabs.find("> ul").removeClasses([cssPrefix + "-justify", cssPrefix + "-right"]);
        content.forEach(function(content, i){

          tabs.addButton(content, pages[i]);
          var page = tabs._getPage(tabs.find("> ul > ." + cssPrefix + "-button:last-child"));
          if(i == selected){

            tabs.find("> ul > ." + cssPrefix + "-button:first-child").removeClass(cssPrefix + "-button-active");
            tabs.find("> ul > ." + cssPrefix + "-button:last-child").addClass(cssPrefix + "-button-active");
            page.show();
          } else {

            page.hide();
          };
        });
        var align = tabs.getConfig("align");
        if(align == "justify"){

          tabs.find("> ul").addClass(cssPrefix + "-justify");
        } else if(align == "right"){

          tabs.find("> ul").addClass(cssPrefix + "-right");
        };
      });
      return this;
    },
    /**
     * Adds a new tab button
     *
     * @param label {String} The button's content. Can include markup.
     * @param pageSelector {String} CSS Selector that identifies the associated page
     * @return {qx.ui.website.Tabs} The collection for chaining
     */
    addButton : function(label, pageSelector){

      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(item){

        var link = qxWeb.create(qxWeb.template.render(item.getTemplate("button"), {
          content : label
        })).addClass(cssPrefix + "-button");
        var list = item.find("> ul");
        var links = list.getChildren("li");
        if(list.hasClass(cssPrefix + "-right") && links.length > 0){

          link.insertBefore(links.getFirst());
        } else {

          link.appendTo(list);
        };
        link.onWidget("click", this._onClick, item).addClass(cssPrefix + "-button");
        if(item.find("> ul ." + cssPrefix + "-button").length === 1){

          link.addClass(cssPrefix + "-button-active");
        };
        if(pageSelector){

          link.setData(cssPrefix + "-page", pageSelector);
          var page = this._getPage(link);
          page.addClass(cssPrefix + "-page");
          if(!link.hasClass(cssPrefix + "-button-active")){

            page.hide();
          };
        };
      }, this);
      return this;
    },
    /**
     * Selects a tab button
     *
     * @param index {Integer} index of the button to select
     * @return {qx.ui.website.Tabs} The collection for chaining
     */
    select : function(index){

      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(tabs){

        var buttons = tabs.find("> ul > ." + cssPrefix + "-button");
        var oldButton = tabs.find("> ul > ." + cssPrefix + "-button-active").removeClass(cssPrefix + "-button-active");
        if(this.getConfig("align") == "right"){

          index = buttons.length - 1 - index;
        };
        var newButton = buttons.eq(index).addClass(cssPrefix + "-button-active");
        tabs._showPage(newButton, oldButton);
        tabs.emit("changeSelected", index);
      });
      return this;
    },
    /**
     * Initiates the page switch when a button was clicked
     *
     * @param e {Event} Click event
     */
    _onClick : function(e){

      var clickedButton = e.getCurrentTarget();
      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(tabs){

        var oldButton = tabs.find("> ul > ." + cssPrefix + "-button-active");
        if(oldButton[0] == clickedButton){

          return;
        };
        oldButton.removeClass(cssPrefix + "-button-active");
        var newButton;
        var buttons = tabs.find("> ul > ." + cssPrefix + "-button")._forEachElementWrapped(function(button){

          if(clickedButton === button[0]){

            newButton = button;
          };
        });
        tabs._showPage(newButton, oldButton);
        newButton.addClass(cssPrefix + "-button-active");
        var index = buttons.indexOf(newButton[0]);
        if(this.getConfig("align") == "right"){

          index = buttons.length - 1 - index;
        };
        tabs.emit("changeSelected", index);
      });
    },
    /**
     * Allows tab selection using the left and right arrow keys
     *
     * @param e {Event} keydown event
     */
    _onKeyDown : function(e){

      var cssPrefix = this.getCssPrefix();
      var key = e.getKeyIdentifier();
      if(!(key == "Left" || key == "Right")){

        return;
      };
      var rightAligned = this.getConfig("align") == "right";
      var buttons = this.find("> ul > ." + cssPrefix + "-button");
      if(rightAligned){

        buttons.reverse();
      };
      var active = this.find("> ul > ." + cssPrefix + "-button-active");
      var next;
      if(key == "Right"){

        if(!rightAligned){

          next = active.getNext("." + cssPrefix + "-button");
        } else {

          next = active.getPrev("." + cssPrefix + "-button");
        };
      } else {

        if(!rightAligned){

          next = active.getPrev("." + cssPrefix + "-button");
        } else {

          next = active.getNext("." + cssPrefix + "-button");
        };
      };
      if(next.length > 0){

        var idx = buttons.indexOf(next);
        this.select(idx);
        next.getChildren("button").focus();
      };
    },
    /**
     * Initiates the page switch if a tab button is selected
     *
     * @param newButton {qxWeb} clicked button
     * @param oldButton {qxWeb} previously active button
     */
    _showPage : function(newButton, oldButton){

      var oldPage = this._getPage(oldButton);
      var newPage = this._getPage(newButton);
      if(oldPage[0] == newPage[0]){

        return;
      };
      var showAnimation = this.getConfig("showAnimation");
      var hideAnimation = this.getConfig("hideAnimation");
      this._switchPages(oldPage, newPage, hideAnimation, showAnimation);
    },
    /**
     * Executes a page switch
     *
     * @param oldPage {qxWeb} the previously selected page
     * @param newPage {qxWeb} the newly selected page
     * @param hideAnimation {Map} animation description used to hide the old page
     * @param showAnimation {Map} animation description used to show the new page
     */
    _switchPages : function(oldPage, newPage, hideAnimation, showAnimation){

      var timing = this.getConfig("animationTiming");
      var oldOverflow = oldPage.getStyle("overflow");
      this._toggleClickListeners(false);
      if(hideAnimation){

        if(oldOverflow == "visible"){

          oldPage.setStyle("overflow", "hidden");
        };
        oldPage.once("animationEnd", function(){

          oldPage.hide();
          if(oldOverflow == "visible"){

            oldPage.setStyle("overflow", oldOverflow);
          };
          if(timing == "sequential"){

            this._showNewPage(newPage, showAnimation);
          };
        }, this);
        if(timing == "parallel"){

          this._showNewPage(newPage, showAnimation);
        };
        oldPage.animate(hideAnimation);
      } else {

        oldPage.hide();
        this._showNewPage(newPage, showAnimation);
      };
    },
    /**
     * Shows a newly selected tab page
     *
     * @param newPage {qxWeb} the newly selected page
     * @param showAnimation {Map} animation description used to show the new pag
     */
    _showNewPage : function(newPage, showAnimation){

      if(newPage.length == 0){

        this._toggleClickListeners(true);
        return;
      };
      if(!showAnimation){

        this._toggleClickListeners(true);
        newPage.show();
        return;
      };
      showAnimation = JSON.parse(qxWeb.template.render(JSON.stringify(showAnimation), newPage.getProperty("initialStyles")));
      // apply the first frame of the animation before showing the
      // page to prevent an ugly visible "jump"
      if(showAnimation.keyFrames && showAnimation.keyFrames["0"]){

        newPage.setStyles(showAnimation.keyFrames["0"]);
      };
      newPage.show();
      // set overflow to hidden so that the content won't show
      // outside of the page as it grows
      var newOverflow = newPage.getStyle("overflow");
      if(newOverflow == "visible"){

        newPage.setStyle("overflow", "hidden");
      };
      newPage.once("animationEnd", function(){

        if(newOverflow == "visible"){

          newPage.setStyle("overflow", newOverflow);
        };
        this._toggleClickListeners(true);
      }.bind(this));
      if(newPage.isPlaying()){

        // workaround for bug #7982
        newPage.stop().emit("animationEnd");
      };
      newPage.animate(showAnimation);
    },
    /**
     * Enable/disable the click listeners on the page buttons. This is used
     * to prevent interaction while page change animations are running.
     * @param on {Boolean} <code>true</code> enables listeners
     */
    _toggleClickListeners : function(on){

      var func = on ? "onWidget" : "offWidget";
      this.find("." + this.getCssPrefix() + "-button")._forEachElementWrapped(function(button){

        button[func]("click", this._onClick);
      }.bind(this));
    },
    /**
     * Returns the tab page associated with the given button
     *
     * @param button {qxWeb} Tab button
     * @return {qxWeb} Tab page
     */
    _getPage : function(button){

      var pageSelector;
      if(button){

        pageSelector = button.getData(this.getCssPrefix() + "-page");
      };
      return qxWeb(pageSelector);
    },
    dispose : function(){

      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(tabs){

        tabs.find("." + cssPrefix + "-button").offWidget("click", tabs._onClick, tabs);
        tabs.getChildren("ul").getFirst().offWidget("keydown", tabs._onKeyDown, tabs).setHtml("");
      });
      this.setHtml("").removeClass(cssPrefix);
      return this.base(arguments);
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      tabs : statics.tabs
    });
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
     * Alexander Steitz (aback)

************************************************************************ */
/**
 * Helper functions to handle an Object as a Hash map.
 *
 * @group (Utilities)
 */
qx.Bootstrap.define("qx.module.util.Object", {
  statics : {
    /**
     * Return a copy of an Object
     *
     * @signature function(source, deep)
     * @attachStatic {qxWeb, object.clone}
     *
     * @param source {Object} Object to copy
     * @param deep {Boolean} If the clone should be a deep clone.
     * @return {Object} A copy of the object
     */
    clone : qx.lang.Object.clone,
    /**
     * Get the values of a map as array
     *
     * @signature function(map)
     * @attachStatic {qxWeb, object.getValues}
     *
     * @param map {Object} the map
     * @return {Array} array of the values of the map
     */
    getValues : qx.lang.Object.getValues,
    /**
     * Inverts a map by exchanging the keys with the values.
     *
     * @signature function(map)
     * @attachStatic {qxWeb, object.invert}
     *
     * If the map has the same values for different keys, information will get lost.
     * The values will be converted to strings using the toString methods.
     *
     * @param map {Object} Map to invert
     * @return {Object} inverted Map
     */
    invert : qx.lang.Object.invert,
    /**
     * Whether the map contains the given value.
     *
     * @signature function(map, value)
     * @attachStatic {qxWeb, object.contains}
     *
     * @param map {Object} Map to search for the value
     * @param value {var} Value to look for
     * @return {Boolean} Whether the value was found in the map.
     */
    contains : qx.lang.Object.contains
  },
  defer : function(statics){

    qxWeb.$attachStatic({
      "object" : {
        "clone" : statics.clone,
        "getValues" : statics.getValues,
        "invert" : statics.invert,
        "contains" : statics.contains
      }
    });
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
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * The Accordion is a group of vertically stacked panels (here called pages),
 * each with a header.
 * By default, only one page is visible while the others are collapsed.
 * Clicking a collapsed page's header will expand it while collapsing the
 * previously expanded page. The expand and collapse operations can be
 * visually customized using CSS animations.
 *
 * <h2>Markup</h2>
 * The Accordion contains an unordered list element (<code>ul</code>), which
 * will be created if not already present.
 * Headers and pages are list items (<code>li</code>). Each header must contain
 * a button with an <code>accordionPage</code> data attribute where the value is a
 * CSS selector string identifying the corresponding page. Headers and pages
 * will not be created automatically. They can be predefined in the DOM before
 * the <code>q().accordion()</code> factory method is called, or added programmatically.
 *
 * <h2>CSS Classes</h2>
 * <table>
 *   <thead>
 *     <tr>
 *       <td>Class Name</td>
 *       <td>Applied to</td>
 *       <td>Description</td>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td><code>qx-accordion</code></td>
 *       <td>Container element</td>
 *       <td>Identifies the Accordion widget</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-accordion-button</code></td>
 *       <td>Page header (<code>li</code>)</td>
 *       <td>Identifies and styles the page headers</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-accordion-button-active</code></td>
 *       <td>Page header (<code>li</code>)</td>
 *       <td>Identifies and styles the header of the currently expanded page. Applied in addition to <code>qx-accordion-button</code></td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-accordion-page</code></td>
 *       <td>Page (<code>li</code>)</td>
 *       <td>Identifies and styles the pages</td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 * <h2 class="widget-markup">Generated DOM Structure</h2>
 *
 * @require(qx.module.util.Object)
 *
 * @group (Widget)
 */
qx.Bootstrap.define("qx.ui.website.Accordion", {
  extend : qx.ui.website.Tabs,
  statics : {
    /**
     * *button*
     *
     * Template for the list items containing the panel buttons.
     *
     * Default value:
     * <pre><li><button>{{{content}}}</button></li></pre>
     */
    _templates : {
      button : "<li><button>{{{content}}}</button></li>"
    },
    /**
     * *preselected*
     * The index of the page that should be opened after initial
     * rendering, or <code>null</code> if no page should be opened.
     *
     * Default value: <pre>null</pre>
     *
     * *animationTiming*
     *
     * Controls the page switching animation sequence:
     * "sequential" means the animation to show the new page will
     * only start after the animation to hide the old page is
     * finished. "parallel" means the animations will be started
     * (almost) simultaneously.
     *
     * Default value: <pre>parallel</pre>
     *
     *
     * *animationStyles*
     *
     * Style properties used to animate page switching. Allowed values:
     * "parallel", "sequential"
     *
     * Default value:
     * <pre>["height", "paddingTop", "paddingBottom"]</pre>
     *
     *
     * *hideAnimation*
     *
     * The animation used to hide the previous page when
     * a new one is selected
     *
     * Default value:
     * <pre>{
     *   duration: 500,
     *   delay: 0,
     *   keep: 100,
     *   timing: "linear",
     *   keyFrames: {
     *     0: {
     *       height : "{{height}}",
     *       paddingTop : "{{paddingTop}}",
     *       paddingBottom : "{{paddingBottom}}"
     *     },
     *     100: {
     *       height : "0px",
     *       paddingTop: "0px",
     *       paddingBottom: "0px"
     *     }
     *   }
     * }</pre>
     *
     *
     * *showAnimation*
     *
     * The animation used to show a newly selected page.
     *
     * Default value:
     * <pre>{
     *   duration: 500,
     *   delay: 0,
     *   keep: 100,
     *   timing: "linear",
     *   keyFrames: {
     *     0: {
     *       height : "0px",
     *       paddingTop: "0px",
     *       paddingBottom: "0px"
     *     },
     *     100 : {
     *       height :  "{{height}}",
     *       paddingTop : "{{paddingTop}}",
     *       paddingBottom : "{{paddingBottom}}"
     *     }
     *   }
     * }</pre>
     */
    _config : {
      preselected : null,
      animationTiming : "parallel",
      animationStyles : ["height", "paddingTop", "paddingBottom"],
      hideAnimation : {
        duration : 500,
        delay : 0,
        keep : 100,
        timing : "linear",
        keyFrames : {
          '0' : {
            height : "{{height}}",
            paddingTop : "{{paddingTop}}",
            paddingBottom : "{{paddingBottom}}"
          },
          '100' : {
            height : "0px",
            paddingTop : "0px",
            paddingBottom : "0px"
          }
        }
      },
      showAnimation : {
        duration : 500,
        delay : 0,
        keep : 100,
        timing : "linear",
        keyFrames : {
          '0' : {
            height : "0px",
            paddingTop : "0px",
            paddingBottom : "0px"
          },
          '100' : {
            height : "{{height}}",
            paddingTop : "{{paddingTop}}",
            paddingBottom : "{{paddingBottom}}"
          }
        }
      }
    },
    /**
     * Factory method which converts the current collection into a collection of
     * accordion widgets.
     *
     * @param preselected {Integer?} The (zero-based) index of the panel that
     * should initially be opened
     * @return {qx.ui.website.Accordion} A new Accordion collection.
     * @attach {qxWeb}
     */
    accordion : function(preselected){

      var accordion = new qx.ui.website.Accordion(this);
      if(preselected){

        accordion.setConfig("preselected", preselected);
      };
      accordion.init();
      return accordion;
    }
  },
  construct : function(selector, context){

    this.base(arguments, selector, context);
  },
  members : {
    init : function(){

      if(!this.base(arguments)){

        return false;
      };
      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(accordion){

        accordion.find("> ul > ." + cssPrefix + "-button")._forEachElementWrapped(function(button){

          var page = accordion._getPage(button);
          accordion._storeInitialStyles(page);
        }.bind(accordion));
        accordion.render();
      });
    },
    render : function(){

      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(accordion){

        accordion.find("> ul > ." + cssPrefix + "-button")._forEachElementWrapped(function(button){

          var page = this._getPage(button);
          if(page.length === 0){

            return;
          };
          this._storeInitialStyles(page);
          if(button.hasClass(cssPrefix + "-button-active")){

            page.show();
          } else {

            page.hide();
          };
        }.bind(this));
      }.bind(this));
      return this;
    },
    /**
     * Stores the page's styles for the switching animations
     * @param page {qxWeb} Accordion page
     */
    _storeInitialStyles : function(page){

      var isHidden = page.getStyle("display") === "none";
      var accordion = page.getAncestors("." + this.getCssPrefix());
      var accHeight;
      if(!accordion[0].style.height){

        accHeight = accordion.getHeight();
      };
      if(isHidden){

        if(accHeight){

          accordion.setStyle("height", accHeight + "px");
        };
        page.show();
      };
      var styles = page.getStyles(this.getConfig("animationStyles"));
      if(styles.height){

        page[0].style.height = "";
        styles.height = page.getHeight() + "px";
      };
      page.setProperty("initialStyles", styles);
      if(isHidden){

        if(accHeight){

          accordion.setStyle("height", "");
        };
      };
    },
    // overridden
    _showPage : function(newButton, oldButton){

      var oldPage = this._getPage(oldButton);
      var newPage = this._getPage(newButton);
      if(newPage.length > 0){

        var showAnimation = this.getConfig("showAnimation");
        if(showAnimation){

          showAnimation = JSON.parse(qxWeb.template.render(JSON.stringify(showAnimation), newPage.getProperty("initialStyles")));
        };
      };
      if(oldPage.length > 0){

        var hideAnimation = this.getConfig("hideAnimation");
        if(hideAnimation){

          hideAnimation = JSON.parse(qxWeb.template.render(JSON.stringify(hideAnimation), {
            height : oldPage.getHeight() + "px"
          }));
        };
      };
      this._switchPages(oldPage, newPage, hideAnimation, showAnimation);
    },
    /**
     * Allows content selection using the up and down arrow keys
     * @param e {Event} keydown event
     */
    _onKeyDown : function(e){

      var cssPrefix = this.getCssPrefix();
      var key = e.getKeyIdentifier();
      if(!(key == "Up" || key == "Down")){

        return;
      };
      var buttons = this.find("> ul > ." + cssPrefix + "-button");
      var active = this.find("> ul > ." + cssPrefix + "-button-active");
      var next;
      if(key == "Down"){

        next = active.getNextAll("." + cssPrefix + "-button").eq(0);
      } else {

        next = active.getPrevAll("." + cssPrefix + "-button").eq(0);
      };
      if(next.length > 0){

        var idx = buttons.indexOf(next);
        this.select(idx);
        next.getChildren("button").focus();
      };
    },
    // overridden
    _onClick : function(e){

      var clickedButton = e.getCurrentTarget();
      var cssPrefix = this.getCssPrefix();
      var sameButton = false;
      this._forEachElementWrapped(function(accordion){

        var oldButton = accordion.find("> ul > ." + cssPrefix + "-button-active");
        if(oldButton[0] == clickedButton){

          sameButton = true;
          oldButton.removeClass(cssPrefix + "-button-active");
          this._showPage(null, oldButton);
        };
      });
      if(!sameButton){

        this.base(arguments, e);
      };
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      accordion : statics.accordion
    });
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
     * Martin Wittemann (wittemann)

************************************************************************ */
/**
 * This class is responsible for applying CSS3 transforms to the collection.
 * The implementation is mostly a cross browser wrapper for applying the
 * transforms.
 * The API is keep to the spec as close as possible.
 *
 * http://www.w3.org/TR/css3-3d-transforms/
 */
qx.Bootstrap.define("qx.module.Transform", {
  statics : {
    /**
     * Method to apply multiple transforms at once to the given element. It
     * takes a map containing the transforms you want to apply plus the values
     * e.g.<code>{scale: 2, rotate: "5deg"}</code>.
     * The values can be either singular, which means a single value will
     * be added to the CSS. If you give an array, the values will be split up
     * and each array entry will be used for the X, Y or Z dimension in that
     * order e.g. <code>{scale: [2, 0.5]}</code> will result in a element
     * double the size in X direction and half the size in Y direction.
     * Make sure your browser supports all transformations you apply.
     *
     * @attach {qxWeb}
     * @param transforms {Map} The map containing the transforms and value.
     * @return {qxWeb} This reference for chaining.
     */
    transform : function(transforms){

      this._forEachElement(function(el){

        qx.bom.element.Transform.transform(el, transforms);
      });
      return this;
    },
    /**
     * Translates by the given value. For further details, take
     * a look at the {@link #transform} method.
     *
     * @attach {qxWeb}
     * @param value {String|Array} The value to translate e.g. <code>"10px"</code>.
     * @return {qxWeb} This reference for chaining.
     */
    translate : function(value){

      return this.transform({
        translate : value
      });
    },
    /**
     * Scales by the given value. For further details, take
     * a look at the {@link #transform} method.
     *
     * @attach {qxWeb}
     * @param value {Number|Array} The value to scale.
     * @return {qxWeb} This reference for chaining.
     */
    scale : function(value){

      return this.transform({
        scale : value
      });
    },
    /**
     * Rotates by the given value. For further details, take
     * a look at the {@link #transform} method.
     *
     * @attach {qxWeb}
     * @param value {String|Array} The value to rotate e.g. <code>"90deg"</code>.
     * @return {qxWeb} This reference for chaining.
     */
    rotate : function(value){

      return this.transform({
        rotate : value
      });
    },
    /**
     * Skews by the given value. For further details, take
     * a look at the {@link #transform} method.
     *
     * @attach {qxWeb}
     * @param value {String|Array} The value to skew e.g. <code>"90deg"</code>.
     * @return {qxWeb} This reference for chaining.
     */
    skew : function(value){

      return this.transform({
        skew : value
      });
    },
    /**
     * Sets the transform-origin property.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-origin-property
     *
     * @attach {qxWeb}
     * @param value {String} CSS position values like <code>50% 50%</code> or
     *   <code>left top</code>.
     * @return {qxWeb} This reference for chaining.
     */
    setTransformOrigin : function(value){

      this._forEachElement(function(el){

        qx.bom.element.Transform.setOrigin(el, value);
      });
      return this;
    },
    /**
     * Returns the transform-origin property of the first element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-origin-property
     *
     * @attach {qxWeb}
     * @return {String} The set property, e.g. <code>50% 50%</code> or null,
     *   of the collection is empty.
     */
    getTransformOrigin : function(){

      if(this[0] && this[0].nodeType === 1){

        return qx.bom.element.Transform.getOrigin(this[0]);
      };
      return "";
    },
    /**
     * Sets the transform-style property.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-style-property
     *
     * @attach {qxWeb}
     * @param value {String} Either <code>flat</code> or <code>preserve-3d</code>.
     * @return {qxWeb} This reference for chaining.
     */
    setTransformStyle : function(value){

      this._forEachElement(function(el){

        qx.bom.element.Transform.setStyle(el, value);
      });
      return this;
    },
    /**
     * Returns the transform-style property of the first element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#transform-style-property
     *
     * @attach {qxWeb}
     * @return {String} The set property, either <code>flat</code> or
     *   <code>preserve-3d</code>.
     */
    getTransformStyle : function(){

      if(this[0] && this[0].nodeType === 1){

        return qx.bom.element.Transform.getStyle(this[0]);
      };
      return "";
    },
    /**
     * Sets the perspective property.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-property
     *
     * @attach {qxWeb}
     * @param value {Number} The perspective layer. Numbers between 100
     *   and 5000 give the best results.
     * @return {qxWeb} This reference for chaining.
     */
    setTransformPerspective : function(value){

      this._forEachElement(function(el){

        qx.bom.element.Transform.setPerspective(el, value);
      });
      return this;
    },
    /**
     * Returns the perspective property of the first element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-property
     *
     * @attach {qxWeb}
     * @return {String} The set property, e.g. <code>500</code>
     */
    getTransformPerspective : function(){

      if(this[0] && this[0].nodeType === 1){

        return qx.bom.element.Transform.getPerspective(this[0]);
      };
      return "";
    },
    /**
     * Sets the perspective-origin property.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-origin-property
     *
     * @attach {qxWeb}
     * @param value {String} CSS position values like <code>50% 50%</code> or
     *   <code>left top</code>.
     * @return {qxWeb} This reference for chaining.
     */
    setTransformPerspectiveOrigin : function(value){

      this._forEachElement(function(el){

        qx.bom.element.Transform.setPerspectiveOrigin(el, value);
      });
      return this;
    },
    /**
     * Returns the perspective-origin property of the first element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#perspective-origin-property
     *
     * @attach {qxWeb}
     * @return {String} The set property, e.g. <code>50% 50%</code>
     */
    getTransformPerspectiveOrigin : function(){

      if(this[0] && this[0].nodeType === 1){

        return qx.bom.element.Transform.getPerspectiveOrigin(this[0]);
      };
      return "";
    },
    /**
     * Sets the backface-visibility property.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#backface-visibility-property
     *
     * @attach {qxWeb}
     * @param value {Boolean} <code>true</code> if the backface should be visible.
     * @return {qxWeb} This reference for chaining.
     */
    setTransformBackfaceVisibility : function(value){

      this._forEachElement(function(el){

        qx.bom.element.Transform.setBackfaceVisibility(el, value);
      });
      return this;
    },
    /**
     * Returns the backface-visibility property of the first element.
     *
     * Spec: http://www.w3.org/TR/css3-3d-transforms/#backface-visibility-property
     *
     * @attach {qxWeb}
     * @return {Boolean} <code>true</code>, if the backface is visible.
     */
    getTransformBackfaceVisibility : function(){

      if(this[0] && this[0].nodeType === 1){

        return qx.bom.element.Transform.getBackfaceVisibility(this[0]);
      };
      return "";
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      "transform" : statics.transform,
      "translate" : statics.translate,
      "rotate" : statics.rotate,
      "skew" : statics.skew,
      "scale" : statics.scale,
      "setTransformStyle" : statics.setTransformStyle,
      "getTransformStyle" : statics.getTransformStyle,
      "setTransformOrigin" : statics.setTransformOrigin,
      "getTransformOrigin" : statics.getTransformOrigin,
      "setTransformPerspective" : statics.setTransformPerspective,
      "getTransformPerspective" : statics.getTransformPerspective,
      "setTransformPerspectiveOrigin" : statics.setTransformPerspectiveOrigin,
      "getTransformPerspectiveOrigin" : statics.getTransformPerspectiveOrigin,
      "setTransformBackfaceVisibility" : statics.setTransformBackfaceVisibility,
      "getTransformBackfaceVisibility" : statics.getTransformBackfaceVisibility
    });
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * Normalization for native mouse events
 *
 * @require(qx.module.Environment)
 * @require(qx.module.Event)
 *
 * @group (Event_Normalization)
 */
qx.Bootstrap.define("qx.module.event.Mouse", {
  statics : {
    /**
     * List of event types to be normalized
     */
    TYPES : ["click", "dblclick", "mousedown", "mouseup", "mouseover", "mousemove", "mouseout"],
    /**
     * List qx.module.event.Mouse methods to be attached to native mouse event
     * objects
     * @internal
     */
    BIND_METHODS : ["getButton", "getViewportLeft", "getViewportTop", "getDocumentLeft", "getDocumentTop", "getScreenLeft", "getScreenTop"],
    /**
     * Standard mouse button mapping
     */
    BUTTONS_DOM2 : {
      '0' : "left",
      '2' : "right",
      '1' : "middle"
    },
    /**
     * Legacy Internet Explorer mouse button mapping
     */
    BUTTONS_MSHTML : {
      '1' : "left",
      '2' : "right",
      '4' : "middle"
    },
    /**
     * Returns the identifier of the mouse button that change state when the
     * event was triggered
     *
     * @return {String} One of <code>left</code>, <code>right</code> or
     * <code>middle</code>
     */
    getButton : function(){

      switch(this.type){case "contextmenu":
      return "right";case "click":
      // IE does not support buttons on click --> assume left button
      if(qxWeb.env.get("browser.name") === "ie" && qxWeb.env.get("browser.documentmode") < 9){

        return "left";
      };default:
      if(this.target !== undefined){

        return qx.module.event.Mouse.BUTTONS_DOM2[this.button] || "none";
      } else {

        return qx.module.event.Mouse.BUTTONS_MSHTML[this.button] || "none";
      };};
    },
    /**
     * Get the horizontal coordinate at which the event occurred relative
     * to the viewport.
     *
     * @return {Number} The horizontal mouse position
     */
    getViewportLeft : function(){

      return this.clientX;
    },
    /**
     * Get the vertical coordinate at which the event occurred relative
     * to the viewport.
     *
     * @return {Number} The vertical mouse position
     * @signature function()
     */
    getViewportTop : function(){

      return this.clientY;
    },
    /**
     * Get the horizontal position at which the event occurred relative to the
     * left of the document. This property takes into account any scrolling of
     * the page.
     *
     * @return {Number} The horizontal mouse position in the document.
     */
    getDocumentLeft : function(){

      if(this.pageX !== undefined){

        return this.pageX;
      } else {

        var win = qx.dom.Node.getWindow(this.srcElement);
        return this.clientX + qx.bom.Viewport.getScrollLeft(win);
      };
    },
    /**
     * Get the vertical position at which the event occurred relative to the
     * top of the document. This property takes into account any scrolling of
     * the page.
     *
     * @return {Number} The vertical mouse position in the document.
     */
    getDocumentTop : function(){

      if(this.pageY !== undefined){

        return this.pageY;
      } else {

        var win = qx.dom.Node.getWindow(this.srcElement);
        return this.clientY + qx.bom.Viewport.getScrollTop(win);
      };
    },
    /**
     * Get the horizontal coordinate at which the event occurred relative to
     * the origin of the screen coordinate system.
     *
     * Note: This value is usually not very useful unless you want to
     * position a native popup window at this coordinate.
     *
     * @return {Number} The horizontal mouse position on the screen.
     */
    getScreenLeft : function(){

      return this.screenX;
    },
    /**
     * Get the vertical coordinate at which the event occurred relative to
     * the origin of the screen coordinate system.
     *
     * Note: This value is usually not very useful unless you want to
     * position a native popup window at this coordinate.
     *
     * @return {Number} The vertical mouse position on the screen.
     */
    getScreenTop : function(){

      return this.screenY;
    },
    /**
     * Manipulates the native event object, adding methods if they're not
     * already present
     *
     * @param event {Event} Native event object
     * @param element {Element} DOM element the listener was attached to
     * @return {Event} Normalized event object
     * @internal
     */
    normalize : function(event, element){

      if(!event){

        return event;
      };
      var bindMethods = qx.module.event.Mouse.BIND_METHODS;
      for(var i = 0,l = bindMethods.length;i < l;i++){

        if(typeof event[bindMethods[i]] != "function"){

          event[bindMethods[i]] = qx.module.event.Mouse[bindMethods[i]].bind(event);
        };
      };
      return event;
    }
  },
  defer : function(statics){

    qxWeb.$registerEventNormalization(qx.module.event.Mouse.TYPES, statics.normalize);
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
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * The Slider control is used to select a numerical value from a given range.
 * It supports custom minimum/maximum values, step sizes and offsets (which limit
 * the knob's range).
 *
 * <h2>Markup</h2>
 * The Slider contains a single button element (the knob), which will be
 * created if it's not already present.
 *
 * <h2>CSS Classes</h2>
 * <table>
 *   <thead>
 *     <tr>
 *       <td>Class Name</td>
 *       <td>Applied to</td>
 *       <td>Description</td>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td><code>qx-slider</code></td>
 *       <td>Container element</td>
 *       <td>Identifies the Slider widget</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-slider-knob</code></td>
 *       <td>Slider knob (button)</td>
 *       <td>Identifies and styles the Slider's draggable knob</td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 * <h2 class="widget-markup">Generated DOM Structure</h2>
 *
 * @require(qx.module.event.Mouse)
 * @require(qx.module.Transform)
 *
 *
 * @group (Widget)
 */
qx.Bootstrap.define("qx.ui.website.Slider", {
  extend : qx.ui.website.Widget,
  statics : {
    /**
     * *step*
     *
     * The steps can be either a number or an array of predefined steps. In the
     * case of a number, it defines the amount of each step. In the case of an
     * array, the values of the array will be used as step values.
     *
     * Default value: <pre>1</pre>
     *
     *
     * *minimum*
     *
     * The minimum value of the slider. This will only be used if no explicit
     * steps are given.
     *
     * Default value: <pre>0 </pre>
     *
     *
     * *maximum*
     *
     * The maximum value of the slider. This will only be used if no explicit
     * steps are given.
     *
     * Default value: <pre>100</pre>
     *
     *
     * *offset*
     *
     * The amount of pixel the slider should be position away from its left and
     * right border.
     *
     * Default value: <pre>0 </pre>
     */
    _config : {
      minimum : 0,
      maximum : 100,
      offset : 0,
      step : 1
    },
    /**
     * *knobContent*
     *
     * The content of the knob element.
     *
     * Default value: <pre>{{value}}</pre>
     */
    _templates : {
      knobContent : "{{value}}"
    },
    /**
     * Factory method which converts the current collection into a collection of
     * slider widgets.
     *
     * @param value {Number?} The initial value of each slider widget
     * @param step {Number|Array?} The step config value to configure the step
     * width or the steps as array of numbers.
     * @return {qx.ui.website.Slider} A new Slider collection.
     * @attach {qxWeb}
     */
    slider : function(value, step){

      var slider = new qx.ui.website.Slider(this);
      slider.init();
      if(typeof step !== "undefined"){

        slider.setConfig("step", step);
      };
      if(typeof value !== "undefined"){

        slider.setValue(value);
      } else {

        slider.setValue(slider.getConfig("minimum"));
      };
      return slider;
    }
  },
  construct : function(selector, context){

    this.base(arguments, selector, context);
  },
  events : {
    /** Fired at each value change */
    "changeValue" : "Number",
    /** Fired with each mouse move event */
    "changePosition" : "Number"
  },
  members : {
    __dragMode : null,
    init : function(){

      if(!this.base(arguments)){

        return false;
      };
      var cssPrefix = this.getCssPrefix();
      if(!this.getValue()){

        var step = this.getConfig("step");
        var defaultVal = qx.Bootstrap.isArray(step) ? step[0] : this.getConfig("minimum");
        this.setProperty("value", defaultVal);
      };
      this._forEachElementWrapped(function(slider){

        slider.onWidget("click", slider._onClick, slider).onWidget("focus", slider._onSliderFocus, slider);
        qxWeb(document.documentElement).on("mouseup", slider._onMouseUp, slider);
        qxWeb(window).onWidget("resize", slider._onWindowResize, slider);
        if(slider.getChildren("." + cssPrefix + "-knob").length === 0){

          slider.append(qx.ui.website.Widget.create("<button>").addClass(cssPrefix + "-knob"));
        };
        slider.getChildren("." + cssPrefix + "-knob").setAttributes({
          "draggable" : "false",
          "unselectable" : "true"
        }).setHtml(slider._getKnobContent()).onWidget("mousedown", slider._onMouseDown, slider).onWidget("dragstart", slider._onDragStart, slider).onWidget("focus", slider._onKnobFocus, slider).onWidget("blur", slider._onKnobBlur, slider);
        slider.render();
      });
      return true;
    },
    /**
     * Returns the current value of the slider
     *
     * @return {Integer} slider value
     */
    getValue : function(){

      return this.getProperty("value");
    },
    /**
     * Sets the current value of the slider.
     *
     * @param value {Integer} new value of the slider
     *
     * @return {qx.ui.website.Slider} The collection for chaining
     */
    setValue : function(value){

      if(qxWeb.type.get(value) != "Number"){

        throw Error("Please provide a Number value for 'value'!");
      };
      var step = this.getConfig("step");
      if(!qx.Bootstrap.isArray(step)){

        var min = this.getConfig("minimum");
        var max = this.getConfig("maximum");
        if(value < min){

          value = min;
        };
        if(value > max){

          value = max;
        };
        if(qx.Bootstrap.getClass(step) == "Number"){

          value = Math.round(value / step) * step;
        };
      };
      this.setProperty("value", value);
      if(!qx.Bootstrap.isArray(step) || step.indexOf(value) != -1){

        this.__valueToPosition(value);
        this.getChildren("." + this.getCssPrefix() + "-knob").setHtml(this._getKnobContent());
        this.emit("changeValue", value);
      };
      return this;
    },
    render : function(){

      var step = this.getConfig("step");
      if(qx.Bootstrap.isArray(step)){

        this._getPixels();
        if(step.indexOf(this.getValue()) == -1){

          this.setValue(step[0]);
        } else {

          this.setValue(this.getValue());
        };
      } else if(qx.Bootstrap.getClass(step) == "Number"){

        this.setValue(Math.round(this.getValue() / step) * step);
      } else {

        this.setValue(this.getValue());
      };
      this.getChildren("." + this.getCssPrefix() + "-knob").setHtml(this._getKnobContent());
      return this;
    },
    /**
     * Returns the content that should be displayed in the knob
     * @return {String} knob content
     */
    _getKnobContent : function(){

      return qxWeb.template.render(this.getTemplate("knobContent"), {
        value : this.getValue()
      });
    },
    /**
     * Returns half of the slider knob's width, used for positioning
     * @return {Integer} half knob width
     */
    _getHalfKnobWidth : function(){

      var knobWidth = this.getChildren("." + this.getCssPrefix() + "-knob").getWidth();
      return Math.round(parseFloat(knobWidth / 2));
    },
    /**
     * Returns the boundaries (in pixels) of the slider's range of motion
     * @return {Map} a map with the keys <code>min</code> and <code>max</code>
     */
    _getDragBoundaries : function(){

      var paddingLeft = Math.ceil(parseFloat(this.getStyle("paddingLeft")) || 0);
      var paddingRight = Math.ceil(parseFloat(this.getStyle("paddingRight")) || 0);
      var offset = this.getConfig("offset");
      return {
        min : this.getOffset().left + offset + paddingLeft,
        max : this.getOffset().left + this.getWidth() - offset - paddingRight
      };
    },
    /**
     * Creates a lookup table to get the pixel values for each slider step
     * and computes the "breakpoint" between two steps in pixel.
     *
     * @return {Integer[]} list of pixel values
     */
    _getPixels : function(){

      var step = this.getConfig("step");
      if(!qx.Bootstrap.isArray(step)){

        return [];
      };
      var dragBoundaries = this._getDragBoundaries();
      var pixel = [];
      // First pixel value is fixed
      pixel.push(dragBoundaries.min);
      var lastIndex = step.length - 1;
      var paddingLeft = Math.ceil(parseFloat(this.getStyle("paddingLeft")) || 0);
      var paddingRight = Math.ceil(parseFloat(this.getStyle("paddingRight")) || 0);
      //The width really used by the slider (drag area)
      var usedWidth = this.getWidth() - (this.getConfig("offset") * 2) - paddingLeft - paddingRight;
      //The width of a single slider step
      var stepWidth = usedWidth / (step[lastIndex] - step[0]);
      var stepCount = 0;
      for(var i = 1,j = step.length - 1;i < j;i++){

        stepCount = step[i] - step[0];
        pixel.push(Math.round(stepCount * stepWidth) + dragBoundaries.min);
      };
      // Last pixel value is fixed
      pixel.push(dragBoundaries.max);
      return pixel;
    },
    /**
    * Returns the nearest existing slider value according to he position of the knob element.
    * @param position {Integer} The current knob position in pixels
    * @return {Integer} The next position to snap to
    */
    _getNearestValue : function(position){

      var pixels = this._getPixels();
      if(pixels.length === 0){

        var dragBoundaries = this._getDragBoundaries();
        var availableWidth = dragBoundaries.max - dragBoundaries.min;
        var relativePosition = position - dragBoundaries.min;
        var fraction = relativePosition / availableWidth;
        var min = this.getConfig("minimum");
        var max = this.getConfig("maximum");
        var result = (max - min) * fraction + min;
        if(result < min){

          result = min;
        };
        if(result > max){

          result = max;
        };
        var step = this.getConfig("step");
        if(qx.Bootstrap.getClass(step) == "Number"){

          result = Math.round(result / step) * step;
        };
        return result;
      };
      var currentIndex = 0,before = 0,after = 0;
      for(var i = 0,j = pixels.length;i < j;i++){

        if(position >= pixels[i]){

          currentIndex = i;
          before = pixels[i];
          after = pixels[i + 1] || before;
        } else {

          break;
        };
      };
      currentIndex = Math.abs(position - before) <= Math.abs(position - after) ? currentIndex : currentIndex + 1;
      return this.getConfig("step")[currentIndex];
    },
    /**
     * Takes the click position and sets slider value to the nearest step.
     *
     * @param e {qx.event.Emitter} Incoming event object
     */
    _onClick : function(e){

      if(e.getDocumentLeft() === 0 && e.getDocumentTop() === 0){

        return;
      };
      this.setValue(this._getNearestValue(e.getDocumentLeft()));
    },
    /**
     * Listener of mousedown event. Initializes drag or tracking mode.
     *
     * @param e {qx.event.Emitter} Incoming event object
     */
    _onMouseDown : function(e){

      // this can happen if the user releases the button while dragging outside
      // of the browser viewport
      if(this.__dragMode){

        return;
      };
      this.__dragMode = true;
      qxWeb(document.documentElement).on("mousemove", this._onMouseMove, this).setStyle("cursor", "pointer");
      e.stopPropagation();
    },
    /**
     * Listener of mouseup event. Used for cleanup of previously
     * initialized modes.
     *
     * @param e {qx.event.Emitter} Incoming event object
     */
    _onMouseUp : function(e){

      if(this.__dragMode === true){

        // Cleanup status flags
        delete this.__dragMode;
        this.__valueToPosition(this.getValue());
        qxWeb(document.documentElement).off("mousemove", this._onMouseMove, this).setStyle("cursor", "auto");
      };
      e.stopPropagation();
    },
    /**
     * Listener of mousemove event for the knob. Only used in drag mode.
     *
     * @param e {qx.event.Emitter} Incoming event object
     */
    _onMouseMove : function(e){

      e.preventDefault();
      if(this.__dragMode){

        var dragPosition = e.getDocumentLeft();
        var dragBoundaries = this._getDragBoundaries();
        var paddingLeft = Math.ceil(parseFloat(this.getStyle("paddingLeft")) || 0);
        var positionKnob = dragPosition - this.getOffset().left - this._getHalfKnobWidth() - paddingLeft;
        if(dragPosition >= dragBoundaries.min && dragPosition <= dragBoundaries.max){

          this.setValue(this._getNearestValue(dragPosition));
          if(positionKnob > 0){

            this._setKnobPosition(positionKnob);
            this.emit("changePosition", positionKnob);
          };
        };
      };
      e.stopPropagation();
    },
    /**
     * Prevents drag event propagation
     * @param e {Event} e drag start event
     */
    _onDragStart : function(e){

      e.stopPropagation();
      e.preventDefault();
    },
    /**
     * Delegates the Slider's focus to the knob
     * @param e {Event} focus event
     */
    _onSliderFocus : function(e){

      this.getChildren("." + this.getCssPrefix() + "-knob").focus();
    },
    /**
     * Attaches the event listener for keyboard support to the knob on focus
     * @param e {Event} focus event
     */
    _onKnobFocus : function(e){

      this.getChildren("." + this.getCssPrefix() + "-knob").onWidget("keydown", this._onKeyDown, this);
    },
    /**
     * Removes the event listener for keyboard support from the knob on blur
     * @param e {Event} blur event
     */
    _onKnobBlur : function(e){

      this.getChildren("." + this.getCssPrefix() + "-knob").offWidget("keydown", this._onKeyDown, this);
    },
    /**
     * Moves the knob if the left or right arrow key is pressed
     * @param e {Event} keydown event
     */
    _onKeyDown : function(e){

      var newValue;
      var currentValue = this.getValue();
      var step = this.getConfig("step");
      var stepType = qx.Bootstrap.getClass(step);
      var key = e.getKeyIdentifier();
      if(key == "Right"){

        if(stepType === "Array"){

          var idx = step.indexOf(currentValue);
          if(idx !== undefined){

            newValue = step[idx + 1] || currentValue;
          };
        } else if(stepType === "Number"){

          newValue = currentValue + step;
        } else {

          newValue = currentValue + 1;
        };
      } else if(key == "Left"){

        if(stepType === "Array"){

          var idx = step.indexOf(currentValue);
          if(idx !== undefined){

            newValue = step[idx - 1] || currentValue;
          };
        } else if(stepType === "Number"){

          newValue = currentValue - step;
        } else {

          newValue = currentValue - 1;
        };
      } else {

        return;
      };
      this.setValue(newValue);
    },
    /**
    * Applies the horizontal position
    * @param x {Integer} the position to move to
    */
    _setKnobPosition : function(x){

      var knob = this.getChildren("." + this.getCssPrefix() + "-knob");
      if(qxWeb.env.get("css.transform")){

        knob.translate([x + "px", 0, 0]);
      } else {

        knob.setStyle("left", x + "px");
      };
    },
    /**
     * Listener for window resize events. This listener method resets the
     * calculated values which are used to position the slider knob.
     */
    _onWindowResize : function(){

      var value = this.getProperty("value");
      if(qx.Bootstrap.isArray(this.getConfig("step"))){

        this._getPixels();
      };
      this.__valueToPosition(value);
    },
    /**
     * Positions the slider knob to the given value and fires the "changePosition"
     * event with the current position as integer.
     *
     * @param value {Integer} slider step value
     */
    __valueToPosition : function(value){

      var pixels = this._getPixels();
      var paddingLeft = Math.ceil(parseFloat(this.getStyle("paddingLeft")) || 0);
      var valueToPixel;
      if(pixels.length > 0){

        // Get the pixel value of the current step value
        valueToPixel = pixels[this.getConfig("step").indexOf(value)] - paddingLeft;
      } else {

        var dragBoundaries = this._getDragBoundaries();
        var availableWidth = dragBoundaries.max - dragBoundaries.min;
        var range = this.getConfig("maximum") - this.getConfig("minimum");
        var fraction = (value - this.getConfig("minimum")) / range;
        valueToPixel = (availableWidth * fraction) + dragBoundaries.min - paddingLeft;
      };
      // relative position is necessary here
      var position = valueToPixel - this.getOffset().left - this._getHalfKnobWidth();
      this._setKnobPosition(position);
      this.emit("changePosition", position);
    },
    dispose : function(){

      this._forEachElementWrapped(function(slider){

        qxWeb(document.documentElement).off("mouseup", slider._onMouseUp, slider);
        qxWeb(window).offWidget("resize", slider._onWindowResize, slider);
        slider.offWidget("click", slider._onClick, slider).offWidget("focus", slider._onSliderFocus, slider);
        slider.getChildren("." + this.getCssPrefix() + "-knob").offWidget("mousedown", slider._onMouseDown, slider).offWidget("dragstart", slider._onDragStart, slider).offWidget("focus", slider._onKnobFocus, slider).offWidget("blur", slider._onKnobBlur, slider).offWidget("keydown", slider._onKeyDown, slider);
      });
      this.setHtml("");
      return this.base(arguments);
    }
  },
  // Make the slider widget available as a qxWeb module
  defer : function(statics){

    qxWeb.$attach({
      slider : statics.slider
    });
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
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * This is a simple button widget which takes care of setting the label
 * and icon of a button.
 *
 * <h2>Markup</h2>
 * The Button can contain a <code>span</code> element for the label and/or
 * an <code>img</code> element for the icon.
 *
 * <h2>CSS Classes</h2>
 * <table>
 *   <thead>
 *     <tr>
 *       <td>Class Name</td>
 *       <td>Applied to</td>
 *       <td>Description</td>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td><code>qx-button</code></td>
 *       <td>Container element</td>
 *       <td>Identifies the Button widget</td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 * <h2 class="widget-markup">Generated DOM Structure</h2>
 *
 * @group (Widget)
 */
qx.Bootstrap.define("qx.ui.website.Button", {
  extend : qx.ui.website.Widget,
  statics : {
    /**
     * Factory method for the button widget which converts a standard
     * collection into a collection of buttons.
     *
     * @param label {String?} The label of the button.
     * @param icon {String?} The url for the button icon.
     * @return {qx.ui.website.Button} A collection of buttons.
     *
     * @attach {qxWeb}
     */
    button : function(label, icon){

      var buttons = new qx.ui.website.Button(this);
      buttons.init();
      if(label != null){

        buttons.setLabel(label);
      };
      if(icon != null){

        buttons.setIcon(icon);
      };
      return buttons;
    }
  },
  construct : function(selector, context){

    this.base(arguments, selector, context);
  },
  members : {
    // overridden
    init : function(){

      if(!this.base(arguments)){

        return false;
      };
      this._forEachElementWrapped(function(button){

        if(button.getChildren("span") == 0){

          qxWeb.create("<span>").appendTo(button);
        };
        if(button.getChildren("img") == 0){

          qxWeb.create("<img>").appendTo(button).setStyle("display", "none");
        };
      });
      return true;
    },
    /**
     * Sets the button's label text
     *
     * @param value {String} label text
     * @return {qxWeb} The collection for chaining
     */
    setLabel : function(value){

      this.getChildren("span").setHtml(value);
      return this;
    },
    /**
     * Returns the button's label text
     *
     * @return {String} label text
     */
    getLabel : function(){

      return this.getChildren("span").getHtml();
    },
    /**
     * Sets the source of the button's icon
     *
     * @param src {String} source URI for the icon
     * @return {qxWeb} The collection for chaining
     */
    setIcon : function(src){

      var img = this.getChildren("img");
      img.setAttribute("src", src);
      img.setStyle("display", src ? "inline" : "none");
      return this;
    },
    /**
     * Returns the URI of the button's icon
     *
     * @return {String|null} Icon image URI
     */
    getIcon : function(){

      return this.getChildren("img").getAttribute("src");
    },
    /**
     * Sets the menu to be shown when the button is clicked
     *
     * @param menu {qxWeb} menu element wrapped in a collection
     * @return {qxWeb} The collection for chaining
     */
    setMenu : function(menu){

      this.on("click", function(e){

        if(menu.getStyle("display") === "none"){

          menu.placeTo(this, "bottom-left");
          menu.show();
          qxWeb(document).once("click", function(){

            menu.hide();
          });
        } else {

          menu.hide();
        };
        e.stopPropagation();
      });
      return this;
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      button : statics.button
    });
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
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * @group (Widget)
 */
qx.Bootstrap.define("qx.ui.website.Label", {
  extend : qx.ui.website.Widget,
  construct : function(selector, context){

    this.base(arguments, selector, context);
  },
  members : {
    /**
     * Sets the label's text wrapping behavior
     *
     * @param value {Boolean} <code>true</code> if the label's text should
     * wrap if too long
     * @return {qxWeb} The collection for chaining
     */
    setWrap : function(value){

      // apply the white space style to the label to force it not
      // to wrap if wrap is set to false [BUG #3732]
      var whiteSpace = value ? "normal" : "nowrap";
      this.setStyle("whiteSpace", whiteSpace);
      return this;
    },
    /**
     * Returns the label's text wrapping behavior
     *
     * @return {Boolean} <code>true</code> if the label's text will wrap
     */
    getWrap : function(){

      var whiteSpace = this.getStyle("whiteSpace");
      return whiteSpace == "normal";
    },
    /**
     * Sets the label's text
     *
     * @param value {String} label text
     * @return {qxWeb} The collection for chaining
     */
    setValue : function(value){

      if(value === null){

        value = "";
      };
      this.setHtml(value);
      return this;
    },
    /**
     * Returns the label's text
     *
     * @return {String} label text
     */
    getValue : function(){

      return this.getHtml();
    }
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
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * This is a calendar widget used to select a date. It contain a set of
 * buttons to switch to the next or previous month as well as a button for
 * each day in the month.
 *
 * <h2>CSS Classes</h2>
 * <table>
 *   <thead>
 *     <tr>
 *       <td>Class Name</td>
 *       <td>Applied to</td>
 *       <td>Description</td>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td><code>qx-calendar</code></td>
 *       <td>Container element</td>
 *       <td>Identifies the Calendar widget</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-calendar-prev</code></td>
 *       <td><code>button</code></td>
 *       <td>Identifies and styles the "previous month" button</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-calendar-next</code></td>
 *       <td><code>button</code></td>
 *       <td>Identifies and styles the "next month" button</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-calendar-othermonth</code></td>
 *       <td>Day cell (<code>td</code>)</td>
 *       <td>Identifies and styles calendar cells for days from the previous or following month</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-calendar-day</code></td>
 *       <td>Day (<code>button</code>)</td>
 *       <td>Identifies and styles the day buttons</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-calendar-selected</code></td>
 *       <td>Day cell (<code>td</code>)</td>
 *       <td>Identifies and styles the cell containing the selected day's button</td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 * <h2 class="widget-markup">Generated DOM Structure</h2>
 *
 * @require(qx.module.Template)
 *
 * @group (Widget)
 */
qx.Bootstrap.define("qx.ui.website.Calendar", {
  extend : qx.ui.website.Widget,
  statics : {
    /**
     * *control*
     *
     * Template for the controls. This should be a <code>tr</code> tag containing
     * the first row of the calendar.
     *
     * Default value:
     * <pre><tr>
     *  <td colspan='1'><button class='{{cssPrefix}}-prev' title='Previous Month'>&lt;</button></td>
     *  <td colspan='5'>{{month}} {{year}}</td>
     *  <td colspan='1'><button class='{{cssPrefix}}-next' title='Next Month'>&gt;</button></td>
     * </tr></pre>
     *
     *
     * *dayRow*
     *
     * Template for the row of each day. This should be a tr tag containing the day names.
     *
     * Default value:
     * <pre><tr>
     *  {{#row}}<td>{{.}}</td>{{/row}}
     * </tr></pre>
     *
     *
     * *row*
     *
     * Template for the row of days. This should be a <code>tr</code> tag containing
     * a <code>button</code> for each day.
     *
     * Default value:
     * <pre><tr>
     *   {{#row}}<td class='{{cssClass}}'>
     *     <button class='{{cssPrefix}}-day' value='{{date}}'>{{day}}</button>
     *   </td>{{/row}}
     * </tr></pre>
     *
     *
     * *table*
     *
     * Wrapper template for all other templates. This should be a table.
     *
     * Default value:
     * <pre><table><thead>{{{thead}}}</thead><tbody>{{{tbody}}}</tbody></table></pre>
     */
    _templates : {
      controls : "<tr>" + "<td colspan='1'><button class='{{cssPrefix}}-prev' title='Previous Month'>&lt;</button></td>" + "<td colspan='5'>{{month}} {{year}}</td>" + "<td colspan='1'><button class='{{cssPrefix}}-next' title='Next Month'>&gt;</button></td>" + "</tr>",
      dayRow : "<tr>" + "{{#row}}<td>{{.}}</td>{{/row}}" + "</tr>",
      row : "<tr>" + "{{#row}}<td class='{{cssClass}}'><button class='{{cssPrefix}}-day' value='{{date}}'>{{day}}</button></td>{{/row}}" + "</tr>",
      table : "<table><thead>{{{thead}}}</thead><tbody>{{{tbody}}}</tbody></table>"
    },
    /**
     * *monthNames*
     *
     * Array of strings containing the names of the month.
     *
     * Default value:
     * <pre>["January", "February", "March", "April", "May", "June",
     *  "July", "August", "September", "October", "November", "December"]</pre>
     *
     *
     * *dayNames*
     *
     * Array of strings containing the day names.
     *
     * Default values:
     * <pre>["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]</pre>
     */
    _config : {
      monthNames : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      dayNames : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    },
    /**
     * Factory method which converts the current collection into a collection of
     * Calendar widgets. Therefore, an initialization process needs to be done which
     * can be configured with some parameter.
     *
     * @param date {Date?null} The initial Date of the calendar.
     * @return {qx.ui.website.Calendar} A new calendar collection.
     * @attach {qxWeb}
     */
    calendar : function(date){

      var calendar = new qx.ui.website.Calendar(this);
      calendar.init();
      if(date !== undefined){

        calendar.setValue(date);
      };
      return calendar;
    }
  },
  construct : function(selector, context){

    this.base(arguments, selector, context);
  },
  events : {
    /** Fired at each value change */
    "changeValue" : "Date"
  },
  members : {
    // overridden
    init : function(){

      if(!this.base(arguments)){

        return false;
      };
      this._forEachElementWrapped(function(calendar){

        calendar.showValue(new Date());
      });
      return true;
    },
    // overridden
    render : function(){

      this.showValue(this.getProperty("shownValue"));
      return this;
    },
    /**
     * Sets the given date as the current value displays it
     *
     * @param value {Date} Date to display.
     * @return {qx.ui.website.Calendar} The collection for chaining.
     */
    setValue : function(value){

      this.setProperty("value", value);
      this.showValue(value);
      this.emit("changeValue", value);
      return this;
    },
    /**
     * Returns the currently selected date of the first
     * calendar widget in the collection.
     *
     * @return {qx.ui.website.Calendar} The collection for chaining.
     */
    getValue : function(){

      var value = this.getProperty("value");
      return value ? new Date(value) : null;
    },
    /**
     * Displays the given date
     *
     * @param value {Date} Date to display.
     * @return {qx.ui.website.Calendar} The collection for chaining.
     */
    showValue : function(value){

      this.setProperty("shownValue", value);
      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(item){

        if(item.getAttribute("tabindex") < 0){

          item.setAttribute("tabindex", 0);
        };
        item.find("." + cssPrefix + "-prev").offWidget("click", this._prevMonth, item);
        item.find("." + cssPrefix + "-next").offWidget("click", this._nextMonth, item);
        item.find("." + cssPrefix + "-day").offWidget("click", this._selectDay, item);
        item.offWidget("focus", this._onFocus, item, true).offWidget("blur", this._onBlur, item, true);
      }, this);
      this.setHtml(this._getTable(value));
      this._forEachElementWrapped(function(item){

        item.find("." + cssPrefix + "-prev").onWidget("click", this._prevMonth, item);
        item.find("." + cssPrefix + "-next").onWidget("click", this._nextMonth, item);
        item.find("." + cssPrefix + "-day").onWidget("click", this._selectDay, item);
        item.onWidget("focus", this._onFocus, item, true).onWidget("blur", this._onBlur, item, true);
      }, this);
      return this;
    },
    /**
     * Displays the previous month
     */
    _prevMonth : function(){

      var shownValue = this.getProperty("shownValue");
      this.showValue(new Date(shownValue.getFullYear(), shownValue.getMonth() - 1));
    },
    /**
     * Displays the next month
     */
    _nextMonth : function(){

      var shownValue = this.getProperty("shownValue");
      this.showValue(new Date(shownValue.getFullYear(), shownValue.getMonth() + 1));
    },
    /**
     * Sets the current value to the day selected by the user
     * @param e {Event} The native click event.
     */
    _selectDay : function(e){

      var day = qxWeb(e.getTarget());
      var newStr = day.getAttribute("value");
      var newValue = new Date(newStr);
      this.setValue(newValue);
      this.find("." + this.getCssPrefix() + "-day[value='" + newStr + "']").focus();
    },
    /**
     * Renders the calendar for the given date.
     *
     * @param date {Date} The date to render.
     * @return {String} The calendar HTML.
     */
    _getTable : function(date){

      var controls = qxWeb.template.render(this.getTemplate("controls"), this._getControlsData(date));
      var dayRow = qxWeb.template.render(this.getTemplate("dayRow"), this._getDayRowData());
      var data = {
        thead : controls + dayRow,
        tbody : this._getWeekRows(date)
      };
      return qxWeb.template.render(this.getTemplate("table"), data);
    },
    /**
     * Returns the month and year to be displayed in the calendar controls.
     *
     * @param date {Date} The date to be displayed.
     * @return {Map} A map containing the month and year.
     */
    _getControlsData : function(date){

      return {
        month : this.getConfig("monthNames")[date.getMonth()],
        year : date.getFullYear(),
        cssPrefix : this.getCssPrefix()
      };
    },
    /**
     * Returns the week day names to be displayed in the calendar.
     *
     * @return {String[]} Array of day names.
     */
    _getDayRowData : function(){

      return {
        row : this.getConfig("dayNames")
      };
    },
    /**
     * Returns the table rows displaying the days of the month.
     *
     * @param date {Date} The date to be displayed.
     * @return {String} The table rows as an HTML string.
     */
    _getWeekRows : function(date){

      var weeks = [];
      var startOfWeek = 1;
      var cssPrefix = this.getCssPrefix();
      var helpDate = new Date(date.getFullYear(), date.getMonth(), 1);
      var firstDayOfWeek = helpDate.getDay();
      var today = new Date();
      helpDate = new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0);
      var nrDaysOfLastMonth = (7 + firstDayOfWeek - startOfWeek) % 7;
      helpDate.setDate(helpDate.getDate() - nrDaysOfLastMonth);
      var cssPrefix = this.getCssPrefix();
      for(var week = 0;week < 6;week++){

        var data = {
          row : []
        };
        for(var i = 0;i < 7;i++){

          var cssClasses = helpDate.getMonth() !== date.getMonth() ? cssPrefix + "-othermonth" : "";
          if(this.getProperty("value")){

            cssClasses += helpDate.toDateString() === this.getProperty("value").toDateString() ? " " + cssPrefix + "-selected" : "";
          };
          cssClasses += today.toDateString() === helpDate.toDateString() ? " " + cssPrefix + "-today" : "";
          data.row.push({
            day : helpDate.getDate(),
            date : helpDate.toDateString(),
            cssPrefix : cssPrefix,
            cssClass : cssClasses
          });
          helpDate.setDate(helpDate.getDate() + 1);
        };
        weeks.push(qxWeb.template.render(this.getTemplate("row"), data));
      };
      return weeks.join("");
    },
    /**
     * Attaches the keydown listener.
     *
     * @param e {Event} focus event
     */
    _onFocus : function(e){

      this.onWidget("keydown", this._onKeyDown, this);
    },
    /**
     * Removes the keydown listener if the focus moves outside of the calendar.
     *
     * @param e {Event} blur event
     */
    _onBlur : function(e){

      if(this.contains(e.getRelatedTarget()).length === 0){

        this.offWidget("keydown", this._onKeyDown, this);
      };
    },
    /**
     * Keyboard handling.
     *
     * @param e {Event} The keydown event.
     */
    _onKeyDown : function(e){

      var cssPrefix = this.getCssPrefix();
      var target = qxWeb(e.getTarget());
      var key = e.getKeyIdentifier();
      var isDayButton = target.hasClass(cssPrefix + "-day");
      if(isDayButton){

        if(key == "Space"){

          this._selectDay(e);
        } else if(key == "Right"){

          e.preventDefault();
          this._focusNextDay(target);
        } else if(key == "Left"){

          e.preventDefault();
          this._focusPrevDay(target);
        };;
      } else {

        if(key == "Space"){

          if(target.hasClass(cssPrefix + "-prev")){

            e.preventDefault();
            this._prevMonth();
            this.find("." + cssPrefix + "-prev").focus();
          } else if(target.hasClass(cssPrefix + "-next")){

            e.preventDefault();
            this._nextMonth();
            this.find("." + cssPrefix + "-next").focus();
          };
        } else if(key == "Right"){

          e.preventDefault();
          this._nextMonth();
          this.find("." + cssPrefix + "-next").focus();
        } else if(key == "Left"){

          e.preventDefault();
          this._prevMonth();
          this.find("." + cssPrefix + "-prev").focus();
        };;
      };
      e.stopPropagation();
    },
    /**
     * Focuses the day button following the given one.
     *
     * @param currentDay {qxWeb} The button for the current day.
     */
    _focusNextDay : function(currentDay){

      var cssPrefix = this.getCssPrefix();
      var nextDayInWeek = currentDay.getParents().getNext();
      if(nextDayInWeek.length > 0){

        nextDayInWeek.getChildren("." + cssPrefix + "-day").focus();
      } else {

        var nextWeekRow = currentDay.getParents().getParents().getNext();
        if(nextWeekRow.length > 0){

          nextWeekRow.find("> td > ." + cssPrefix + "-day").getFirst().focus();
        } else {

          this._nextMonth();
          var oldDate = new Date(currentDay.getAttribute("value"));
          var newDate = new Date(oldDate.valueOf());
          newDate.setDate(oldDate.getDate() + 1);
          var buttonVal = newDate.toDateString();
          this.find("." + cssPrefix + "-day[value='" + buttonVal + "']").focus();
        };
      };
    },
    /**
     * Focuses the day button preceding the given one.
     *
     * @param currentDay {qxWeb} The button for the current day.
     */
    _focusPrevDay : function(currentDay){

      var cssPrefix = this.getCssPrefix();
      var prevDayInWeek = currentDay.getParents().getPrev();
      if(prevDayInWeek.length > 0){

        prevDayInWeek.getChildren("." + cssPrefix + "-day").focus();
      } else {

        var prevWeekRow = currentDay.getParents().getParents().getPrev();
        if(prevWeekRow.length > 0){

          prevWeekRow.find("> td > ." + cssPrefix + "-day").getLast().focus();
        } else {

          this._prevMonth();
          var oldDate = new Date(currentDay.getAttribute("value"));
          var newDate = new Date(oldDate.valueOf());
          newDate.setDate(oldDate.getDate() - 1);
          var buttonVal = newDate.toDateString();
          this.find("." + cssPrefix + "-day[value='" + buttonVal + "']").focus();
        };
      };
    },
    dispose : function(){

      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(item){

        item.find("." + cssPrefix + "-prev").offWidget("click", this._prevMonth, item);
        item.find("." + cssPrefix + "-next").offWidget("click", this._nextMonth, item);
        item.find("." + cssPrefix + "-day").offWidget("click", this._selectDay, item);
        item.offWidget("focus", this._onFocus, item, true).offWidget("blur", this._onBlur, item, true).offWidget("keydown", this._onKeyDown, item);
      }, this);
      this.setHtml("");
      return this.base(arguments);
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      calendar : statics.calendar
    });
  }
});

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
 * Text selection manipulation module
 */
qx.Bootstrap.define("qx.module.TextSelection", {
  statics : {
    /**
     * Get the text selection of the first element.
     *
     * @return {String|null}
     */
    getTextSelection : function(){

      var el = this[0];
      if(el){

        if(!qx.module.TextSelection.__isInput(el)){

          el = qx.module.TextSelection.__getTextNode(el);
        };
        return el ? qx.bom.Selection.get(el) : null;
      };
      return null;
    },
    /**
     * Get the length of the text selection of the first element.
     *
     *
     * @return {Integer|null}
     *
     * @attach {qxWeb}
     */
    getTextSelectionLength : function(){

      var el = this[0];
      if(el){

        if(!qx.module.TextSelection.__isInput(el)){

          el = qx.module.TextSelection.__getTextNode(el);
        };
        return el ? qx.bom.Selection.getLength(el) : null;
      };
      return null;
    },
    /**
     * Get the start of the text selection of the first element.
     *
     * @return {Integer|null}
     *
     * @attach {qxWeb}
     */
    getTextSelectionStart : function(){

      var el = this[0];
      if(el){

        if(!qx.module.TextSelection.__isInput(el)){

          el = qx.module.TextSelection.__getTextNode(el);
        };
        return el ? qx.bom.Selection.getStart(el) : null;
      };
      return null;
    },
    /**
     * Get the end of the text selection of the first element.
     *
     * @return {Integer|null}
     *
     * @attach {qxWeb}
     */
    getTextSelectionEnd : function(){

      var el = this[0];
      if(el){

        if(!qx.module.TextSelection.__isInput(el)){

          el = qx.module.TextSelection.__getTextNode(el);
        };
        return el ? qx.bom.Selection.getEnd(el) : null;
      };
      return null;
    },
    /**
     * Set the text selection of the first element in the collection
     * with the given start and end value.
     * If no end value is passed the selection will extend to the end.
     *
     * @param start {Integer} start of the selection (zero based)
     * @param end {Integer} end of the selection
     * @return {qxWeb} The collection for chaining.
     *
     * @attach {qxWeb}
     */
    setTextSelection : function(start, end){

      var el = this[0];
      if(el){

        if(!qx.module.TextSelection.__isInput(el)){

          el = qx.module.TextSelection.__getTextNode(el);
        };
        if(el){

          qx.bom.Selection.set(el, start, end);
        };
      };
      return this;
    },
    /**
     * Clears the text selection of all elements.
     *
     * @return {qxWeb} The collection for chaining.
     *
     * @attach {qxWeb}
     */
    clearTextSelection : function(){

      this._forEachElement(function(el){

        if(!qx.module.TextSelection.__isInput(el)){

          el = qx.module.TextSelection.__getTextNode(el);
        };
        if(el){

          qx.bom.Selection.clear(el);
        };
      });
      return this;
    },
    /**
     * Checks if the given DOM node is a text input field or textarea
     *
     * @param el {Element} The node to check
     * @return {Boolean} <code>true</code> if the given node is an input field
     *
     * @attach {qxWeb}
     */
    __isInput : function(el){

      var tag = el.tagName ? el.tagName.toLowerCase() : null;
      return (tag === "input" || tag === "textarea");
    },
    /**
     * Returns the first text child node of the given element
     *
     * @param el {Element} DOM element
     * @return {Node|null} text node
     *
     * @attach {qxWeb}
     */
    __getTextNode : function(el){

      for(var i = 0,l = el.childNodes.length;i < l;i++){

        if(el.childNodes[i].nodeType === 3){

          return el.childNodes[i];
        };
      };
      return null;
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      "getTextSelection" : statics.getTextSelection,
      "getTextSelectionLength" : statics.getTextSelectionLength,
      "getTextSelectionStart" : statics.getTextSelectionStart,
      "getTextSelectionEnd" : statics.getTextSelectionEnd,
      "setTextSelection" : statics.setTextSelection,
      "clearTextSelection" : statics.clearTextSelection
    });
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
     * Alexander Steitz (aback)

************************************************************************ */
/**
 * Low-level selection API to select elements like input and textarea elements
 * as well as text nodes or elements which their child nodes.
 *
 * @ignore(qx.bom.Element, qx.bom.Element.blur)
 */
qx.Bootstrap.define("qx.bom.Selection", {
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /**
     * Returns the native selection object.
     *
     * @signature function(documentNode)
     * @param documentNode {document} Document node to retrieve the connected selection from
     * @return {Selection} native selection object
     */
    getSelectionObject : qx.core.Environment.select("html.selection", {
      "selection" : function(documentNode){

        return documentNode.selection;
      },
      // suitable for gecko, opera, webkit and mshtml >= 9
      "default" : function(documentNode){

        return qx.dom.Node.getWindow(documentNode).getSelection();
      }
    }),
    /**
     * Returns the current selected text.
     *
     * @signature function(node)
     * @param node {Node} node to retrieve the selection for
     * @return {String|null} selected text as string
     */
    get : qx.core.Environment.select("html.selection", {
      "selection" : function(node){

        // to get the selected text in legacy IE you have to work with the TextRange
        // of the selection object. So always pass the document node to the
        // Range class to get this TextRange object.
        var rng = qx.bom.Range.get(qx.dom.Node.getDocument(node));
        return rng.text;
      },
      // suitable for gecko, opera and webkit
      "default" : function(node){

        if(this.__isInputOrTextarea(node)){

          return node.value.substring(node.selectionStart, node.selectionEnd);
        } else {

          return this.getSelectionObject(qx.dom.Node.getDocument(node)).toString();
        };
      }
    }),
    /**
     * Returns the length of the selection
     *
     * @signature function(node)
     * @param node {Node} Form node or document/window to check.
     * @return {Integer|null} length of the selection or null
     */
    getLength : qx.core.Environment.select("html.selection", {
      "selection" : function(node){

        var selectedValue = this.get(node);
        // get the selected part and split it by linebreaks
        var split = qx.util.StringSplit.split(selectedValue, /\r\n/);
        // return the length substracted by the count of linebreaks
        // legacy IE counts linebreaks as two chars
        // -> harmonize this to one char per linebreak
        return selectedValue.length - (split.length - 1);
      },
      "default" : function(node){

        if(qx.core.Environment.get("engine.name") == "opera"){

          var selectedValue,selectedLength,split;
          if(this.__isInputOrTextarea(node)){

            var start = node.selectionStart;
            var end = node.selectionEnd;
            selectedValue = node.value.substring(start, end);
            selectedLength = end - start;
          } else {

            selectedValue = qx.bom.Selection.get(node);
            selectedLength = selectedValue.length;
          };
          // get the selected part and split it by linebreaks
          split = qx.util.StringSplit.split(selectedValue, /\r\n/);
          // substract the count of linebreaks
          // Opera counts each linebreak as two chars
          // -> harmonize this to one char per linebreak
          return selectedLength - (split.length - 1);
        };
        // suitable for gecko and webkit
        if(this.__isInputOrTextarea(node)){

          return node.selectionEnd - node.selectionStart;
        } else {

          return this.get(node).length;
        };
      }
    }),
    /**
     * Returns the start of the selection
     *
     * @signature function(node)
     * @param node {Node} node to check for
     * @return {Integer} start of current selection or "-1" if the current
     *                   selection is not within the given node
     */
    getStart : qx.core.Environment.select("html.selection", {
      "selection" : function(node){

        if(this.__isInputOrTextarea(node)){

          var documentRange = qx.bom.Range.get();
          // Check if the document.selection is the text range inside the input element
          if(!node.contains(documentRange.parentElement())){

            return -1;
          };
          var range = qx.bom.Range.get(node);
          var len = node.value.length;
          // Synchronize range start and end points
          range.moveToBookmark(documentRange.getBookmark());
          range.moveEnd('character', len);
          return len - range.text.length;
        } else {

          var range = qx.bom.Range.get(node);
          var parentElement = range.parentElement();
          // get a range which holds the text of the parent element
          var elementRange = qx.bom.Range.get();
          try{

            // IE throws an invalid argument error when the document has no selection
            elementRange.moveToElementText(parentElement);
          } catch(ex) {

            return 0;
          };
          // Move end points of full range so it starts at the user selection
          // and ends at the end of the element text.
          var bodyRange = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));
          bodyRange.setEndPoint("StartToStart", range);
          bodyRange.setEndPoint("EndToEnd", elementRange);
          // selection is at beginning
          if(elementRange.compareEndPoints("StartToStart", bodyRange) == 0){

            return 0;
          };
          var moved;
          var steps = 0;
          while(true){

            moved = bodyRange.moveStart("character", -1);
            // Starting points of both ranges are equal
            if(elementRange.compareEndPoints("StartToStart", bodyRange) == 0){

              break;
            };
            // Moving had no effect -> range is at begin of body
            if(moved == 0){

              break;
            } else {

              steps++;
            };
          };
          return ++steps;
        };
      },
      "default" : function(node){

        if(qx.core.Environment.get("engine.name") === "gecko" || qx.core.Environment.get("engine.name") === "webkit"){

          if(this.__isInputOrTextarea(node)){

            return node.selectionStart;
          } else {

            var documentElement = qx.dom.Node.getDocument(node);
            var documentSelection = this.getSelectionObject(documentElement);
            // gecko and webkit do differ how the user selected the text
            // "left-to-right" or "right-to-left"
            if(documentSelection.anchorOffset < documentSelection.focusOffset){

              return documentSelection.anchorOffset;
            } else {

              return documentSelection.focusOffset;
            };
          };
        };
        if(this.__isInputOrTextarea(node)){

          return node.selectionStart;
        } else {

          return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).anchorOffset;
        };
      }
    }),
    /**
     * Returns the end of the selection
     *
     * @signature function(node)
     * @param node {Node} node to check
     * @return {Integer} end of current selection
     */
    getEnd : qx.core.Environment.select("html.selection", {
      "selection" : function(node){

        if(this.__isInputOrTextarea(node)){

          var documentRange = qx.bom.Range.get();
          // Check if the document.selection is the text range inside the input element
          if(!node.contains(documentRange.parentElement())){

            return -1;
          };
          var range = qx.bom.Range.get(node);
          var len = node.value.length;
          // Synchronize range start and end points
          range.moveToBookmark(documentRange.getBookmark());
          range.moveStart('character', -len);
          return range.text.length;
        } else {

          var range = qx.bom.Range.get(node);
          var parentElement = range.parentElement();
          // get a range which holds the text of the parent element
          var elementRange = qx.bom.Range.get();
          try{

            // IE throws an invalid argument error when the document has no selection
            elementRange.moveToElementText(parentElement);
          } catch(ex) {

            return 0;
          };
          var len = elementRange.text.length;
          // Move end points of full range so it ends at the user selection
          // and starts at the start of the element text.
          var bodyRange = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));
          bodyRange.setEndPoint("EndToEnd", range);
          bodyRange.setEndPoint("StartToStart", elementRange);
          // selection is at beginning
          if(elementRange.compareEndPoints("EndToEnd", bodyRange) == 0){

            return len - 1;
          };
          var moved;
          var steps = 0;
          while(true){

            moved = bodyRange.moveEnd("character", 1);
            // Ending points of both ranges are equal
            if(elementRange.compareEndPoints("EndToEnd", bodyRange) == 0){

              break;
            };
            // Moving had no effect -> range is at begin of body
            if(moved == 0){

              break;
            } else {

              steps++;
            };
          };
          return len - (++steps);
        };
      },
      "default" : function(node){

        if(qx.core.Environment.get("engine.name") === "gecko" || qx.core.Environment.get("engine.name") === "webkit"){

          if(this.__isInputOrTextarea(node)){

            return node.selectionEnd;
          } else {

            var documentElement = qx.dom.Node.getDocument(node);
            var documentSelection = this.getSelectionObject(documentElement);
            // gecko and webkit do differ how the user selected the text
            // "left-to-right" or "right-to-left"
            if(documentSelection.focusOffset > documentSelection.anchorOffset){

              return documentSelection.focusOffset;
            } else {

              return documentSelection.anchorOffset;
            };
          };
        };
        if(this.__isInputOrTextarea(node)){

          return node.selectionEnd;
        } else {

          return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).focusOffset;
        };
      }
    }),
    /**
     * Utility method to check for an input or textarea element
     *
     * @param node {Node} node to check
     * @return {Boolean} Whether the given nodt is an input or textarea element
     */
    __isInputOrTextarea : function(node){

      return qx.dom.Node.isElement(node) && (node.nodeName.toLowerCase() == "input" || node.nodeName.toLowerCase() == "textarea");
    },
    /**
     * Sets a selection at the given node with the given start and end.
     * For text nodes, input and textarea elements the start and end parameters
     * set the boundaries at the text.
     * For element nodes the start and end parameters are used to select the
     * childNodes of the given element.
     *
     * @signature function(node, start, end)
     * @param node {Node} node to set the selection at
     * @param start {Integer} start of the selection
     * @param end {Integer} end of the selection
     * @return {Boolean} whether a selection is drawn
     */
    set : qx.core.Environment.select("html.selection", {
      "selection" : function(node, start, end){

        var rng;
        // if the node is the document itself then work on with the body element
        if(qx.dom.Node.isDocument(node)){

          node = node.body;
        };
        if(qx.dom.Node.isElement(node) || qx.dom.Node.isText(node)){

          switch(node.nodeName.toLowerCase()){case "input":case "textarea":case "button":
          if(end === undefined){

            end = node.value.length;
          };
          if(start >= 0 && start <= node.value.length && end >= 0 && end <= node.value.length){

            rng = qx.bom.Range.get(node);
            rng.collapse(true);
            rng.moveStart("character", start);
            rng.moveEnd("character", end - start);
            rng.select();
            return true;
          };
          break;case "#text":
          if(end === undefined){

            end = node.nodeValue.length;
          };
          if(start >= 0 && start <= node.nodeValue.length && end >= 0 && end <= node.nodeValue.length){

            // get a range of the body element
            rng = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));
            // use the parent node -> "moveToElementText" expects an element
            rng.moveToElementText(node.parentNode);
            rng.collapse(true);
            rng.moveStart("character", start);
            rng.moveEnd("character", end - start);
            rng.select();
            return true;
          };
          break;default:
          if(end === undefined){

            end = node.childNodes.length - 1;
          };
          // check start and end -> childNodes
          if(node.childNodes[start] && node.childNodes[end]){

            // get the TextRange of the body element
            // IMPORTANT: only with a range of the body the method "moveElementToText" is available
            rng = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));
            // position it at the given node
            rng.moveToElementText(node.childNodes[start]);
            rng.collapse(true);
            // create helper range
            var newRng = qx.bom.Range.get(qx.dom.Node.getBodyElement(node));
            newRng.moveToElementText(node.childNodes[end]);
            // set the end of the range to the end of the helper range
            rng.setEndPoint("EndToEnd", newRng);
            rng.select();
            return true;
          };};
        };
        return false;
      },
      // suitable for gecko, opera, webkit and mshtml >=9
      "default" : function(node, start, end){

        // special handling for input and textarea elements
        var nodeName = node.nodeName.toLowerCase();
        if(qx.dom.Node.isElement(node) && (nodeName == "input" || nodeName == "textarea")){

          // if "end" is not given set it to the end
          if(end === undefined){

            end = node.value.length;
          };
          // check boundaries
          if(start >= 0 && start <= node.value.length && end >= 0 && end <= node.value.length){

            node.focus();
            node.select();
            node.setSelectionRange(start, end);
            return true;
          };
        } else {

          var validBoundaries = false;
          var sel = qx.dom.Node.getWindow(node).getSelection();
          var rng = qx.bom.Range.get(node);
          // element or text node?
          // for elements nodes the offsets are applied to childNodes
          // for text nodes the offsets are applied to the text content
          if(qx.dom.Node.isText(node)){

            if(end === undefined){

              end = node.length;
            };
            if(start >= 0 && start < node.length && end >= 0 && end <= node.length){

              validBoundaries = true;
            };
          } else if(qx.dom.Node.isElement(node)){

            if(end === undefined){

              end = node.childNodes.length - 1;
            };
            if(start >= 0 && node.childNodes[start] && end >= 0 && node.childNodes[end]){

              validBoundaries = true;
            };
          } else if(qx.dom.Node.isDocument(node)){

            // work on with the body element
            node = node.body;
            if(end === undefined){

              end = node.childNodes.length - 1;
            };
            if(start >= 0 && node.childNodes[start] && end >= 0 && node.childNodes[end]){

              validBoundaries = true;
            };
          };;
          if(validBoundaries){

            // collapse the selection if needed
            if(!sel.isCollapsed){

              sel.collapseToStart();
            };
            // set start and end of the range
            rng.setStart(node, start);
            // for element nodes set the end after the childNode
            if(qx.dom.Node.isText(node)){

              rng.setEnd(node, end);
            } else {

              rng.setEndAfter(node.childNodes[end]);
            };
            // remove all existing ranges and add the new one
            if(sel.rangeCount > 0){

              sel.removeAllRanges();
            };
            sel.addRange(rng);
            return true;
          };
        };
        return false;
      }
    }),
    /**
     * Selects all content/childNodes of the given node
     *
     * @param node {Node} text, element or document node
     * @return {Boolean} whether a selection is drawn
     */
    setAll : function(node){

      return qx.bom.Selection.set(node, 0);
    },
    /**
     * Clears the selection on the given node.
     *
     * @param node {Node} node to clear the selection for
     */
    clear : qx.core.Environment.select("html.selection", {
      "selection" : function(node){

        var sel = qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node));
        var rng = qx.bom.Range.get(node);
        var parent = rng.parentElement();
        var documentRange = qx.bom.Range.get(qx.dom.Node.getDocument(node));
        // only collapse if the selection is really on the given node
        // -> compare the two parent elements of the ranges with each other and
        // the given node
        if(parent == documentRange.parentElement() && parent == node){

          sel.empty();
        };
      },
      "default" : function(node){

        var sel = qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node));
        var nodeName = node.nodeName.toLowerCase();
        // if the node is an input or textarea element use the specialized methods
        if(qx.dom.Node.isElement(node) && (nodeName == "input" || nodeName == "textarea")){

          node.setSelectionRange(0, 0);
          if(qx.bom.Element && qx.bom.Element.blur){

            qx.bom.Element.blur(node);
          };
        } else if(qx.dom.Node.isDocument(node) || nodeName == "body"){

          sel.collapse(node.body ? node.body : node, 0);
        } else {

          var rng = qx.bom.Range.get(node);
          if(!rng.collapsed){

            var compareNode;
            var commonAncestor = rng.commonAncestorContainer;
            // compare the parentNode of the textNode with the given node
            // (if this node is an element) to decide whether the selection
            // is cleared or not.
            if(qx.dom.Node.isElement(node) && qx.dom.Node.isText(commonAncestor)){

              compareNode = commonAncestor.parentNode;
            } else {

              compareNode = commonAncestor;
            };
            if(compareNode == node){

              sel.collapse(node, 0);
            };
          };
        };
      }
    })
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
     * Alexander Steitz (aback)

************************************************************************ */
/**
 * Low-level Range API which is used together with the low-level Selection API.
 * This is especially useful whenever a developer want to work on text level,
 * e.g. for an editor.
 */
qx.Bootstrap.define("qx.bom.Range", {
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    /**
     * Returns the range object of the given node.
     *
     * @signature function(node)
     * @param node {Node} node to get the range of
     * @return {Range} valid range of given selection
     */
    get : qx.core.Environment.select("html.selection", {
      "selection" : function(node){

        // check for the type of the given node
        // for legacy IE the nodes input, textarea, button and body
        // have access to own TextRange objects. Everything else is
        // gathered via the selection object.
        if(qx.dom.Node.isElement(node)){

          switch(node.nodeName.toLowerCase()){case "input":
          switch(node.type){case "text":case "password":case "hidden":case "button":case "reset":case "file":case "submit":
          return node.createTextRange();default:
          return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).createRange();};
          break;case "textarea":case "body":case "button":
          return node.createTextRange();default:
          return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).createRange();};
        } else {

          if(node == null){

            node = window;
          };
          // need to pass the document node to work with multi-documents
          return qx.bom.Selection.getSelectionObject(qx.dom.Node.getDocument(node)).createRange();
        };
      },
      // suitable for gecko, opera and webkit
      "default" : function(node){

        var doc = qx.dom.Node.getDocument(node);
        // get the selection object of the corresponding document
        var sel = qx.bom.Selection.getSelectionObject(doc);
        if(sel.rangeCount > 0){

          return sel.getRangeAt(0);
        } else {

          return doc.createRange();
        };
      }
    })
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
     * Adrian Olaru (adrianolaru)

   ======================================================================

   This class contains code based on the following work:

   * Cross-Browser Split
     http://blog.stevenlevithan.com/archives/cross-browser-split
     Version 1.0.1

     Copyright:
       (c) 2006-2007, Steven Levithan <http://stevenlevithan.com>

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Authors:
       * Steven Levithan

************************************************************************ */
/**
 * Implements an ECMA-compliant, uniform cross-browser split method
 */
qx.Bootstrap.define("qx.util.StringSplit", {
  statics : {
    /**
     * ECMA-compliant, uniform cross-browser split method
     *
     * @param str {String} Incoming string to split
     * @param separator {RegExp} Specifies the character to use for separating the string.
     *   The separator is treated as a string or a  regular expression. If separator is
     *   omitted, the array returned contains one element consisting of the entire string.
     * @param limit {Integer?} Integer specifying a limit on the number of splits to be found.
     * @return {String[]} split string
     */
    split : function(str, separator, limit){

      // if `separator` is not a regex, use the native `split`
      if(Object.prototype.toString.call(separator) !== "[object RegExp]"){

        return String.prototype.split.call(str, separator, limit);
      };
      var output = [],lastLastIndex = 0,flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.sticky ? "y" : ""),separator = RegExp(separator.source, flags + "g"),// make `global` and avoid `lastIndex` issues by working with a copy
      separator2,match,lastIndex,lastLength,compliantExecNpcg = /()??/.exec("")[1] === undefined;
      // NPCG: nonparticipating capturing group
      str = str + "";
      // type conversion
      if(!compliantExecNpcg){

        separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags);
      };
      /* behavior for `limit`: if it's...
      - `undefined`: no limit.
      - `NaN` or zero: return an empty array.
      - a positive number: use `Math.floor(limit)`.
      - a negative number: no limit.
      - other: type-convert, then use the above rules. */
      if(limit === undefined || +limit < 0){

        limit = Infinity;
      } else {

        limit = Math.floor(+limit);
        if(!limit){

          return [];
        };
      };
      while(match = separator.exec(str)){

        lastIndex = match.index + match[0].length;
        // `separator.lastIndex` is not reliable cross-browser
        if(lastIndex > lastLastIndex){

          output.push(str.slice(lastLastIndex, match.index));
          // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
          if(!compliantExecNpcg && match.length > 1){

            match[0].replace(separator2, function(){

              for(var i = 1;i < arguments.length - 2;i++){

                if(arguments[i] === undefined){

                  match[i] = undefined;
                };
              };
            });
          };
          if(match.length > 1 && match.index < str.length){

            Array.prototype.push.apply(output, match.slice(1));
          };
          lastLength = match[0].length;
          lastLastIndex = lastIndex;
          if(output.length >= limit){

            break;
          };
        };
        if(separator.lastIndex === match.index){

          separator.lastIndex++;
        };
      };
      if(lastLastIndex === str.length){

        if(lastLength || !separator.test("")){

          output.push("");
        };
      } else {

        output.push(str.slice(lastLastIndex));
      };
      return output.length > limit ? output.slice(0, limit) : output;
    }
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
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * @require(qx.module.TextSelection)
 *
 * @group (Widget)
 */
qx.Bootstrap.define("qx.ui.website.Input", {
  extend : qx.ui.website.Widget,
  construct : function(selector, context){

    this.base(arguments, selector, context);
  },
  members : {
    // used for webkit only
    __selectable : null,
    __enabled : null,
    /**
     * Set the input element enabled / disabled.
     * Webkit needs a special treatment because the set color of the input
     * field changes automatically. Therefore, we use
     * <code>-webkit-user-modify: read-only</code> and
     * <code>-webkit-user-select: none</code>
     * for disabling the fields in webkit. All other browsers use the disabled
     * attribute.
     *
     * @param value {Boolean} true, if the input element should be enabled.
     * @return {qx.ui.website.Input} The collection for chaining
     */
    setEnabled : function(value){

      this.setAttribute("disabled", value === false);
      if(qxWeb.env.get("engine.name") == "webkit"){

        this.__enabled = value;
        if(!value){

          this.setStyles({
            "userModify" : "read-only",
            "userSelect" : "none"
          });
        } else {

          this.setStyles({
            "userModify" : null,
            "userSelect" : this.__selectable ? null : "none"
          });
        };
      };
      return this;
    },
    /**
     * Set whether the element is selectable. It uses the qooxdoo attribute
     * qxSelectable with the values 'on' or 'off'.
     * In webkit, a special css property will be used and checks for the
     * enabled state.
     *
     * @param value {Boolean} True, if the element should be selectable.
     * @return {qx.ui.website.Input} The collection for chaining
     */
    setSelectable : function(value){

      if(!this[0]){

        return this;
      };
      var enabled = this.__enabled;
      if(qxWeb.env.get("engine.name") != "webkit"){

        enabled = true;
      } else {

        this.__selectable = value;
      };
      value = enabled && value;
      var contentElement = this.eq(0);
      contentElement.setAttribute("qxSelectable", value ? "on" : "off");
      var userSelect = qx.core.Environment.get("css.userselect");
      if(userSelect){

        contentElement.setStyle(userSelect, value ? "text" : qx.core.Environment.get("css.userselect.none"));
      };
      return this;
    }
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
     * Martin Wittemann (wittemann)
     * Daniel Wagner (danielwagner)

************************************************************************ */
/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * This is a simple rating widget which can be used to display a predefined
 * number of symbols on which the user can click to give a rating e.g.
 * 3 out of 5 stars.
 *
 * <h2>Markup</h2>
 * Each rating item is a span element. Span elements already existing within
 * the Rating's container will be used, otherwise new elements will be added or
 * removed according to the <code>length</code> config option.
 *
 * <h2>CSS Classes</h2>
 * <table>
 *   <thead>
 *     <tr>
 *       <td>Class Name</td>
 *       <td>Applied to</td>
 *       <td>Description</td>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td><code>qx-rating</code></td>
 *       <td>Container element</td>
 *       <td>Identifies the Rating widget</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-rating-item</code></td>
 *       <td>Rating item (span)</td>
 *       <td>Identifies and styles an active Rating item</td>
 *     </tr>
 *     <tr>
 *       <td><code>qx-rating-item-off</code></td>
 *       <td>Rating item (span)</td>
 *       <td>Identifies and styles an inactive Rating item. Applied in addition to <code>qx-rating-item</code></td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 * <h2 class="widget-markup">Generated DOM Structure</h2>
 *
 * @group (Widget)
 */
qx.Bootstrap.define("qx.ui.website.Rating", {
  extend : qx.ui.website.Widget,
  statics : {
    /**
     * *length*
     *
     * The length of the rating widget.
     *
     * Default value: <pre>5</pre>
     *
     *
     * *symbol*
     *
     * The symbol used to render the rating items. This can be any
     * String e.g. a UTF-8 character.
     *
     * Default value: <pre>★</pre>
     */
    _config : {
      length : 5,
      symbol : "★"
    },
    /**
     * Factory method which converts the current collection into a collection of
     * rating widgets. Therefore, an initialization process needs to be done which
     * can be configured with some parameter.
     *
     * @param initValue {Number?0} The initial value of the rating.
     * @param symbol {String?"★"} The symbol which should be used for each rating item.
     * @param length {Number?5} The length of the rating widget.
     * @return {qx.ui.website.Rating} A new rating collection.
     * @attach {qxWeb}
     */
    rating : function(initValue, symbol, length){

      var rating = new qx.ui.website.Rating(this);
      rating.init();
      var modified = false;
      if(length != undefined && length != rating.getConfig("length")){

        rating.setConfig("length", length);
        modified = true;
      };
      if(symbol != undefined){

        rating.setConfig("symbol", symbol);
        modified = true;
      };
      if(modified){

        rating.render();
      };
      if(initValue != undefined){

        rating.setValue(initValue);
      };
      return rating;
    }
  },
  construct : function(selector, context){

    this.base(arguments, selector, context);
  },
  events : {
    /** Fired at each value change */
    "changeValue" : "Number"
  },
  members : {
    // overridden
    init : function(){

      if(!this.base(arguments)){

        return false;
      };
      this._updateSymbolLength();
      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(rating){

        if(rating.getAttribute("tabindex") < 0){

          rating.setAttribute("tabindex", 0);
        };
        rating.onWidget("focus", this._onFocus, rating).onWidget("blur", this._onBlur, rating).getChildren("span").addClasses([cssPrefix + "-item", cssPrefix + "-item-off"]).onWidget("click", this._onClick, rating);
      }.bind(this));
      return true;
    },
    /**
     * Sets the given value of the raining widget's in the collection. The value will be
     * converted to the maximum or minimum if our of range.
     *
     * @param value {Number} The value of the rating.
     * @return {qx.ui.website.Rating} <code>this</code> reference for chaining.
     */
    setValue : function(value){

      if(this.getValue() == value){

        return this;
      };
      if(value < 0){

        value = 0;
      };
      var cssPrefix = this.getCssPrefix();
      this._forEachElementWrapped(function(rating){

        var children = rating.getChildren("span");
        children.removeClass(cssPrefix + "-item-off");
        children.slice(value, children.length).addClass(cssPrefix + "-item-off");
        rating.emit("changeValue", rating.getValue());
      });
      return this;
    },
    /**
     * Reads the current value of the first rating widget in the collection
     * from the DOM and returns it.
     *
     * @return {Number} The current value.
     */
    getValue : function(){

      var cssPrefix = this.getCssPrefix();
      return this.eq(0).getChildren("span").not("." + cssPrefix + "-item-off").length;
    },
    // overridden
    render : function(){

      this._updateSymbolLength();
    },
    /**
     * Checks the set length and adds / removes spans containing the rating symbol.
     *
     * @return {qx.ui.website.Rating} <code>this</code> reference for chaining.
     */
    _updateSymbolLength : function(){

      var cssPrefix = this.getCssPrefix();
      var length = this.getConfig("length");
      this._forEachElementWrapped(function(el){

        var children = el.getChildren();
        children.setHtml(this.getConfig("symbol"));
        var diff = length - children.length;
        if(diff > 0){

          for(var i = 0;i < diff;i++){

            qxWeb.create("<span>" + this.getConfig("symbol") + "</span>").onWidget("click", el._onClick, el).addClasses([cssPrefix + "-item", cssPrefix + "-item-off"]).appendTo(el);
          };
        } else {

          for(var i = 0;i < Math.abs(diff);i++){

            el.getChildren().getLast().offWidget("click", el._onClick, el).remove();
          };
        };
      }.bind(this));
      return this;
    },
    /**
     * Click handler which updates the value depending on the clicked element.
     *
     * @param e {Event} The native click event.
     */
    _onClick : function(e){

      var parents = qxWeb(e.getTarget()).getParents();
      this.setValue(parents.getChildren().indexOf(e.getTarget()) + 1);
    },
    /**
     * Attaches the keydown listener.
     * @param e {Event} The native focus event.
     */
    _onFocus : function(e){

      qxWeb(document.documentElement).on("keydown", this._onKeyDown, this);
    },
    /**
     * Removes the keydown listener if the widget loses focus.
     *
     * @param e {Event} The native blur event.
     */
    _onBlur : function(e){

      qxWeb(document.documentElement).off("keydown", this._onKeyDown, this);
    },
    /**
     * Changes the value if the left or right arrow key is pressed.
     *
     * @param e {Event} The native keydown event.
     */
    _onKeyDown : function(e){

      var key = e.getKeyIdentifier();
      if(key === "Right"){

        this.setValue(this.getValue() + 1);
      } else if(key === "Left"){

        this.setValue(this.getValue() - 1);
      };
    },
    // overridden
    dispose : function(){

      this._forEachElementWrapped(function(rating){

        qxWeb(document.documentElement).off("keydown", this._onKeyDown, rating);
        rating.offWidget("focus", this._onFocus, rating).offWidget("blur", this._onBlur, rating);
        rating.getChildren("span").offWidget("click", rating._onClick, rating);
      });
      this.setHtml("");
      return this.base(arguments);
    }
  },
  defer : function(statics){

    qxWeb.$attach({
      rating : statics.rating
    });
  }
});


var exp = envinfo["qx.export"];
if (exp) {
  for (var name in exp) {
    var c = exp[name].split(".");
    var root = window;
    for (var i=0; i < c.length; i++) {
      root = root[c[i]];
    };
    window[name] = root;
  }
}

window["qx"] = undefined;
try {
  delete window.qx;
} catch(e) {}

})();
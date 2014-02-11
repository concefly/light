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
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Romeo Kenfack Tsakem (rkenfack)

************************************************************************ */
/**
 * Module for mediaqueries evaluation. The module is a wrapper for media.match.js,
 * that implements a polyfill for window.matchMedia when it's not supported natively.
 */
qx.Bootstrap.define("qx.module.MatchMedia", {
  statics : {
    /**
    * Evaluates the specified mediaquery list
    *
    * @param query {String} the media query to evaluate
    * @param ctxWindow {Object?window} the window object which should be operated on
    * @attachStatic {qxWeb, matchMedia}
    * @return {qx.bom.MediaQuery}  The media query
    */
    matchMedia : function(query, ctxWindow){

      return new qx.bom.MediaQuery(query, ctxWindow);
    }
  },
  defer : function(statics){

    qxWeb.$attachStatic({
      matchMedia : statics.matchMedia
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
     * Romeo Kenfack Tsakem (rkenfack)

   ======================================================================

   This class contains code from:

     Copyright:
       2012 WebLinc LLC, David Knight

     License:
       BSD: https://raw.github.com/weblinc/media-match/master/LICENSE.txt

     ----------------------------------------------------------------------

     Copyright (c) 2012 WebLinc LLC

     Permission is hereby granted, free of charge, to any person obtaining a copy
     of this software and associated documentation files (the "Software"), to deal
     in the Software without restriction, including without limitation the rights
     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the Software is
     furnished to do so, subject to the following conditions:

     The above copyright notice and this permission notice shall be included in
     all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     THE SOFTWARE.

************************************************************************ */
/**
 * This class is to test css media queries. It implements a polyfill for
 * window.matchMedia if not supported natively.
 */
qx.Bootstrap.define("qx.bom.MediaQuery", {
  extend : qx.event.Emitter,
  /**
   * @param query {String} the media query to evaluate
   * @param ctxWindow {Object?window} the window object which should be operated on
   */
  construct : function(query, ctxWindow){

    this.__ctxWindow = ctxWindow || window;
    this.__initMatchMedia(this.__ctxWindow);
    this.__mql = this.__ctxWindow.matchMedia(query);
    this.query = query;
    this.matches = this.__mql.matches;
    this.__init();
  },
  events : {
    /**
     * Fires each time the media query state changes. The event data is a map
     * with two keys:
     *
     * **query** The media query string
     *
     * **matches** A boolean that indicates whether the document
     * matches the query
     */
    "change" : "Map"
  },
  statics : {
    /**
    * The media.match.js version
    */
    version : "2.0.1"
  },
  members : {
    /**
    * The window object
    */
    __ctxWindow : null,
    /**
    * The mediaquery Listener
    */
    __mql : null,
    /**
    * Indicates if the document currently matches the media query list
    */
    matches : false,
    /**
    * The mediaquery list to be evaluated
    */
    query : null,
    /**
     * Returns the query string used to initialize the listener.
     * @return {String} The given query string.
     */
    getQuery : function(){

      return this.query;
    },
    /**
     * Access the matching state of the media query.
     * @return {Boolean} <code>true</code>, if the query matches.
     */
    isMatching : function(){

      return this.matches;
    },
    /**
    * Initialize the mediaquery listener
    */
    __init : function(){

      this.__mql.addListener(this.__changed.bind(this));
    },
    /**
    * Callback for mediaqueries changes
    */
    __changed : function(){

      this.matches = this.__mql.matches;
      this.emit("change", {
        matches : this.matches,
        query : this.query
      });
    },
    /**
     * Initialize matchMedia polyfill
     * @param window {Window} The window object matchMedia should be attached to
     */
    __initMatchMedia : function(window){

      /**
       * Below is the original media.match.js.
       * https://github.com/weblinc/media-match
       */
      /* MediaMatch v.2.0.1 - Testing css media queries in Javascript. Authors & copyright (c) 2013: WebLinc, David Knight. */
      window.matchMedia || (window.matchMedia = function(win){

        'use strict';
        // Internal globals
        var _doc = win.document,_viewport = _doc.documentElement,_queries = [],_queryID = 0,_type = '',_features = {
        },// only screen
        // only screen and
        // not screen
        // not screen and
        // screen
        // screen and
        _typeExpr = /\s*(only|not)?\s*(screen|print|[a-z\-]+)\s*(and)?\s*/i,// (-vendor-min-width: 300px)
        // (min-width: 300px)
        // (width: 300px)
        // (width)
        // (orientation: portrait|landscape)
        _mediaExpr = /^\s*\(\s*(-[a-z]+-)?(min-|max-)?([a-z\-]+)\s*(:?\s*([0-9]+(\.[0-9]+)?|portrait|landscape)(px|em|dppx|dpcm|rem|%|in|cm|mm|ex|pt|pc|\/([0-9]+(\.[0-9]+)?))?)?\s*\)\s*$/,_timer = 0,// Helper methods
        /*
            _matches
         */
        _matches = function(media){

          // screen and (min-width: 400px), screen and (max-width: 500px)
          var mql = (media.indexOf(',') !== -1 && media.split(',')) || [media],mqIndex = mql.length - 1,mqLength = mqIndex,mq = null,// not screen, screen
          negateType = null,negateTypeFound = '',negateTypeIndex = 0,negate = false,type = '',// (min-width: 400px), (min-width)
          exprListStr = '',exprList = null,exprIndex = 0,exprLength = 0,expr = null,prefix = '',length = '',unit = '',value = '',feature = '',match = false;
          if(media === ''){

            return true;
          };
          do {

            mq = mql[mqLength - mqIndex];
            negate = false;
            negateType = mq.match(_typeExpr);
            if(negateType){

              negateTypeFound = negateType[0];
              negateTypeIndex = negateType.index;
            };
            if(!negateType || ((mq.substring(0, negateTypeIndex).indexOf('(') === -1) && (negateTypeIndex || (!negateType[3] && negateTypeFound !== negateType.input)))){

              match = false;
              continue;
            };
            exprListStr = mq;
            negate = negateType[1] === 'not';
            if(!negateTypeIndex){

              type = negateType[2];
              exprListStr = mq.substring(negateTypeFound.length);
            };
            // Test media type
            // Test type against this device or if 'all' or empty ''
            match = type === _type || type === 'all' || type === '';
            exprList = (exprListStr.indexOf(' and ') !== -1 && exprListStr.split(' and ')) || [exprListStr];
            exprIndex = exprList.length - 1;
            exprLength = exprIndex;
            if(match && exprIndex >= 0 && exprListStr !== ''){

              do {

                expr = exprList[exprIndex].match(_mediaExpr);
                if(!expr || !_features[expr[3]]){

                  match = false;
                  break;
                };
                prefix = expr[2];
                length = expr[5];
                value = length;
                unit = expr[7];
                feature = _features[expr[3]];
                // Convert unit types
                if(unit){

                  if(unit === 'px'){

                    // If unit is px
                    value = Number(length);
                  } else if(unit === 'em' || unit === 'rem'){

                    // Convert relative length unit to pixels
                    // Assumed base font size is 16px
                    value = 16 * length;
                  } else if(expr[8]){

                    // Convert aspect ratio to decimal
                    value = (length / expr[8]).toFixed(2);
                  } else if(unit === 'dppx'){

                    // Convert resolution dppx unit to pixels
                    value = length * 96;
                  } else if(unit === 'dpcm'){

                    // Convert resolution dpcm unit to pixels
                    value = length * 0.3937;
                  } else {

                    // default
                    value = Number(length);
                  };;;;
                };
                // Test for prefix min or max
                // Test value against feature
                if(prefix === 'min-' && value){

                  match = feature >= value;
                } else if(prefix === 'max-' && value){

                  match = feature <= value;
                } else if(value){

                  match = feature === value;
                } else {

                  match = !!feature;
                };;
                // If 'match' is false, break loop
                // Continue main loop through query list
                if(!match){

                  break;
                };
              }while((exprIndex--));
            };
            // If match is true, break loop
            // Once matched, no need to check other queries
            if(match){

              break;
            };
          }while((mqIndex--));
          return negate ? !match : match;
        },/*
            _setFeature
         */
        _setFeature = function(){

          // Sets properties of '_features' that change on resize and/or orientation.
          var w = win.innerWidth || _viewport.clientWidth,h = win.innerHeight || _viewport.clientHeight,dw = win.screen.width,dh = win.screen.height,c = win.screen.colorDepth,x = win.devicePixelRatio;
          _features.width = w;
          _features.height = h;
          _features['aspect-ratio'] = (w / h).toFixed(2);
          _features['device-width'] = dw;
          _features['device-height'] = dh;
          _features['device-aspect-ratio'] = (dw / dh).toFixed(2);
          _features.color = c;
          _features['color-index'] = Math.pow(2, c);
          _features.orientation = (h >= w ? 'portrait' : 'landscape');
          _features.resolution = (x && x * 96) || win.screen.deviceXDPI || 96;
          _features['device-pixel-ratio'] = x || 1;
        },/*
            _watch
         */
        _watch = function(){

          clearTimeout(_timer);
          _timer = setTimeout(function(){

            var query = null,qIndex = _queryID - 1,qLength = qIndex,match = false;
            if(qIndex >= 0){

              _setFeature();
              do {

                query = _queries[qLength - qIndex];
                if(query){

                  match = _matches(query.mql.media);
                  if((match && !query.mql.matches) || (!match && query.mql.matches)){

                    query.mql.matches = match;
                    if(query.listeners){

                      for(var i = 0,il = query.listeners.length;i < il;i++){

                        if(query.listeners[i]){

                          query.listeners[i].call(win, query.mql);
                        };
                      };
                    };
                  };
                };
              }while((qIndex--));
            };
          }, 10);
        },/*
            _init
         */
        _init = function(){

          var head = _doc.getElementsByTagName('head')[0],style = _doc.createElement('style'),info = null,typeList = ['screen', 'print', 'speech', 'projection', 'handheld', 'tv', 'braille', 'embossed', 'tty'],typeIndex = 0,typeLength = typeList.length,cssText = '#mediamatchjs { position: relative; z-index: 0; }',eventPrefix = '',addEvent = win.addEventListener || (eventPrefix = 'on') && win.attachEvent;
          style.type = 'text/css';
          style.id = 'mediamatchjs';
          head.appendChild(style);
          // Must be placed after style is inserted into the DOM for IE
          info = (win.getComputedStyle && win.getComputedStyle(style)) || style.currentStyle;
          // Create media blocks to test for media type
          for(;typeIndex < typeLength;typeIndex++){

            cssText += '@media ' + typeList[typeIndex] + ' { #mediamatchjs { z-index: ' + typeIndex + ' } }';
          };
          // Add rules to style element
          if(style.styleSheet){

            style.styleSheet.cssText = cssText;
          } else {

            style.textContent = cssText;
          };
          // Get media type
          _type = typeList[(info.zIndex * 1) || 0];
          head.removeChild(style);
          _setFeature();
          // Set up listeners
          addEvent(eventPrefix + 'resize', _watch);
          addEvent(eventPrefix + 'orientationchange', _watch);
        };
        _init();
        /*
            A list of parsed media queries, ex. screen and (max-width: 400px), screen and (max-width: 800px)
        */
        return function(media){

          var id = _queryID,mql = {
            matches : false,
            media : media,
            addListener : function addListener(listener){

              _queries[id].listeners || (_queries[id].listeners = []);
              listener && _queries[id].listeners.push(listener);
            },
            removeListener : function removeListener(listener){

              var query = _queries[id],i = 0,il = 0;
              if(!query){

                return;
              };
              il = query.listeners.length;
              for(;i < il;i++){

                if(query.listeners[i] === listener){

                  query.listeners.splice(i, 1);
                };
              };
            }
          };
          if(media === ''){

            mql.matches = true;
            return mql;
          };
          mql.matches = _matches(media);
          _queryID = _queries.push({
            mql : mql,
            listeners : null
          });
          return mql;
        };
      }(window));
    }
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
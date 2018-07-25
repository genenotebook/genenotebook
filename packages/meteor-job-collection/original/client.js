/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//###########################################################################
//     Copyright (C) 2014-2017 by Vaughn Iverson
//     job-collection is free software released under the MIT/X11 license.
//     See included LICENSE file for details.
//###########################################################################

if (Meteor.isClient) {

  // This is a polyfill for bind(), added to make phantomjs 1.9.7 work
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
       if (typeof this !== "function") {
          // closest thing possible to the ECMAScript 5 internal IsCallable function
          throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

       const aArgs = Array.prototype.slice.call(arguments, 1);
       const fToBind = this;
       const fNOP = function() {};
       const fBound = function() {
          const func = (this instanceof fNOP && oThis) ? this : oThis;
          return fToBind.apply(func, aArgs.concat(Array.prototype.slice.call(arguments)));
        };

       fNOP.prototype = this.prototype;
       fBound.prototype = new fNOP();
       return fBound;
     };
  }

  //###############################################################
  //# job-collection client class

  class JobCollection extends share.JobCollectionBase {

    constructor(root, options) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this._toLog = this._toLog.bind(this);
      if (root == null) { root = 'queue'; }
      if (options == null) { options = {}; }
      if (!(this instanceof JobCollection)) {
        return new JobCollection(root, options);
      }

      // Call super's constructor
      super(root, options);

      this.logConsole = false;
      this.isSimulation = true;

      if (options.connection == null) {
        Meteor.methods(this._generateMethods());
      } else {
        options.connection.methods(this._generateMethods());
      }
    }

    _toLog(userId, method, message) {
      if (this.logConsole) {
        return console.log(`${new Date()}, ${userId}, ${method}, ${message}\n`);
      }
    }
  }
}

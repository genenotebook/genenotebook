/**
 * Copyright (C) 2014-2017 by Vaughn Iverson
 * job-collection is free software released under the MIT/X11 license.
 * See included LICENSE file for details.
 */
import { Meteor } from 'meteor/meteor';
import JobCollectionBase from './shared';

class JobCollection extends JobCollectionBase {
  constructor(root = 'queue', options = {}) {
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

  // Warning Stubs for server-only calls
  static allow() {
    throw new Error('Server-only function jc.allow() invoked on client.');
  }

  static deny() {
    throw new Error('Server-only function jc.deny() invoked on client.');
  }

  static promote() {
    throw new Error('Server-only function jc.promote() invoked on client.');
  }

  static setLogStream() {
    throw new Error(
      'Server-only function jc.setLogStream() invoked on client.',
    );
  }

  _toLog = (userId, method, message) => {
    if (this.logConsole) {
      return console.log(`${new Date()}, ${userId}, ${method}, ${message}\n`);
    }
  }
}

export default JobCollection;

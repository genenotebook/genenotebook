/**
 * Copyright (C) 2014-2017 by Vaughn Iverson
 * job-collection is free software released under the MIT/X11 license.
 * See included LICENSE file for details.
 */

import { Meteor } from "meteor/meteor";
//import Job from 'meteor-job';
import Job from "../meteor-job/lib/job_class.js";
import { EventEmitter } from "events";
import JobCollectionBase from "./shared";

const userHelper = function(user, connection) {
  if (!connection) {
    return "[SERVER]";
  }
  return user || "[UNAUTHENTICATED]";
};

const status = {
  WAITING: "waiting",
  PAUSED: "paused",
  READY: "ready",
  RUNNING: "running",
  FAILED: "failed",
  CANCELLED: "cancelled",
  COMPLETED: "completed"
};

class JobCollection extends JobCollectionBase {
  constructor(root = "queue", options = {}) {
    // Call super's constructor
    super(root, options);

    this.events = new EventEmitter();

    this._errorListener = this.events.on("error", this._onError.bind(this));

    // Add events for all individual successful DDP methods
    this._methodErrorDispatch = this.events.on("error", msg =>
      this.events.emit(msg.method, msg)
    );

    this._callListener = this.events.on("call", this._onCall.bind(this));

    // Add events for all individual successful DDP methods
    this._methodEventDispatch = this.events.on("call", msg =>
      this.events.emit(msg.method, msg)
    );

    this.stopped = true;

    // No client mutators allowed
    super.deny.bind(this)({
      update: () => true,
      insert: () => true,
      remove: () => true
    });

    this.promote();

    this.logStream = null;

    this.allows = {};
    this.denys = {};

    // Initialize allow/deny lists for permission levels and ddp methods
    this.ddpPermissionLevels.concat(this.ddpMethods).forEach(level => {
      this.allows[level] = [];
      this.denys[level] = [];
    });

    // If a connection option is given, then this JobCollection is actually hosted
    // remotely, so don't establish local and remotely callable server methods in that case
    if (!options.connection) {
      // Default indexes, only when not remotely connected!
      this._ensureIndex({ type: 1, status: 1 });
      this._ensureIndex({ priority: 1, retryUntil: 1, after: 1 });
      this._ensureIndex({ priority: 1, retryUntil: 1, after: 1 });
      this._ensureIndex({ status: 1, after: 1 });
      this._ensureIndex({ status: 1, expiresAfter: 1 });

      this.isSimulation = false;
      const localMethods = this._generateMethods();
      this._localServerMethods = this._localServerMethods || {};

      Object.keys(localMethods).forEach(methodName => {
        const methodFunction = localMethods[methodName];
        this._localServerMethods[methodName] = methodFunction;
      });

      this._ddp_apply = (name, params, cb) => {
        if (cb) {
          return Meteor.defer(() => {
            let result;
            try {
              result = this._localServerMethods[name].apply(this, params);
            } catch (e) {
              return cb(e);
            }
            return cb(null, result);
          });
        } else {
          return this._localServerMethods[name].apply(this, params);
        }
      };

      Job._setDDPApply(this._ddp_apply, root);

      Meteor.methods(localMethods);
    }
  }

  _onError(msg) {
    const user = userHelper(msg.userId, msg.connection);
    return this._toLog(user, msg.method, `${msg.error}`);
  }

  _onCall(msg) {
    const user = userHelper(msg.userId, msg.connection);
    this._toLog(user, msg.method, `params: ${JSON.stringify(msg.params)}`);
    return this._toLog(
      user,
      msg.method,
      `returned: ${JSON.stringify(msg.returnVal)}`
    );
  }

  _toLog(userId, method, message) {
    return (
      this.logStream &&
      this.logStream.write(`${new Date()}, ${userId}, ${method}, ${message}\n`)
    );
  }

  _emit(method, connection, userId, err, ret, ...params) {
    if (err) {
      return this.events.emit("error", {
        error: err,
        method,
        connection,
        userId,
        params,
        returnVal: null
      });
    } else {
      return this.events.emit("call", {
        error: null,
        method,
        connection,
        userId,
        params,
        returnVal: ret
      });
    }
  }

  _methodWrapper(method, func) {
    const permitted = (userId, params) => {
      const performTest = tests =>
        tests.find(
          test =>
            (Array.isArray(test) && test.includes(userId)) ||
            (typeof test === "function" && test(userId, method, params))
        );

      const performAllTests = allTests =>
        this.ddpMethodPermissions[method].find(t => performTest(allTests[t]));

      return !performAllTests(this.denys) && performAllTests(this.allows);
    };
    // Return the wrapper function that the Meteor method will actually invoke
    return (...params) => {
      let retval;
      try {
        if (!this.connection || !!permitted(this.userId, params)) {
          retval = func(...params);
        } else {
          throw new Meteor.Error(
            403,
            "Method not authorized",
            "Authenticated user is not permitted to invoke this method."
          );
        }
      } catch (error) {
        this._emit(method, this.connection, this.userId, error);
        throw error;
      }
      this._emit(method, this.connection, this.userId, null, retval, ...params);
      return retval;
    };
  }

  setLogStream(writeStream) {
    if (this.logStream) {
      throw new Error(
        "logStream may only be set once per job-collection startup/shutdown cycle"
      );
    }

    this.logStream = writeStream;

    if (
      !this.logStream ||
      typeof this.logStream.write === "function" ||
      typeof this.logStream.end === "function"
    ) {
      throw new Error("logStream must be a valid writable node.js Stream");
    }
  }

  // Register application allow rules
  allow(allowOptions) {
    Object.keys(allowOptions)
      .filter(t => this.allows.hasOwnProperty(t))
      .forEach(t => this.allows[t].push(allowOptions[t]));
  }

  // Register application deny rules
  deny(denyOptions) {
    Object.keys(denyOptions)
      .filter(t => this.denys.hasOwnProperty(t))
      .forEach(t => this.denys[t].push(denyOptions[t]));
  }

  _DDPMethod_startJobServer(options = {}) {
    check(options, {});
    if (this.stopped && this.stopped !== true) {
      Meteor.clearTimeout(this.stopped);
    }
    this.stopped = false;
  }

  _DDPMethod_shutdownJobServer({ timeout = 60 * 1000 } = {}) {
    check(timeout, Match.Where(this._validIntGTEOne));

    if (this.stopped && this.stopped !== true) {
      Meteor.clearTimeout(this.stopped);
    }

    this.stopped = Meteor.setTimeout(() => {
      const cursor = this.find(
        {
          status: status.RUNNING
        },
        {
          transform: null
        }
      );
      const failedJobs = cursor.count();
      if (failedJobs !== 0) {
        console.warn(`Failing ${failedJobs} jobs on queue stop.`);
      }
      cursor.forEach(d =>
        this._DDPMethod_jobFail(
          d._id,
          d.runId,
          "Running at Job Server shutdown."
        )
      );
      if (this.logStream != null) {
        // Shutting down closes the logStream!
        this.logStream.end();
        this.logStream = null;
        return this.logStream;
      }
    }, timeout);
  }

  _DDPMethod_getWork(type, { maxJobs = 1, workTimeout } = {}) {
    check(type, Match.OneOf(String, [String]));
    check(maxJobs, Match.Where(this._validIntGTEOne));
    check(workTimeout, Match.Optional(Match.Where(this._validIntGTEOne)));

    // Don't put out any more jobs while shutting down
    if (this.stopped) {
      return [];
    }

    // Support string types or arrays of string types
    if (typeof type === "string") {
      type = [type];
    }

    const time = new Date();
    let docs = [];
    const runId = this._makeNewID(); // This is meteor internal, but it will fail hard if it goes away.

    while (docs.length < maxJobs) {
      const ids = this.find(
        {
          type: {
            $in: type
          },
          status: status.READY,
          runId: null
        },
        {
          sort: {
            priority: 1,
            retryUntil: 1,
            after: 1
          },
          limit: maxJobs - docs.length, // never ask for more than is needed
          fields: {
            _id: 1
          },
          transform: null
        }
      ).map(d => d._id);

      if (!((ids != null ? ids.length : undefined) > 0)) {
        // Don't keep looping when there's no available work
        break;
      }

      const mods = {
        $set: {
          status: status.RUNNING,
          runId,
          updated: time
        },
        $inc: {
          retries: -1,
          retried: 1
        }
      };

      const logObj = JobCollectionBase._logMessage.running(runId);
      if (logObj) {
        mods.$push = { log: logObj };
      }

      if (typeof workTimeout === "number") {
        mods.$set.workTimeout = workTimeout;
        mods.$set.expiresAfter = new Date(time.valueOf() + workTimeout);
      } else {
        if (!mods.$unset) {
          mods.$unset = {};
        }
        mods.$unset.workTimeout = "";
        mods.$unset.expiresAfter = "";
      }

      const num = this.update(
        {
          _id: {
            $in: ids
          },
          status: status.READY,
          runId: null
        },
        mods,
        {
          multi: true
        }
      );

      if (num > 0) {
        let foundDocs = this.find(
          {
            _id: {
              $in: ids
            },
            runId
          },
          {
            fields: {
              log: 0,
              failures: 0,
              _private: 0
            },
            transform: null
          }
        ).fetch();

        if (foundDocs.length > 0) {
          if (this.scrub) {
            foundDocs = foundDocs.map(d => this.scrub(d));
          }
          check(docs, [this._validJobDoc()]);
          docs = [...docs, ...foundDocs];
        }
      }
    }
    // else
    //   console.warn 'getWork: find after update failed'
    return docs;
  }


  _DDPMethod_jobReady(ids, { force = false, time = new Date() } = {}) {
    check(ids, Match.OneOf(Match.Where(this._validId), [Match.Where(this._validId)]));
    check(force, Boolean);
    check(time, Date);

    const now = new Date();

    if (this._validId(ids)) {
      ids = [ids];
    }

    const query = {
      status: status.WAITING,
      after: {
        $lte: time
      }
    };

    const mods = {
      $set: {
        status: status.READY,
        updated: now
      }
    };

    if (ids.length > 0) {
      query._id = { $in: ids };
      mods.$set.after = now;
    }

    const logObj = [];

    if (force) {
      // Don't move to resolved, because they weren't!
      mods.$set.depends = [];
      const isForced = JobCollectionBase._logMessage.forced();
      if (isForced) {
        logObj.push(isForced);
      }
    } else {
      query.depends = { $size: 0 };
    }

    const readied = JobCollectionBase._logMessage.readied();
    if (readied) {
      logObj.push(readied);
    }

    if (logObj.length > 0) {
      mods.$push = {
        log: {
          $each: logObj
        }
      };
    }

    const num = this.update(query, mods, { multi: true });

    if (num > 0) {
      return true;
    } else {
      return false;
    }
  }

  // Hook function to sanitize documents before validating them in getWork() and getJob()
  scrub(job) {
    return job;
  }

  promote(milliseconds = 15 * 1000) {
    if (milliseconds == null) {
      milliseconds = 15 * 1000;
    }
    if (typeof milliseconds === "number" && milliseconds > 0) {
      if (this.interval) {
        Meteor.clearInterval(this.interval);
      }
      this._promote_jobs();
      this.interval = Meteor.setInterval(
        this._promote_jobs.bind(this),
        milliseconds
      );
      return this.interval;
    } else {
      return console.warn(
        `jobCollection.promote: invalid timeout: ${this.root}, ${milliseconds}`
      );
    }
  }

  _promote_jobs() {
    if (this.stopped) {
      return;
    }

    // This looks for zombie running jobs and autofails them
    this.find({ status: "running", expiresAfter: { $lt: new Date() } }).forEach(
      job =>
        new Job(this.root, job).fail(
          "Failed for exceeding worker set workTimeout"
        )
    );

    // Change jobs from waiting to ready when their time has come
    // and dependencies have been satisfied
    return this.readyJobs();
  }

  // Warning Stubs for client-only calls
  logConsole() {
    throw new Error("Client-only function jc.logConsole() invoked on server.");
  }
}

export default JobCollection;

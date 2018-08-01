/**
 * Copyright (C) 2014-2017 by Vaughn Iverson
 * job-collection is free software released under the MIT/X11 license.
 * See included LICENSE file for details.
 */


import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { Mongo } from "meteor/mongo";
//import Job from 'meteor-job';
import Job from "../meteor-job/lib/job_class.js";

const status = {
  WAITING: "waiting",
  PAUSED: "paused",
  READY: "ready",
  RUNNING: "running",
  FAILED: "failed",
  CANCELLED: "cancelled",
  COMPLETED: "completed"
};

const _validNumGTEZero = v => Match.test(v, Number) && v >= 0.0;

const _validNumGTZero = v => Match.test(v, Number) && v > 0.0;

const _validNumGTEOne = v => Match.test(v, Number) && v >= 1.0;

const _validIntGTEZero = v => _validNumGTEZero(v) && Math.floor(v) === v;

const _validIntGTEOne = v => _validNumGTEOne(v) && Math.floor(v) === v;

const _validStatus = v => Match.test(v, String) && Job.jobStatuses.includes(v);

const _validLogLevel = v =>
  Match.test(v, String) && Job.jobLogLevels.includes(v);

const _validRetryBackoff = v =>
  Match.test(v, String) && Job.jobRetryBackoffMethods.includes(v);

const _validId = v =>
  Match.test(v, Match.OneOf(String, Mongo.Collection.ObjectID));

const _validLog = () => [
  {
    time: Date,
    runId: Match.OneOf(Match.Where(_validId), null),
    level: Match.Where(_validLogLevel),
    message: String,
    data: Match.Optional(Object)
  }
];

const _validProgress = () => ({
  completed: Match.Where(_validNumGTEZero),
  total: Match.Where(_validNumGTEZero),
  percent: Match.Where(_validNumGTEZero)
});

const _validLaterJSObj = () => ({
  schedules: [Object],
  exceptions: Match.Optional([Object])
});

const _validJobDoc = () => ({
  _id: Match.Optional(Match.OneOf(Match.Where(_validId), null)),
  runId: Match.OneOf(Match.Where(_validId), null),
  type: String,
  status: Match.Where(_validStatus),
  data: Object,
  result: Match.Optional(Object),
  failures: Match.Optional([Object]),
  priority: Match.Integer,
  depends: [Match.Where(_validId)],
  resolved: [Match.Where(_validId)],
  after: Date,
  updated: Date,
  workTimeout: Match.Optional(Match.Where(_validIntGTEOne)),
  expiresAfter: Match.Optional(Date),
  log: Match.Optional(_validLog()),
  progress: _validProgress(),
  retries: Match.Where(_validIntGTEZero),
  retried: Match.Where(_validIntGTEZero),
  repeatRetries: Match.Optional(Match.Where(_validIntGTEZero)),
  retryUntil: Date,
  retryWait: Match.Where(_validIntGTEZero),
  retryBackoff: Match.Where(_validRetryBackoff),
  repeats: Match.Where(_validIntGTEZero),
  repeated: Match.Where(_validIntGTEZero),
  repeatUntil: Date,
  repeatWait: Match.OneOf(
    Match.Where(_validIntGTEZero),
    Match.Where(_validLaterJSObj)
  ),
  created: Date
});

class JobCollectionBase extends Mongo.Collection {
  static initClass() {
    this.prototype._validNumGTEZero = _validNumGTEZero;
    this.prototype._validNumGTZero = _validNumGTZero;
    this.prototype._validNumGTEOne = _validNumGTEOne;
    this.prototype._validIntGTEZero = _validIntGTEZero;
    this.prototype._validIntGTEOne = _validIntGTEOne;
    this.prototype._validStatus = _validStatus;
    this.prototype._validLogLevel = _validLogLevel;
    this.prototype._validRetryBackoff = _validRetryBackoff;
    this.prototype._validId = _validId;
    this.prototype._validLog = _validLog;
    this.prototype._validProgress = _validProgress;
    this.prototype._validJobDoc = _validJobDoc;

    this.prototype.jobLogLevels = Job.jobLogLevels;
    this.prototype.jobPriorities = Job.jobPriorities;
    this.prototype.jobStatuses = Job.jobStatuses;
    this.prototype.jobStatusCancellable = Job.jobStatusCancellable;
    this.prototype.jobStatusPausable = Job.jobStatusPausable;
    this.prototype.jobStatusRemovable = Job.jobStatusRemovable;
    this.prototype.jobStatusRestartable = Job.jobStatusRestartable;
    this.prototype.forever = Job.forever;
    this.prototype.foreverDate = Job.foreverDate;

    this.prototype.ddpMethods = Job.ddpMethods;
    this.prototype.ddpPermissionLevels = Job.ddpPermissionLevels;
    this.prototype.ddpMethodPermissions = Job.ddpMethodPermissions;

    this.prototype.jobDocPattern = _validJobDoc();
  }

  static _createLogEntry(
    message = "",
    runId = null,
    level = "info",
    time = new Date()
  ) {
    return {
      time,
      runId,
      message,
      level
    };
  }

  constructor(root = "queue", options = {}) {
    let collectionName = root;
    if (!options.noCollectionSuffix) {
      collectionName += ".jobs";
    }

    // Remove non-standard options before
    // calling Mongo.Collection constructor
    const { later } = options;
    delete options.later;
    delete options.noCollectionSuffix;

    Job.setDDP(options.connection, root);

    // Call super's constructor
    super(collectionName, options);

    this.root = root;
    this.later = later;
  }

  processJobs(...params) {
    return new Job.processJobs(this.root, ...params);
  }

  getJob(...params) {
    return Job.getJob(this.root, ...params);
  }
  getWork(...params) {
    return Job.getWork(this.root, ...params);
  }
  getJobs(...params) {
    return Job.getJobs(this.root, ...params);
  }
  readyJobs(...params) {
    return Job.readyJobs(this.root, ...params);
  }
  cancelJobs(...params) {
    return Job.cancelJobs(this.root, ...params);
  }
  pauseJobs(...params) {
    return Job.pauseJobs(this.root, ...params);
  }
  resumeJobs(...params) {
    return Job.resumeJobs(this.root, ...params);
  }
  restartJobs(...params) {
    return Job.restartJobs(this.root, ...params);
  }
  removeJobs(...params) {
    return Job.removeJobs(this.root, ...params);
  }

  setDDP(...params) {
    return Job.setDDP(...params);
  }

  startJobServer(...params) {
    return Job.startJobServer(this.root, ...params);
  }

  shutdownJobServer(...params) {
    return Job.shutdownJobServer(this.root, ...params);
  }

  _methodWrapper(method, func) {
    const toLog = this._toLog;
    const unblockDDPMethods = this._unblockDDPMethods
      ? this._unblockDDPMethods
      : false;
    // Return the wrapper function that the Meteor method will actually invoke
    return function(...params) {
      const user = this.userId ? this.userId : "[UNAUTHENTICATED]";
      toLog(user, method, `params: ${JSON.stringify(params)}`);
      if (unblockDDPMethods) {
        this.unblock();
      }
      const retval = func(...params);
      toLog(user, method, `returned: ${JSON.stringify(retval)}`);
      return retval;
    };
  }

  _generateMethods() {
    const methodsOut = {};
    const methodPrefix = "_DDPMethod_";
    this.ddpMethods.forEach(methodName => {
      const methodFunc = this[methodPrefix + methodName];
      if (typeof methodFunc === "function") {
        methodsOut[`${this.root}_${methodName}`] = this._methodWrapper(
          methodName,
          methodFunc.bind(this)
        );
      }
    });

    //console.log(Object.keys(methodsOut));
    return methodsOut;
  }

  _idsOfDeps(ids, antecedents, dependents, jobStatuses) {
    // Cancel the entire tree of antecedents and/or dependents
    // Dependents: jobs that list one of the ids in their depends list
    // Antecedents: jobs with an id listed in the depends list of one of the jobs in ids
    const dependsQuery = [];
    const dependsIds = [];

    if (dependents) {
      dependsQuery.push({
        depends: {
          $elemMatch: {
            $in: ids
          }
        }
      });
    }

    if (antecedents) {
      let antsArray = this.find(
        {
          _id: {
            $in: ids
          }
        },
        {
          fields: {
            depends: 1
          },
          transform: null
        }
      )
        .find()
        .reduce((acc, d) => [...acc, ...d.depends], []);

      antsArray = [...new Set(antsArray)];

      if (antsArray.length > 0) {
        dependsQuery.push({
          _id: {
            $in: antsArray
          }
        });
      }
    }
    if (dependsQuery.length > 0) {
      this.find(
        {
          status: {
            $in: jobStatuses
          },
          $or: dependsQuery
        },
        {
          fields: {
            _id: 1
          },
          transform: null
        }
      ).forEach(function(d) {
        if (!dependsIds.includes(d._id)) {
          return dependsIds.push(d._id);
        }
      });
    }
    return dependsIds;
  }

  _rerun_job(doc, repeats, wait, repeatUntil) {
    // Repeat? if so, make a new job from the old one
    if (repeats == null) {
      repeats = doc.repeats - 1;
    }
    if (wait == null) {
      wait = doc.repeatWait;
    }
    if (repeatUntil == null) {
      ({ repeatUntil } = doc);
    }
    const id = doc._id;
    const { runId } = doc;
    const time = new Date();
    delete doc._id;
    delete doc.result;
    delete doc.failures;
    delete doc.expiresAfter;
    delete doc.workTimeout;
    doc.runId = null;
    doc.status = status.WAITING;
    doc.repeatRetries =
      doc.repeatRetries != null ? doc.repeatRetries : doc.retries + doc.retried;
    doc.retries = doc.repeatRetries;
    if (doc.retries > this.forever) {
      doc.retries = this.forever;
    }
    doc.retryUntil = repeatUntil;
    doc.retried = 0;
    doc.repeats = repeats;
    if (doc.repeats > this.forever) {
      doc.repeats = this.forever;
    }
    doc.repeatUntil = repeatUntil;
    doc.repeated += 1;
    doc.updated = time;
    doc.created = time;
    doc.progress = {
      completed: 0,
      total: 1,
      percent: 0
    };
    const logObj = JobCollectionBase._logMessage.rerun(id, runId);

    if (logObj) {
      doc.log = [logObj];
    } else {
      doc.log = [];
    }

    doc.after = new Date(time.valueOf() + wait);
    const jobId = this.insert(doc);
    if (jobId) {
      this._DDPMethod_jobReady(jobId);
      return jobId;
    } else {
      console.warn("Job rerun/repeat failed to reschedule!", id, runId);
    }
    return null;
  }

  _checkDeps(job, dryRun) {
    if (dryRun == null) {
      dryRun = true;
    }
    let cancel = false;
    const resolved = [];
    const failed = [];
    const cancelled = [];
    let removed = [];
    const log = [];
    if (job.depends.length > 0) {
      const deps = this.find(
        { _id: { $in: job.depends } },
        { fields: { _id: 1, runId: 1, status: 1 } }
      ).fetch();

      if (deps.length !== job.depends.length) {
        const foundIds = deps.map(d => d._id);
        removed = job.depends.filter(j => !foundIds.includes(j));
        if (!dryRun) {
          removed.forEach(j =>
            this._DDPMethod_jobLog(
              job._id,
              null,
              `Antecedent job ${j} missing at save`
            )
          );
        }
        cancel = true;
      }

      for (const depJob of deps) {
        if (!this.jobStatusCancellable.includes(depJob.status)) {
          switch (depJob.status) {
            case status.COMPLETED:
              resolved.push(depJob._id);
              log.push(
                JobCollectionBase._logMessage.resolved(depJob._id, depJob.runId)
              );
              break;
            case status.FAILED:
              cancel = true;
              failed.push(depJob._id);
              if (!dryRun) {
                this._DDPMethod_jobLog(
                  job._id,
                  null,
                  "Antecedent job failed before save"
                );
              }
              break;
            case status.CANCELLED:
              cancel = true;
              cancelled.push(depJob._id);
              if (!dryRun) {
                this._DDPMethod_jobLog(
                  job._id,
                  null,
                  "Antecedent job cancelled before save"
                );
              }
              break;
            default:
              throw new Meteor.Error(
                "Unknown status in jobSave Dependency check"
              );
          }
        }
      }

      if (resolved.length !== 0 && !dryRun) {
        const mods = {
          $pull: {
            depends: {
              $in: resolved
            }
          },
          $push: {
            resolved: {
              $each: resolved
            },
            log: {
              $each: log
            }
          }
        };

        const n = this.update(
          {
            _id: job._id,
            status: status.WAITING
          },
          mods
        );

        if (!n) {
          console.warn(
            `Update for job ${job._id} during dependency check failed.`
          );
        }
      }

      if (cancel && !dryRun) {
        this._DDPMethod_jobCancel(job._id);
        return false;
      }
    }

    if (dryRun) {
      if (cancel || resolved.length > 0) {
        return {
          jobId: job._id,
          resolved,
          failed,
          cancelled,
          removed
        };
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  _DDPMethod_startJobServer() {
    return true;
  }

  _DDPMethod_shutdownJobServer() {
    return true;
  }

  _DDPMethod_getJob(ids, { getLog = false, getFailures = false } = {}) {
    check(ids, Match.OneOf(Match.Where(_validId), [Match.Where(_validId)]));
    check(getLog, Boolean);
    check(getFailures, Boolean);

    let single = false;
    if (_validId(ids)) {
      ids = [ids];
      single = true;
    }

    if (ids.length === 0) {
      return null;
    }

    const fields = { _private: 0 };
    if (!getLog) {
      fields.log = 0;
    }
    if (!getFailures) {
      fields.failures = 0;
    }

    let docs = this.find(
      {
        _id: {
          $in: ids
        }
      },
      {
        fields,
        transform: null
      }
    ).fetch();
    if (docs != null ? docs.length : undefined) {
      if (this.scrub != null) {
        docs = docs.map(d => this.scrub(d));
      }
      check(docs, [_validJobDoc()]);
      if (single) {
        return docs[0];
      } else {
        return docs;
      }
    }
    return null;
  }

  _DDPMethod_getWork() {}

  _DDPMethod_jobRemove(ids, options = {}) {
    check(ids, Match.OneOf(Match.Where(_validId), [Match.Where(_validId)]));
    check(options, {});

    if (_validId(ids)) {
      ids = [ids];
    }
    if (ids.length === 0) {
      return false;
    }
    const num = this.remove({
      _id: {
        $in: ids
      },
      status: {
        $in: this.jobStatusRemovable
      }
    });
    if (num > 0) {
      return true;
    } else {
      console.warn("jobRemove failed");
    }
    return false;
  }

  _DDPMethod_jobPause(ids, options = {}) {
    check(ids, Match.OneOf(Match.Where(_validId), [Match.Where(_validId)]));
    check(options, {});

    if (_validId(ids)) {
      ids = [ids];
    }
    if (ids.length === 0) {
      return false;
    }
    const time = new Date();

    const mods = {
      $set: {
        status: status.PAUSED,
        updated: time
      }
    };

    const logObj = JobCollectionBase._logMessage.paused();
    if (logObj) {
      mods.$push = { log: logObj };
    }

    const num = this.update(
      {
        _id: {
          $in: ids
        },
        status: {
          $in: this.jobStatusPausable
        }
      },
      mods,
      {
        multi: true
      }
    );
    if (num > 0) {
      return true;
    } else {
      console.warn("jobPause failed");
    }
    return false;
  }

  _DDPMethod_jobResume(ids, options = {}) {
    check(ids, Match.OneOf(Match.Where(_validId), [Match.Where(_validId)]));
    check(options, {});
    if (_validId(ids)) {
      ids = [ids];
    }
    if (ids.length === 0) {
      return false;
    }
    const time = new Date();
    const mods = {
      $set: {
        status: "waiting",
        updated: time
      }
    };

    const logObj = JobCollectionBase._logMessage.resumed();
    if (logObj) {
      mods.$push = { log: logObj };
    }

    const num = this.update(
      {
        _id: {
          $in: ids
        },
        status: status.PAUSED,
        updated: {
          $ne: time
        }
      },
      mods,
      { multi: true }
    );
    if (num > 0) {
      this._DDPMethod_jobReady(ids);
      return true;
    } else {
      console.warn("jobResume failed");
    }
    return false;
  }

  _DDPMethod_jobReady() {
    // Don't simulate jobReady. It has a strong chance of causing issues with
    // Meteor on the client, particularly if an observeChanges() is triggering
    // a processJobs queue (which in turn sets timers.)
  }

  _DDPMethod_jobCancel(ids, { dependents = true, antecedents = false } = {}) {
    check(ids, Match.OneOf(Match.Where(_validId), [Match.Where(_validId)]));
    check(antecedents, Match.Optional(Boolean));
    check(dependents, Match.Optional(Boolean));

    if (_validId(ids)) {
      ids = [ids];
    }

    if (ids.length === 0) {
      return false;
    }

    const time = new Date();

    const mods = {
      $set: {
        status: status.CANCELLED,
        runId: null,
        progress: {
          completed: 0,
          total: 1,
          percent: 0
        },
        updated: time
      }
    };

    const logObj = JobCollectionBase._logMessage.cancelled();
    if (logObj) {
      mods.$push = { log: logObj };
    }

    const num = this.update(
      {
        _id: {
          $in: ids
        },
        status: {
          $in: this.jobStatusCancellable
        }
      },
      mods,
      { multi: true }
    );
    // Cancel the entire tree of dependents
    const cancelIds = this._idsOfDeps(
      ids,
      antecedents,
      dependents,
      this.jobStatusCancellable
    );

    let depsCancelled = false;
    if (cancelIds.length > 0) {
      depsCancelled = this._DDPMethod_jobCancel(cancelIds, {
        antecedents,
        dependents
      });
    }

    if (num > 0 || depsCancelled) {
      return true;
    } else {
      console.warn("jobCancel failed");
    }
    return false;
  }

  _DDPMethod_jobRestart(
    ids,
    { retries = 1, until, dependents = false, antecedents = true } = {}
  ) {
    check(ids, Match.OneOf(Match.Where(_validId), [Match.Where(_validId)]));
    check(retries, Match.Where(_validIntGTEZero));
    check(until, Match.Optional(Date));
    check(antecedents, Boolean);
    check(dependents, Boolean);

    retries = Math.min(retries, this.forever);

    if (_validId(ids)) {
      ids = [ids];
    }

    if (ids.length === 0) {
      return false;
    }
    const time = new Date();

    const query = {
      _id: {
        $in: ids
      },
      status: {
        $in: this.jobStatusRestartable
      }
    };

    const mods = {
      $set: {
        status: status.WAITING,
        progress: {
          completed: 0,
          total: 1,
          percent: 0
        },
        updated: time
      },
      $inc: {
        retries
      }
    };

    const logObj = JobCollectionBase._logMessage.restarted();
    if (logObj) {
      mods.$push = { log: logObj };
    }

    if (until) {
      mods.$set.retryUntil = until;
    }

    const num = this.update(query, mods, { multi: true });

    // Restart the entire tree of dependents
    const restartIds = this._idsOfDeps(
      ids,
      antecedents,
      dependents,
      this.jobStatusRestartable
    );

    let depsRestarted = false;
    if (restartIds.length > 0) {
      depsRestarted = this._DDPMethod_jobRestart(restartIds, {
        retries,
        antecedents,
        dependents
      });
    }

    if (num > 0 || depsRestarted) {
      this._DDPMethod_jobReady(ids);
      return true;
    } else {
      console.warn("jobRestart failed");
    }
    return false;
  }

  // Job creator methods

  _DDPMethod_jobSave(doc, { cancelRepeats = false } = {}) {
    check(doc, _validJobDoc());
    check(cancelRepeats, Boolean);
    check(
      doc.status,
      Match.Where(
        v =>
          Match.test(v, String) && [status.WAITING, status.PAUSED].includes(v)
      )
    );

    if (doc.repeats > this.forever) {
      doc.repeats = this.forever;
    }
    if (doc.retries > this.forever) {
      doc.retries = this.forever;
    }

    const time = new Date();

    // This enables the default case of 'run immediately' to
    // not be impacted by a client's clock
    if (doc.after < time) {
      doc.after = time;
    }
    if (doc.retryUntil < time) {
      doc.retryUntil = time;
    }
    if (doc.repeatUntil < time) {
      doc.repeatUntil = time;
    }

    // If doc.repeatWait is a later.js object, then don't run before
    // the first valid scheduled time that occurs after doc.after
    if (this.later && typeof doc.repeatWait !== "number") {
      // Using a workaround to find next time after doc.after.
      // See: https://github.com/vsivsi/meteor-job-collection/issues/217
      const schedule = this.later.schedule(doc.repeatWait);
      const next = schedule.next(2, schedule.prev(1, doc.after))[1];
      if (!schedule || !next) {
        console.warn(
          `No valid available later.js times in schedule after ${doc.after}`
        );
        return null;
      }
      const nextDate = new Date(next);
      if (!(nextDate <= doc.repeatUntil)) {
        console.warn(
          `No valid available later.js times in schedule before ${
            doc.repeatUntil
          }`
        );
        return null;
      }
      doc.after = nextDate;
    } else if (!this.later && doc.repeatWait !== "number") {
      console.warn("Later.js not loaded...");
      return null;
    }

    if (doc._id) {
      const mods = {
        $set: {
          status: status.WAITING,
          data: doc.data,
          retries: doc.retries,
          repeatRetries:
            doc.repeatRetries != null
              ? doc.repeatRetries
              : doc.retries + doc.retried,
          retryUntil: doc.retryUntil,
          retryWait: doc.retryWait,
          retryBackoff: doc.retryBackoff,
          repeats: doc.repeats,
          repeatUntil: doc.repeatUntil,
          repeatWait: doc.repeatWait,
          depends: doc.depends,
          priority: doc.priority,
          after: doc.after,
          updated: time
        }
      };

      const logObj = JobCollectionBase._logMessage.resubmitted();
      if (logObj) {
        mods.$push = { log: logObj };
      }

      const num = this.update(
        {
          _id: doc._id,
          status: status.PAUSED,
          runId: null
        },
        mods
      );

      if (num && this._checkDeps(doc, false)) {
        this._DDPMethod_jobReady(doc._id);
        return doc._id;
      } else {
        return null;
      }
    } else {
      if (doc.repeats === this.forever && cancelRepeats) {
        // If this is unlimited repeating job, then cancel any existing jobs of the same type
        this.find(
          {
            type: doc.type,
            status: {
              $in: this.jobStatusCancellable
            }
          },
          {
            transform: null
          }
        ).forEach(d => this._DDPMethod_jobCancel(d._id));
      }
      doc.created = time;
      doc.log.push(JobCollectionBase._logMessage.submitted());
      doc._id = this.insert(doc);
      if (doc._id && this._checkDeps(doc, false)) {
        this._DDPMethod_jobReady(doc._id);
        return doc._id;
      } else {
        return null;
      }
    }
  }

  // Worker methods
  _DDPMethod_jobProgress(id, runId, completed, total, options = {}) {
    check(id, Match.Where(_validId));
    check(runId, Match.Where(_validId));
    check(completed, Match.Where(_validNumGTEZero));
    check(total, Match.Where(_validNumGTZero));
    check(options, Match.Optional({}));

    // Notify the worker to stop running if we are shutting down
    if (this.stopped) {
      return null;
    }

    const progress = {
      completed,
      total,
      percent: 100 * completed / total
    };

    check(
      progress,
      Match.Where(
        v => v.total >= v.completed && (v.percent >= 0 && v.percent <= 100)
      )
    );

    const time = new Date();

    const job = this.findOne({ _id: id }, { fields: { workTimeout: 1 } });

    const mods = {
      $set: {
        progress,
        updated: time
      }
    };

    if (job && job.hasOwnProperty("workTimeout")) {
      mods.$set.expiresAfter = new Date(time.valueOf() + job.workTimeout);
    }

    const num = this.update(
      {
        _id: id,
        runId,
        status: status.RUNNING
      },
      mods
    );

    if (num === 1) {
      return true;
    } else {
      console.warn("jobProgress failed");
    }
    return false;
  }

  _DDPMethod_jobLog(id, runId, message, options = {}) {
    check(id, Match.Where(_validId));
    check(runId, Match.OneOf(Match.Where(_validId), null));
    check(message, String);
    check(
      options,
      Match.Optional({
        level: Match.Optional(Match.Where(_validLogLevel)),
        data: Match.Optional(Object)
      })
    );

    const time = new Date();
    const logObj = {
      time,
      runId,
      level: options.level || "info",
      message
    };

    if (options.data) {
      logObj.data = options.data;
    }

    const job = this.findOne(
      { _id: id },
      { fields: { status: 1, workTimeout: 1 } }
    );

    const mods = {
      $push: {
        log: logObj
      },
      $set: {
        updated: time
      }
    };

    if (
      job &&
      job.hasOwnProperty("workTimeout") &&
      job.status === status.RUNNING
    ) {
      mods.$set.expiresAfter = new Date(time.valueOf() + job.workTimeout);
    }

    const num = this.update(
      {
        _id: id
      },
      mods
    );
    if (num === 1) {
      return true;
    } else {
      console.warn("jobLog failed");
    }
    return false;
  }

  _DDPMethod_jobRerun(id, { repeats = 0, wait = 0, until } = {}) {
    check(id, Match.Where(_validId));
    check(repeats, Match.Optional(Match.Where(_validIntGTEZero)));
    check(until, Match.Optional(Date));
    check(
      wait,
      Match.OneOf(Match.Where(_validIntGTEZero), Match.Where(_validLaterJSObj))
    );

    const doc = this.findOne(
      {
        _id: id,
        status: status.COMPLETED
      },
      {
        fields: {
          result: 0,
          failures: 0,
          log: 0,
          progress: 0,
          updated: 0,
          after: 0,
          status: 0
        },
        transform: null
      }
    );

    if (doc) {
      repeats = Math.min(repeats, this.forever);
      until = until || doc.repeatUntil;
      return this._rerun_job(doc, repeats, wait, until);
    }

    return false;
  }

  _DDPMethod_jobDone = (id, runId, result, { repeatId = false, delayDeps = 0 } = {}) => {
    check(id, Match.Where(_validId));
    check(runId, Match.Where(_validId));
    check(result, Object);
    check(repeatId, Boolean);
    check(delayDeps, Match.Where(this._validIntGTEZero));

    const time = new Date();
    const doc = this.findOne(
      {
        _id: id,
        runId,
        status: status.RUNNING
      },
      {
        fields: {
          log: 0,
          failures: 0,
          updated: 0,
          after: 0,
          status: 0
        },
        transform: null
      }
    );

    if (!doc) {
      if (!this.isSimulation) {
        console.warn("Running job not found", id, runId);
      }
      return false;
    }

    let mods = {
      $set: {
        status: status.COMPLETED,
        result,
        progress: {
          completed: doc.progress.total || 1,
          total: doc.progress.total || 1,
          percent: 100
        },
        updated: time
      }
    };

    const logObj = JobCollectionBase._logMessage.completed(runId);
    if (logObj) {
      mods.$push = { log: logObj };
    }

    const num = this.update(
      {
        _id: id,
        runId,
        status: status.RUNNING
      },
      mods
    );

    if (num === 1) {
      let jobId;
      if (doc.repeats > 0) {
        if (typeof doc.repeatWait === "number") {
          if (doc.repeatUntil - doc.repeatWait >= time) {
            jobId = this._rerun_job(doc);
          }
        } else {
          // This code prevents a job that just ran and finished
          // instantly from being immediately rerun on the same occurance
          const next =
            this.later != null
              ? this.later.schedule(doc.repeatWait).next(2)
              : undefined;
          if (next && next.length > 0) {
            let d = new Date(next[0]);
            if (d - time > 500 || next.length > 1) {
              if (d - time <= 500) {
                d = new Date(next[1]);
              }
              const wait = d - time;
              if (doc.repeatUntil - wait >= time) {
                jobId = this._rerun_job(doc, doc.repeats - 1, wait);
              }
            }
          }
        }
      }

      // Resolve depends
      const ids = this.find(
        {
          depends: {
            $all: [id]
          }
        },
        {
          transform: null,
          fields: {
            _id: 1
          }
        }
      )
        .fetch()
        .map(d => d._id);

      if (ids.length > 0) {
        mods = {
          $pull: {
            depends: id
          },
          $push: {
            resolved: id
          }
        };

        if (delayDeps != null) {
          const after = new Date(time.valueOf() + delayDeps);
          mods.$max = { after };
        }

        const idLogObj = JobCollectionBase._logMessage.resolved(id, runId);
        if (logObj) {
          mods.$push.log = idLogObj;
        }

        const n = this.update(
          {
            _id: {
              $in: ids
            }
          },
          mods,
          {
            multi: true
          }
        );
        if (n !== ids.length) {
          console.warn(
            `Not all dependent jobs were resolved ${ids.length} > ${n}`
          );
        }
        // Try to promote any jobs that just had a dependency resolved
        this._DDPMethod_jobReady(ids);
      }

      if (repeatId && jobId != null) {
        return jobId;
      } else {
        return true;
      }
    } else {
      console.warn("jobDone failed");
    }
    return false;
  }

  _DDPMethod_jobFail(id, runId, err, { fatal = false } = {}) {
    check(id, Match.Where(_validId));
    check(runId, Match.Where(_validId));
    check(err, Object);
    check(fatal, Boolean);

    const time = new Date();
    const doc = this.findOne(
      {
        _id: id,
        runId,
        status: status.RUNNING
      },
      {
        fields: {
          log: 0,
          failures: 0,
          progress: 0,
          updated: 0,
          after: 0,
          runId: 0,
          status: 0
        },
        transform: null
      }
    );

    if (!doc) {
      if (!this.isSimulation) {
        console.warn("Running job not found", id, runId);
      }
      return false;
    }

    const after = () => {
      const waitingFactor =
        doc.retryBackoff === "exponential" ? 2 ** (doc.retried - 1) : 1;

      return new Date(time.valueOf() + doc.retryWait * waitingFactor);
    };

    const newStatus =
      !fatal && doc.retries > 0 && doc.retryUntil >= after
        ? status.WAITING
        : status.FAILED;

    // Link each failure to the run that generated it.
    err.runId = runId;

    const mods = {
      $set: {
        status: newStatus,
        runId: null,
        after,
        updated: time
      },
      $push: {
        failures: err
      }
    };

    const logObj = JobCollectionBase._logMessage.failed(
      runId,
      newStatus === status.FAILED,
      err
    );
    if (logObj) {
      mods.$push.log = logObj;
    }

    const num = this.update(
      {
        _id: id,
        runId,
        status: status.RUNNING
      },
      mods
    );

    if (newStatus === status.FAILED && num === 1) {
      // Cancel any dependent jobs too
      this.find(
        {
          depends: {
            $all: [id]
          }
        },
        {
          transform: null
        }
      ).forEach(d => this._DDPMethod_jobCancel(d._id));
    }

    if (num === 1) {
      return true;
    } else {
      console.warn("jobFail failed");
    }
    return false;
  }
}

JobCollectionBase._logMessage = {
  readied() {
    return JobCollectionBase._createLogEntry("Promoted to ready");
  },
  forced() {
    return JobCollectionBase._createLogEntry(
      "Dependencies force resolved",
      null,
      "warning"
    );
  },
  rerun(id, runId) {
    return JobCollectionBase._createLogEntry(
      "Rerunning job",
      null,
      "info",
      new Date(),
      { previousJob: { id, runId } }
    );
  },
  running(runId) {
    return JobCollectionBase._createLogEntry("Job Running", runId);
  },
  paused() {
    return JobCollectionBase._createLogEntry("Job Paused");
  },
  resumed() {
    return JobCollectionBase._createLogEntry("Job Resumed");
  },
  cancelled() {
    return JobCollectionBase._createLogEntry("Job Cancelled", null, "warning");
  },
  restarted() {
    return JobCollectionBase._createLogEntry("Job Restarted");
  },
  resubmitted() {
    return JobCollectionBase._createLogEntry("Job Resubmitted");
  },
  submitted() {
    return JobCollectionBase._createLogEntry("Job Submitted");
  },
  completed(runId) {
    return JobCollectionBase._createLogEntry("Job Completed", runId, "success");
  },
  resolved(id, runId) {
    return JobCollectionBase._createLogEntry(
      "Dependency resolved",
      null,
      "info",
      new Date(),
      { dependency: { id, runId } }
    );
  },
  failed(runId, fatal, err) {
    const { value } = err;
    const msg = `Job Failed with${fatal ? " Fatal" : ""} Error${
      typeof value === "string" ? `: ${value}` : ""
    }.`;
    const level = fatal ? "danger" : "warning";
    return JobCollectionBase._createLogEntry(msg, runId, level);
  }
};

JobCollectionBase.initClass();

// Share these methods so they'll be available on server and client

export default JobCollectionBase;

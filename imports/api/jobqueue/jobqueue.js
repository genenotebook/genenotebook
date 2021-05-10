import { Meteor } from 'meteor/meteor';

import { JobCollection, Job } from 'meteor/local:job-collection';
import later from 'meteor-later';

const jobQueue = new JobCollection('jobQueue',
  { noCollectionSuffix: true, later });

if (Meteor.isServer) {
  // Make a 'job cleaning job' so that the jobcollection does not fill up endlessly
  new Job(jobQueue, 'cleanup', {})
    .repeat({ schedule: jobQueue.later.parse.text('every 20 minutes') })
    .save({ cancelRepeats: true });

  const cleanup = jobQueue.processJobs(
    'cleanup',
    {
      pollInterval: false,
      workTimeout: 60 * 1000,
    },
    (job, callback) => {
      const current = new Date();
      current.setMinutes(current.getMinutes() - 20);
      const jobIds = jobQueue.find({
        status: {
          $in: Job.jobStatusRemovable,
        },
        updated: {
          $lt: current,
        },
      }, {
        fields: {
          _id: 1,
        },
      }).map((removableJob) => removableJob._id);

      if (jobIds.length) {
        jobQueue.removeJobs(jobIds);
      }
      job.done(`removed ${jobIds.length} old jobs`);
      callback();
    },
  );

  jobQueue.find({
    type: 'cleanup',
    status: 'ready',
  }).observe({
    added() {
      return cleanup.trigger();
    },
  });
}

export { jobQueue as default, Job };

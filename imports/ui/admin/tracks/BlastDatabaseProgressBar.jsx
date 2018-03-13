import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { JobProgressBar } from '/imports/ui/admin/AdminJobqueue.jsx';

export default BlastDatabaseProgressBar = withTracker(({jobId}) => {
  const jobQueueSub = Meteor.subscribe('jobQueue');
  const loading = !jobQueueSub.ready();
  const job = jobQueue.findOne({_id: jobId})
  return {
    job,
    loading
  }
})(JobProgressBar)
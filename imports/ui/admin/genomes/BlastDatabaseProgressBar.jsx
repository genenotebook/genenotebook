import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { JobProgressBar } from '/imports/ui/admin/jobqueue/AdminJobqueue.jsx';

const BlastDatabaseProgressBar = withTracker(({ jobId }) => {
  const jobQueueSub = Meteor.subscribe('jobQueue');
  const loading = !jobQueueSub.ready();
  const job = jobQueue.findOne({ _id: jobId });
  return {
    loading,
    ...job,
  };
})(JobProgressBar);

export default BlastDatabaseProgressBar;

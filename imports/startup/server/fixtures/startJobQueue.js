import { Roles } from 'meteor/alanning:roles';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

export default function startJobQueue() {
  // Start the jobqueue
  jobQueue.allow({
    // Grant permission to admin only
    admin(userId) {
      return Roles.userIsInRole(userId, 'admin');
    },
  });
  return jobQueue.startJobServer();
}

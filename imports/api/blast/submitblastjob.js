import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Job } from 'meteor/vsivsi:job-collection';
import logger from '/imports/api/util/logger.js';

/**
 * submitBlastJob validated method: submits makeblastdb job to jobqueue, call this from the client
 * @param  {String} options.trackName Name of the annotation track
 * @param  {String} options.dbType    Either nucl or prot
 * @return {String}                   jobId of the makeblastdb job
 */
const submitBlastJob = new ValidatedMethod({
  name: 'submitBlastJob',
  validate: new SimpleSchema({
    blastType: { type: String },
    input: { type: String },
    genomeIds: { type: Array },
    'genomeIds.$': { type: String },
    blastOptions: { type: Object },
    'blastOptions.eValue': { type: String },
    'blastOptions.numAlignments': { type: String },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({
    blastType, input, genomeIds, blastOptions,
  }) {
    const user = this.userId;
    if (!user) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(user, 'user')) {
      throw new Meteor.Error('not-authorized');
    }

    logger.debug('submit blast job');

    const jobOptions = {
      blastType, input, genomeIds, user, blastOptions,
    };

    const job = new Job(jobQueue, 'blast', jobOptions);

    const jobId = job.priority('normal').save();

    logger.debug(jobId);

    return jobId;
  },
});

export default submitBlastJob;

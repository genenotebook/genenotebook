import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Job } from 'meteor/vsivsi:job-collection'


/**
 * makeBlastDb validated method: submits makeblastdb job to jobqueue, call this from the client
 * @param  {String} options.trackName Name of the annotation track
 * @param  {String} options.dbType    Either nucl or prot
 * @return {String}                   jobId of the makeblastdb job
 */
const makeBlastDb = new ValidatedMethod({
  name: 'makeBlastDb',
  validate: new SimpleSchema({
    genomeId: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ genomeId }){
    const userId = this.userId;
    if (! userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(userId,'curator')){
      throw new Meteor.Error('not-authorized');
    }

    const jobOptions = { genomeId, userId };

    if (!this.isSimulation){
      const job = new Job(jobQueue, 'makeBlastDb', jobOptions);
      const jobId = job.priority('normal').save();

      return jobId
    }
  }
})

export default makeBlastDb;
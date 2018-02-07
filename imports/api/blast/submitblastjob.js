import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Job } from 'meteor/vsivsi:job-collection';

/**
 * submitBlastJob validated method: submits makeblastdb job to jobqueue, call this from the client
 * @param  {String} options.trackName Name of the annotation track
 * @param  {String} options.dbType    Either nucl or prot
 * @return {String}                   jobId of the makeblastdb job
 */
export const submitBlastJob = new ValidatedMethod({
  name: 'submitBlastJob',
  validate: new SimpleSchema({
    blastType: { type: String },
    input: { type: String },
    trackNames: { type: Array },
    'trackNames.$': { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ blastType, input, trackNames }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'user')){
      throw new Meteor.Error('not-authorized');
    }

    console.log('submit blast job')
    
    const jobId = new Job(jobQueue, 'blast', {
      blastType: blastType,
      input: input,
      trackNames: trackNames,
      user: Meteor.userId()
    }).priority('normal').save()

    console.log(jobId)

    return jobId
  
  }
})

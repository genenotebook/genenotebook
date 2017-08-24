import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';
import hash from 'object-hash';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Job } from 'meteor/vsivsi:job-collection'

import { Genes } from '/imports/api/genes/gene_collection.js';

export const makeBlastDb = new ValidatedMethod({
  name: 'makeBlastDb',
  validate: new SimpleSchema({
    trackName: { type: String },
    dbType: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ trackName, dbType }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'curator')){
      throw new Meteor.Error('not-authorized');
    }

    if (!this.isSimulation){
      const jobId = new Job(jobQueue, 'makeBlastDb', {
        trackName: trackName,
        dbType: dbType
      }).priority('normal').save()

      return jobId
    }
  }
})

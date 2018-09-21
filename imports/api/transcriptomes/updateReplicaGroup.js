import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';

/**
 * updateReplicaGroup validated method: Update transcriptome information and groups
 * @param  {String} options.trackName Name of the annotation track
 * @param  {String} options.dbType    Either nucl or prot
 * @return {String}                   jobId of the makeblastdb job
 */
export const updateReplicaGroup = new ValidatedMethod({
  name: 'updateReplicaGroup',
  validate: new SimpleSchema({
    oldName: String,
    newName: String
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ oldName, newName }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'admin')){
      throw new Meteor.Error('not-authorized');
    }

    return ExperimentInfo.update({
      replicaGroup: oldName
    },{
      $set: {
        replicaGroup: newName
      }
    })
  }
})

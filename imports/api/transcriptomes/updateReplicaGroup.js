import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';

/**
 * [ValidatedMethod description]
 * @param {[type]} {                       name:         'updateReplicaGroup',             validate: new  SimpleSchema({                     sampleIds:   Array,    'sampleIds.$': String,                                           replicaGroup: String,      isPublic: Boolean,                                               permissions:  Array,    'permissions.$':String  }).validator() [description]
 * @param {[type]} applyOptions: {                                                         noRetry:  true                 } [description]
 * @param {[type]} run({        sampleIds, replicaGroup, isPublic,             permissions }){                             if            (! this.userId) {                               throw new Meteor.Error('not-authorized');                        }                     if (! Roles.userIsInRole(this.userId,'admin') [description]
 */
export const updateReplicaGroup = new ValidatedMethod({
  name: 'updateReplicaGroup',
  validate: new SimpleSchema({
    sampleIds: Array,
    'sampleIds.$': String,
    replicaGroup: String,
    isPublic: Boolean,
    permissions: Array,
    'permissions.$':String
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ sampleIds, replicaGroup, isPublic, permissions }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'admin')){
      throw new Meteor.Error('not-authorized');
    }

    return ExperimentInfo.update({
      _id: { $in: sampleIds }
    },{
      $set: {
        replicaGroup,
        isPublic,
        permissions
      }
    },{
      multi: true
    })
  }
})

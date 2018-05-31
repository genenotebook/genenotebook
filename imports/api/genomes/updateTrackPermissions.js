import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { Tracks } from '/imports/api/genomes/track_collection.js';

/**
 * submitBlastJob validated method: submits makeblastdb job to jobqueue, call this from the client
 * @param  {String} options.trackName Name of the annotation track
 * @param  {String} options.dbType    Either nucl or prot
 * @return {String}                   jobId of the makeblastdb job
 */
export const updateTrackPermissions = new ValidatedMethod({
  name: 'updateTrackPermissions',
  validate: new SimpleSchema({
    trackName: { type: String },
    permissions: { type: Array },
    'permissions.$': { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ trackName, permissions }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'user')){
      throw new Meteor.Error('not-authorized');
    }

    if (permissions.length === 0){
      permissions.push('admin')
    }

    Tracks.update({
      trackName
    },{
      $set: {
        permissions
      }
    })
  
  }
})

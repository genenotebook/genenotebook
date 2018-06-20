import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { Tracks } from './track_collection.js';
import { Genes } from '/imports/api/genes/gene_collection.js';

export const removeAnnotationTrack = new ValidatedMethod({
  name: 'removeAnnotationTrack',
  validate: new SimpleSchema({
    trackId: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ trackId }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId, 'admin')){
      throw new Meteor.Error('not-authorized');
    }

    const track = Tracks.findOne({ _id: trackId });

    Genes.remove({ track: track.name });

    Tracks.remove({ _id: trackId });
  }
})
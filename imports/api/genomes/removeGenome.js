import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { ReferenceInfo, References } from './reference_collection.js';
import { Tracks } from './track_collection.js';
import { removeAnnotationTrack } from './removeAnnotationTrack.js';

export const removeGenome = new ValidatedMethod({
  name: 'removeGenome',
  validate: new SimpleSchema({
    genomeId: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ genomeId }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId, 'admin')){
      throw new Meteor.Error('not-authorized');
    }

    console.log(`Removing genome ${genomeId}`);

    const tracks = Tracks.find({ reference: genomeId }).fetch();

    tracks.forEach(track => {
      removeAnnotationTrack.call({ trackId: track._id }, (err, res) => {
        if ( err ) {
          throw new Meteor.Error(err)
        } 
      })
    })

    const nRemoved = References.remove({ referenceId: genomeId });
    ReferenceInfo.remove({ _id: genomeId });
  }
})
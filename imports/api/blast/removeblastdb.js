import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { Tracks } from '/imports/api/genomes/track_collection.js';

/**
 * hasBlastDb validated method: checks whether blast databases exist for a given annotation track
 * @param  {String} options.trackName Name of the annotation track
 * @return {Bool}                     jobqueue
 */
export const removeBlastDb = new ValidatedMethod({
  name: 'removeBlastDb',
  validate: new SimpleSchema({
    trackId: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ trackId}){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'admin')){
      throw new Meteor.Error('not-authorized');
    }

    console.log(`remove ${trackId}`)

    if (!this.isSimulation){
      const track = Tracks.findOne({ _id: trackId })
      console.log(track)
      Tracks.update({
        _id: trackId
      },{
        $unset: {
          'blastdbs': 1
        }
      })
    }
  }
})

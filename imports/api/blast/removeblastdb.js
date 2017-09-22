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
    trackName: { type: String }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ trackName}){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'admin')){
      throw new Meteor.Error('not-authorized');
    }

    console.log(`remove ${trackName}`)

    if (!this.isSimulation){
      const track = Tracks.findOne({trackName: trackName})
      console.log(track)
      Tracks.update({
        trackName: trackName
      },{
        $unset: {
          'blastdbs': 1
        }
      })
    }
  }
})

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';
import { existsSync } from 'fs';

/**
 * hasBlastDb validated method: checks whether blast databases exist for a given annotation track
 * @param  {String} options.trackName Name of the annotation track
 * @return {Bool}                     jobqueue
 */
export const hasBlastDb = new ValidatedMethod({
  name: 'hasBlastDb',
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
    if (! Roles.userIsInRole(this.userId,'curator')){
      throw new Meteor.Error('not-authorized');
    }

    const cleanedTrackName = trackName.replace(/ |\./g,'_')

    const filenames = [
      `${cleanedTrackName}.nucl.nhr`,
      `${cleanedTrackName}.prot.phr`
    ]

    console.log(filenames)

    if (!this.isSimulation){
      console.log(filenames)
      console.log(filenames.every(existsSync))
      return filenames.every(existsSync)
    }
  }
})

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import logger from '/imports/api/util/logger.js';

/**
 * hasBlastDb validated method: checks whether blast databases exist for a given annotation track
 * @param  {String} options.trackName Name of the annotation track
 * @return {Bool}                     jobqueue
 */
const removeBlastDb = new ValidatedMethod({
  name: 'removeBlastDb',
  validate: new SimpleSchema({
    genomeId: { type: String },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ genomeId }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    logger.log(`Remove ${genomeId} blastDb`);

    return genomeCollection.update({
      _id: genomeId,
    }, {
      $unset: {
        'annotationTrack.blastDb': true,
      },
    });
  },
});

export default removeBlastDb;

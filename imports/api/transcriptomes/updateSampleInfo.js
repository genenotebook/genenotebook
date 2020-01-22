import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';
import logger from '/imports/api/util/logger.js';

/**
 * updateSampleInfo validated method: Update transcriptome information and groups
 * @param  {String} options.trackName Name of the annotation track
 * @param  {String} options.dbType    Either nucl or prot
 * @return {String}                   jobId of the makeblastdb job
 */
const updateSampleInfo = new ValidatedMethod({
  name: 'updateSampleInfo',
  validate: new SimpleSchema({
    _id: String,
    sampleName: String,
    replicaGroup: String,
    description: String,
    permission: String,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({
    _id, sampleName, replicaGroup, description, permission,
  }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }


    logger.debug({
      _id, sampleName, replicaGroup, description, permission,
    });

    return ExperimentInfo.update({ _id }, {
      $set: {
        sampleName,
        replicaGroup,
        description,
        permission,
      },
    });
  },
});

export default updateSampleInfo;

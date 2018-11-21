import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { genomeCollection, genomeSequenceCollection } from './genomeCollection.js';
import { Genes } from '/imports/api/genes/gene_collection.js';
import logger from '/imports/api/util/logger.js';

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

    logger.log(`Removing genome ${genomeId}`);

    const genome = genomeCollection.findOne({ _id: genomeId });
    if (!genome) {
      throw new Meteor.Error(`Genome ${genomeId} not found`);
    }

    genomeCollection.remove({ _id: genomeId });
    genomeSequenceCollection.remove({ genomeId });
    Genes.remove({ genomeId });
  }
})
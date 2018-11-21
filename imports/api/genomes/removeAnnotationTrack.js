import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { genomeCollection } from './genomeCollection.js';
import { Genes } from '/imports/api/genes/gene_collection.js';

export const removeAnnotationTrack = new ValidatedMethod({
  name: 'removeAnnotationTrack',
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

    Genes.remove({ genomeId });

    return genomeCollection.update({ _id: genomeId }, { $unset: { annotationTrack: true } })
  }
})
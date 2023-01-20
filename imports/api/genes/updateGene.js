import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import { diff, apply } from 'rus-diff';
import { omit, cloneDeep } from 'lodash';

import logger from '/imports/api/util/logger.js';

import { attributeCollection } from './attributeCollection.js';
import { Genes, GeneSchema } from './geneCollection.js';
import { EditHistory } from './edithistory_collection.js';

export const updateGene = new ValidatedMethod({
  name: 'updateGene',
  validate: new SimpleSchema({
    geneId: String,
    update: {
      type: Object,
      blackbox: true,
    },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ geneId, update }) {
    const { userId } = this;
    if (!userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(userId, 'curator')) {
      throw new Meteor.Error('not-authorized');
    }
    logger.debug(`Updating gene ${geneId}`);

    const gene = Genes.findOne({ ID: geneId });

    if (typeof gene === 'undefined') {
      throw new Meteor.Error(`Gene ${geneId} not found!`);
    }

    const newGene = apply(cloneDeep(gene), update);

    GeneSchema.validate(omit(newGene, '_id'));

    const revert = diff(newGene, gene);

    let newAttributes = [];

    if (update.hasOwnProperty('$set')) {
      newAttributes = Object.keys(update.$set).filter((key) => key.startsWith('attributes.')).map((key) => ({
        query: key,
        name: key.replace('attributes.', ''),
      }));
    }

    const revertString = JSON.stringify(revert);

    Genes.update({ ID: geneId }, update, (err, res) => {
      if (!err) {
        EditHistory.insert({
          ID: geneId,
          date: new Date(),
          user: userId,
          revert: revertString,
        });
        newAttributes.forEach(({ name, query }) => {
          attributeCollection.update({
            name,
          }, {
            $setOnInsert: {
              name,
              query,
              defaultShow: false,
              defaultSearch: false,
            },
            $addToSet: {
              genomes: gene.genomeId,
            },
          }, { upsert: true });
        });
      }
    });
  },
});

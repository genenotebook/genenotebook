import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import logger from '/imports/api/util/logger.js';

import { Genes } from './geneCollection.js';
import { attributeCollection } from './attributeCollection.js';

/**
 * Map function for mongodb mapreduce
 */
const mapFunction = function() {
  const gene = this;
  if (typeof gene.attributes !== 'undefined') {
    // eslint-disable-next-line no-undef
    emit(null, { attributeKeys: Object.keys(gene.attributes) });
  }
};

/**
 * Reduce function for mongodb mapreduce
 * @param  {String} _key    [description]
 * @param  {Array} values [description]
 * @return {Object}        [description]
 */
const reduceFunction = function(_key, values) {
  const attributeKeySet = new Set();
  values.forEach((value) => {
    value.attributeKeys.forEach((attributeKey) => {
      attributeKeySet.add(attributeKey);
    });
  });
  const attributeKeys = Array.from(attributeKeySet);
  return { attributeKeys };
};

const findNewAttributes = ({ genomeId }) => {
  const mapReduceOptions = {
    out: { inline: 1 },
    query: { genomeId },
  };
  // mapreduce to find all keys for all genes, this takes a while
  logger.debug('mapreducing');
  return Genes.rawCollection()
    .mapReduce(mapFunction, reduceFunction, mapReduceOptions)
    .then((results) => {
      logger.debug('mapreduce finished');
      results.forEach((result) => {
        const { attributeKeys } = result.value;
        attributeKeys.forEach((attributeKey) => {
          logger.debug(attributeKey);
          attributeCollection.update({
            name: attributeKey,
          }, {
            $addToSet: {
              genomes: genomeId,
            },
            $setOnInsert: {
              name: attributeKey,
              query: `attributes.${attributeKey}`,
              defaultShow: false,
              defaultSearch: false,
            },
          }, {
            upsert: true,
          });
        });
      });
    })
    .catch((err) => {
      throw new Meteor.Error(err);
    });
};

const removeOldAttributes = ({ genomeId }) => {
  logger.debug('Removing old attributes');
  const oldAttributeIds = attributeCollection.find({
    $or: [
      { allGenomes: true },
      { genomes: genomeId },
    ],
  }).fetch().filter((attribute) => {
    const count = Genes.find({
      // genomeId,
      [attribute.query]: {
        $exists: true,
      },
    }).count();
    logger.log(`Query "${attribute.query}" occurs ${count} times`);
    return count === 0;
  }).map((attribute) => attribute._id);

  logger.log(oldAttributeIds);

  const update = attributeCollection.remove({
    _id: { $in: oldAttributeIds },
  });
  logger.log(update);
  return update;
};

const scanGeneAttributes = new ValidatedMethod({
  name: 'scanGeneAttributes',
  validate: new SimpleSchema({
    genomeId: String,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ genomeId }) {
    logger.log(`scanGeneAttributes for genome: ${genomeId}`);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'curator')) {
      throw new Meteor.Error('not-authorized');
    }

    const genome = genomeCollection.findOne({ _id: genomeId });
    if (!genome) {
      throw new Meteor.Error(`Unknown genomeId: ${genomeId}`);
    }

    if (typeof genome.annotationTrack === 'undefined') {
      throw new Meteor.Error(`Genome ${genomeId} has no annotations to scan`);
    }

    // check that it is running on the server
    if (!this.isSimulation) {
      // this.unblock();
      removeOldAttributes({ genomeId });
      findNewAttributes({ genomeId });
      return true;
    }
  },
});

export default scanGeneAttributes;

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';
import Papa from 'papaparse';
import fs from 'fs';

import { Genes } from '/imports/api/genes/geneCollection.js';
import {
  ExperimentInfo, Transcriptomes,
} from '/imports/api/transcriptomes/transcriptome_collection.js';
import logger from '/imports/api/util/logger.js';

const getGenomeId = (data) => {
  const firstTranscipts = data.slice(0, 10).map((line) => line.target_id);
  logger.debug(firstTranscipts);
  const { genomeId } = Genes.findOne({
    $or: [
      { ID: { $in: firstTranscipts } },
      { 'subfeatures.ID': { $in: firstTranscipts } },
    ],
  });
  logger.debug(genomeId);
  return genomeId;
};

const parseKallistoTsv = ({
  fileName, sampleName, replicaGroup,
  description, permission = 'admin', isPublic = false,
}) => new Promise((resolve, reject) => {
  const fileHandle = fs.readFileSync(fileName, { encoding: 'binary' });
  const bulkOp = Transcriptomes.rawCollection().initializeUnorderedBulkOp();
  Papa.parse(fileHandle, {
    delimiter: '\t',
    dynamicTyping: true,
    skipEmptyLines: true,
    comments: '#',
    header: true,
    error(error, file) {
      reject(new Meteor.Error(error));
    },
    complete({ data }, file) {
      let nInserted = 0;

      const genomeId = getGenomeId(data);

      if (typeof genomeId === 'undefined') {
        reject(new Meteor.Error('Could not find genomeId for first transcript'));
      }

      const experimentId = ExperimentInfo.insert({
        genomeId,
        sampleName,
        replicaGroup,
        description,
        permission,
        isPublic,
      });

      data.forEach(({ target_id, tpm, est_counts }) => {
        const gene = Genes.findOne({
          $or: [
            { ID: target_id },
            { 'subfeatures.ID': target_id },
          ],
        });

        if (typeof gene === 'undefined') {
          logger.warn(`${target_id} not found`);
        } else {
          nInserted += 1;
          bulkOp.insert({
            geneId: gene.ID,
            tpm,
            est_counts,
            experimentId,
          });
        }
      });
      const bulkOpResult = bulkOp.execute();
      resolve(bulkOpResult);
    },
  });
});

const addTranscriptome = new ValidatedMethod({
  name: 'addTranscriptome',
  validate: new SimpleSchema({
    fileName: String,
    sampleName: String,
    replicaGroup: String,
    description: String,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({
    fileName, sampleName, replicaGroup, description,
  }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }
    return parseKallistoTsv({
      fileName, sampleName, replicaGroup, description,
    })
      .catch((error) => {
        logger.warn(error);
      });
  },
});

export default addTranscriptome;

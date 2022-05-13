import { DiamondProcessor } from '/imports/api/genes/diamond/addDiamond.js';
import logger from '/imports/api/util/logger.js';
import jobQueue from './jobqueue.js';
//import readline from 'readline';
import XmlFlow from 'xml-flow';
import fs from 'fs';

import { Genes } from '/imports/api/genes/geneCollection.js';

const parseXml = async ({ stream, tag }, callback) => {
  return new Promise((resolve, reject) => {
    const xml = new XmlFlow(stream);

    xml.on(`tag:${tag}`, async (obj) => {
      await callback(obj);
    });

    xml.on('end', () => {
      resolve();
    });

    xml.on('error', (error) => {
      reject(error);
    });
  });
};

jobQueue.processJobs(
  'addDiamond',
  {
    concurrency: 4,
    payload: 1,
  },
  async (job, callback) => {
    const { fileName } = job.data;
    logger.log(`Add ${fileName} diamond file.`);

    // const lineProcessor = new DiamondProcessor();

    const stream = fs.createReadStream(fileName);
    const tag = 'blastoutput';

    this.genesDb = Genes.rawCollection();

    await parseXml({ stream, tag }, async (obj) => {
      if (obj['blastoutput_iterations'] !== undefined) {
        logger.log('blastoutput_iterations', obj['blastoutput_iterations']);
        for (let i = 0; i < obj['blastoutput_iterations'].length; i++) {
          // Get iteration query e.g: 'MMUCEDO_000001-T1 MMUCEDO_000001'.
          const iteration_query = obj['blastoutput_iterations'][i]['iteration_query-def'];

          // Split 'MMUCEDO_000001-T1 MMUCEDO_000001'.
          const split_iteration_query = iteration_query.split(' ');
          logger.log('split_iteration_query : ', split_iteration_query);

          // Next, check if any of the queries exist in the genes collection.
          for (let b = 0; b < split_iteration_query.length; b++) {
            // Query the genes collection.
            const subfeatureIsFound = await this.genesDb.findOne(
              { 'subfeatures.ID': split_iteration_query[b] },
            );

            if (typeof subfeatureIsFound !== 'undefined' && subfeatureIsFound !== null) {
              logger.log(`subfeature : ${split_iteration_query[b]} is found !`);
              break;
            } else {
              logger.warn(`Warning ! No sub-feature was found for ${split_iteration_query[b]}.`);
            }
          }
        }

        // if (obj['blastoutput_iterations']['iteration_query-def'] !== undefined) {
        //   logger.log('iteration_query-def', obj['blastoutput_iterations']['iteration_query-def']);
        // }
      }
      //logger.log(obj);
    }).then(() => {
      logger.log('Done example xml parsing.');
      job.done();
    });
  },
);

/*eslint dot-notation: ["error", { "allowPattern": "^[a-z]+(_[a-z]+)+$" }]*/
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
          (async () => {
            split_iteration_query.forEach(async (iter) => {
              const subfeatureIsFound = await this.genesDb.findOne(
                { 'subfeatures.ID': iter },
              );
              if (typeof subfeatureIsFound !== 'undefined' && subfeatureIsFound !== null) {
                logger.log(`subfeature : ${iter} is found !`);
                // Here, get all diamond output informations.
                const iteration_hits = obj['blastoutput_iterations'][i]['iteration_hits'];
                iteration_hits.forEach((hit) => {
                  // Global query details/
                  const hitId = hit['hit_id'];
                  const hitDef = hit['hit_def'];
                  const hitAccession = hit['hit_accession'];
                  logger.log('Id :', hitId);
                  logger.log('Def :', hitDef);
                  logger.log('Acc :', hitAccession);

                  // Specific query details.
                  const hitHspScore = hit['hit_hsps']['hsp_score'];
                  const hitEvalue = hit['hit_hsps']['hsp_evalue'];
                  const hitQueryFrom = hit['hit_hsps']['hsp_query-from'];
                  const hitQueryTo = hit['hit_hsps']['hsp_query-to'];
                  logger.log('hit score :', hitHspScore);
                  logger.log('hit evalue : ', hitEvalue);
                  logger.log('hit query from : ', hitQueryFrom);
                  logger.log('hit query to : ', hitQueryTo);
                });
              } else {
                logger.warn(`Warning ! No sub-feature was found for ${iter}.`);
              }
            });
          })();
        }
      }
      // logger.log(obj);
    }).then(() => {
      logger.log('Done example xml parsing.');
      job.done();
    });
  },
);

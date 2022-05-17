/*eslint dot-notation: ["error", { "allowPattern": "^[a-z]+(_[a-z]+)+$" }]*/
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';

class DiamondXmlProcessor {
  constructor() {
    this.genesDb = Genes.rawCollection();
  }

  parse = (obj) => {
    if (obj['blastoutput_iterations'] !== undefined) {
      logger.log('blastoutput_iterations', obj['blastoutput_iterations']);
      for (let i = 0; i < obj['blastoutput_iterations'].length; i++) {
        // Get iteration query e.g: 'MMUCEDO_000001-T1 MMUCEDO_000001'.
        const iterationQuery = obj['blastoutput_iterations'][i]['iteration_query-def'];

        // Split 'MMUCEDO_000001-T1 MMUCEDO_000001'.
        const splitIterationQuery = iterationQuery.split(' ');
        logger.log('split_iteration_query : ', splitIterationQuery);

        // Next, check if any of the queries exist in the genes collection.
        splitIterationQuery.forEach(async (iter) => {
          const subfeatureIsFound = await this.genesDb.findOne(
            { 'subfeatures.ID': iter },
          );
          if (typeof subfeatureIsFound !== 'undefined' && subfeatureIsFound !== null) {
            logger.log(`subfeature : ${iter} is found !`);
            // Here, get all diamond output informations.
            const iterationHits = obj['blastoutput_iterations'][i]['iteration_hits'];
            iterationHits.forEach((hit) => {
              // Global query details.
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
      }
    }
  };
}

export default DiamondXmlProcessor;

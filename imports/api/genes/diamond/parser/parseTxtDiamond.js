import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';

// Reads pairwise (.txt) output files from diamond.
class DiamondPairwiseProcessor {
  constructor() {
    this.genesDb = Genes.rawCollection();
  }

  parse = async (line) => {
    logger.log(line);
  };
}

export default DiamondPairwiseProcessor;

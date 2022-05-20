import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';

class Pairwise {
  constructor({
    query = '',
    def = '',
    length = 0,
    querySeq = '',
    sbjectSeq = '',
  }){
    this.query = query;
    this.def = def;
    this.length = length;
    this.querySeq = querySeq;
    this.sbjectSeq = sbjectSeq;
  }
}

// Reads pairwise (.txt) output files from diamond.
class DiamondPairwiseProcessor {
  constructor() {
    this.genesDb = Genes.rawCollection();
    this.pairWise;
  }

  parse = async (line) => {
    if (line.length !== 0 && !(/^BLAST/.test(line))) {
      if (/^Query=/.test(line)) {
        if (this.pairWise !== undefined) {
          logger.log(this.pairWise);
        }
        this.pairWise = new Pairwise({});
        this.pairWise.query = line;
      }
      if (/^Length/.test(line)) {
        this.pairWise.length = line;
      }
      if (/^>/.test(line)) {
        this.pairWise.def = line;
      }
      if (/Score/.test(line.trim())) {
        logger.log('score bit', line);
      }
      if (/Expect/.test(line)) {
        logger.log('expect', line);
      }
      if (/^Query /.test(line)) {
        this.pairWise.querySeq = this.pairWise.querySeq.concat(line);
      }
      if (/^Sbjct/.test(line)) {
        this.pairWise.sbjectSeq = this.pairWise.sbjectSeq.concat(line);
      }
    }
  };

  lastOrder = () => {
    logger.log(this.pairWise);
  };
}

export default DiamondPairwiseProcessor;

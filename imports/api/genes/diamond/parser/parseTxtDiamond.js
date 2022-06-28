import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';

class Pairwise {
  constructor({
    query = '',
    def = '',
    length = 0,
    querySeq = '',
    hitSeq = '',
    bit_score,
    score,
    evalue,
  }){
    this.query = query;
    this.def = def;
    this.length = length;
    this.querySeq = querySeq;
    this.hitSeq = hitSeq;
    this.bitScore = bit_score;
    this.score = score;
    this.evalue = evalue;
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
        // Get the query (e.g : 'Query= MMUCEDO_000001-T1').
        const queryLine = /^Query=/.test(line);

        // Remove the beginning (result -> MMUCEDO_000001-T1).
        const queryClean = queryLine.replace('Query= ', '');

        // If this is the first query and no collection has been created yet.
        // (e.g : MMUCEDO_000001-T1).
        if (typeof this.pairWise.query === 'undefined') {
          // Creation of a subpart of pairwise.
          this.pairWise = new Pairwise({});
          this.pairWise.query = line;
        }

        // If there is already a subpart of pairwise but a new query is found.
        // (e.g : MMUCEDO_000002-T1).
        if (typeof this.pairWise.query !== 'undefined' && this.pairWise.query !== queryClean) {
          // Submits changes to a diamond collection.
          logger.log('Complete query :', this.pairWise);

          // Creation of a new subpart of pairwise.
          this.pairWise = new Pairwise({});
        }
      }
      if (/^Length/.test(line)) {
        // If the length already has a value but it is found again, it is the
        // length of the hit sequence. We want to import only the length of the
        // target sequence.
        if (typeof this.pairWise.length !== 'undefined') {
          // Get the length (e.g : Length=1022).
          const length = /^Length/.test(line);

          // Clean length (result -> 1022).
          const lengthClean = length.replace('Length=', '');

          // Add information.
          this.pairWise.length = lengthClean;
        }
      }
      if (/^>/.test(line)) {
        // If > create a new dictionary which will be added to the
        // iteration_hits array.

        // Get the definition of the query. (e.g : >KAG2206553.1 hypothetical);
        const defQuery = /^>/.test(line);

        // Clean definition (e.g : KAG2206553.1 hypothetical).
        const defQueryClean = defQuery.replace('>', '');

        // Adds or concatenates information.
        this.pairWise.def = defQueryClean;
      }
      if (/Score/.test(line.trim())) {
        // Get the bit-score and score (e.g : Score = 54.7 bits (130), Expect =
        // 1.17e-04).
        const allScores = /Score/.test(line.trim());

        // Split to comma (result -> Score = 54.7 bits (130),).
        const scoresCleaned = allScores.replace('Score = ', '');
        const bitScore = scoresCleaned.split('bits')[0];
        const score = scoresCleaned.split('bits')[1].split(/[()]/);

        logger.log('score bit :', bitScore);
        logger.log('score :', score);

        // Add informations.
        this.pairWise.bitScore = bitScore;
        this.pairWise.score = score;
      }
      if (/Expect/.test(line)) {
        // Get the expect (e.g : Score = 54.7 bits (130), Expect = 1.17e-04).
        const expectQuery = /Expect/.test(line);

        // Split to comma (result -> Expect = 1.17e-04).
        const expectSplit = expectQuery.split(',')[1];
        const expect = expectSplit.replace('Expect = ', '');

        logger.log('Expect : ', expect);

        // Add information.
        this.pairWise.evalue = expect;
      }
      if (/^Query /.test(line)) {
        // Get the query sequence (e.g: Query 1 MFSGSSSNKN ...).
        const queryAllSeq = /^Query /.test(line);

        // Split and get the sequence.
        const querySplit = queryAllSeq.split(' ');
        const querySeq = querySplit[2];

        // Concatenates informations.
        this.pairWise.querySeq = this.pairWise.querySeq.concat(querySeq);
      }
      if (/^Sbjct/.test(line)) {
        // Get the query sequence (e.g: Query 1 MFSGSSSNKN ...).
        const hitAllSeq = /^Sbjct/.test(line);

        // Split and get the sequence.
        const hitSplit = hitAllSeq.split(' ');
        const hitSeq = hitSplit[2];

        // Concatenates informations.
        this.pairWise.hitSeq = this.pairWise.hitSeq.concat(hitSeq);
      }
    }
  };

  lastPairwise = () => {
    // When the file is finished, you must save the last query in a collection.
    logger.log('last pairwise :', this.pairWise);
  };
}

export default DiamondPairwiseProcessor;

import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';

class Pairwise {
  constructor({
    iteration_query,
    query_length,
  }){
    this.iteration_query = iteration_query;
    this.query_length = query_length;
    this.iteration_hits = [];
  }
}

// Reads pairwise (.txt) output files from diamond.
class DiamondPairwiseProcessor {
  constructor() {
    this.genesDb = Genes.rawCollection();
    this.pairWise = new Pairwise({});
    this.diamondBulkOp = diamondCollection.rawCollection().initializeOrderedBulkOp();
  }

  parse = (line) => {
    if (line.length !== 0 && !(/^BLAST/.test(line))) {
      if (/^Query=/.test(line)) {
        // Get the query (e.g : 'Query= MMUCEDO_000001-T1').
        const queryLine = line;
        logger.log('queryLine 1:', queryLine);

        // Remove the beginning (result -> MMUCEDO_000001-T1).
        const queryClean = queryLine.replace('Query= ', '');

        // If this is the first query and no collection has been created yet.
        // (e.g : MMUCEDO_000001-T1).
        if (typeof this.pairWise.iteration_query === 'undefined') {
          // Creation of a subpart of pairwise.
          this.pairWise.iteration_query = queryClean;
        }

        // If there is already a subpart of pairwise but a new query is found.
        // (e.g : MMUCEDO_000002-T1).
        if (typeof this.pairWise.iteration_query !== 'undefined' && this.pairWise.iteration_query !== queryClean) {
          // Submits changes to a diamond collection.
          logger.log('Complete query 2:', this.pairWise);

          // Check if bulk operation find a subfetaure in gene collection.
          this.diamondBulkOp.find({
            iteration_query: this.pairWise.iteration_query,
          }).upsert().update(
            {
              $set: {
                iteration_query: this.pairWise.iteration_query,
                query_len: this.pairWise.queryLen,
                iteration_hits: this.pairWise.iteration_hits,
              },
            },
            {
              upsert: false,
              multi: true,
            },
          );
          this.diamondBulkOp.execute();
        }
        logger.log('prouttttttt');

        logger.log('queryLine3  :', queryLine);
        // Creation of a new subpart of pairwise.
        this.pairWise = new Pairwise({});
        this.pairWise.iteration_query = queryClean;
        this.pairWise.iteration_hits = [];
      }
      if (/^Length/.test(line)) {
        // If the length already has a value but it is found again, it is the
        // length of the hit sequence. We want to import only the length of the
        // target sequence.
        if (typeof this.pairWise.query_length === 'undefined') {
          // Get the length (e.g : Length=1022).
          const length = line;

          // Clean length (result -> 1022).
          const lengthClean = length.replace('Length=', '');

          // Add information.
          this.pairWise.query_length = lengthClean;
        }
      }
      if (/^>/.test(line)) {
        // If > create a new dictionary which will be added to the
        // iteration_hits array.
        this.pairWise.iteration_hits.push({});

        // Get the definition of the query. (e.g : >KAG2206553.1 hypothetical);
        const defQuery = line;

        // Clean definition (e.g : KAG2206553.1 hypothetical).
        const defQueryClean = defQuery.replace('>', '');

        // Adds or concatenates information.
        // this.pairWise.def = defQueryClean;
        this.pairWise.iteration_hits.slice(-1)[0].def = defQueryClean;
      }
  //     if (/Score/.test(line.trim())) {
  //       // Get the bit-score and score (e.g : Score = 54.7 bits (130), Expect =
  //       // 1.17e-04).
  //       const allScores = /Score/.test(line.trim());

  //       // Split to comma (result -> Score = 54.7 bits (130),).
  //       const scoresCleaned = allScores.replace('Score = ', '');
  //       const bitScore = scoresCleaned.split('bits')[0];
  //       const score = scoresCleaned.split('bits')[1].split(/[()]/);

  //       logger.log('score bit :', bitScore);
  //       logger.log('score :', score);

  //       // Add informations.
  //       this.pairWise.bitScore = bitScore;
  //       this.pairWise.score = score;
  //     }
  //     if (/Expect/.test(line)) {
  //       // Get the expect (e.g : Score = 54.7 bits (130), Expect = 1.17e-04).
  //       const expectQuery = /Expect/.test(line);

  //       // Split to comma (result -> Expect = 1.17e-04).
  //       const expectSplit = expectQuery.split(',')[1];
  //       const expect = expectSplit.replace('Expect = ', '');

  //       logger.log('Expect : ', expect);

  //       // Add information.
  //       this.pairWise.evalue = expect;
  //     }
  //     if (/^Query /.test(line)) {
  //       // Get the query sequence (e.g: Query 1 MFSGSSSNKN ...).
  //       const queryAllSeq = /^Query /.test(line);

  //       // Split and get the sequence.
  //       const querySplit = queryAllSeq.split(' ');
  //       const querySeq = querySplit[2];

  //       // Concatenates informations.
  //       this.pairWise.querySeq = this.pairWise.querySeq.concat(querySeq);
  //     }
  //     if (/^Sbjct/.test(line)) {
  //       // Get the query sequence (e.g: Query 1 MFSGSSSNKN ...).
  //       const hitAllSeq = /^Sbjct/.test(line);

  //       // Split and get the sequence.
  //       const hitSplit = hitAllSeq.split(' ');
  //       const hitSeq = hitSplit[2];

  //       // Concatenates informations.
  //       this.pairWise.hitSeq = this.pairWise.hitSeq.concat(hitSeq);
  //     }
    }
  };

  lastPairwise = () => {
    // When the file is finished, you must save the last query in a collection.
    logger.log('last pairwise :', this.pairWise);

    // Update or insert if no matching documents were found.
    const documentDiamond = diamondCollection.upsert(
      { iteration_query: this.pairWise.iteration_query }, // selector.
      {
        $set: // modifier.
        {
          iteration_query: this.pairWise.iteration_query,
          query_len: this.pairWise.query_length,
          iteration_hits: this.pairWise.iteration_hits,
        },
      },
    );
  };
}

export default DiamondPairwiseProcessor;

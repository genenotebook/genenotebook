import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';

class Pairwise {
  constructor({
    iteration_query,
    query_length,
    position_query,
  }){
    this.iteration_query = iteration_query;
    this.query_length = query_length;
    this.position_query = position_query; // Index in the document of the query sequence.
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

          this.diamondBulkOp.find({
            iteration_query: this.pairWise.iteration_query,
          }).upsert().update(
            {
              $set: {
                iteration_query: this.pairWise.iteration_query,
                query_len: this.pairWise.query_length,
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
        } else {
          const length = line;
          const lengthClean = length.replace('Length=', '');
          this.pairWise.iteration_hits.slice(-1)[0].length = lengthClean;
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

        // Get the identifiant (e.g : KAG2206553.1).
        const identifiant = defQueryClean.split(' ')[0];

        // Adds or concatenates information.
        this.pairWise.iteration_hits.slice(-1)[0].def = defQueryClean;
        this.pairWise.iteration_hits.slice(-1)[0].id = identifiant;
      }
      if (/Score/.test(line.trim())) {
        // Get the bit-score and score (e.g : Score = 54.7 bits (130), Expect =
        // 1.17e-04).
        const allScores = line.trim();

        // Split to comma (result -> Score = 54.7 bits (130),).
        const scoresCleaned = allScores.replace('Score = ', '');
        const bitScore = scoresCleaned.split('bits')[0];
        const score = scoresCleaned.split('bits')[1].split(/[()]/)[1];

        // Add informations.
        this.pairWise.iteration_hits.slice(-1)[0]['bit-score'] = Number(bitScore);
        this.pairWise.iteration_hits.slice(-1)[0].score = Number(score);
      }
      if (/Identities/.test(line.trim())) {
        // Get identities, positives, gaps
        // e.g: Identities = 120/155 (77%), Positives = 137/155 (88%), Gaps = 0/155 (0%)
        const allInformations = line.trim();

        // Split the information into 3 parts.
        const splitInformations = allInformations.split(',');
        const identitiesNoClean = splitInformations[0];
        const positivesNoClean = splitInformations[1];
        const gapsNoClean = splitInformations[2];

        // Clean values.
        const identities = identitiesNoClean.replace('Identities = ', '').split('/')[0];
        const positives = positivesNoClean.replace('Positives = ', '').split('/')[0];
        const gaps = gapsNoClean.replace('Gaps = ', '').split('/')[0];

        // Add 3 informations.
        this.pairWise.iteration_hits.slice(-1)[0].identity = Number(identities);
        this.pairWise.iteration_hits.slice(-1)[0].positive = Number(positives);
        this.pairWise.iteration_hits.slice(-1)[0].gaps = Number(gaps);
      }
      if (/Expect/.test(line)) {
        // Get the expect (e.g : Score = 54.7 bits (130), Expect = 1.17e-04).
        const expectQuery = line;

        // Split to comma (result -> Expect = 1.17e-04).
        const expectSplit = expectQuery.split(',')[1];
        const expect = expectSplit.replace('Expect = ', '');

        // Add information.
        this.pairWise.iteration_hits.slice(-1)[0].evalue = expect;
      }
      if (/^Query /.test(line)) {
        // Get the query sequence (e.g: Query 1 MFSGSSSNKN ...).
        const queryAllSeq = line.trim();

        // Split/remove the spaces and get the sequence.
        const querySplit = queryAllSeq.split(' ').filter((x) => x);
        const querySeq = querySplit[2];
        const queryFrom = querySplit[1];
        const queryTo = querySplit[3];

        // Get the position of sequence.
        const sampleSeq = querySeq.substring(0, 5);
        const posSeq = line.indexOf(sampleSeq);

        // Store the index of query sequence.
        logger.log('coucou');
        this.pairWise.position_query = Number(posSeq);

        // Add once query from.
        if (typeof this.pairWise.iteration_hits.slice(-1)[0]['query-from'] === 'undefined') {
          this.pairWise.iteration_hits.slice(-1)[0]['query-from'] = queryFrom;
        }

        // Update query to.
        this.pairWise.iteration_hits.slice(-1)[0]['query-to'] = queryTo;

        // Concatenates informations.
        if (typeof this.pairWise.iteration_hits.slice(-1)[0]['query-seq'] === 'undefined') {
          this.pairWise.iteration_hits.slice(-1)[0]['query-seq'] = querySeq;
        } else {
          this.pairWise.iteration_hits.slice(-1)[0]['query-seq'] = this.pairWise.iteration_hits.slice(-1)[0]['query-seq'].concat(querySeq);
        }
      }
      if (typeof this.pairWise.iteration_hits !== 'undefined') {
        if (!/(^Query|^Length=|>|^Score =|^Identities =|^Sbjct)/.test(line.trim())) {
          // Get the midline sequence (e.g MFSGSSS+KNEG+PK ). Midline is between
          // the query sequence index plus 60 characters. Allows to keep the
          // spaces in the midline sequence without erasing them with the trim()
          // function.
          let midlineClean = line.substring(
            this.pairWise.position_query,
            (this.pairWise.position_query + 60),
          );

          // Fix the bug with spaces at the end of a sequence.
          if (midlineClean.length < 60) {
            midlineClean += ' '.repeat((60 - midlineClean.length));
          }

          // Concatenates informations.
          if (typeof this.pairWise.iteration_hits.slice(-1)[0]['midline'] === 'undefined') {
            this.pairWise.iteration_hits.slice(-1)[0]['midline'] = midlineClean;
          } else {
            this.pairWise.iteration_hits.slice(-1)[0]['midline'] = this.pairWise.iteration_hits.slice(-1)[0]['midline'].concat(midlineClean);
          }
        }
      }
      if (/^Sbjct/.test(line)) {
        // Get the query sequence (e.g: Sbjct 1 MFSGSSSDKNEGIPKR--- ...).
        const hitAllSeq = line;

        // Split/remove the spaces and get the sequence.
        // (Gaps are separated by dashes).
        const hitSplit = hitAllSeq.split(' ').filter((x) => x);
        const hitSeq = hitSplit[2];
        const hitFrom = hitSplit[1];
        const hitTo = hitSplit[3];

        // Add once hit-from.
        if (typeof this.pairWise.iteration_hits.slice(-1)[0]['hit-from'] === 'undefined') {
          this.pairWise.iteration_hits.slice(-1)[0]['hit-from'] = hitFrom;
        }

        // Update hit-to.
        this.pairWise.iteration_hits.slice(-1)[0]['hit-to'] = hitTo;

        // Concatenates informations.
        if (typeof this.pairWise.iteration_hits.slice(-1)[0]['hit-seq'] === 'undefined') {
          this.pairWise.iteration_hits.slice(-1)[0]['hit-seq'] = hitSeq;
        } else {
          this.pairWise.iteration_hits.slice(-1)[0]['hit-seq'] = this.pairWise.iteration_hits.slice(-1)[0]['hit-seq'].concat(hitSeq);
        }
      }
    }
  };

  lastPairwise = () => {
    // When the file is finished, you must save the last query in a collection.
    logger.log('last pairwise :', this.pairWise);

    this.diamondBulkOp.find({
      iteration_query: this.pairWise.iteration_query,
    }).upsert().update(
      {
        $set: {
          iteration_query: this.pairWise.iteration_query,
          query_len: this.pairWise.query_length,
          iteration_hits: this.pairWise.iteration_hits,
        },
      },
      {
        upsert: false,
        multi: true,
      },
    );
    this.diamondBulkOp.execute();
  };
}

export default DiamondPairwiseProcessor;

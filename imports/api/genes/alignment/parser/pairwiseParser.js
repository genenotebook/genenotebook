import { similarSequencesCollection } from '/imports/api/genes/alignment/similarSequenceCollection.js';
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

/**
 * Read a BLAST or Diamond txt file line by line. The alignment collection in
 * database is completed with mongodb and bulk-operations.
 * @class
 * @constructor
 * @public
 * @param {string} program - The program used (BLAST or Diamond).
 * @param {string} algorithm - The algorithm used (blastx, blastp ...).
 * @param {string} matrix - The substitution matrix used for alignment (BLOSUM).
 * @param {string} database - The reference database (Non-redundant protein sequences (nr)).
 */
class PairwiseProcessor {
  constructor(program, algorithm, matrix, database) {
    this.genesDb = Genes.rawCollection();
    this.pairWise = new Pairwise({});
    this.program = program;
    this.algorithm = algorithm;
    this.matrix = matrix;
    this.database = database;
    this.similarSeqBulkOp = similarSequencesCollection.rawCollection().initializeUnorderedBulkOp();
  }

  /**
   * Read line by line and complete the pairwises information.
   * @function
   * @param {string} line - The line to parse.
   */
  parse = (line) => {
    if (line.length !== 0 || !(/^BLAST/.test(line))) {
      if (/^Query=/.test(line) || /^Query #/.test(line)) {
        /**
         * Get and clean the name of the query sequence according to the program used.
         * (e.g : 'Query= MMUCEDO_000001-T1' becomes MMUCEDO_000001-T1 ).
         * @type {string}
         */
        const queryClean = (
          this.program === 'blast'
            ? line.replace('Query #', '').split(': ')[1].split(' ')[0]
            : line.replace('Query= ', '').split(' ')[0]
        );

        /** In the event that it is the first element of the collection to be created. */
        if (typeof this.pairWise.iteration_query === 'undefined') {
          this.pairWise.iteration_query = queryClean;
        }

        /** In the case where a new pairwise must be created. */
        if (typeof this.pairWise.iteration_query !== 'undefined'
            && this.pairWise.iteration_query !== queryClean) {
          /** Update or insert pairwise. */
          this.similarSeqBulkOp.find({
            iteration_query: this.pairWise.iteration_query,
          }).upsert().update(
            {
              $set: {
                program_ref: this.program,
                algorithm_ref: this.algorithm,
                matrix_ref: this.matrix,
                database_ref: this.database,
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
        }

        /** Initializes a new pairwise. */
        this.pairWise = new Pairwise({});
        this.pairWise.iteration_query = queryClean;
        this.pairWise.iteration_hits = [];
      }
      if (/Length/.test(line)) {
        /**
         * Get and clean the length of the query sequence according to the program used.
         * (e.g : 'Length=1022' becomes 1022 ).
         * @type {string}
         */
        const lengthClean = (
          this.program === 'blast'
            ? line.split('Length:')[1]
            : line.replace('Length=', '')
        );

        /**
         * The first length found is the length of the query sequence. Then
         *  all the lengths are the lengths of the hits sequences.
         */
        if (typeof this.pairWise.query_length === 'undefined') {
          this.pairWise.query_length = Number(lengthClean);
        } else {
          /** In the case of identical proteins. */
          if (this.pairWise.iteration_hits.slice(-1)[0].accession_len) {
            this.pairWise.iteration_hits.slice(-1)[0].identical_proteins.slice(-1)[0].accession_len = lengthClean;
          } else {
            this.pairWise.iteration_hits.slice(-1)[0].accession_len = Number(lengthClean);
          }
        }
      }
      if (/^Database/.test(line) && typeof this.database === 'undefined') {
        this.database = line.replace('Database: ', '');
      }
      if (/^>/.test(line)) {
        /**
         * Get and clean the definition of a hit sequence.
         * (e.g : '>KAG2206553.1 hypothetical' becomes KAG2206553.1 hypothetical).
         * @type {string}
         */
        const definition = line.replace(/^>/g, '');

        /** Check if there are identical proteins. */
        if (this.pairWise.iteration_hits.length !== 0) {
          if (Object.keys(this.pairWise.iteration_hits.slice(-1)[0]).length === 3
              || Object.keys(this.pairWise.iteration_hits.slice(-1)[0]).length === 4) {
            if (!this.pairWise.iteration_hits.slice(-1)[0].identical_proteins) {
              this.pairWise.iteration_hits.slice(-1)[0].identical_proteins = [{}];
            } else {
              this.pairWise.iteration_hits.slice(-1)[0].identical_proteins.push({});
            }
            this.pairWise.iteration_hits.slice(-1)[0].identical_proteins.slice(-1)[0].def = definition;
          } else {
            this.pairWise.iteration_hits.push({});
            this.pairWise.iteration_hits.slice(-1)[0].def = definition;
          }
        } else {
          this.pairWise.iteration_hits.push({});
          this.pairWise.iteration_hits.slice(-1)[0].def = definition;
        }

        /**
         * For the Diamond program, initializes the identifier or the ID of the
         * hit sequence.
         * (e.g : '>KAG2206553.1 hypothetical' becomes KAG2206553.1).
         */
        if (this.program === 'diamond') {
          this.pairWise.iteration_hits.slice(-1)[0].id = definition.split(' ')[0];
        }
      }
      if (/^Sequence ID:/.test(line)) {
        /**
         * For the BLAST program, initializes the identifier or the ID of the
         * hit sequence.
         * (e.g : 'Sequence ID: KAG2206553.1' becomes KAG2206553.1).
         */
        const identifiantClean = line.replace('Sequence ID: ', '').split(' ')[0];

        /** Check if there are identical proteins. */
        if (this.pairWise.iteration_hits.slice(-1)[0].id) {
          this.pairWise.iteration_hits.slice(-1)[0].identical_proteins.slice(-1)[0].id = identifiantClean;
        } else {
          this.pairWise.iteration_hits.slice(-1)[0].id = identifiantClean;
        }
      }
      if (/^Score/.test(line.trim())) {
        // Get the bit-score and score (e.g : Score = 54.7 bits (130), Expect =
        // 1.17e-04).
        const allScores = line.trim();

        /// Split to comma (result -> Score = 54.7 bits (130),).
        const scoresCleaned = (
          this.program === 'blast'
            ? allScores.replace('Score:', '')
            : allScores.replace('Score = ', '')
        );
        const bitScore = scoresCleaned.split('bits')[0];
        const score = scoresCleaned.split('bits')[1].split(/[()]/)[1];

        this.pairWise.iteration_hits.slice(-1)[0]['bit-score'] = Number(bitScore);
        this.pairWise.iteration_hits.slice(-1)[0].score = Number(score);
      }
      // Add identities, query length, positives and gaps.
      if (/^Identities/.test(line.trim())) {
        // Get identities, positives, gaps and query-length.
        // e.g: Identities = 120/155 (77%), Positives = 137/155 (88%), Gaps = 0/155 (0%)
        const allInformations = line.trim();

        // Split the information into 3 parts.
        const splitInformations = allInformations.split(',');
        const identitiesNoClean = splitInformations[0];
        const positivesNoClean = splitInformations[1];
        const gapsNoClean = splitInformations[2];

        // Clean values.
        const identities = (
          this.program === 'blast'
            ? identitiesNoClean.replace('Identities:', '').split('/')[0]
            : identitiesNoClean.replace('Identities = ', '').split('/')[0]
        );
        const queryLen = (
          this.program === 'blast'
            ? identitiesNoClean.replace('Identities:', '').split('/')[1].split('(')[0]
            : identitiesNoClean.replace('Identities = ', '').split('/')[1].split(' ')[0]
        );
        const positives = (
          this.program === 'blast'
            ? positivesNoClean.replace('Positives:', '').split('/')[0]
            : positivesNoClean.replace('Positives = ', '').split('/')[0]
        );
        const gaps = (
          this.program === 'blast'
            ? gapsNoClean.replace('Gaps:', '').split('/')[0]
            : gapsNoClean.replace('Gaps = ', '').split('/')[0]
        );

        // Add identities, positives and gaps informations.
        this.pairWise.iteration_hits.slice(-1)[0].identity = Number(identities);
        this.pairWise.iteration_hits.slice(-1)[0].positive = Number(positives);
        this.pairWise.iteration_hits.slice(-1)[0].gaps = Number(gaps);

        // Add length of query sequence.
        this.pairWise.iteration_hits.slice(-1)[0].length = Number(queryLen);
      }
      if (/Expect/.test(line)) {
        // Get the expect (e.g : Score = 54.7 bits (130), Expect = 1.17e-04).
        const expectQuery = line;

        // Split to comma (result -> Expect = 1.17e-04).
        const expectSplit = expectQuery.split(',')[1];
        const expect = (
          this.program === 'blast'
            ? expectSplit.replace('Expect:', '')
            : expectSplit.replace('Expect = ', '')
        );

        // Add information.
        this.pairWise.iteration_hits.slice(-1)[0].evalue = expect;
      }
      if (/^Query /.test(line) && !/^Query #/.test(line)) {
        // Get the query sequence (e.g: Query 1 MFSGSSSNKN ...).
        const queryAllSeq = line.trim();

        // Split/remove the spaces and get the sequence.
        const querySplit = queryAllSeq.split(' ').filter((x) => x);

        const queryFrom = querySplit[1];
        const querySeq = querySplit[2];
        const queryTo = querySplit[3];

        // Here you can determine the program used. With diamond it's either a
        // blastp or a blastx. The trick is that for a blastx the length is 3
        // times bigger because a codon is a sequence of three nucleotides.
        if (typeof this.algorithm === 'undefined') {
          const pairwireLength = (Number(queryTo) - (Number(queryFrom) - 1));
          if (pairwireLength === 60) {
            this.program = 'blastp';
          } else if (pairwireLength === 180) {
            this.program = 'blastx';
          }
        }

        // Get the position of sequence.
        const sampleSeq = querySeq.substring(0, 5);
        const posSeq = line.indexOf(sampleSeq);

        // Store the index of query sequence.
        this.pairWise.position_query = Number(posSeq);

        // Add once query from.
        if (typeof this.pairWise.iteration_hits.slice(-1)[0]['query-from'] === 'undefined') {
          this.pairWise.iteration_hits.slice(-1)[0]['query-from'] = Number(queryFrom);
        }

        // Update query to.
        this.pairWise.iteration_hits.slice(-1)[0]['query-to'] = Number(queryTo);

        // Concatenates query sequences information.
        if (typeof this.pairWise.iteration_hits.slice(-1)[0]['query-seq'] === 'undefined') {
          this.pairWise.iteration_hits.slice(-1)[0]['query-seq'] = querySeq;
        } else {
          this.pairWise.iteration_hits.slice(-1)[0]['query-seq'] = this.pairWise.iteration_hits.slice(-1)[0]['query-seq'].concat(querySeq);
        }
      }
      if (typeof this.pairWise.iteration_hits !== 'undefined' && typeof this.pairWise.position_query !== 'undefined') {
        const regexMidline = (
          this.program === 'blast'
            ? /(^Alignments|>|^Sequence|^Range|^Score:|^Method|^Identities|^Query|^Sbjct)/
            : /(^Query|^Length=|>|^Score =|^Identities =|^Sbjct|^Frame =)/
        );
        if (!regexMidline.test(line.trim()) && !!line) {
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

        // Split/remove the spaces and get the sequence. (Gaps are separated by
        // dashes).
        const hitSplit = hitAllSeq.split(' ').filter((x) => x);

        const hitFrom = hitSplit[1];
        const hitSeq = hitSplit[2];
        const hitTo = hitSplit[3];

        // Add once hit-from.
        if (typeof this.pairWise.iteration_hits.slice(-1)[0]['hit-from'] === 'undefined') {
          this.pairWise.iteration_hits.slice(-1)[0]['hit-from'] = Number(hitFrom);
        }

        // Update hit-to.
        this.pairWise.iteration_hits.slice(-1)[0]['hit-to'] = Number(hitTo);

        // Concatenates informations.
        if (typeof this.pairWise.iteration_hits.slice(-1)[0]['hit-seq'] === 'undefined') {
          this.pairWise.iteration_hits.slice(-1)[0]['hit-seq'] = hitSeq;
        } else {
          this.pairWise.iteration_hits.slice(-1)[0]['hit-seq'] = this.pairWise.iteration_hits.slice(-1)[0]['hit-seq'].concat(hitSeq);
        }
      }
    }
  };

  /**
   * Save the last hit sequence in the collection.
   * @function
   */
  lastPairwise = () => {

    this.similarSeqBulkOp.find({
      iteration_query: this.pairWise.iteration_query,
    }).upsert().update(
      {
        $set: {
          program_ref: this.program,
          algorithm_ref: this.algorithm,
          matrix_ref: this.matrix,
          database_ref: this.database,
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

    return this.similarSeqBulkOp.execute();
  };
}

export default PairwiseProcessor;

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

// Reads pairwise (.txt) output files.
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

  parse = (line) => {
    // if (/^BLAST/.test(line) && typeof this.program === 'undefined') {
    //   // Get the algorithm blastp of blastn.
    //   const algorithm = line.split(' ')[0].toLowerCase();

    //   this.program = algorithm;
    // }
    if (line.length !== 0 || !(/^BLAST/.test(line))) {
      if (/^Query=/.test(line) || /^Query #/.test(line)) {
        // Get the query (e.g : 'Query= MMUCEDO_000001-T1').
        const queryLine = line;
        logger.log('queryLine 1:', queryLine);

        // Remove the beginning (result -> MMUCEDO_000001-T1).
        let queryClean;
        if (this.program === 'diamond') {
          queryClean = queryLine.replace('Query= ', '').split(' ')[0];
        } else if (this.program === 'blast') {
          queryClean = queryLine.replace('Query #', '').split(': ')[1].split(' ')[0];
        }

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

          // logger.log('Complete query 2:', this.pairWise);

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
          this.similarSeqBulkOp.execute();
        }

        logger.log('queryLine3  :', queryLine);
        // Creation of a new subpart of pairwise.
        this.pairWise = new Pairwise({});
        this.pairWise.iteration_query = queryClean;
        this.pairWise.iteration_hits = [];
      }
      if (/Length/.test(line)) {
        // Get the length (e.g : Length=1022).
        const length = line;

        // Clean length (result -> 1022).
        const lengthClean = (
          this.program === 'blast'
            ? length.split('Length:')[1]
            : length.replace('Length=', '')
        );

        logger.log('Accession length --- :', lengthClean);

        // If the length already has a value but it is found again, it is the
        // length of the hit sequence. We want to import only the length of the
        // target sequence.
        if (typeof this.pairWise.query_length === 'undefined') {
          // Add information.
          this.pairWise.query_length = Number(lengthClean);
        } else {
          //
          if (this.pairWise.iteration_hits.slice(-1)[0].accession_len) {
            this.pairWise.iteration_hits.slice(-1)[0].identical_protein.slice(-1)[0].accession_len = lengthClean;
          } else {
            // Add accession length information.
            this.pairWise.iteration_hits.slice(-1)[0].accession_len = Number(lengthClean);
          }
        }
      }
      if (/^>/.test(line)) {
        // If > create a new dictionary which will be added to the
        // iteration_hits array.

        // Get the definition of the query. (e.g : >KAG2206553.1 hypothetical);
        const defQuery = line;
        logger.log(line);

        // Clean definition (e.g : KAG2206553.1 hypothetical).
        const defQueryClean = defQuery.replace('>', '');

        logger.log('this.pairWise.iteration_hits.length', this.pairWise.iteration_hits.length);

        if (this.pairWise.iteration_hits.length !== 0) {
          logger.log('this.pairWise.iteration_hits:', Object.keys(this.pairWise.iteration_hits.slice(-1)[0]).length);
          logger.log('this.pairWise.iteration_hits.slice(-1)[0].length === 2', this.pairWise.iteration_hits.slice(-1)[0].length);
          if (Object.keys(this.pairWise.iteration_hits.slice(-1)[0]).length === 3
              || Object.keys(this.pairWise.iteration_hits.slice(-1)[0]).length === 4) {
            logger.log('identical protein detected !');
            // Identical protein.
            if (!this.pairWise.iteration_hits.slice(-1)[0].identical_protein) {
              this.pairWise.iteration_hits.slice(-1)[0].identical_protein = [{}];
            } else {
              this.pairWise.iteration_hits.slice(-1)[0].identical_protein.push({});
            }
            this.pairWise.iteration_hits.slice(-1)[0].identical_protein.slice(-1)[0].def = defQueryClean;
          } else {
            logger.log('Simple protein');
            this.pairWise.iteration_hits.push({});

            // Adds or concatenates information.
            this.pairWise.iteration_hits.slice(-1)[0].def = defQueryClean;
          }
        } else {
          logger.log('Simple protein');
          this.pairWise.iteration_hits.push({});

          // Adds or concatenates information.
          this.pairWise.iteration_hits.slice(-1)[0].def = defQueryClean;
        }
        // this.pairWise.iteration_hits.slice(-1)[0].identical_protein_def = line.replace('>', '');

        if (this.program === 'diamond') {
          // Get the identifiant (e.g : KAG2206553.1).
          const identifiant = defQueryClean.split(' ')[0];

          this.pairWise.iteration_hits.slice(-1)[0].id = identifiant;
        }
      }
      // Get the sequence ID (id in the collection) only for blast pairwise
      // file.
      if (/^Sequence ID:/.test(line)) {
        // Get the identifiant.
        const identifiantLine = line;

        // Clean blast identifaint;
        const identifiantClean = identifiantLine.replace('Sequence ID: ', '').split(' ')[0];

        //
        if (this.pairWise.iteration_hits.slice(-1)[0].id) {
          this.pairWise.iteration_hits.slice(-1)[0].identical_protein.slice(-1)[0].id = identifiantClean;
        } else {
          // Add identifiant information.
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

        // Add informations.
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
        // const queryLen = (
        //   this.program === 'blast'
        //     ? identitiesNoClean.replace('Identities:', '').split('/')[1].split('(')[0]
        //     : identitiesNoClean.replace('Identities = ', '').split('/')[1].split(' ')[0]
        // );
        //logger.log('?-----------------QUERYLEN:', queryLen);
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
        // this.pairWise.iteration_hits.slice(-1)[0].length = Number(queryLen);
        // this.pairWise.query_length = Number(queryLen);
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
        logger.log('Query  ?', line);
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
          logger.log('-------------pairwire length :', pairwireLength);
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
        logger.log('posSeq :', posSeq);
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
          logger.log('------------------- : ', this.pairWise.position_query);
          logger.log(line);
          logger.log('1-------------');
          let midlineClean = line.substring(
            this.pairWise.position_query,
            (this.pairWise.position_query + 60),
          );
          logger.log(midlineClean);
          logger.log('2-------------');

          // Fix the bug with spaces at the end of a sequence.
          if (midlineClean.length < 60) {
            midlineClean += ' '.repeat((60 - midlineClean.length));
          }
          logger.log('after 60 fix', midlineClean);
          logger.log('3-------------');

          // Concatenates informations.
          if (typeof this.pairWise.iteration_hits.slice(-1)[0]['midline'] === 'undefined') {
            logger.log('final :', midlineClean);
            this.pairWise.iteration_hits.slice(-1)[0]['midline'] = midlineClean;
          } else {
            logger.log('intermediate :', midlineClean);
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

  lastPairwise = () => {
    // When the file is finished, you must save the last query in a collection.
    logger.log('last pairwise :', this.pairWise);

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
    this.similarSeqBulkOp.execute();
  };
}

export default PairwiseProcessor;

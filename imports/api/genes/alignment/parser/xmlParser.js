/*eslint dot-notation: ["error", { "allowPattern": "^[a-z]+(_[a-z]+)+$" }]*/
import { similarSequencesCollection } from '/imports/api/genes/alignment/similarSequenceCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';

/**
 * Read the xml stream from a BLAST or Diamond file. The alignment collection in
 * database is completed with mongodb and bulk-operations.
 * @class
 * @constructor
 * @public
 * @param {string} program - The program used (BLAST or Diamond).
 * @param {string} algorithm - The algorithm used (blastx, blastp ...).
 * @param {string} matrix - The substitution matrix used for alignment (BLOSUM).
 * @param {string} database - The reference database (Non-redundant protein sequences (nr)).
 */

class XmlProcessor {
  constructor(program, algorithm, matrix, database) {
    this.genesDb = Genes.rawCollection();
    this.program = program;
    this.algorithm = algorithm;
    this.matrix = matrix;
    this.database = database;
    this.similarSeqBulkOp = similarSequencesCollection.rawCollection().initializeUnorderedBulkOp();
  }

  /**
   * Return an array from an item
  */
  expectArray = (obj) => {
    if (Array.isArray(obj)){
      return obj
    }
    return [obj]
  }


  /**
   * Filter the prefix matches the bank (gb, emb ...).
   * e.g: gb|KAG0740174.1| becomes KAG0740174.1.
   * @function
   * @param {string} str - The string.
   */
  filterPrefixBank = (str) => {
    const filter = (
      /\|/.test(str)
        ? str.split('|')[1]
        : str
    );
    return filter;
  };

  /**
   * Parse the XML file and collect the information.
   * @function
   * @param {stream} obj - The stream object of an XML file.
   */
  parse = async (obj) => {
    if (this.algorithm === undefined) {
      if (obj['blastoutput_program'] !== undefined) {
        this.algorithm = obj['blastoutput_program'];
      } else {
        this.algorithm = undefined;
      }
    }

    if (this.matrix === undefined) {
      if (obj['blastoutput_param']['parameters_matrix'] !== undefined) {
        this.matrix = obj['blastoutput_param']['parameters_matrix'];
      } else {
        this.matrix = undefined;
      }
    }

    if (this.database === undefined) {
      if (obj['blastoutput_db'] !== undefined) {
        this.database = obj['blastoutput_db'];
      } else {
        this.database = undefined;
      }
    }

    if (obj['blastoutput_iterations'] !== undefined) {
      // Force an array, even when there is only one element
      const blastIteration = this.expectArray(obj['blastoutput_iterations'])

      const iterLength = blastIteration.length

      for (let i = 0; i < iterLength; i += 1) {
      /** Get and split iteration query
         * e.g: 'MMUCEDO_000001-T1 becomes MMUCEDO_000001'.
         */

        const iterationQuery = blastIteration[i]['iteration_query-def']

        const splitIterationQuery = iterationQuery.split(' ');

        await Promise.all(splitIterationQuery.map(async (iter) => {
          /** Chek if the queries exist in the genes collection. */
          const subfeatureIsFound = await this.genesDb.findOne({ 'subfeatures.ID': iter });
          if (typeof subfeatureIsFound !== 'undefined' && subfeatureIsFound !== null) {
            /** Get the total query sequence length. */
            const queryLen = blastIteration[i]['iteration_query-len']

            /** Get the root tag of hit sequences. */
            const iterationHits = this.expectArray(blastIteration[i]['iteration_hits'])

            /** Reset the iterations array. */
            const iterations = [];

            /** Iterates hit sequences. */
            iterationHits.forEach((hit) => {
              const hitNumber = hit['hit_num'];

              const hitId = this.filterPrefixBank(hit['hit_id']);
              /** Get the first description if there are identical proteins. */
              const hitDef = (
                hit['hit_def'].split('>').length > 1
                  ? hit['hit_def'].split('>')[0]
                  : hit['hit_def']
              );

              /** Check if identical proteins. */
              const identicalProteins = (
                hit['hit_def'].split('>').length > 1
                  ? hit['hit_def'].split('>').slice(1).map((ips) => (
                    {
                      def: ips,
                      id: this.filterPrefixBank(ips.split(' ')[0]),
                    }
                  ))
                  : undefined
              );

              /** Get hit sequences information. */
              const hitAccession = hit['hit_accession'];
              const hitLengthAccession = hit['hit_len'];
              const hitHspBitScore = hit['hit_hsps']['hsp_bit-score'];
              const hitHspScore = hit['hit_hsps']['hsp_score'];
              const hitEvalue = hit['hit_hsps']['hsp_evalue'];
              const QueryFrom = hit['hit_hsps']['hsp_query-from'];
              const QueryTo = hit['hit_hsps']['hsp_query-to'];
              const hitFrom = hit['hit_hsps']['hsp_hit-from'];
              const hitTo = hit['hit_hsps']['hsp_hit-to'];
              const hitLength = hit['hit_hsps']['hsp_align-len'];
              const hitIdentity = hit['hit_hsps']['hsp_identity'];
              const hitPositive = hit['hit_hsps']['hsp_positive'];
              const hitGaps = hit['hit_hsps']['hsp_gaps'];
              const querySeq = hit['hit_hsps']['hsp_qseq'];
              const hitMidline = hit['hit_hsps']['hsp_midline'];
              const hitSeq = hit['hit_hsps']['hsp_hseq'];

              /** Organize the data and push the dictionary. */
              iterations.push({
                num: hitNumber,
                id: hitId,
                def: hitDef,
                identical_proteins: identicalProteins,
                accession: hitAccession,
                accession_len: hitLengthAccession,
                length: hitLength,
                'bit-score': hitHspBitScore,
                score: hitHspScore,
                evalue: hitEvalue,
                'query-from': QueryFrom,
                'query-to': QueryTo,
                'hit-from': hitFrom,
                'hit-to': hitTo,
                identity: hitIdentity,
                positive: hitPositive,
                gaps: hitGaps,
                'query-seq': querySeq,
                midline: hitMidline,
                'hit-seq': hitSeq,
              });
            });

            // Push the identifier of the gene rather the name of the sequences.
            const geneIdentifier = subfeatureIsFound.ID;

            /** Mongo bulk-operation. */
            this.similarSeqBulkOp.find({
              iteration_query: geneIdentifier,
            }).upsert().update(
              {
                $set: {
                  program_ref: this.program,
                  algorithm_ref: this.algorithm,
                  matrix_ref: this.matrix,
                  database_ref: this.database,
                  iteration_query: geneIdentifier,
                  query_len: queryLen,
                  iteration_hits: iterations,
                },
              },
              {
                upsert: false,
                multi: true,
              },
            );
          } else {
            logger.warn(`Warning ! No sub-feature was found for ${iter}.`);
          }
        }));
      }
      if (this.similarSeqBulkOp.length > 0) {
        return this.similarSeqBulkOp.execute();
      }
    }
  };
}

export default XmlProcessor;


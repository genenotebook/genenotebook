import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';
import { getGeneSequences } from '/imports/api/util/util.js';

class DiamondTsvProcessor {
  constructor(program, matrix, database) {
    this.genesDb = Genes.rawCollection();
    this.program = program;
    this.matrix = matrix;
    this.database = database;
  }

  parse = async (line) => {
    // Get all 12 defaults preconfigured fields.
    const [
      iteration_query, // query accesion.
      id, // hit accesion.
      identity, // % of identity.
      hitLength, // the total length of the local alignment.
      mismatch,
      gapopen, // the number of gap openings..
      query_from,
      query_end,
      hit_from,
      hit_to,
      evalue,
      bit_score,
    ] = line.split('\t');

    // Organize diamont data in a dictionary.
    const iterations = {
      id: id,
      'bit-score': bit_score,
      evalue: evalue,
      'query-from': query_from,
      'query-to': query_end,
      'hit-from': hit_from,
      'hit-to': hit_to,
      identity: identity,
      gaps: gapopen,
    };

    // If subfeatures is found in genes database (e.g: ID =
    // MMUCEDO_000002-T1).
    const subfeatureIsFound = await this.genesDb.findOne(
      { 'subfeatures.ID': iteration_query },
    );

    if (typeof subfeatureIsFound !== 'undefined' && subfeatureIsFound !== null) {
      // Get the total query protein length.
      const seqProtein = getGeneSequences(subfeatureIsFound);

      // Remove the * character for the stop codon in the protein sequence
      // length count.
      const lenProtein = seqProtein[0].prot.replace('*', '').length;

      // Update or insert if no matching documents were found.
      const documentDiamond = diamondCollection.upsert(
        { iteration_query: iteration_query }, // selector.
        {
          $set: // modifier.
          {
            program_ref: this.program,
            matrix_ref: this.matrix,
            database_ref: this.database,
            iteration_query: iteration_query,
            query_len: lenProtein,
          },
        },
      );

      // Update or create if no matching documents were found
      if (typeof documentDiamond.insertedId !== 'undefined') {
        // Diamond _id is created in gene collection.
        this.genesDb.update(
          { 'subfeatures.ID': iteration_query },
          { $set: { diamondId: documentDiamond.insertedId } },
        );

        diamondCollection.update(
          { iteration_query: iteration_query },
          {
            $push: {
              iteration_hits: iterations,
            },
          },
        );
      } else {
        // Diamond collection already exists.
        const diamondId = diamondCollection.findOne({ 'iteration_query': iteration_query })._id;
        diamondCollection.update(
          { _id: diamondId },
          {
            $addToSet: {
              iteration_hits: iterations,
            },
          },
        );
      }
    } else {
      logger.warn(`Warning ! No sub-feature was found for ${iteration_query}.`);
    }
  };
}

export default DiamondTsvProcessor;

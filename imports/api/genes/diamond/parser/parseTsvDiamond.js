import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';

class DiamondTsvProcessor {
  constructor() {
    this.genesDb = Genes.rawCollection();
  }

  parse = async (line) => {
    // Get all 12 defaults preconfigured fields.
    const [
      qseqid,
      sseqid,
      pident,
      hitLength,
      mismatch,
      gapopen,
      qstart,
      qend,
      sstart,
      send,
      hitEvalue,
      bitscore,
    ] = line.split('\t');

    // Organize diamont data in a dictionary.
    const iterations = {
      id: sseqid,
      length: hitLength,
      'bit-score': bitscore,
      evalue: hitEvalue,
      'query-from': qstart,
      'query-to': qend,
    };

    // If subfeatures is found in genes database (e.g: ID =
    // MMUCEDO_000002-T1).
    const subfeatureIsFound = await this.genesDb.findOne(
      { 'subfeatures.ID': qseqid },
    );

    if (typeof subfeatureIsFound !== 'undefined' && subfeatureIsFound !== null) {
      // Update or insert if no matching documents were found.
      const documentDiamond = diamondCollection.upsert(
        { iteration_query: qseqid }, // selector.
        {
          $set: // modifier.
          {
            iteration_query: qseqid,
          },
        },
      );

      // Update or create if no matching documents were found
      if (typeof documentDiamond.insertedId !== 'undefined') {
        diamondCollection.update(
          { iteration_query: qseqid },
          {
            $push: {
              iteration_hits: iterations,
            },
          },
        );
      } else {
        // Diamond collection already exists.
        const diamondId = diamondCollection.findOne({ 'iteration_query': qseqid })._id;
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
      logger.warn(`Warning ! No sub-feature was found for ${qseqid}.`);
    }
  };
}

export default DiamondTsvProcessor;

import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import logger from '/imports/api/util/logger.js';

class DiamondTsvProcessor {
  constructor() {
    this.genesDb = Genes.rawCollection();
  }

  parse = (line) => {
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
  };
}

export default DiamondTsvProcessor;

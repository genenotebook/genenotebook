import { Transcriptomes, ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';
import { getGeneSequences } from '/imports/api/util/util.js';
import logger from '/imports/api/util/logger.js';

/**
 * From the information of a gene convert and return the information in raw text
 * in the chosen format (e.g. gff3, fasta, tsv).
 * @class
 * @constructor
 * @public
 */
class DownloadDataConversion {
  /**
   * Assemble the gene information to build a file in gff3 format.
   * (Used in the Annotation view of the download module).
   * https://github.com/The-Sequence-Ontology/Specifications/blob/master/gff3.md
   * @function
   * @param {Object} gene - The gene document from collection e.g. { 'ID' : 'Ciclev10030451m', ...}
   * @returns {String} - return a gff3.
   */
  convertGff3Format = ({ gene }) => {
    const {
      seqid,
      source,
      start: geneStart,
      end: geneEnd,
      score: geneScore,
      strand,
      attributes: geneAttributes,
      subfeatures,
    } = gene;

    /**
     * For column 9 : "attributes" of a gff3 we return the concatenation of
     * attributes in the tag=value format. (Multiple tag=value pairs are separated
     * by semicolons).
     * @function
     * @inner
     * @param attributes {Object} - Feature attributes e.g. {"Name": ["Ciclev10030451m"]};
     * @returns {String} Return attributes to format tags=values : "Name":
     * ["Ciclev10030451m"] becomes Name=Ciclev10030451m;
     */
    function setAttrToTagValueFormat(attributes) {
      return Object.entries(attributes)
        .map(([k, v]) => `${k}=${v}`)
        .join(';');
    }

    /** Create the list in gff3 format for each subfeatures. */
    const gffLines = subfeatures.map(
      ({
        type: subType,
        start: subStart,
        end: subEnd,
        score: subScore,
        phase: subPhase,
        attributes: subAttributes,
        parents,
      }) => {
        // eslint-disable-next-line no-param-reassign
        subAttributes.Parent = parents;

        /** Get gene attributes to tag=value format. */
        const subAttributeString = setAttrToTagValueFormat(subAttributes);

        /** Gather information to create a gff3 line. */
        return `${seqid}\t${source}\t${subType}\t${subStart}\t${subEnd}\t${subScore}\t${strand}\t${subPhase}\t${subAttributeString}`;
      },
    );

    /** Add to the beginning of the list the attributes of the gene. */
    const geneAttributeString = setAttrToTagValueFormat(geneAttributes);
    const geneLine = `${seqid}\t${source}\tgene\t${geneStart}\t${geneEnd}\t${geneScore}\t${strand}\t-\t${geneAttributeString}`;
    gffLines.unshift(geneLine);

    /** Convert array to string. */
    return gffLines.join('\n');
  };

  /**
   * Assemble the gene(s) sequences to build a file in fasta format.
   * (Used in the Sequence view of the download module).
   * @function
   * @param {Object} gene - The gene document from collection e.g. { 'ID' : 'Ciclev10030451m', ...}.
   * @param {Object} options - The options of the sequence part of the download module.
   * @returns {String} Return a fasta file.
   */
  convertFastaFormat = ({ gene, options }) => {
    const { seqType, primaryTranscriptOnly } = options;

    /**
     * Get nucleotide and protein sequences of all transcripts for a single gene
     * (using CDS subfeatures).
     */
    const sequences = getGeneSequences(gene).sort((a, b) => b.nucl.length - a.nucl.length);

    const slice = primaryTranscriptOnly ? 1 : sequences.length;
    const fastaArray = sequences.slice(0, slice).map((seq) => {
      const seqString = seq[seqType].match(/.{1,80}/g).join('\n');
      return `>${seq.ID}\n${seqString}`;
    });

    /** Convert array to string. */
    return fastaArray.join('\n');
  };

  /**
   * Assemble the transcriptome abundances to build a file in tsv format.
   * (Used in the Expression view of the download module).
   * @function
   * @param {Object} gene - The gene document from collection e.g. { 'ID' : 'Ciclev10030451m', ...}
   * @param {Object} options - The options of the expression part (transcriptomes).
   * @returns {String} - Return transcriptome abundance in tsv format.
   */
  AbundanceTsvFormat = ({ gene, options }) => {
    const { ID: geneId } = gene;
    const { selectedSamples } = options;

    const line = selectedSamples.map((replicaGroup) => ExperimentInfo.find({ replicaGroup })
      .fetch()
      .map(({ _id }) => _id)
      .sort()
      .map((experimentId) => {
        const { tpm = 'NA' } = Transcriptomes.findOne({
          geneId,
          experimentId,
        }) || {};
        return tpm;
      })
      .join('\t'));

    line.unshift(geneId);

    return line.join('\t');
  };

  /**
   * Add header to the top of the file e.g. #gff3-version 3.
   * @function
   * @param {String} format - The type of conversion e.g. gff3, fasta, tsv.
   * @param {String} options - The options is exists.
   * @returns {String|null} The header.
   */
  getFormatHeader = ({ format, options }) => {
    switch (format) {
      case 'gff3':
        return '##gff-version 3\n';
      case 'fasta':
        return null;
      case 'tsv':
        return `gene_id\t${options.selectedSamples.join('\t')}\n`;
      default:
        return null;
    }
  };

  /**
   * Select the type of conversion according to the format.
   * @function
   * @param {String} format - The type of conversion e.g. gff3, fasta, tsv.
   * @param {Object} gene - The gene document from collection e.g. { 'ID' : 'Ciclev10030451m', ...}
   * @param {Object} options - The options is exists.
   * @returns {function} - Return the conversion result.
   */
  getConverter = ({ format, gene, options }) => {
    switch (format) {
      case 'gff3':
        return this.convertGff3Format({ gene });
      case 'fasta':
        return this.convertFastaFormat({ gene, options });
      case 'tsv':
        return this.AbundanceTsvFormat({ gene, options });
      default:
        return gene.ID;
    }
  };
}

export default DownloadDataConversion;

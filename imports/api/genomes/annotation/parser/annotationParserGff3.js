import logger from '../../../util/logger';
import { parseAttributeString } from '../../../util/util';
import { genomeSequenceCollection, genomeCollection } from '../../genomeCollection';
import { Genes, GeneSchema } from '../../../genes/geneCollection';

/**
 * Read the annotation file in gff3 format. Add to the gene collection of
 * mongoDB all the information about the genes. Each gene is structured with a
 * top level which is the general information of the gene and
 * sub-features which includes mRNA, exons, cds ...
 * @class
 * @constructor
 * @public
 * @param {String} filename - The filename (allows to track the annotation in
 * the genome collection and in the admin panel).
 * @param {String} genomeID - The mongDB ID of a genome collection.
 * @param {Boolean} verbose - View more details.
 */
class AnnotationProcessor {
  constructor(filename, annotationName, genomeID, re_protein=undefined, re_protein_capture="^(.*?)$", attr_protein=undefined, verbose = true) {
    this.filename = filename;
    this.genomeID = genomeID;
    this.verbose = verbose;
    this.annotationName = annotationName

    // Protein ID stuff
    // Regex options .
    this.re_protein = re_protein;
    this.re_protein_capture = re_protein_capture;
    // Optional GFF attribute
    this.attr_protein = attr_protein;

    // Number of insertion.
    this.nAnnotation = 0;

    // Initialize gene bulk operation (mongoDB).
    this.geneBulkOperation = Genes.rawCollection().initializeUnorderedBulkOp();
    this.isReset = false

    // Object of a gene with the following hierarchy: gene → subfeatures
    // -> [transcript, exons, cds, ...].
    this.geneLevelHierarchy = {};

    // The raw sequence of the gene.
    this.rawSequence = '';
    this.shiftSequence = 0;

    // Store the index (value) and the ID of the parents (key) of the gene and
    // the subfeatures in order to find the children of each one with an
    // algorithm between O(1) and O(log(n)) with dict[key] e.g
    // (this.IdParents[parents[0]] in addChildren function).
    this.IdParents = {};
    this.indexIdParent = 0;

    this.cds_ids = {};
  }

  /**
   * Get the protein ID from the element ID + user parameters
   * @function
   * @param {String} ident - The identifier of the element (1st field of gff3).
   * @param {Object} filteredAttr - Object of element attributes
   * returns {String} - Returns the ID and the protein ID (mongoDB does not store
   * undefined values)
   */
  getProteinID = (ident, filteredAttr) => {
    if (
      typeof this.re_protein !== 'undefined'
        && typeof this.re_protein_capture !== 'undefined'
        && !!ident.match(this.re_protein_capture)
    ) {
      const result = ident.replace(new RegExp(this.re_protein_capture), this.re_protein);
      return result;
    }
    if (typeof this.attr_protein !== 'undefined' && typeof filteredAttr[this.attr_protein] !== 'undefined'){
        return filteredAttr[this.attr_protein][0];
    }

    return ident.concat('-protein');
  };

  /**
   * Return the value of the "attr_protein" of the CDS attribute
   * @function
   * @param {Object} filteredAttr - Object of element attributes
   * returns {String} - Returns the ID if it exists
   */
  getCDSProtein = (filteredAttr) => {
    let protein_id
    if (typeof filteredAttr[this.attr_protein] !== 'undefined'){
    	protein_id = filteredAttr[this.attr_protein][0]
    }
    return protein_id
  };


  /**
   * Function that returns the total number of insertions or updates in the
   * gene collection.
   * @function
   * @return {Number} Return the total number of insertions or updates of
   * gene.
   */
  getNumberAnnotation() {
    return this.nAnnotation;
  }

  /**
   * From the attribute of a gff(3) (last field) return the identifier.
   * In the rare case where the identifier is not present, assign the parent
   * identifier.
   * @function
   * @param {Object} attributesGff - The attributes of a gff (last field) in a
   * key:value object. (e.g: attributes : {ID: [ 'BniB01g000050.2N.1.exon12' ],
   * Parent: [ 'BniB01g000050.2N.1' ]}
   * @returns {String} The identifier (ID).
   */
  getIdentifier = (attributesGff) => {
    if (!Object.prototype.hasOwnProperty.call(attributesGff, 'ID')) {
      if (this.verbose) {
        logger.warn('The line does not have the gff3 ID attribute:');
      }
      if (Object.prototype.hasOwnProperty.call(attributesGff, 'Parent')) {
        return attributesGff.Parent[0];
      }
      throw new Error('Impossible to give ID or Parent attribute.');
    }
    return attributesGff.ID[0];
  };

  /**
   * From the attributes of a gff(3) (last field), return the parent(s).
   * @function
   * @static
   * @param {Object} attributesGff - The attributes of a gff (last field) in a
   * key:value object. (e.g: attributes : {ID: [ 'BniB01g000050.2N.1.exon12' ],
   * Parent: [ 'BniB01g000050.2N.1' ]}
   * @returns {Array} The list of parent(s).
   */
  static getParents = (attributesGff) => {
    const attributesKeys = Object.keys(attributesGff);
    let parents = [];
    attributesKeys.forEach((key) => {
      if (key === 'Parent') {
        parents = attributesGff[key];
      }
    });
    return parents;
  };

  /**
   * Find the raw sequence from the genome collection of mongoDB.
   * @function
   * @param {String} seqid - The name of the sequence where the feature is
   * located (first field of the gff).
   * @param {Number} start - Genomic start of the feature.
   * @param {Number} end - Genomic end of the feature.
   */
  findSequenceGenome = (seqid, start, end) => {
    let shiftCoordinates = 10e99;

    // Request the genome collection in mongoDB.
    const genomicRegion = genomeSequenceCollection.find(
      {
        genomeId: this.genomeID,
        header: seqid,
        start: { $lte: end },
        end: { $gte: start },
      },
    ).fetch().sort((a, b) => a.start - b.start).map((seqPart) => {
      shiftCoordinates = Math.min(shiftCoordinates, seqPart.start);
      return seqPart.seq;
    })
      .join('');

    this.rawSequence = genomicRegion;
    this.shiftSequence = shiftCoordinates;
  };

  /**
   * Splits the sequence (e.g: for mRNA, exons, cds... ).
   * @function
   * @param {String} seq - The complete sequence.
   * @param {Number} shiftCoordiantes - .
   * @param {Number} start - Genomic start of the feature.
   * @param {Number} end - Genomic end of the feature.
   * @returns {String} Return the split sequence.
   */
  static splitRawSequence = (seq, shiftCoordinates, start, end) => {
    if (!seq.length > 0) {
      return '';
    }
    return seq.slice(start - shiftCoordinates - 1, end - shiftCoordinates);
  };

  /**
   * To avoid duplicates we remove the keys values of the ID identifier and the
   * parents.
   * @function
   * @static
   * @param {Object} attributesGff - The attributes of a gff (last field) in a
   * key:value object. (e.g: attributes : {ID: [ 'BniB01g000050.2N.1.exon12' ],
   * Parent: [ 'BniB01g000050.2N.1' ]}
   * @returns {Object} Return attributes object without his ID and Parent keys.
   */
  static filterAttributes = (attributesGff) => {
    const filteredAtt = Object.fromEntries(
      Object.entries(attributesGff).filter(([key]) => key !== 'ID' && key !== 'Parent'),
    );
    return filteredAtt;
  };

  /**
   * Checks if the gff(3) format contains 9 fields per line.
   * @function
   * @static
   * @param {Array} arrayLine - One line (of a gff) split by tab. (e.g: ) ['B1',
   * 'AAFC_GIFS', 'mRNA', '21550', '22460', '.', '-', '.',
   * 'ID=BniB01g000040.2N.1;Name=BniB01g000040.2N.1;Parent=BniB01g000040.2N']
   * @returns {Boolean} Return true if the line has 9 fields.
   */
  static isNineFields = (arrayLine) => {
    if (!arrayLine.length === 9) {
      return false;
    }
    return true;
  };

  /**
   * Simple function that checks if the dictionary is empty.
   * @function
   * @static
   * @param {Object} obj - The dictionary.
   * @returns {Boolean} Return true if the dictionary is empty.
   */
  static isEmpty = (obj) => Object.keys(obj).length === 0;

  /**
   * Stores the ID of the parents (key) of the gene and subfeatures and
   * increments the index (value - position of the gene or subfeature in the
   * array) in order to find the children of each one with an algorithm between
   * O(1) and O(log(n)) later with the addChildren function.
   * @function
   * @param {Boolean} isInit - True if the identifier initializes a gene (top
   * level), false if it is a sub feature.
   * @param {String} ID - The identifier.
   */
  setIdParents = (isInit, ID) => {
    if (isInit) {
      // Top level.
      this.IdParents[ID] = -1;
    } else {
      // subfeatures.
      this.IdParents[ID] = this.indexIdParent;

      // Increment the index.
      this.indexIdParent += 1;
    }
  };

  /**
   * Find the associated parent and complete the 'children' feature.
   * @function
   * @param {String} IDsubfeature -The identifier.
   * @param {Array} parents - The list of parents.
   */
  addChildren = (IDsubfeature, parents, overrideId=undefined) => {
    // Find the parent with an algorithm between O(1) and O(log(n)).
    const indexFeature = this.IdParents[parents[0]];
    if (indexFeature === -1 && typeof indexFeature !== 'undefined') {
      // top level.
      if (!Object.prototype.hasOwnProperty.call(this.geneLevelHierarchy, 'children')) {
        this.geneLevelHierarchy.children = [];
      }
      this.geneLevelHierarchy.children.push(IDsubfeature);
    } else {
      // subfeatures
      //Override protein ID from the CDS attribute if relevant
      if (typeof overrideId !== 'undefined' && this.geneLevelHierarchy.subfeatures[indexFeature].type === 'mRNA'){
          this.geneLevelHierarchy.subfeatures[indexFeature].protein_id = overrideId
      }

      if (!Object.prototype.hasOwnProperty.call(this.geneLevelHierarchy.subfeatures[indexFeature], 'children')) {
        this.geneLevelHierarchy.subfeatures[indexFeature].children = [];
      }
      this.geneLevelHierarchy.subfeatures[indexFeature].children.push(IDsubfeature);
    }
  };

  /**
   * Change type if called 'transcript' rather than mRNA.
   * @function
   * @param {String} type - The name of the element type (3rd field of gff3)
   * (e.g: gene, mRNA, ...).
   * @returns {String} Returns the type.
   */
  static formatTranscriptType(type) {
    if (type === 'transcript') {
      return 'mRNA';
    }
    return type;
  }

  /**
   * Returns the correct type for the phase field.
   * @function
   * @param {String} phase - The phase field.
   * @returns {Number|String} The phase field with the correct type.
   */
  static getAllowedPhase = (phase) => {
    if (['0', '1', '2'].includes(phase)) {
      return Number(phase);
    }
    return phase;
  };

  /**
   * Complete features and subfeatures of gene.
   * @function
   * @param {Boolean} isSubfeature - Define if the sub-features are mRNA,
   * exons, cds ...
   * @param {Object} features - The 9 fields of a line in gff(3) format.
   */
  completeGeneHierarchy = (isSubfeature, features) => {
    if (!isSubfeature) {
      // Initialize the gene with the features but without the attributes that
      // will be filtered and added later.
      const { attributes, phase, ...featuresWithoutAttributes } = features;
      this.geneLevelHierarchy = featuresWithoutAttributes;

      // Init IdParents.
      this.setIdParents(true, features.ID);

      // Get raw sequence.
      this.findSequenceGenome(features.seqid, features.start, features.end);

      // Get sequence.
      const sequence = this.constructor.splitRawSequence(
        this.rawSequence,
        this.shiftSequence,
        features.start,
        features.end,
      );

      // Warning if sequence is empty.
      if (sequence === '' && this.verbose) {
        logger.warn(
          `Could not find sequence for gene ${features.ID} with seqid ${features.seqid} in the interval ${features.start} - ${features.end}.`
            + ' Make sure the sequence IDs between the genome fasta and annotation gff3 are the same.',
        );
      }

      // Add sequence to the top level.
    if (typeof sequence !== 'undefined') {
        this.geneLevelHierarchy.seq = sequence;
      }

      // Filter and add attributes to avoid duplication.
      const attributesFiltered = this.constructor.filterAttributes(
        features.attributes,
      );
      this.geneLevelHierarchy.attributes = attributesFiltered;

      this.geneLevelHierarchy.subfeatures = [];
    } else {
      // Create an array if not exists for the subfeatures (exons, cds ...) of
      // the gene.
      if (typeof this.geneLevelHierarchy.subfeatures === 'undefined') {
        this.geneLevelHierarchy.subfeatures = [];
      }

      // Change type if called 'trancript' rather than mRNA.
      const typeAttr = this.constructor.formatTranscriptType(features.type);

      // Get all parents from the attributes field.
      const parentsAttributes = this.constructor.getParents(features.attributes);

      // Get the sequence (call a mongoDB fetch function, can be reduce)
      const sequence = this.constructor.splitRawSequence(
        this.rawSequence,
        this.shiftSequence,
        features.start,
        features.end,
      );

      // Warning if sequence is empty.
      if (sequence === '' && this.verbose) {
        logger.warn(
          `Could not find sequence for gene ${features.ID} with seqid ${features.seqid} in the interval ${features.start} - ${features.end}.`
            + ' Make sure the sequence IDs between the genome fasta and annotation gff3 are the same.',
        );
      }

      let identifiant = features.ID

      // Manage case of discontinuous CDS: Same ID -> we add a suffix to avoid crashing
      if (typeAttr === 'CDS'){
        if (identifiant in this.cds_ids){
           identifiant = identifiant + "." + this.cds_ids[identifiant]
           this.cds_ids[identifiant] += 1
        } else {
          this.cds_ids[identifiant] = 1
        }
      }

      let proteinID

      // Complete ID parents.
      this.setIdParents(false, identifiant);

      // Filter attributes (exclude ID, parents keys).
      const filteredAttr = this.constructor.filterAttributes(features.attributes);

      if (typeAttr === 'mRNA'){
        proteinID = this.getProteinID(
          features.ID,
          filteredAttr
        );
      }

      let overrideProteinID
      if (typeAttr === "CDS" && typeof this.attr_protein !== 'undefined'){
          overrideProteinID = this.getCDSProtein(
              filteredAttr
          )
      }

      // Get allowed phase with the correct type.
      const phaseAttr = this.constructor.getAllowedPhase(features.phase);

      // Add subfeatures.
      this.geneLevelHierarchy.subfeatures.push({
        ID: identifiant,
        protein_id: proteinID,
        type: typeAttr,
        start: features.start,
        end: features.end,
        phase: phaseAttr,
        score: features.score.toString(),
        parents: parentsAttributes,
        attributes: filteredAttr,
        seq: sequence,
      });

      // Add children.
      this.addChildren(features.ID, parentsAttributes, overrideProteinID);
    }
  };

  /**
   * Check the correspondence between the input data and the schema of the gene
   * collection.
   * @function
   * @returns {Boolean} Returns true if the data matches the schema of the gene
   * collection, false if there is an error.
   */
  isValidateGeneSchema = () => {
    // Excluded '_id' that it is not in the schema.
    const { _id, ...geneWithoutId } = this.geneLevelHierarchy;
    try {
      GeneSchema.validate(geneWithoutId);
    } catch (err) {
      logger.error(err)
      throw new Error('Current gene is not valid, stopping');
    }
    return true;
  };

  /**
   * Initialize a gene (top level).
   * @function
   */
  initGeneHierarchy = (features) => this.completeGeneHierarchy(false, features);

  /**
   * Adds the sub-features of a gene (sub-features level).
   * @function
   */
  addSubfeatures = (features) => this.completeGeneHierarchy(true, features);

  /**
   * Read line by line the annotation file in gff3 format.
   * @function
   * @param {Array} line - The line to parse and tab split by Papa Parse.
   */
  parse = (line) => {
    if (this.constructor.isNineFields(line)) {
      // The 9 fields of gff.
      const [
        seqidGff,
        sourceGff,
        typeGff,
        startGff,
        endGff,
        _scoreGff,
        strandGff,
        phaseGff,
        attributeString,
      ] = line;

      if (this.isReset){
          this.isReset = false
          this.geneBulkOperation = Genes.rawCollection().initializeUnorderedBulkOp();
      }

      // Parse gff3 attribute column into key:value object. e.g:
      // attributes : {
      //   ID: [ 'BniB01g000050.2N.1.exon12' ],
      //   Parent: [ 'BniB01g000050.2N.1' ]
      // }
      const attributesGff = parseAttributeString(attributeString);

      // Get ID (identifier);
      const identifier = this.getIdentifier(attributesGff);

      // Structures the data.
      const features = {
        ID: identifier,
        genomeId: this.genomeID,
        annotationName: this.annotationName,
        seqid: seqidGff.toString(),
        source: sourceGff,
        type: typeGff,
        start: Number(startGff),
        end: Number(endGff),
        score: _scoreGff.toString(),
        strand: strandGff,
        phase: phaseGff,
        attributes: attributesGff,
      };

      // Except for the first gene, as long as there is no new gene (3rd
      // field) we complete and store the information.
      // For each new gene the information is stored in a bulk operation
      // mongoDB.
      if (typeGff === 'gene') {
        if (this.constructor.isEmpty(this.geneLevelHierarchy)) {
          // Top level feature of the gene.
          this.initGeneHierarchy(features);
        } else {
          // Cool a new gene !

          // Increment.
          this.nAnnotation += 1;

      	  const protein_ids = this.geneLevelHierarchy.subfeatures.flatMap(children => {
            if(typeof children.protein_id === 'undefined'){
              return []
            } else {
              return children.protein_id
            }
          })

          this.geneLevelHierarchy.children = this.geneLevelHierarchy.children.concat(protein_ids)

          // Validate schema before adding to bulk
          this.isValidateGeneSchema();

          // Add to bulk operation.
          this.geneBulkOperation.insert(this.geneLevelHierarchy)

          // Reset values.
          this.geneLevelHierarchy = {};
          this.rawSequence = '';
          this.shiftSequence = 0;
          this.IdParents = {};
          this.indexIdParent = 0;
          this.cds_ids = {};

          // Init new gene.
          this.initGeneHierarchy(features);

          // Arbitrary break up of batch size to save ram
          if (this.geneBulkOperation.length > 500) {
              this.isReset = true
              let execute = Meteor.wrapAsync(this.geneBulkOperation.execute, this.geneBulkOperation);
              return execute()
          }
        }
      } else {
        // The other hierarchical levels (e.g: exons, cds, ...) of the gene.
        this.addSubfeatures(features);
      }
    } else {
      throw new Error(`${line} is not a correct gff line with 9 fields: ${line.length}`);
    }
  };

  /**
   * Save the last gene annotation in the collection and execute all mongoDB
   * operation bulks.
   * @function
   */
  lastAnnotation = () => {
    // Check if it's validated by mongoDB schema.
    this.isValidateGeneSchema();

    // Increment.
    this.nAnnotation += 1;

    // Add protein_id to gene children
    const protein_ids = this.geneLevelHierarchy.subfeatures.flatMap(children => {
      if(typeof children.protein_id === 'undefined'){
        return []
      } else {
        return children.protein_id
      }
    })

    this.geneLevelHierarchy.children = this.geneLevelHierarchy.children.concat(protein_ids)

    // Add to bulk operation.
    this.geneBulkOperation.insert(this.geneLevelHierarchy);

    // Add annotation track to genome collection.
    genomeCollection.update({
      _id: this.genomeID,
    }, {
      $push: {
        annotationTrack: {
          name: this.annotationName,
        },
      },
    });

    if (this.geneBulkOperation.length > 0) {
      return this.geneBulkOperation.execute();
    }
  };
}

export default AnnotationProcessor;

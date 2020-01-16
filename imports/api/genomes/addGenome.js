/* eslint-disable max-classes-per-file */
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import SimpleSchema from 'simpl-schema';
import fs from 'fs';
import readline from 'readline';
import Fiber from 'fibers';
import Future from 'fibers/future';

import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';
import logger from '/imports/api/util/logger.js';

/**
 * Chunk size into which DNA sequences are inserted into the database
 * @type {Number}
 */
const CHUNK_SIZE = 100000;

/**
 * Small data Class to keep track of current sequence position during fasta line parsing
 * Can be initialized empty and subsequently updated
 */
class SeqPart {
  constructor({
    seq = '', header = '', start = 0, end = 0,
  }) {
    this.seq = seq;
    this.header = header;
    this.start = start;
    this.end = end;
  }
}

/**
 * Class to keep track of state during parsing of fasta files.
 * Typically genome sequences are formatted as fasta files with the DNA per
 * fasta entry divided over multiple lines.
 * This class keeps track of where we are during file parsing and adds a bulk insertion
 * job once we have parsed more thank CHUNK_SIZE basepairs.
 * When parsing is finished the finalize method cleans up and executes the bulk operation.
 */
class LineProcessor {
  constructor({ genomeId, permission }) {
    this.seqPart = new SeqPart({});
    this.bulkOp = genomeSequenceCollection.rawCollection().initializeUnorderedBulkOp();
    this.genomeId = genomeId;
    this.permission = permission;
    this.isPublic = false;
  }

	/**
	 * Process a fasta formatted line
	 * @param  {String} line [description]
	 * @return {None}
	 */
	process = (line) => {
	  const {
	    genomeId, permission, isPublic,
	    seqPart, bulkOp,
	  } = this;

	  if (line[0] === '>') {
	    // process header line
	    if (seqPart.header.length && seqPart.seq.length) {
	      seqPart.end += seqPart.seq.length;

	      const {
	        header, seq, start, end,
	      } = seqPart;
	      bulkOp.insert({
	        header,
	        seq,
	        start,
	        end,
	        genomeId,
	        permission,
	        isPublic,
	      });
	    }
	    const header = line.substring(1).split(' ')[0];
	    this.seqPart = new SeqPart({ header });
	  } else {
	    // process sequence line
	    seqPart.seq += line.trim();
	    if (seqPart.seq.length > CHUNK_SIZE) {
	      seqPart.end += CHUNK_SIZE;
	      const { header, start, end } = seqPart;
	      const seq = seqPart.seq.substring(0, CHUNK_SIZE);
	      bulkOp.insert({
	        header,
	        seq,
	        start,
	        end,
	        genomeId,
	        permission,
	        isPublic,
	      });
	      seqPart.seq = this.seqPart.seq.substring(CHUNK_SIZE);
	      seqPart.start += CHUNK_SIZE;
	    }
	  }
	}

	/**
	 * Adds the remaining sequence as a bulk insertion job and executes the bulk operation
	 * @return {[type]} [description]
	 */
	finalize = () => {
	  const {
	    genomeId, permission, isPublic,
	    seqPart, bulkOp,
	  } = this;

	  seqPart.end += seqPart.seq.length;

	  const {
	    header, seq, start, end,
	  } = seqPart;

	  bulkOp.insert({
	    header,
	    seq,
	    start,
	    end,
	    genomeId,
	    isPublic,
	    permission,
	  });
	  return bulkOp.execute();
	}
}

/**
 * [description]
 * @param  {String} options.fileName      [description]
 * @param  {String} options.referenceName [description]
 * @return {Promise}                       [description]
 */
const fastaFileToMongoDb = ({ fileName, genomeName, permission = 'admin' }) => new Promise((resolve, reject) => {
  if (!fs.existsSync(fileName)) {
    reject(new Meteor.Error(`${fileName} is not an existing file`));
  }

  const genomeId = genomeCollection.insert({
    name: genomeName,
    permission,
    description: 'description',
    organism: 'organism',
    isPublic: false,
  });

  const lineReader = readline.createInterface({
    input: fs.createReadStream(fileName, 'utf8'),
  });

  const lineProcessor = new LineProcessor({ genomeId, permission });
  lineReader.on('line', (line) => {
    try {
      lineProcessor.process(line);
    } catch (error) {
      reject(error);
    }
  });
  lineReader.on('close', () => {
    try {
      const result = lineProcessor.finalize();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
});

const parameterSchema = new SimpleSchema({
  fileName: { type: String },
  genomeName: { type: String },
});

const addGenome = new ValidatedMethod({
  name: 'addGenome',
  validate: parameterSchema.validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ fileName, genomeName }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'curator')) {
      throw new Meteor.Error('not-authorized');
    }

    const existingGenome = genomeCollection.findOne({ name: genomeName });
    if (existingGenome) {
      throw new Meteor.Error(`Existing genome: ${genomeName}`);
    }

    logger.log(`Adding ${fileName} as genome: ${genomeName}`);

    return fastaFileToMongoDb({ fileName, genomeName })
      .catch((error) => {
        logger.warn(error);
        throw new Meteor.Error(error);
      });
  },
});

export default addGenome;

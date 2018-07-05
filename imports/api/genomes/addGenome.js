import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import SimpleSchema from 'simpl-schema';
import fs from 'fs';
import readline from 'readline';
import Fiber from 'fibers';
import Future from 'fibers/future';

import { genomeCollection, genomeSequenceCollection } from '/imports/api/genomes/genomeCollection.js';

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
	constructor({ seq = '', header = '', start = 0, end = 0 }){
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
	constructor({ genomeId, permissions = ['admin'] }){
		this.seqPart = new SeqPart({});
		this.bulkOp = genomeSequenceCollection.rawCollection().initializeUnorderedBulkOp();
		this.genomeId = genomeId;
		this.permissions = permissions;
	}

	/**
	 * Process a fasta formatted line
	 * @param  {String} line [description]
	 * @return {None}
	 */
	process = line => {
		if (line[0] === '>'){
			// process header line
			if (this.seqPart.header.length && this.seqPart.seq.length){
				this.seqPart.end += this.seqPart.seq.length;
				this.bulkOp.insert({
					header: this.seqPart.header,
					seq: this.seqPart.seq,
					start: this.seqPart.start,
					end: this.seqPart.end,
					genomeId: this.genomeId,
					permissions: this.permissions
				})
			}
			const header = line.substring(1).split(' ')[0];
			this.seqPart = new SeqPart({ header });
		} else {
			// process sequence line
			this.seqPart.seq += line.trim();
			if (this.seqPart.seq.length > CHUNK_SIZE){
				this.seqPart.end += CHUNK_SIZE;
				this.bulkOp.insert({
					header: this.seqPart.header,
					seq: this.seqPart.seq.substring(0, CHUNK_SIZE),
					start: this.seqPart.start,
					end: this.seqPart.end,
					genomeId: this.genomeId,
					permissions: this.permissions
				})
				this.seqPart.seq = this.seqPart.seq.substring(CHUNK_SIZE);
				this.seqPart.start += CHUNK_SIZE;
			}
		}
	}
	/**
	 * Adds the remaining sequence as a bulk insertion job and executes the bulk operation
	 * @return {[type]} [description]
	 */
	finalize = () => {
		this.seqPart.end += this.seqPart.seq.length;
		this.bulkOp.insert({
			header: this.seqPart.header,
			seq: this.seqPart.seq,
			start: this.seqPart.start,
			end: this.seqPart.end,
			genomeId: this.genomeId,
			permissions: this.permissions
		})
		return this.bulkOp.execute();
	}
}

/**
 * [description]
 * @param  {String} options.fileName      [description]
 * @param  {String} options.referenceName [description]
 * @return {Promise}                       [description]
 */
const fastaFileToMongoDb = ({ fileName, genomeName }) => {
	return new Promise((resolve, reject) => {
		const permissions = ['admin'];

		const genomeId = genomeCollection.insert({
			name: genomeName,
			permissions: permissions,
			description: 'description',
			organism: 'organism',
			public: false
		})

		const lineReader = readline.createInterface({
			input: fs.createReadStream(fileName, 'utf8')
		})
	
		const lineProcessor = new LineProcessor({ genomeId, resolve, reject });
		lineReader.on('line', line => {
			try {
				lineProcessor.process(line)
			} catch (error) {
				reject(error)
			}
		});
		lineReader.on('close', () => {
			try {
				const result = lineProcessor.finalize();
				resolve(result);
			} catch (error) {
				reject(error)
			}
		});
	})
}

const parameterSchema = new SimpleSchema({
	fileName: { type: String },
	genomeName: { type: String }
})

export const addGenome = new ValidatedMethod({
	name: 'addGenome',
	validate: parameterSchema.validator(),
	applyOptions: {
		noRetry: true
	},
	run({ fileName, genomeName }) {
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId, 'curator')){
			throw new Meteor.Error('not-authorized');
		}

		const existingGenome = genomeCollection.findOne({ name: genomeName });
		if (existingGenome){
			throw new Meteor.Error(`Existing genome: ${genomeName}`)
		}

		console.log(`Adding ${fileName} as genome: ${genomeName}`)

		return fastaFileToMongoDb({ fileName, genomeName })
			.catch(error => {
				console.log(error);
				throw new Meteor.Error(error);
			})
	}
})
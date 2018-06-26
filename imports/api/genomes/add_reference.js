import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import SimpleSchema from 'simpl-schema';
import fs from 'fs';
import readline from 'readline';
import Fiber from 'fibers';
import Future from 'fibers/future';

import { ReferenceInfo, References } from '/imports/api/genomes/reference_collection.js';

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
	constructor({ referenceId, permissions = ['admin'] }){
		this.seqPart = new SeqPart({});
		this.bulkOp = References.rawCollection().initializeUnorderedBulkOp();
		this.referenceId = referenceId;
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
					referenceId: this.referenceId,
					permissions: this.permissions
				})
			}
			const header = line.substring(1).split()[0];
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
					referenceId: this.referenceId,
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
			referenceId: this.referenceId,
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
const fastaFileToMongoDb = ({ fileName, referenceName }) => {
	return new Promise((resolve, reject) => {
		const permissions = ['admin'];

		const referenceId = ReferenceInfo.insert({
			name: referenceName,
			permissions: permissions,
			description: 'description',
			organism: 'organism'
		})

		const lineReader = readline.createInterface({
			input: fs.createReadStream(fileName, 'utf8')
		})
	
		const lineProcessor = new LineProcessor({ referenceId, resolve, reject });
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
	referenceName: { type: String }
})

export const addReference = new ValidatedMethod({
	name: 'addReference',
	validate: parameterSchema.validator(),
	applyOptions: {
		noRetry: true
	},
	run({ fileName, referenceName }) {
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId, 'curator')){
			throw new Meteor.Error('not-authorized');
		}

		const existingReference = ReferenceInfo.findOne({ name: referenceName });
		if (existingReference){
			throw new Meteor.Error(`Existing reference: ${referenceName}`)
		}

		return fastaFileToMongoDb({ fileName, referenceName })
			.catch(error => {
				console.log(error);
				throw new Meteor.Error(error);
			})
	}
})
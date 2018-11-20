import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import assert from 'assert';
import Papa from 'papaparse';
import fs from 'fs';
import { findIndex, isEqual, isEmpty, mapValues, 
	partition, omit } from 'lodash';

import { Genes, GeneSchema, SubfeatureSchema, 
	VALID_SUBFEATURE_TYPES, VALID_INTERVAL_TYPES } from '/imports/api/genes/gene_collection.js';
import { orthogroupCollection } from '/imports/api/genes/orthogroup_collection.js';
import { genomeSequenceCollection, genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';
import logger from '/imports/api/util/logger.js';
import { scanGeneAttributes } from '/imports/api/genes/scanGeneAttributes.js';
import { parseAttributeString } from '/imports/api/util/util.js';


/**
 * Interval Class containing a single genomic interval. Every line in a gff3 file is an interval
 * @type {Interval}
 */
const Interval = class Interval {
	constructor({ gffFields, genomeId, deriveIdFromParent = true }){//, genomeSequences }){ //, trackId
		const [ seqid, source, type, start, end,
			_score, strand, phase, attributeString ] = gffFields;
		const score = String(_score);
		const attributes = parseAttributeString(attributeString);

		if (!attributes.hasOwnProperty('ID')){
			logger.warn(`The following line does not have the gff3 ID attribute:`);
			logger.warn(`${gffFields.join('\t')}`);
			if (deriveIdFromParent) {
				const derivedId = `${attributes.Parent}_${type}_${start}_${end}`;
				logger.warn(`Assigning ID based on Parent attribute ${derivedId}`);
				attributes.ID = [derivedId];
			}
			
		}

		this.ID = attributes.ID[0];
		delete attributes.ID;

		if (typeof attributes.Parent === 'undefined'){
			//top level feature
			Object.assign(this, {
				seqid, source, strand, genomeId
			})
		} else {
			//sub feature
			this.phase = phase;
			this.parents = attributes.Parent;
			delete attributes.Parent;
		}

		Object.assign(this, {
			type, start, end, score, attributes
		})


	}
}

/**
 * Genemodel Class containing all intervals for a single gene.
 * @type {GeneModel}
 */
const GeneModel = class GeneModel {
	constructor(_intervals){
		//filter valid interval types and set parent and children values
		const intervals = _intervals.filter(({ type }) => {
			const isValid = VALID_INTERVAL_TYPES.indexOf(type) >= 0;
			if (!isValid){
				logger.warn(`intervals of type ${type} are not supported, skipping.`)
			}
			return isValid
		})
		intervals.forEach(interval => {
			if (interval.type === 'transcript'){
				interval.type = 'mRNA';
			};
			if (interval.hasOwnProperty('parents')) {
				interval.parents.forEach(parentId => {
					const parentIndex = intervals.map(interval => interval.ID).indexOf(parentId);
					const parent = intervals[parentIndex] || {};
					if (!parent.hasOwnProperty('children')){
						parent.children = []
					}
					parent.children.push(interval.ID)
				})
			}
		})

		//pull out gene interval
		//https://lodash.com/docs/4.17.10#partition
		const [genes, subfeatures] = partition(intervals, interval => typeof interval.parents === 'undefined');
		const gene = genes[0]
		Object.assign(this, gene);

		//set subfeatures
		this.subfeatures = subfeatures;
	}

	fetchGenomeSequence = () => {
		let shiftCoordinates = 10e99;
		const genomicRegion = genomeSequenceCollection.find({
			genomeId: this.genomeId,
			header: this.seqid,
			start: { $lte: this.end },
			end: { $gte: this.start }
		}).fetch().sort((a,b) => {
			return a.start - b.start
		}).map(seqPart => {
			shiftCoordinates = Math.min(shiftCoordinates, seqPart.start);
			return seqPart.seq
		}).join('');
		if (genomicRegion.length > 0){
			this.seq = genomicRegion.slice(this.start - shiftCoordinates - 1,
				this.end - shiftCoordinates);
			this.subfeatures.forEach(subfeature => {
				subfeature.seq = genomicRegion.slice(subfeature.start - shiftCoordinates - 1,
					subfeature.end - shiftCoordinates)
			});
		} else {
			logger.warn(`Could not find sequence for gene ${this.ID} with seqid ${this.seqid}.`+
			 ` Make sure the sequence IDs between the genome fasta and annotation gff3 are the same.`)
		}
		return this
	}

	validate = () => {
		const validationContext = GeneSchema.newContext();
		validationContext.validate(this.dataFields);
		return validationContext
	}

	saveToDb = bulkOp => {
		if (this.type === 'gene'){
			this.fetchGenomeSequence();
			const validation = this.validate();
			if (validation.isValid()) {
				bulkOp.insert(this.dataFields);
			} else {
				validation.validationErrors().forEach(err => {
					logger.warn(`gene ${this.ID}, field ${err.name} is ${err.type}, got '${err.value}'`)
				})
			}
		} else {
			logger.warn(`Not saving top-level feature`)
		}
	}

	get dataFields() {
		return omit(this, ['fetchGenomeSequence', 'validate','saveToDb','dataFields'])
	}
}

/**
 * [description]
 * @param  {String} options.fileName           [description]
 * @param  {String} options.genomeeId        [description]
 * @param  {Object} options.genomeeSequences [description]
 * @param  {String} options.trackId            [description]
 * @return {Promise}                            [description]
 */
const gffFileToMongoDb = ({ fileName, genomeId, strict }) => {
	return new Promise((resolve, reject) => {
		const fileHandle = fs.readFileSync(fileName, { encoding: 'binary' });
		let intervals = [];
		let geneCount = 0;
		let lineNumber = 0;

		logger.log('Initializing bulk operation');
		let bulkOp = Genes.rawCollection().initializeUnorderedBulkOp();

		logger.log(`Start reading ${fileName}`)
		Papa.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			fastMode: true,
			error(error,file) {
				reject(error)
			},
			step(line, parser){
				lineNumber += 1;
				try {
					const { data } = line;
					const [ gffFields ] = data;

					assert(gffFields.length === 9, 
						`${gffFields} is not a correct gff line with 9 fields`);
					let interval = new Interval({ gffFields, genomeId })

					if (typeof interval.parents === 'undefined'){
						if (!isEmpty(intervals)){
							const gene = new GeneModel(intervals);
							gene.saveToDb(bulkOp);
							geneCount += 1;
						}
						intervals = [];
					}
					
					intervals.push(interval)

				} catch (error) {
					reject(error)
				}
			},
			complete(results,file) {
				try {
					if ( !isEmpty(intervals) ) {
						logger.log('constructing final gene model')
						const gene = new GeneModel(intervals);
						gene.saveToDb(bulkOp);
						geneCount += 1;
					}

					if (bulkOp.s.currentBatch && 
							bulkOp.s.currentBatch.operations.length) {
						logger.log('Executing bulk operation');
						const result = bulkOp.execute();
						
						genomeCollection.update({
							_id: genomeId
						},{
							$set: {
								annotationTrack : {
									name: fileName.split('/').pop()
								}
							}
						})

						logger.log(`Finished inserting ${geneCount} genes`)
						
						resolve(result)
					} else {
						logger.warn('Empty bulk operation')
						throw new Meteor.Error('Empty bulk operation')
					} 
				} catch (error) {
					reject(error)
				}
			}
		})
	})
}

export const addAnnotationTrack = new ValidatedMethod({
	name: 'addAnnotationTrack',
	validate: new SimpleSchema({
		fileName: { type: String },
		genomeName: { type: String }
	}).validator(),
	applyOptions: {
		noRetry: true
	},
	run({ fileName, genomeName, strict = true }){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId, 'admin')){
			throw new Meteor.Error('not-authorized');
		}

		logger.log(`Adding annotation file "${fileName}" to genome "${genomeName}"`)

		const existingGenome = genomeCollection.findOne({ name: genomeName })
		if (!existingGenome){
			throw new Meteor.Error(`Invalid genome name: ${genomeName}`)
		}

		if (typeof existingGenome.annotationTrack !== 'undefined'){
			throw new Meteor.Error(`Genome ${genomeName} already has an annotation track`);
		}

		const genomeId = existingGenome._id;

		return gffFileToMongoDb({ fileName, genomeId, strict })
			.catch(error => {
				logger.warn(error);
				throw new Meteor.Error(error);
			})
	}
})


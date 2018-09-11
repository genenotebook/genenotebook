import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import assert from 'assert';
import Papa from 'papaparse';
import fs from 'fs';
import { findIndex, isEqual, isEmpty, mapValues, 
	partition, omit } from 'lodash';
import querystring from 'querystring';

import { Genes, GeneSchema, SubfeatureSchema, 
	VALID_SUBFEATURE_TYPES, VALID_INTERVAL_TYPES } from '/imports/api/genes/gene_collection.js';
import { orthogroupCollection } from '/imports/api/genes/orthogroup_collection.js';
import { genomeSequenceCollection, genomeCollection } from '/imports/api/genomes/genomeCollection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

import { scanGeneAttributes } from '/imports/api/genes/scanGeneAttributes.js';
import { formatAttributes } from '/imports/api/util/util.js';

/**
 * Override the default querystring unescape function to be able to parse commas correctly in gff attributes
 * @param  {String}
 * @return {String}
 */
querystring.unescape = uri => uri;

/**
 * Interval Class containing a single genomic interval. Every line in a gff3 file is an interval
 * @type {Interval}
 */
const Interval = class Interval {
	constructor({ gffFields, genomeId }){//, genomeSequences }){ //, trackId
		const [ seqid, source, type, start, end,
			_score, strand, phase, attributeString ] = gffFields;
		const score = String(_score);
		const attributes = formatAttributes(attributeString);
		Object.assign(this, {
			type, start, end, score, attributes
		})

		this.ID = this.attributes.ID[0];
		delete this.attributes.ID;

		if (typeof this.attributes.Parent === 'undefined'){
			//top level feature
			Object.assign(this, {
				seqid, source, strand, genomeId
			})
		} else {
			//sub feature
			this.phase = phase;
			this.parents = this.attributes.Parent;
			delete this.attributes.Parent;
		}

	}
}

/**
 * Genemodel Class containing all intervals for a single gene.
 * @type {GeneModel}
 */
const GeneModel = class GeneModel {
	constructor(intervals){
		//set parent and children values
		
		intervals.forEach(interval => {
			if (interval.hasOwnProperty('parents')) {
				interval.parents.forEach(parentId => {
					const parentIndex = intervals.map(interval => interval.ID).indexOf(parentId);
					const parent = intervals[parentIndex];
					if (!parent.hasOwnProperty('children')){
						parent.children = []
					}
					parent.children.push(interval.ID)
				})
			}
		})

		//pull out gene interval
		//https://lodash.com/docs/4.17.10#partition
		const [genes, subfeatures] = partition(intervals, interval => typeof interval.parents === 'undefined');//interval.type === 'gene');
		assert(genes.length === 1, `Can not make a gene model of ${genes.length} lines with type gene`);
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
		this.seq = genomicRegion.slice(this.start - shiftCoordinates - 1,
			this.end - shiftCoordinates);
		this.subfeatures.forEach(subfeature => {
			subfeature.seq = genomicRegion.slice(subfeature.start - shiftCoordinates - 1,
				subfeature.end - shiftCoordinates)
		});
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
					console.warn(`## WARNING: ${this.ID} ${err.name} ${err.value} ${err.type}`)
				})
			}
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
//const gffFileToMongoDb = ({ fileName, genomeId, genomeSequences }) => {
const gffFileToMongoDb = ({ fileName, genomeId, strict }) => {
	return new Promise((resolve, reject) => {
		const fileHandle = fs.readFileSync(fileName, { encoding: 'binary' });
		let intervals = [];
		let geneCount = 0;
		let lineNumber = 0;

		console.log('Initializing bulk operation');
		let bulkOp = Genes.rawCollection().initializeUnorderedBulkOp();

		console.log(`Start reading ${fileName}`)
		Papa.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			fastMode: true,
			error(error,file) {
				console.log(error)
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
						console.log('constructing final gene')
						const gene = new GeneModel(intervals);
						gene.saveToDb(bulkOp);
						/*
						if (gene.type === 'gene'){
							gene.fetchGenomeSequence();
							const validation = gene.validate(GeneSchema);
							if (validation.isValid()){

							} else {
								validation.validationErrors().forEach(err => {
									console.warn(`## WARNING: ${gene.ID} ${err.name} ${err.value} ${err.type}`)
								})
							}
							/*if (!validation.isValid()) {
								reject(validation.validationErrors())
							}
							bulkOp.insert(gene.dataFields);
							geneCount += 1;
						}*/
					}

					console.log('Executing bulk operation')
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
					console.log(`Finished inserting ${geneCount} genes`)
					resolve(result)
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

		console.log(`Adding annotation file "${fileName}" to genome "${genomeName}"`)

		const existingGenome = genomeCollection.findOne({ name: genomeName })
		if (!existingGenome){
			throw new Meteor.Error(`Invalid genome name: ${genomeName}`)
		}

		if (typeof existingGenome.annotationTrack !== 'undefined'){
			throw new Meteor.Error(`Genome ${genomeName} already has an annotation track`);
		}

		const genomeId = existingGenome._id;

		return gffFileToMongoDb({ fileName, genomeId, strict }).catch(error => {
			console.log(error);
			throw new Meteor.Error(error);
		}).catch(error => {
			console.log(error);
			throw new Meteor.Error(error);
		})
	}
})


import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import assert from 'assert';
import Papa from 'papaparse';
import fs from 'fs';
import { findIndex, isEqual, isEmpty, mapValues, partition } from 'lodash';
import querystring from 'querystring';

import { Genes, GeneSchema, SubfeatureSchema } from '/imports/api/genes/gene_collection.js';
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
	constructor({ gffLine, genomeId , genomeSequences }){ //, trackId
		assert.equal(gffLine.length, 9)
		const [ seqid, source, type, start, end,
			_score, strand, phase, _attributes ] = gffLine
		const score = String(_score);
		const attributes = formatAttributes(_attributes);
		Object.assign(this, {
			type, start, end, score, attributes
		})

		this.ID = this.attributes.ID[0];
		delete this.attributes.ID;

		if (typeof this.attributes.Parent !== 'undefined'){
			this.parents = this.attributes.Parent;
			delete this.attributes.Parent;
		}

		try {
			this.seq = genomeSequences[seqid].slice(start - 1, end)
		} catch (error) {
			console.log(seqid)
			throw new Meteor.Error(`${seqid} is not a valid sequenceId for genome ${genomeId}`)
		}


		if (this.type === 'gene'){
			Object.assign(this, {
				seqid, source, strand, genomeId//, trackId
			})

			GeneSchema.validate(this)
		} else {
			this.phase = phase
			SubfeatureSchema.validate(this)
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
		const [genes, subfeatures] = partition(intervals, interval => interval.type === 'gene');
		assert.equal(genes.length, 1)
		const gene = genes[0]
		Object.assign(this, gene);

		//set subfeatures
		this.subfeatures = subfeatures;

		/*
		const orthogroup = orthogroupCollection.findOne({ geneIds: gene.ID });
		if ( typeof orthogroup !== 'undefined'){
			this.orthogroupId = orthogroup.ID
		}
		*/
	}
}

/**
 * [description]
 * @param  {String} options.genomeId [description]
 * @return {Promise}                     [description]
 */
const getGenomeSequences = ({ genomeId }) => {
	return new Promise((resolve, reject) => {
		try {
			console.log(`getGenomeSequences DB query { genomeId: ${genomeId} } count ${genomeSequenceCollection.find({ genomeId }).count()}`);
			const sequenceGroups = genomeSequenceCollection.find({ genomeId })
				.fetch()
				.reduce((refs, refPart) => {
					const { header, seq, start } = refPart;
					if (!refs.hasOwnProperty(header)){
						refs[header] = [];
					}
					refs[header].push({ seq, start })
					return refs
				},{})

			const genomeSequences = mapValues(sequenceGroups, sequenceGroup => {
				return sequenceGroup.sort((a, b) => a.start - b.start)
					.map(seqPart => seqPart.seq)
					.join('')
			})
			resolve(genomeSequences)
		} catch (error) {
			reject(error)
		}
	})
}

/**
 * [description]
 * @param  {String} options.fileName           [description]
 * @param  {String} options.genomeeId        [description]
 * @param  {Object} options.genomeeSequences [description]
 * @param  {String} options.trackId            [description]
 * @return {Promise}                            [description]
 */
const gffFileToMongoDb = ({ fileName, genomeId, genomeSequences }) => {
	return new Promise((resolve, reject) => {
		const fileHandle = fs.readFileSync(fileName, { encoding: 'binary' });
		let intervals = [];//{};
		let geneCount = 0;

		console.log('Initializing bulk operation');
		const bulkOp = Genes.rawCollection().initializeUnorderedBulkOp();

		console.log(`Start reading ${fileName}`)
		Papa.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			error(error,file) {
				reject(error)
			},
			step(line){
				try {
					const { data } = line;
					const [ gffLine ] = data;
					let interval = new Interval({ gffLine, genomeId, genomeSequences })//, trackId

					if (interval.parents === undefined){
						assert.equal(interval.type, 'gene');
						if ( !isEmpty(intervals) ) {
							const gene = new GeneModel(intervals);
							GeneSchema.validate(gene);
							bulkOp.insert(gene);
							geneCount += 1;
							intervals = [];
						}
					}
					intervals.push(interval)
					//intervals[interval.ID] = interval;
				} catch (error) {
					reject(error)
				}
			},
			complete(results,file) {
				try {
					if ( !isEmpty(intervals) ) {
						console.log('constructing final gene')
						const gene = new GeneModel(intervals);
						GeneSchema.validate(gene);
						bulkOp.insert(gene);
						geneCount += 1;
						//intervals = [];//{}
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
					/*
					Tracks.update({ 
						_id: trackId 
					},{
						$set: {
							geneCount
						}
					})

					scanGeneAttributes.call({ trackId });*/
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
	run({ fileName, genomeName }){
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

		/*
		const existingTrack = Tracks.findOne({ name: trackName });
		if (existingTrack){
			throw new Meteor.Error('Track exists: ' + trackName);
		}

		
		*/
		const genomeId = existingGenome._id;

		console.log(`Gathering genome sequences for ${genomeName}`);
		return getGenomeSequences({ genomeId })
			.then(genomeSequences => {
				return gffFileToMongoDb({ fileName, genomeId, genomeSequences })//, trackId })
			})
			.catch(error => {
				console.log(error);
				throw new Meteor.Error(error);
			})
	}
})


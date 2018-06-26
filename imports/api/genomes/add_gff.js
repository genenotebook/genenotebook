import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import assert from 'assert';
import Papa from 'papaparse';
import fs from 'fs';
import { findIndex, isEqual, isEmpty, mapValues } from 'lodash';
import querystring from 'querystring';

import { Genes, GeneSchema, SubfeatureSchema } from '/imports/api/genes/gene_collection.js';
import { References, ReferenceInfo } from '/imports/api/genomes/reference_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

import { scanGeneAttributes } from '/imports/api/genes/scan_attributes.js';
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
	constructor({ gffLine, trackId, referenceId , referenceSequences }){
		assert.equal(gffLine.length, 9)
		const [ seqid, source, type, start, end,
			score, strand, phase, attributes ] = gffLine
		
		this.type = type;
		this.start = start;
		this.end = end;
		this.score = String(score);
		this.attributes = formatAttributes(attributes);

		this.ID = this.attributes.ID[0];
		delete this.attributes.ID;

		if (this.attributes.Parent !== undefined){
			this.parents = this.attributes.Parent;
			delete this.attributes.Parent;
		}

		this.seq = referenceSequences[seqid].slice(start - 1, end)
		if (this.type === 'gene'){
				this.seqid = seqid;
				this.source = source;
				this.strand = strand;
				this.reference = referenceId;
				this.trackId = trackId;
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
		Object.values(intervals).forEach( interval => {
			if (interval.parents !== undefined){
				interval.parents.forEach( parentId => {
					let parent = intervals[parentId]
					if (parent.children === undefined){
						intervals[parentId].children = []
					}
					intervals[parentId].children.push(interval.ID)
				})
			}
		})
		const genes = Object.values(intervals).filter( interval => {
			return interval.type === 'gene';
		})
		assert.equal(genes.length, 1)
		const gene = genes[0]

		Object.keys(gene).forEach(key => {
			this[key] = gene[key]
		})

		this.subfeatures = Object.values(intervals).filter( interval => {
			return interval.type !== 'gene';
		})
	}
}


export const addGff = new ValidatedMethod({
	name: 'addGff',
	validate: new SimpleSchema({
		fileName: { type: String },
		referenceName: { type: String },
		trackName: { type: String }
	}).validator(),
	applyOptions: {
		noRetry: true
	},
	run({ fileName, referenceName, trackName }){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId, 'admin')){
			throw new Meteor.Error('not-authorized');
		}

		console.log(`Adding annotation file "${fileName}" to reference "${referenceName}" as "${trackName}"`)

		const existingTrack = Tracks.find({ trackName }).fetch().length
		if (existingTrack){
			throw new Meteor.Error('Track exists: ' + trackName);
		}

		const existingReference = ReferenceInfo.findOne({ referenceName })
		if (!existingReference){
			throw new Meteor.Error('Invalid reference: ' + referenceName)
		}

		const referenceId = existingReference._id;

		const trackId = Tracks.insert({
			name: trackName,
			referenceId: referenceId,
			permissions: ['admin']
		});

		const fileHandle = fs.readFileSync(fileName, { encoding: 'binary' });

		let intervals = {};
		let geneCount = 0;

		console.log(`Gathering reference sequences for ${referenceName}`)
		const referenceSequences = getReferenceSequences(referenceId);

		console.log('Initializing bulk operation');
		const bulkOp = Genes.rawCollection().initializeUnorderedBulkOp();

		console.log('start reading')
		Papa.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			error(error,file) {
				console.log(error)
				throw new Meteor.Error(error)
			},
			step(line){
				const gffLine = line.data[0]
				let interval = new Interval({ gffLine, referenceId, trackId, referenceSequences })

				if (interval.parents === undefined){
					assert.equal(interval.type, 'gene');
					if ( !isEmpty(intervals) ) {
						const gene = new GeneModel(intervals);
						GeneSchema.validate(gene);
						Genes.insert(gene);
						geneCount += 1;
						intervals = {}
					}
				}
				intervals[interval.ID] = interval;
			},
			complete(results,file) {
				
				if ( !isEmpty(intervals) ) {
					console.log('constructing final gene')
					const gene = new GeneModel(intervals);
					GeneSchema.validate(gene);
					Genes.insert(gene);
					geneCount += 1;
					intervals = {}
				}
				
				Tracks.update({ 
					_id: trackId 
				},{
					$set: {
						geneCount
					}
				})

				scanGeneAttributes.call({ trackId });
			}
		})
		return true
	}
})

const getReferenceSequences = referenceId => {
	console.log(referenceId)
	const sequenceGroups = References.find({ referenceId })
		.fetch()
		.reduce((refs, refPart) => {
			const { header, seq, start } = refPart;
			if (!refs.hasOwnProperty(header)){
				refs[header] = [];
			}
			refs[header].push({ seq, start })
			return refs
		},{})

	const referenceSequences = mapValues(sequenceGroups, sequenceGroup => {
		return sequenceGroup.sort((a, b) => a.start - b.start)
			.map(seqPart => seqPart.seq)
			.join('')
	})
	return referenceSequences
	
}



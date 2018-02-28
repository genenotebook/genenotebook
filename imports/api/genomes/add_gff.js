import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import assert from 'assert';
import Baby from 'babyparse';
import fs from 'fs';
import findIndex from 'lodash/findIndex';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import mapValues from 'lodash/mapValues';
import querystring from 'querystring';

import { Genes, GeneSchema, SubfeatureSchema } from '/imports/api/genes/gene_collection.js';
import { References, ReferenceInfo } from '/imports/api/genomes/reference_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

import { scanGeneAttributes } from '/imports/api/genes/scan_attributes.js';

/**
 * Override the default querystring unescape function to be able to parse commas correctly in gff attributes
 * @param  {[type]}
 * @return {[type]}
 */
querystring.unescape = uri => uri;

/**
 * [Interval description]
 * @type {[type]}
 */
const Interval = class Interval{
	constructor({ line, trackName, referenceName , referenceSequences }){
		assert.equal(line.length,9)
		const [
			seqid,
			source,
			type,
			start,
			end,
			score,
			strand,
			phase,
			attributes
		] = line
		
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
				this.reference = referenceName;
				this.track = trackName;
				this.permissions= ['admin'];
			GeneSchema.validate(this)
		} else {
			this.phase = phase
			SubfeatureSchema.validate(this)
		}
	}
}

/**
 * [GeneModel description]
 * @type {[type]}
 */
const GeneModel = class GeneModel{
	constructor(intervals){
		console.log('constructing genemodel')
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

		console.log(gene.ID)

		Object.keys(gene).forEach(key => {
			this[key] = gene[key]
		})

		this.subfeatures = Object.values(intervals).filter( interval => {
			return interval.type !== 'gene';
		})
	}
}

/**
 * [ValidatedMethod description]
 * @param {[type]} options.name:     'addGff'     [description]
 * @param {[type]} options.validate: new          SimpleSchema({		fileName: {            type:              String        [description]
 * @param {[type]} referenceName:    {           type:                      String        }                 [description]
 * @param {[type]} trackName:        {           type:                      String        }	}).validator() [description]
 * @param {[type]} applyOptions:     {		noRetry: true	}                    [description]
 * @param {[type]} run({            fileName,    referenceName,             trackName     }){		if          (!            this.userId)  {			throw new Meteor.Error('not-authorized');		}		if (! Roles.userIsInRole(this.userId,'curator')){			throw new Meteor.Error('not-authorized');		}		const existingTrack [description]
 */
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
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}

		const existingTrack = Tracks.find({ trackName: trackName }).fetch().length
		if (existingTrack){
			throw new Meteor.Error('Track exists: ' + trackName);
		}

		const existingReference = References.find({ referenceName: referenceName }).fetch().length
		if (!existingReference){
			throw new Meteor.Error('Invalid reference: ' + referenceName)
		}

		const fileHandle = fs.readFileSync(fileName,{encoding:'binary'});

		let intervals = {};
		let geneCount = 0;

		console.log(`Gathering reference sequences for ${referenceName}`)
		const referenceSequences = getReferenceSequences(referenceName);

		console.log('start reading')
		Baby.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			error(error,file) {
				console.log(error)
			},
			step(line){
				let interval = new Interval({
					line: line.data[0], 
					referenceName: referenceName, 
					trackName: trackName,
					referenceSequences: referenceSequences
				})

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
				
				Tracks.insert({
					trackName: trackName,
					reference: referenceName,
					geneCount: geneCount,
					permissions: ['admin']
				});

				scanGeneAttributes.call({ trackName: trackName });
			}
		})
		return true
	}
})

/**
 * [description]
 * @param  {[type]} referenceName [description]
 * @return {[type]}               [description]
 */
const getReferenceSequences = (referenceName) => {
	const headers = References.find({
		referenceName: referenceName
	},{
		fields: {
			header: 1
		}
	}).map(reference => reference.header).reduce((headers, header) => {
		if (headers.indexOf(header) < 0){
			headers.push(header)
		}
		return headers
	},[])

	const referenceSequences = headers.reduce((sequences, header) => {
		const sequence = References.find({
			referenceName: referenceName,
			header: header
		},{
			sort: {
				start: 1
			}
		}).map( ref => ref.seq).join('')
		sequences[header] = sequence;
		return sequences
	},{})
	return referenceSequences
}

/**
 * [description]
 * @param  {[type]} attributeString [description]
 * @return {[type]}                 [description]
 */
const formatAttributes = (attributeString) => {
	return attributeString.split(';').reduce((attributes, stringPart) => {
		const [key, value] = stringPart.split('=')
		attributes[key] = value.split(',').map(decodeURIComponent)
		return attributes;
	}, {})
}

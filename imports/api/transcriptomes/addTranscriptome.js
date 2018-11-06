import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';
import assert from 'assert';
import Papa from 'papaparse';
import fs from 'fs';

import { Tracks } from '/imports/api/genomes/track_collection.js';
import { Genes } from '/imports/api/genes/gene_collection.js';
import { ExperimentInfo, Transcriptomes } from '/imports/api/transcriptomes/transcriptome_collection.js';


const getGenomeId = data => {
	const firstTranscipts = data.slice(0, 10).map(line => line.target_id);
	console.log(firstTranscipts)
	const { genomeId } = Genes.findOne({
		$or: [
			{ ID: { $in: firstTranscipts } },
			{ 'subfeatures.ID': { $in: firstTranscipts } }
		]
	})
	console.log(genomeId)
	return genomeId
}

const parseKallistoTsv = ({ fileName, sampleName, replicaGroup, 
	description, permissions = ['admin'], isPublic = false }) => {
	return new Promise((resolve, reject) => {
		const fileHandle = fs.readFileSync(fileName, { encoding: 'binary' });
		const bulkOp = Transcriptomes.rawCollection().initializeUnorderedBulkOp();
		Papa.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			header: true,
			error(error, file){
				reject(new Meteor.Error(error))
			},
			complete({ data }, file){
				let nInserted = 0;

				const genomeId = getGenomeId(data);

				if ( typeof genomeId === 'undefined'){
					reject(new Meteor.Error(`Could not find genomeId for first transcript`))
				}

				const experimentId = ExperimentInfo.insert({
					genomeId,
					sampleName,
					replicaGroup,
					description,
					permissions,
					isPublic
				});

				data.forEach(({ target_id, tpm, est_counts }) => {
					const gene = Genes.findOne({
						$or: [
							{ ID: target_id },
							{ 'subfeatures.ID': target_id }
						]
					});

					if (typeof gene === 'undefined'){
						console.warn(`## WARNING: ${target_id} not found`);
					} else {
						nInserted += 1;
						bulkOp.insert({
							geneId: gene.ID,
							tpm,
							est_counts,
							experimentId
						})
					}
				})
				const bulkOpResult = bulkOp.execute();
				resolve(bulkOpResult);
			}
		})
	})
}

export const addTranscriptome = new ValidatedMethod({
	name: 'addTranscriptome',
	validate: new SimpleSchema({
		fileName: String,
		sampleName: String,
		replicaGroup: String,
		description: String
	}).validator(),
	applyOptions: {
		noRetry: true
	},
	run({ fileName, sampleName, replicaGroup, description }){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId, 'admin')){
			throw new Meteor.Error('not-authorized');
		}
		return parseKallistoTsv({ fileName, sampleName, replicaGroup, description })
			.catch(error => {
				console.log(error)
			})
	}
})

/*
Meteor.methods({
	addTranscriptome(config){
		console.log('trying to insert',config)	
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}

		const track = Tracks.findOne({ name: config.trackName });
		if (!track){
			throw new Meteor.Error(`Track does not exist: ${config.trackName}`);
		}

		const fileHandle = fs.readFileSync(config.fileName, { encoding: 'binary' });

		console.log(`Start reading ${config.fileName}`)

		Papa.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			header: true,
			error(error,file) {
				console.log(error)
			},
			complete(results,file) {
				const missingGenes = new Set();
				const tracks = new Set();

				console.log('Reading finished, start validating')

				results.data.forEach(result => {
					const gene = Genes.findOne({ID: result.target_id});
					if (gene === undefined){
						missingGenes.add(result.target_id)
					} else {
						tracks.add(gene.track)
					}
				})

				if (missingGenes.size > 0){
					throw new Meteor.Error(`${missingGenes.length} genes could not be found`)
				}

				if (tracks.size > 1){
					throw new Meteor.Error(`Gene IDs are linked to more than one track: ${Array.from(tracks)}`)
				}

				console.log('Validation finished, start inserting experiment info')
				const experimentId = ExperimentInfo.insert({
					trackId: track._id,
					sampleName: config.sampleName,
					experimentGroup: config.experimentGroup,
					replicaGroup: config.replicaGroup,
					description: config.description,
					permissions: ['admin'],
				})

				/*
				formattedResults = results.map(result => {
					return {
						geneId: result.target_id,
						experimentId: experimentId,
						permissions: ['admin'],
						raw_counts: result.est_counts,
						tpm: result.tpm
					}
				})
				*/
			/*
				console.log('Start inserting expression data')
				results.data.forEach( (gene) => {
					Transcriptomes.insert({
						geneId: gene.target_id,
						experimentId: experimentId,
						permissions: ['admin'],
						raw_counts: gene.est_counts,
						tpm: gene.tpm
					})
					
				})
				

			}
		})
		return `Succesfully inserted ${config.sampleName}`
	}
})
*/
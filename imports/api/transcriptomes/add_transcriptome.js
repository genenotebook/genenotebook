import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import assert from 'assert';
import Papa from 'papaparse';
import fs from 'fs';

import { Tracks } from '/imports/api/genomes/track_collection.js';
import { Genes } from '/imports/api/genes/gene_collection.js';
import { ExperimentInfo, Transcriptomes } from '/imports/api/transcriptomes/transcriptome_collection.js';

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
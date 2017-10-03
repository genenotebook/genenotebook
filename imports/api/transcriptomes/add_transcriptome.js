import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import assert from 'assert';
import Baby from 'babyparse';
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

		const existingTrack = Tracks.find({ trackName: config.trackName }).fetch().length
		if (!existingTrack){
			throw new Meteor.Error(`Track does not exist: ${config.trackName}`);
		}

		const fileHandle = fs.readFileSync(config.fileName, { encoding: 'binary' });

		Baby.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			header: true,
			error(error,file) {
				console.log(error)
			},
			complete(results,file) {
				const missingGenes = results.data.filter((result) => {
					let existingGene = Genes.find({ID: result.target_id}).fetch()
					return existingGene.length < 1
				}).map((result) => {
					return gene.target_id
				})

				if (missingGenes.length > 0){
					throw new Meteor.Error(`${missingGenes.length} genes could not be found`)
				}

				const experimentId = ExperimentInfo.insert({
					ID: config.sampleName,
					experimentGroup: config.experimentGroup,
					replicaGroup: config.replicaGroup,
					description: config.description,
					permissions: ['admin'],
				})
				
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
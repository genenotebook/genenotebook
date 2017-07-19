import assert from 'assert';
import Baby from 'babyparse';
import fs from 'fs';

Meteor.methods({
	//addExpression(fileName, trackName, experimentName){
	addExpression(config){
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

		const fileHandle = fs.readFileSync(config.fileName,{encoding:'binary'});

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
				let data = results.data.map((gene) => {
					let existingGene = Genes.find({ID: gene.target_id}).fetch()
					if (existingGene.length < 1){
						throw new Meteor.Error(`${gene.target_id} is not an existing gene ID!`)
					}
					return { 
						ID: gene.target_id,
						raw_counts: gene.est_counts,
						tpm: gene.tpm
					}
				})
				
				let experimentId = Experiments.insert({
					ID: config.sampleName,
					experimentGroup: config.experimentGroup,
					replicaGroup: config.replicaGroup,
					description: config.description,
					permissions: ['admin'],
					data: data
				})

				/*
				results.data.forEach( (gene) => {
					Genes.update({ID:gene.target_id},{
						$push: {
							expression: {
								tpm: gene.tpm,
								raw_counts: gene.est_counts,
								experimentId: experimentId
							}
						}
					})
				})
				*/

			}
		})
		return `Succesfully inserted ${config.sampleName}`
	}
})
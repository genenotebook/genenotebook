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
				let experimentId = Experiments.insert({
					ID: config.sampleName,
					group: config.group,
					description: config.description,
					permissions: ['admin']
				})

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

			}
		})
		return `Succesfully inserted ${config.sampleName}`
	}
})
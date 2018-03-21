import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
//import Future from 'fibers/future';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

/**
 * Map function for mongodb mapreduce
 */
const mapFunction = function(){
	printjson('map function');
	//Use 'var' instead of 'let'! This will be executed in mongodb, which does not know 'const/let'
	var gene = this;
	if (typeof gene.attributes !== 'undefined'){
		emit(null, { attributeKeys: Object.keys(gene.attributes) })
	}
}

/**
 * Reduce function for mongodb mapreduce
 * @param  {String} _key    [description]
 * @param  {Array	} values [description]
 * @return {Object}        [description]
 */
const reduceFunction = function(_key, values){
	printjson('reduce function')
	//Use 'var' instead of 'let'! This will be executed in mongodb, which does not know 'const/let'
	const attributeKeySet = new Set()
	values.forEach(value => {
		value.attributeKeys.forEach(attributeKey => {
			attributeKeySet.add(attributeKey)
		})
	})
	//Use 'var' instead of 'let'! This will be executed in mongodb, which does not know 'const/let'
	const attributeKeys = Array.from(attributeKeySet)
	return { attributeKeys: attributeKeys }
}

export const scanGeneAttributes = new ValidatedMethod({
	name: 'scanGeneAttributes',
	validate: new SimpleSchema({
		trackName: { type: String }
	}).validator(),
	applyOptions: {
		noRetry: true
	},
	run({ trackName }){
		console.log(`scanGeneAttributes: ${trackName}`)
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}

		const track = Tracks.findOne({trackName: trackName})

		//check if the track exists
		if (typeof track === 'undefined'){
			throw new Meteor.Error(`Unknown track: ${trackName}`)
		}

		//check that it is running on the server
		if ( !this.isSimulation ){
			this.unblock();
			const mapReduceOptions = { 
					out: { inline: 1 },
					query: { track: trackName }
				}
			//mapreduce to find all keys for all genes, this takes a while
			console.log('mapreducing')
			const attributeScan = Genes.rawCollection()
				.mapReduce(mapFunction, reduceFunction, mapReduceOptions)
				.then(results => {
					console.log('mapreduce finished')
					results.forEach( result => {
						const attributeKeys = result.value.attributeKeys;
						attributeKeys.forEach(attributeKey => {
							Attributes.update({ 
								name: attributeKey 
							},{
								$addToSet: {
									tracks: trackName,
									references: track.reference
								},
								$setOnInsert: { 
									name: attributeKey,
									query: `attributes.${attributeKey}`,
									show: true, 
									canEdit: false, 
									reserved: false 
								}
							},{
								upsert: true
							})
						})
					})
				})
				.catch(err => {
					console.log(err)
					throw new Meteor.Error(err)
				})
			return true
		}
	}
})


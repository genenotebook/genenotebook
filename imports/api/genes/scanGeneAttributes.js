import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

import { Genes } from './gene_collection.js';
import { attributeCollection } from './attributeCollection.js';

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

const findNewAttributes = ({ genomeId }) => {
	const mapReduceOptions = { 
		out: { inline: 1 },
		query: { genomeId }
	}
	//mapreduce to find all keys for all genes, this takes a while
	console.log('mapreducing')
	return Genes.rawCollection()
		.mapReduce(mapFunction, reduceFunction, mapReduceOptions)
		.then(results => {
			console.log('mapreduce finished')
			results.forEach( result => {
				const attributeKeys = result.value.attributeKeys;
				attributeKeys.forEach(attributeKey => {
					console.log(attributeKey)
					attributeCollection.update({ 
						name: attributeKey 
					},{
						$addToSet: {
							genomes: genomeId
						},
						$setOnInsert: { 
							name: attributeKey,
							query: `attributes.${attributeKey}`,
							defaultShow: false, 
							defaultSearch: false
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
}

const removeOldAttributes = ({ genomeId }) => {
	console.log('Removing old attributes');
	const oldAttributeIds = attributeCollection.find({
		$or: [
			{ allGenomes: true },
			{ genomes: genomeId }
		]
	}).fetch().filter(attribute => {
		const count =  Genes.find({
			genomeId,
			[attribute.query]: {
				$exists: true
			}
		}).count()
		console.log(`${attribute.query} ${count}`)
		return count === 0
	}).map(attribute => attribute._id)

	console.log(oldAttributeIds)

	const update = attributeCollection.remove({
		_id: { $in: oldAttributeIds }
	})
	console.log(update)
	return update
}

export const scanGeneAttributes = new ValidatedMethod({
	name: 'scanGeneAttributes',
	validate: new SimpleSchema({
		genomeId: { type: String }
	}).validator(),
	applyOptions: {
		noRetry: true
	},
	run({ genomeId }){
		console.log(`scanGeneAttributes for genome: ${genomeId}`)
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}

		const genome = genomeCollection.findOne({ _id: genomeId });
		if (!genome) {
			throw new Meteor.Error(`Unknown genomeId: ${genomeId}`)
		}

		if (typeof genome.annotationTrack === 'undefined') {
			throw new Meteor.Error(`Genome ${genomeId} has no annotations to scan`)
		}
	
		//check that it is running on the server
		if ( !this.isSimulation ){
			//this.unblock();
			removeOldAttributes({ genomeId });
			findNewAttributes({ genomeId });
			return true
		}
	}
})


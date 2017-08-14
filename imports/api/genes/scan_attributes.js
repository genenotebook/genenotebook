import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
//import Future from 'fibers/future';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';


export const scanGeneAttributes = new ValidatedMethod({
	name: 'scanAttributes',
	validate: new SimpleSchema({
		trackName: { type: String }
	}).validator(),
	applyOptions: {
		noRetry: true
	},
	async run({ trackName }){
		console.log(trackName)
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}

		//check that it is running on the server
		if ( !this.isSimulation ){
			this.unblock();

			//mapreduce to find all keys for all genes, this takes a while
			const attributeScan = Genes.rawCollection().mapReduce(
				function(){
					//map function
					let gene = this;
					Object.keys(gene.attributes).forEach( (key) => {
						emit(key,{ references: [ gene.reference ] })
					})
				},
				function(key,values){
					//reduce function
					let referenceSet = new Set()
					values.forEach( (value) => {
						value.references.forEach( (ref) => {
							referenceSet.add(ref)
						})
					})
					
					let references = Array.from(referenceSet)
					return { references: references }
				},
				{ 
					out: { 
						inline: 1 
					},
					query: {
						track: trackName
					}
				}
			).then(result => {
				result.forEach(feature => {
						let name = feature._id;
						let references = feature.value.references;

						Attributes.findAndModify({ 
							query: { 
								name: name 
							}, 
							update: {
								$set: {
									references: references
								},
								$addToSet: {
									tracks: trackName
								},
								$setOnInsert: { 
									name: name,
									query: `attributes.${name}`,
									show: true, 
									canEdit: false, 
									reserved: false 
								} 
							}, 
							new: true, 
							upsert: true 
						}) 
					})
			}).catch(err => {
				console.log(err)
				throw new Meteor.Error(err)
			})

			return true
		}
	}
})


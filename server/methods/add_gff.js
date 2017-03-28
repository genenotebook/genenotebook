//const assert = require('assert');
//const Baby = require('babyparse');
//const fs = require('fs');
//const lodash = require('lodash');
//_ = lodash;
import assert from 'assert';
import Baby from 'babyparse';
import fs from 'fs';
import findIndex from 'lodash/findIndex';
import isEqual from 'lodash/isEqual';
import mapValues from 'lodash/mapValues';


Meteor.methods({
	addGff(fileName, referenceName, trackName){
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

		console.log('start reading')
		Baby.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			error(error,file) {
				console.log(error)
			},
			complete(results,file) {
				console.log('reading done')
				console.log('start formatting')
				genes = formatGff(results.data, referenceName, trackName)
				console.log('formatting done')
				console.log('start validating')
				let geneCount = 0
				genes.forEach( (gene) => {
					GeneSchema.validate(gene)
					let existingGene = Genes.find({ID:gene.ID}).fetch().length
					if (existingGene){
						throw new Meteor.Error('Duplicate gene ID: ' + gene.ID)
					}
					geneCount += 1
				})
				console.log('validating done')
				
				Tracks.insert({
					trackName: trackName,
					reference: referenceName,
					geneCount: geneCount
				})

				genes.forEach( (gene) => {
					Genes.insert(gene)
					console.log('inserted',gene.ID)
				})
				
				Meteor.call('scan.features')
			}
		})
		return true
	}
})

const formatGff = (parsedResults, referenceName, trackName) => {
	const temp = {}
	parsedResults.forEach( (line) => {
		assert.equal(line.length,9)

		let sub = {
			type: line[2],
			start: line[3],
			end: line[4],
			score: line[5],
			attributes: formatAttributes(line[8])
		}

		sub.ID = sub.attributes.ID[0];
		delete sub.attributes.ID;

		if (sub.attributes.Parent !== undefined){
			sub.parents = sub.attributes.Parent;
			delete sub.attributes.Parent;
		}

		if (sub.type === 'gene'){
			sub.seqid = line[0]
			sub.source = line[1]
			sub.strand = line[6]
			sub.reference = referenceName
			sub.track = trackName
			GeneSchema.validate(sub)
		} else {
			sub.phase = line[7]
			SubfeatureSchema.validate(sub)
		}
		temp[sub.ID] = sub
	})

	Object.keys(temp).forEach( (subId) => {
		let sub = temp[subId]
		if (sub.parents !== undefined){
			for (parentId of sub.parents){
				let parent = temp[parentId]
				if (parent.children === undefined){
					temp[parentId].children = []
				}
				temp[parentId].children.push(sub.ID)
			}
		}
	})

	const gff = []
	Object.keys(temp).forEach( (subId) => {
		let sub = temp[subId];
		if (sub.type === 'gene'){
			sub.subfeatures = []
			let children = getChildren(subId,temp);
			let child = children.next()
			while (!child.done){
				let notSelf = child.value !== sub;

				let notPresent = findIndex(sub.subfeatures, (existingSub) => { 
						return isEqual(sub,existingSub) 
					}) < 0;

				if (notSelf && notPresent){
					sub.subfeatures.push(child.value)
				}
				child = children.next()
			}
			gff.push(sub)
		}
	})

	return gff
}

function *getChildren(Id,Gff){
	let sub = Gff[Id];
	yield sub;
	if (sub.children !== undefined){
		for (childId of sub.children){
			yield *getChildren(childId,Gff)
		}
	}
}

const formatAttributes = (attributeString) => {
	const rawAttributes = querystring.parse(attributeString,';','=')
	const attributes = mapValues(rawAttributes, (attribute) => {
		let attributesArray = attribute.split(',');
		switch(attributesArray.length){
			case 0:
				throw new Meteor.Error('Incorrect attribute field');
				break;
			case 1:
				return attributesArray[0];
			default:
				return attributesArray;
		}
	})
	return attributes
}
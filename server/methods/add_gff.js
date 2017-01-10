const assert = require('assert');
const Baby = require('babyparse');
const fs = require('fs');

Meteor.methods({
	addGff: function(fileName, reference, trackName){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}

		const existingTrack = Tracks.find({ track: trackName }).fetch().length
		if (existingTrack){
			throw new Meteor.Error('Track exists: ' + trackName);
		}

		const existingReference = References.find({ reference: reference }).fetch().length
		if (!existingReference){
			throw new Meteor.Error('Invalid reference: ' + reference)
		}

		const fileHandle = fs.readFileSync(fileName,{encoding:'binary'});

		console.log('start parsing')
		Baby.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			error: function(error,file){
				console.log(error)
			},
			complete: function(results,file){
				console.log('parsing done')
				genes = formatGff(results.data, reference, trackName)
				console.log('gene documents created')
				let geneCount = 0
				genes.forEach(function(gene) {
					GeneSchema.validate(gene)
					let existingGene = Genes.find({ID:gene.ID}).fetch().length
					if (existingGene){
						throw new Meteor.Error('Duplicate gene ID: ' + gene.ID)
					}
					geneCount += 1
				})
				console.log('gene documents validated')
				genes.forEach(function(gene){
					Genes.insert(gene)
					console.log('inserted',gene.ID)
				})
				Tracks.insert({
					track: trackName,
					reference: reference,
					geneCount: geneCount
				})
				Meteor.call('scan.features')
			}
		})
		return true
	}
})

function formatGff(parsedResults, reference, trackName){
	const temp = {}
	parsedResults.forEach(function(line){
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
			sub.reference = reference
			sub.track = trackName
			GeneSchema.validate(sub)
		} else {
			sub.phase = line[7]
			SubfeatureSchema.validate(sub)
		}
		temp[sub.ID] = sub
	})

	Object.keys(temp).forEach(function(subId){
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
	Object.keys(temp).forEach(function(subId){
		let sub = temp[subId];
		if (sub.type === 'gene'){
			sub.subfeatures = []
			let children = getChildren(subId,temp);
			let child = children.next()
			while (!child.done){
				if (child.value !== sub){
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

function formatAttributes(attributeString){
	const attributes = {}
	for (attribute of attributeString.split(';')){
		splitAttribute = attribute.split('=');
		assert.equal(splitAttribute.length,2);
		attributes[splitAttribute[0]] = splitAttribute[1].split(',');
	}
	return attributes
}
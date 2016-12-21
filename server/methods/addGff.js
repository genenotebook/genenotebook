const assert = require('assert');
const Baby = require('babyparse');
const fs = require('fs');

Meteor.methods({
	addGff: function(fileName){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		const fileHandle = fs.readFileSync(fileName,{encoding:'binary'});

		Baby.parse(fileHandle, {
			delimiter: '\t',
			dynamicTyping: true,
			skipEmptyLines: true,
			comments: '#',
			error: function(error,file){
				console.log(error)
			},
			complete: function(results,file){
				genes = formatGff(results.data)
				console.log(genes)
				return 'succes'
				/*
				request.post({
					url: 'http://localhost:3000/api/login',
					form: {
						username: commander.username,
						password: commander.password
					}
				}, function(error,response,body){
					console.log('autheticated')
					let data = JSON.parse(body)
					if ( data.status === 'success'){
						let userId = data.data.userId;
						let authToken = data.data.authToken;
						console.log(userId,authToken)
						uploadGenes(genes,userId,authToken);
					}
				})
				*/
			}
		})
	}
})

function parseGff(fileName){
	const fileHandle = fs.readFileSync(fileName,{encoding:'binary'});

	Baby.parse(fileHandle, {
		delimiter: '\t',
		dynamicTyping: true,
		skipEmptyLines: true,
		comments: '#',
		error: function(error,file){
			console.log(error)
		},
		complete: function(results,file){
			genes = formatGff(results.data)
			genes.forEach(function(gene){
				
			})
			/*
			request.post({
				url: 'http://localhost:3000/api/login',
				form: {
					username: commander.username,
					password: commander.password
				}
			}, function(error,response,body){
				console.log('autheticated')
				let data = JSON.parse(body)
				if ( data.status === 'success'){
					let userId = data.data.userId;
					let authToken = data.data.authToken;
					console.log(userId,authToken)
					uploadGenes(genes,userId,authToken);
				}
			})
			*/
		}
	})
}

function formatGff(parsedResults){
	const temp = {}
	for (line of parsedResults){
		assert.equal(line.length,9)
		let sub = {
			seqid: line[0],
			source: line[1],
			type: line[2],
			start: line[3],
			end: line[4],
			score: line[5],
			strand: line[6],
			phase: line[7],
			attributes: formatAttributes(line[8])
		}
		
		assert(sub.attributes.ID);
		sub.ID = sub.attributes.ID[0];
		delete sub.attributes.ID;

		if (sub.attributes.Parent !== undefined){
			sub.parents = sub.attributes.Parent;
			delete sub.attributes.Parent;
		}

		temp[sub.ID] = sub
	}
	for (subId of Object.keys(temp)){
		let sub = temp[subId]
		if (sub.parents !== undefined){
			for (parentId of sub.parents){
				if (temp[parentId].children === undefined){
					temp[parentId].children = []
				}
				temp[parentId].children.push(sub.ID)
			}
		}
	}
	const gff = []
	for (subId of Object.keys(temp)){
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
	}
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
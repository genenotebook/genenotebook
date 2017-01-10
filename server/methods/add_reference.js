const fs = require('fs');
const readline = require('readline');
const Fiber = Npm.require('fibers');

Meteor.methods({
	addReference: function(fileName, referenceName){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}

		const existingReference = References.find({reference: referenceName}).fetch().length
		if (existingReference){
			throw new Meteor.Error('Existing reference: ' + referenceName)
		}

		const lineReader = readline.createInterface({
			input: fs.createReadStream(fileName,'utf8')
		})

		let seq = {}
		let fasta = []
		
		lineReader.on('line', function(line){
			if (line[0] === '>'){
				if (seq.header !== undefined){
					console.log(seq.header,seq.reference,seq.seq.length)
					ReferenceSchema.validate(seq)
					
					Fiber(function(){
						let existingHeader = References.find({ 
							reference: referenceName, 
							header: seq.header
						}).fetch().length

						if (existingHeader){
							throw new Meteor.Error('Duplicate header: ' + seq.header)
						}
					}).run()
					fasta.push(seq)
				}
				seq = { 
					reference: referenceName, 
					header: line.split('>')[1].split(' ')[0],
					seq: '' 
				}
			} else {
				seq.seq += line
			}
		})

		lineReader.on('close',function(){
			console.log('finished parsing')
			Fiber(function(){
				fasta.forEach(function(sequence){
					console.log('inserting',sequence.header)
					References.insert(sequence)
				})
			}).run()
		})
	}
})
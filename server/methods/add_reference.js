const fs = require('fs');
const readline = require('readline');
const Fiber = Npm.require('fibers');
const Future = Npm.require('fibers/future');

Meteor.methods({
	addReference(fileName, referenceName){
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
		
		const fut = new Future();
		console.log('start parsing')
		lineReader.on('line', (line) => {
			if (line[0] === '>'){
				if (seq.header !== undefined){
					
					new Fiber(function(){
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

		lineReader.on('close',() => {
			//add the last sequence in the file
			new Fiber(function(){
				let existingHeader = References.find({ 
					reference: referenceName, 
					header: seq.header
				}).fetch().length

				if (existingHeader){
					throw new Meteor.Error('Duplicate header: ' + seq.header)
				}
			}).run()
			fasta.push(seq)

			console.log('finished parsing')
			new Fiber(function(){
				fasta.forEach( (seq) => {
					console.log('inserting',seq.header)
					let chunksize = 10000;
					let splitSeq = seq.seq.match(new RegExp('.{1,'+ chunksize + '}','g'))

					let start = 0;
					let end = 0;

					splitSeq.forEach( (seqPart) => {
						end += seqPart.length
						References.insert({
							header: seq.header,
							seq: seqPart,
							reference: seq.reference,
							start: start,
							end: end
						})
						start += seqPart.length;
						;
					} )
				})
				fut.return(1)
			}).run()
		})
		return fut.wait()
	}
})
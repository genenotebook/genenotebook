import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
import fs from 'fs';
import readline from 'readline';
import Fiber from 'fibers';
import Future from 'fibers/future';

import { ReferenceInfo, References } from '/imports/api/genomes/reference_collection.js';

const parameterSchema = new SimpleSchema({
	fileName: { type: String },
	referenceName: { type: String }
})

export const addReference = new ValidatedMethod({
	name: 'addReference',
	validate: parameterSchema.validator(),
	applyOptions: {
		noRetry: true
	},
	run({ fileName, referenceName }) {
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}

		const existingReference = ReferenceInfo.find({referenceName: referenceName}).fetch().length
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
						}).count()

						if (existingHeader){
							throw new Meteor.Error('Duplicate header: ' + seq.header)
						}
					}).run()
					fasta.push(seq)
				}
				seq = { 
					referenceName: referenceName, 
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
					referenceName: referenceName, 
					header: seq.header
				}).count()

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
							referenceName: seq.referenceName,
							start: start,
							end: end,
							permissions: ['admin']
						})
						start += seqPart.length;
						;
					} )
				})
				ReferenceInfo.insert({
					referenceName: referenceName,
					permissions: ['admin'],
					description: 'description',
					organism: 'organism'
				})
				fut.return(1)
			}).run()
		})
		return fut.wait()
	}
})
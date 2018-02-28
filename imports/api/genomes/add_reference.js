import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

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
			input: fs.createReadStream(fileName, 'utf8')
		})

		const bulkOp = References.rawCollection().initializeUnorderedBulkOp();

		let seq = '';
		let header;
		let start = 0;
		let end = 0;
		const chunkSize = 10000;
		
		const fut = new Future();
		console.log('start parsing')
		lineReader.on('line', (line) => {
			if (line[0] === '>'){
				if (header !== undefined){
					console.log(header)
					if (seq.length > 0){
						end += seq.length;
						new Fiber(()=>{
							References.insert({
								header: header,
								seq: seq,
								start: start,
								end: end,
								referenceName: referenceName,
								permissions: ['admin']
							})
						}).run()
					}
				}
				header = line.split('>')[1].split(' ')[0];
				seq = '';
				start = 0;
				end = 0;
				
			} else {
				seq += line;
				if ( seq.length > chunkSize ){
					end += chunkSize
					new Fiber(()=>{
						References.insert({
							header: header,
							seq: seq.substring(0,chunkSize),
							start: start,
							end: end,
							referenceName: referenceName,
							permissions: ['admin']
						})
					}).run()
					seq = seq.substring(chunkSize);
					start += chunkSize;
				}
			}
		})

		lineReader.on('close', () => {
			end += seq.length;
			new Fiber(()=>{
				References.insert({
					header: header,
					seq: seq,
					start: start,
					end: end,
					referenceName: referenceName,
					permissions: ['admin']
				})
				ReferenceInfo.insert({
					referenceName: referenceName,
					permissions: ['admin'],
					description: 'description',
					organism: 'organism'
				})
				console.log('finished parsing')

				fut.return(1)
			}).run()
			

		})
		return fut.wait()
	}
})
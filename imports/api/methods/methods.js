import { spawn } from 'child_process';
import Future from 'fibers/future';

import { Genes } from '/imports/api/genes/gene_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';
import { EditHistory } from '/imports/api/genes/edithistory_collection.js';

import { reverseComplement, translate, getGeneSequences } from '/imports/api/util/util.js';

import hash from 'object-hash';



Meteor.methods({
	/**
	 * [formatFasta description]
	 * @param  {[Object]} query        [Database query to select genes]
	 * @param  {[String]} sequenceType [One of 'protein' or 'nucleotide']
	 * @return {[Array]}               [Array of fasta formatted coding sequences]
	 */
	formatFasta (query, sequenceType){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		console.log('formatFasta')
		console.log(query)

		const fasta = Genes.find(query).map( (gene, index) => {
      const transcriptFasta = getGeneSequences(gene).map(transcript => {
        const sequence = sequenceType === 'protein' ? transcript.pep : transcript.seq;
        const wrappedSequence = sequence.match(/.{1,60}/g).join('\n');
        return `>${transcript.ID}\n${wrappedSequence}\n`
      }).join('')
      return transcriptFasta
    })

		return fasta
	},
	queryCount (search,query){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		if (search) {
			query.$or = [{ 'ID': { $regex: search , $options: 'i' } },{ 'Name': { $regex: search , $options: 'i' } }];
			if (!query.hasOwnProperty('Productname')){
				query.$or.push({ 'Productname': { $regex: search , $options: 'i' } })
			}
		}
		const count = Genes.find(query).count()
		return count
	},
	removeFromViewing (geneId){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		Genes.update({ 'ID': geneId },{ $pull: { 'viewing': this.userId } }, (err,res) => {
			if (err) {
				throw new Meteor.Error('removeFromViewing server method error')
			}
			const gene = Genes.findOne({'ID': geneId})
			console.log(gene)
			//if ( viewing.length === 0 ){
				//Genes.update({ 'ID': geneId },{ $unset: { 'viewing': 1 } } )
			//} 
		})
		
	},
	/**
	 * Block a gene from being edited, this should happen when someone is editing a gene to prevent simultaneous edits
	 * @param  {[type]}
	 * @return {[type]}
	 */
	lockGene (geneId) {
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		Genes.update({ 'ID': geneId },{ $set: { editing: this.userId } }, (err,res) => {
			if (err){
				throw new Meteor.Error('Locking gene failed')
			}
			console.log(`${this.userId} is editing gene ${geneId}`)
		})
	},
	/**
	 * This unlocks a gene from being blocked during editing. 
	 * A gene should only be unlocked by the person that locked it
	 * @param  {[type]}
	 * @return {[type]}
	 */
	unlockGene (geneId) {
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		const gene = Genes.findOne({ ID: geneId })
		if (!gene){
			throw new Meteor.Error('not-authorized')
		}

		if (!gene.editing){
			throw new Meteor.Error('not-authorized')
		}

		if (!(gene.editing === this.userId)){
			throw new Meteor.Error('not-authorized')
		}

		console.log('allow unlock ===',gene.editing === this.userId)
		if (gene.editing === this.userId){
			console.log(`${this.userId} is no longer editing gene ${geneId}`)
			Genes.update({ ID: geneId}, { $set: { editing: 'Unlocking' } }, (err,res) => {
				if (err){
					throw new Meteor.Error('Unlocking failed')
				}
				Genes.update({ ID: geneId },{ $unset: { editing: 1 } })
			} )
		}
	}
})

Meteor.methods({
	updateExperiments (_id,fields){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		};
		if (! Roles.userIsInRole(this.userId,'admin')){
			throw new Meteor.Error('not-authorized');
		}
		Experiments.update({'_id':_id},{$set:fields});
	},
	 updateUsers (_id,fields){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		Meteor.users.update({'_id':_id},{$set:fields})
	},
	updateGeneInfo (ID,update,revert){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		console.log(ID,update,revert)
		
		const revertString = JSON.stringify(revert);
		const userId = this.userId;

		console.log(revertString)

		Genes.update({ID:ID},update,function(err,res){
			if (!err){
				EditHistory.insert({ ID: ID, date: new Date(), user: userId, revert: revertString})
			}
		})
	},
	updateAttributes (_id,fields){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'admin')){
			throw new Meteor.Error('not-authorized');
		}
		Attributes.update({'_id':_id},{$set:fields})
	},
	/**
	 * [formatGff3 description]
	 * @param  {[Object]} query [description]
	 * @return {[Array]}        [Array with gff3 formatted ]
	 */
	formatGff3 (query){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		
		const genes = Genes.find(query)
		const total = genes.count();
		let counter = 0;
		const gff = genes.map(function(gene){
			counter += 1;
			let subLines = gene.subfeatures.map(function(sub){
				let subFields = [
					gene.seqid,
					gene.source,
					sub.type,
					sub.start,
					sub.end,
					sub.score,
					gene.strand,
					sub.phase,
					'ID='+sub.ID+';Parents='+sub.parents.join()
				]
				return subFields.join('\t') + '\n';
			})
			let geneFields = [
				gene.seqid,
				gene.source,
				gene.type,
				gene.start,
				gene.end,
				gene.score,
				gene.strand,
				gene.phase,
				'ID='+gene.ID
			]
			let geneLine = geneFields.join('\t') + '\n';
			
			//unshift adds to the beginning of the array
			subLines.unshift(geneLine);

			return subLines.join('')
		})
		return gff
	},
	initializeDownload (query,format){
		queryHash = hash(query);
		queryString = JSON.stringify(query);
		existing = Downloads.findOne({query:queryHash,format:format})
		let downloadId;
		if (existing === undefined){
			downloadId = Downloads.insert({query:queryHash,queryString:queryString,format:format})
			//return downloadId
		} else {
			downloadId = existing._id
			//return existing._id
		}
	}
})
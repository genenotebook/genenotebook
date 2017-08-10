import hash from 'object-hash';
import { Genes } from '/imports/api/genes/gene_collection.js';

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
				return subFields.join('\t')
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
			let geneLine = geneFields.join('\t')
			
			//unshift adds to the beginning of the array
			subLines.unshift(geneLine);

			return subLines.join('\n')
		})
		return gff.join('\n')
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
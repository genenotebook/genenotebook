Meteor.methods({
	'experiments.update':function(_id,fields){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		};
		Experiments.update({'_id':_id},{$set:fields});
	},
	'users.update':function(_id,fields){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		Meteor.users.update({'_id':_id},{$set:fields})
	},
	'geneInfo.update':function(_id,fields){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		if (! Roles.userIsInRole(this.userId,'curator')){
			throw new Meteor.Error('not-authorized');
		}
		Genes.update({'_id':_id},{$set:fields});
	},
	'format.gff':function(query){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		
		const genes = Genes.find(query)
		const gff = genes.map(function(gene){
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
	}
})
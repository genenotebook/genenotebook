import hash from 'object-hash';

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
		//Genes.update({'_id':_id},{$set:fields});
	},
	'format.gff3':function(query){
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
	'format.fasta':function(query){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		
		const genes = Genes.find(query);
		const transcripts = genes.map(function(gene){
			let transcripts = gene.subfeatures.filter(function(sub){
				if (sub.type === 'mRNA'){
					return true
				}
			}).map(function(transcript){
				//name is ID plus genename if available
				let header = transcript.ID;
				if (!(gene.Name === undefined)){
					header += ' ' + gene.Name
				} 
				//regex splits sequence every 60nt, add newline in between for formatting
				let seq = transcript.seq.match(/.{1,60}/g).join('\n')
				let fasta = '>' + header + '\n' + seq + '\n'
				return fasta
			})
			return transcripts; 
		})
		const fasta = [].concat(...transcripts)
		return fasta.join('');
	},
	'initialize-download':function(query,format){
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
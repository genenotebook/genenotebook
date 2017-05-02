import hash from 'object-hash';

/**
 * Reverse complement a DNA string
 * @param  {[String]} seq [String representing DNA constisting of alphabet AaCcGgTtNn]
 * @return {[String]}     [String representing DNA constisting of alphabet AaCcGgTtNn, reverse complement of input]
 */
const revcomp = (seq) => {
	const comp = {	
		'A':'T','a':'t',
		'T':'A','t':'a',
		'C':'G','c':'g',
		'G':'C','g':'c',
		'N':'N','n':'n'
	}
	const revSeqArray = seq.split('').reverse()
	const revCompSeqArray = revSeqArray.map( (nuc) => {
		return comp[nuc]
	})
	const revCompSeq = revCompSeqArray.join('')
	return revCompSeq
}

/**
 * Convert a DNA string into a amino acid string
 * @param  {[String]} seq [String representing DNA constisting of alphabet ACGTN]
 * @return {[String]}     [String representing the amino acid complement of input string]
 */
const translate = (seq) => {
	const trans = {
		'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
		'AGG': 'R', 'AGC': 'S', 'GTA': 'V',
		'AGA': 'R', 'ACT': 'T', 'GTG': 'V',
		'AGT': 'S', 'CCA': 'P', 'CCC': 'P',
		'GGT': 'G', 'CGA': 'R', 'CGC': 'R',
		'TAT': 'Y', 'CGG': 'R', 'CCT': 'P',
		'GGG': 'G', 'GGA': 'G', 'GGC': 'G',
		'TAA': '*', 'TAC': 'Y', 'CGT': 'R',
		'TAG': '*', 'ATA': 'I', 'CTT': 'L',
		'ATG': 'M', 'CTG': 'L', 'ATT': 'I',
		'CTA': 'L', 'TTT': 'F', 'GAA': 'E',
		'TTG': 'L', 'TTA': 'L', 'TTC': 'F',
		'GTC': 'V', 'AAG': 'K', 'AAA': 'K',
		'AAC': 'N', 'ATC': 'I', 'CAT': 'H',
		'AAT': 'N', 'GTT': 'V', 'CAC': 'H',
		'CAA': 'Q', 'CAG': 'Q', 'CCG': 'P',
		'TCT': 'S', 'TGC': 'C', 'TGA': '*',
		'TGG': 'W', 'TCG': 'S', 'TCC': 'S',
		'TCA': 'S', 'GAG': 'E', 'GAC': 'D',
		'TGT': 'C', 'GCA': 'A', 'GCC': 'A',
		'GCG': 'A', 'GCT': 'A', 'CTC': 'L',
		'GAT': 'D'}
	const codonArray = seq.match(/.{1,3}/g)
	const pepArray = codonArray.map( (codon) => {
		let aminoAcid = 'X'
		if (codon.indexOf('N') < 0){
			aminoAcid = trans[codon]
		}
		return aminoAcid
	})
	const pep = pepArray.join('')
	return pep
}


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
	formatFasta (query){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		}
		
		const genes = Genes.find(query);
		const fastaNuc = [];

		genes.forEach( (gene) => {
			let transcripts = gene.subfeatures.filter( (subfeature) => { return subfeature.type === 'mRNA' })
			transcripts.forEach( (transcript) => {
				let transcriptSeq = `>${transcript.ID}\n`;
				let transcriptPep = `>${transcript.ID}\n`;
				let cdsArray = gene.subfeatures.filter( (sub) => { 
					return sub.parents.indexOf(transcript.ID) >= 0 && sub.type === 'CDS'
				}).sort( (a,b) => {
					return a.start - b.start
				})

				let refStart = 10e99;
				//let referenceSubscription = Meteor.subscribe('references',gene.seqid)
				
				//find all reference fragments overlapping the mRNA feature
				let referenceArray = References.find({ 
					header: gene.seqid, 
					$and: [ 
						{ start: {$lte: gene.end} }, 
						{ end: {$gte: gene.start} }
					] 
				}).fetch()

				if (referenceArray.length){
					let reference = referenceArray.sort( (a,b) => {
						//sort on start coordinate
						return a.start - b.start
					}).map( (ref) => {
						//find starting position of first reference fragment
						refStart = Math.min(refStart,ref.start)
						return ref.seq
					}).join('')

					seq = cdsArray.map( (cds, index) => {
						let start = cds.start - refStart - 1;
						let end = cds.end - refStart;
						return reference.slice(start,end)
					}).join('')

					let phase;
					if (this.strand === '-'){
						seq = revcomp(seq)
						phase = cdsArray[cdsArray.length -1].phase
					} else {
						phase = cdsArray[0].phase
					}
			 
					if ([1,2].indexOf(phase) >= 0){
						seq = seq.slice(phase)
					}

					//let pep = translate(seq.toUpperCase());

					transcriptSeq += seq.match(/.{1,60}/g).join('\n');
					fastaNuc.push(transcriptSeq)
					
					//transcriptPep += pep;
					//fastaPep.push(transcriptPep);
					
				}
			})
		})
		/*
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
		*/
		return fastaNuc.join('\n');
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
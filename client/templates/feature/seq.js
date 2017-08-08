Tracker.autorun(function(){
	Session.setDefault('seqType','Protein')
	Session.setDefault('selectedTranscript',0)
})

Template.seq.helpers({
	selectedTranscript() {
		const transcriptIndex = Session.get('selectedTranscript')
		const transcriptIds = this.subfeatures.filter( (sub) => {
			return sub.type === 'mRNA'
		}).map( (sub) => {
			return sub.ID
		})
		const selectedTranscript = transcriptIds[transcriptIndex]
		return selectedTranscript
	},
	transcripts() {
		const transcripts = this.subfeatures.filter(function(sub){
			return sub.type === 'mRNA'
		})
		return transcripts
	},
	seq() {
		const transcriptIndex = Session.get('selectedTranscript')
		const transcripts = this.subfeatures.filter( (sub) => {
			return sub.type === 'mRNA'
		})

		const transcript = transcripts[transcriptIndex]

		//find all CDS features and sort them on start coordinate
		const cdsArray = this.subfeatures.filter( (sub) => { 
			return sub.parents.indexOf(transcript.ID) >= 0 && sub.type === 'CDS'
		}).sort( (a,b) => {
			return a.start - b.start
		})

		let refStart = 10e99;
		
		//find all reference fragments overlapping the mRNA feature
		let reference = References.find({ 
			header: this.seqid, 
			$and: [ 
				{ start: {$lte: this.end} }, 
				{ end: {$gte: this.start} }
			] 
		}).fetch()

		let seq = '...loading...';

		if (reference.length){
			reference = reference.sort( (a,b) => {
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

			const seqType = Session.get('seqType')
			if (seqType === 'Protein'){
				seq = translate(seq.toUpperCase())
			} 
		}
		
		return seq
	}
})

Template.seq.events({
	'click .sequence-toggle button': function(event, template){
		const target = $( event.target ).closest('button')
		target.addClass('active')

		$('.sequence-toggle button').not(target).removeClass('active')
		Session.set('seqType',target.text())
	},
	'click .select-transcript-seq' : function(event, template){
		const transcripts = Template.parentData(0).subfeatures.filter( (sub) => {
			return sub.type === 'mRNA'
		}).map( (sub) => {
			return sub.ID
		})
		const selectedTranscript = event.target.text;
		const selectedTranscriptIndex = transcripts.indexOf(selectedTranscript)
		Session.set('selectedTranscript',selectedTranscriptIndex)
	}
})

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
Meteor.subscribe('tracks')

const BLASTTYPES = {'Nucleotide':{'Nucleotide':'blastn','Protein':'blastx','Translated nucleotide':'tblastx'},
					'Protein':{'Protein':'blastp','Translated nucleotide':'tblastn'}};

Tracker.autorun(function(){
	Session.setDefault('anyTrack',false)
	Session.setDefault('dbType','Protein')
})

function determineSeqType(seq){
	const dna = 'cgatCGAT'
	let fractionDna = 0
	let i = dna.length
	while (i--){
		let nuc = dna[i]
		fractionDna += (seq.split(nuc).length - 1) / seq.length
	}
	const seqType = fractionDna >= 0.9 ? 'Nucleotide' : 'Protein'
	return seqType
}

Template.blast.helpers({
	tracks: function(){
		return Tracks.find({'blastdbs':{$exists:true}})
	},
	input: function(){
		const hasInput = Session.get('blastInput') ? true : false
		return hasInput
	},
	seqtype: function(){
		const seqtype = Session.get('seqType');
		return seqtype
	},
	dbtype: function(){
		return Session.get('dbType')
	},
	dbtypes: function(){
		const seqtype = Session.get('seqType')
		const dbtypes = ['Protein','Translated nucleotide']
		if (seqtype === 'Nucleotide'){
			dbtypes.push('Nucleotide')
		}
		return dbtypes
	},
	blasttype: function(){
		const dbType = Session.get('dbType');
		const seqType = Session.get('seqType');
		const blastType = BLASTTYPES[seqType][dbType];
		return blastType.toUpperCase()
	},
	anyTrack: function(){
		return Session.get('anyTrack')
	},
	blastResult:function(){
		return Session.get('blastResult')
	},
	hits:function(){
		const blast = Session.get('blastResult')
		const iterations = blast.BlastOutput.BlastOutput_iterations
		const iteration = iterations[0].Iteration[0].Iteration_hits
		const hits = iteration[0].Hit
		return hits
	}
})

Template.blast.events({
	'input #blast_seq':function(event){
		const input = event.currentTarget.value;
		//validate input here

		//format input to only have header and sequence (or something like that)

		//determine seqtype
		const seqtype = determineSeqType(input);
		Session.set('seqType',seqtype);
		Session.set('blastInput',input);
	},
	'click .track-select':function(){
		const anyTrack = $('.track-select input[type="checkbox"]:checked').length > 0
		Session.set('anyTrack',anyTrack)
	},
	'click .db-select':function(event){
		const dbtype = event.target.id;
		Session.set('dbType',dbtype)
	},
	'click .seq-select':function(event){
		const seqType = event.target.id;
		Session.set('seqType',seqType)
	},
	'click #submit-blast':function(event){
		const query = Session.get('blastInput');
		const tracks = []
		$('.track-select input[type="checkbox"]:checked').each(function(){tracks.push(this.id)})
		console.log(tracks)
		const dbType = Session.get('dbType');
		const seqType = Session.get('seqType');
		const blastType = BLASTTYPES[seqType][dbType];
		console.log(blastType)
		Meteor.call('blast',blastType,query,tracks,function(error,result){
			if (error) {
				Bert.alert('BLAST failed!','danger','growl-top-right');
			} else {
				Session.set('blastResult',result)
				Bert.alert('BLAST finished!','success','growl-top-right');
			}
		});
	}
})

Template.blast.onCreated(function () {
	let template = this;
	template.autorun(function () {
		template.subscribe('tracks');
	})
})
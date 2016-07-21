Tracker.autorun(function(){
	Session.setDefault('seqType','Protein')
})

Template.seq.helpers({
	transcripts: function(){
		return this.subfeatures.filter(function(x){return x.type === 'mRNA'})
	},
	seq: function(transcript){
		const seqType = Session.get('seqType')
		if (seqType === 'Nucleotide'){
			return transcript.seq
		} else {
			return transcript.pep
		}
	}
})

Template.seq.events({
	'click .sequence-toggle button': function(event){
		const target = $( event.target ).closest('button')
		target.addClass('active')

		$('.sequence-toggle button').not(target).removeClass('active')
		Session.set('seqType',target.text())
	}
})
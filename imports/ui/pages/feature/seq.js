import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { References, ReferenceInfo } from '/imports/api/genomes/reference_collection.js';
import { getGeneSequences } from '/imports/api/util/util.js';

import './seq.html';

Tracker.autorun(function(){
	Session.setDefault('seqType','Nucleotide')
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
		try {
			const geneSequences = getGeneSequences(this);
			
			const transcriptIndex = Session.get('selectedTranscript');

			const transcriptSequence = geneSequences[transcriptIndex];

			const seqType = Session.get('seqType')

			if (seqType === 'Protein'){
				return transcriptSequence.pep
			} else {
				return transcriptSequence.seq
			}
		} catch(err) {
			return '...loading...'
		}
		
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

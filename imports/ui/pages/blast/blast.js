import { Template } from 'meteor/templating';

import SubmitBlast from './SubmitBlast.jsx';

import './blast.html';
import './blast.scss';

/*
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Job } from 'meteor/vsivsi:job-collection';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';

import { Tracks } from '/imports/api/genomes/track_collection.js';

import './blast.html';
import './blast.scss';

import './blasthit.js';
import './blast-result-plot.js';
*/

Template.blast.helpers({
	SubmitBlast(){
		return SubmitBlast
	}
})

/*
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
		return Tracks.find({
			'blastdbs':{ 
				$exists: true
			}
		})
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
		const dbType = Session.get('dbType');
		const seqType = Session.get('seqType');

		const options = {
			blastType: BLASTTYPES[seqType][dbType],
			input: Session.get('blastInput'),
			trackNames: $('.track-select input[type="checkbox"]:checked').map( (i, el) => el.id ).get(),
			user: Meteor.userId()
		}

		const job = new Job(jobQueue, 'blast', options)

		job.priority('normal').save( (error, result) => {
			console.log(result)
			FlowRouter.go(`/blast/${result}`)
		})

		/*
		blast.call(options, (error,result) => {
			if (error) {
				console.error(error)
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
*/
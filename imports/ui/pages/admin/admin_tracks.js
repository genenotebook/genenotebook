import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { makeBlastDb } from '/imports/api/methods/blast.js';

import './admin_tracks.html';

Template.adminTracks.helpers({
	hasDb: function(){
		const hasDb = this.blastdbs !== undefined 
		return hasDb
	}
})

Template.adminTracks.events({
	'click .makeblastdb':function(){
		const options = { 
			trackName: this.trackName 
		}
		console.log(options)
		makeBlastDb.call(options, (error, result) => {
			console.error(error)
			if (error){
				Bert.alert('makeBlastDb failed!','danger','growl-top-right');
			} else {
				Bert.alert('makeBlastDb finished','success','growl-top-right')
			}
		});
	}
})
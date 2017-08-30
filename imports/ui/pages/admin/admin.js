import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Attributes }from '/imports/api/genes/attribute_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';
import { References, ReferenceInfo } from '/imports/api/genomes/reference_collection.js';
import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';


import './admin.html';
import Admin from './admin.jsx';

import './admin_attributes.js';
import './admin_experiments.js';
import './admin_genomes.js';
import './admin_tracks.js';
import './admin_users.js';

Meteor.subscribe('userList');
Meteor.subscribe('tracks');
Meteor.subscribe('experiments');
Meteor.subscribe('attributes');

Template.admin.helpers({
	Admin(){
		return Admin;
	}
})

/*

Template.admin.onCreated(function(){
	this.currentTab = new ReactiveVar('adminUsers');
})

Template.admin.helpers({
	tab(){
		return Template.instance().currentTab.get();
	},
	tabData(){
		const tab = Template.instance().currentTab.get();
		const data = {
			'adminUsers': Meteor.users.find({}),
			'adminGenomes': References.find({}),
			'adminTracks': Tracks.find({}),
			'adminExperiments': ExperimentInfo.find({}),
			'adminAttributes': Attributes.find({})
		};
		return data[tab];
	}
})

Template.admin.events({
	'click .nav-tabs li': function(event,template){
		var currentTab = $( event.target ).closest( "li" );
		currentTab.addClass( "active" );
		$( ".nav-tabs li" ).not( currentTab ).removeClass( "active" );
		template.currentTab.set( currentTab.data( "template" ) );
	}
})

Template.admin.onCreated(function () {
	let template = this;
	template.autorun(function () {
		template.subscribe('tracks');
		template.subscribe('experimentInfo');
		template.subscribe('referenceInfo');
		template.subscribe('attributes');
	})
})
*/
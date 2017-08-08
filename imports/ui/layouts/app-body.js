import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './app-body.html';
import '../pages/main/header.js';

Template.body.events({
	'click': function(event,template){
		/*
		This function serves as a general dismissal function of any bootstrap popover in the app
		*/
		$('.popover').each(function () {
			const clickedId = $(event.target).attr('aria-describedby');
			const popoverId = this.id;
			if (clickedId === undefined || clickedId !== popoverId){
				$(this).popover('hide');
			}
		})
	}
})
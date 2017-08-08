import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
 
import './header.html';
import './header.scss';

Tracker.autorun(function(){
	const search = Session.get('search');
	if (search){
		$('input[name="search"]').val(search)
	}
})

Template.header.rendered = function() {
	var menuToggle = $('#js-mobile-menu').unbind();
	$('#js-navigation-menu').removeClass("show");

	menuToggle.on('click', function(event) {
		event.preventDefault();
		$('#js-navigation-menu').slideToggle(function(){
			if($('#js-navigation-menu').is(':hidden')) {
				$('#js-navigation-menu').removeAttr('style');
			}
		});
	});
}

Template.header.helpers({
	prefix: function(){
		return 'Parasponia '
	},
  isAdmin: function(){
    return Meteor.user()
  },
  search: function(){
  	return FlowRouter.getParam('_search')//Session.get('search')
  },
  searching: function(){
  	return FlowRouter.getParam('_search') || Session.get('searching')
  }
})

Template.header.events({
	'click a': function(event,template){
		$(".nav").find(".active").removeClass("active");
		$(event.target).parent().addClass("active");
	},
	'keyup input.search': function(){
		Session.set('searching',true)	
	},
	'submit .search': function(event) {
		event.preventDefault();
		var search = event.target.search.value;
		if (search){
			FlowRouter.redirect(`/search=${search}`)
			//Router.go('genes',{},{'query':{'search':search}})
		}
	},
	'click #clear-search': function(){
		//Session.set('search',null);
		$('input[name="search"]').val('')
		FlowRouter.redirect('/genes')
	},
	'click #signout':function(event,template){
		event.preventDefault();
		Meteor.logout();
	}
})
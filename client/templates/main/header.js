Session.setDefault('login',false)

Tracker.autorun(function(){
	const search = Session.get('search');
	if (search){
		console.log(search)
		console.log($('input[name="search"]').val())
		$('input[name="search"]').val(search)
	}
})

Template.header.rendered = function() {
	var menuToggle = $('#js-mobile-menu').unbind();
	$('#js-navigation-menu').removeClass("show");

	menuToggle.on('click', function(e) {
		e.preventDefault();
		$('#js-navigation-menu').slideToggle(function(){
			if($('#js-navigation-menu').is(':hidden')) {
				$('#js-navigation-menu').removeAttr('style');
			}
		});
	});
}

Template.header.helpers({
  isAdmin: function(){
    return Meteor.user()
  },
  search: function(){
  	return Session.get('search')
  },
  searching: function(){
  	return Session.get('search') || Session.get('searching')
  }
})

Template.header.events({
	'keyup input.search': function(){
		Session.set('searching',true)	
	},
	'submit .search': function(event) {
		event.preventDefault();
		var search = event.target.search.value;
		if (search){
			Router.go('genes',{},{'query':{'search':search}})
		}
	},
	'click #clear-search': function(){
		Session.set('search',null);
		$('input[name="search"]').val('')
		//Router.go('genes',{},{'query':{}})
	},
	'click #signin':function(event,template){
		event.preventDefault();
		Router.go('login')
		//Modal.show('loginModal');
	},
	'click #signout':function(event,template){
		event.preventDefault();
		Meteor.logout();
	}
})
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
			Router.go('genes',{},{'query':{'search':search}})
		}
	},
	'click #clear-search': function(){
		Session.set('search',null);
		$('input[name="search"]').val('')
	},
	'click #signin':function(event,template){
		event.preventDefault();
		Router.go('login')
	},
	'click #signout':function(event,template){
		event.preventDefault();
		Meteor.logout();
	}
})
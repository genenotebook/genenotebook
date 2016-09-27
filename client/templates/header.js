//Session.setDefault('hasSearch',false)
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
  }
})

Template.header.events({
	'keyup input.search': function(){
		Session.set('hasSearch',true)	
	},
	'submit .search': function(event) {
		event.preventDefault();
		var search = event.target.search.value;
		if (search){
			//Router.go('search',{'_search':search})
			Router.go('genes',{},{'query':{'search':search}})
		}
	},
	'click #clear-search': function(){
		console.log('clear search')
		Session.set('search',null);
		$('input[name="search"]').val('')
		Router.go('genes',{},{'query':{}})
	}
})
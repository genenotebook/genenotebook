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
  }
})

Template.header.events({
	"submit .search": function(event) {
		event.preventDefault();
		var search = event.target.search.value;
		console.log(search);
		if (search){
			Router.go('search',{'_search':search})
			//Router.go('search',{'search':search})
			//window.location = '/search='+search
		}
		//Session.set('search',search);
	},
	"click #genelist":function(){
		Session.set('search',null);
	}
})
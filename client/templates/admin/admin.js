Meteor.subscribe('userList');
Meteor.subscribe('tracks');

Template.admin.onCreated(function(){
	this.currentTab = new ReactiveVar('users');
})

Template.admin.helpers({
	tab: function(){
		return Template.instance().currentTab.get();
	},
	tabData: function(){
		const tab = Template.instance().currentTab.get();
		const data = {
			'users': Meteor.users.find({}),
			'tracks':Tracks.find({})
		};
		console.log(data[tab].fetch()[0])
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
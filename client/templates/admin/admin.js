Meteor.subscribe('userList');
Meteor.subscribe('tracks');
Meteor.subscribe('experiments');
Meteor.subscribe('filterOptions');

Template.admin.onCreated(function(){
	this.currentTab = new ReactiveVar('adminUsers');
})

Template.admin.helpers({
	tab: function(){
		return Template.instance().currentTab.get();
	},
	tabData: function(){
		const tab = Template.instance().currentTab.get();
		const data = {
			'adminUsers': Meteor.users.find({}),
			'adminTracks':Tracks.find({}),
			'adminExperiments':Experiments.find({}),
			'adminFilterOptions':FilterOptions.find({})
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
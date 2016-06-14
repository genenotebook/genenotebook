Meteor.subscribe('tracks')

Template.blast.helpers({
	tracks: function(){
		return Tracks.find({})
	}
})
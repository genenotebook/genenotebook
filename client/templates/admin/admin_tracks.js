Template.adminTracks.helpers({
	hasDb: function(){
		const hasDb = this.blastdbs !== undefined 
		return hasDb
	}
})

Template.adminTracks.events({
	'click .makeblastdb':function(){
		Meteor.call('makeBlastDb', this.trackName, (error, result) => {
			if (error){
				Bert.alert('makeBlastDb failed!','danger','growl-top-right');
			} else {
				Bert.alert('makeBlastDb finished','success','growl-top-right')
			}
		});
	}
})
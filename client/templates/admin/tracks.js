Template.adminTracks.helpers({
	hasDb: function(){
		console.log(this.blastdbs);
		const hasDb = this.blastdbs !== undefined 
		console.log(hasDb)
		return hasDb
	}
})

Template.adminTracks.events({
	'click .makeblastdb':function(){
		console.log(this.track)
		const track = this.track;
		Meteor.call('makeBlastDb',track,function(error,result){
			if (error){
				Bert.alert('makeBlastDb failed!','danger','growl-top-right');
			} else {
				Bert.alert('makeBlastDb finished','success','growl-top-right')
			}
		});
	}
})
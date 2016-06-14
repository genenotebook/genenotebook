Template.tracks.events({
	'click .makeblastdb':function(){
		console.log(this.track)
		const track = this.track;
		Meteor.call('makeBlastDb',track,function(error,result){
			if (result){
				console.log('result')
				console.log(result)
			}
			if (error){
				console.log('error')
				console.log(error)
			}
		});
	}
})
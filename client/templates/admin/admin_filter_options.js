Template.adminFilterOptions.events({
	'click #refresh':function(){
		Meteor.call('scan.features',function(err,res){
			if (err){
				Bert.alert('Filter update failed','danger','growl-top-right');
			} else {
				Bert.alert('Filters updated','success','growl-top-right');
			}
		})
	}
})
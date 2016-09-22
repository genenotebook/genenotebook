Meteor.methods({
	'experiments.update':function(_id,fields){
		if (! this.userId) {
			throw new Meteor.Error('not-authorized');
		};
		Experiments.update({'_id':_id},{$set:fields});
	}
})
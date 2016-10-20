Meteor.users.find({}).observeChanges({
	changed: function(id,field){
		if ( field.hasOwnProperty('presence') ){
			if ( field.presence.hasOwnProperty('status') ){
				if (field.presence.status === 'offline'){
					Genes.update({'viewing':id},{$pull:{'viewing':id}})
					Genes.update({'viewing':{$exists:true,$size:0}},{$unset:{'viewing':1}})
				}
			}
		}
	}
});
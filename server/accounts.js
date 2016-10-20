Accounts.onCreateUser(function(options,user){
	user.roles = ['registered'];
	return user
})

Accounts.onLogout(function(options){
	Meteor.users.update({_id:options.user._id,'presence.status':'online'},{$set:{'presence.status':'offline'}})
})
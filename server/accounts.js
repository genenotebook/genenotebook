Accounts.onCreateUser(function(options,user){
	user.roles = ['registered'];
	return user
})

Accounts.onLogout(function(options){
	console.log('logout',options.user)
	Meteor.users.update({_id:options.user._id,'presence.status':'online'},{$set:{'presence.status':'offline'}})
	Genes.update({'viewing':options.user._id},{$pull:{'viewing':options.user._id}})
	Genes.update({'viewing':{$exists:true,$size:0}},{$unset:{'viewing':1}})
  //Since we are on the server, the following does not work. Need to design a 'loggedIn' template / high order component
  FlowRouter.redirect('/login')
})
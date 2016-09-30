Accounts.onCreateUser(function(options,user){
	user.roles = ['registered'];
	return user
})
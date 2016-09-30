Template.login.events({
	'submit .form-signin':function(event,template){
		event.preventDefault();
		const username = $('#username').val()//event.target.username.value;
		const password = $('#password').val()//event.target.password.value;
		Meteor.loginWithPassword(username,password);
		Router.go('genes')
	},
	'click #new-account':function(event,template){
		event.preventDefault();
		Router.go('register')
	}
})
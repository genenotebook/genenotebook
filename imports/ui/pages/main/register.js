import { Template } from 'meteor/templating';

import Register from './register.jsx';
import './register.scss';
import './register.html';


Template.register.helpers({
	Register(){
		return Register
	}
})

/*
import './register.html';
import './register.scss';

function validatePasswords(){
	const password = $('#password');
	const passwordRepeat = $('#password-repeat');

	if (!(password.val() === passwordRepeat.val() )){
		passwordRepeat[0].setCustomValidity("Passwords Don't Match");
	} else {
		passwordRepeat[0].setCustomValidity('');
	}
}

Template.register.events({
	'submit .form-register':function(event,template){
		event.preventDefault();
		validatePasswords();
		console.log('submit');
		const userData = {
			username:  $('#username').val(),
			email: $('#email').val(),
			password: $('#password').val()
		}
		Accounts.createUser(userData,function(err){
			if (err){
				Bert.alert(err.reason,'danger','growl-top-right')
				console.log(err)
				console.log((err.reason === 'Username already exists.'))
				if (err.reason === 'Username already exists.'){
					const username = $('#username');
					username[0].setCustomValidity('Username already exists');
				} else if (err.reason === 'Email already exists.'){
					const email = $('#email');
					email[0].setCustomValidity('Email already in use');
				}
			}
		})
	},
	'change #password': function(){
		validatePasswords();
	},
	'change #password-repeat': function(){
		validatePasswords();
	},
	'change #username': function(){
		const username = $('#username');
		username[0].setCustomValidity('');
	},
	'change #email':function(){
		const email = $('#email');
		email[0].setCustomValidity('');
	}
})
*/

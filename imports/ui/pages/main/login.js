import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { FlowRouter } from 'meteor/kadira:flow-router';

import './login.html';
import './login.scss';

Template.login.events({
	'submit .form-signin':function(event,template){
		event.preventDefault();
		const username = $('#username').val()//event.target.username.value;
		const password = $('#password').val()//event.target.password.value;
		Meteor.loginWithPassword(username,password);

		const redirectAfterLogin = Session.get('redirectAfterLogin')
		if (redirectAfterLogin){
			FlowRouter.redirect(redirectAfterLogin)
		} else {
			FlowRouter.redirect('/genes')
		}
	}
})
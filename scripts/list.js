#!/usr/bin/env node

if (!module.parent){
	const commander = require('commander');
	const asteroid = require('asteroid');

	let what;
	
	commander
		.arguments('<what>')
		.option('-u, --username <username>','The user to authenticate as [REQUIRED]')
		.option('-p, --password <password>','The user\'s password [REQUIRED]')
		.action(function(value){
			what = value;
		})
		.parse(process.argv)

	if ( commander.username === undefined ||
		commander.password === undefined ||
		what === undefined ){
		commander.help()
	}

	console.log(commander.username,commander.password,what)
	
	const Connection = asteroid.createClass()

	const portal = new Connection({
		endpoint: 'ws://localhost:3000/websocket'
	})

	portal.loginWithPassword({
		username: commander.username,
		password: commander.password
	})

	portal.call('list', what)
		.then(result => {
			console.log(result)
			portal.disconnect()
		})
		.catch(error => {
			console.log(error)
			portal.disconnect()
		})	
}
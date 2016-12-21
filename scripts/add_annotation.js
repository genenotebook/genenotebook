#!/usr/bin/node
//import {createClass} from 'asteroid';

if (!module.parent){
	const assert = require('assert');
	const commander = require('commander');
	const Baby = require('babyparse');
	const fs = require('fs');
	const asteroid = require('asteroid');
	const path = require('path');

	let fileName;

	commander
		.arguments('<genome_annotation.gff>')
		.option('-u, --username <username>','The user to authenticate as [REQUIRED]')
		.option('-p, --password <password>','The user\'s password [REQUIRED]')
		.action(function(file){
			fileName = path.resolve(file);
		})
		.parse(process.argv)

	if ( commander.username === undefined ||
		commander.password === undefined ||
		fileName === undefined){
		commander.help()
	}

	console.log(commander.username,commander.password,fileName)
	
	const Connection = asteroid.createClass()

	const portal = new Connection({
		endpoint: 'ws://localhost:3000/websocket'
	})

	portal.loginWithPassword({
		username: commander.username,
		password: commander.password
	})

	portal.call('addGff',fileName)
		.then(result => {
			console.log(result)
			portal.disconnect()
			//process.exit(0)
		})
		.catch(error => {
			console.log(error)
			portal.disconnect()
			//process.exit(1)
		})	
}


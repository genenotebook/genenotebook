#!/usr/bin/env node

"use strict";

if (!module.parent){
	const assert = require('assert');
	const commander = require('commander');
	const fs = require('fs');
	const asteroid = require('asteroid');
	const path = require('path');

	let fileName, reference;

	commander
		.arguments('<reference.fasta>')
		.option('-u, --username <username>','The user to authenticate as [REQUIRED]')
		.option('-p, --password <password>','The user\'s password [REQUIRED]')
		.option('-r, --referencename <reference name>','Reference name')
		.action(function(file){
			fileName = path.resolve(file);
		})
		.parse(process.argv)

	if ( commander.username === undefined ||
		commander.password === undefined ||
		fileName === undefined ){
		commander.help()
	}

	const referenceName = commander.referencename || fileName;


	console.log(commander.username,commander.password,fileName,referenceName)
	
	const Connection = asteroid.createClass()

	const portal = new Connection({
		endpoint: 'ws://localhost:3000/websocket'
	})

	portal.loginWithPassword({
		username: commander.username,
		password: commander.password
	})

	portal.call('addReference', fileName, referenceName)
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


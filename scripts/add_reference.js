#!/usr/bin/env node

"use strict";

if (!module.parent){
	const assert = require('assert');
	const commander = require('commander');
	const fs = require('fs');
	const asteroid = require('asteroid');
	const path = require('path');
	const WebSocket = require('ws');

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

	const options = {
		fileName: fileName, 
		referenceName: referenceName
	}

	console.log(process.argv.join(' '))
	console.log(options)

	const Connection = asteroid.createClass()

	const portal = new Connection({
		endpoint: 'ws://localhost:8000/websocket',
		SocketConstructor: WebSocket
	})

	portal.loginWithPassword({
		username: commander.username,
		password: commander.password
	}).then(result => {
		portal.call('addReference', options)
		.then(result => {
			console.log(result)
			portal.disconnect()
		})
		.catch(error => {
			console.log(error)
			process.exit(1)
			portal.disconnect()
		})	
	}).catch(error => {
		console.log(error)
	})
}


#!/usr/bin/env node

"use strict";

if (!module.parent){
	const assert = require('assert');
	const commander = require('commander');
	const Baby = require('babyparse');
	const fs = require('fs');
	const asteroid = require('asteroid');
	const path = require('path');
	const WebSocket = require('ws');

	let fileName, reference;

	commander
		.arguments('<genome_annotation.gff>')
		.option('-u, --username <username>','The user to authenticate as [REQUIRED]')
		.option('-p, --password <password>','The user\'s password [REQUIRED]')
		.option('-r, --reference <reference genome>','Reference genome on which the annotation fits [REQUIRED]')
		.option('-t, --trackname <annotation trackname>','Name of the annotation track')
		.action(function(file){
			fileName = path.resolve(file);
		})
		.parse(process.argv)

	if ( commander.username === undefined ||
		commander.password === undefined ||
		commander.reference === undefined ||
		fileName === undefined ){
		commander.help()
	}

	const trackName = commander.trackname || fileName;

	const options = { 
		fileName: fileName, 
		referenceName: commander.reference,
		trackName: trackName 
	}
	
	console.log(process.argv.join(' '))
	console.log(options)

	const Connection = asteroid.createClass()

	const portal = new Connection({
		endpoint: 'ws://localhost:3000/websocket',
		SocketConstructor: WebSocket
	})

	portal.loginWithPassword({
		username: commander.username,
		password: commander.password
	}).then(result => {
		portal.call('addGff', options)
		.then(result => {
			console.log(result)
			portal.disconnect()
		})
		.catch(error => {
			console.log(error)
			portal.disconnect()
		})
	})
}


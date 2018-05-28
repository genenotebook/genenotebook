#!/usr/bin/env node

"use strict";

if (!module.parent){
	const assert = require('assert');
	const commander = require('commander');
	const fs = require('fs');
	const asteroid = require('asteroid');
	const path = require('path');
	const WebSocket = require('ws');

	let fileName;

	commander
		.arguments('<reference.fasta>')
		.option('-u, --username <username>','The user to authenticate as [REQUIRED]')
		.option('-p, --password <password>','The user\'s password [REQUIRED]')
		.option('-s, --settings <settings file>', 'JSON file with GeneNoteBook settings, default is settings.json')
		.option('-r, --referencename <reference name>','Reference name, default is fasta filename')
		.action(function(file){
			fileName = path.resolve(file);
		})
		.parse(process.argv)

	if ( typeof fileName === 'undefined' ||
		typeof commander.username === 'undefined' ||
		typeof commander.password === 'undefined' ){
		commander.help()
	}

	const referenceName = commander.referencename || fileName;

	const options = { fileName, referenceName };

	const settingsFile = commander.settings || 'settings.json';
	const settingString = fs.readFileSync(settingsFile)
	const settings = JSON.parse(settingString);

	const endpoint = `ws://localhost:${settings.private.port}/websocket`
	console.log(endpoint)

	/*
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
	*/
}


#!/usr/bin/env node

"use strict";

if (!module.parent){
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

	const referenceName = commander.referencename || fileName.split('/').pop();

	const options = { fileName, referenceName };

	const settingsFile = commander.settings || 'settings.json';
	const settingString = fs.readFileSync(settingsFile)
	const settings = JSON.parse(settingString);

	const endpoint = `ws://localhost:${settings.private.port}/websocket`
	const SocketConstructor = WebSocket;

	const Connection = asteroid.createClass()

	const geneNoteBook = new Connection({ endpoint, SocketConstructor })

	const { username, password } = commander;

	geneNoteBook.loginWithPassword({ username, password }).then(loginResult => {
		geneNoteBook.call('addReference', options)
		.then(addReferenceResult => {
			console.log(addReferenceResult)
			geneNoteBook.disconnect()
		})
		.catch(error => {
			console.log(error)
			process.exit(1)
			geneNoteBook.disconnect()
		})	
	}).catch(error => {
		console.log(error)
	})
}


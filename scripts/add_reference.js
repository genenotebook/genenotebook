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
		.option('-s, --settings [settings file]', 'JSON file with GeneNoteBook settings, default is settings.json')
		.option('-r, --referencename [reference name]','Reference name, default is fasta filename')
		.action(function(file){ fileName = path.resolve(file) })
		.on('--help', () => {
			console.log('');
			console.log('  Examples:') 
			console.log('')
			console.log('    $ node add_reference.js -u admin -p admin -s example_settings.json -r testdata testdata.fasta')
			console.log('    $ node add_reference.js --user admin --password admin --settings ' +
				'example_settings.json --referencename testdata testdata.fasta')
			console.log('')
		})
		.parse(process.argv)

	const { username, password } = commander;

	if (!( fileName || username || password )){
		commander.help()
	}

	const referenceName = commander.referencename || fileName.split('/').pop();

	const settingsFile = commander.settings || 'settings.json';
	const settingString = fs.readFileSync(settingsFile)
	const settings = JSON.parse(settingString);

	const endpoint = `ws://localhost:${settings.private.port}/websocket`
	const SocketConstructor = WebSocket;

	const Connection = asteroid.createClass()

	const geneNoteBook = new Connection({ endpoint, SocketConstructor })

	geneNoteBook.loginWithPassword({ username, password })
	.then(loginResult => {
		return geneNoteBook.call('addReference', { fileName, referenceName })
	})
	.then(addReferenceResult => {
		console.log(addReferenceResult)
		geneNoteBook.disconnect()
	})
	.catch(error => {
		console.log(error)
		geneNoteBook.disconnect()
	})
}


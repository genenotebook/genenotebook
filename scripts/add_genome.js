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
		.arguments('<genome.fasta>')
		.option('-u, --username <username>','The user to authenticate as [REQUIRED]')
		.option('-p, --password <password>','The user\'s password [REQUIRED]')
		.option('-s, --settings [settings file]', 'JSON file with GeneNoteBook settings, default is settings.json')
		.option('-n, --name [genome name]','Genome name, default is fasta filename')
		.action(function(file){ fileName = path.resolve(file) })
		.on('--help', () => {
			console.log('');
			console.log('  Examples:') 
			console.log('')
			console.log('    $ node add_genome.js -u admin -p admin -s example_settings.json -n testdata testdata.fasta')
			console.log('    $ node add_genome.js --user admin --password admin --settings ' +
				'example_settings.json --name testdata testdata.fasta')
			console.log('')
		})
		.parse(process.argv)

	const { username, password } = commander;

	if (!( fileName && username && password )){
		commander.help()
	}

	const genomeName = commander.name || fileName.split('/').pop();

	const settingsFile = commander.settings || 'settings.json';
	const settingString = fs.readFileSync(settingsFile)
	const settings = JSON.parse(settingString);

	const endpoint = `ws://localhost:${settings.private.port}/websocket`
	const SocketConstructor = WebSocket;

	const Connection = asteroid.createClass()

	const geneNoteBook = new Connection({ endpoint, SocketConstructor })

	geneNoteBook.loginWithPassword({ username, password })
	.then(loginResult => {
		return geneNoteBook.call('addGenome', { fileName, genomeName })
	})
	.then(addGenomeResult => {
		const { ok, writeErrors, writeConcernErrors, nInserted } = addGenomeResult;
		console.log(`Succesfully added ${genomeName} genome in ${nInserted} chunks`)
		geneNoteBook.disconnect()
	})
	.catch(error => {
		console.log(error)
		geneNoteBook.disconnect()
	})
}


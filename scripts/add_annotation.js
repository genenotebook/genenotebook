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
		.arguments('<genome_annotation.gff>')
		.option('-u, --username <username>','User to authenticate as [REQUIRED]')
		.option('-p, --password <password>','User password to authenticate with [REQUIRED]')
		.option('-r, --reference <reference genome name>','Reference genome name to which the annotation belongs [REQUIRED]')
		.option('-s, --settings [settings file]', 'JSON file with GeneNoteBook settings (default is settings.json)')
		.option('-t, --trackname [annotation trackname]','Name of the annotation track (default is annotation gff filename)')
		.action(function(file){
			fileName = path.resolve(file);
		})
		.on('--help',() => {
			console.log('');
			console.log('  Examples:') 
			console.log('')
			console.log('    $ node add_annotation.js -u admin -p admin -s example_settings.json ' + 
				'-r testdata -t testdata_annotation testdata.gff3')
			console.log('    $ node add_annotation.js --user admin --password admin --settings example_settings.json ' + 
				'--reference testdata --trackname testdata_annotation testdata.gff3')
			console.log('')
		})
		.parse(process.argv)

	const { username, password, reference } = commander;
	const referenceName = reference;

	if (!( username || password || reference || fileName )){
		commander.help()
	}

	const trackName = commander.trackname || fileName.split('/').pop();

	const settingsFile = commander.settings || 'settings.json';
	const settingString = fs.readFileSync(settingsFile)
	const settings = JSON.parse(settingString);

	const endpoint = `ws://localhost:${settings.private.port}/websocket`
	const SocketConstructor = WebSocket;

	const Connection = asteroid.createClass()

	const geneNoteBook = new Connection({ endpoint, SocketConstructor })

	geneNoteBook.loginWithPassword({ username, password })
	.then(loginResult => {
		return geneNoteBook.call('addAnnotationTrack', { fileName, referenceName, trackName})
	})
	.then(addGffResult => {
		const { ok, writeErrors, writeConcernErrors, nInserted } = addGffResult;
		console.log(`Successfully inserted ${nInserted} genes`);
		geneNoteBook.disconnect()
	})
	.catch(error => {
		console.log(error)
		geneNoteBook.disconnect()
	})
}


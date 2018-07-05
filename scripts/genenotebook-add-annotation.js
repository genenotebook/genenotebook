#!/usr/bin/env node
'use strict';

const program = require('commander');
const fs = require('fs');
const asteroid = require('asteroid');
const path = require('path');
const WebSocket = require('ws');

let fileName;

program
    .description('Add fasta formatted reference genome to a running GeneNoteBook server')
    .option('-u, --username <username>', 'GeneNoteBook admin username')
    .option('-p, --password <password>', 'GeneNoteBook admin password')
    .option('-g, --genome-name <name>','Reference genome name on which the annotatoion should be placed')
    .option('-c, --config-file [path]', 'GeneNoteBook config file, defaults to ./config.json')
    .action(file => {
      fileName = path.resolve(file);
    })
    .parse(process.argv);

const { username, password, configFile, genomeName } = program;

if (!( fileName && genomeName && username && password )){
  program.help()
}

const configFileName = configFile || 'config.json';
const configString = fs.readFileSync(configFileName)
const config = JSON.parse(configString);

const endpoint = `ws://localhost:${config.private.PORT}/websocket`
const SocketConstructor = WebSocket;

const Connection = asteroid.createClass()

const geneNoteBook = new Connection({ endpoint, SocketConstructor })

console.log({username,password})

geneNoteBook.loginWithPassword({ username, password })
.then(loginResult => {
  return geneNoteBook.call('addAnnotationTrack', { fileName, genomeName })
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
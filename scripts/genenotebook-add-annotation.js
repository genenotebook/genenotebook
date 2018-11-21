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
  .usage('[options] <annotation gff3 file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username')
  .option('-p, --password <password>', 'GeneNoteBook admin password')
  .option('-n, --genome-name <name>','Reference genome name to which the annotation should be added')
  .option('--port [port]', 'Port on which GeneNoteBook is running. Default: 3000')
  .action(file => {
    if ( typeof file !== 'string' ) program.help();
    fileName = path.resolve(file);
  });

program._name = 'genenotebook add annotation';
program.parse(process.argv);

const { username, password, port = 3000, genomeName } = program;

if (!( fileName && genomeName && username && password  )){
  program.help()
}

const endpoint = `ws://localhost:${port}/websocket`
const SocketConstructor = WebSocket;

const Connection = asteroid.createClass()

const geneNoteBook = new Connection({ endpoint, SocketConstructor })

geneNoteBook.loginWithPassword({ username, password })
.then(loginResult => {
  return geneNoteBook.call('addAnnotationTrack', { fileName, genomeName })
})
.then(addGenomeResult => {
  const { result: { ok, writeErrors, writeConcernErrors, nInserted } } = addGenomeResult;
  console.log(`Succesfully added ${nInserted} genes`)
  geneNoteBook.disconnect()
})
.catch(error => {
  console.log(error)
  geneNoteBook.disconnect()
})

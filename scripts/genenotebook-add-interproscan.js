#!/usr/bin/env node
'use strict';

const program = require('commander');
const fs = require('fs');
const asteroid = require('asteroid');
const path = require('path');
const WebSocket = require('ws');

let fileName;

program
    .description('Add Interproscan results to a running GeneNoteBook server')
    .usage('[options] <Interproscan gff3 output file>')
    .option('-u, --username <username>', 'GeneNoteBook admin username')
    .option('-p, --password <password>', 'GeneNoteBook admin password')
    .option('--port [port]', 'Port on which GeneNoteBook is running. Default: 3000')
    .action(file => {
      fileName = path.resolve(file);
    })
    .parse(process.argv);

const { username, password, port = 3000 } = program;

if (!( fileName && username && password  )){
  program.help()
}

const endpoint = `ws://localhost:${port}/websocket`
const SocketConstructor = WebSocket;

const Connection = asteroid.createClass()

const geneNoteBook = new Connection({ endpoint, SocketConstructor })

geneNoteBook.loginWithPassword({ username, password })
.then(loginResult => {
  return geneNoteBook.call('addInterproscan', { fileName })
})
.then(addInterproscanResult => {
  console.log('Finished')
  console.log(addInterproscanResult)
  //const { ok, writeErrors, writeConcernErrors, nInserted } = addInterproscanResult;
  //console.log(`Succesfully added ${genomeName} genome in ${nInserted} chunks`)
  geneNoteBook.disconnect()
})
.catch(error => {
  console.log(error)
  geneNoteBook.disconnect()
})
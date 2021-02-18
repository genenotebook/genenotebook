#!/usr/bin/env node
/* eslint-disable no-underscore-dangle */

const program = require('commander');
const asteroid = require('asteroid');
const path = require('path');
const WebSocket = require('ws');

let fileName;

program
  .description('Add InterProScan results to a running GeneNoteBook server')
  .usage('[options] <InterProScan gff3 output file>')
  .arguments('<file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username')
  .option('-p, --password <password>', 'GeneNoteBook admin password')
  .option('--port [port]', 'Port on which GeneNoteBook is running. Default: 3000')
  .action((file) => {
    if (typeof file !== 'string') program.help();
    fileName = path.resolve(file);
  });

program._name = 'genenotebook add interproscan';
program.parse(process.argv);

const { username, password, port = 3000 } = program;

if (!(fileName && username && password)) {
  program.help();
}

const endpoint = `ws://localhost:${port}/websocket`;
const SocketConstructor = WebSocket;

const Connection = asteroid.createClass();

const geneNoteBook = new Connection({ endpoint, SocketConstructor });

geneNoteBook.loginWithPassword({ username, password })
  .then((loginResult) => geneNoteBook.call('addInterproscan', { fileName }))
  .then((addInterproscanResult) => {
    const {
      result: {
        ok, writeErrors, writeConcernErrors, nInserted,
      },
    } = addInterproscanResult;
    console.log(`Succesfully added ${nInserted} protein domains`);
    geneNoteBook.disconnect();
  })
  .catch(({ error }) => {
    console.error(`Error: ${error}`);
    geneNoteBook.disconnect();
  });

#!/usr/bin/env node
/* eslint-disable no-underscore-dangle */

const program = require('commander');
const asteroid = require('asteroid');
const path = require('path');
const WebSocket = require('ws');

let fileName;

program
  .description('Add InterProScan results to a running GeneNoteBook server')
  .name('genenotebook add interproscan')
  .usage('[options] <InterProScan gff3 output file>')
  .arguments('<file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username')
  .option('-p, --password <password>', 'GeneNoteBook admin password')
  .option('--port [port]', 'Port on which GeneNoteBook is running. Default: 3000')
  .action((file) => {
    if (typeof file !== 'string') program.help();
    fileName = path.resolve(file);
  });

// program._name = 'genenotebook add interproscan';
program.parse(process.argv);

const { username, password, port = 3000 } = program.opts();

if (!(fileName && username && password)) {
  program.help();
}

const endpoint = `ws://localhost:${port}/websocket`;
const SocketConstructor = WebSocket;

const Connection = asteroid.createClass();

const geneNoteBook = new Connection({ endpoint, SocketConstructor });

geneNoteBook.loginWithPassword({ username, password })
  .then((loginResult) => {
    console.log('Logged in to server');
    return geneNoteBook.call('addInterproscan', { fileName });
  })
  .then((addInterproscanResult) => {
    // console.log({ addInterproscanResult });
    const { result: { nModified } } = addInterproscanResult;
    console.log(`Succesfully added ${nModified} protein domains`);
    geneNoteBook.disconnect();
  })
  .catch(({ error }) => {
    console.error(`Error: ${error}`);
    geneNoteBook.disconnect();
  });

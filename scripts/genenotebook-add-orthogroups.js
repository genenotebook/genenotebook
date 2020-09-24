#!/usr/bin/env node
/* eslint-disable no-underscore-dangle */

const program = require('commander');
// const fs = require('fs');
const asteroid = require('asteroid');
const path = require('path');
const WebSocket = require('ws');

let folderName;

program
  .description('Add Orthogroup phylogenetic trees to a running GeneNoteBook server')
  .usage('[options] <Folder with Orthofinder tree files>')
  .arguments('<file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username')
  .option('-p, --password <password>', 'GeneNoteBook admin password')
  .option('--port [port]', 'Port on which GeneNoteBook is running. Default: 3000')
  .action((file) => {
    if (typeof file !== 'string') program.help();
    folderName = path.resolve(file);
  });

program._name = 'genenotebook add orthogroups';
program.parse(process.argv);

const { username, password, port = 3000 } = program;

if (!(folderName && username && password)) {
  program.help();
}

const endpoint = `ws://localhost:${port}/websocket`;
const SocketConstructor = WebSocket;

const Connection = asteroid.createClass();

const geneNoteBook = new Connection({ endpoint, SocketConstructor });

geneNoteBook.loginWithPassword({ username, password })
  .then((loginResult) => geneNoteBook.call('addOrthogroupTrees', { folderName }))
  .then((addOrthogroupResult) => {
    const {
      result: {
        ok, writeErrors, writeConcernErrors, nInserted,
      },
    } = addOrthogroupResult;
    console.log(`Succesfully added ${nInserted} orthogroup phylogenetic trees from ${folderName}`);
    geneNoteBook.disconnect();
  })
  .catch((error) => {
    console.log(error);
    geneNoteBook.disconnect();
  });

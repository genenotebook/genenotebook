#!/usr/bin/env node
/* eslint-disable no-underscore-dangle */

const program = require('commander');
const asteroid = require('asteroid');
const path = require('path');
const WebSocket = require('ws');

let fileName;

program
  .description('Add fasta formatted reference genome to a running GeneNoteBook server')
  .usage('[options] <genome fasta file>')
  .arguments('<file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username')
  .option('-p, --password <password>', 'GeneNoteBook admin password')
  .option('-n, --name [name]', 'Reference genome name. Default: fasta file name')
  .option('--port [port]', 'Port on which GeneNoteBook is running. Default: 3000')
  .action((file) => {
    if (typeof file !== 'string') program.help();
    fileName = path.resolve(file);
  })
  .on('--help', function() {
    console.log('');
    console.log('  Example:');
    console.log('');
    console.log('    genenotebook add genome -u admin -p admin -n test testdata.fasta');
    console.log('');
  });

program._name = 'genenotebook add genome';
program.parse(process.argv);

const {
  username, password, name, port = 3000,
} = program.opts();

if (!(fileName && username && password)) {
  program.help();
}

const genomeName = name || fileName.split('/').pop();

const endpoint = `ws://localhost:${port}/websocket`;
const SocketConstructor = WebSocket;

const Connection = asteroid.createClass();

const geneNoteBook = new Connection({ endpoint, SocketConstructor });

geneNoteBook.loginWithPassword({ username, password })
  .then((loginResult) => {
    console.log('Logged in');
    return geneNoteBook.call('addGenome', { fileName, genomeName });
  }).then((addGenomeResult) => {
    const {
      result: {
        ok, writeErrors, writeConcernErrors, nInserted,
      },
    } = addGenomeResult;
    console.log(`Added ${genomeName} genome in ${nInserted} chunks`);
    geneNoteBook.disconnect();
  }).catch(({ error }) => {
    console.error(`Error: ${error}`);
    geneNoteBook.disconnect();
  });

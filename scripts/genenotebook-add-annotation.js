#!/usr/bin/env node
/* eslint-disable no-underscore-dangle, no-console */

const program = require('commander');
const asteroid = require('asteroid');
const path = require('path');
const WebSocket = require('ws');

let fileName;

program
  .description('Add fasta formatted reference genome to a running GeneNoteBook server')
  .usage('[options] <annotation gff3 file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username')
  .option('-p, --password <password>', 'GeneNoteBook admin password')
  .option(
    '-n, --genome-name <name>',
    'Reference genome name to which the annotation should be added',
  )
  .option('--port [port]', 'Port on which GeneNoteBook is running. Default: 3000')
  .option('-v, --verbose', 'Verbose warnings during GFF parsing')
  .action((file) => {
    if (typeof file !== 'string') program.help();
    fileName = path.resolve(file);
  });

program._name = 'genenotebook add annotation';
program.parse(process.argv);

const {
  username, password, port = 3000, genomeName, verbose,
} = program;


if (!(fileName && genomeName && username && password)) {
  program.help();
}

const endpoint = `ws://localhost:${port}/websocket`;
const SocketConstructor = WebSocket;

const Connection = asteroid.createClass();

const geneNoteBook = new Connection({ endpoint, SocketConstructor });

geneNoteBook
  .loginWithPassword({ username, password })
  .then(() => geneNoteBook.call(
    'addAnnotationTrack', 
    { fileName, genomeName, verbose }
  ))
  .then((addGenomeResult) => {
    const {
      result: { nInserted },
    } = addGenomeResult;
    console.log(`Succesfully added ${nInserted} genes`);
    geneNoteBook.disconnect();
  })
  .catch((error) => {
    console.log(error);
    geneNoteBook.disconnect();
  });

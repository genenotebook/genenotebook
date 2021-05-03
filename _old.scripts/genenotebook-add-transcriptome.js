#!/usr/bin/env node
/* eslint-disable no-underscore-dangle */

const program = require('commander');
const asteroid = require('asteroid');
const path = require('path');
const WebSocket = require('ws');

let fileName;

program
  .description('Add Kallisto quantified gene expression to a running GeneNoteBook server')
  .usage('[options] <Kallisto abundance.tsv file>')
  .arguments('<file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username')
  .option('-p, --password <password>', 'GeneNoteBook admin password')
  .option('--port [port]', 'Port on which GeneNoteBook is running. Default: 3000')
  .option('-s, --sample-name <sample name>', 'Unique sample name')
  .option('-r, --replica-group <replica group>', 'Identifier to group samples that belong to the same experiment')
  .option('-d, --sample-description <description>', 'Description of the experiment')
  .action((file) => {
    if (typeof file !== 'string') program.help();
    fileName = path.resolve(file);
  });

program._name = 'genenotebook add transcriptome';

program.parse(process.argv);

const {
  username, password, port = 3000, ...opts
} = program.opts();
const sampleName = opts.sampleName || fileName;
const replicaGroup = opts.replicaGroup || fileName;
const description = opts.sampleDescription || 'description';

if (!(fileName && username && password)) {
  program.help();
}

const endpoint = `ws://localhost:${port}/websocket`;
const SocketConstructor = WebSocket;

const Connection = asteroid.createClass();

const geneNoteBook = new Connection({ endpoint, SocketConstructor });

geneNoteBook.loginWithPassword({ username, password })
  .then((loginResult) => geneNoteBook.call('addTranscriptome', {
    fileName, sampleName, replicaGroup, description,
  }))
  .then((addTranscriptomeResult) => {
    const {
      result: {
        ok, writeErrors, writeConcernErrors, nInserted,
      },
    } = addTranscriptomeResult;
    console.log(`Succesfully added transcriptome data for ${nInserted} genes`);
    geneNoteBook.disconnect();
  })
  .catch(({ error }) => {
    console.error(`Error: ${error}`);
    geneNoteBook.disconnect();
  });

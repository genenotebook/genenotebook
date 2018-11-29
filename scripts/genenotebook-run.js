#!/usr/bin/env node
/* eslint-disable no-underscore-dangle */

'use strict';

const program = require('commander');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(msg) {
  console.log(`## LOG: ${new Date().toISOString()} ${msg}`);
}

function error(msg) {
  console.error(`## ERROR: ${new Date().toISOString()} ${msg}`);
}

function startMongoDaemon(dbPath) {
  if (!fs.existsSync(dbPath)) {
    exec(`mkdir -p ${dbPath}`);
  }

  const dataPath = `${dbPath}/data`;
  const logPath = `${dbPath}/log/mongod.log`;

  log(`Using DB path: ${dbPath}`);
  log(`MongoDB data files are in ${dataPath}`);
  log(`MongoDB log is in ${logPath}`);
  log('Starting MongoDB daemon');
  const MONGO_URL = 'mongodb://localhost:27017/genenotebook';
  const mongoDaemon = spawn('mongod', ['--port', '27017',
    '--dbpath', dbPath, '--logpath', logPath]);

  /*
  mongoDaemon.on('close', (code, signal) => {
    log(`Closed MongoDB connection (${code}) (${signal})`);
  });
  */

  mongoDaemon.on('error', (err) => {
    error(err);
  });

  mongoDaemon.stderr.on('data', (data) => {
    error(data.toString('utf8'));
  });
  /*
  mongoDaemon.stdout.on('data', (data) => {
    // console.log(data.toString('utf8'));
  });
  */
  const connection = {
    mongoDaemon,
    MONGO_URL,
  };

  return connection;
}

function startGeneNoteBook(opts) {
  return () => {
    Object.assign(process.env, opts);
    require('./main.js');
  };
}

program
  .description('Run a GeneNoteBook server')
  .usage('[options]')
  .option('--port [port]',
    'Web server port on which to serve GeneNoteBook. Default: 3000')
  .option('-m, --mongo-url [url]',
    'URL of running MongoDB daemon. (Mutually exclusive with --dbpath)')
  .option('-d, --db-path [path]',
    'Folder where DB files will be stored. Default: ./data/db.'
    + ' (Mutually exclusive with --mongo-url)')
  .option('-r, --root-url [url]',
    'Root URL on which GeneNoteBook will be accessed. '
    + 'Default: http://localhost')
  .option('-n, --node-options [option string]',
    'Runtime settings for NodeJS formatted as double-quoted string. '
    + 'Default: "--max-old-space-size=8192"');

program._name = 'genenotebook run';
program.parse(process.argv);

const opts = {};

const PORT = parseInt(program.port, 0) || 3000;
const ROOT_URL = program.rootUrl || `http://localhost:${PORT}`;
const NODE_OPTIONS = program.nodeOptions || '--max-old-space-size=8192';

Object.assign(opts, { PORT, ROOT_URL, NODE_OPTIONS });

if (program.mongoUrl) {
  if (program.dbPath) {
    throw new Error('--db-path and --mongo-url are mutually exclusive');
  }
  Object.assign(opts, { MONGO_URL: program.mongoUrl });
} else {
  const dbPath = program.dbPath || './db';
  const connection = startMongoDaemon(path.resolve(dbPath));
  Object.assign(opts, connection);
}

// const MONGO_URL = program.mongoUrl  || startMongoDaemon(); // 'mongodb://localhost:27017/genenotebook';

// console.log(opts);

setTimeout(startGeneNoteBook(opts), 100);

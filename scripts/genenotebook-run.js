#!/usr/bin/env node
/* eslint-disable no-underscore-dangle */

const program = require('commander');
const { spawn, exec } = require('child_process');
const path = require('path');

function log(msg) {
  console.log(`## LOG: ${new Date().toISOString()} ${msg}`);
}

function error(msg) {
  console.error(`## ERROR: ${new Date().toISOString()} ${msg}`);
}

function startMongoDaemon(dbPath) {
  const dataFolderPath = `${dbPath}/data`;
  const logFolderPath = `${dbPath}/log`;
  exec(`mkdir -p ${dataFolderPath} ${logFolderPath}`);
  const logPath = `${dbPath}/log/mongod.log`;

  log(`Using DB path: ${dbPath}`);
  log(`MongoDB data files are in ${dataFolderPath}`);
  log(`MongoDB logs are is in ${logFolderPath}`);
  log('Starting MongoDB daemon');
  const MONGO_URL = 'mongodb://localhost:27017/genenotebook';
  const mongoDaemon = spawn('mongod', [
    '--port',
    '27017',
    '--dbpath',
    dataFolderPath,
    '--logpath',
    logPath,
  ]);

  mongoDaemon.on('error', (err) => {
    error(err);
  });

  mongoDaemon.stderr.on('data', (data) => {
    error(data.toString('utf8'));
  });

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
  .option('--port [port]', 'Web server port on which to serve GeneNoteBook. Default: 3000')
  .option(
    '-m, --mongo-url [url]',
    'URL of running MongoDB daemon. (Mutually exclusive with --dbpath)',
  )
  .option(
    '-d, --db-path [path]',
    'Folder where DB files will be stored. Default: ./data/db.'
      + ' (Mutually exclusive with --mongo-url)',
  )
  .option(
    '-r, --root-url [url]',
    'Root URL on which GeneNoteBook will be accessed. ' + 'Default: http://localhost',
  )
  .option(
    '-n, --node-options [option string]',
    'Runtime settings for NodeJS formatted as double-quoted string. '
      + 'Default: "--max-old-space-size=8192"',
  );

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

setTimeout(startGeneNoteBook(opts), 100);

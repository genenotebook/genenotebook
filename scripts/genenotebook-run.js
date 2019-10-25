#!/usr/bin/env node
/* eslint-disable no-underscore-dangle, global-require */

const { Tail } = require('tail');
const command = require('commander');
const { spawn, exec } = require('child_process');
const path = require('path');

function log(msg) {
  console.log(`## LOG: ${new Date().toISOString()} ${msg}`);
}

function error(msg) {
  console.error(`## ERROR: ${new Date().toISOString()} ${msg}`);
}

function checkMongoLog(logPath) {
  const tail = new Tail(logPath);
  tail.on('line', function(line) {
    const parts = line.split(' ');
    const status = parts[1];
    if (status === 'E') {
      error(`MongoDB error: ${parts.slice(2).join(' ')}`);
      process.exit(1);
    }
  });
}

function startMongoDaemon(dbPath, mongoPort) {
  const dataFolderPath = `${dbPath}/data`;
  const logFolderPath = `${dbPath}/log`;
  exec(`mkdir -p ${dataFolderPath} ${logFolderPath}`);
  const logPath = `${dbPath}/log/mongod.log`;

  log(`Using DB path: ${dbPath}`);
  log(`MongoDB data files are in ${dataFolderPath}`);
  log(`MongoDB logs are in ${logFolderPath}`);
  log('Starting MongoDB daemon');
  const MONGO_URL = `mongodb://localhost:${mongoPort}/genenotebook`;
  const mongoDaemon = spawn('mongod', [
    '--port',
    mongoPort,
    '--dbpath',
    dataFolderPath,
    '--logpath',
    logPath,
  ]);

  mongoDaemon.on('error', function(err) {
    error(err);
  });

  mongoDaemon.stderr.on('data', function(chunk) {
    error(chunk.toString('utf8'));
  });

  mongoDaemon.stdout.on('data', function(chunk) {
    const msg = chunk.toString('utf8')
      .split(' ')
      .slice(5)
      .join(' ');
    log(`MongoDB message: ${msg}`);
    checkMongoLog(logPath);
  });

  const connection = {
    mongoDaemon,
    MONGO_URL,
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(connection);
    }, 10000);
  });
}

async function startGeneNoteBook(cmd) {
  const PORT = parseInt(cmd.port, 0) || 3000;
  const ROOT_URL = cmd.rootUrl || `http://localhost:${PORT}`;
  const opts = { PORT, ROOT_URL };

  if (cmd.mongoUrl) {
    if (cmd.dbPath) {
      throw new Error('--db-path and --mongo-url are mutually exclusive');
    }
    Object.assign(opts, { MONGO_URL: cmd.mongoUrl });
  } else {
    const dbPath = cmd.dbPath || './db';
    const mongoPort = cmd.mongoPort || 27017;
    const { MONGO_URL, mongoDaemon } = await startMongoDaemon(
      path.resolve(dbPath),
      mongoPort,
    );
    Object.assign(opts, { MONGO_URL });
    process.on('exit', function() {
      log('Shutting down mongo daemon');
      mongoDaemon.kill();
    });
  }
  Object.assign(process.env, opts);
  require('./main.js');
}

command
  .description('Run a GeneNoteBook server')
  .usage('[options]')
  .option('--port [port]', 'Web server port on which to serve GeneNoteBook. Default: 3000')
  .option(
    '-m, --mongo-url [url]',
    'URL of running MongoDB daemon and database name, for example mongodb://localhost:27017/genenotebook (Mutually exclusive with --dbpath)',
  )
  .option(
    '-d, --db-path [path]',
    'Folder where DB files will be stored. Default: ./db.'
      + ' (Mutually exclusive with --mongo-url)',
  )
  .option(
    '--mongo-port [port]', 'Port on which the mongo daemon will serve. Default: 27017',
  )
  .option(
    '-r, --root-url [url]',
    'Root URL on which GeneNoteBook will be accessed. Default: http://localhost',
  );

command._name = 'genenotebook run';
command.parse(process.argv);

startGeneNoteBook(command);

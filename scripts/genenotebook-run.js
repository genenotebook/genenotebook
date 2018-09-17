#!/usr/bin/env node
'use strict';
const program = require('commander');
const fs = require('fs');

program
    .description('Run a GeneNoteBook server')
    .usage('genenotebook run [options]')
    //.option('-c, --config <path>', 'GeneNoteBook config file, defaults to ./config.json')
    .option('--port [port]', 'Web server port on which to serve GeneNoteBook. Default: 3000')
    .option('-m, --mongo-url [url]', 'URL of running MongoDB daemon. Default: mongodb://localhost:27017/genenotebook')
    .option('-r, --root-url [url]', 'Root URL on which GeneNoteBook will be accessed. Default: http://localhost')
    .option('-n, --node-options [option string]', 'Runtime settings for NodeJS formatted as double-quoted string. Default: "--max-old-space-size=8192"')
    .parse(process.argv);

const PORT = parseInt(program.port) || 3000;
const MONGO_URL = program.mongoUrl || 'mongodb://localhost:27017/genenotebook';
const ROOT_URL = program.rootUrl || 'http://localhost';
const NODE_OPTIONS = program.nodeOptions || '--max-old-space-size=8192';

Object.assign(process.env, { MONGO_URL, ROOT_URL, PORT, NODE_OPTIONS });

require('./main.js');

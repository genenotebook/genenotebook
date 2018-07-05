#!/usr/bin/env node
'use strict';
const program = require('commander');
const fs = require('fs');

program
    .description('Run a GeneNoteBook server')
    .option('-c, --config <path>', 'GeneNoteBook config file, defaults to ./config.json')
    .parse(process.argv);

const configFile = program.config || 'config.json';

const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

const { MONGO_URL, ROOT_URL, PORT, NODE_OPTIONS } = config.private;

Object.assign(process.env, { MONGO_URL, ROOT_URL, PORT, NODE_OPTIONS });

require('./main.js');

#!/usr/bin/env node
'use strict';
const program = require('commander');

program
  .usage('[command]')
  .command('genome', 'Add reference genome')
  .command('annotation', 'Add genome annotation to reference genome')
  .command('transcriptome', 'Add transcriptome quantification data (Kallisto output)')
  .command('interproscan', 'Add protein domain information (InterProScan output)')
  .command('orthogroups','Add orthogroup phylogenetic trees (OrthoFinder output)');
  
program.on('command:*', function([ command ]){
  if ( this._execs[command] ) return;
  console.warn(`Can not add data of type: ${command}`);
  program.help();
});

program._name = 'genenotebook add';

program.parse(process.argv);
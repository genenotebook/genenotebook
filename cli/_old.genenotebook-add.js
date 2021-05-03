#!/usr/bin/env node
/* eslint-disable no-underscore-dangle */

const program = require('commander');

program
  .usage('[command]')
  .name('genenotebook add')
  .command('genome', 'Add reference genome')
  .command('annotation', 'Add genome annotation to reference genome')
  .command('transcriptome',
    'Add transcriptome quantification data (Kallisto output)')
  .command('interproscan',
    'Add protein domain information (InterProScan output)')
  .command('orthogroups',
    'Add orthogroup phylogenetic trees (OrthoFinder output)');

program.on('command:*', ([command]) => {
  if (this._execs.has(command)) return;
  console.warn(`Can not add data of type: ${command}`);
  program.help();
});

program.parse(process.argv);

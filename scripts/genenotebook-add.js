#!/usr/bin/env node
'use strict';
const program = require('commander');

program
    .command('genome', 'Add reference genome')
    .command('annotation', 'Add genome annotation to reference genome')
    .command('transcriptome', 'Add transcriptome quantification data (kallisto output)')
    .command('interproscan', 'Add protein domain information (interproscan output)')
    .command('orthogroups','Add orthogroup phylogenetic trees (orthofinder output)')
    .parse(process.argv);
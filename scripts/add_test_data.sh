#!/usr/bin/env bash

echo "adding test reference"
node scripts/add_reference.js -u admin -p admin -n test data/test.fasta &&\

echo "adding test annotation"
node scripts/add_annotation.js -u admin -p admin -r test -t test data/test.gff
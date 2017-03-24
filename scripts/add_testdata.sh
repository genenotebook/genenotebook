#!/usr/bin/sh

node scripts/add_reference.js -u admin -p admin -r test data/testdata/testdata.fasta &&\

node scripts/add_annotation.js -u admin -p admin -r test -t test data/testdata/testdata.gff &&\

node scripts/add_expression.js -u admin -p admin -t test -s SRR1377076 -g "Root ACN" -d "description" data/testdata/testdata.SRR1377076.abundance.tsv &&\
node scripts/add_expression.js -u admin -p admin -t test -s SRR1377077 -g "Root ACN" -d "description" data/testdata/testdata.SRR1377077.abundance.tsv &&\
node scripts/add_expression.js -u admin -p admin -t test -s SRR1377078 -g "Root ACN" -d "description" data/testdata/testdata.SRR1377078.abundance.tsv &&\
node scripts/add_expression.js -u admin -p admin -t test -s SRR1377079 -g "Root myc LCO (s)" -d "description" data/testdata/testdata.SRR1377079.abundance.tsv &&\
node scripts/add_expression.js -u admin -p admin -t test -s SRR1377080 -g "Root myc LCO (s)" -d "description" data/testdata/testdata.SRR1377080.abundance.tsv &&\
node scripts/add_expression.js -u admin -p admin -t test -s SRR1377081 -g "Root myc LCO (s)" -d "description" data/testdata/testdata.SRR1377081.abundance.tsv &&\
node scripts/add_expression.js -u admin -p admin -t test -s SRR1523070 -g "Leaf and root" -d "description" data/testdata/testdata.SRR1523070.abundance.tsv &&\
node scripts/add_expression.js -u admin -p admin -t test -s SRR1523071 -g "Leaf and root" -d "description" data/testdata/testdata.SRR1523071.abundance.tsv &&\
node scripts/add_expression.js -u admin -p admin -t test -s SRR1523072 -g "Leaf and root" -d "description" data/testdata/testdata.SRR1523072.abundance.tsv &&\
node scripts/add_expression.js -u admin -p admin -t test -s SRR1523075 -g "Leaf and root" -d "description" data/testdata/testdata.SRR1523075.abundance.tsv
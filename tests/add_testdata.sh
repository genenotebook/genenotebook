#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset
# set -o xtrace

function addTranscriptomes {
  echo "adding test transcriptome data" &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1377076 -r "Root ACN" -d "description" testdata/testdata.SRR1377076.abundance.tsv &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1377077 -r "Root ACN" -d "description" testdata/testdata.SRR1377077.abundance.tsv &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1377078 -r "Root ACN" -d "description" testdata/testdata.SRR1377078.abundance.tsv &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1377079 -r "Root myc LCO (s)" -d "description" testdata/testdata.SRR1377079.abundance.tsv &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1377080 -r "Root myc LCO (s)" -d "description" testdata/testdata.SRR1377080.abundance.tsv &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1377081 -r "Root myc LCO (s)" -d "description" testdata/testdata.SRR1377081.abundance.tsv &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1523070 -r "Leaf and root" -d "description" testdata/testdata.SRR1523070.abundance.tsv &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1523071 -r "Leaf and root" -d "description" testdata/testdata.SRR1523071.abundance.tsv &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1523072 -r "Leaf and root" -d "description" testdata/testdata.SRR1523072.abundance.tsv &&\
  ../cli/genenotebook add transcriptome -u admin -p admin -s SRR1523075 -r "Leaf and root" -d "description" testdata/testdata.SRR1523075.abundance.tsv
}

function addGenome {
  echo "adding test genome" &&\
  ../cli/genenotebook add genome -u admin -p admin -n test testdata/testdata.fasta
}

function addAnnotation {
  echo "adding test annotation" &&\
  ../cli/genenotebook add annotation -u admin -p admin -n test testdata/testdata.gff
}

function addInterproscan {
  echo "adding interproscan data" &&\
  ../cli/genenotebook add interproscan -u admin -p admin testdata/testdata.iprscan.gff3
}

function addOrthogroups {
  echo "adding orthogroup phylogenetic trees" &&\
  ../cli/genenotebook add orthogroups -u admin -p admin testdata/testorthogroups
}

addGenome &&\
addAnnotation &&\
addInterproscan &&\
addTranscriptomes &&\
addOrthogroups



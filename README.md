# GeneNoteBook
## A collaborative notebook for comparative genomics
###### Full documentation is at http://genenotebook.github.io/
[![Anaconda-Server Badge](https://anaconda.org/bioconda/genenotebook/badges/version.svg)](https://anaconda.org/bioconda/genenotebook)[![Anaconda-Server Badge](https://anaconda.org/bioconda/genenotebook/badges/latest_release_date.svg)](https://anaconda.org/bioconda/genenotebook)[![Anaconda-Server Badge](https://anaconda.org/bioconda/genenotebook/badges/platforms.svg)](https://anaconda.org/bioconda/genenotebook)

![GeneNoteBook example screenshot](https://github.com/genenotebook/genenotebook.github.io/blob/7ec82fd11ea57d06e26cbccdcd5b28598c0bf47e/assets/images/genenotebook.png)
##Getting started

Install using conda

```
conda install -c bioconda genenotebook
```

Fire up genenotebook

```
genenotebook run --port 3000
```

Add data

```
genenotebook add genome -u <username> -p <password> --port 3000 -n <genome name> [genome.fasta]
genenotebook add annotation -u <username> -p <password> --port 3000 -g <genome name> [annotation.gff3]
```

Navigate to http://localhost:3000

Browse genomes, genomic annotations and expression levels. Curate annotations, version history.


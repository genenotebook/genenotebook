# GeneNoteBook
## A collaborative notebook for comparative genomics
###### Full documentation is at http://genenotebook.github.io/
[![Anaconda-Server Badge](https://anaconda.org/bioconda/genenotebook/badges/version.svg)](https://anaconda.org/bioconda/genenotebook)[![Anaconda-Server Badge](https://anaconda.org/bioconda/genenotebook/badges/latest_release_date.svg)](https://anaconda.org/bioconda/genenotebook)[![Anaconda-Server Badge](https://anaconda.org/bioconda/genenotebook/badges/platforms.svg)](https://anaconda.org/bioconda/genenotebook)

Install using conda

```
conda install -c bioconda genenotebook
```

GeneNoteBook has to connect to a running MongoDB daemon. To start a MongoDB daemon (please make sure `<data directory>` is an existing folder)

```
mongod --fork --logpath mongod.log --dbpath <data directory>
```

Fire up genenotebook

```
genenotebook run --port 3000
```
Navigate to http://localhost:3000

:warning: The default admin account is `username: admin` `password: admin`, please change this immediately! :warning:

Add data (for example from testdata.tgz found in this repository)

```
genenotebook add genome -u admin -p admin --port 3000 -n test testdata.fasta
genenotebook add annotation -u admin -p admin --port 3000 -n test testdata.gff3
```

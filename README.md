[![Anaconda-Server Badge](https://anaconda.org/bioconda/genenotebook/badges/version.svg)](https://anaconda.org/bioconda/genenotebook)[![Anaconda-Server Badge](https://anaconda.org/bioconda/genenotebook/badges/latest_release_date.svg)](https://anaconda.org/bioconda/genenotebook)[![Anaconda-Server Badge](https://anaconda.org/bioconda/genenotebook/badges/platforms.svg)](https://anaconda.org/bioconda/genenotebook)
# GeneNoteBook
### A collaborative notebook for comparative genomics
##### Full documentation is at http://genenotebook.github.io/

Install using conda

```
conda install -c bioconda genenotebook
```

Fire up genenotebook

```
genenotebook run
```

This first starts a MongoDB daemon on port 27107 and then starts a GeneNoteBook server on port 3000. Try `genenotebook run -h` for additional options on specifying specific ports and database connections.
Navigate to http://localhost:3000

:warning: The default admin account is `username: admin` `password: admin`, please change this immediately! :warning:

Add data (for example from testdata.tgz found in this repository)

```
genenotebook add genome -u admin -p admin --port 3000 -n test testdata.fasta
genenotebook add annotation -u admin -p admin --port 3000 -n test testdata.gff3
```

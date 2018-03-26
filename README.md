# Genebook
## A collaborative notebook for genes and genomes
[Code coverage](docs/_code_documentation/badge.svg)
----
Full documentation is at http://genebook.readthedocs.io/
----
### Requirements:

* node.js >= 8.9.4 (on mac: ```brew install node```, on linux: ```apt-get install nodejs```)
* mongodb >= 3.4 (on mac: ```brew install mongodb```, on linux: ```apt-get install mongodb```)
* meteor (```curl https://install.meteor.com/ | sh```) 


To run a small example in development mode:

Install dependencies and fire up meteor in development mode

```
meteor npm install --save
meteor
```

Load test data

```
node scripts/add_test_data.sh
```

Navigate to http://localhost:3000

Browse genomes, genomic annotations and expression levels. Update functionality, version history.


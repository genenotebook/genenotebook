# bioportal
----
### Requirements:

* node.js v4 (on mac: ```brew install node```)
* mongodb v3.4 (on mac: ```brew install mongodb```)
* meteor (```curl https://install.meteor.com/ | sh```) 

Currently bioportal relies on the mongodb v3.4 aggregation framework, which does not ship with meteor. For now you will need to run your own instance of mongodb during development and connect to that.

To run a small example:

First get a mongodb instance up and running

```
mongod
```

Install dependencies and fire up meteor in development mode

```
meteor npm install --save
MONGO_URL=mongodb://localhost:27017/meteor meteor
```

Load test data

```
node scripts/add_test_data.sh
```

Navigate to http://localhost:3000

Browse genomes, genomic annotations and expression levels. Update functionality, version history.


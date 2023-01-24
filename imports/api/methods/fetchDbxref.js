import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { fetch } from 'meteor/fetch';

import SimpleSchema from 'simpl-schema';

import { dbxrefCollection } from '/imports/api/genes/dbxrefCollection.js';
import logger from '/imports/api/util/logger.js';
import { DBXREF_REGEX } from '/imports/api/util/util.js';

const fetchDbxref = new ValidatedMethod({
  name: 'fetchDbxref',
  validate: new SimpleSchema({
    dbxrefId: String,
  }).validator({ keys: [] }),
  applyOptions: {
    noRetry: true,
  },
  run({ dbxrefId }) {
    logger.debug(`fetch ${dbxrefId}`);
    let publicUrl;
    let description;
    let apiUrl;
    let dbType;
    const [, id] = dbxrefId.split(':', 2);
    switch (true) {
      case DBXREF_REGEX.go.test(dbxrefId):
        publicUrl = `http://amigo.geneontology.org/amigo/term/${dbxrefId}`;
        apiUrl = `http://api.geneontology.org/api/bioentity/${dbxrefId}`;
        dbType = 'go';
        break;
      case DBXREF_REGEX.interpro.test(dbxrefId):
        publicUrl = `https://www.ebi.ac.uk/interpro/entry/${id}`;
        apiUrl = `https://www.ebi.ac.uk/interpro/api/entry/interpro/${id}`;
        dbType = 'interpro';
        break;
      default:
        break;
    }
    if (
      typeof dbType !== 'undefined'
    ) {
      return fetch(apiUrl)
        .then((res) => {
          //console.log({ res, status: res.status });
          if (res.status === 200) return res.json();
          return Promise.reject(
            new Error(`DBXREF ${dbType} returned code ${res.status} when accessing ${apiUrl}`),
          );
        })
        .then((data) => {
          switch (dbType) {
            case 'go':
              description = data.label;
              break;
            case 'interpro':
              description = data.metadata.name.name;
              break;
            default:
              break;
          }
          dbxrefCollection.insert({
            dbxrefId,
            url: publicUrl,
            description,
            updated: new Date(),
            dbType,
          });
        })
        .catch((err) => logger.error(err));
    }
  },
});

export { fetchDbxref as default, DBXREF_REGEX };

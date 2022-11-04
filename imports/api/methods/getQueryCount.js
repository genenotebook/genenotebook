/* eslint-disable import/prefer-default-export */
import { Genes } from '/imports/api/genes/geneCollection.js';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import SimpleSchema from 'simpl-schema';


const getQueryCount = new ValidatedMethod({
  name: 'getQueryCount',
  validate: new SimpleSchema({
    query: { type: Object, blackbox: true },
  }).validator({ keys: [] }),
  applyOptions: {
    noRetry: true,
  },
  run({ query }) {
    return Genes.find(query).count();
  },
});

export default getQueryCount;

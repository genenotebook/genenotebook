import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const attributeSchema = new SimpleSchema({
  name: String,
  query: String,
  defaultShow: Boolean,
  defaultSearch: Boolean,
  allGenomes: {
    type: Boolean,
    optional: true
  },
  genomes: {
    type: Array,
    optional: true
  },
  'genomes.$': {
    type: String,
    optional: true
  }
})

const attributeCollection = new Mongo.Collection('attributes');

attributeCollection.attachSchema(attributeSchema);

export { attributeCollection, attributeSchema };
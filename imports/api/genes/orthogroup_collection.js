import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const orthogroupSchema = new SimpleSchema({
  ID: {
    type: String,
    index: true,
    label: 'Orthogroup ID'
  },
  size: {
    type: Number,
    label: 'Orthogroup size'
  },
  tree: {
    type: String,
    label: 'Newick formatted phylogenetic tree'
  },
  alignment: {
    type: String,
    optional: true
  }
})

const orthogroupCollection = new Mongo.Collection('orthogroups');

orthogroupCollection.attachSchema(orthogroupSchema);

export { orthogroupCollection, orthogroupSchema }
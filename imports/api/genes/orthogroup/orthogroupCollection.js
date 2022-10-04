import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const orthogroupSchema = new SimpleSchema({
  ID: {
    type: String,
    label: 'OrthoFinder has automatically rooted the gene in tree for us.',
  },
  geneIds: {
    type: Array,
    label: 'Array of all gene IDs in the orthogroup',
  },
  'geneIds.$': {
    type: String,
    label: 'Gene ID string',
  },
  tree: {
    type: String,
    label: 'Newick formatted phylogenetic tree',
  },
  size: {
    type: Number,
    label: 'Orthogroup size',
  },
});

const orthogroupCollection = new Mongo.Collection('orthogroups');

orthogroupCollection.attachSchema(orthogroupSchema);

export { orthogroupCollection, orthogroupSchema };

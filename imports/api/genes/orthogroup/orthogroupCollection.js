import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const orthogroupSchema = new SimpleSchema({
  ID: {
    type: String,
    index: true,
    label: 'Orthogroup ID',
  },
  size: {
    type: Number,
    label: 'Orthogroup size',
  },
  tree: {
    type: String,
    label: 'Newick formatted phylogenetic tree',
  },
  alignment: {
    type: String,
    label: 'Fasta formatted multiple sequence alignment',
    optional: true,
  },
  geneIds: {
    type: Array,
    label: 'Array of all gene IDs in the orthogroup',
  },
  'geneIds.$': {
    type: String,
    label: 'Gene ID string',
  },
});

const orthogroupCollection = new Mongo.Collection('orthogroups');

orthogroupCollection.attachSchema(orthogroupSchema);

export { orthogroupCollection, orthogroupSchema };

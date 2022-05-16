import SimpleSchema from 'simpl-schema';
import { Mongo } from 'meteor/mongo';

const diamondSchema = new SimpleSchema({
  iteration_query: {
    type: String,
    label: 'Query sequence name.',
  },
  iteration_hits: {
    type: Array,
    label: 'List of iteration hits.',
  },
  'iteration_hits.$': {
    type: Object,
  },
  'iteration_hits.$.num': {
    type: Number,
    label: 'Iteration position.',
  },
  'iteration_hits.$.id': {
    type: String,
    label: 'Iteration identifier.',
  },
  'iteration_hits.$.def': {
    type: String,
    label: 'Target iteration definition',
  },
  'iteration_hits.$.accession': {
    type: String,
    label: '(Accession number) The unique identifier for a sequence record.',
  },
  'iteration_hits.$.length': {
    type: Number,
    label: 'Iteration length.',
  },
  'iteration_hits.$.bit-score': {
    type: Number,
    label: 'Bit-score.',
  },
  'iteration_hits.$.evalue': {
    type: String,
    label: 'E-value',
  },
  'iteration_hits.$.query-from': {
    type: Number,
    label: '',
  },
  'iteration_hits.$.query-to': {
    type: Number,
    label: '',
  },
  'iteration_hits.$.identity': {
    type: Number,
    label: '',
  },
  'iteration_hits.$.positive': {
    type: Number,
    label: '',
  },
  'iteration_hits.$.query-seq': {
    type: String,
    label: '',
  },
  'iteration_hits.$.midline': {
    type: String,
    label: '',
  },
});

const diamondCollection = new Mongo.Collection('diamond');

export { diamondCollection, diamondSchema };

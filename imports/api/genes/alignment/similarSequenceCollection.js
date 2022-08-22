import SimpleSchema from 'simpl-schema';
import { Mongo } from 'meteor/mongo';

const similarSequencesSchema = new SimpleSchema({
  program_ref: {
    type: String,
    label: 'The program used to compare the sequences to a database',
  },
  database_ref: {
    type: String,
    label: 'The database used to compare the sequences.',
  },
  query_len: {
    type: Number,
    label: 'The total length of the query sequence. (from diamond)',
  },
  matrix_ref: {
    type: String,
    label: 'The matrix of substitution used for sequence alignment',
  },
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
  'iteration_hits.$.id': {
    type: String,
    label: 'Iteration identifier.',
  },
  'iteration_hits.$.def': {
    type: String,
    label: 'Target iteration definition',
  },
  'iteration_hits.$.identical_proteins': {
    type: Array,
    label: 'List of identical proteins.',
  },
  'iteration_hits.$.identical_proteins.$': {
    type: Object,
    label: 'Identical protein.',
  },
  'iteration_hits.$.identical_proteins.$.def': {
    type: Object,
    label: 'Definition of identical protein.',
  },
  'iteration_hits.$.identical_proteins.$.id': {
    type: Object,
    label: 'Identifier of identical protein.',
  },
  'iteration_hits.$.identical_proteins.$.accession_len': {
    type: Object,
    label: 'Length of identical protein.',
  },
  'iteration_hits.$.accession': {
    type: String,
    label: '(Accession number) The unique identifier for a sequence record.',
  },
  'iteration_hits.$.accession_len': {
    type: Number,
    label: 'The length of the accession sequence. (from ncbi)',
  },
  'iteration_hits.$.length': {
    type: Number,
    label: 'Iteration length.',
  },
  'iteration_hits.$.bit-score': {
    type: Number,
    label: 'Bit-score.',
  },
  'iteration_hits.$.score': {
    type: Number,
    label: 'score.',
  },
  'iteration_hits.$.evalue': {
    type: String,
    label: 'E-value',
  },
  'iteration_hits.$.query-from': {
    type: Number,
    label: 'The starting coordinate of the local alignment in the query.',
  },
  'iteration_hits.$.query-to': {
    type: Number,
    label: 'The ending coordinate of the local alignment in the query.',
  },
  'iteration_hits.$.hit-from': {
    type: Number,
    label: 'The starting coordinate of the local alignment in the target (hit).',
  },
  'iteration_hits.$.hit-to': {
    type: Number,
    label: 'The ending coordinate of the local alignment in the target (hit).',
  },
  'iteration_hits.$.identity': {
    type: Number,
    label: 'The number of characters in each sequence that are identical.',
  },
  'iteration_hits.$.positive': {
    type: Number,
    label: 'The number and fraction of residues for which the alignment scores have positive values.',
  },
  'iteration_hits.$.gaps': {
    type: Number,
    label: 'Hit gaps',
  },
  'iteration_hits.$.query-seq': {
    type: String,
    label: 'Query sequence.',
  },
  'iteration_hits.$.midline': {
    type: String,
  },
  'iteration_hits.$.hit-seq': {
    type: String,
    label: 'Hit sequence.',
  },
});

const similarSequencesCollection = new Mongo.Collection('alignment');

export { similarSequencesCollection, similarSequencesSchema };

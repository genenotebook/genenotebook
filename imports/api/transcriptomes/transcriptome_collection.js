import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const ExperimentInfo = new Mongo.Collection('experiments');

const ExperimentInfoSchema = new SimpleSchema({
  genomeId: {
    type: String,
    label: 'Genome ID',
  },
  sampleName: {
    type: String,
    label: 'Short name for the sample',
  },
  replicaGroup: {
    type: String,
    label: 'Identifier to group together samples from the same replica',
  },
  description: {
    type: String,
    label: 'Experiment description',
  },
  isPublic: {
    type: Boolean,
    label: 'Public experiment',
  },
  permission: {
    type: String,
    label: 'Permission level for this experiment',
  },
});

ExperimentInfo.attachSchema(ExperimentInfoSchema);

const Transcriptomes = new Mongo.Collection('transcriptomes');

const TranscriptomeSchema = new SimpleSchema({
  geneId: {
    type: String,
    label: 'Gene ID',
    index: true,
  },
  experimentId: {
    type: String,
    label: 'Experiment ID',
    index: true,
  },
  est_counts: {
    type: Number,
    label: 'Raw read counts',
  },
  tpm: {
    type: Number,
    label: 'TPM normalized read counts',
  },
});

Transcriptomes.attachSchema(TranscriptomeSchema);

export {
  ExperimentInfo, ExperimentInfoSchema, Transcriptomes, TranscriptomeSchema,
};

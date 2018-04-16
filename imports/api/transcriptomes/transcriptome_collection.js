import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const ExperimentInfo = new Mongo.Collection('experiments');

const ExperimentInfoSchema = new SimpleSchema({
	sampleName: {
		type: String,
		label: 'Short name for the sample',
	},
	experimentGroup: {
		type: String,
		label: 'Identifier to group together samples from the same experiment'
	},
	replicaGroup: {
		type: String,
		label: 'Identifier to group together samples from the same replica'
	},
	track: {
		type: String,
		label: 'Annotation track to which the transcriptome is mapped'
	},
	description: {
		type: String,
		label: 'Experiment description'
	},
	permissions: {
		type: Array,
		label: 'User groups that can access this experiment'
	},
	'permissions.$': {
		type: String
	}
})

ExperimentInfo.attachSchema(ExperimentInfoSchema);

const Transcriptomes = new Mongo.Collection('transcriptomes');

const TranscriptomeSchema = new SimpleSchema({
	geneId: {
		type: String,
		label: 'Gene ID',
		//index: true
	},
	experimentId: {
		type: String,
		label: 'Experiment ID',
		//index: true
	},
	raw_counts: {
		type: Number,
		//decimal: true,
		label: 'Raw read counts'
	},
	tpm: {
		type: Number,
		//decimal: true,
		label: 'TPM normalized read counts'
	}
})

Transcriptomes.attachSchema(TranscriptomeSchema)

export { ExperimentInfo, ExperimentInfoSchema, Transcriptomes, TranscriptomeSchema }


import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const ExperimentInfo = new Mongo.Collection('experiments');

const ExperimentsSchema = new SimpleSchema({
	ID: {
		type: String,
		label: 'Short identifier',
		//index: true
	},
	experimentGroup: {
		type: String,
		label: 'Identifier to group together samples from the same experiment'
	},
	replicaGroup: {
		type: String,
		label: 'Identifier to group together samples from the same replica'
	},
	description: {
		type: String,
		label: 'Experiment description'
	},
	permissions: {
		type: Array,//[String],
		label: 'User groups that can access this experiment'
	},
	'permissions.$': {
		type: String
	}
})

ExperimentInfo.attachSchema(ExperimentsSchema);

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
	permissions:{
		type: Array,//[String],
		label: 'User groups that can access this experiment'
	},
	'permissions.$': {
		type: String
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

export { ExperimentInfo, Transcriptomes }


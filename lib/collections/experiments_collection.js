ExperimentInfo = new Mongo.Collection('experiments');

ExperimentsSchema = new SimpleSchema({
	ID: {
		type: String,
		label: 'Short identifier'
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
		type: [String],
		label: 'User groups that can access this experiment'
	}
})

ExperimentInfo.attachSchema(ExperimentsSchema);

Expression = new Mongo.Collection('expression');

ExpressionSchema = new SimpleSchema({
	geneId: {
		type: String,
		label: 'Gene ID'
	},
	experimentId: {
		type: String,
		label: 'Experiment ID'
	},
	permissions:{
		type: [String],
		label: 'User groups that can access this experiment'
	},
	raw_counts: {
		type: Number,
		decimal: true,
		label: 'Raw read counts'
	},
	tpm: {
		type: Number,
		decimal: true,
		label: 'TPM normalized read counts'
	}
})

Expression.attachSchema(ExpressionSchema)


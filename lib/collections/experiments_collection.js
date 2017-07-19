Experiments = new Mongo.Collection('experiments');

ValueSchema = new SimpleSchema({
	ID: {
		type: String,
		label: 'Gene ID'
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
	},
	data: {
		type: [ValueSchema],
		label: 'Gene expression data'
	}
})

Experiments.attachSchema(ExperimentsSchema);
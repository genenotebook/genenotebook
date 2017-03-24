Experiments = new Mongo.Collection('experiments');

ExperimentsSchema = new SimpleSchema({
	ID: {
		type: String,
		label: 'Short identifier'
	},
	group: {
		type: String,
		label: 'Identifier to group together samples/replicates from the same experiment'
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

Experiments.attachSchema(ExperimentsSchema);
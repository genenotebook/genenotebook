References = new Mongo.Collection('references');

const ReferenceSchema = new SimpleSchema({
	header: {
		type: String,
		index: true,
		label: 'Fasta style sequence header'
	},
	seq: {
		type: String,
		label: 'Nucleotide sequence'
	},
	referenceName: {
		type: String,
		index: true,
		label: 'Reference name'
	},
	start: {
		type: Number,
		index: true,
		label: 'Start position of sequence fragment on original sequence'
	},
	end: {
		type: Number,
		index: true,
		label: 'End position of sequence fragment on original sequence'
	}
})

References.attachSchema(ReferenceSchema)
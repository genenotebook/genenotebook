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
	},
	permissions: {
		type: [String],
		label: 'User groups that are allowed to see this reference'
	}
})

References.attachSchema(ReferenceSchema)

ReferenceInfo = new Mongo.Collection('referenceInfo')

const ReferenceInfoSchema = new SimpleSchema({
	referenceName: {
		type: String,
		label: 'Reference name'
	},
	permissions: {
		type: [String],
		label: 'User groups that are allowed to see this reference'
	},
	description: {
		type: String,
		label: 'Reference sequence description'
	},
	organism: {
		type: String,
		label: 'Organism name'
	}
})

ReferenceInfo.attachSchema(ReferenceInfoSchema)
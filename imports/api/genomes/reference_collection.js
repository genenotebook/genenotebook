import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const References = new Mongo.Collection('references');

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
		type: Array,//[String],
		label: 'User groups that are allowed to see this reference'
	},
	'permissions.$' : {
		type: String
	}
})

References.attachSchema(ReferenceSchema)

const ReferenceInfo = new Mongo.Collection('referenceInfo')

const ReferenceInfoSchema = new SimpleSchema({
	referenceName: {
		type: String,
		label: 'Reference name',
		index: true,
		unique: true
	},
	permissions: {
		type: Array,//[String],
		label: 'User groups that are allowed to see this reference'
	},
	'permissions.$': {
		type: String
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

export { References, ReferenceSchema, ReferenceInfo, ReferenceInfoSchema };
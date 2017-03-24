References = new Mongo.Collection('references');

const ReferenceSchema = new SimpleSchema({
	header: {
		type: String
	},
	seq: {
		type: String
	},
	referenceName: {
		type: String
	},
	start: {
		type: Number
	},
	end: {
		type: Number
	}
})

References.attachSchema(ReferenceSchema)
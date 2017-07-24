References = new Mongo.Collection('references');

const ReferenceSchema = new SimpleSchema({
	header: {
		type: String,
		index: true
	},
	seq: {
		type: String
	},
	referenceName: {
		type: String,
		index: true
	},
	start: {
		type: Number,
		index: true
	},
	end: {
		type: Number,
		index: true
	}
})

References.attachSchema(ReferenceSchema)
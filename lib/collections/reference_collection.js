References = new Mongo.Collection('references');

ReferenceSchema = new SimpleSchema({
	header: {
		type: String
	},
	seq: {
		type: String
	},
	reference: {
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
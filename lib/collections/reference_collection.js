References = new Mongo.Collection('references');

ReferenceSchema = new SimpleSchema({
	header: {
		type: String,
		unique: true
	},
	seq: {
		type: String
	},
	reference: {
		type: String
	}
})

References.attachSchema(ReferenceSchema)
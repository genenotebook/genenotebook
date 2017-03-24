Tracks = new Mongo.Collection('tracks');

trackSchema = new SimpleSchema({
	trackName: {
		type: String
	},
	reference: {
		type: String
	}
});

Tracks.attachSchema(trackSchema);
Tracks = new Mongo.Collection('tracks');

blastDbSchema = new SimpleSchema({
  nucl: {
    type: String
  },
  prot: {
    type: String,
    optional: true
  }
})

trackSchema = new SimpleSchema({
	trackName: {
		type: String
	},
	reference: {
		type: String
	},
  'blastdbs': {
    type: blastDbSchema,
    optional: true,
  }
});

Tracks.attachSchema(trackSchema);
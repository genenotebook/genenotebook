Tracks = new Mongo.Collection('tracks');

blastDbSchema = new SimpleSchema({
  nucl: {
    type: String,
    label: 'Nucleotide blast database name'
  },
  prot: {
    type: String,
    optional: true,
    label: 'Peptide blast database name'
  }
})

trackSchema = new SimpleSchema({
	trackName: {
		type: String,
    label: 'Annotation track name'
	},
	reference: {
		type: String,
    label: 'Reference sequence to which the annotation belongs'
	},
  blastdbs: {
    type: blastDbSchema,
    optional: true,
  }
});

Tracks.attachSchema(trackSchema);
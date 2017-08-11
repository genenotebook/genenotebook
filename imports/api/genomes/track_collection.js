import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const Tracks = new Mongo.Collection('tracks');

const blastDbSchema = new SimpleSchema({
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

const trackSchema = new SimpleSchema({
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
  },
  permissions: {
    type: Array,//[String],
    label: 'Track permissions'
  },
  'permissions.$': {
    type: String
  }
});

Tracks.attachSchema(trackSchema);

export { Tracks, trackSchema };
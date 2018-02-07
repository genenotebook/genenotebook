import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

//DESIGN SCHEMA

const Downloads = new Mongo.Collection('downloads');

const DownloadSchema = new SimpleSchema({
  query: {
    type: Object,
    blackbox: true
  },
  queryHash: {
    type: String
  },
  counts: {
    type: Number
  },
  accessed: {
    type: Date
  }
})

export { Downloads };
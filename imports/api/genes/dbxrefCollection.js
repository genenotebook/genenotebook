import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// DESIGN SCHEMA

const dbxrefCollection = new Mongo.Collection('dbxref');

const dbxrefSchema = new SimpleSchema({
  dbxrefId: {
    type: String,
    label: 'Identifier in linked DB',
  },
  dbType: {
    type: String,
    label: 'Type of linked DB',
  },
  url: {
    type: String,
    label: 'Linked DB information page',
  },
  description: {
    type: String,
    label: 'Description of linked annotation',
  },
  updated: {
    type: Date,
    label: 'Datetime of last fetch from linked DB',
  },
});

dbxrefCollection.attachSchema(dbxrefSchema);

export { dbxrefCollection, dbxrefSchema };

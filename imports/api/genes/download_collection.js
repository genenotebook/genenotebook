import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

//DESIGN SCHEMA

const Downloads = new Mongo.Collection('downloads');

export { Downloads }
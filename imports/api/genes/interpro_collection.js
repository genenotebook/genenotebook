import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

//DESIGN SCHEMA

const Interpro = new Mongo.Collection('interpro');

export { Interpro }
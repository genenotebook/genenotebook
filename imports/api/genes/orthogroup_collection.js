import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

//DESIGN SCHEMA

const Orthogroups = new Mongo.Collection('orthogroups');

export { Orthogroups }
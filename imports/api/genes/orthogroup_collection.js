import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

//DESIGN SCHEMA

const orthogroupCollection = new Mongo.Collection('orthogroups');

export { orthogroupCollection }
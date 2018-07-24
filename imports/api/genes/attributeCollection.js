import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

//DESIGN SCHEMA

const attributeCollection = new Mongo.Collection('attributes');

export { attributeCollection };
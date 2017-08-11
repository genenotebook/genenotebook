import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

//DESIGN SCHEMA

const Attributes = new Mongo.Collection('attributes');

export { Attributes };
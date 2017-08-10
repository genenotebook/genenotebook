import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

//DESIGN SCHEMA

const EditHistory = new Mongo.Collection('editHistory');

export default EditHistory;
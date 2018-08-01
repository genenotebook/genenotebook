import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { Genes } from '/imports/api/genes/gene_collection.js';

export const queryCount = new ValidatedMethod({
  name: 'queryCount',
  validate: new SimpleSchema({
    query: { type: Object, blackbox: true }
  }).validator({keys:[]}),
  applyOptions: {
    noRetry: true
  },
  run({ query }){
    /*if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'user')){
      throw new Meteor.Error('not-authorized');
    }*/
    return Genes.find(query).count()
  }
})
import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';

import { attributeCollection } from './attributeCollection.js';

export const updateAttributeInfo = new ValidatedMethod({
  name: 'updateAttributeInfo',
  validate: new SimpleSchema({
    attributeId: String,
    defaultShow: Boolean,
    defaultSearch: Boolean
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ attributeId, defaultShow, defaultSearch }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'admin')){
      throw new Meteor.Error('not-authorized');
    }
    return attributeCollection.update({
      _id: attributeId
    },{
      $set : {
        defaultSearch,
        defaultShow
      }
    })
  }
})
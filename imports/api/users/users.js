import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import SimpleSchema from 'simpl-schema';
//import Future from 'fibers/future';

export const updateUserInfo = new ValidatedMethod({
  name: 'updateUserInfo',
  validate: new SimpleSchema({
    userId: { type: String },
    update: { type: Object }
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ userId, update }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId,'admin')){
      throw new Meteor.Error('not-authorized');
    }

    Meteor.users.update({_id: userId},update);
  }
})
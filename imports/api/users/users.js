import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Accounts } from 'meteor/accounts-base';

import SimpleSchema from 'simpl-schema';

export const updateUserInfo = new ValidatedMethod({
  name: 'updateUserInfo',
  validate: new SimpleSchema({
    userId: String,
    roles: Array,
    'roles.$': String,
    profile: Object,
    'profile.last_name': String,
    'profile.first_name': String,
    emails: Array,
    'emails.$': Object,
    'emails.$.address': String,
    'emails.$.verified': Boolean
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ userId, roles, profile, emails }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId, 'admin') && userId !== this.userId){
      throw new Meteor.Error('not-authorized');
    }

    Meteor.users.update({ _id: userId }, {
      $set: { roles, profile, emails }
    });
  }
})

export const setUserPassword = new ValidatedMethod({
  name: 'setUserPassword',
  validate: new SimpleSchema({
    userId: String,
    newPassword: String
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ userId, newPassword }){
    if (!this.userId) {
      throw new Meteor.Error('not-autorized');
    }

    if (! Roles.userIsInRole(this.userId, 'admin')){
      throw new Meteor.Error('not-authorized');
    }

    if (!this.isSimulation){
      return Accounts.setPassword(userId, newPassword);
    }
  }
})
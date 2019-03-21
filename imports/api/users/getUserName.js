import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
// import { Accounts } from 'meteor/accounts-base';

import SimpleSchema from 'simpl-schema';

const getUserName = new ValidatedMethod({
  name: 'getUserName',
  validate: new SimpleSchema({
    userId: String,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ userId }) {
    return Meteor.users.findOne({ _id: userId }).username;
  },
});

export default getUserName;

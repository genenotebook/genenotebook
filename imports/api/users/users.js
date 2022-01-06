import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

// ordered set of roles
export const ROLES = ['registered', 'user', 'curator', 'admin'];

export function getHighestRole(roles) {
  const ranks = roles.map((role) => ROLES.indexOf(role));
  const maxRank = ranks.sort().slice(-1);
  return ROLES[maxRank];
}

export const updateUserInfo = new ValidatedMethod({
  name: 'updateUserInfo',
  validate: new SimpleSchema({
    userId: String,
    username: String,
    role: String,
    profile: Object,
    'profile.last_name': String,
    'profile.first_name': String,
    emails: Array,
    'emails.$': Object,
    'emails.$.address': String,
    'emails.$.verified': Boolean,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({
    userId, username, role, profile, emails,
  }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin') && userId !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Meteor.users.update({ _id: userId }, {
      $set: {
        username, profile, emails,
      },
    });
    Roles.setUserRoles(userId, role);
  },
});

export const setUserPassword = new ValidatedMethod({
  name: 'setUserPassword',
  validate: new SimpleSchema({
    userId: String,
    newPassword: String,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ userId, newPassword }) {
    if (!this.userId) {
      throw new Meteor.Error('not-autorized');
    }

    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    if (!this.isSimulation) {
      return Accounts.setPassword(userId, newPassword);
    }
  },
});

export const setUsernamePassword = new ValidatedMethod({
  name: 'setUsernamePassword',
  validate: new SimpleSchema({
    userName: String,
    newPassword: String,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ userName, newPassword }) {
    if (!this.userId) {
      throw new Meteor.Error('not-autorized');
    }

    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Accounts.findUserByUsername(userName);
    if (!user) {
      throw new Meteor.Error('not-found');
    }

    if (!this.isSimulation) {
      Accounts.setPassword(user._id, newPassword);
      const jobStatus = 'ok';
      return { jobStatus };
    }
  },
});

export const addUser = new ValidatedMethod({
  name: 'addUser',
  validate: new SimpleSchema({
    userName: String,
    newPassword: String,
    userEmail: String,
    userFirstName: String,
    userLastName: String,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({
    userName,
    passWord,
    userEmail,
    userFirstName,
    userLastName,
  }) {
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    if (!Accounts.findUserByUsername(userName)) {
      try {
        // Create user account.
        const userId = Accounts.createUser({
          username: userName,
          email: userEmail,
          password: passWord,
        });

        // Update user profile.
        Meteor.users.update({ _id: userId }, {
          $set: {
            'profile.first_name': userFirstName,
            'profile.last_name': userLastName,
          },
        });
      } catch (e) {
        throw new Meteor.Error(e);
      }
    } else {
      throw new Meteor.Error('Username already exists.');
    }
  },
});

export const removeUserAccount = new ValidatedMethod({
  name: 'removeUserAccount',
  validate: new SimpleSchema({
    userName: String,
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ userName }) {
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized to remove an user');
    }

    const user = Accounts.findUserByUsername(userName);
    if (user) {
      try {
        Meteor.users.remove(user);
      } catch (e) {
        throw new Meteor.Error(e);
      }
    } else {
      throw new Meteor.Error('undefined user');
    }
  },
});

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

export const editUserInfo = new ValidatedMethod({
  name: 'editUserInfo',
  validate: new SimpleSchema({
    username: { type: String },
    profile: {
      type: Object,
      optional: true,
    },
    'profile.first_name': {
      type: String,
      optional: true,
    },
    'profile.last_name': {
      type: String,
      optional: true,
    },
    emails: {
      type: Array,
      optional: true,
    },
    'emails.$': { type: Object },
    'emails.$.address': {
      type: String,
      regEx: SimpleSchema.RegEx.Email,
      optional: true,
    },
    role: {
      type: String,
      allowedValues: ROLES,
      optional: true,
    },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({
    username, profile, emails, role,
  }) {
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    const userId = Accounts.findUserByUsername(username);
    if (!userId) {
      throw new Meteor.Error(`Cannot find a user with the name : ${username}.`);
    }

    try {
      Meteor.users.update(userId, {
        $set: {
          'profile.first_name': profile.first_name,
          'profile.last_name': profile.last_name,
          'emails.0.address': emails[0].address,
          'emails.0.verified': false,
        },
      });

      if (role) {
        Roles.setUserRoles(userId, role);
      }
    } catch (err) {
      throw new Meteor.Error(JSON.stringify(err));
    }

    const jobStatus = `Success to edit the ${username} user account.`;
    return { jobStatus };
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
      Accounts.setPassword(userId, newPassword);
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
    return null;
  },
});

export const addUser = new ValidatedMethod({
  name: 'addUser',
  validate: new SimpleSchema({
    userName: { type: String },
    newPassword: { type: String },
    emails: {
      type: String,
      regEx: SimpleSchema.RegEx.Email,
      optional: true,
    },
    profile: {
      type: Object,
      optional: true,
    },
    'profile.first_name': {
      type: String,
      optional: true,
    },
    'profile.last_name': {
      type: String,
      optional: true,
    },
    role: {
      type: String,
      allowedValues: ROLES,
      optional: true,
    },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({
    userName, newPassword, emails, profile, role,
  }) {
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    const userRole = (role === undefined ? 'registered' : role);

    if (!Accounts.findUserByUsername(userName)) {
      if (emails) {
        const userId = Accounts.createUser({
          username: userName,
          email: emails,
          password: newPassword,
          profile,
        });

        Roles.setUserRoles(userId, userRole);
      } else {
        const userId = Accounts.createUser({
          username: userName,
          password: newPassword,
          profile,
        });

        Meteor.users.update({ _id: userId }, { $set: { 'emails': [] } });

        Roles.setUserRoles(userId, userRole);
      }
    } else {
      throw new Meteor.Error('Username already exists.');
    }

    const jobStatus = `Success to create the ${userName} user account.`;
    return { jobStatus };
  },
});

export const removeUserAccount = new ValidatedMethod({
  name: 'removeUserAccount',
  validate: new SimpleSchema({
    userName: { type: String },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ userName }) {
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized to remove a user');
    }

    const user = Accounts.findUserByUsername(userName);
    if (user) {
      if (user._id === this.userId && Roles.getUsersInRole('admin').count() === 1) {
        throw new Meteor.Error('Impossible to delete yourself because you are the only admin of genenotebook.');
      } else {
        try {
          Meteor.users.remove(user);
        } catch (err) {
          throw new Meteor.Error(err);
        }
      }
    } else {
      throw new Meteor.Error(`Cannot find a user with the name : ${userName}.`);
    }

    const jobStatus = `Success to remove ${userName} account.`;
    return { jobStatus };
  },
});

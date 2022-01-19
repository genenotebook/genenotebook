/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

import logger from '/imports/api/util/logger.js';

Accounts.onCreateUser((options, user) => {
  user.roles = ['registered'];
  if (typeof user.profile === 'undefined') {
    user.profile = {
      first_name: '',
      last_name: '',
    };
  }
  if (typeof user.emails === 'undefined') {
    user.emails = [];
  }
  return user;
});

Accounts.onLogout(({ user }) => {
  logger.debug('logout', { user });
  if (user) {
    logger.debug(`logout ${user.username} (${user._id})`);
    Meteor.users.update(
      {
        _id: user._id,
        'presence.status': 'online',
      },
      {
        $set: {
          'presence.status': 'offline',
        },
      },
    );
  }
});

Meteor.users.allow({
  update(userId) {
    if (userId && Roles.userIsInRole(userId, 'admin')) {
      return true;
    }
    return false;
  },
});

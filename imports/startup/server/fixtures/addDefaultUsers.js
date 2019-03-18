import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';

import logger from '/imports/api/util/logger.js';

export default function addDefaultUsers() {
  // Add default users
  if (Meteor.users.find().count() === 0) {
    logger.log('Adding default admin user');
    const adminId = Accounts.createUser({
      username: 'admin',
      email: 'admin@admin.com',
      password: 'admin',
      profile: {
        first_name: 'admin',
        last_name: 'admin',
      },
    });
    Roles.addUsersToRoles(adminId, ['admin', 'curator', 'user', 'registered']);

    logger.log('Adding default guest user');
    const guestId = Accounts.createUser({
      username: 'guest',
      email: 'guest@guest.com',
      password: 'guest',
      profile: {
        first_name: 'guest',
        last_name: 'guest',
      },
    });
    Roles.addUsersToRoles(guestId, ['user', 'registered']);
  }
}

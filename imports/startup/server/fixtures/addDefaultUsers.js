import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';

import logger from '/imports/api/util/logger.js';

export default function addDefaultUsers() {
  // Moving to a new Roles schema

  try {
    logger.log('Migrating user roles schema v1 --> v2');
    Roles._forwardMigrate();
    logger.log('Migrating user roles schema v2 --> v3');
    Roles._forwardMigrate2();
  } catch (error) {
    logger.warn(error);
  }

  ['admin', 'curator', 'user', 'registered'].forEach((role) => {
    Roles.createRole(role);
  });
  Roles.addRolesToParent('curator', 'admin');
  Roles.addRolesToParent('registered', 'curator');
  Roles.addRolesToParent('user', 'registered');


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
    Roles.addUsersToRoles(adminId, 'admin');

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
    Roles.addUsersToRoles(guestId, 'registered');
  }
}

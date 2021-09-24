import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';

import logger from '/imports/api/util/logger.js';
import { ROLES } from '/imports/api/users/users.js';

export default function addDefaultUsers() {
  // Moving to a new Roles schema

  try {
    logger.log('Migrating user roles schema v1 --> v2');
    Roles._forwardMigrate(); // eslint-disable-line no-underscore-dangle
    logger.log('Migrating user roles schema v2 --> v3');
    Roles._forwardMigrate2(); // eslint-disable-line no-underscore-dangle
  } catch (error) {
    logger.warn(error);
  }

  // Register user roles
  ROLES.forEach((roleName, i) => {
    const role = Meteor.roles.findOne({ _id: roleName });
    if (!role) {
      logger.log(`Creating new role "${roleName}"`);
      Roles.createRole(roleName);
    }
    if (i > 0 && (!role || !role.children.length)) {
      logger.log(`Linking ${ROLES[i - 1]} --> ${roleName}`);
      Roles.addRolesToParent(ROLES[i - 1], roleName);
    }
  });

  // Add default users
  if (Meteor.users.find().count() === 0 /* && 'accounts' in Meteor.settings */) {
    logger.log('Adding default admin user');
    const userId = Accounts.createUser({
      username: 'admin',
      password: 'admin',
    });
    Roles.addUsersToRoles(userId, 'admin');
  }
}

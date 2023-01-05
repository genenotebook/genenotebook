import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';

import logger from '/imports/api/util/logger.js';
import { ROLES } from '/imports/api/users/users.js';

export default function addTestUsers() {

  // Register user roles
  ROLES.forEach((roleName, i) => {
    const role = Meteor.roles.findOne({ _id: roleName });
    if (!role) {
      Roles.createRole(roleName);
    }
    if (i > 0 && (!role || !role.children.length)) {
      Roles.addRolesToParent(ROLES[i - 1], roleName);
    }
  });

  // Add default users
  const adminId = Accounts.createUser({
    username: 'admin',
    password: 'admin',
  });
  Roles.addUsersToRoles(adminId, 'admin');

  const newUserId = Accounts.createUser({
    username: 'baseUser',
    email: 'user@user.user',
    password: 'user'
  });

  Roles.addUsersToRoles(newUserId, 'registered');

  return { adminId, newUserId }
}

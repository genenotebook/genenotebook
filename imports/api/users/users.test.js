/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { Accounts } from "meteor/accounts-base";
import { Roles } from 'meteor/alanning:roles';
import logger from '/imports/api/util/logger.js';
import addDefaultUsers from '/imports/startup/server/fixtures/addDefaultUsers.js';

import { addUser, editUserInfo, updateUserInfo, setUserPassword, setUsernamePassword, removeUserAccount } from './users.js'

const createUser = () => {
  userId = Accounts.createUser({
    username: 'baseUser',
    email: 'user@user.user',
    password: 'user'
  });
  Roles.setUserRoles(userId, 'registered');
  return userId
};

describe('users', function testUsers() {
  let newUser;
  addDefaultUsers();
  adminUser = Meteor.users.find({}).fetch()[0];
  const adminContext = {userId: adminUser._id}

  beforeEach(() => {
      newUser = {userName: 'test', newPassword: 'test', emails:"test@test.test"};
  });

  afterEach(() => {
      if (newUser._id)
          Meteor.users.remove(newUser._id);
  });

  it('Should create user', function createUser() {
    // Check permission for non-authorized
    chai.expect(() => {
      addUser._execute({}, newUser);
    }).to.throw('Oh no');

    const ret = addUser._execute(adminContext, newUser);
    newUser._id = ret.userId
    const users = Meteor.users.find({_id: newUser._id}).fetch();
    const user = users[0];
    chai.assert.lengthOf(users, 1, "User exists")
    chai.assert.equal(user.username, newUser.userName, "Created username matches")
  });

  it('Should delete user', function deleteUser() {
    const userId = createUser()

    chai.expect(() => {
      removeUserAccount._execute({}, newUser);
    }).to.throw('Oh no');

    removeUserAccount._execute(adminContext, {userName: 'test'});
    const users = Meteor.users.find({_id: userId}).fetch();
    chai.assert.lengthOf(users, 0, "User was deleted")
  });

  it('Should edit user', function editUser() {
    const userId = createUser()
    newUser._id = userId
    const userContext = {userId: userId}
    updateUserInfo._execute(adminContext, {username: 'test', emails: {adress: "new@test.test"}});
    const users = Meteor.users.find({_id: userId}).fetch();
    const user = users[0];
    chai.assert.lengthOf(users, 1, "User exists")
    chai.assert.equal(user.emails[0].adress, "new@test.test", "New email matches")
    // Check permission for user
    chai.expect(() => {
      updateUserInfo._execute(userContext, {username: 'test', emails: {adress: "new@test.test"}});
    }).to.throw('Oh no');
    // Check permission for non-authorized
    chai.expect(() => {
      updateUserInfo._execute({}, {username: 'test', emails: {adress: "new@test.test"}});
    }).to.throw('Oh no');
  });

  it('Should update user', function updateUser() {
    const userId = createUser()
    newUser._id = userId
    const userContext = {userId: userId}
    updateUserInfo._execute(userContext, {username: 'test', emails: {adress: "new@test.test"}});
    const users = Meteor.users.find({_id: userId}).fetch();
    const user = users[0];
    chai.assert.lengthOf(users, 1, "User exists")
    chai.assert.equal(user.emails[0].adress, "new@test.test", "New email matches")
  });

});

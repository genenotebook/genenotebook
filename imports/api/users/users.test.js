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
    }).to.throw('[not-authorized]');

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
      removeUserAccount._execute({}, {userName: 'baseUser'});
    }).to.throw('[not-authorized to remove a user]');

    removeUserAccount._execute(adminContext, {userName: 'baseUser'});
    const users = Meteor.users.find({_id: userId}).fetch();
    chai.assert.lengthOf(users, 0, "User was deleted")
  });


  it('Should edit user', function editUser() {
    const userId = createUser()
    newUser._id = userId
    const userContext = {userId: userId}
    editUserInfo._execute(adminContext, {username: 'baseUser', profile: {first_name: "t", last_name: "est"}, emails: [{address: "new@test.test"}]});
    const users = Meteor.users.find({_id: userId}).fetch();
    const user = users[0];
    chai.assert.lengthOf(users, 1, "User exists")
    chai.assert.equal(user.emails[0].address, "new@test.test", "New email matches")
    // Check permission for user
    chai.expect(() => {
      editUserInfo._execute(userContext, {username: 'baseUser', profile: {first_name: "t", last_name: "est"}, emails: [{address: "new@test.test"}]});
    }).to.throw('[not-authorized]');
    // Check permission for non-logged
    chai.expect(() => {
      editUserInfo._execute({}, {username: 'baseUser', profile: {first_name: "t", last_name: "est"}, emails: [{address: "new@test.test"}]});
    }).to.throw('[not-authorized]');
  });


  it('Should update user', function updateUser() {
    const userId = createUser()
    newUser._id = userId
    const userContext = {userId: userId}
    const newUserData = {
      userId: userId,
      username: 'baseUser',
      profile: {first_name: "t", last_name: "est"},
      emails: [{address: "new@test.test", verified: false}],
      role: 'registered'
    }

    updateUserInfo._execute(userContext, newUserData);
    const users = Meteor.users.find({_id: userId}).fetch();
    const user = users[0];
    chai.assert.lengthOf(users, 1, "User exists")
    chai.assert.equal(user.emails[0].address, "new@test.test", "New email matches")
  });

  it('Should set user password', function updateUsernamePassword() {
    const userId = createUser()
    newUser._id = userId

    const userContext = {userId: userId}
    const newUserData = {
      userId: userId,
      newPassword: 'newpassword'
    }
    setUserPassword._execute(adminContext, newUserData);
    chai.expect(() => {
      setUserPassword._execute(userContext, newUserData);
    }).to.throw('[not-authorized]');
    // Check permission for non-logged
    chai.expect(() => {
      setUserPassword._execute({}, newUserData);
    }).to.throw('[not-authorized]');
  });

  it('Should set username password', function updateUsernamePassword() {
    const userId = createUser()
    newUser._id = userId

    const userContext = {userId: userId}
    const newUserData = {
      userName: 'baseUser',
      newPassword: 'newpassword'
    }
    setUsernamePassword._execute(adminContext, newUserData);
    chai.expect(() => {
      setUsernamePassword._execute(userContext, newUserData);
    }).to.throw('[not-authorized]');
    // Check permission for non-logged
    chai.expect(() => {
      setUsernamePassword._execute({}, newUserData);
    }).to.throw('[not-authorized]');
  });
});

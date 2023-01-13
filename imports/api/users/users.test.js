/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { Accounts } from "meteor/accounts-base";
import { Roles } from 'meteor/alanning:roles';
import logger from '/imports/api/util/logger.js';
import { addTestUsers } from '/imports/startup/server/fixtures/addTestData.js';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { addUser, editUserInfo, updateUserInfo, setUserPassword, setUsernamePassword, removeUserAccount } from './users.js'


describe('users', function testUsers() {
  let adminId, newUserId
  let adminContext
  let userContext

  logger.log("Testing user-related methods")

  beforeEach(() => {
    ({ adminId, newUserId } = addTestUsers());
    adminContext = {userId: adminId}
    userContext = {userId: newUserId}
  });

  afterEach(() => {
    resetDatabase()
  });

  it('Should create user', function createUser() {
    // Check permission for non-authorized
    let newUser = {userName: 'test', newPassword: 'test', emails:"test@test.test"};
    chai.expect(() => {
      addUser._execute({}, newUser);
    }).to.throw('[not-authorized]');

    const ret = addUser._execute(adminContext, newUser);
    const users = Meteor.users.find({_id: ret.userId}).fetch();
    const user = users[0];
    chai.assert.lengthOf(users, 1, "User exists")
    chai.assert.equal(user.username, newUser.userName, "Created username matches")
  });

  it('Should delete user', function deleteUser() {
    chai.expect(() => {
      removeUserAccount._execute({}, {userName: 'baseUser'});
    }).to.throw('[not-authorized to remove a user]');

    removeUserAccount._execute(adminContext, {userName: 'baseUser'});
    const users = Meteor.users.find({_id: newUserId}).fetch();
    chai.assert.lengthOf(users, 0, "User was deleted")
  });


  it('Should edit user', function editUser() {
    editUserInfo._execute(adminContext, {username: 'baseUser', profile: {first_name: "t", last_name: "est"}, emails: [{address: "new@test.test"}]});
    const users = Meteor.users.find({_id: newUserId}).fetch();
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
    const newUserData = {
      userId: newUserId,
      username: 'baseUser',
      profile: {first_name: "t", last_name: "est"},
      emails: [{address: "new@test.test", verified: false}],
      role: 'registered'
    }

    updateUserInfo._execute(userContext, newUserData);
    const users = Meteor.users.find({_id: newUserId}).fetch();
    const user = users[0];
    chai.assert.lengthOf(users, 1, "User exists")
    chai.assert.equal(user.emails[0].address, "new@test.test", "New email matches")
  });

  it('Should set user password', function updateUsernamePassword() {

    const newUserData = {
      userId: newUserId,
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

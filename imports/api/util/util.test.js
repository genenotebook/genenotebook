/* eslint-env mocha */
import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { Accounts } from "meteor/accounts-base";
import { Roles } from 'meteor/alanning:roles';
import logger from '/imports/api/util/logger.js';
import addDefaultUsers from '/imports/startup/server/fixtures/addDefaultUsers.js';

import { addUser } from '/imports/api/users/users.js'


import { parseNewick, parseAttributeString } from './util.js';

describe('util', function testUtils() {
  describe('parseNewick', function testParseNewick() {
    it('parses properly formatted newick strings', function properParseNewick() {
      chai.assert.equal(1, 1);
    });
    it('throws an error on malformatted newick strings', function throwNewickError() {
      function badFn() {
        throw Error();
      }
      chai.expect(badFn).to.throw();
    });
  });
  describe('parseAttributeString', function() {
    it('parses properly formatted gff3 attribute strings');
  });
});

describe('users', function testUsers() {
  let newUser;
  addDefaultUsers();
  adminUser = Meteor.users.find({}).fetch()[0];
  let adminContext = {userId: adminUser._id}

  beforeEach(() => {
      newUser = {userName: 'test', newPassword: 'test', emails:"test@test.test"};
  });

  afterEach(() => {
      if (newUser._id)
          Meteor.users.remove(newUser._id);
  });

  it('Should create user', function createUser() {
    const ret = addUser._execute(adminContext, newUser);
    newUser._id = ret.userId
    const users = Meteor.users.find({_id: newUser._id}).fetch();
    const user = users[0];
    chai.assert.lengthOf(users, 1, "User exists")
    chai.assert.equal(user.username, newUser.userName, "Created username matches")
  });
});

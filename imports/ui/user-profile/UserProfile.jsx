/* eslint-disable camelcase */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Roles } from 'meteor/alanning:roles';

import { updateUserInfo } from '/imports/api/users/users.js';

import React, { useState } from 'react';
import { compose } from 'recompose';
import { isEqual, pick, cloneDeep } from 'lodash';

import logger from '/imports/api/util/logger.js';

import PermissionSelect from '/imports/ui/util/PermissionSelect.jsx';
import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import ResetPassword from './ResetPassword.jsx';

import './user-profile.scss';

function UserProfileButtons({
  editing, toggleEdit, saveChanges, cancelChanges, hasChanges,
}) {
  if (editing) {
    return (
      <div className="btn-group" role="group">
        {hasChanges && (
          <button className="btn btn-sm btn-success px-2 py-0" type="button" onClick={saveChanges}>
            <span className="icon-floppy" />
            {' '}
            Save changes
          </button>
        )}
        <button
          className="btn btn-sm btn-outline-dark border px-2 py-0"
          type="button"
          onClick={cancelChanges}
        >
          <span className="icon-cancel" />
          {' '}
          Cancel
        </button>
      </div>
    );
  }
  return (
    <button
      className="btn btn-sm btn-outline-dark border px-2 py-0"
      type="button"
      onClick={toggleEdit}
    >
      <span className="icon-pencil" />
      {' '}
Edit profile
    </button>
  );
}

function UserRoles({
  roles, existingRoles, onChange, isAdmin, editing,
}) {
  return (
    <div className="form-group col-md-6">
      <label htmlFor="groups" className="control-label">
          User roles
      </label>
      <PermissionSelect
        value={roles.map(({ _id: roleId }) => roleId)}
        options={existingRoles}
        onChange={onChange}
        disabled={!isAdmin || !editing}
      />
    </div>
  );
}

function UserName({ username, onChange, editing }) {
  return (
    <div className="form-group col-md-6">
      <label htmlFor="username" className="control-label">
          Username
      </label>
      <input
        type="text"
        className="form-control form-control-sm"
        id="username"
        onChange={onChange}
        value={username}
        disabled={!editing}
        pattern="^[a-zA-Z0-9]+$"
        title="Only letters and numbers"
        autoComplete="username"
      />
      <small id="emailHelp" className="form-text text-muted">
          Your username will be visible to other users and must be unique.
        {' '}
        <b>required</b>
      </small>
    </div>
  );
}

function Profile({
  first_name, last_name, onChange, editing,
}) {
  return (
    <div className="form-row">
      <div className="form-group col-md-6">
        <label htmlFor="firstname" className="control-label">
            First name
        </label>
        <input
          type="text"
          className="form-control form-control-sm"
          id="firstname"
          onChange={onChange}
          value={first_name}
          placeholder="First name"
          disabled={!editing}
          pattern="^[A-Za-z]+$"
          autoComplete="given-name"
        />
      </div>
      <div className="form-group col-md-6">
        <label htmlFor="lastname" className="control-label">
            Last name
        </label>
        <input
          type="text"
          className="form-control form-control-sm"
          id="lastname"
          onChange={onChange}
          value={last_name}
          placeholder="Last name"
          disabled={!editing}
          pattern="^[A-Za-z]+$"
          autoComplete="family-name"
        />
      </div>
    </div>
  );
}

function EmailAddress({ emails, onChange }) {
  return emails.map((email, i) => {
    // start counting at 1
    const index = i + 1;
    return (
      <div className="form-group" key={`email${index}`}>
        <label htmlFor={`email${index}`} className="control-label">
            Email address
        </label>
        <input
          type="email"
          className="form-control form-control-sm"
          id={`email${index}`}
          onChange={onChange}
          value={email.address}
          disabled
        />
      </div>
    );
  });
}

function AdminAccountCheck({ _id: userId }) {
  if (userId !== Meteor.userId()) {
    return (
      <div className="alert alert-danger" role="alert">
        This is not your own account!
      </div>
    );
  }
  return null;
}

function dataTracker({ match }) {
  const { userId } = match.params;
  const userSub = Meteor.subscribe('users');
  const userProfile = userId ? Meteor.users.findOne({ _id: userId }) : Meteor.user();
  const user = pick(userProfile, ['_id', 'username', 'emails', 'profile', 'roles']);

  const roleSub = Meteor.subscribe('roles');
  const existingRoles = Meteor.roles.find({}).fetch();

  const loading = !roleSub.ready() || !userSub.ready();

  return { user, loading, existingRoles };
}

const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading),
);

function UserProfile({
  existingRoles,
  user,
}) {
  const [username, setUsername] = useState(user.username);
  const [roles, setRoles] = useState(user.roles);
  const [profile, setProfile] = useState(user.profile);
  const [emails, setEmails] = useState(user.emails);
  const [editing, setEditing] = useState(false);

  const isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin');
  const hasChanges = !isEqual(username, user.username)
    || !isEqual(roles, user.roles)
    || !isEqual(profile, user.profile)
    || !isEqual(emails, user.emails);

  function changeUsername(event) {
    setUsername(event.target.value);
  }

  function changeRoles(_newRoles) {
    const newRoles = _newRoles.map((role) => role.value);

    if (newRoles.indexOf('registered') < 0) {
      newRoles.push('registered');
    }

    if (newRoles.indexOf('admin') < 0 && isAdmin) {
      newRoles.push('admin');
    }

    setRoles(newRoles);
  }

  function changeProfile({ target }) {
    const { id, value } = target;
    const newProfile = cloneDeep(profile);
    if (id === 'firstname') {
      newProfile.first_name = value;
    } else if (id === 'lastname') {
      newProfile.last_name = value;
    } else {
      logger.warn(`Unknown profile element: ${id}`);
    }
    setProfile(newProfile);
  }

  function changeEmail({ target }) {
    const { value, name } = target;
    const index = parseInt(name[name.length - 1], 10);
    const newEmails = emails.slice(); // empty slice to copy email array and not modify state
    newEmails[index] = value;
    setEmails(newEmails);
  }

  function saveChanges() {
    setEditing(false);
    updateUserInfo.call({
      userId: user._id, username, roles, profile, emails,
    }, (err) => {
      if (err) alert(err);
    });
  }

  function cancelChanges() {
    setUsername(user.username);
    setRoles(user.roles);
    setProfile(user.profile);
    setEmails(user.emails);
    setEditing(false);
  }

  function deleteAccount() {
    alert(
      'This currently does nothing. Please contact your administrator if you really want to remove your account',
    );
    logger.debug('deleteAccount');
  }

  return (
    <div className="user-profile card text-center">
      <div className="card-body">
        <AdminAccountCheck {...user} />
        <div className="float-center">
          <img className="mb-4 rounded-circle" src="logo.svg" alt="" width="50" height="50" />
          <h1 className="h3 mb-3 font-weight-normal">User Profile</h1>
        </div>
        <UserProfileButtons
          toggleEdit={() => setEditing(!editing)}
          saveChanges={saveChanges}
          cancelChanges={cancelChanges}
          {...{ editing, hasChanges }}
        />
        <form onSubmit={saveChanges}>
          <hr />
          <div className="form-row">
            <UserName
              {...{ username, editing }}
              onChange={changeUsername}
            />
            <UserRoles
              {...{
                roles, existingRoles, isAdmin, editing,
              }}
              onChange={changeRoles}
            />
          </div>
          <Profile {...{ editing, ...profile }} onChange={changeProfile} />
          <EmailAddress {...{ emails, editing }} onChange={changeEmail} />
          <hr />
        </form>
        {editing && <ResetPassword toggleEdit={() => setEditing(!editing)} {...user} />}
        <button
          className="btn btn-sm btn-danger px-2 py-0"
          type="button"
          onClick={deleteAccount}
        >
          <span className="icon-cancel" />
          {' '}
          Delete account
        </button>
      </div>
    </div>
  );
}

export default withConditionalRendering(UserProfile);

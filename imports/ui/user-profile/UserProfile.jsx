/* eslint-disable camelcase */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Roles } from 'meteor/alanning:roles';

import { updateUserInfo, getHighestRole } from '/imports/api/users/users.js';

import React, { useState } from 'react';
import { isEqual, pick, cloneDeep } from 'lodash';

import logger from '/imports/api/util/logger.js';

import PermissionSelect from '/imports/ui/util/PermissionSelect.tsx';
import {
  branch, compose, isLoading, Loading,
} from '/imports/ui/util/uiUtil.jsx';

import ResetPassword from './ResetPassword.jsx';

import './user-profile.scss';

function UserProfileButtons({
  editing, toggleEdit, saveChanges, cancelChanges, hasChanges,
}) {
  if (editing) {
    return (
      <div className="field has-addons user-profile-buttons has-text-centered" role="group">
        {hasChanges && (
          <p className="control">
            <button className="button is-small is-success is-small is-outlined" type="button" onClick={saveChanges}>
              <span className="icon-floppy" />
              {' Save changes'}
            </button>
          </p>
        )}
        <p className="control">
          <button
            className="button is-small"
            type="button"
            onClick={cancelChanges}
          >
            <span className="icon-cancel" />
            {' Cancel'}
          </button>
        </p>
      </div>
    );
  }
  return (
    <div className="has-text-centered">
      <button
        className="button is-small"
        type="button"
        onClick={toggleEdit}
      >
        <span className="icon-pencil" />
        {' Edit profile'}
      </button>
    </div>
  );
}

function UserRoles({
  role, existingRoles, onChange, isAdmin, editing,
}) {
  return (
    <div className="field">
      <label htmlFor="groups" className="label">
        User roles
      </label>
      <PermissionSelect
        value={role}
        options={existingRoles}
        onChange={onChange}
        disabled={!isAdmin || !editing}
      />
    </div>
  );
}

function UserName({ username, onChange, editing }) {
  return (
    <div className="field">
      <label htmlFor="username" className="label">
        Username
      </label>
      <input
        type="text"
        className="input is-small"
        id="username"
        onChange={onChange}
        value={username}
        disabled={!editing}
        pattern="^[a-zA-Z0-9]+$"
        title="Only letters and numbers"
        autoComplete="username"
      />
      <small id="emailHelp" className="help">
        {'Your username will be visible to other users and must be unique. '}
        <b>required</b>
      </small>
    </div>
  );
}

function Profile({
  first_name, last_name, onChange, editing,
}) {
  return (
    <div className="columns">
      <div className="column">
        <label htmlFor="firstname" className="label">
          First name
        </label>
        <input
          type="text"
          className="input is-small"
          id="firstname"
          onChange={onChange}
          value={first_name}
          placeholder="First name"
          disabled={!editing}
          pattern="^[A-Za-z]+$"
          autoComplete="given-name"
        />
      </div>
      <div className="column">
        <label htmlFor="lastname" className="label">
          Last name
        </label>
        <input
          type="text"
          className="input is-small"
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
  if (emails.length) {
    return emails.map((email, i) => {
    // start counting at 1
      const index = i + 1;
      return (
        <div className="field" key={`email${index}`}>
          <label htmlFor={`email${index}`} className="label">
            Email address
          </label>
          <input
            type="email"
            className="input is-small"
            id={`email${index}`}
            onChange={onChange}
            value={email.address}
            disabled
          />
        </div>
      );
    });
  } else {
    return (
      <div>
        <label htmlFor="" className="label">
          Email address
        </label>
        <input
          type="email"
          className="input is-small"
          id=""
          onChange={onChange}
          value="No email address defined"
          disabled
        />
      </div>
    );
  }
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

function UserProfile({
  existingRoles,
  user,
}) {
  const initialRole = getHighestRole(Roles.getRolesForUser(user._id));

  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState(initialRole);
  const [profile, setProfile] = useState(user.profile);
  const [emails, setEmails] = useState(user.emails);
  const [editing, setEditing] = useState(false);

  const isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin');
  const hasChanges = !isEqual(username, user.username)
    || !isEqual(role, initialRole)
    || !isEqual(profile, user.profile)
    || !isEqual(emails, user.emails);

  function changeUsername(event) {
    setUsername(event.target.value);
  }

  function changeRoles({ value: newRole }) {
    /*
    const newRoles = _newRoles.map((r) => r.value);

    if (newRoles.indexOf('registered') < 0) {
      newRoles.push('registered');
    }

    if (newRoles.indexOf('admin') < 0 && isAdmin) {
      newRoles.push('admin');
    }
    */

    setRole(newRole);
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

  function handleSubmit() {
    setEditing(false);
    updateUserInfo.call({
      userId: user._id, username, role, profile, emails,
    }, (err) => {
      if (err) alert(err);
    });
  }

  function cancelChanges() {
    setUsername(user.username);
    setRole(initialRole);
    setProfile(user.profile);
    setEmails(user.emails);
    setEditing(false);
  }

  function deleteAccount() {
    // eslint-disable-next-line no-alert
    alert(
      'This currently does nothing. Please contact your administrator if you really want to remove your account',
    );
    logger.debug('deleteAccount');
  }

  return (
    <div className="hero is-small is-light is-bold">
      <div className="hero-body">
        <div className="container columns is-centered">
          <form className="card column is-4 login-form" onSubmit={handleSubmit}>
            <div className="card-body">
              <AdminAccountCheck {...user} />
              <div className="card-image">
                <figure className="image is-96x96">
                  <img className="is-rounded" src="logo.svg" alt="logo" />
                </figure>
              </div>
              <h4 className="subtitle is-4 has-text-centered">User profile</h4>
              <UserProfileButtons
                toggleEdit={() => setEditing(!editing)}
                saveChanges={handleSubmit}
                cancelChanges={cancelChanges}
                {...{ editing, hasChanges }}
              />
              <hr />
              <div>
                <UserName
                  {...{ username, editing }}
                  onChange={changeUsername}
                />
                <UserRoles
                  {...{
                    role, existingRoles, isAdmin, editing,
                  }}
                  onChange={changeRoles}
                />
              </div>
              <Profile {...{ editing, ...profile }} onChange={changeProfile} />
              <EmailAddress {...{ emails, editing }} onChange={changeEmail} />
              <hr />

              {editing && <ResetPassword toggleEdit={() => setEditing(!editing)} {...user} />}
              <button
                className="button is-small is-danger"
                type="button"
                onClick={deleteAccount}
              >
                <span className="icon-cancel" />
                {' Delete account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default compose(
  withTracker(dataTracker),
  branch(isLoading, Loading),
)(UserProfile);

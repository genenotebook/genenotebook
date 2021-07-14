/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable max-classes-per-file */
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

import React, { useState } from 'react';

import { setUserPassword } from '/imports/api/users/users.js';

import { branch } from '/imports/ui/util/uiUtil.jsx';

const MIN_PASSWORD_LENGTH = 8;

function isAdmin({ _id: targetUserId }) {
  const userId = Meteor.userId();
  return Roles.userIsInRole(userId, 'admin') && userId !== targetUserId;
}

function ResetPasswordAdmin({ _id: userId, toggleEdit }) {
  const [newPassword, setNewPassword] = useState('');
  function handleSubmit(event) {
    event.preventDefault();
    setUserPassword.call({ userId, newPassword }, (err) => {
      if (err) alert(err);
      toggleEdit();
    });
  }
  return (
    <>
      <label htmlFor="newPassword" className="label">
        New password
      </label>
      <input
        type="password"
        className="input is-small"
        id="newPassword"
        onChange={({ target }) => setNewPassword(target.value)}
        value={newPassword}
        required
        placeholder="Set a new password for this user"
        autoComplete="new-password"
      />
      <small id="emailHelp" className="help">
        Minimum
        <b>
          {` ${MIN_PASSWORD_LENGTH} characters`}
        </b>
      </small>
      {
      newPassword.length >= MIN_PASSWORD_LENGTH
      && (
      <button
        className="button is-success is-small is-light is-outlined"
        type="button"
        onClick={handleSubmit}
      >
        <span className="icon-floppy" />
        {' Set new password'}
      </button>
      )
    }
      <hr />
    </>
  );
}


function ResetPasswordUser({ toggleEdit }) {
  // const { oldPassword, newPassword, newPasswordRepeat } = this.state;
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordRepeat, setNewPasswordRepeat] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (newPassword !== newPasswordRepeat) {
      setOldPassword('');
      setNewPassword('');
      setNewPasswordRepeat('');
      alert('Repeat new password incorrect');
    } else {
      Accounts.changePassword(oldPassword, newPassword, (err) => {
        if (err) alert(err);
        toggleEdit();
      });
    }
  }

  return (
    <>
      <label htmlFor="oldPassword" className="label">
        Old password
      </label>
      <input
        type="password"
        className="input is-small"
        id="oldPassword"
        onChange={({ target }) => setOldPassword(target.value)}
        value={oldPassword}
        required
        placeholder="Fill in your old password"
        autoComplete="current-password"
      />

      <label htmlFor="newPassword" className="label">
        New password
      </label>
      <input
        type="password"
        className="input is-small"
        id="newPassword"
        onChange={({ target }) => setNewPassword(target.value)}
        value={newPassword}
        required
        pattern={`.{${MIN_PASSWORD_LENGTH},}`}
        title={`Minimum ${MIN_PASSWORD_LENGTH} charachters`}
        placeholder="Pick a new password"
        autoComplete="new-password"
      />

      <input
        type="password"
        className="input is-small"
        id="newPasswordRepeat"
        onChange={({ target }) => setNewPasswordRepeat(target.value)}
        value={newPasswordRepeat}
        required
        pattern={`.{${MIN_PASSWORD_LENGTH},}`}
        title={`Minimum ${MIN_PASSWORD_LENGTH} charachters`}
        placeholder="Repeat your new password"
        autoComplete="new-password"
      />
      <small id="emailHelp" className="help">
        {'Minimum '}
        <b>
          {MIN_PASSWORD_LENGTH}
          {' characters'}
        </b>
      </small>

      {
        oldPassword.length || newPassword.length || newPasswordRepeat.length
          ? (
            <button
              className="button is-small is-success is-light is-outlined"
              type="button"
              onClick={handleSubmit}
            >
              <span className="icon-floppy" />
              {' Update password'}
            </button>
          ) : null
      }
      <hr />
    </>
  );
}

const ResetPassword = branch(isAdmin, ResetPasswordAdmin)(ResetPasswordUser);

export default ResetPassword;

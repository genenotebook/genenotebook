/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable max-classes-per-file */
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

import React, { useState } from 'react';

import { setUserPassword } from '/imports/api/users/users.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

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
      <form onSubmit={handleSubmit}>
        <label htmlFor="newPassword" className="control-label">
        New password
        </label>
        <input
          type="password"
          className="form-control form-control-sm"
          id="newPassword"
          onChange={({ target }) => setNewPassword(target.value)}
          value={newPassword}
          required
          placeholder="Set a new password for this user"
          autoComplete="new-password"
        />
        <small id="emailHelp" className="form-text text-muted">
          Minimum
          <b>
            {` ${MIN_PASSWORD_LENGTH} characters`}
          </b>
        </small>
      </form>
      {
      newPassword.length >= MIN_PASSWORD_LENGTH
      && (
      <button
        className="btn btn-sm btn-success px-2 py-0"
        type="button"
        onClick={handleSubmit}
      >
        <span className="icon-floppy" />
        {' '}
        Set new password
      </button>
      )
    }
      <hr />
    </>
  );
}

class _ResetPasswordAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newPassword: '',
    };
  }

  onChange = ({ target }) => {
    const { id, value } = target;
    this.setState({
      [id]: value,
    });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { _id: userId, toggleEdit } = this.props;
    const { newPassword } = this.state;
    setUserPassword.call({ userId, newPassword }, (err, res) => {
      if (err) alert(err);
      toggleEdit();
    });
  }

  hasInput = () => this.state.newPassword.length >= MIN_PASSWORD_LENGTH

  render() {
    const { newPassword } = this.state;
    return (
      <>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="newPassword" className="control-label">
          New password
          </label>
          <input
            type="password"
            className="form-control form-control-sm"
            id="newPassword"
            onChange={this.onChange}
            value={newPassword}
            required
            placeholder="Set a new password for this user"
          />
          <small id="emailHelp" className="form-text text-muted">
          Minimum
            {' '}
            <b>
              {MIN_PASSWORD_LENGTH}
              {' '}
characters
            </b>
          </small>
        </form>
        {
        this.hasInput()
        && (
        <button
          className="btn btn-sm btn-success px-2 py-0"
          type="button"
          onClick={this.handleSubmit}
        >
          <span className="icon-floppy" />
          {' '}
Set new password
        </button>
        )
      }
        <hr />
      </>
    );
  }
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
      <form onSubmit={handleSubmit}>
        <label htmlFor="oldPassword" className="control-label">
        Old password
        </label>
        <input
          type="password"
          className="form-control form-control-sm"
          id="oldPassword"
          onChange={({ target }) => setOldPassword(target.value)}
          value={oldPassword}
          required
          placeholder="Fill in your old password"
          autoComplete="current-password"
        />

        <label htmlFor="newPassword" className="control-label pt-2">
        New password
        </label>
        <input
          type="password"
          className="form-control form-control-sm"
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
          className="form-control form-control-sm"
          id="newPasswordRepeat"
          onChange={({ target }) => setNewPasswordRepeat(target.value)}
          value={newPasswordRepeat}
          required
          pattern={`.{${MIN_PASSWORD_LENGTH},}`}
          title={`Minimum ${MIN_PASSWORD_LENGTH} charachters`}
          placeholder="Repeat your new password"
          autoComplete="new-password"
        />
        <small id="emailHelp" className="form-text text-muted">
        Minimum
          {' '}
          <b>8 characters</b>
        </small>

        {
        oldPassword.length || newPassword.length || newPasswordRepeat.length
          ? (
            <button
              className="btn btn-sm btn-success px-2 py-0"
              type="button"
              onClick={handleSubmit}
            >
              <span className="icon-floppy" />
              {' '}
              Update password
            </button>
          ) : null
      }
      </form>
      <hr />
    </>
  );
}

class _ResetPasswordUser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      oldPassword: '',
      newPassword: '',
      newPasswordRepeat: '',
    };
  }

  onChange = ({ target }) => {
    const { id, value } = target;
    this.setState({
      [id]: value,
    });
  }

  hasInput = () => {
    const { oldPassword, newPassword, newPasswordRepeat } = this.state;
    return oldPassword.length || newPassword.length || newPasswordRepeat.length;
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { toggleEdit } = this.props;
    const { oldPassword, newPassword, newPasswordRepeat } = this.state;
    if (newPassword !== newPasswordRepeat) {
      this.setState({
        oldPassword: '',
        newPassword: '',
        newPasswordRepeat: '',
      });
      alert('Repeat new password incorrect');
    } else {
      Accounts.changePassword(oldPassword, newPassword, (err, res) => {
        if (err) alert(err);
        toggleEdit();
      });
    }
  }

  render() {
    const { oldPassword, newPassword, newPasswordRepeat } = this.state;
    return (
      <>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="oldPassword" className="control-label">
          Old password
          </label>
          <input
            type="password"
            className="form-control form-control-sm"
            id="oldPassword"
            onChange={this.onChange}
            value={oldPassword}
            required
            placeholder="Fill in your old password"
          />

          <label htmlFor="newPassword" className="control-label pt-2">
          New password
          </label>
          <input
            type="password"
            className="form-control form-control-sm"
            id="newPassword"
            onChange={this.onChange}
            value={newPassword}
            required
            pattern=".{8,}"
            title="Minimum 8 charachters"
            placeholder="Pick a new password"
          />

          <input
            type="password"
            className="form-control form-control-sm"
            id="newPasswordRepeat"
            onChange={this.onChange}
            value={newPasswordRepeat}
            required
            pattern=".{8,}"
            title="Minimum 8 charachters"
            placeholder="Repeat your new password"
          />
          <small id="emailHelp" className="form-text text-muted">
          Minimum
            {' '}
            <b>8 characters</b>
          </small>

          {
          this.hasInput()
            ? (
              <button
                className="btn btn-sm btn-success px-2 py-0"
                type="button"
                onClick={this.handleSubmit}
              >
                <span className="icon-floppy" />
                {' '}
Update password
              </button>
            ) : null
        }
        </form>
        <hr />
      </>
    );
  }
}

const ResetPassword = withEither(isAdmin, ResetPasswordAdmin)(ResetPasswordUser);

export default ResetPassword;

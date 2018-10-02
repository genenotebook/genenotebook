import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

import React from 'react';

import { setUserPassword } from '/imports/api/users/users.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

const MIN_PASSWORD_LENGTH = 8;

const isAdmin = ({ _id: targetUserId }) => {
  const userId = Meteor.userId();
  const isAdmin = Roles.userIsInRole(userId, 'admin');
  return isAdmin && userId !== targetUserId
}

class ResetPasswordAdmin extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      newPassword: ''
    }
  }

  onChange = ({ target }) => {
    const { id, value } = target;
    this.setState({
      [id]: value
    })
  }

  handleSubmit = event => {
    event.preventDefault();
    const { _id: userId, toggleEdit } = this.props;
    const { newPassword } = this.state;
    setUserPassword.call({ userId, newPassword }, (err,res) => {
      if (err) alert(err);
      toggleEdit();
    })
  }

  hasInput = () => {
    return this.state.newPassword.length >= MIN_PASSWORD_LENGTH
  }

  render(){
    const { newPassword } = this.state;
    return <React.Fragment>
      <form onSubmit={this.handleSubmit}>
        <label htmlFor='newPassword' className="control-label">
          New password
        </label>
        <input type="password" className="form-control form-control-sm" id='newPassword' 
          onChange={this.onChange} value={newPassword} required
          placeholder="Set a new password for this user"/>
        <small id="emailHelp" className="form-text text-muted">
          Minimum <b>{MIN_PASSWORD_LENGTH} characters</b>
        </small>
      </form>
      {
        this.hasInput() &&
        <button className='btn btn-sm btn-success px-2 py-0' type='button'
          onClick={this.handleSubmit} >
          <span className='icon-floppy' /> Set new password
        </button>
      }
      <hr/>
    </React.Fragment>
  }

}

class ResetPasswordUser extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      oldPassword: '',
      newPassword: '',
      newPasswordRepeat: ''
    }
  }

  onChange = ({ target }) => {
    const { id, value } = target;
    this.setState({
      [id]: value
    })
  }

  hasInput = () => {
    const { oldPassword, newPassword, newPasswordRepeat } = this.state;
    return oldPassword.length || newPassword.length || newPasswordRepeat.length
  }

  handleSubmit = event => {
    event.preventDefault();
    const { toggleEdit } = this.props;
    const { oldPassword, newPassword, newPasswordRepeat } = this.state;
    if ( newPassword !== newPasswordRepeat ) {
      this.setState({
        oldPassword: '',
        newPassword: '',
        newPasswordRepeat: ''
      })
      alert('Repeat new password incorrect')
    } else {
      Accounts.changePassword(oldPassword, newPassword, (err,res) => {
        if (err) alert(err);
        toggleEdit();
      })
    }
  }

  render(){
    const { oldPassword, newPassword, newPasswordRepeat } = this.state;
    return <React.Fragment>
      <form onSubmit={this.handleSubmit}>
        <label htmlFor='oldPassword' className="control-label">
          Old password
        </label>
        <input type="password" className="form-control form-control-sm" id='oldPassword' 
          onChange={this.onChange} value={oldPassword} required
          placeholder="Fill in your old password"/>
        
        <label htmlFor='newPassword' className="control-label pt-2">
          New password
        </label>
        <input type="password" className="form-control form-control-sm" id='newPassword' 
          onChange={this.onChange} value={newPassword} required
          pattern=".{8,}" title="Minimum 8 charachters"
          placeholder="Pick a new password" />

        <input type="password" className="form-control form-control-sm" id='newPasswordRepeat' 
          onChange={this.onChange} value={newPasswordRepeat} required
          pattern=".{8,}" title="Minimum 8 charachters"
          placeholder="Repeat your new password" />
        <small id="emailHelp" className="form-text text-muted">
          Minimum <b>8 characters</b>
        </small>

        {
          this.hasInput() ?
          <button className='btn btn-sm btn-success px-2 py-0' type='button' 
            onClick={this.handleSubmit}>
            <span className='icon-floppy' /> Update password
          </button> : null
        }
      </form>
      <hr/>
    </React.Fragment>
  }
}

export const ResetPassword = withEither(isAdmin, ResetPasswordAdmin)(ResetPasswordUser);

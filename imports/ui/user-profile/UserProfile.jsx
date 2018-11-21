import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Roles } from 'meteor/alanning:roles';

import { updateUserInfo } from '/imports/api/users/users.js';

import React from 'react';
import { compose } from 'recompose';
import { Creatable as Select } from 'react-select';
import update from 'immutability-helper';
import { isEqual, pick }from 'lodash';
import { diff } from 'rus-diff';

import logger from '/imports/api/util/logger.js';

import PermissionSelect from '/imports/ui/util/PermissionSelect.jsx';
import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import { ResetPassword } from './ResetPassword.jsx';

import './user-profile.scss';

const UserProfileButtons = ({ editing, toggleEdit, saveChanges, cancelChanges, hasChanges }) => {
  if (editing) {
    return <div className='btn-group' role='group'>
      { hasChanges && 
        <button className='btn btn-sm btn-success px-2 py-0' type='button'
          onClick={saveChanges}>
          <span className='icon-floppy' /> Save changes
        </button>
      }
      <button className='btn btn-sm btn-outline-dark border px-2 py-0' 
        type='button' onClick={cancelChanges}>
        <span className='icon-cancel' /> Cancel
      </button>
    </div>
  } else {
    return <button className='btn btn-sm btn-outline-dark border px-2 py-0' 
      type='button' onClick={toggleEdit}>
      <span className='icon-pencil' /> Edit profile
    </button>
  }
}

const UserRoles = ({ roles, existingRoles, onChange, isAdmin, editing }) => {
  return <div className="form-group col-md-6">
    <label htmlFor="groups" className="control-label">User roles</label>
    <PermissionSelect value={roles} options={existingRoles} onChange={onChange}
      disabled={!isAdmin || !editing} />
  </div>
}

const UserName = ({ username, onChange, editing }) => {
  return <div className="form-group col-md-6">
    <label htmlFor="username" className="control-label">Username</label>
    <input type="text" className="form-control form-control-sm" 
      id="username" onChange={onChange} value={username} disabled={!editing}
      pattern="^[a-zA-Z0-9]+$" title="Only letters and numbers" />
      <small id="emailHelp" className="form-text text-muted">
        Your username will be visible to other users and must be unique. <b>required</b>
      </small>
  </div>
}

const Profile = ({ first_name, last_name, onChange, editing }) => {
  return <div className='form-row'>
    <div className="form-group col-md-6">
      <label htmlFor="firstname" className="control-label">First name</label>
      <input type="text" className="form-control form-control-sm" 
        id="firstname" onChange={onChange} value={first_name}
        placeholder="First name" disabled={!editing} pattern="^[A-Za-z]+$" />
    </div>
    <div className="form-group col-md-6">
      <label htmlFor="lastname" className="control-label">Last name</label>
      <input type="text" className="form-control form-control-sm" 
        id="lastname" onChange={onChange} value={last_name}
        placeholder="Last name" disabled={!editing} pattern="^[A-Za-z]+$" />
    </div>
  </div>
}

const EmailAddress = ({ emails, onChange, editing }) => {
  return emails.map( (email, i) => {
    //start counting at 1
    let index = i + 1;
    return <div className="form-group" key={`email${index}`}>
      <label htmlFor={`email${index}`} className="control-label">
        Email address
      </label>
      <input type="email" className="form-control form-control-sm" id={`email${index}`} 
        onChange={onChange} value={email.address} disabled={true}/>
    </div>
  })
}



const AdminAccountCheck = ({ _id: userId }) => {
  if ( userId !== Meteor.userId()){
    return <div className="alert alert-danger" role="alert">
      This is not your own account!
    </div> 
  } else {
    return null
  }
}

const dataTracker = ({ match }) => {
  const { userId } = match.params;
  const userSub = Meteor.subscribe('users');
  const userProfile = userId ? Meteor.users.findOne({_id: userId}) : Meteor.user();
  const user = pick(userProfile, ['_id','username', 'emails', 'profile', 'roles']);

  const roleSub = Meteor.subscribe('roles');
  const existingRoles = Meteor.roles.find({}).fetch();

  const loading = !roleSub.ready() || !userSub.ready();

  return { user, loading, existingRoles }
}

const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading)
)


class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.props.user;
    Object.assign(this.state, {
      editing: false
    })
  }

  deleteAccount = () => {
    alert('This currently does nothing. Please contact your administrator if you really want to remove your account')
    logger.debug('deleteAccount')
  }

  saveChanges = () => {
    const { _id: userId, roles, profile, emails } = this.state;
    updateUserInfo.call({ userId, roles, profile, emails }, (err, res) => {
      if (err) alert(err)
    })
  }

  cancelChanges = () => {
    this.setState({
      editing: false,
      ...this.props.user
    });
  }
  
  handleChange = ({ target }) => {
    const { id, value, name } = target;

    switch (id){
      case 'username':
        this.setState({username: value})
        break
      case 'email':
        const index = parseInt(name[name.length - 1]);
        const emails = this.state.emails.slice(); //empty slice to copy email array and not modify state
        emails[index] = value;
        this.setState({ emails: emails })
        break
      case 'firstname':
        this.setState({
          profile: update(this.state.profile, {
            first_name: {
              $set: value
            }
          })
        })
        break
      case 'lastname':
        this.setState({
          profile: update(this.state.profile, {
            last_name: {
              $set: value
            }
          })
        })
        break
    }
  }

  updateRoles = newRoles => {
    const roles = newRoles.map( role => role.value);
    
    if (roles.indexOf('registered') < 0){
      roles.push('registered');
    }

    if (roles.indexOf('admin') < 0 && this.isAdmin()){
      roles.push('admin');
    }

    this.setState({ roles })
  }

  isAdmin = () => {
    return Roles.userIsInRole(Meteor.userId(),'admin');
  }

  toggleEdit = () => {
    this.setState({
      editing: !this.state.editing
    })
  }

  hasChanges = () => {
    const fields = ['username','profile','emails','roles'];
    const state = pick(this.state, fields);
    const props = pick(this.props.user, fields);
    return !isEqual(props, state);
  }

  render(){
    const { username, profile, emails, resetPassword,
      editing, roles } = this.state;
    const { existingRoles, user } = this.props;
    const isAdmin = this.isAdmin();
    const hasChanges = this.hasChanges();

    return <div className="user-profile card text-center">
      <div className='card-body'>
        <AdminAccountCheck {...user} />
        <div className='float-center'>
          <img className="mb-4 rounded-circle" src="logo.svg" alt="" width="50" height="50" />
          <h1 className="h3 mb-3 font-weight-normal">User Profile</h1>
        </div>
        <UserProfileButtons toggleEdit={this.toggleEdit} saveChanges={this.saveChanges}
          cancelChanges={this.cancelChanges} {...{ editing, hasChanges }} />
        <form onSubmit={this.saveChanges}>
          <hr />
          <div className='form-row'>
            <UserName {...{ username, editing }} onChange={this.handleChange} />
            <UserRoles {...{ roles, existingRoles, isAdmin, editing }}
              onChange={this.updateRoles} />
          </div>
          <Profile {...{ editing, ...profile }} onChange={this.handleChange} />
          <EmailAddress {...{ emails, editing }} onChange={this.handleChange} />
          <hr />
        </form>
        {
          editing && <ResetPassword toggleEdit={this.toggleEdit} {...user} />
        }
        <button className='btn btn-sm btn-danger px-2 py-0' 
          type='button' onClick={this.deleteAccount}>
          <span className='icon-cancel' /> Delete account
        </button>
      </div>
    </div>
  }
}

export default withConditionalRendering(UserProfile);
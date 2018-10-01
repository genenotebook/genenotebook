import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Roles } from 'meteor/alanning:roles';

import { updateUserInfo } from '/imports/api/users/users.js';

import React from 'react';
import { compose } from 'recompose';
import { Creatable as Select } from 'react-select';
import update from 'immutability-helper';
//import pick from 'lodash/pick';
import { isEqual, pick }from 'lodash';
import { diff } from 'rus-diff';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import './user-profile.scss';


const UserProfileButtons = ({ oldState, newState, resetPassword, deleteAccount, 
  saveChanges, cancelChanges}) => {
  const buttons = isEqual(oldState, newState) ?
  (
    <div className="btn-group" role='group'>
      <button type="button" className="btn btn-sm btn-outline-dark border" onClick={resetPassword}>
        Reset password
      </button>
      <button type="button" className="btn btn-sm btn-danger" onClick={deleteAccount}>
        <span className='icon-cancel'/> Delete account
      </button>
    </div>
  ) :
  (
    <div className='btn-group' role='group'>
      <button type="button" className="btn btn-success" onClick={saveChanges}>
        Save changes
      </button>
      <button type="button" className="btn btn-danger" onClick={cancelChanges}>
        Cancel
      </button>
    </div>
  )
  return buttons
}

const UserRoles = ({ roles, existingRoles, onChange, isAdmin, editing }) => {
  console.log(isAdmin)
  return <div className="form-group col-md-6">
    <label htmlFor="groups" className="control-label">User roles</label>
    <Select className='custom-select-sm py-0' name='user-role-select'
      value={roles.map(role => { return { value: role, label: role } })}
      options={existingRoles.map(role => { return { value: role.name, label: role.name } })}
      onChange={onChange} isMulti isDisabled={!isAdmin} />
  </div>
}

const UserName = ({ username, onChange, editing }) => {
  return <div className="form-group col-md-6">
    <label htmlFor="username" className="control-label">Username</label>
    <input 
      type="text" 
      className="form-control form-control-sm" 
      id="username"
      onChange={onChange} 
      value={username} />
      <small id="emailHelp" className="form-text text-muted">
        Your username will be visible to other users and must be unique. <b>required</b>
      </small>
  </div>
}

const Profile = ({ first_name, last_name, onChange, editing }) => {
  return <div className='form-row'>
    <div className="form-group col-md-6">
      <label htmlFor="firstname" className="control-label">First name</label>
      <input 
        type="text" 
        className="form-control form-control-sm" 
        id="firstname" 
        onChange={onChange}
        value={first_name}
        placeholder="First name" />
    </div>
    <div className="form-group col-md-6">
      <label htmlFor="lastname" className="control-label">Last name</label>
      <input 
        type="text" 
        className="form-control form-control-sm" 
        id="lastname" 
        onChange={onChange}
        value={last_name}
        placeholder="Last name" />
    </div>
  </div>
}

const EmailAddress = ({ emails, onChange, editing }) => {
  return emails.map( (email, i) => {
    //start counting at 1
    let index = i + 1;
    return <div className="form-group" key={`email${index}`}>
      <label htmlFor={`email${index}`} className="control-label">
        {`Email address ${index}`}
      </label>
      <input type="email" className="form-control form-control-sm" id={`email${index}`} 
        onChange={onChange} value={email.address} />
    </div>
  })
}

const ResetPassword = () => {
  return <React.Fragment>
    RESET password
    <hr />
  </React.Fragment>
}

const dataTracker = () => {
  const userId = FlowRouter.getParam('_id');

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
      resetPassword: false,
      editing: false
    })
  }

  static getDerivedStateFromProps = ({ user }, state) => {
    return null
    //return isEqual(user, state) ? null : user;
  }
  /*componentWillReceiveProps(nextProps){
    this.setState(nextProps.user)
  }*/

  resetPassword = (event) => {
    event.preventDefault();
    this.setState({
      resetPassword: !this.state.resetPassword
    })
    //alert('This currently does nothing')
    console.log('resetPassword');
  }

  deleteAccount = (event) => {
    event.preventDefault();
    alert('This currently does nothing')
    console.log('deleteAccount')
  }

  saveChanges = (event) => {
    event.preventDefault();
    const { _id: userId, roles, profile, emails } = this.state;
    updateUserInfo.call({ userId, roles, profile, emails }, (err, res) => {
      if (err) alert(err)
    })
  }

  cancelChanges = (event) => {
    event.preventDefault();
    this.setState(this.props.user);
  }
  
  handleChange = (event) => {
    const key = event.target.id;
    const value = event.target.value;
    const name = event.target.name;

    switch (key){
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

  render(){
    const { username, profile, emails, resetPassword,
      editing, roles } = this.state;
    const { existingRoles } = this.props;
    const isAdmin = this.isAdmin();

    return <div className="user-profile card">
      <img className="mb-4 rounded-circle" src="logo.svg" alt="" width="50" height="50" />
      <h1 className="h3 mb-3 font-weight-normal">User Profile</h1>
      <button className='btn btn-sm btn-outline-dark border px-2 py-0 float-right' 
        type='button' onClick={this.toggleEdit}>
        <span className='icon-pencil' /> Edit profile
      </button>
      <form className="card-body" onSubmit={null}>
        <hr />
        <div className='form-row'>
          <UserName {...{ username, editing }} onChange={this.handleChange} />
          <UserRoles {...{ roles, existingRoles, isAdmin, editing }}
            onChange={this.updateRoles} />
        </div>
        <Profile {...{ editing, ...profile } } onChange={this.handleChange} />
        <EmailAddress emails={emails} onChange={this.handleChange} />
        <hr />
        {
          resetPassword && <ResetPassword />
        }
        <UserProfileButtons 
          oldState = {this.props.user}
          newState = {this.state}
          cancelChanges = {this.cancelChanges}
          saveChanges = {this.saveChanges}
          resetPassword = {this.resetPassword}
          deleteAccount = {this.deleteAccount}/>
      </form>
    </div>
  }
}

export default withConditionalRendering(UserProfile);
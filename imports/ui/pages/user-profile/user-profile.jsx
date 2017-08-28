import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    //this.resetPassword = this.resetPassword.bind(this);
    //this.deleteAccount = this.deleteAccount.bind(this);
  }
  resetPassword = (event) => {
    event.preventDefault();
    console.log('resetPassword');
  }
  deleteAccount = (event) => {
    event.preventDefault();
    console.log('deleteAccount')
  }
  render(){
    const user = this.props.user;

    if (user === undefined){
      return <div className="user-profile">Loading</div>
    }
    return (
    <div className="user-profile">
      <h3> User profile </h3>
      <form className="form-horizontal user-profile well well-sm">
        <div className="form-group">
          <label htmlFor="username" className="col-sm-4 control-label">Username</label>
          <div className="col-sm-4">
            <input type="text" className="form-control" id="username" placeholder={user.username}/>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="firstname" className="col-sm-4 control-label">First name</label>
          <div className="col-sm-4">
            <input type="text" className="form-control" id="firstname" placeholder={user.profile.first_name}/>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="lastname" className="col-sm-4 control-label">Last name</label>
          <div className="col-sm-4">
            <input type="text" className="form-control" id="lastname" placeholder={user.profile.last_name}/>
          </div>
        </div>
        {
          user.emails.map( (email, i) => {
            //start counting at 1
            let index = i + 1;
            return (
              <div className="form-group" key={`email${index}`}>
                <label htmlFor={`email${index}`} className="col-sm-4 control-label">{`Email address ${index}`}</label>
                <div className="col-sm-4">
                  <input type="text" className="form-control" id={`email${index}`} placeholder={email.address}/>
                </div>
              </div>
            )
          })
        }
        <div className="form-group">
          <label htmlFor="groups" className="col-sm-4 control-label">User groups</label>
          <div className="col-sm-4">
            <textarea disabled type="text" className="form-control" id="groups" value={user.roles.join(', ')}/>
          </div>
        </div>
        <hr/>
        <div className="account-buttons">
          <button type="button" className="btn btn-warning" onClick={this.resetPassword}>
            Reset password
          </button>
          <button type="button" className="btn btn-danger" onClick={this.deleteAccount}>
            Delete account
          </button>
        </div>
      </form>
    </div>
    )
  }
}

export default UserProfileContainer = createContainer(() => {
  const userId = FlowRouter.getParam('_id');
  console.log(userId)
   return {
    user: Meteor.user()
   }
},UserProfile)
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';

class UserProfile extends React.Component {
  constructor(props) {
    super(props);
  };
  render(){
    const user = this.props.user;

    console.log(user)

    if (user === undefined){
      return <div className="user-profile">Loading</div>
    }
    return (
      <div className="user-profile">
        <h4>User profile</h4>
        <ul>
          <li>Username: {user.username}</li>
          <li>First name: {user.profile.first_name}</li>
          <li>Last name: {user.profile.last_name}</li>
          <li>Emails:
            <ul>
              {user.emails.map( email => {
                return <li key={email.address}>{email.address} ({email.verified ? 'verified' : 'unverified'})</li>
              })}
            </ul> 
          </li>
          <li>Groups: {user.roles}</li>
        </ul>
      </div>
    )
  }
}

export default UserProfileContainer = createContainer(() => {
 return {
  user: Meteor.user()
 }
},UserProfile)
import { createContainer } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React from 'react';

class AdminUsers extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      <div>
        <ul>
        {
          this.props.users.map(user => {
            return <li key={user.username}>{user.username}</li>
          })
        }
        </ul>
      </div>
    )
  }
}

export default createContainer(()=>{
  Meteor.subscribe('users')
  return {
    users: Meteor.users.find({}).fetch()
  }
},AdminUsers)
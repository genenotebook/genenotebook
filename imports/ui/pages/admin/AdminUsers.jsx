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
        <hr/>
        <ul className='list-group'>
        {
          this.props.users.map(user => {
            console.log(user)
            return (
              <li className='list-group-item' key={user.username}>
                <p>
                  <a href={`/admin/user/${user._id}`}> {user.username} </a>
                  <small>{`${user.profile.first_name} ${user.profile.last_name}`}</small>
                </p>
              </li>
            )
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
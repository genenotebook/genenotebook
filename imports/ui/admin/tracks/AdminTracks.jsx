import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

import { Tracks } from '/imports/api/genomes/track_collection.js';

import AdminTrackInfo from './AdminTrackInfo.jsx';

class AdminTracks extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    const { tracks, ...props } = this.props;
    return (
      props.loading ? 
      <div> Loading </div> :
      <div>
        <hr/>
        <ul className='list-group'>
        {
          tracks.map(track => {
            return <AdminTrackInfo key={track.trackName} track={track} {...props}/>
          })
        }
        </ul>
      </div>
    )
  }
}

export default withTracker(props => {
  const trackSubscription = Meteor.subscribe('tracks')
  const userSubscription = Meteor.subscribe('users');
  const allRoles = Meteor.users.find({}).fetch().reduce((roles, user) => {
    return roles.concat(user.roles)
  },[])
  const uniqueRoles = [...new Set(allRoles)]
  return {
    tracks: Tracks.find({}).fetch(),
    loading: !trackSubscription.ready() || !userSubscription.ready(),
    allRoles: uniqueRoles
  }
})(AdminTracks)
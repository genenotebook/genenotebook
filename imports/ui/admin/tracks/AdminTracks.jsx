import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { Tracks } from '/imports/api/genomes/track_collection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';
import AdminTrackInfo from './AdminTrackInfo.jsx';

const adminTracksDataTracker = () => {
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
};

const withConditionalRendering = compose(
  withTracker(adminTracksDataTracker),
  withEither(isLoading, Loading)
)

class AdminTracks extends React.Component {
  constructor(props){
    super(props)
  }

  render(){
    const { tracks, ...props } = this.props;
    return (
      <div className='mt-2'>
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              {
                ['Track name','Reference','Permissions','Actions'].map(label => {
                  return <th key={label} id={label}>
                    <button className='btn btn-sm btn-outline-dark px-2 py-0' disabled>
                      {label}
                    </button>
                  </th>
                })
              }
            </tr>
          </thead>
          <tbody>
            {
              tracks.map(track => {
                return <AdminTrackInfo key={track._id} {...track} />
              })
            }
          </tbody>
        </table>
      </div>
    )
  }
}

export default withConditionalRendering(AdminTracks)
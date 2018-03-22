import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

const TrackSelect = ({...props}) => {
  return ( 
    <div className='btn-group'>
      <button type='button' className='btn btn-sm btn-outline-dark dropdown-toggle' >
        Tracks
      </button>
    </div>
  )
}

export default TrackSelect;
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';

const ReferenceSelect = ({...props}) => {
  return ( 
    <div className='btn-group'>
      <button type='button' className='btn btn-sm btn-outline-dark dropdown-toggle' >
        References
      </button>
    </div>
  )
}

export default ReferenceSelect
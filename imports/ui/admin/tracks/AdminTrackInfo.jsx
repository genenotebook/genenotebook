import React from 'react';

import TrackPermissionSelect from './TrackPermissionSelect.jsx';
import BlastDatabaseButtons from './BlastDatabaseButtons.jsx';

export default AdminTrackInfo = ({ track, allRoles }) => {
  return (
    <li className='list-group-item'>
      <a href={`/admin/track/${track.trackName}`}> {track.trackName} </a>
      <small>{`Reference: ${track.reference}`}</small>
      <BlastDatabaseButtons track={track} />
      
      <TrackPermissionSelect
        name='track-permissions-select'
        trackName={track.trackName}
        value={track.permissions}
        options={allRoles.map(role => { return {value: role, label: role} })}
        multi={true}
      />
    </li>
  )
}

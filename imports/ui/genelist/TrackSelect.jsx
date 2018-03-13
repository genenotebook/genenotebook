import React from 'react';

const TrackSelect = ({ tracks, updateTrackFilter }) => {
  return (
    <div className='track-select'>
      <label>Tracks</label>
      {
        tracks.map(track => {
          return (
            <div key={track._id} className="form-check">
              <label className="form-check-label" htmlFor={track.trackName}>
                <input 
                  type="checkbox" 
                  className="track-checkbox" 
                  id={track.trackName} 
                  onClick={updateTrackFilter}/>
                &nbsp;{track.trackName}
              </label>
            </div>
          )
        })
      }
    </div>
  )
}

export default TrackSelect;
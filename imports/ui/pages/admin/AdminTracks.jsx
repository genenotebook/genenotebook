import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';

import { Tracks } from '/imports/api/genomes/track_collection.js';

class AdminTracks extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      this.props.loading ? 
      <div> Loading </div> :
      <div>
        <hr/>
        <ul className='list-group'>
        {
          this.props.tracks.map(track => {
            return (
              <li className='list-group-item' key={track._id}>
                <p>{/*ADD BLAST DB CREATION BUTTONS*/}
                  <a href={`/admin/track/${track.trackName}`}> {track.trackName} </a>
                  <small>{`Reference: ${track.reference}`}</small>
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
  const subscription = Meteor.subscribe('tracks')
  return {
    tracks: Tracks.find({}).fetch(),
    loading: !subscription.ready()
  }
},AdminTracks)
import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';

import { Tracks } from '/imports/api/genomes/track_collection.js';

import { makeBlastDb } from '/imports/api/blast/makeblastdb.js';
import { hasBlastDb } from '/imports/api/blast/hasblastdb.js';
import { removeBlastDb } from '/imports/api/blast/removeblastdb.js';


const MakeDbButton = (props) => {
  return (
    <button 
      type = 'button' 
      className = 'btn btn-sm btn-default makeblastdb pull-right'
      name = {props.trackName}
      onClick = {props.makeBlastDb}>
      <span className = 'glyphicon glyphicon-hdd' aria-hidden = 'true' />
      &nbsp;Make blast DBs
    </button>
  )
}

const ReMakeDbButton = (props) => {
  return (
    <div className='pull-right'>
      <button 
        type = 'button' 
        className = 'btn btn-sm btn-warning makeblastdb'
        name = {props.trackName}
        onClick = {props.makeBlastDb}>
        <span className = 'glyphicon glyphicon-refresh' aria-hidden = 'true' />
        &nbsp;Remake blast DBs
      </button>
      <button 
        type = 'button' 
        className = 'btn btn-sm btn-danger makeblastdb'
        name = {props.trackName}
        onClick = {props.removeBlastDb}>
        <span className = 'glyphicon glyphicon-remove' aria-hidden = 'true' />
        &nbsp;Delete blast DBs
      </button>
    </div>
  )
}

class AdminTracks extends React.Component {
  constructor(props){
    super(props)
  }

  makeBlastDb = (event) => {
    event.preventDefault();
    const trackName = event.target.name;
    const dbTypes = ['nucl','prot']
    dbTypes.map(dbType => {
      makeBlastDb.call({trackName, dbType}, (err,res) => {
        console.log(err)
        console.log(res)
      })
    })
  }

  removeBlastDb = (event) => {
    event.preventDefault();
    const trackName = event.target.name;
    console.log(`Remove ${trackName}`)
    removeBlastDb.call({trackName})
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
            console.log(track)
            const trackName = track.trackName;
            return (
              <li className='list-group-item' key={trackName}>
                <a href={`/admin/track/${trackName}`}> {trackName} </a>
                <small>{`Reference: ${track.reference}`}</small>
                {
                  track.hasOwnProperty('blastdbs') ?
                  <ReMakeDbButton 
                    trackName = {trackName} 
                    makeBlastDb = {this.makeBlastDb}
                    removeBlastDb = {this.removeBlastDb} 
                  /> :
                  <MakeDbButton 
                    trackName = {trackName} 
                    makeBlastDb = {this.makeBlastDb} 
                  />
                }
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
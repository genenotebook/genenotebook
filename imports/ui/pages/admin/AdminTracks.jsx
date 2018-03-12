import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { Creatable as Select } from 'react-select';

import { Tracks } from '/imports/api/genomes/track_collection.js';

import { makeBlastDb } from '/imports/api/blast/makeblastdb.js';
import { hasBlastDb } from '/imports/api/blast/hasblastdb.js';
import { removeBlastDb } from '/imports/api/blast/removeblastdb.js';

import { updateTrackPermissions } from '/imports/api/genomes/updateTrackPermissions.js';


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

class TrackPermissionSelect extends React.Component {
  constructor(props){
    super(props)
  }

  selectPermissions = permissions => {
    updateTrackPermissions.call({
      trackName: this.props.trackName,
      permissions: permissions.map(permission => permission.value)
    }, (err,res) => {
      if (err){
        console.log(err)
      }
    })
  }

  render(){
    return (
      <Select
        name={this.props.name}
        value={this.props.value}
        options={this.props.options}
        onChange={this.selectPermissions}
        multi={true}
      />
    )
  }
}

class AdminTracks extends React.Component {
  constructor(props){
    super(props)
  }

  makeBlastDb = event => {
    event.preventDefault();
    const trackName = event.target.name;
    const dbTypes = ['nucl','prot']
    dbTypes.map(dbType => {
      makeBlastDb.call({trackName, dbType}, (err,res) => {
        if (err){
          console.log(err)
        }
      })
    })
  }

  removeBlastDb = event => {
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
                <TrackPermissionSelect
                  name='track-permissions-select'
                  trackName={track.trackName}
                  value={track.permissions}
                  options={this.props.allRoles.map(role => { return {value: role, label: role} })}
                  onChange={this.selectPermissions}
                  multi={true}
                />
              </li>
            )
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
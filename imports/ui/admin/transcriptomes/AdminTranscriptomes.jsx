import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { groupBy } from 'lodash';
import update from 'immutability-helper';

import { isEqual, omit } from 'lodash';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

import { updateSampleInfo } from '/imports/api/transcriptomes/updateSampleInfo.js';

import TrackExperiments from './TrackExperiments.jsx';

import './AdminTranscriptomes.scss';

class AdminTranscriptomes extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      expanded: []
    }
  }

  toggleExpand = event => {
    event.preventDefault();
    const trackName = event.target.id;
    const index = this.state.expanded.indexOf(trackName)
    const operation = index < 0 ? { $push: [trackName] } : { $splice : [[index]] };
    const newState = update(this.state, { expanded: operation })
   
    this.setState(newState);
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
            const trackSamples = this.props.experiments.filter(experiment => {
              return experiment.track === track.trackName;
            })
            const expanded = this.state.expanded.indexOf(track.trackName) >= 0;
            return (
              <li key={track.trackName} className='list-group-item experiment-track'>
                <input 
                  type='submit' 
                  className='fa btn btn-sm btn-outline-dark' 
                  value={ expanded ? '\uf068' : '\uf067' } 
                  id={track.trackName}
                  onClick={this.toggleExpand} />
                <small className='text-muted'>&nbsp;Annotation track: </small>
                {track.trackName}  
                <span className='badge badge-dark pull-right'>{trackSamples.length} samples</span>
                {
                  expanded && <TrackExperiments samples={trackSamples} roles={this.props.allRoles}/>
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

export default withTracker(props => {
  const expInfoSub = Meteor.subscribe('experimentInfo');
  const trackSub = Meteor.subscribe('tracks');
  const userSub = Meteor.subscribe('users');
  const allRoles = Meteor.users.find({}).fetch().reduce((roles, user) => {
    return roles.concat(user.roles)
  },[])
  const uniqueRoles = [...new Set(allRoles)]
  return {
    experiments: ExperimentInfo.find({}).fetch(),
    tracks: Tracks.find({}).fetch(),
    loading: !expInfoSub.ready() || !trackSub.ready() || !userSub.ready(),
    allRoles: uniqueRoles
  }
})(AdminTranscriptomes)
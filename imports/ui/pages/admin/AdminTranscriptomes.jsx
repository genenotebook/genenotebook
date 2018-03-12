import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import groupBy from 'lodash/groupby';
import update from 'immutability-helper';
import { Creatable as Select } from 'react-select';
import { isEqual, omit } from 'lodash';

import { ExperimentInfo } from '/imports/api/transcriptomes/transcriptome_collection.js';
import { Tracks } from '/imports/api/genomes/track_collection.js';

import { updateSampleInfo } from '/imports/api/transcriptomes/updateSampleInfo.js';

import './AdminTranscriptomes.scss';

class EditSample extends React.Component {
  constructor(props){
    super(props)
    this.state = this.props.sample
  }

  handleChange = event => {
    const key = event.target.name;
    const value = event.target.value;
    console.log(key,value)
    this.setState({
      [key]: value
    })
  }

  saveChange = event => {
    console.log('saveChange')
    if (isEqual(this.state, this.props.sample)){
      this.props.toggleEdit(event)
    } else {
      const props = omit(this.state, ['track'])
      updateSampleInfo.call(props,(err,res) =>{
        if (err) console.log(err)
        this.props.toggleEdit(event);
      })
    }
  }

  cancelChange = event => {
    this.props.toggleEdit(event)
  }

  render(){
    const allReplicaGroups = new Set(this.props.allSamples.map(sample => sample.replicaGroup))
    const replicaGroupOptions = Array.from(allReplicaGroups).map(group => ({ value: group, label: group }) )
    replicaGroupOptions.push({
      value: this.state.replicaGroup,
      label: this.state.replicaGroup
    })

    const allExperimentGroups = new Set(this.props.allSamples.map(sample => sample.experimentGroup))
    const experimentGroupOptions = Array.from(allExperimentGroups).map(group => ({ value: group, label: group }) )
    experimentGroupOptions.push({
      value: this.state.experimentGroup,
      label: this.state.experimentGroup
    })

    return (
      <div>
        <input 
          type='button' 
          className='fa btn btn-xs btn-success pull-right save-change' 
          value={'\uf00c'}
          onClick={this.saveChange} />
        <input 
          type='button' 
          className='fa btn btn-xs btn-danger pull-right save-change' 
          value={'\uf00d'}
          onClick={this.cancelChange} />

        <div className='form-group'>
          <label htmlFor='sampleName'>Sample name</label>
          <input 
            name='sampleName' 
            onChange={this.handleChange}
            className='form-control'
            value={this.state.sampleName} />
        </div>
        <div className='form-group'>
          <label htmlFor='experimentGroup'>Experiment group</label>
          <Select
            name='experimentGroup'
            value={this.state.experimentGroup}
            options={experimentGroupOptions}
            onChange={val => {this.handleChange({target:{name:'experimentGroup',value:val.value}})}} />
        </div>
        <div className='form-group'>
          <label htmlFor='replicaGroup'>Replica group</label>
          <Select
            name='replicaGroup'
            value={this.state.replicaGroup}
            options={replicaGroupOptions}
            onChange={val => {this.handleChange({target:{name:'replicaGroup',value:val.value}})}} />
        </div>
        <div className='form-group'>
          <label htmlFor='permissions'>Permissions</label>
          <Select
            name='permissions'
            value={this.state.permissions}
            options={this.props.roles.map(role => { return { label: role, value: role } }) }
            onChange={val => {this.handleChange({target:{name:'permissions',value:val.map(v => v.value)}})}} 
            multi={true} />
        </div>
        <div className='form-group'>
          <label htmlFor='description'>Description</label>
          <textarea 
            name='description' 
            onChange={this.handleChange}
            className='form-control'
            rows='2' 
            value={this.state.description} />
        </div>
      </div>
    )
  }
}

const DisplaySample = ({ sampleName, description, toggleEdit}) => {
  return (
    <div>
      <input 
        type='submit' 
        className='fa btn btn-xs btn-default pull-right' 
        value={'\uf013'}
        onClick={toggleEdit} />
      <p>
        {sampleName}<br/>
        {description}
      </p>
    </div>
  )
}

class SampleInfo extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      editing: false
    }
  }

  toggleEdit = event => {
    event.preventDefault()
    this.setState({
      editing: !this.state.editing
    })
  }

  render(){
    return (
      <li className='list-group-item'>
       {
        this.state.editing ?
        <EditSample toggleEdit={this.toggleEdit} {...this.props} /> :
        <DisplaySample 
          sampleName={this.props.sample.sampleName} 
          description={this.props.sample.description} 
          toggleEdit={this.toggleEdit} 
          roles={this.props.roles}/>
      }
      </li>
    )
  }
}


class ExperimentGroup extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      expanded: []
    }
  }  

  toggleExpand = event => {
    const groupName = event.target.id;
    const index = this.state.expanded.indexOf(groupName)
    const operation = index < 0 ? { $push: [groupName] } : { $splice : [[index]] };
    const newState = update(this.state, { expanded: operation })
   
    this.setState(newState);
  }

  render(){
    const replicaGroups = groupBy(this.props.samples, 'replicaGroup');

    return (
      <ul className='list-group'>
        {
          Object.entries(replicaGroups).map(entry => {
            const [groupName, groupSamples] = entry;
            const expanded = this.state.expanded.indexOf(groupName) >= 0;
            return (
              <li key={groupName} className='list-group-item'>
                <input 
                  type='submit' 
                  className='fa btn btn-xs btn-default' 
                  value={ expanded ? '\uf068' : '\uf067' }
                  id={groupName}
                  onClick={this.toggleExpand} />
                Sample group: <small>{groupName}</small> <span className='badge'>{groupSamples.length}</span>
                
                {
                  expanded && 
                  <ul className='list-group'>
                    {
                      groupSamples.map(sample => {
                        return <SampleInfo 
                          key={sample._id} 
                          sample={sample} 
                          allSamples={this.props.allSamples}
                          roles={this.props.roles}
                        />
                      })
                    }
                  </ul>
                }
              </li>
            )
          })
        }
      </ul>
    )
  }
}

class TrackExperiments extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      expanded: []
    }
  }

  toggleExpand = event => {
    const groupName = event.target.id;
    const index = this.state.expanded.indexOf(groupName)
    const operation = index < 0 ? { $push: [groupName] } : { $splice : [[index]] };
    const newState = update(this.state, { expanded: operation })
   
    this.setState(newState);
  }

  render(){
    const experimentGroups = groupBy(this.props.samples, 'experimentGroup');

    return (
      <ul className='list-group'>
        {
          Object.entries(experimentGroups).map(entry => {
            const [groupName, groupSamples] = entry;
            const expanded = this.state.expanded.indexOf(groupName) >= 0;
            return (
              <li key={groupName} className='list-group-item'>
                <input 
                  type='submit' 
                  className='fa btn btn-xs btn-default' 
                  value={ expanded ? '\uf068' : '\uf067' }
                  id={groupName}
                  onClick={this.toggleExpand} />
                Experiment group: <small>{groupName}</small> <span className='badge'>{groupSamples.length}</span>
                {
                  expanded && 
                  <ExperimentGroup 
                    samples={groupSamples} 
                    allSamples={this.props.samples}
                    roles={this.props.roles}
                    />
                }
              </li>
            )
          })
        }
      </ul>
    )
  }
}

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
              <li key={track.trackName} className='list-group-item'>
                <input 
                  type='submit' 
                  className='fa btn btn-xs btn-default' 
                  value={ expanded ? '\uf068' : '\uf067' } 
                  id={track.trackName}
                  onClick={this.toggleExpand} />
                Track: <small>{track.trackName}</small><span className='badge'>{trackSamples.length}</span>
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
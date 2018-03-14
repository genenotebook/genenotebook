import React from 'react';

import { Creatable as Select } from 'react-select';

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

export default class SampleInfo extends React.Component {
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
      <li className='list-group-item sample-info'>
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



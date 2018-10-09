import React from 'react';
import { groupBy } from 'lodash';

import { updateReplicaGroup } from '/imports/api/transcriptomes/updateReplicaGroup.js';
import { updateSampleInfo } from '/imports/api/transcriptomes/updateSampleInfo.js';
class Experiment extends React.Component {
  constructor(props){
    super(props);
    const { sampleName, replicaGroup, description, permissions } = props;
    this.state = {
      edit: false,
      sampleName,
      replicaGroup,
      description,
      permissions
    };
  }
  toggleEdit = () => {
    this.setState({
      edit: !this.state.edit
    })
  }
  updateField = event => {
    const { target } = event;
    const { id, value } = target;
    this.setState({
      [id]: value
    })
  }
  submit = event => {
    event.preventDefault();
    const { _id } = this.props;
    const { sampleName, replicaGroup, description, permissions } = this.state;
    updateSampleInfo.call({
      _id, sampleName, replicaGroup, description, permissions
    }, (err,res) => {
      if (err) alert(err);
    })
    this.setState({
      edit: false
    })
  }
  render(){
    const { sampleName, replicaGroup, description, permissions, edit } = this.state;
    const { allReplicaGroups } = this.props;
    return <React.Fragment>
      <div className='btn-group' role='group'>
        <button className='btn btn-sm border px-0 py-0' id='edit' onClick={this.toggleEdit} >
          <span className={edit ? 'icon-cancel' : 'icon-pencil'} id='edit' onClick={this.toggleEdit} />
        </button>
        {
          edit &&
          <button className='btn btn-sm btn-success px-0 py-0' id='save' onClick={this.submit} >
            <span className='icon-floppy' id='save' onClick={this.submit} />
          </button>
        }
      </div>
      <form onSubmit={this.submit}>
        <div className='form-row'>
          <div className='form-group col-md-4'>
            <label htmlFor='sample-name'>Sample name</label>
            <input type='text' className='form-control form-control-sm' id='sampleName' 
              title={sampleName} value={sampleName} onChange={this.updateField} 
              disabled={!edit}/>
          </div>
          <div className='form-group col-md-4'>
            <label htmlFor='description'>description</label>
            <input type='text' id='description' value={description} title={description}
              className='form-control form-control-sm' onChange={this.updateField} 
              disabled={!edit}/>
          </div>
          <div className='form-group col-md-4'>
            <label htmlFor='allReplicaGroups' role='group'>Replica group</label>
            <select className='form-control form-control-sm' disabled={!edit} 
              value={replicaGroup} id='replicaGroup' onChange={this.updateField}>
              {
                allReplicaGroups.map(replicaGroupOption => {
                  return <option key={replicaGroupOption} value={replicaGroupOption}>
                    { replicaGroupOption }
                  </option>
                })
              }
            </select>
          </div>
        </div>
      </form>
    </React.Fragment>
  }
}

const Experiments = ({ groupExperiments, allReplicaGroups }) => {
  return <ul className='list-group mt-1'>
    {
      groupExperiments.map(experiment => {
        return <li key={experiment._id} className='list-group-item'>
          <Experiment {...{ allReplicaGroups, ...experiment }} />
        </li>
      })
    }
  </ul>
}

class ReplicaGroup extends React.Component {
  constructor(props){
    super(props);
    const { replicaGroup } = props;
    this.state = {
      expand: false,
      edit: false,
      replicaGroup
    }
  }

  toggle = ({ target }) => {
    const { id } = target;
    this.setState({
      [id]: !this.state[id]
    })
  }

  updateReplicaGroup = event => {
    const replicaGroup = event.target.value;
    this.setState({ replicaGroup });
  }

  submit = event => {
    event.preventDefault();
    const oldName = this.props.replicaGroup;
    const newName = this.state.replicaGroup;
    if (oldName !== newName){
      updateReplicaGroup.call({ oldName, newName }, (err,res) => {
        if (err) alert(err);
      })
    }
  }

  render(){
    const { replicaGroup, expand, edit } = this.state;
    const { groupExperiments, allReplicaGroups } = this.props;
    return <React.Fragment>
      <div className='d-flex justify-content-between'>
        <div>
          <div className='btn-group' role='group'>
            <button className='btn btn-sm border px-0 py-0' id='expand' onClick={this.toggle} >
              <span className={ expand ? 'icon-minus' : 'icon-plus' } id='expand' onClick={this.toggle} />
            </button>
            <button className='btn btn-sm border px-0 py-0' id='edit' onClick={this.toggle} >
              <span className={edit ? 'icon-cancel' : 'icon-pencil'} id='edit' onClick={this.toggle} />
            </button>
            {
              edit &&
              <button className='btn btn-sm btn-success px-0 py-0' id='save' onClick={this.submit} >
                <span className='icon-floppy' id='save' onClick={this.submit} />
              </button>
            }
          </div>

          <form className='form-inline d-inline-flex ml-2' onSubmit={this.submit}>
            <div className='form-group'>
              <label htmlFor='replica-group'>Replica group</label>
              <input type='text' className='form-control form-control-sm ml-2' 
                id='replica-group' value={replicaGroup} size='40' title={replicaGroup}
                onChange={this.updateReplicaGroup} disabled={!edit} />
            </div>
          </form>
        </div>
        <div>
          <button className='btn btn-sm btn-outline-dark px-2 py-0' disabled>
            <span className='badge badge-primary'>
              { groupExperiments.length }
            </span> Transcriptomes
          </button>
        </div>
      </div>
      {
        expand && <Experiments {...{ groupExperiments, allReplicaGroups }} />
      }
    </React.Fragment>
  }
}

const ExpandedGenomeExperiment = ({ genome, experiments, allReplicaGroups }) => {
  const replicaGroups = groupBy(experiments, exp => exp.replicaGroup);
  return <ul className='list-group mt-1'>
    {
      Object.entries(replicaGroups).map(([ replicaGroup, groupExperiments ]) => {
        return <li className='list-group-item' key={replicaGroup}>
          <ReplicaGroup {...{ replicaGroup, groupExperiments, allReplicaGroups }} />
        </li>
      })
    }
  </ul>
}

export default class GenomeExperiment extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      expanded: false
    }
  }
  toggleExpand = event => {
    this.setState({
      expanded: !this.state.expanded
    })
  }
  render(){
    const { expanded } = this.state;
    const { genome, experiments } = this.props;
    const allReplicaGroups = [...new Set(experiments.map(exp => exp.replicaGroup))];
    const btnClass = expanded ? 'icon-minus' : 'icon-plus';
    return <React.Fragment>
      <div className='d-flex justify-content-between'>
        <div>
          <button className='btn btn-outline-dark btn-sm border px-0 py-0 mr-2' onClick={this.toggleExpand} >
            <span className={btnClass} />
          </button>
          { genome.name } <small className='text-muted'>{ genome.organism }</small>
        </div>
        <div className='btn-group'>
          <button className='btn btn-sm btn-outline-dark px-2 py-0' disabled>
            <span className='badge badge-warning'>
              { allReplicaGroups.length }
            </span> Replica groups
          </button>
          <button className='btn btn-sm btn-outline-dark px-2 py-0' disabled>
            <span className='badge badge-primary'>
              { experiments.length }
            </span> Transcriptomes
          </button>
        </div>
      </div>
      {
        expanded && <ExpandedGenomeExperiment {...{ allReplicaGroups, ...this.props }}/>
      }
    </React.Fragment>
  }
}

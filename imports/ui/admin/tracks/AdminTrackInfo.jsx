import React from 'react';
import { isEqual } from 'lodash';

import { removeAnnotationTrack } from '/imports/api/genomes/removeAnnotationTrack.js';

import PermissionSelect from '/imports/ui/util/PermissionSelect.jsx';

import TrackPermissionSelect from './TrackPermissionSelect.jsx';
import { BlastDB } from './BlastDB.jsx';

class EditTrackInfo extends React.Component {
  constructor(props){
    super(props)
    this.state = props
  }

  updateField = event => {

  }

  updatePermission = newPermissions => {
 
  }

  saveChanges = () => {

  }

  render(){
    const { toggleEdit } = this.props;
    const hasChanges = !isEqual(this.props, this.state);
    return <tr>
      <td></td>
      <td></td>
      <td></td>
      <td>
        <div className='btn-group'>
          <button
            type='button' 
            className='btn btn-outline-success btn-sm px-2 py-0'
            onClick={this.saveChanges}
            disabled={!hasChanges} >
            Save
          </button>
          <button 
            type='button' 
            className='btn btn-outline-dark btn-sm px-2 py-0'
            onClick={toggleEdit}
          >Cancel</button>
        </div>
      </td>
    </tr>
  }
}

class TrackInfoLine extends React.Component {
  removeAnnotationTrack = event => {
    const trackId = event.target.name;
    removeAnnotationTrack.call({ trackId });
  }
  render(){
    const { _id, name, reference, permissions, toggleEdit, blastdbs } = this.props;
    return <tr>
      <td>{name}</td>
      <td>{reference}</td>
      <td>
        <BlastDB trackId={_id} blastdbs={blastdbs} isEditing={false} />
        {/*
          typeof blastdbs === 'undefined' ?
          <span className="badge badge-secondary"><i className="fa fa-ban" /> Absent</span> :
          <span className="badge badge-success"><i className="fa fa-check" /> Present</span>
        */}
      </td>
      <td>
        <PermissionSelect permissions={permissions} disabled={true} />
      </td>
      <td>
        <div className='btn-group'>
          <button 
            type='button' 
            className='btn btn-outline-dark btn-sm px-2 py-0'
            onClick={toggleEdit}
            name={_id}>
            <i className="fa fa-pencil" /> Edit
          </button>
          <button 
            type='button' 
            className='btn btn-danger btn-sm px-2 py-0'
            onClick={this.removeAnnotationTrack}
            name={_id}>
            <i className="fa fa-exclamation-circle" /> Remove
          </button>
        </div>
      </td>
    </tr>
  }
}

class AdminTrackInfo extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      isEditing: false
    }
  }

  toggleEdit = () => {
    this.setState({
      isEditing: !this.state.isEditing
    })
  }

  render(){
    return (
      this.state.isEditing ?
      <EditTrackInfo toggleEdit={this.toggleEdit} {...this.props} /> :
      <TrackInfoLine toggleEdit={this.toggleEdit} {...this.props} />
    )
  }
}
export default AdminTrackInfo
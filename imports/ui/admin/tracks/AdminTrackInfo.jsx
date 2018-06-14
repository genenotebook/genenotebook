import React from 'react';
import { isEqual } from 'lodash';

import PermissionSelect from '/imports/ui/util/PermissionSelect.jsx';

import TrackPermissionSelect from './TrackPermissionSelect.jsx';
import BlastDatabaseButtons from './BlastDatabaseButtons.jsx';

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

const TrackInfoLine = ({ _id, trackName, reference, permissions, toggleEdit }) => {
  return <tr>
    <td>{trackName}</td>
    <td>{reference}</td>
    <td>
      <PermissionSelect permissions={permissions} disabled={true} />
    </td>
    <td>
      <button 
        type='button' 
        className='btn btn-outline-dark btn-sm px-2 py-0'
        onClick={toggleEdit}
        name={_id}>
        <i className="fa fa-pencil" /> Edit
      </button>
    </td>
  </tr>
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
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import Select from 'react-select';
import { compose } from 'recompose';
import { isEqual } from 'lodash';

import { updateReferenceInfo } from '/imports/api/genomes/updateReferenceInfo.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

const permissionSelectDataTracker = props => {
  const roleSub = Meteor.subscribe('roles');
  const loading = !roleSub.ready();
  const roles = Meteor.roles.find({}).fetch();
  return {
    loading,
    roles,
    ...props
  }
}

const withConditionalRendering = compose(
  withTracker(permissionSelectDataTracker),
  withEither(isLoading, Loading)
)

const PermissionSelect = ({ roles, permissions, updatePermissions, disabled, ...props }) => {
  return (
    <Select 
      name='genome-permission-select'
      value={permissions}
      options={roles.map(role => { return {value: role.name, label: role.name} })}
      onChange={updatePermissions}
      multi={true}
      disabled={disabled}
      />
  )
}

const PermissionSelectWithConditionalRendering = withConditionalRendering(PermissionSelect)

class EditGenomeInfo extends React.Component {
  constructor(props){
    super(props)
    const { genome } = props;
    this.state = genome;
  }

  updateField = event => {
    const field = event.target.id;
    const value = event.target.value;
    console.log(field,value)
    this.setState({
      [field]: value
    })
  }

  updatePermissions = newPermissions => {
    //make sure admin is always in permissions and that there are no duplicates
    const permissions = newPermissions.map(permission => permission.value)
    permissions.push('admin')
    this.setState({
      permissions: [...new Set(permissions)]
    })
  }

  saveChanges = () => {
    updateReferenceInfo.call(this.state, (err,res) => {
      if (err) alert(err);
      this.props.toggleEdit();
    })
  }

  render(){
    const { toggleEdit } = this.props;
    const genome = this.state;
    const hasChanges = !isEqual(genome, this.props.genome);
    return (
      <tr>
        <td>
          <div className="form-group">
            <input 
              type="text" 
              className="form-control" 
              id="referenceName" 
              aria-describedby="referenceName" 
              value={ genome.referenceName }
              onChange={ this.updateField } />
            <small id="referenceNameHelp" className="form-text text-muted">
              Reference names must be unique
            </small>
          </div>
        </td>
        <td>
          <div className="form-group">
            <input 
              type="text" 
              className="form-control" 
              id="organism" 
              aria-describedby="organism" 
              value={ genome.organism }
              onChange={ this.updateField } />
          </div>
        </td>
        <td>
          <div className="form-group">
            <textarea 
              className="form-control" 
              id="description" 
              aria-describedby="description" 
              rows="3"
              value={ genome.description }
              onChange={ this.updateField } />
          </div>
        </td>
        <td>
          <PermissionSelectWithConditionalRendering 
            permissions={genome.permissions}
            updatePermissions={this.updatePermissions} 
            disabled={false} />
        </td>
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
    )
  }
}

const GenomeInfoLine = ({ genome, toggleEdit }) => {
  return (
    <tr>
      <td>{genome.referenceName}</td>
      <td>{genome.organism}</td>
      <td>{genome.description}</td>
      <td>
        <PermissionSelectWithConditionalRendering 
          permissions={genome.permissions}
          disabled={true} />
      </td>
      <td>
        <button 
          type='button' 
          className='btn btn-outline-dark btn-sm px-2 py-0'
          onClick={toggleEdit}
          name={genome._id}>
          <i className="fa fa-pencil" /> Edit
        </button>
      </td>
    </tr>
  )
}

export default class AdminGenomeInfo extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      isEditing: false
    }
  }

  toggleEdit = () => {
    this.setState((state, props) => {
      return {
        isEditing: !state.isEditing
      }
    })
  }

  render(){
    const { genome } = this.props;
    const { isEditing } = this.state;
    return (
      isEditing ?
      <EditGenomeInfo genome={genome} toggleEdit={this.toggleEdit} /> :
      <GenomeInfoLine genome={genome} toggleEdit={this.toggleEdit} />
    )
  }
};

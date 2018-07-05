import React from 'react';
import { isEqual } from 'lodash';

import { updateGenome } from '/imports/api/genomes/updateGenome.js';
import { removeGenome } from '/imports/api/genomes/removeGenome.js';

import PermissionSelect from '/imports/ui/util/PermissionSelect.jsx';

import AnnotationInfo from './AnnotationInfo.jsx';

class EditGenomeInfo extends React.Component {
  constructor(props){
    super(props)
    const { genome } = props;
    this.state = genome;
  }

  updateField = event => {
    const field = event.target.id;
    const value = event.target.value;
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
    updateGenome.call(this.state, (err,res) => {
      if (err) alert(err);
      this.props.toggleEdit();
    })
  }

  removeGenome = event => {
    const genomeId = event.target.name;
    removeGenome.call({ genomeId })
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
              value={ genome.name }
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
          <PermissionSelect 
            permissions={genome.permissions}
            updatePermissions={this.updatePermissions} 
            disabled={false} />
        </td>
        <td>
          <AnnotationInfo { ...genome.annotationTrack }
            genomeId={genome._id}
            disabled={false} />
        </td>
        <td>
          <div className='btn-group d-block'>
            <button
              type='button' 
              className='btn btn-outline-success btn-sm px-2 py-0'
              onClick={this.saveChanges}
              disabled={!hasChanges} >
              <i className="fa fa-check" /> Save
            </button>
            <button 
              type='button' 
              className='btn btn-outline-dark btn-sm px-2 py-0'
              onClick={toggleEdit} >
              <i className="fa fa-remove" /> Cancel
            </button>
          </div>
          <hr/>
          <div className='btn-group d-block'>
            <button 
              type='button' 
              className='btn btn-danger btn-sm px-2 py-0'
              onClick={ this.removeGenome }
              name={genome._id}>
              <i className="fa fa-exclamation-circle" /> Delete genome <i className="fa fa-exclamation-circle" />
            </button>
          </div>
        </td>
      </tr>
    )
  }
}

const GenomeInfoLine = ({ genome, toggleEdit }) => {
  const { _id, name, organism, description, permissions, annotationTrack } = genome;
  return <tr>
    <td>{ name }</td>
    <td>{ organism }</td>
    <td>{ description }</td>
    <td>
      <PermissionSelect 
        permissions={ permissions }
        disabled={true} />
    </td>
    <td>
      <AnnotationInfo { ...annotationTrack }
        genomeId={_id}
        disabled={true} />
    </td>
    <td>
      <div className='btn-group'>
        <button 
          type='button' 
          className='btn btn-outline-dark btn-sm px-2 py-0'
          onClick={ toggleEdit }
          name={ _id }>
          <i className="fa fa-pencil" /> Edit&nbsp;
        </button>
        
      </div>
    </td>
  </tr>
}


export default class GenomeInfo extends React.Component {
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

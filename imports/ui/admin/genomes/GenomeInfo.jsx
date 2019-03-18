/* eslint-disable react/no-multi-comp */
import React from 'react';
import { isEqual } from 'lodash';

import { updateGenome } from '/imports/api/genomes/updateGenome.js';
import { removeGenome } from '/imports/api/genomes/removeGenome.js';

import PermissionSelect from '/imports/ui/util/PermissionSelect.jsx';

import AnnotationInfo from './AnnotationInfo.jsx';

class EditGenomeInfo extends React.PureComponent {
  constructor(props) {
    super(props);
    const { toggleEdit, ...genome } = props;
    this.state = genome;
  }

  updateField = (event) => {
    const field = event.target.id;
    const { value } = event.target;
    this.setState({
      [field]: value,
    });
  };

  togglePublic = () => {
    this.setState({
      isPublic: !this.state.isPublic,
    });
  };

  updatePermissions = (newPermissions) => {
    // make sure admin is always in permissions and that there are no duplicates
    const permissions = newPermissions.map(permission => permission.value);
    permissions.push('admin');
    this.setState({
      permissions: [...new Set(permissions)],
    });
  };

  saveChanges = () => {
    updateGenome.call(this.state, (err, res) => {
      if (err) alert(err);
      this.props.toggleEdit();
    });
  };

  removeGenome = (event) => {
    const genomeId = event.target.name;
    removeGenome.call({ genomeId });
  };

  render() {
    const { toggleEdit } = this.props;
    const {
      _id: genomeId,
      name: genomeName,
      organism,
      description,
      permissions,
      isPublic,
      annotationTrack = {},
    } = this.state;
    const { name: annotationName, blastDb } = annotationTrack;
    const hasChanges = !isEqual(this.state, this.props.genome);
    return (
      <tr>
        <td>
          <div className="form-group">
            <input
              type="text"
              className="form-control form-control-sm"
              id="name"
              aria-describedby="referenceName"
              value={genomeName}
              onChange={this.updateField}
            />
            <small id="referenceNameHelp" className="form-text text-muted">
              Genome names must be unique
            </small>
          </div>
        </td>
        <td>
          <div className="form-group">
            <input
              type="text"
              className="form-control form-control-sm"
              id="organism"
              aria-describedby="organism"
              value={organism}
              onChange={this.updateField}
            />
          </div>
        </td>
        <td>
          <div className="form-group">
            <textarea
              className="form-control form-control-sm"
              id="description"
              aria-describedby="description"
              rows="3"
              value={description}
              onChange={this.updateField}
            />
          </div>
        </td>
        <td>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={this.togglePublic}
          />
        </td>
        <td>
          <PermissionSelect
            value={permissions}
            disabled={isPublic}
            onChange={this.updatePermissions}
          />
        </td>
        <td>
          <AnnotationInfo
            blastDb={blastDb}
            name={annotationName}
            genomeId={genomeId}
            isEditing
          />
        </td>
        <td>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td>
                  <div className="btn-group btn-group-justified">
                    <button
                      type="button"
                      onClick={this.saveChanges}
                      className="btn btn-success btn-sm px-2 py-0"
                      disabled={!hasChanges}
                    >
                      <span className="icon-check" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={toggleEdit}
                      className="btn btn-outline-dark btn-sm px-2 py-0"
                    >
                      <span className="icon-cancel" />
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <button
                    type="button"
                    onClick={this.removeGenome}
                    className="btn btn-danger btn-sm px-2 py-0 btn-block"
                    name={genomeId}
                  >
                    <span className="icon-exclamation" />
                    Delete genome
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    );
  }
}

const GenomeInfoLine = ({
  _id: genomeId,
  name: genomeName,
  organism,
  isPublic,
  description,
  permissions,
  annotationTrack = {},
  toggleEdit,
}) => {
  const { name: annotationName, blastDb } = annotationTrack;
  return (
    <tr>
      <td>{genomeName}</td>
      <td>{organism}</td>
      <td>{description}</td>
      <td>
        <input type="checkbox" checked={isPublic} disabled />
      </td>
      <td>
        <PermissionSelect value={permissions} disabled />
      </td>
      <td>
        <AnnotationInfo
          name={annotationName}
          blastDb={blastDb}
          genomeId={genomeId}
          isEditing={false}
        />
      </td>
      <td>
        <div className="btn-group">
          <button
            type="button"
            onClick={toggleEdit}
            name={genomeId}
            className="btn btn-outline-dark btn-sm px-2 py-0"
          >
            <span className="icon-pencil" />
            Edit&nbsp;
          </button>
        </div>
      </td>
    </tr>
  );
};

export default class GenomeInfo extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
    };
  }

  toggleEdit = () => {
    this.setState((state, props) => ({
      isEditing: !state.isEditing,
    }));
  };

  render() {
    const { isEditing } = this.state;
    return isEditing ? (
      <EditGenomeInfo {...this.props} toggleEdit={this.toggleEdit} />
    ) : (
      <GenomeInfoLine {...this.props} toggleEdit={this.toggleEdit} />
    );
  }
}

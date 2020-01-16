/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
// import { isEqual } from 'lodash';

import updateGenome from '/imports/api/genomes/updateGenome.js';
import removeGenome from '/imports/api/genomes/removeGenome.js';
import logger from '/imports/api/util/logger.js';

import PermissionSelect from '/imports/ui/util/PermissionSelect.jsx';

import AnnotationInfo from './AnnotationInfo.jsx';

function EditGenomeInfo({
  _id: genomeId,
  name: initialGenomeName,
  organism: initialOrganism,
  description: initialDescription,
  permission: initialPermission,
  isPublic: initialIsPublic,
  annotationTrack = {},
  toggleEdit,
}) {
  const { name: annotationName, blastDb } = annotationTrack;

  const [genomeName, setGenomeName] = useState(initialGenomeName);
  const [organism, setOrganism] = useState(initialOrganism);
  const [description, setDescription] = useState(initialDescription);
  const [permission, setPermission] = useState(initialPermission);
  const [isPublic, setPublic] = useState(initialIsPublic);

  function togglePublic() {
    setPublic(!isPublic);
  }

  /*
  function updatePermissions(newPermissions) {
    // make sure admin is always in permissions and that there are no duplicates
    const perm = newPermissions.map((permission) => permission.value);
    perm.push('admin');
    setPermissions([...new Set(perm)]);
  }
  */
  function saveChanges() {
    updateGenome.call({
      _id: genomeId,
      name: genomeName,
      organism,
      description,
      permissions,
      isPublic,
      annotationTrack,
    }, (err) => {
      if (err) {
        logger.warn(err);
        alert(err);
      }
      toggleEdit();
    });
  }

  const hasChanges = genomeName !== initialGenomeName
    || organism !== initialOrganism
    || description !== initialDescription
    || permission !== initialPermission
    || isPublic !== initialIsPublic;

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
            onChange={(event) => {
              setGenomeName(event.target.value);
            }}
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
            onChange={(event) => {
              setOrganism(event.target.value);
            }}
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
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
        </div>
      </td>
      <td>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={togglePublic}
        />
      </td>
      <td>
        <PermissionSelect
          value={permission}
          disabled={isPublic}
          onChange={(selection) => {
            setPermission(selection.value);
          }}
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
                    onClick={saveChanges}
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
                  onClick={() => {
                    removeGenome.call({ genomeId }, (err) => {
                      if (err) {
                        logger.warn(err);
                        alert(err);
                      }
                    });
                  }}
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

function GenomeInfoLine({
  _id: genomeId,
  name: genomeName,
  organism,
  isPublic,
  description,
  permission,
  annotationTrack = {},
  toggleEdit,
}) {
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
        <PermissionSelect value={permission} disabled />
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
}

export default function GenomeInfo(props) {
  const [isEditing, setIsEditing] = useState(false);
  function toggleEdit() {
    setIsEditing(!isEditing);
  }
  return isEditing ? (
    <EditGenomeInfo {...props} toggleEdit={toggleEdit} />
  ) : (
    <GenomeInfoLine {...props} toggleEdit={toggleEdit} />
  );
}

/* eslint-disable react/prop-types */
import React, { useState } from 'react';

import updateGenome from '/imports/api/genomes/updateGenome.js';
import removeGenome from '/imports/api/genomes/removeGenome.js';
import logger from '/imports/api/util/logger.js';

import PermissionSelect from '/imports/ui/util/PermissionSelect.tsx';

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
      permission,
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
        <div className="field">
          <input
            type="text"
            className="input is-small"
            id="name"
            aria-describedby="referenceName"
            value={genomeName}
            onChange={(event) => {
              setGenomeName(event.target.value);
            }}
          />
          <small id="referenceNameHelp" className="help">
            Genome names must be unique
          </small>
        </div>
      </td>
      <td>
        <input
          type="text"
          className="input is-small"
          id="organism"
          aria-describedby="organism"
          value={organism}
          onChange={(event) => {
            setOrganism(event.target.value);
          }}
        />
      </td>
      <td>
        <textarea
          className="textarea is-small"
          id="description"
          aria-describedby="description"
          rows="2"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
          }}
        />
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
        <ul>
          <li>
            <div className="buttons has-addons are-small">
              <button
                type="button"
                onClick={saveChanges}
                className={`button ${hasChanges ? 'is-success is-light is-outlined' : ''}`}
                disabled={!hasChanges}
              >
                <span className="icon-check" />
                Save
              </button>
              <button
                type="button"
                onClick={toggleEdit}
                className="button"
              >
                <span className="icon-cancel" />
                Cancel
              </button>
            </div>
          </li>
          <li>
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
              className="button is-small is-danger is-light is-outlined is-fullwidth"
              name={genomeId}
            >
              <span className="icon-exclamation" />
              Delete genome
              <span className="icon-exclamation" />
            </button>
          </li>
        </ul>
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
        <button
          type="button"
          onClick={toggleEdit}
          name={genomeId}
          className="button is-small is-fullwidth"
        >
          <span className="icon-pencil" />
          {' Edit'}
        </button>
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
    // eslint-disable-next-line react/jsx-props-no-spreading
    <EditGenomeInfo {...props} toggleEdit={toggleEdit} />
  ) : (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <GenomeInfoLine {...props} toggleEdit={toggleEdit} />
    );
}

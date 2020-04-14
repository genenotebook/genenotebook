/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/no-interactive-element-to-noninteractive-role */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState } from 'react';
import { groupBy } from 'lodash';

import updateReplicaGroup
  from '/imports/api/transcriptomes/updateReplicaGroup.js';
import updateSampleInfo
  from '/imports/api/transcriptomes/updateSampleInfo.js';

import PermissionSelect from '/imports/ui/util/PermissionSelect.jsx';

import './genomeExperiment.scss';

function Experiment({
  _id,
  allReplicaGroups,
  sampleName: initialSampleName,
  replicaGroup: initialReplicaGroup,
  description: initialDescription,
  permissions,
}) {
  const [sampleName, setSampleName] = useState(initialSampleName);
  const [replicaGroup, setReplicaGroup] = useState(initialReplicaGroup);
  const [description, setDescription] = useState(initialDescription);
  // const [permissions, setPermissions] = useState(initialPermissions);
  const [isEditing, setEditing] = useState(false);

  function toggleEditing() {
    setEditing(!isEditing);
  }

  function submit(event) {
    event.preventDefault();
    setEditing(false);
    updateSampleInfo.call({
      _id, sampleName, replicaGroup, description, permissions,
    }, (err) => {
      if (err) alert(err);
    });
  }

  return (
    <>
      <div className="buttons has-addons" role="group">
        <button
          type="button"
          className="button is-small"
          onClick={toggleEditing}
        >
          <span
            className={isEditing ? 'icon-cancel' : 'icon-pencil'}
            id="edit"
          />
          { isEditing ? ' Cancel' : ' Edit' }
        </button>
        { isEditing && (
        <button
          type="button"
          className="button is-small"
          onClick={submit}
        >
          <span className="icon-floppy" id="save" onClick={submit} />
          Save
        </button>
        )}
      </div>
      <form className="columns" onSubmit={submit}>
        <div className="field is-horizontal column">
          <div className="field-label is-small">
            <label className="label">Sample name</label>
          </div>
          <div className="field-body">
            <input
              type="text"
              className="input is-small"
              id="sampleName"
              title={sampleName}
              value={sampleName}
              onChange={(event) => {
                setSampleName(event.target.value);
              }}
              disabled={!isEditing}
            />
          </div>
        </div>
        <div className="field is-horizontal column">
          <div className="field-label is-small">
            <label className="label">description</label>
          </div>
          <div className="field-body">
            <input
              type="text"
              id="description"
              value={description}
              title={description}
              className="input is-small"
              onChange={(event) => {
                setDescription(event.target.value);
              }}
              disabled={!isEditing}
            />
          </div>
        </div>
        <div className="field is-horizontal column">
          <div className="field-label is-small">
            <label className="label">Replica group</label>
          </div>
          <div className="field-body">
            <div className="select is-small">
              <select
                disabled={!isEditing}
                value={replicaGroup}
                id="replicaGroup"
                onChange={(event) => {
                  setReplicaGroup(event.target.value);
                }}
              >
                {
              allReplicaGroups.map((replicaGroupOption) => (
                <option key={replicaGroupOption} value={replicaGroupOption}>
                  { replicaGroupOption }
                </option>
              ))
            }
              </select>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

function Experiments({ groupExperiments, allReplicaGroups }) {
  return (
    <ul className="list">
      {
        groupExperiments.map((experiment) => (
          <li key={experiment._id} className="list-item">
            <Experiment {...{ allReplicaGroups, ...experiment }} />
          </li>
        ))
      }
    </ul>
  );
}

function ReplicaGroup({
  groupExperiments,
  allReplicaGroups,
  replicaGroup: initialReplicaGroup,
}) {
  const {
    permission: initialPermission,
    isPublic: initialIsPublic,
  } = groupExperiments[0];
  const [permission, setPermission] = useState(initialPermission);
  const [replicaGroup, setReplicaGroup] = useState(initialReplicaGroup);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isEditing, setEditing] = useState(false);
  const [expand, setExpand] = useState(false);

  function toggleIsPublic() {
    setIsPublic(!isPublic);
  }

  function toggleEditing() {
    setEditing(!isEditing);
  }

  function toggleExpand() {
    setExpand(!expand);
  }

  function submit(event) {
    event.preventDefault();
    const sampleIds = groupExperiments.map((exp) => exp._id);
    const hasChanges = replicaGroup !== initialReplicaGroup
      || isPublic !== initialIsPublic
      || permission !== initialPermission;

    if (hasChanges) {
      setEditing(false);
      setExpand(false);
      updateReplicaGroup.call({
        sampleIds,
        replicaGroup,
        isPublic,
        permission,
      }, (err) => {
        if (err) alert(err);
      });
    }
  }

  return (
    <li className={`list-item replica-group has-background-white-bis ${isEditing ? 'is-editing' : ''}`}>
      <div className="level">
        <div className="level-left">
          <button type="button" className="button is-small" id="expand" onClick={toggleExpand}>
            <span className="icon">
              <span className={expand ? 'icon-minus' : 'icon-plus'} />
            </span>
          </button>
          <div className="buttons has-addons edit-buttons" role="group">
            <button
              type="button"
              className="button is-small"
              onClick={toggleEditing}
            >
              <span
                className={isEditing ? 'icon-cancel' : 'icon-pencil'}
                id="edit"
              />
              { isEditing ? ' Cancel' : ' Edit' }
            </button>
            { isEditing && (
            <button
              type="button"
              className="button is-small"
              onClick={submit}
            >
              <span className="icon-floppy" id="save" onClick={submit} />
              Save
            </button>
            )}
          </div>
        </div>
        <div className="level-right">
          <div className="tags has-addons">
            <span className="tag is-danger is-light">
              { groupExperiments.length }
            </span>
            <span className="tag is-light">
              Samples
            </span>
          </div>
        </div>
      </div>
      <form className="form columns" onSubmit={submit}>
        <div className="field is-horizontal column">
          <div className="field-label is-small">
            <label className="label">
              Replica group
            </label>
          </div>
          <div className="field-body">
            <input
              type="text"
              className="input is-small"
              value={replicaGroup}
              size="30"
              title={replicaGroup}
              onChange={(event) => setReplicaGroup(event.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>
        <div className="field is-horizontal column">
          <div className="field-label is-small">
            <label className="label" htmlFor="isPublic">
              Public
            </label>
          </div>
          <div className="field-body">
            <input
              type="checkbox"
              className="checkbox"
              checked={isPublic}
              onChange={toggleIsPublic}
              disabled={!isEditing}
            />
          </div>
        </div>
        <div className="field is-horizontal column">
          <div className="field-label is-small">
            <label className="label" htmlFor="permissions">
              Permissions
            </label>
          </div>
          <div className="field-body">
            <PermissionSelect
              onChange={(selection) => {
                setPermission(selection.value);
              }}
              disabled={!isEditing || isPublic}
              value={permission}
              className="ml-2"
            />
          </div>
        </div>
      </form>
      {
      expand && <Experiments {...{ groupExperiments, allReplicaGroups }} />
    }
    </li>
  );
}

function ExpandedGenomeExperiment({
  experiments,
  allReplicaGroups,
}) {
  const replicaGroups = groupBy(experiments, (exp) => exp.replicaGroup);
  return (
    <ul className="list">
      { Object.entries(replicaGroups)
        .map(([replicaGroup, groupExperiments]) => (
          <ReplicaGroup
            key={replicaGroup}
            replicaGroup={replicaGroup}
            groupExperiments={groupExperiments}
            allReplicaGroups={allReplicaGroups}
          />
        ))}
    </ul>
  );
}

export default function GenomeExperiment({ genome, experiments }) {
  const [expanded, setExpanded] = useState(false);
  function toggleExpand() {
    setExpanded(!expanded);
  }
  const allReplicaGroups = [...new Set(experiments.map((exp) => exp.replicaGroup))];
  const btnClass = expanded ? 'icon-minus' : 'icon-plus';
  return (
    <>
      <div className="level">
        <div className="level-left">
          <button
            type="button"
            className="button is-small"
            onClick={toggleExpand}
          >
            <span className="icon">
              <span className={btnClass} />
            </span>
          </button>
          <form className="genome-name">
            <div className="field is-horizontal">
              <div className="field-label is-normal">
                <label className="label">Genome</label>
              </div>
              <div className="field-body">
                <div className="field">
                  <p className="control">
                    <input className="input is-static" readOnly value={genome.name} />
                  </p>
                </div>
              </div>
            </div>
          </form>

          <small className="text-muted">{ `(${genome.organism})` }</small>
        </div>
        <div className="level-right">
          <div className="field is-grouped is-grouped-multiline">
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-primary">
                  { allReplicaGroups.length }
                </span>
                <span className="tag is-light">
                  Replica groups
                </span>
              </div>
            </div>
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-danger is-light">
                  { experiments.length }
                </span>
                <span className="tag is-light">
                  Samples
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {
      expanded
      && (
      <ExpandedGenomeExperiment
        experiments={experiments}
        allReplicaGroups={allReplicaGroups}
      />
      )
    }
    </>
  );
}

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
      <div className="btn-group" role="group">
        <button
          type="button"
          className="btn btn-sm border px-0 py-0"
          id="edit"
          onClick={toggleEditing}
        >
          <span
            className={isEditing ? 'icon-cancel' : 'icon-pencil'}
            id="edit"
            onClick={toggleEditing}
          />
        </button>
        {
        isEditing
        && (
        <button
          type="button"
          className="btn btn-sm btn-success px-0 py-0"
          id="save"
          onClick={submit}
        >
          <span className="icon-floppy" id="save" onClick={submit} />
        </button>
        )
      }
      </div>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group col-md-4">
            <label htmlFor="sample-name">Sample name</label>
            <input
              type="text"
              className="form-control form-control-sm"
              id="sampleName"
              title={sampleName}
              value={sampleName}
              onChange={(event) => {
                setSampleName(event.target.value);
              }}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group col-md-4">
            <label htmlFor="description">description</label>
            <input
              type="text"
              id="description"
              value={description}
              title={description}
              className="form-control form-control-sm"
              onChange={(event) => {
                setDescription(event.target.value);
              }}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group col-md-4">
            <label htmlFor="allReplicaGroups" role="group">Replica group</label>
            <select
              className="form-control form-control-sm"
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
      </form>
    </>
  );
}

function Experiments({ groupExperiments, allReplicaGroups }) {
  return (
    <ul className="list-group mt-1">
      {
        groupExperiments.map((experiment) => (
          <li key={experiment._id} className="list-group-item">
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
    permissions: initialPermissions,
    isPublic: initialIsPublic,
  } = groupExperiments[0];
  const [permissions, setPermissions] = useState(initialPermissions);
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
      || permissions !== initialPermissions;

    if (hasChanges) {
      setEditing(false);
      setExpand(false);
      updateReplicaGroup.call({
        sampleIds,
        replicaGroup,
        isPublic,
        permissions,
      }, (err) => {
        if (err) alert(err);
      });
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between">
        <div>
          <div className="btn-group" role="group">
            <button type="button" className="btn btn-sm border px-0 py-0" id="expand" onClick={toggleExpand}>
              <span className={expand ? 'icon-minus' : 'icon-plus'} id="expand" onClick={toggleExpand} />
            </button>
            <button type="button" className="btn btn-sm border px-0 py-0" id="edit" onClick={toggleEditing}>
              <span className={isEditing ? 'icon-cancel' : 'icon-pencil'} id="edit" onClick={toggleEditing} />
            </button>
            {
            isEditing
            && (
            <button type="button" className="btn btn-sm btn-success px-0 py-0" id="save" onClick={submit}>
              <span className="icon-floppy" id="save" onClick={submit} />
            </button>
            )
          }
          </div>

          <form className="form d-inline-flex ml-2" onSubmit={submit}>
            <div className="form-group mx-2">
              <label htmlFor="replica-group">Replica group</label>
              <input
                type="text"
                className="form-control ml-2"
                id="replica-group"
                value={replicaGroup}
                size="40"
                title={replicaGroup}
                onChange={(event) => setReplicaGroup(event.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group mx-2">
              <label htmlFor="isPublic">Public</label>
              <input
                type="checkbox"
                className="form-control ml-2"
                checked={isPublic}
                onChange={toggleIsPublic}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group mx-2">
              <label htmlFor="permissions">Permissions</label>
              <PermissionSelect
                onChange={(selection) => {
                  setPermissions(selection.map((s) => s.value));
                }}
                disabled={!isEditing}
                value={permissions}
                className="ml-2"
              />
            </div>

          </form>
        </div>
        <div>
          <button type="button" className="btn btn-sm btn-outline-dark px-2 py-0" disabled>
            <span className="badge badge-primary">
              { groupExperiments.length }
            </span>
            {' '}
Transcriptomes
          </button>
        </div>
      </div>
      {
      expand && <Experiments {...{ groupExperiments, allReplicaGroups }} />
    }
    </>
  );
}

function ExpandedGenomeExperiment({
  experiments,
  allReplicaGroups,
}) {
  const replicaGroups = groupBy(experiments, (exp) => exp.replicaGroup);
  return (
    <ul className="list-group mt-1">
      {
      Object.entries(replicaGroups).map(([replicaGroup, groupExperiments]) => (
        <li className="list-group-item" key={replicaGroup}>
          <ReplicaGroup
            replicaGroup={replicaGroup}
            groupExperiments={groupExperiments}
            allReplicaGroups={allReplicaGroups}
          />
        </li>
      ))
    }
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
      <div className="d-flex justify-content-between">
        <div>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm border px-0 py-0 mr-2"
            onClick={toggleExpand}
          >
            <span className={btnClass} />
          </button>
          { genome.name }
          {' '}
          <small className="text-muted">{ genome.organism }</small>
        </div>
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-sm btn-outline-dark px-2 py-0"
            disabled
          >
            <span className="badge badge-warning">
              { allReplicaGroups.length }
            </span>
            {' '}
            Replica groups
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-dark px-2 py-0"
            disabled
          >
            <span className="badge badge-primary">
              { experiments.length }
            </span>
            {' '}
            Transcriptomes
          </button>
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

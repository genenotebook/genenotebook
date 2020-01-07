import React, { useState } from 'react';

import { Creatable as Select } from 'react-select';

import logger from '/imports/api/util/logger.js';

/*
class EditSample extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.props.sample;
  }

  handleChange = (event) => {
    const key = event.target.name;
    const { value } = event.target;
    logger.debug(key, value);
    this.setState({
      [key]: value,
    });
  }

  saveChange = (event) => {
    logger.debug('saveChange');
    if (isEqual(this.state, this.props.sample)) {
      this.props.toggleEdit(event);
    } else {
      const props = omit(this.state, ['track']);
      updateSampleInfo.call(props, (err, res) => {
        if (err) logger.warn(err);
        this.props.toggleEdit(event);
      });
    }
  }

  cancelChange = (event) => {
    this.props.toggleEdit(event);
  }

  render() {
    const allReplicaGroups = new Set(this.props.allSamples.map((sample) => sample.replicaGroup));
    const replicaGroupOptions = Array.from(allReplicaGroups).map((group) => ({ value: group, label: group }));
    replicaGroupOptions.push({
      value: this.state.replicaGroup,
      label: this.state.replicaGroup,
    });

    const allExperimentGroups = new Set(this.props.allSamples.map((sample) => sample.experimentGroup));
    const experimentGroupOptions = Array.from(allExperimentGroups).map((group) => ({ value: group, label: group }));
    experimentGroupOptions.push({
      value: this.state.experimentGroup,
      label: this.state.experimentGroup,
    });

    return (
      <div>
        <input
          type="button"
          className="fa btn btn-xs btn-success pull-right save-change"
          value={'\uf00c'}
          onClick={this.saveChange}
        />
        <input
          type="button"
          className="fa btn btn-xs btn-danger pull-right save-change"
          value={'\uf00d'}
          onClick={this.cancelChange}
        />

        <div className="form-group">
          <label htmlFor="sampleName">Sample name</label>
          <input
            name="sampleName"
            onChange={this.handleChange}
            className="form-control"
            value={this.state.sampleName}
          />
        </div>
        <div className="form-group">
          <label htmlFor="experimentGroup">Experiment group</label>
          <Select
            name="experimentGroup"
            value={this.state.experimentGroup}
            options={experimentGroupOptions}
            onChange={(val) => { this.handleChange({ target: { name: 'experimentGroup', value: val.value } }); }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="replicaGroup">Replica group</label>
          <Select
            name="replicaGroup"
            value={this.state.replicaGroup}
            options={replicaGroupOptions}
            onChange={(val) => { this.handleChange({ target: { name: 'replicaGroup', value: val.value } }); }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="permissions">Permissions</label>
          <Select
            name="permissions"
            value={this.state.permissions}
            options={this.props.roles.map((role) => ({ label: role, value: role }))}
            onChange={(val) => { this.handleChange({ target: { name: 'permissions', value: val.map((v) => v.value) } }); }}
            multi
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            name="description"
            onChange={this.handleChange}
            className="form-control"
            rows="2"
            value={this.state.description}
          />
        </div>
      </div>
    );
  }
}
*/

function makeSelectionOption(val) {
  return { value: val, label: val };
}

function EditSample({ sample, allSamples, toggleEditing }) {
  const {
    _id,
    genomeId: defaultGenomeId,
    sampleName: defaultSampleName,
    replicaGroup: defaultReplicaGroup,
    description: defaultDescription,
    isPublic: defaultIsPublic,
    permissions: defaultPermissions,
  } = sample;
  const [genomeId, setGenomeId] = useState(defaultGenomeId);
  const [sampleName, setSampleName] = useState(defaultSampleName);
  const [replicaGroup, setReplicaGroup] = useState(defaultReplicaGroup);
  const [description, setDescription] = useState(defaultDescription);
  const [isPublic, setIsPublic] = useState(defaultIsPublic);
  const [permission, setPermissions] = useState(defaultPermissions);

  const allReplicaGroups = new Set(allSamples.map(
    ({ replicaGroup }) => replicaGroup,
  ));
  const replicaGroupOptions = Array.from(allReplicaGroups)
    .map(makeSelectionOption);
  replicaGroupOptions.push(makeSelectionOption(replicaGroup));

  const allExperimentGroups = new Set(this.props.allSamples.map(
    ({ experimentGroup }) => experimentGroup,
  ));
  const experimentGroupOptions = Array.from(allExperimentGroups)
    .map(makeSelectionOption);
  experimentGroupOptions.push(makeSelectionOption(experimentGroup));


  return (
    <div>
      <input
        type="button"
        className="fa btn btn-xs btn-success pull-right save-change"
        value={'\uf00c'}
        onClick={this.saveChange}
      />
      <input
        type="button"
        className="fa btn btn-xs btn-danger pull-right save-change"
        value={'\uf00d'}
        onClick={this.cancelChange}
      />

      <div className="form-group">
        <label htmlFor="sampleName">Sample name</label>
        <input
          name="sampleName"
          onChange={this.handleChange}
          className="form-control"
          value={sampleName}
        />
      </div>
      <div className="form-group">
        <label htmlFor="experimentGroup">Experiment group</label>
        <Select
          name="experimentGroup"
          value={experimentGroup}
          options={experimentGroupOptions}
          onChange={(val) => { this.handleChange({ target: { name: 'experimentGroup', value: val.value } }); }}
        />
      </div>
      <div className="form-group">
        <label htmlFor="replicaGroup">Replica group</label>
        <Select
          name="replicaGroup"
          value={replicaGroup}
          options={replicaGroupOptions}
          onChange={(val) => { this.handleChange({ target: { name: 'replicaGroup', value: val.value } }); }}
        />
      </div>
      <div className="form-group">
        <label htmlFor="permissions">Permissions</label>
        <Select
          name="permissions"
          value={permissions}
          options={roles.map((role) => ({ label: role, value: role }))}
          onChange={(val) => { this.handleChange({ target: { name: 'permissions', value: val.map((v) => v.value) } }); }}
          multi
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          name="description"
          onChange={this.handleChange}
          className="form-control"
          rows="2"
          value={description}
        />
      </div>
    </div>
  );
}

function DisplaySample({ sampleName, description, toggleEditing }) {
  return (
    <div>
      <input
        type="submit"
        className="fa btn btn-xs btn-default pull-right"
        value={'\uf013'}
        onClick={toggleEditing}
      />
      <p>
        {sampleName}
        <br />
        {description}
      </p>
    </div>
  );
}

export default function SampleInfo({ sample, roles, allSamples }) {
  const [editing, setEditing] = useState(false);
  function toggleEditing() {
    setEditing(!editing);
  }
  return (
    <li className="list-group-item sample-info">
      {
      editing
        ? (
          <EditSample
            toggleEditing={toggleEditing}
            sample={sample}
            allSamples={allSamples}
          />
        )
        : (
          <DisplaySample
            sampleName={sample.sampleName}
            description={sample.description}
            toggleEditing={toggleEditing}
            roles={roles}
          />
        )
    }
    </li>
  );
}

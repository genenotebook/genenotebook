/* eslint-disable jsx-a11y/control-has-associated-label */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Roles } from 'meteor/alanning:roles';

import React, { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { diff, apply } from 'rus-diff';

import { EditHistory } from '/imports/api/genes/edithistory_collection.js';
import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import { updateGene } from '/imports/api/genes/updateGene.js';
import getUserName from '/imports/api/users/getUserName.js';
import logger from '/imports/api/util/logger.js';

import AttributeValue from '/imports/ui/genetable/columns/AttributeValue.jsx';

import './generalInfo.scss';

function Controls({
  showHistory,
  totalVersionNumber,
  isEditing,
  toggleHistory,
  saveEdit,
  startEdit,
  cancelEdit,
}) {
  const canEdit = Roles.userIsInRole(Meteor.userId(), ['admin', 'curator']);
  return (
    <div>
      {showHistory && (
        <button
          type="button"
          onClick={toggleHistory}
          className="btn btn-outline-dark btn-sm float-right px-2 py-0 viewingHistory"
        >
          <span className="icon-history" aria-hidden="true" />
          &nbsp;Hide history
        </button>
      )}
      {totalVersionNumber > 0 && !isEditing && !showHistory && (
        <button
          type="button"
          onClick={toggleHistory}
          className="btn btn-outline-dark btn-sm float-right px-2 py-0 viewingHistory"
        >
          <i className="icon-history" aria-hidden="true" />
          &nbsp;Show history&nbsp;
          <span className="badge badge-dark">{totalVersionNumber + 1}</span>
        </button>
      )}
      {canEdit && !isEditing && !showHistory && (
        <button
          type="button"
          onClick={startEdit}
          className="btn btn-outline-dark btn-sm float-right px-2 py-0 edit border"
        >
          <span className="icon-pencil" aria-hidden="true" />
          {' '}
          Edit
        </button>
      )}
      {canEdit && isEditing && !showHistory && (
        <div className="btn-group float-right">
          <button
            type="button"
            onClick={saveEdit}
            className="btn btn-outline-success px-2 py-0 btn-sm save"
          >
            <span className="icon-floppy" aria-hidden="true" />
            {' '}
            Save
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="btn btn-outline-danger btn-sm px-2 py-0 cancel"
          >
            <span className="icon-cancel" aria-hidden="true" />
            {' '}
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function VersionHistory({
  editBy,
  currentVersionNumber,
  totalVersionNumber,
  restoreVersion,
  selectVersion,
  editAt,
  ...props
}) {
  const [userName, setUsername] = useState('...');
  useEffect(() => {
    getUserName.call({ userId: editBy }, (err, res) => {
      if (err) logger.warn(err);
      setUsername(res);
    });
  }, [editBy]);

  const hasNextVersion = currentVersionNumber < totalVersionNumber;
  const nextText = hasNextVersion
    ? 'Next version'
    : 'No next version available';

  const hasPreviousVersion = currentVersionNumber !== 0;
  const previousText = hasPreviousVersion
    ? 'Previous version'
    : 'No previous version available';
  return (
    <div>
      <div className="alert alert-primary d-flex justify-content-between" role="alert">
        <div>
          <span className="icon-exclamation" aria-hidden="true" />
          {`You are watching version 
          ${currentVersionNumber + 1} / ${totalVersionNumber + 1} 
          of this gene.`}
          <br />
        </div>
        <div>
          {`Edit by ${userName} at ${editAt}.`}
          <br />
        </div>
        {Roles.userIsInRole(Meteor.userId(), 'admin') && (
          <button
            type="button"
            className="button btn-sm btn-primary px-2 py-0"
            onClick={restoreVersion}
          >
            Revert to this version
          </button>
        )}
      </div>
      <div className="pager">
        <button
          type="button"
          className="btn btn-sm btn-outline-dark px-2 py-0"
          name="previous"
          onClick={selectVersion}
          disabled={!hasPreviousVersion}
        >
          <span
            className={`${hasPreviousVersion ? 'icon-left' : 'icon-block'}`}
            aria-hidden="true"
          />
          {' '}
          {previousText}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-dark px-2 py-0 float-right"
          name="next"
          onClick={selectVersion}
          disabled={!hasNextVersion}
        >
          {nextText}
          <span
            className={`${hasNextVersion ? 'icon-right' : 'icon-block'}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}


function AttributeInput({
  name, value, onChange, deleteAttribute,
}) {
  return (
    <div className="d-flex justify-content-between">
      <textarea className="form-control" {...{ name, value, onChange }} />
      <button
        type="button"
        name={name}
        className="btn btn-outline-danger btn-sm"
        onClick={deleteAttribute.bind(this, name)}
      >
        <span className="icon-trash" />
      </button>
    </div>
  );
}

function geneInfoDataTracker({ gene, ...props }) {
  Meteor.subscribe('editHistory');
  Meteor.subscribe('attributes');

  const editHistory = EditHistory.find(
    {
      ID: gene.ID,
    },
    {
      sort: {
        date: -1,
      },
    },
  ).fetch();

  const attributeNames = attributeCollection
    .find(
      {
        reserved: false,
      },
      {
        field: name,
      },
    )
    .map((attribute) => attribute.name);

  return {
    gene,
    editHistory,
    attributeNames,
  };
}

function GeneInfo({ gene, genome, attributeNames, editHistory }) {
  const {
    seqid, start, end, strand, source, orthogroupId,
  } = gene;
  const currentVersion = editHistory[0];

  const [reversions, setReversions] = useState(0);
  const [attributes, setAttributes] = useState(cloneDeep(gene.attributes));
  // const [newAttributes, setNewAttributes] = useState(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [addingNewAttribute, setAddingNewAttribute] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newAttributeKey, setNewAttributeKey] = useState(undefined);
  const [newAttributeValue, setNewAttributeValue] = useState(undefined);

  function startEdit() {
    setIsEditing(true);
  }
  function cancelEdit() {
    setIsEditing(false);
    setAddingNewAttribute(false);
    setAttributes(cloneDeep(gene.attributes))
  }
  function saveEdit() {
    logger.debug('save edit');
    const newGene = cloneDeep(gene);
    newGene.attributes = attributes;
    newGene.changed = true;

    if (newAttributeKey || newAttributeValue) {
      if (!(newAttributeKey && newAttributeValue)) {
        if (!newAttributeKey) {
          alert('New attribute key required');
        } else {
          alert('New attribute value required!');
        }
        throw new Meteor.Error('Incorrect new attribute');
      } else {
        if (!newGene.attributes) {
          newGene.attributes = {};
        }
        newGene.attributes[newAttributeKey] = newAttributeValue;
      }
    }
    const update = diff(gene, newGene);

    logger.debug(update);

    updateGene.call({ geneId: gene.ID, update }, (err, res) => {
      if (err) {
        logger.warn(err);
        alert(err);
      }
    });

    setIsEditing(false);
    setAddingNewAttribute(false);
  }
  function deleteAttribute(key) {
    const newAttributes = cloneDeep(attributes);
    delete newAttributes[key];
    setAttributes(newAttributes);
  }
  function changeAttributeValue(event) {
    event.preventDefault();
    const {
      target: { name, value },
    } = event;
    const newAttributes = cloneDeep(attributes);
    newAttributes[name] = value;
    setAttributes(newAttributes);
  }
  function toggleHistory() {
    setReversions(0);
    setShowHistory(!showHistory);
    setAttributes(cloneDeep(gene.attributes));
  }
  function restoreVersion() {
    logger.debug('restoreVersion');
    alert('Functionality not implemented yet');
  }
  function selectVersion(event) {
    const {
      target: { name },
    } = event;
    const increment = name === 'previous' ? 1 : -1;
    const currentGene = cloneDeep(gene);
    const version = reversions + increment;
    if (version >= 0 && version <= editHistory.length) {
      const previousGene = editHistory
        .slice(0, version)
        .reduce((intermediateGene, intermediateDiff) => {
          apply(gene, JSON.parse(intermediateDiff.revert));
          return intermediateGene;
        }, currentGene);
      setAttributes(previousGene.attributes);
      setReversions(version);
    }
  }

  // const attributes = this.state.newAttributes ? this.state.newAttributes : this.state.attributes;
  return (
    <div id="info">
      <Controls
        showHistory={showHistory}
        toggleHistory={toggleHistory}
        totalVersionNumber={editHistory.length}
        currentVersionNumber={editHistory.length - reversions}
        isEditing={isEditing}
        startEdit={startEdit}
        saveEdit={saveEdit}
        cancelEdit={cancelEdit}
      />
      <h3>General information</h3>
      {showHistory && (
        <VersionHistory
          currentVersionNumber={editHistory.length - reversions}
          totalVersionNumber={editHistory.length}
          selectVersion={selectVersion}
          restoreVersion={restoreVersion}
          editBy={currentVersion.user}
          editAt={currentVersion.date.toDateString()}
        />
      )}
      <div className="table-responive">
        <table className="table table-hover">
          <tbody>
            <tr>
              <td>Gene ID</td>
              <td>{gene.ID}</td>
            </tr>
            <tr>
              <td>Genome</td>
              <td>
                {genome.name}
                {' '}
                <small>
                  {`(${genome.organism})`}
                </small>
              </td>
            </tr>
            <tr>
              <td>Genome coordinates</td>
              <td>
                {`${seqid} ${start}..${end} ${strand}`}
              </td>
            </tr>
            <tr>
              <td>Source</td>
              <td>{source}</td>
            </tr>
            {orthogroupId && (
              <tr>
                <td>Orthogroup</td>
                <td>{orthogroupId}</td>
              </tr>
            )}
            {attributes
              && Object.keys(attributes).map((key) => {
                const value = attributes[key];
                return (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>
                      {isEditing ? (
                        <AttributeInput
                          name={key}
                          value={value}
                          onChange={changeAttributeValue}
                          deleteAttribute={deleteAttribute}
                        />
                      ) : (
                        <AttributeValue attributeValue={value} />
                      )}
                    </td>
                  </tr>
                );
              })}
            {isEditing && addingNewAttribute && (
              <tr>
                <td>
                  <div className="input-group input-group-sm">
                    <div className="input-group-prepend">
                      <span className="input-group-text">Key</span>
                    </div>
                    <input
                      list="#attribute-keys"
                      type="text"
                      className="form-control"
                      onChange={({ target }) => {
                        setNewAttributeKey(target.value);
                      }}
                    />
                    <datalist id="attribute-keys">
                      {attributeNames.map((attributeName) => (
                        <option
                          value={attributeName}
                          key={attributeName}
                        />
                      ))}
                    </datalist>
                  </div>
                </td>
                <td>
                  <div className="input-group input-group-sm">
                    <div className="input-group-prepend">
                      <span className="input-group-text">Value</span>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      onChange={({ target }) => {
                        setNewAttributeValue(target.value);
                      }}
                    />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {isEditing && !addingNewAttribute && (
          <div className="text-center">
            <button
              type="button"
              className="btn btn-outline-success btn-sm px-2 py-0"
              onClick={() => { setAddingNewAttribute(true); }}
            >
              <span className="icon-plus" />
              {' '}
              Add new attribute
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default withTracker(geneInfoDataTracker)(GeneInfo);

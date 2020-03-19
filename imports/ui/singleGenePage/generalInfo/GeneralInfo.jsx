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
    <div className="is-pulled-right">
      {showHistory && (
        <button
          type="button"
          onClick={toggleHistory}
          className="button is-small viewingHistory"
        >
          <span className="icon-history" aria-hidden="true" />
          {' Hide history'}
        </button>
      )}
      {totalVersionNumber > 0 && !isEditing && !showHistory && (
        <button
          type="button"
          onClick={toggleHistory}
          className="button is-small viewingHistory"
        >
          <span className="icon-history" aria-hidden="true" />
          {' Show history '}
          <span className="icon has-background-info has-text-white total-versions">{totalVersionNumber + 1}</span>
        </button>
      )}
      {canEdit && !isEditing && !showHistory && (
        <button
          type="button"
          onClick={startEdit}
          className="button is-small edit"
        >
          <span className="icon-pencil" aria-hidden="true" />
          {' Edit'}
        </button>
      )}
      {canEdit && isEditing && !showHistory && (
        <div className="buttons has-addons">
          <button
            type="button"
            onClick={saveEdit}
            className="button is-small save"
          >
            <span className="icon-floppy" aria-hidden="true" />
            {' Save'}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="button is-small cancel"
          >
            <span className="icon-cancel" aria-hidden="true" />
            {' Cancel'}
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
      <article className="message is-info" role="alert">
        <div className="message-body">
          {Roles.userIsInRole(Meteor.userId(), 'admin') && (
          <button
            type="button"
            className="button is-small is-warning is-pulled-right"
            onClick={restoreVersion}
          >
            Revert to this version
          </button>
          )}
          <span className="icon-exclamation" aria-hidden="true" />
          {'You are watching '}
          <div className="tags has-addons is-inline">
            <span className="tag is-dark">version</span>
            <span className="tag is-info">
              {`${currentVersionNumber + 1} / ${totalVersionNumber + 1}`}
            </span>
          </div>
          {' of this gene. Edit by '}
          <div className="tags has-addons is-inline">
            <span className="tag is-dark">User</span>
            <span className="tag is-info">{userName}</span>
          </div>
          {' at '}
          <span className="tag is-info">{editAt}</span>
        </div>
      </article>
      <div className="pager">
        <button
          type="button"
          className="button is-small"
          name="previous"
          onClick={selectVersion}
          disabled={!hasPreviousVersion}
        >
          <span
            className={`${hasPreviousVersion ? 'icon-left' : 'icon-block'}`}
            aria-hidden="true"
          />
          {` ${previousText}`}
        </button>
        <button
          type="button"
          className="button is-small is-pulled-right"
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
    <>
      <textarea
        className="textarea"
        rows="2"
        name={name}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        name={name}
        className="button is-danger is-light is-outlined is-small"
        onClick={deleteAttribute.bind(this, name)}
      >
        <span className="icon">
          <span className="icon-trash" />
        </span>
      </button>
    </>
  );
}

function geneInfoDataTracker({ gene, ...props }) {
  Meteor.subscribe('editHistory');
  Meteor.subscribe('attributes');

  const editHistory = EditHistory.find(
    { ID: gene.ID },
    { sort: { date: -1 } },
  ).fetch();

  const attributeNames = attributeCollection
    .find(
      { reserved: false },
      { field: 'name' },
    )
    .map((attribute) => attribute.name);

  return {
    gene,
    editHistory,
    attributeNames,
  };
}

function GeneInfo({
  gene, genome, attributeNames, editHistory,
}) {
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
    setAttributes(cloneDeep(gene.attributes));
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
      <h3 className="subtitle is-4">General information</h3>
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
        <table className="table is-hoverable is-fullwidth is-narrow">
          <tbody>
            <tr>
              <td>Gene ID</td>
              <td>{gene.ID}</td>
            </tr>
            <tr>
              <td>Genome</td>
              <td>
                {`${genome.name} `}
                <small>
                  { genome.organism }
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
              <tr className="new-attribute">
                <td colSpan="2">
                  <article className="message is-info">
                    <div className="message-body">
                      <h5 className="subtitle is-5">
                        New attribute
                      </h5>
                      <div className="field columns">
                        <div className="field column">
                          <label className="label is-small">
                            Key
                          </label>
                          <div className="control">
                            <input
                              list="attribute-keys"
                              type="text"
                              className="input is-small"
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
                        </div>
                        <div className="field column">
                          <label className="label is-small">
                            Value
                          </label>
                          <div className="control">
                            <input
                              type="text"
                              className="input is-small"
                              onChange={({ target }) => {
                                setNewAttributeValue(target.value);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                  {/* <div className="field has-addons">
                    <p className="control">
                      <button type="button" className="button is-static is-small">
                        Key
                      </button>
                    </p>
                    <p className="control is-expanded">
                      <input
                        list="attribute-keys"
                        type="text"
                        className="input is-small"
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
                    </p>
                  </div>
                  </td>
                <td>
                  <div className="field has-addons">
                    <p className="control">
                      <button type="button" className="button is-static is-small">
                        Value
                      </button>
                    </p>
                    <p className="control is-expanded">
                      <input
                        type="text"
                        className="input is-small"
                        onChange={({ target }) => {
                          setNewAttributeValue(target.value);
                        }}
                      />
                    </p>
                  </div>
                  */}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {isEditing && !addingNewAttribute && (
          <div className="has-text-centered">
            <button
              type="button"
              className="button is-small is-success is-light"
              onClick={() => { setAddingNewAttribute(true); }}
            >
              <span className="icon-plus" />
              {' Add new attribute'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default withTracker(geneInfoDataTracker)(GeneInfo);

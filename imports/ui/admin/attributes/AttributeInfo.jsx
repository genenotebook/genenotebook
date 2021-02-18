/* eslint-disable react/prop-types */
import React, { useState } from 'react';

import { updateAttributeInfo }
  from '/imports/api/genes/updateAttributeInfo.js';
import logger from '/imports/api/util/logger.js';

function EditAttributeInfo({
  _id: attributeId,
  name,
  query,
  toggleEdit,
  defaultShow,
  defaultSearch,
}) {
  const [defaultShowState, setDefaultShow] = useState(defaultShow);
  const [defaultSearchState, setDefaultSearch] = useState(defaultSearch);
  function saveChanges() {
    updateAttributeInfo.call(
      {
        attributeId,
        defaultShow: defaultShowState,
        defaultSearch: defaultSearchState,
      },
      (err) => {
        if (err) {
          logger.warn(err);
          alert(err);
        }
      },
    );
    toggleEdit();
  }
  const hasChanges = defaultShow !== defaultShowState
    || defaultSearch !== defaultSearchState;
  return (
    <tr>
      <td>{name}</td>
      <td>
        <code>{query}</code>
      </td>
      <td>
        <input
          type="checkbox"
          checked={defaultShowState}
          id="defaultShow"
          onChange={() => {
            setDefaultShow(!defaultShowState);
          }}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={defaultSearchState}
          id="defaultSearch"
          onChange={() => {
            setDefaultSearch(!defaultSearchState);
          }}
        />
      </td>
      <td>
        <div className="buttons has-addons">
          <button
            type="button"
            className={`button is-small ${hasChanges ? 'is-success is-light is-outlined' : ''}`}
            onClick={saveChanges}
            disabled={!hasChanges}
          >
            <span className="icon-check" />
            Save
          </button>
          <button
            type="button"
            className="button is-small"
            onClick={toggleEdit}
          >
            <span className="icon-remove" />
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

function AttributeInfoLine({
  name,
  query,
  defaultShow,
  defaultSearch,
  toggleEdit,
}) {
  return (
    <tr>
      <td>{name}</td>
      <td>
        <code>{query}</code>
      </td>
      <td>
        <input type="checkbox" checked={defaultShow} disabled />
      </td>
      <td>
        <input type="checkbox" checked={defaultSearch} disabled />
      </td>
      <td>
        <button
          type="button"
          className="button is-small is-fullwidth"
          onClick={toggleEdit}
        >
          <span className="icon-pencil" />
          Edit
        </button>
      </td>
    </tr>
  );
}

export default function AttributeInfo(props) {
  const [isEditing, setEditing] = useState(false);
  return isEditing ? (
    <EditAttributeInfo
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      toggleEdit={() => {
        setEditing(!isEditing);
      }}
    />
  ) : (
    <AttributeInfoLine
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      toggleEdit={() => {
        setEditing(!isEditing);
      }}
    />
  );
}

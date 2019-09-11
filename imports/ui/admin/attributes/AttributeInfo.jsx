/* eslint-disable react/no-multi-comp */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';

import { updateAttributeInfo } from '/imports/api/genes/updateAttributeInfo.js';
import logger from '/imports/api/util/logger.js';
/*
class EditAttributeInfo extends React.PureComponent {
  constructor(props) {
    super(props);
    const { defaultShow, defaultSearch } = props;
    this.state = {
      defaultSearch,
      defaultShow,
    };
  }

  update = (event) => {
    const field = event.target.id;
    this.setState({
      [field]: !this.state[field]
    });
  };

  saveChanges = () => {
    const { _id: attributeId, toggleEdit } = this.props;
    const { defaultShow, defaultSearch } = this.state;
    updateAttributeInfo.call(
      { attributeId, defaultShow, defaultSearch },
      (err) => {
        if (err) {
          logger.warn(err);
          alert(err);
        }
      },
    );
    toggleEdit();
  };

  render() {
    const { name, query, toggleEdit } = this.props;
    const { defaultShow, defaultSearch } = this.state;
    logger.debug(defaultShow, defaultSearch);
    const hasChanges = !(
      // eslint-disable-next-line react/destructuring-assignment
      defaultShow === this.props.defaultShow
      // eslint-disable-next-line react/destructuring-assignment
      && defaultSearch === this.props.defaultSearch
    );
    return (
      <tr>
        <td>{name}</td>
        <td>
          <code>
            {query}
          </code>
        </td>
        <td>
          <input
            type="checkbox"
            checked={defaultShow}
            id="defaultShow"
            onChange={this.update}
          />
        </td>
        <td>
          <input
            type="checkbox"
            checked={defaultSearch}
            id="defaultSearch"
            onChange={this.update}
          />
        </td>
        <td>
          <div className="btn-group btn-group-justified">
            <button
              type="button"
              className="btn btn-outline-success btn-sm px-2 py-0"
              onClick={this.saveChanges}
              disabled={!hasChanges}
            >
              <span className="icon-check" />
              Save
            </button>
            <button
              type="button"
              className="btn btn-outline-dark btn-sm px-2 py-0"
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
}
*/

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
        <div className="btn-group btn-group-justified">
          <button
            type="button"
            className="btn btn-outline-success btn-sm px-2 py-0"
            onClick={saveChanges}
            disabled={
              defaultShow === defaultShowState
              && defaultSearch === defaultSearchState
            }
          >
            <span className="icon-check" />
            Save
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm px-2 py-0"
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
          className="btn btn-sm btn-outline-dark py-0 px-2"
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
      {...props}
      toggleEdit={() => {
        setEditing(!isEditing);
      }}
    />
  ) : (
    <AttributeInfoLine
      {...props}
      toggleEdit={() => {
        setEditing(!isEditing);
      }}
    />
  );
}

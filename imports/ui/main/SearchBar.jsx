/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState, useEffect, useRef } from 'react';
// import PropTypes from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { cloneDeep } from 'lodash';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';

// import { Dropdown, DropdownButton, DropdownMenu } from '/imports/ui/util/Dropdown.jsx';
import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';


const attributeTracker = ({ location }) => {
  const {
    search, state: _state = {},
  } = location;
  const state = _state === null ? {} : _state;
  const { highLightSearch = false, redirected = false } = state;

  const query = new URLSearchParams(search);
  const attributeString = query.get('attributes') || '';
  const searchString = query.get('search') || '';

  const attributeSub = Meteor.subscribe('attributes');
  const loading = !attributeSub.ready();
  const attributes = attributeCollection.find({}).fetch();

  const selAttr = attributeString.split(',')
    .filter((attr) => attr !== '');

  const selectedAttributes = selAttr.length
    ? selAttr
    : attributes.filter((attribute) => attribute.defaultSearch)
      .map((attribute) => attribute.name);

  return {
    loading,
    attributes,
    selectedAttributes,
    searchString,
    highLightSearch,
    redirected,
  };
};

function SearchBar({
  selectedAttributes: initialSelectedAttributes,
  searchString: initialSearchString,
  attributes,
  highLightSearch,
  redirected,
}) {
  const [redirect, setRedirect] = useState(false);
  const [searchString, setSearchString] = useState(initialSearchString);
  const [selectedAttributes, setSelectedAttributes] = useState(
    new Set(initialSelectedAttributes),
  );

  const inputRef = useRef();
  useEffect(() => {
    if (highLightSearch) {
      inputRef.current.focus();
    }
  }, [highLightSearch]);

  useEffect(() => {
    if (redirected) {
      setRedirect(false);
    }
  }, [redirected, searchString, initialSearchString]);

  function toggleAttributeSelect(event) {
    const attributeName = event.target.id;
    const newSelAttr = cloneDeep(selectedAttributes);
    if (newSelAttr.has(attributeName)) {
      newSelAttr.delete(attributeName);
    } else {
      newSelAttr.add(attributeName);
    }
    setSelectedAttributes(newSelAttr);
  }

  function clearSearch() {
    setSearchString('');
    setRedirect(true);
  }

  function submit(event) {
    event.preventDefault();
    setRedirect(true);
  }

  if (redirect) {
    const query = new URLSearchParams();
    query.set('attributes', [...selectedAttributes]);
    query.set('search', searchString.trim());
    const queryString = `?${query.toString()}`;

    return (
      <Redirect
        push
        to={{
          pathname: '/genes',
          search: searchString.length ? queryString : '',
          state: {
            redirected: true,
          },
        }}
      />
    );
  }

  return (
    <form
      className="navbar-item is-pulled-right"
      role="search"
      onSubmit={submit}
    >
      <div className="field has-addons">
        <div className="control has-dropdown">
          <div className="dropdown is-hoverable">
            <div className="dropdown-trigger">
              <button type="button" className="button is-small has-dropdown navbar-link" aria-haspopup="true" aria-controls="dropdown-menu-search" />
            </div>
            <div className="dropdown-menu" id="dropdown-menu-search" role="menu">
              <div className="dropdown-content">
                <h6 className="is-h6 dropdown-item">Select attributes to search</h6>
                {attributes.map(({ name }) => {
                  const checked = selectedAttributes.has(name);
                  return (
                    <div className="dropdown-item" id={name} key={name}>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          defaultChecked={checked}
                          onChange={toggleAttributeSelect}
                          className="dropdown-checkbox is-small"
                        />
                        { name }
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="control">
          <input
            type="text"
            className="input is-small"
            placeholder="Search genes"
            value={searchString}
            onChange={(event) => setSearchString(event.target.value)}
            onSubmit={submit}
            ref={inputRef}
          />
        </div>
        <div className="control">
          <button type="submit" className="button is-small">
            <span className="icon-search" />
          </button>
        </div>
      </div>
      {/*
      <div className="input-group input-group-sm">
        <div className="input-group-prepend">
          <Dropdown>
            <DropdownButton className="btn btn-sm btn-outline-dark dropdown-toggle search-dropdown border" />
            <DropdownMenu>
              <h6 className="dropdown-header">Select attributes to search</h6>
              {attributes.map(({ name }) => {
                const checked = selectedAttributes.has(name);
                return (
                  <div
                    key={`${name} ${checked}`}
                    className="form-check px-3 pb-1"
                    style={{ justifyContent: 'flex-start', whiteSpace: 'pre' }}
                  >
                    <input
                      type="checkbox"
                      className="input is-small"
                      id={name}
                      checked={checked}
                      onChange={toggleAttributeSelect}
                    />
                    <label className="form-check-label">{name}</label>
                  </div>
                );
              })}
            </DropdownMenu>
          </Dropdown>
        </div>
        <input
          type="text"
          className="form-control border-right-0 border search-bar"
          placeholder="Search genes"
          value={searchString}
          onChange={(event) => setSearchString(event.target.value)}
          onSubmit={submit}
          ref={inputRef}
        />
        {searchString && (
          <span className="input-group-addon bg-white border-left-0 border pt-1 clear-search">
            <span
              role="button"
              tabIndex="0"
              className="icon-cancel"
              onClick={clearSearch}
            />
          </span>
        )}

        <div className="input-group-append btn-group">
          <button type="submit" className="btn btn-sm btn-outline-dark border">
            <span className="icon-search" />
          </button>
        </div>
      </div>
        */}
    </form>
  );
}

export default compose(
  withRouter,
  withTracker(attributeTracker),
  withEither(isLoading, Loading),
)(SearchBar);

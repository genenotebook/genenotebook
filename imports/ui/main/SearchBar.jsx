/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React, { useState, useEffect, useRef } from 'react';
import { Redirect, withRouter } from 'react-router-dom';
import { cloneDeep } from 'lodash';

import { attributeCollection } from '/imports/api/genes/attributeCollection.js';

import {
  branch, compose, isLoading, Loading,
} from '/imports/ui/util/uiUtil.jsx';

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
  };
};

function SearchBar({
  selectedAttributes: initialSelectedAttributes,
  searchString: initialSearchString,
  attributes,
  highLightSearch,
}) {
  const [redirect, setRedirect] = useState(false);
  const [searchString, setSearchString] = useState(initialSearchString);
  const [selectedAttributes, setSelectedAttributes] = useState(
    new Set(['Gene ID', ...initialSelectedAttributes]),
  );

  const inputRef = useRef();
  useEffect(() => {
    if (highLightSearch) {
      inputRef.current.focus();
    }
  }, [highLightSearch]);

  // Cleanup redirect after rendering Redirect element
  useEffect(() => {
    if (redirect) {
      setRedirect(false);
    }
  }, [redirect]);

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

  function invalidForm(){
    return !(selectedAttributes.size && searchString);
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
              <button type="button" className="button is-small">
                <span className="icon">
                  <span className="icon-down" />
                </span>
              </button>
            </div>
            <div className="dropdown-menu" id="dropdown-menu-search" role="menu">
              <div className="dropdown-content">
                <h6 className="is-h6 dropdown-item">Select attributes to search</h6>
                {attributes.map(({ name }) => {
                  const checked = selectedAttributes.has(name);
                  return (
                    <div className="dropdown-item" key={`${name} ${checked}`}>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          defaultChecked={checked}
                          onChange={toggleAttributeSelect}
                          className="dropdown-checkbox is-small"
                          id={name}
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
          <button type="submit" className="button is-small" disabled={invalidForm()}>
            <span className="icon-search" />
          </button>
        </div>
      </div>
    </form>
  );
}

export default compose(
  withRouter,
  withTracker(attributeTracker),
  branch(isLoading, Loading),
)(SearchBar);
